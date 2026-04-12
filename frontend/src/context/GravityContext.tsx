"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GravityState {
  corePosition: [number, number, number];
  coreScale: number;
  coreOpacity: number;
  stabilizerFrequency: number;
  coreStatus: string;
  securityLevel: string;
  setCorePosition: (pos: [number, number, number]) => void;
  setCoreScale: (scale: number) => void;
  setCoreOpacity: (opacity: number) => void;
}

const GravityContext = createContext<GravityState | undefined>(undefined);

export function GravityProvider({ children }: { children: ReactNode }) {
  const [corePosition, setCorePosition] = useState<[number, number, number]>([0, 0, 0]);
  const [coreScale, setCoreScale] = useState(1);
  const [coreOpacity, setCoreOpacity] = useState(1);
  const [stabilizerFrequency, setStabilizerFrequency] = useState(440.00);
  const [coreStatus, setCoreStatus] = useState("STABLE");
  const [securityLevel, setSecurityLevel] = useState("MAXIMUM");

  // Simulate Stabilizer Heartbeat
  useEffect(() => {
     const interval = setInterval(() => {
        setStabilizerFrequency(prev => {
            const variance = (Math.random() - 0.5) * 0.05;
            return parseFloat((prev + variance).toFixed(2));
        });
     }, 100);
     return () => clearInterval(interval);
  }, []);

  return (
    <GravityContext.Provider value={{ 
      corePosition, 
      coreScale, 
      coreOpacity,
      stabilizerFrequency,
      coreStatus,
      securityLevel,
      setCorePosition, 
      setCoreScale, 
      setCoreOpacity 
    }}>
      {children}
    </GravityContext.Provider>
  );
}

export function useGravity() {
  const context = useContext(GravityContext);
  if (context === undefined) {
    throw new Error("useGravity must be used within a GravityProvider");
  }
  return context;
}
