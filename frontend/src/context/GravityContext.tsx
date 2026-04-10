"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface GravityState {
  corePosition: [number, number, number];
  coreScale: number;
  coreOpacity: number;
  setCorePosition: (pos: [number, number, number]) => void;
  setCoreScale: (scale: number) => void;
  setCoreOpacity: (opacity: number) => void;
}

const GravityContext = createContext<GravityState | undefined>(undefined);

export function GravityProvider({ children }: { children: ReactNode }) {
  const [corePosition, setCorePosition] = useState<[number, number, number]>([0, 0, 0]);
  const [coreScale, setCoreScale] = useState(1);
  const [coreOpacity, setCoreOpacity] = useState(1);

  return (
    <GravityContext.Provider value={{ 
      corePosition, 
      coreScale, 
      coreOpacity, 
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
