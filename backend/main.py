import os
import re
import math
import uuid
import httpx
from collections import Counter
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pdfplumber

load_dotenv()

app = FastAPI(title="DocMind PDF Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Provider Configuration ───────────────────────────────────────
MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "groq").lower()   # groq | openai | gemini

GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Default models per provider (can be overridden via env)
DEFAULT_MODELS = {
    "groq":   os.getenv("GROQ_MODEL",   "llama-3.3-70b-versatile"),
    "openai": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    "gemini": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
}

def _active_key() -> str:
    """Return the API key for the active provider."""
    return {"groq": GROQ_API_KEY, "openai": OPENAI_API_KEY, "gemini": GEMINI_API_KEY}.get(MODEL_PROVIDER, "")

def _provider_ready() -> bool:
    return bool(_active_key())

# ─── In-memory document store ─────────────────────────────────────
documents: dict[str, dict] = {}
CHUNK_SIZE    = 600
CHUNK_OVERLAP = 100
TOP_K         = 5


# ─── Text utilities ───────────────────────────────────────────────

def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)
    return text.strip()


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for sent in sentences:
        if len(current) + len(sent) > size and current:
            chunks.append(current.strip())
            words = current.split()
            current = " ".join(words[-overlap // 6:]) + " " + sent
        else:
            current += " " + sent
    if current.strip():
        chunks.append(current.strip())
    return [c for c in chunks if len(c) > 40]


def tokenize(text: str) -> list[str]:
    return re.findall(r'\b[a-z]{2,}\b', text.lower())


def tf(tokens: list[str]) -> dict[str, float]:
    count = Counter(tokens)
    total = len(tokens) or 1
    return {w: c / total for w, c in count.items()}


def compute_idf(chunks: list[str]) -> dict[str, float]:
    N = len(chunks)
    df: Counter = Counter()
    for chunk in chunks:
        for word in set(tokenize(chunk)):
            df[word] += 1
    return {w: math.log((N + 1) / (d + 1)) + 1 for w, d in df.items()}


def tfidf_score(query: str, chunk: str, idf: dict[str, float]) -> float:
    q_tokens = tokenize(query)
    c_tokens = tokenize(chunk)
    c_tf = tf(c_tokens)
    return sum(c_tf.get(t, 0) * idf.get(t, 0) for t in q_tokens)


def retrieve(query: str, chunks: list[str], idf: dict[str, float], k: int = TOP_K) -> list[str]:
    scored = sorted([(tfidf_score(query, c, idf), c) for c in chunks], reverse=True)
    return [c for _, c in scored[:k] if _ > 0] or chunks[:k]


# ─── Unified LLM caller ───────────────────────────────────────────

async def call_llm(system_prompt: str, messages: list[dict], max_tokens: int = 800) -> str:
    """Route to the correct LLM provider based on MODEL_PROVIDER env var."""

    provider = MODEL_PROVIDER
    model    = DEFAULT_MODELS.get(provider, "")

    # ── Groq & OpenAI share the same request shape ────────────────
    if provider in ("groq", "openai"):
        base_urls = {
            "groq":   "https://api.groq.com/openai/v1/chat/completions",
            "openai": "https://api.openai.com/v1/chat/completions",
        }
        payload_messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                base_urls[provider],
                headers={
                    "Authorization": f"Bearer {_active_key()}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": payload_messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.3,
                },
            )

        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"{provider.capitalize()} error: {resp.text}")
        return resp.json()["choices"][0]["message"]["content"].strip()

    # ── Gemini ────────────────────────────────────────────────────
    elif provider == "gemini":
        # Convert OpenAI-style message list to Gemini "contents" format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={_active_key()}"
        )
        body = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.3},
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body)

        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"Gemini error: {resp.text}")
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

    else:
        raise HTTPException(500, f"Unknown MODEL_PROVIDER: '{provider}'. Use groq | openai | gemini.")


