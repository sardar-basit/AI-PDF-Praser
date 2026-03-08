import React, { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'

export default function ChatPanel({ docId, docName }) {
  const [messages, setMessages] = useState([{
    id: 0, role: 'assistant', text:
      `I've finished analyzing **${docName}**. Ask me anything about this document — I'll find the most relevant sections and give you a precise answer.`,
    time: new Date(), sources: null,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const endRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for suggested questions from sidebar
  useEffect(() => {
    const handler = (e) => {
      setInput(e.detail)
      inputRef.current?.focus()
    }
    window.addEventListener('suggest-question', handler)
    return () => window.removeEventListener('suggest-question', handler)
  }, [])

  const sendMessage = async (text) => {
    const q = text?.trim() || input.trim()
    if (!q || loading) return
    setInput('')
    setLoading(true)

    const userMsg = { id: Date.now(), role: 'user', text: q, time: new Date() }
    const thinkingMsg = { id: Date.now() + 1, role: 'thinking', text: '', time: new Date() }
    setMessages(prev => [...prev, userMsg, thinkingMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId, question: q, history }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Request failed')
      }

      const data = await res.json()
      const aiMsg = {
        id: Date.now() + 2,
        role: 'assistant',
        text: data.answer,
        time: new Date(),
        sources: data.sources_used,
      }

      setMessages(prev => prev.filter(m => m.role !== 'thinking').concat(aiMsg))
      setHistory(prev => [
        ...prev,
        { role: 'user', content: q },
        { role: 'assistant', content: data.answer },
      ].slice(-12))
    } catch (err) {
      setMessages(prev => prev.filter(m => m.role !== 'thinking').concat({
        id: Date.now() + 3,
        role: 'assistant',
        text: `⚠ Error: ${err.message}. Please try again.`,
        time: new Date(),
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--cream2)', overflow: 'hidden',
    }}>
      {/* Chat header */}
      <div style={{
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--sage)',
          boxShadow: '0 0 6px var(--sage)',
          animation: 'pulse-dot 2s ease-in-out infinite',
        }} />
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
            Chat with Document
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
            {docName}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '24px',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 20px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--cream)',
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          padding: '6px 6px 6px 16px',
          borderRadius: '14px',
          border: '1.5px solid var(--border2)',
          background: 'var(--cream2)',
          boxShadow: '0 2px 12px var(--shadow)',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--amber)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border2)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about this document…"
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', resize: 'none',
              fontFamily: 'var(--font-sans)', fontSize: '14px',
              color: 'var(--ink)', lineHeight: 1.5,
              maxHeight: '120px', overflowY: 'auto',
              padding: '6px 0',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: '38px', height: '38px', borderRadius: '10px',
              border: 'none', flexShrink: 0,
              background: loading || !input.trim()
                ? 'var(--parchment)'
                : 'linear-gradient(135deg, var(--amber), #d4922f)',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: !loading && input.trim() ? '0 2px 8px rgba(200,131,42,0.35)' : 'none',
            }}
          >
            {loading ? (
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid #fff4',
                borderTopColor: 'var(--brown)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={input.trim() ? '#fff' : 'var(--muted2)'} strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() ? '#fff' : 'var(--muted2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <div style={{
          marginTop: '8px', textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: 'var(--muted2)',
        }}>
          Enter to send · Shift+Enter for new line · Powered by Groq Llama 3.3 70B
        </div>
      </div>
    </div>
  )
}
