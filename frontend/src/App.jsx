import React, { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import DocSidebar from './components/DocSidebar'
import ChatPanel from './components/ChatPanel'

export default function App() {
  const [doc, setDoc] = useState(null)        // { doc_id, filename, total_pages, word_count, chunk_count }
  const [summary, setSummary] = useState(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (file) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        alert(`Upload failed: ${err.detail}`)
        return
      }
      const data = await res.json()
      setDoc(data)
      setSummary(null)
    } catch (err) {
      alert(`Upload error: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSummarize = async () => {
    if (!doc || isSummarizing) return
    setIsSummarizing(true)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: doc.doc_id }),
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      }
    } catch (err) {
      console.error('Summary error:', err)
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleClear = async () => {
    if (doc) {
      await fetch(`/api/document/${doc.doc_id}`, { method: 'DELETE' }).catch(() => {})
    }
    setDoc(null)
    setSummary(null)
  }

  // Background paper texture effect
  const paperStyle = {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: `
      radial-gradient(ellipse at 20% 0%, rgba(200,131,42,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(92,122,94,0.04) 0%, transparent 50%)
    `,
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={paperStyle} />

      {!doc ? (
        <div style={{ height: '100%', position: 'relative', zIndex: 1 }}>
          <UploadPanel onUpload={handleUpload} isUploading={isUploading} />
        </div>
      ) : (
        <div style={{
          height: '100%', display: 'flex',
          position: 'relative', zIndex: 1,
          overflow: 'hidden',
        }}>
          <DocSidebar
            doc={doc}
            summary={summary}
            onSummarize={handleSummarize}
            isSummarizing={isSummarizing}
            onClear={handleClear}
          />
          <ChatPanel
            key={doc.doc_id}
            docId={doc.doc_id}
            docName={doc.filename}
          />
        </div>
      )}
    </div>
  )
}
