"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Clock, Shield, ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { useGravity } from "@/context/GravityContext";

interface ShareItem {
  code: string;
  content: string;
  content_type: "text" | "file";
  file_name?: string;
  remaining_seconds: number;
  download_url?: string;
}

export default function ViewShare() {
  const { code } = useParams();
  const router = useRouter();
  const [share, setShare] = useState<ShareItem | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const [presence, setPresence] = useState("");
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Synchronizing with the Gravity Core...");
  const [isDownloading, setIsDownloading] = useState(false);
  const { setCorePosition, setCoreScale, setCoreOpacity } = useGravity();

  useEffect(() => {
    // Center the core behind the access key
    setCorePosition([0, 2, -4]); 
    setCoreScale(1.8);
    setCoreOpacity(0.6);

    return () => {
      setCorePosition([0, 0, 0]);
      setCoreScale(1);
      setCoreOpacity(1);
    };
  }, [setCorePosition, setCoreScale, setCoreOpacity]);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        // Timeout for cold start warning
        const timeout = setTimeout(() => {
          setLoadingMsg("Portal is deep in space... (Backend is waking up)");
        }, 5000);

        const resp = await fetch(`${apiUrl}/share/${code}`);
        clearTimeout(timeout);

        if (!resp.ok) {
          if (resp.status === 404) {
            setError("Portal has collapsed or never existed.");
          } else {
            setError("Communication failure with the Gravity Core.");
          }
          return;
        }

        const data = await resp.json();
        if (data.code) {
          setShare(data);
          setRemainingSecs(data.remaining_seconds);
          setRemainingSecs(data.remaining_seconds);
        }
      } catch (err) {
        console.error(err);
        setError("Quantum interference detected. Please try again.");
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

  const copyCodeToClipboard = () => {
    if (!code) return;
    const codeString = Array.isArray(code) ? code[0] : code;
    navigator.clipboard.writeText(codeString);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!share) return;
    setIsDownloading(true);
    setLoadingMsg("Decrypting file...");
    try {
      const url = share.download_url ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${share.download_url}` : share.content;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = share.file_name || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setError("Failed to download file. It might have been already destroyed.");
    } finally {
      setIsDownloading(false);
      setLoadingMsg("Synchronizing with the Gravity Core...");
    }
  };

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        style={{ textAlign: 'center', marginTop: '10rem', padding: '0 1rem' }}
      >
        <Shield size={64} color="var(--primary)" style={{ marginBottom: '2rem', opacity: 0.5 }} />
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, marginBottom: '1.5rem' }}>
          Portal <span style={{ color: 'var(--primary)' }}>Not Found.</span>
        </h1>
        <p style={{ opacity: 0.6, fontSize: '1.1rem', marginBottom: '2.5rem' }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push('/')}>
          Return to Base
        </button>
      </motion.div>
    );
  }

  if (!share && timeLeft !== "EXPIRED") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '2rem' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Clock size={48} color="var(--accent)" />
        </motion.div>
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ letterSpacing: '2px', fontSize: '0.9rem', opacity: 0.6 }}
        >
          {loadingMsg}
        </motion.p>
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
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '1rem', width: '100%' }}
    >
      <div style={{ textAlign: 'center' }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} style={{ letterSpacing: '4px', marginBottom: '0.5rem', fontSize: '0.7rem' }}>SECURE ACCESS KEY</motion.p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 15vw, 5rem)', fontWeight: 900, color: 'var(--accent)', textShadow: '0 0 40px rgba(0,255,255,0.4)', letterSpacing: '4px' }}>{code}</h1>
          <button 
            onClick={copyCodeToClipboard}
            className="btn-primary"
            title="Copy Access Key"
            style={{ 
              padding: '0.8rem', 
              borderRadius: '16px', 
              background: 'rgba(0, 255, 255, 0.1)', 
              border: '1px solid rgba(0, 255, 255, 0.2)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            {codeCopied ? <CheckCircle size={24} /> : <Copy size={24} />}
          </button>
        </div>
        <div 
          className="countdown" 
          style={{ 
            marginTop: '1.5rem', 
            fontSize: '1.4rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.8rem',
            background: 'rgba(0, 255, 255, 0.05)',
            padding: '1rem 2rem',
            borderRadius: '50px',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'
          }}
        >
          <Clock size={20} className="animate-pulse" /> 
          <span style={{ opacity: 0.6, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Portal De-links in:</span>
          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{timeLeft}</span>
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{share?.content_type === 'text' ? 'Encrypted Text' : share?.file_name}</h3>
          </div>
          {share?.content_type === 'text' && (
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

        {share?.content_type === 'text' ? (
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
              {share?.content}
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
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', padding: '1.2rem 2.5rem', fontSize: '1.1rem', cursor: isDownloading ? 'wait' : 'pointer', opacity: isDownloading ? 0.7 : 1 }}
            >
              {isDownloading ? <Clock className="animate-spin" size={20} /> : <Download size={20} />}
              {isDownloading ? "Decrypting..." : "Retrieve File"}
            </button>
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
