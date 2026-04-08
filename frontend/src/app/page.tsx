"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [type, setType] = useState<"text" | "file" | "retrieve">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [codeToRetrieve, setCodeToRetrieve] = useState("");
  const [loading, setLoading] = useState(false);
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
      const resp = await fetch(`http://localhost:8000/share`, {
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
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '4rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 900 }}>Drop it. Share it. <span style={{ color: 'var(--accent)' }}>Gone in 1h.</span></h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>The ultimate temporary clipboard for developers and humans alike.</p>
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '700px' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className={`btn-primary ${type !== 'text' ? 'secondary' : ''}`} 
            onClick={() => setType('text')}
            style={type !== 'text' ? { background: 'rgba(255,255,255,0.05)', color: '#fff' } : {}}
          >
            Share Text
          </button>
          <button 
            className={`btn-primary ${type !== 'file' ? 'secondary' : ''}`} 
            onClick={() => setType('file')}
            style={type !== 'file' ? { background: 'rgba(255,255,255,0.05)', color: '#fff' } : {}}
          >
            Share File
          </button>
          <button 
            className={`btn-primary ${type !== 'retrieve' ? 'secondary' : ''}`} 
            onClick={() => setType('retrieve')}
            style={type !== 'retrieve' ? { background: 'rgba(255,255,255,0.05)', color: '#fff' } : {}}
          >
            Retrieve
          </button>
        </div>

        {type === 'text' && (
          <textarea 
            className="input-field" 
            placeholder="Paste your code or text here..." 
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ resize: 'none' }}
          />
        )}
        
        {type === 'file' && (
          <div 
            style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: '12px', 
              padding: '3rem', 
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input 
              id="file-input" 
              type="file" 
              hidden 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <p style={{ color: 'var(--accent)' }}>{file.name}</p>
            ) : (
              <p style={{ opacity: 0.5 }}>Click or Drag & Drop File</p>
            )}
          </div>
        )}

        {type === 'retrieve' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem', opacity: 0.6 }}>Enter the 6-character sharing code</p>
            <input 
              className="input-field" 
              placeholder="e.g. A2B3C4" 
              value={codeToRetrieve}
              onChange={(e) => setCodeToRetrieve(e.target.value.substring(0,6))}
              style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '8px', textTransform: 'uppercase' }}
            />
          </div>
        )}

        <button 
          className="btn-primary" 
          style={{ width: '100%', marginTop: '2rem', padding: '1.2rem' }}
          onClick={handleShare}
          disabled={loading}
        >
          {loading ? "Processing..." : (type === 'retrieve' ? "View Share" : "Generate Sharing Code")}
        </button>
      </div>
    </div>
  );
}
