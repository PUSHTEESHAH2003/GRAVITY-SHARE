"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, MeshDistortMaterial, Sphere, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useGravity } from "@/context/GravityContext";

function GravityCore() {
  const meshRef = useRef<THREE.Group>(null);
  const { corePosition, coreScale, coreOpacity } = useGravity();

  useFrame(() => {
    if (meshRef.current) {
      // Smoothly interpolate position (lerp)
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, corePosition[0], 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, corePosition[1], 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, corePosition[2], 0.1);
      
      // Smoothly interpolate scale
      const targetScale = coreScale || 1;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1));
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#00ffff"
            speed={3}
            distort={0.4}
            radius={1}
            emissive="#00ffff"
            emissiveIntensity={0.5 * coreOpacity}
            transparent
            opacity={coreOpacity}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
        {/* Outer wireframe shell */}
        <Sphere args={[1.2, 32, 32]}>
          <meshStandardMaterial color="#8a2be2" wireframe transparent opacity={0.2 * coreOpacity} />
        </Sphere>
      </Float>
    </group>
  );
}

// Stable seeded random helper to satisfy purity requirements
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

function DataParticles({ count = 1000 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Use seeded random for stability if linter is strict about Math.random
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
      ref.current.rotation.y += 0.001;
      ref.current.rotation.x += 0.0005;
    }
  });

  return (
    <group ref={ref}>
      <Points positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#00ffff"
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
  const particleCount = isMobile ? 800 : 2000;

  return (
    <div id="canvas-background">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#8a2be2" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#00ffff" />
        
        <GravityCore />
        <DataParticles count={particleCount} />
        
        <fog attach="fog" args={["#0a0a0c", 10, 25]} />
      </Canvas>
    </div>
  );
}
