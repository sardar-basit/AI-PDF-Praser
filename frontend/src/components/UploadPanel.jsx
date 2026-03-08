import React, { useState, useRef } from 'react'

export default function UploadPanel({ onUpload, isUploading }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file.')
      return
    }
    onUpload(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '40px',
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '42px',
          fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.01em', lineHeight: 1,
        }}>
          Doc<span style={{ color: 'var(--amber)' }}>Mind</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '14px',
          color: 'var(--muted)', marginTop: '8px',
          fontWeight: 300, letterSpacing: '0.04em',
        }}>
          AI-powered document intelligence
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        style={{
          width: '100%', maxWidth: '420px',
          padding: '52px 32px',
          border: `2px dashed ${dragging ? 'var(--amber)' : 'var(--border2)'}`,
          borderRadius: '16px',
          background: dragging
            ? 'linear-gradient(135deg, #fdf6e8, #faf3e0)'
            : 'linear-gradient(135deg, var(--cream2), var(--cream))',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.25s ease',
          boxShadow: dragging
            ? '0 8px 32px rgba(200,131,42,0.15), inset 0 0 0 1px rgba(200,131,42,0.2)'
            : '0 4px 24px var(--shadow)',
        }}
      >
        <input
          ref={inputRef} type="file" accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid var(--parchment)',
              borderTopColor: 'var(--amber)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--brown)', fontSize: '14px' }}>
              Parsing document…
            </div>
          </div>
        ) : (
          <>
            {/* PDF icon */}
            <div style={{
              width: '64px', height: '64px',
              margin: '0 auto 20px',
              background: 'var(--cream3)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px var(--shadow)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--amber)" strokeWidth="1.5"/>
                <path d="M14 2v6h6" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 13h6M9 17h4" stroke="var(--brown2)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '18px',
              color: 'var(--ink2)', marginBottom: '8px', fontWeight: 600,
            }}>
              {dragging ? 'Release to upload' : 'Drop your PDF here'}
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: '13px',
              color: 'var(--muted)', marginBottom: '20px',
            }}>
              or click to browse files
            </div>
            <div style={{
              display: 'inline-block',
              padding: '9px 22px',
              borderRadius: '8px',
              background: 'var(--amber)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px', fontWeight: 500,
              letterSpacing: '0.02em',
              boxShadow: '0 2px 12px rgba(200,131,42,0.3)',
            }}>
              Choose PDF
            </div>
            <div style={{
              marginTop: '16px',
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--muted2)',
            }}>
              Max 20 MB · PDF only
            </div>
          </>
        )}
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: '10px', marginTop: '36px',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {['📖 Smart extraction', '🔍 Semantic search', '🧠 Groq LLM', '⚡ Fast answers'].map(f => (
          <div key={f} style={{
            padding: '6px 14px', borderRadius: '20px',
            background: 'var(--cream3)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-sans)', fontSize: '12px',
            color: 'var(--brown)', fontWeight: 400,
          }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}
