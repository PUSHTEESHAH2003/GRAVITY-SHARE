"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Search, Clock, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  const [type, setType] = useState<"text" | "file" | "retrieve">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [codeToRetrieve, setCodeToRetrieve] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const handleShare = async () => {
    if (type === "retrieve") {
      if (codeToRetrieve.length < 6) {
        alert("Please enter a valid 6-character code.");
        return;
      }
      router.push(`/${codeToRetrieve.toUpperCase()}`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("content_type", type);
    
    if (type === "text") {
      formData.append("text_content", text);
    } else if (file) {
      formData.append("file", file);
    } else {
      alert("Please provide content to share");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiUrl}/share`, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (data.code) {
        router.push(`/${data.code}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to share. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '4rem' }}
    >
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', fontWeight: 900, lineHeight: 1.1 }}>
            Securely Share. <br />
            <span style={{ color: 'var(--accent)', textShadow: '0 0 30px rgba(0,255,255,0.3)' }}>Then it Vanishes.</span>
          </h1>
        </motion.div>
        <p style={{ opacity: 0.7, fontSize: '1.2rem', marginBottom: '2rem' }}>
          An ephemeral data sharing platform that defies gravity and persists for only 60 minutes.
        </p>
      </div>

      <motion.div 
        className="glass-card" 
        style={{ width: '100%', maxWidth: '750px' }}
        whileHover={{ scale: 1.01 }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '16px' }}>
          {[
            { id: 'text', label: 'Plain Text', icon: FileText },
            { id: 'file', label: 'Upload File', icon: Upload },
            { id: 'retrieve', label: 'Retrieve', icon: Search }
          ].map((btn) => (
            <button 
              key={btn.id}
              className={`btn-primary ${type !== btn.id ? 'secondary' : ''}`} 
              onClick={() => setType(btn.id as "text" | "file" | "retrieve")}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: type === btn.id ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                boxShadow: type === btn.id ? '0 4px 15px rgba(138, 43, 226, 0.4)' : 'none',
                color: type === btn.id ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <btn.icon size={18} />
              {btn.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {type === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <textarea 
                className="input-field" 
                placeholder="Paste sensitive data, code snippets, or notes..." 
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ resize: 'none', background: 'rgba(0,0,0,0.2)', fontSize: '1.1rem' }}
              />
            </motion.div>
          )}
          
          {type === 'file' && (
            <motion.div
              key="file"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div 
                style={{ 
                  border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--glass-border)'}`, 
                  background: isDragging ? 'rgba(0, 255, 255, 0.05)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '20px', 
                  padding: '4rem 2rem', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => document.getElementById('file-input')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) setFile(droppedFile);
                }}
              >
                <input id="file-input" type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <motion.div
                  animate={isDragging ? { y: [0, -10, 0], scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={{ repeat: isDragging ? Infinity : 0, duration: 1 }}
                >
                   <Upload size={48} color={isDragging ? 'var(--accent)' : 'white'} style={{ opacity: 0.8, marginBottom: '1.5rem' }} />
                </motion.div>
                {file ? (
                  <p style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{file.name}</p>
                ) : (
                  <div>
                    <p style={{ opacity: 0.8, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                      {isDragging ? "Release to Defy Gravity" : "Drop files into orbit"}
                    </p>
                    <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>Supports documents, images and code</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {type === 'retrieve' && (
            <motion.div
              key="retrieve"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{ textAlign: 'center' }}
            >
              <p style={{ marginBottom: '2rem', opacity: 0.6, fontSize: '1.1rem' }}>Enter the unique 6-character portal code</p>
              <input 
                className="input-field" 
                placeholder="X7R2W9" 
                value={codeToRetrieve}
                onChange={(e) => setCodeToRetrieve(e.target.value.substring(0,6))}
                style={{ 
                  fontSize: '3rem', 
                  textAlign: 'center', 
                  letterSpacing: '12px', 
                  textTransform: 'uppercase',
                  fontWeight: 900,
                  background: 'rgba(0,0,0,0.2)',
                  color: 'var(--accent)'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          className="btn-primary" 
          style={{ 
            width: '100%', 
            marginTop: '2.5rem', 
            padding: '1.5rem', 
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem'
          }}
          onClick={handleShare}
          disabled={loading}
        >
          {loading ? (
            <Clock className="animate-spin" />
          ) : (
            <>
              {type === 'retrieve' ? "Open Portal" : "Secure Launch"}
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', opacity: 0.4, fontSize: '0.8rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} /> End-to-End Encrypted</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> 60 Minute Lifecycle</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
