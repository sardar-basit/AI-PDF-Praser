import React, { useState } from 'react'

function StatBadge({ label, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 14px', borderRadius: '10px',
      background: 'var(--cream)', border: '1px solid var(--border)',
      minWidth: '80px',
    }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--muted)', marginTop: '4px', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  )
}

export default function DocSidebar({ doc, summary, onSummarize, isSummarizing, onClear }) {
  const [summaryOpen, setSummaryOpen] = useState(false)

  const handleSummarize = () => {
    setSummaryOpen(true)
    if (!summary) onSummarize()
  }

  // Format markdown-ish text (basic: bullet lines)
  const renderSummary = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')
      return (
        <div key={i} style={{
          display: 'flex', gap: '8px',
          marginBottom: '6px',
          fontSize: '13px',
          color: 'var(--ink3)',
          lineHeight: 1.6,
          fontFamily: 'var(--font-sans)',
        }}>
          {isBullet && <span style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '1px' }}>▸</span>}
          <span>{line.replace(/^[-•*]\s*/, '')}</span>
        </div>
      )
    })
  }

  return (
    <div style={{
      width: '280px', flexShrink: 0,
      background: 'var(--cream2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--cream)',
      }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '22px',
          fontWeight: 700, color: 'var(--ink)', lineHeight: 1,
        }}>
          Doc<span style={{ color: 'var(--amber)' }}>Mind</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '11px',
          color: 'var(--muted)', marginTop: '3px', letterSpacing: '0.03em',
        }}>
          AI Document Intelligence
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {/* Document card */}
        <div style={{
          padding: '14px', borderRadius: '12px',
          background: 'var(--cream)', border: '1px solid var(--border)',
          boxShadow: '0 2px 8px var(--shadow)',
          marginBottom: '16px',
          animation: 'slideIn 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: 'linear-gradient(135deg, #fdf0dc, #f5e4c0)',
              borderRadius: '8px', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--amber)" strokeWidth="1.5"/>
                <path d="M14 2v6h6" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: '13px',
                fontWeight: 500, color: 'var(--ink)',
                wordBreak: 'break-word', lineHeight: 1.3,
              }}>
                {doc.filename}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px',
                color: 'var(--sage)', marginTop: '4px',
              }}>
                ✓ Indexed & ready
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <StatBadge label="Pages" value={doc.total_pages} />
          <StatBadge label="Words" value={doc.word_count > 1000 ? `${(doc.word_count / 1000).toFixed(1)}k` : doc.word_count} />
          <StatBadge label="Chunks" value={doc.chunk_count} />
        </div>

        {/* Summarize */}
        <button
          onClick={handleSummarize}
          style={{
            width: '100%', padding: '10px 16px',
            borderRadius: '9px',
            border: '1px solid var(--border2)',
            background: summaryOpen ? 'var(--cream3)' : 'var(--cream)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            fontSize: '13px', fontWeight: 500,
            color: 'var(--brown)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            marginBottom: '8px',
          }}
        >
          <span>📋 Document Summary</span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>{summaryOpen ? '▲' : '▼'}</span>
        </button>

        {summaryOpen && (
          <div style={{
            padding: '14px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #fdf6e8, #faf2dc)',
            border: '1px solid rgba(200,131,42,0.2)',
            marginBottom: '16px',
            animation: 'fadeUp 0.3s ease',
          }}>
            {isSummarizing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '16px', height: '16px',
                  border: '2px solid var(--parchment)',
                  borderTopColor: 'var(--amber)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '12px', color: 'var(--brown)', fontFamily: 'var(--font-sans)' }}>
                  Generating summary…
                </span>
              </div>
            ) : (
              renderSummary(summary) || (
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
                  No summary yet
                </div>
              )
            )}
          </div>
        )}

        {/* Suggested questions */}
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '11px',
          color: 'var(--muted)', letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: '10px', fontWeight: 500,
        }}>
          Quick questions
        </div>
        {[
          'What is this document about?',
          'What are the key findings?',
          'Summarize the main conclusions.',
          'What data or statistics are mentioned?',
        ].map((q) => (
          <div key={q} style={{ marginBottom: '6px' }}>
            <div
              onClick={() => {
                window.dispatchEvent(new CustomEvent('suggest-question', { detail: q }))
              }}
              style={{
                padding: '8px 12px', borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--cream)',
                fontFamily: 'var(--font-sans)', fontSize: '12px',
                color: 'var(--brown2)', cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--amber)'
                e.currentTarget.style.background = '#fdf6e8'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--cream)'
              }}
            >
              {q}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: change doc */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onClear}
          style={{
            width: '100%', padding: '9px',
            borderRadius: '8px', border: '1px solid var(--border2)',
            background: 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: '12px',
            color: 'var(--muted)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--rust)'; e.currentTarget.style.borderColor = 'var(--rust)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
        >
          ← Upload new document
        </button>
      </div>
    </div>
  )
}
