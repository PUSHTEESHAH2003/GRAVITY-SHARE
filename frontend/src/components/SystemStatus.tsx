"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import { useGravity } from "@/context/GravityContext";

export default function SystemStatus() {
  const { stabilizerFrequency, coreStatus, securityLevel } = useGravity();

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        pointerEvents: 'none'
      }}
    >
      {/* Stabilizer Frequency - THE TIMER/HEARTBEAT */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '0.8rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          minWidth: '220px'
        }}
      >
        <Zap size={16} color="var(--accent)" />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>Stabilizer Frequency</p>
          <p style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700 }}>
            {stabilizerFrequency.toFixed(2)} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Hz</span>
          </p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}
        />
      </div>

      {/* Core Integrity */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '0.8rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid rgba(138, 43, 226, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}
      >
        <Activity size={16} color="var(--primary)" />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>Core Status</p>
          <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>{coreStatus}</p>
        </div>
      </div>

      {/* Security Protocol */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '0.8rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}
      >
        <ShieldCheck size={16} opacity={0.6} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>Encryption Level</p>
          <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>{securityLevel}</p>
        </div>
      </div>
    </motion.div>
  );
}
