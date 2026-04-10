"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Clock, Shield, ArrowLeft, FileText, CheckCircle } from "lucide-react";

interface ShareItem {
  code: string;
  content: string;
  content_type: "text" | "file";
  file_name?: string;
  remaining_seconds: number;
}

export default function ViewShare() {
  const { code } = useParams();
  const router = useRouter();
  const [share, setShare] = useState<ShareItem | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const [presence, setPresence] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const resp = await fetch(`${apiUrl}/share/${code}`);
        const data = await resp.json();
        if (data.code) {
          setShare(data);
          setRemainingSecs(data.remaining_seconds);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchShare();

    // WebSocket for presence
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/ws/${code}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "presence") {
          setPresence(data.message);
          setTimeout(() => setPresence(""), 5000);
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    return () => ws.close();
  }, [code]);

  useEffect(() => {
    if (remainingSecs === null || remainingSecs <= -10) return;
    const timer = setInterval(() => {
      setRemainingSecs(prev => (prev === null || prev <= -10) ? prev : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSecs]);

  // Derive timeLeft during render instead of using an effect
  const getTimeLeftString = () => {
    if (remainingSecs === null) return "Calculating...";
    if (remainingSecs <= 0) return "EXPIRED";
    const minutes = Math.floor(remainingSecs / 60);
    const seconds = remainingSecs % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const timeLeft = getTimeLeftString();

  const copyToClipboard = () => {
    if (!share?.content) return;
    navigator.clipboard.writeText(share.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!share && timeLeft !== "EXPIRED") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Clock size={48} color="var(--accent)" />
        </motion.div>
      </div>
    );
  }

  if (timeLeft === "EXPIRED") {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        style={{ textAlign: 'center', marginTop: '10rem' }}
      >
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem' }}>This portal has <span style={{ color: 'var(--primary)' }}>closed.</span></h1>
        <button className="btn-primary" onClick={() => router.push('/')}>
          Return to Base
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '2rem' }}
    >
      <div style={{ textAlign: 'center' }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} style={{ letterSpacing: '4px', marginBottom: '0.5rem', fontSize: '0.8rem' }}>SECURE ACCESS KEY</motion.p>
        <h1 style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--accent)', textShadow: '0 0 40px rgba(0,255,255,0.4)', letterSpacing: '8px' }}>{code}</h1>
        <div className="countdown" style={{ marginTop: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Clock size={20} /> Expires in: {timeLeft}
        </div>
      </div>

      <AnimatePresence>
        {presence && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: 'rgba(0, 255, 255, 0.1)', color: 'var(--accent)', padding: '0.8rem 1.5rem', borderRadius: '50px', fontSize: '0.9rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,255,255,0.2)' }}
          >
            {presence}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="glass-card" 
        style={{ width: '100%', maxWidth: '850px' }}
        whileHover={{ translateY: -5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <FileText size={20} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{share.content_type === 'text' ? 'Encrypted Text' : share.file_name}</h3>
          </div>
          {share.content_type === 'text' && (
            <button 
              className="btn-primary" 
              onClick={copyToClipboard} 
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? 'Captured' : 'Copy'}
            </button>
          )}
        </div>

        {share.content_type === 'text' ? (
          <div style={{ position: 'relative' }}>
            <pre style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '2rem', 
              borderRadius: '16px', 
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              lineHeight: '1.8',
              color: '#e0e0e0',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {share.content}
            </pre>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                 <Download size={64} style={{ opacity: 0.2, color: 'var(--accent)' }} />
              </motion.div>
              <p style={{ marginTop: '1rem', opacity: 0.6 }}>Secure file ready for decryption</p>
            </div>
            <a 
              href={share.content?.replace("/upload/", "/upload/fl_attachment/")} 
              download={share.file_name}
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary" 
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem 2.5rem', fontSize: '1.1rem' }}
            >
              <Download size={20} />
              Retrieve File
            </a>
          </div>
        )}
      </motion.div>

      <button 
        className="btn-primary" 
        onClick={() => router.push('/')} 
        style={{ 
          background: 'transparent', 
          border: '1px solid var(--glass-border)', 
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: 0.7
        }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div style={{ display: 'flex', gap: '2rem', opacity: 0.3, fontSize: '0.8rem', marginTop: '1rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} /> Encrypted at Rest</div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> Auto-Deleting Soon</div>
      </div>
    </motion.div>
  );
}
