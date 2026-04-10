"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, MeshDistortMaterial, Sphere, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useGravity } from "@/context/GravityContext";

function GravityCore({ atmosphere }: { atmosphere: any }) {
  const meshRef = useRef<THREE.Group>(null);
  const { corePosition, coreScale, coreOpacity } = useGravity();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, corePosition[0], 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, corePosition[1], 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, corePosition[2], 0.1);
      
      const targetScale = coreScale || 1;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1));
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={atmosphere.floatSpeed} rotationIntensity={atmosphere.rotationIntensity} floatIntensity={atmosphere.floatIntensity}>
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={atmosphere.coreColor}
            speed={atmosphere.distortSpeed}
            distort={atmosphere.distortAmount}
            radius={1}
            emissive={atmosphere.coreColor}
            emissiveIntensity={atmosphere.emissiveIntensity * coreOpacity}
            transparent
            opacity={coreOpacity}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
        <Sphere args={[1.2, 32, 32]}>
          <meshStandardMaterial color={atmosphere.shellColor} wireframe transparent opacity={0.2 * coreOpacity} />
        </Sphere>
      </Float>
    </group>
  );
}

// Stable seeded random helper
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

function DataParticles({ count = 1000, atmosphere }: { count?: number, atmosphere: any }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const s1 = seededRandom(i * 1.5);
      const s2 = seededRandom(i * 2.5);
      const s3 = seededRandom(i * 3.5);
      
      const theta = (s1 - 0.5) * 2 * Math.PI;
      const phi = (s2 - 0.5) * 2 * Math.PI;
      const distance = 5 + s3 * 10;
      
      p[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
      p[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
      p[i * 3 + 2] = distance * Math.cos(theta);
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += atmosphere.particleRotationY;
      ref.current.rotation.x += atmosphere.particleRotationX;
    }
  });

  return (
    <group ref={ref}>
      <Points positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={atmosphere.particleColor}
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function GravityScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;

  // Atmosphere settings (Mobile Only Logic)
  const atmosphere = useMemo(() => {
    const isDayMobile = isMobile && !isNight;
    const isNightMobile = isMobile && isNight;

    return {
      coreColor: isNightMobile ? "#4b0082" : "#00ffff",
      shellColor: isNightMobile ? "#1a0033" : "#8a2be2",
      particleColor: isNightMobile ? "#8a2be2" : "#00ffff",
      emissiveIntensity: isNightMobile ? 0.2 : 0.5,
      distortSpeed: isNightMobile ? 1 : (isDayMobile ? 4 : 3),
      distortAmount: isNightMobile ? 0.2 : 0.4,
      floatSpeed: isNightMobile ? 1 : 2,
      rotationIntensity: isNightMobile ? 1 : 2,
      floatIntensity: isNightMobile ? 1 : 2,
      particleRotationY: isNightMobile ? 0.0003 : 0.001,
      particleRotationX: isNightMobile ? 0.0001 : 0.0005,
    };
  }, [isMobile, isNight]);

  const particleCount = isMobile ? 800 : 2000;

  return (
    <div id="canvas-background">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={isNight && isMobile ? 0.1 : 0.2} />
        <pointLight position={[10, 10, 10]} intensity={isNight && isMobile ? 0.8 : 1.5} color={atmosphere.shellColor} />
        <pointLight position={[-10, -10, -10]} intensity={isNight && isMobile ? 0.5 : 1} color={atmosphere.coreColor} />
        
        <GravityCore atmosphere={atmosphere} />
        <DataParticles count={particleCount} atmosphere={atmosphere} />
        
        <fog attach="fog" args={[isNight && isMobile ? "#050507" : "#0a0a0c", 10, 25]} />
      </Canvas>
    </div>
  );
}
