# DocMind — AI PDF Chat & Document Analyzer

Upload any PDF and ask questions. DocMind uses **RAG (Retrieval-Augmented Generation)** to find the most relevant sections and answer with precision.

```
📄 Upload PDF → [pdfplumber parse] → [TF-IDF index] → ask question
                                                           ↓
                                        [retrieve top chunks] → [Groq LLM] → answer
```

---

## 🔑 Free API

| Service | Purpose | Free Tier | Link |
|---|---|---|---|
| **Groq** | LLM (Llama 3.3 70B) | Generous free tier | https://console.groq.com |

> Only **one API key** needed. Everything else runs locally (PDF parsing, chunking, TF-IDF search).

---

## 📁 Project Structure

```
docmind/
├── backend/
│   ├── main.py          # FastAPI: upload, chat, summarize endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── components/
    │       ├── UploadPanel.jsx    # Drag-and-drop upload
    │       ├── DocSidebar.jsx     # Document stats + summary
    │       ├── ChatPanel.jsx      # Chat interface
    │       └── ChatMessage.jsx    # Message rendering
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### 1. Get free Groq API key
Sign up at https://console.groq.com → API Keys → Create

### 2. Configure backend
```bash
cd backend
cp .env.example .env
# Edit .env → paste your GROQ_API_KEY
```

### 3. Start backend
```bash
pip install -r requirements.txt
python main.py
# → http://localhost:8000
```

### 4. Start frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🛠 How RAG Works Here

1. **Parse** — pdfplumber extracts text from every page
2. **Chunk** — text split into ~600-char overlapping segments
3. **Index** — TF-IDF weights computed across all chunks (pure Python, no vector DB)
4. **Retrieve** — top 5 most relevant chunks selected per question
5. **Generate** — Groq Llama 3.3 70B answers from retrieved context only

---

## 🛠 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Parse PDF → returns doc_id + stats |
| `POST` | `/api/chat` | Question + history → RAG answer |
| `POST` | `/api/summarize` | Auto-summarize document |
| `DELETE` | `/api/document/{id}` | Remove from memory |
| `GET` | `/health` | API key status |

---

## 📦 Tech Stack

**Backend:** Python · FastAPI · pdfplumber · TF-IDF (stdlib) · HTTPX  
**Frontend:** React · Vite · vanilla CSS  
**AI:** Groq Llama 3.3 70B (free tier)  
**No vector DB required** — pure Python TF-IDF retrieval
