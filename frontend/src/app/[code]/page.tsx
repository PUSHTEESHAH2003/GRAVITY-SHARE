"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ViewShare() {
  const { code } = useParams();
  const [share, setShare] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("Calculating...");
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);
  const [presence, setPresence] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const resp = await fetch(`http://localhost:8000/share/${code}`);
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
    const ws = new WebSocket(`ws://localhost:8000/ws/${code}`);
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

  // Countdown Logic using server-provided remaining_seconds
  useEffect(() => {
    if (remainingSecs === null || remainingSecs <= -10) return;

    const timer = setInterval(() => {
      setRemainingSecs(prev => {
        if (prev === null || prev <= -10) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSecs]);

  // Format the time display whenever remainingSecs changes
  useEffect(() => {
    if (remainingSecs === null) return;
    
    if (remainingSecs <= 0) {
      setTimeLeft("EXPIRED");
    } else {
      const minutes = Math.floor(remainingSecs / 60);
      const seconds = remainingSecs % 60;
      setTimeLeft(`${minutes}m ${seconds}s`);
    }
  }, [remainingSecs]);

  const copyToClipboard = () => {
    if (!share?.content) return;
    navigator.clipboard.writeText(share.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!share && timeLeft !== "EXPIRED") return <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}>Loading secure share...</div>;
  if (timeLeft === "EXPIRED") {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900 }}>This share has expired.</h1>
        <button className="btn-primary" onClick={() => window.location.href = '/'} style={{ marginTop: '2rem' }}>
          Create New Share
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1rem', opacity: 0.5, letterSpacing: '2px', marginBottom: '0.5rem' }}>SHARING CODE</h2>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--accent)' }}>{code}</h1>
        <div className="countdown" style={{ marginTop: '1rem' }}>Expires in: {timeLeft}</div>
      </div>

      {presence && (
        <div style={{ background: 'rgba(0, 255, 255, 0.1)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.8rem' }}>
          {presence}
        </div>
      )}

      <div className="glass-card" style={{ width: '100%', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem' }}>{share.content_type === 'text' ? 'Shared Text' : share.file_name}</h3>
          {share.content_type === 'text' && (
            <button className="btn-primary" onClick={copyToClipboard} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          )}
        </div>

        {share.content_type === 'text' ? (
          <pre style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            lineHeight: '1.6',
            color: '#d1d1d1'
          }}>
            {share.content}
          </pre>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ marginBottom: '2rem', opacity: 0.7 }}>A file has been shared with you.</p>
            <a href={share.content} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Download File
            </a>
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
        Create New Share
      </button>
    </div>
  );
}