# ─── Endpoints ────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "DocMind API running", "provider": MODEL_PROVIDER, "model": DEFAULT_MODELS.get(MODEL_PROVIDER)}


@app.get("/health")
def health():
    return {
        "provider": MODEL_PROVIDER,
        "model": DEFAULT_MODELS.get(MODEL_PROVIDER),
        "ready": _provider_ready(),
        "groq_key":   bool(GROQ_API_KEY),
        "openai_key": bool(OPENAI_API_KEY),
        "gemini_key": bool(GEMINI_API_KEY),
    }


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Parse PDF, chunk text, build TF-IDF index, return doc_id."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    raw_bytes = await file.read()
    if len(raw_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 20 MB)")

    import io
    pages_text = []
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        total_pages = len(pdf.pages)
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages_text.append(clean_text(text))

    full_text = "\n\n".join(pages_text)
    if len(full_text.strip()) < 50:
        raise HTTPException(422, "Could not extract readable text from this PDF")

    chunks = chunk_text(full_text)
    idf    = compute_idf(chunks)
    word_count = len(tokenize(full_text))
    doc_id = str(uuid.uuid4())

    documents[doc_id] = {
        "filename":    file.filename,
        "total_pages": total_pages,
        "word_count":  word_count,
        "chunks":      chunks,
        "idf":         idf,
        "full_text":   full_text[:3000],
        "summary":     None,
    }

    return {
        "doc_id":      doc_id,
        "filename":    file.filename,
        "total_pages": total_pages,
        "word_count":  word_count,
        "chunk_count": len(chunks),
    }


class ChatRequest(BaseModel):
    doc_id:   str
    question: str
    history:  list[dict] = []


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """RAG: retrieve relevant chunks → ask the active LLM provider."""
    if not _provider_ready():
        raise HTTPException(500, f"API key for provider '{MODEL_PROVIDER}' is not configured in .env")

    doc = documents.get(req.doc_id)
    if not doc:
        raise HTTPException(404, "Document not found. Please re-upload.")

    context_chunks = retrieve(req.question, doc["chunks"], doc["idf"])
    context = "\n\n---\n\n".join(context_chunks)

    system_prompt = (
        f'You are DocMind, an expert AI document analyst. '
        f'You have been given excerpts from the document "{doc["filename"]}".\n'
        'Answer the user\'s question using ONLY information from the provided context.\n'
        'If the answer is not in the context, say so clearly.\n'
        'Be precise, helpful, and cite relevant details from the document.\n'
        'Format your answer clearly — use bullet points or numbered lists when listing multiple items.'
    )

    # Build message history (last 6 turns)
    messages = [m for m in req.history[-6:]]
    messages.append({
        "role": "user",
        "content": f"Context from document:\n{context}\n\nQuestion: {req.question}",
    })

    answer = await call_llm(system_prompt, messages)

    return {
        "answer":       answer,
        "sources_used": len(context_chunks),
        "provider":     MODEL_PROVIDER,
        "model":        DEFAULT_MODELS.get(MODEL_PROVIDER),
    }


class SummarizeRequest(BaseModel):
    doc_id: str


@app.post("/api/summarize")
async def summarize(req: SummarizeRequest):
    """Generate a document summary using the active LLM provider."""
    if not _provider_ready():
        raise HTTPException(500, f"API key for provider '{MODEL_PROVIDER}' is not configured in .env")

    doc = documents.get(req.doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    if doc.get("summary"):
        return {"summary": doc["summary"]}

    seed_text = "\n\n".join(doc["chunks"][:8])
    system_prompt = "You are a document summarizer. Provide a clear, structured summary."
    messages = [{"role": "user", "content": f"Summarize this document in 3-5 bullet points:\n\n{seed_text}"}]

    summary = await call_llm(system_prompt, messages, max_tokens=400)
    doc["summary"] = summary
    return {"summary": summary}


@app.delete("/api/document/{doc_id}")
def delete_document(doc_id: str):
    documents.pop(doc_id, None)
    return {"deleted": doc_id}
