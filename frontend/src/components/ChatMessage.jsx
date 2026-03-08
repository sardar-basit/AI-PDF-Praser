import React from 'react'

function renderText(text) {
  // Simple: handle bullet lines, bold **text**, newlines
  return text.split('\n').filter(Boolean).map((line, i) => {
    const isBullet = /^[-•*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim())
    const isHeading = /^\*\*(.+)\*\*$/.test(line.trim())

    // Bold inline **...**
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.slice(2, -2)}</strong>
        : p
    )

    if (isHeading) {
      return (
        <div key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px', marginTop: i > 0 ? '10px' : 0 }}>
          {rendered}
        </div>
      )
    }

    return (
      <div key={i} style={{
        display: 'flex', gap: '8px', alignItems: 'flex-start',
        marginBottom: '5px', lineHeight: 1.65,
      }}>
        {isBullet && (
          <span style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>▸</span>
        )}
        <span style={{ wordBreak: 'break-word' }}>
          {isBullet ? rendered.map((p, j) => typeof p === 'string' ? p.replace(/^[-•*\d.]\s*/, '') : p) : rendered}
        </span>
      </div>
    )
  })
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const time = message.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        animation: 'fadeUp 0.3s ease', marginBottom: '18px',
      }}>
        <div style={{ maxWidth: '72%' }}>
          <div style={{
            padding: '12px 16px', borderRadius: '16px 16px 4px 16px',
            background: 'linear-gradient(135deg, var(--amber), #d4922f)',
            color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: '14px',
            lineHeight: 1.6, fontWeight: 400,
            boxShadow: '0 2px 12px rgba(200,131,42,0.25)',
          }}>
            {message.text}
          </div>
          <div style={{
            textAlign: 'right', marginTop: '4px',
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--muted2)',
          }}>
            You · {time}
          </div>
        </div>
      </div>
    )
  }

  if (message.role === 'thinking') {
    return (
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'flex-start',
        marginBottom: '18px', animation: 'fadeUp 0.3s ease',
      }}>
        <div style={{
          width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--amber), var(--amber2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontSize: '14px', color: '#fff', fontWeight: 700,
        }}>D</div>
        <div style={{
          padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
          background: 'var(--cream)', border: '1px solid var(--border)',
          display: 'flex', gap: '6px', alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--amber)',
              animation: `typing 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', gap: '12px', alignItems: 'flex-start',
      marginBottom: '18px', animation: 'fadeUp 0.3s ease',
    }}>
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--amber), var(--amber2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-serif)', fontSize: '14px', color: '#fff', fontWeight: 700,
        boxShadow: '0 2px 8px rgba(200,131,42,0.3)',
      }}>D</div>

      <div style={{ maxWidth: '78%', minWidth: 0 }}>
        <div style={{
          padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
          background: 'var(--cream)', border: '1px solid var(--border)',
          fontFamily: 'var(--font-sans)', fontSize: '14px',
          color: 'var(--ink3)', lineHeight: 1.65,
          boxShadow: '0 2px 8px var(--shadow)',
        }}>
          {renderText(message.text)}
        </div>
        <div style={{
          marginTop: '4px',
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: 'var(--muted2)', display: 'flex', gap: '8px',
        }}>
          <span>DocMind · {time}</span>
          {message.sources && (
            <span style={{ color: 'var(--sage)' }}>· {message.sources} chunk{message.sources !== 1 ? 's' : ''} referenced</span>
          )}
        </div>
      </div>
    </div>
  )
}
