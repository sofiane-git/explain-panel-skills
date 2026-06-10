"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SectionId =
  | "news-api-ingest"
  | "scraper"
  | "ingest-pipeline"
  | "chroma"
  | "orchestration"
  | "rag"
  | "enrich"
  | "llm"
  | "results";

type Group = "ingestion" | "indexation" | "retrieval" | "generation";

const GROUP_LABELS: Record<Group, { label: string; color: string }> = {
  ingestion:  { label: "Ingestion",   color: "text-sky-500 border-sky-500/30 bg-sky-500/5" },
  indexation: { label: "Indexation",  color: "text-indigo-500 border-indigo-500/30 bg-indigo-500/5" },
  retrieval:  { label: "Récupération", color: "text-amber-500 border-amber-500/30 bg-amber-500/5" },
  generation: { label: "Génération",  color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" },
};

type Section = {
  id: SectionId;
  icon: string;
  title: string;
  module: string;
  group: Group;
  language: string;
  code: string;
  annotations: Record<number, string>;
  summary?: string;
};

// ── CodeBlock ──────────────────────────────────────────────────────────────────

function CodeBlock({
  code,
  language,
  annotations,
}: {
  code: string;
  language: string;
  annotations?: Record<number, string>;
}) {
  return (
    <div className="relative mt-2 rounded-lg overflow-hidden text-[11px]">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "11px", lineHeight: "1.6" }}
        showLineNumbers
        wrapLines
        lineProps={(n: number) =>
          annotations?.[n]
            ? { style: { background: "rgba(99,102,241,0.15)", display: "block" } }
            : { style: { display: "block" } }
        }
      >
        {code}
      </SyntaxHighlighter>
      {annotations && Object.keys(annotations).length > 0 && (
        <div className="bg-neutral-900 border-t border-white/5 px-3 py-2 space-y-1">
          {Object.entries(annotations).map(([line, note]) => (
            <div key={line} className="flex gap-2 text-[10px]">
              <span className="shrink-0 font-mono text-indigo-400">L{line}</span>
              <span className="text-neutral-400">{note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Code constants ────────────────────────────────────────────────────────────
// NOTE: snippets shown here are abbreviated for the example. In a real generated
// file each CODE_* string contains the literal lines snippet_start..snippet_end
// from the source. See the matching pipeline-map.json next to this component.

const CODE_NEWS_API_INGEST = `class NewsApiIngester:
    def run(self, topics, max_pages=5, from_date=None):
        seen: dict[str, Article] = {}
        for topic in topics:
            for article in self._fetch_topic(topic, max_pages, from_date):
                if article.id in seen:
                    seen[article.id].tags = list(
                        {*seen[article.id].tags, *article.tags}
                    )
                else:
                    seen[article.id] = article
        return list(seen.values())`;

const ANNOT_NEWS_API_INGEST: Record<number, string> = {
  5: "Dedup by sha256(title+source) — re-ingesting the same article produces the same id, upsert is idempotent.",
  10: "Tag fusion: an article retrieved via both Python and AI/ML topics inherits both tags.",
};

const CODE_SCRAPER = `class Scraper:
    user_agent = "nauda-palisse-veille/0.1"
    timeout    = 10.0

    def _fetch(self, url: str) -> str:
        response = httpx.get(
            url, timeout=self.timeout,
            follow_redirects=True,
            headers={"User-Agent": self.user_agent},
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        cleaned = strip_boilerplate(soup)
        return clean_html_to_markdown(str(cleaned))`;

const ANNOT_SCRAPER: Record<number, string> = {
  3: "timeout=10s — if the source is slow, fall back to NewsAPI's 200-char description.",
  7: "User-Agent set: many sites block default Python agents.",
  12: "raise_for_status() lets the caller treat 4xx/5xx uniformly.",
};

const CODE_INGEST_PIPELINE = `def ingest(articles: list[Article]) -> IngestResult:
    scraped = Scraper().run([a.url for a in articles])
    chunks: list[ArticleChunk] = []
    for article in articles:
        text = scraped.get(article.url) or article.content
        for i, para in enumerate(_splitter.split_text(text)):
            chunks.append(ArticleChunk(
                id=sha256(f"{article.id}|{i}|{para[:200]}"),
                text=para, document_id=article.id,
                chunk_index=i, tags=article.tags,
            ))
    embeddings = embed_batch([c.text for c in chunks])
    collection.upsert(ids=[c.id for c in chunks],
        embeddings=embeddings,
        documents=[c.text for c in chunks],
        metadatas=[_chunk_metadata(c) for c in chunks])`;

const ANNOT_INGEST_PIPELINE: Record<number, string> = {
  5: "1200 chars (~200 words) per chunk — long enough for meaning, short enough for precision.",
  8: "Deterministic sha256 → re-ingest is a safe no-op (upsert handles duplicates).",
  12: "Batches of 16 keep the embedding API within request limits.",
};

const CODE_CHROMA = `@lru_cache(maxsize=1)
def get_client() -> chromadb.HttpClient:
    parsed = urlparse(settings.chroma_url)
    return chromadb.HttpClient(
        host=parsed.hostname, port=parsed.port,
        settings=ChromaSettings(anonymized_telemetry=False),
    )

def get_collection() -> Collection:
    return get_client().get_or_create_collection(
        name=settings.chroma_collection,
        metadata={"hnsw:space": "cosine"},
    )`;

const ANNOT_CHROMA: Record<number, string> = {
  1: "lru_cache(maxsize=1): one HTTP client for the whole process lifetime.",
  11: "hnsw:space='cosine' — without this, ChromaDB defaults to L2 (Euclidean).",
};

const CODE_ORCHESTRATION = `async def handle_chat(req: ChatRequest) -> ChatResponse:
    query = _expand_query(req.question, req.topics)
    retrieved = retrieval.retrieve(query, k=8)
    enriched = ingest_enrich.enrich_retrieval(retrieved)
    if enriched:
        retrieved = retrieved + enriched
    fresh = await fresh_news.fetch(topics=req.topics)
    return await compose_answer(
        question=req.question, topics=req.topics,
        retrieved_chunks=retrieved, fresh_articles=fresh,
        expanded_query=query,
    )`;

const ANNOT_ORCHESTRATION: Record<number, string> = {
  3: "k=8 — always returns 8 chunks even when relevance is low.",
  4: "Enrichment retrieves the full article for each retrieved chunk's parent.",
  7: "Fresh news bypasses embedding — fetched live from NewsAPI.",
};

const CODE_RAG = `def retrieve(query: str, k: int = 8) -> list[dict]:
    collection = get_collection()
    query_vec  = embed(query)
    result = collection.query(
        query_embeddings=[query_vec],
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )
    return [
        {"content": doc, "metadata": meta, "distance": dist}
        for doc, meta, dist in zip(
            result["documents"][0],
            result["metadatas"][0],
            result["distances"][0],
        )
    ]`;

const ANNOT_RAG: Record<number, string> = {
  3: "embed() — Azure AI Inference, same model used at ingest time.",
  6: "n_results=k — ChromaDB always returns k, distances tell you whether to trust them.",
  7: "Distances must be requested explicitly — not in the default include set.",
};

const CODE_ENRICH = `def enrich_retrieval(retrieved: list[dict]) -> list[dict]:
    best: dict[str, dict] = {}
    for chunk in retrieved:
        doc_id = chunk["metadata"].get("document_id", "")
        dist   = chunk.get("distance", 1.0)
        if doc_id not in best or dist < best[doc_id]["distance"]:
            best[doc_id] = chunk
    top5 = sorted(best.values(), key=lambda c: c["distance"])[:5]
    enriched = []
    for best_chunk in top5:
        doc_id = best_chunk["metadata"]["document_id"]
        result = collection.get(where={"document_id": {"$eq": doc_id}})
        pairs = sorted(zip(result["documents"], result["metadatas"]),
                       key=lambda p: p[1].get("chunk_index", 0))
        full_text = "\\n\\n".join(text for text, _ in pairs)
        enriched.append({"content": full_text,
            "metadata": best_chunk["metadata"], "distance": 0.0})
    return enriched`;

const ANNOT_ENRICH: Record<number, string> = {
  6: "Keep only the closest chunk per document_id — avoid retrieving the same article via multiple chunks.",
  8: "Top 5 only — context budget is finite; the rest stays as raw chunks.",
  12: "collection.get() (not query) — no semantic ranking needed.",
  16: "distance=0.0 marks the enriched article as max-priority for the LLM.",
};

const CODE_LLM = `SYSTEM_PROMPT = """
Tu es l'assistant de veille tech.
Réponds en français, factuel, concis.
Format JSON strict : { "answer": "..." }
"""

@lru_cache(maxsize=1)
def get_llm() -> AzureAIOpenAIApiChatModel:
    return AzureAIOpenAIApiChatModel(
        endpoint=settings.azure_ai_inference_endpoint,
        credential=settings.azure_ai_inference_api_key,
        model=settings.azure_ai_inference_model,
        temperature=0.2,
        max_completion_tokens=4096,
    )

async def compose_answer(*, question, retrieved_chunks, fresh_articles, ...):
    user_payload = {"question": question,
        "context": _format_context(retrieved_chunks, fresh_articles)}
    msg = await get_llm().ainvoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=json.dumps(user_payload)),
    ], response_format="json_object")
    return _extract_answer(msg.content)`;

const ANNOT_LLM: Record<number, string> = {
  4: "JSON-strict output: the LLM is forced into a parseable shape.",
  7: "lru_cache(maxsize=1) — share the HTTP client, reuse the TLS handshake.",
  13: "temperature=0.2 — stable, reproducible answers.",
  14: "max_completion_tokens=4096 — caps output to avoid silent truncation.",
  22: "ainvoke is async — FastAPI's event loop stays free during LLM latency.",
};

const CODE_RESULTS = `def _build_cards(retrieved, fresh) -> list[ArticleCard]:
    cards = []
    for chunk in retrieved:
        meta = chunk.get("metadata") or {}
        cards.append(ArticleCard(
            title=meta.get("title", "Sans titre"),
            source=meta.get("source", "interne"),
            snippet=chunk["content"][:280],
            card_type="rag",
            distance=float(chunk["distance"]),
        ))
    for art in fresh:
        cards.append(ArticleCard(
            title=art["title"],
            source=art.get("source", "newsapi"),
            snippet=art.get("content", "")[:280],
            card_type="fresh_news",
        ))
    return cards`;

const ANNOT_RESULTS: Record<number, string> = {
  8: "snippet[:280] — short preview; the LLM saw [:600] in its context.",
  9: "card_type='rag' lets the frontend show the SimilarityBar for these cards only.",
  10: "distance ∈ [0, 2] — ChromaDB with cosine returns 1 - cosine_similarity.",
  17: "Fresh news has no distance — they didn't pass through the embedding model.",
};

// ── Sections ───────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: "news-api-ingest", icon: "📥", title: "NewsAPI Ingester",
    module: "app/ingest/news_api.py · NewsApiIngester.run()", group: "ingestion",
    language: "python", code: CODE_NEWS_API_INGEST, annotations: ANNOT_NEWS_API_INGEST,
    summary: "Pulls articles from NewsAPI for one or more topics, deduplicates by sha256, and merges tags when an article matches multiple topics." },
  { id: "scraper", icon: "🕷️", title: "HTML Scraping & Cleaning",
    module: "app/ingest/scraper.py · Scraper._fetch()", group: "ingestion",
    language: "python", code: CODE_SCRAPER, annotations: ANNOT_SCRAPER,
    summary: "NewsAPI returns ~200 chars. The scraper fetches full HTML, strips boilerplate, converts to Markdown." },
  { id: "ingest-pipeline", icon: "🏗️", title: "Embedding & Indexation Pipeline",
    module: "app/ingest/pipeline.py · ingest()", group: "indexation",
    language: "python", code: CODE_INGEST_PIPELINE, annotations: ANNOT_INGEST_PIPELINE,
    summary: "Splits articles into chunks, embeds them, upserts into ChromaDB." },
  { id: "chroma", icon: "🗄️", title: "ChromaDB client & cosine space",
    module: "app/rag/chroma_client.py · get_collection()", group: "indexation",
    language: "python", code: CODE_CHROMA, annotations: ANNOT_CHROMA,
    summary: "Shared HNSW collection configured with cosine similarity." },
  { id: "orchestration", icon: "🗺️", title: "Chat orchestration",
    module: "app/chat.py · handle_chat()", group: "retrieval",
    language: "python", code: CODE_ORCHESTRATION, annotations: ANNOT_ORCHESTRATION,
    summary: "handle_chat() runs five sequential steps." },
  { id: "rag", icon: "🔍", title: "Vector search (RAG)",
    module: "app/rag/retrieval.py · retrieve()", group: "retrieval",
    language: "python", code: CODE_RAG, annotations: ANNOT_RAG,
    summary: "Embeds the query and asks ChromaDB for the 8 nearest neighbours by cosine distance." },
  { id: "enrich", icon: "📄", title: "Chunk enrichment",
    module: "app/ingest/enrich.py · enrich_retrieval()", group: "retrieval",
    language: "python", code: CODE_ENRICH, annotations: ANNOT_ENRICH,
    summary: "Reconstructs full articles for the top 5 retrieved chunks." },
  { id: "llm", icon: "🤖", title: "LLM synthesis",
    module: "app/rag/llm.py · compose_answer()", group: "generation",
    language: "python", code: CODE_LLM, annotations: ANNOT_LLM,
    summary: "Builds the payload, calls Azure AI Inference with JSON-strict output." },
  { id: "results", icon: "📊", title: "Card construction",
    module: "app/rag/llm.py · _build_cards()", group: "generation",
    language: "python", code: CODE_RESULTS, annotations: ANNOT_RESULTS,
    summary: "Turns retrieved chunks and fresh articles into ArticleCard objects." },
];

// ── Group ordering ─────────────────────────────────────────────────────────────

const GROUP_ORDER: Group[] = ["ingestion", "indexation", "retrieval", "generation"];

const SECTIONS_ORDERED = GROUP_ORDER.flatMap((g) =>
  SECTIONS.filter((s) => s.group === g),
);

// ── Component ──────────────────────────────────────────────────────────────────

export default function ExplainPanel() {
  const [open, setOpen] = useState<SectionId | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(null);
        document.getElementById(`explain-btn-${open}`)?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside
      ref={panelRef}
      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden"
    >
      <div className="border-b border-black/10 dark:border-white/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          📚 Comment ça marche — flux de données complet
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GROUP_ORDER.map((g) => (
            <span
              key={g}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${GROUP_LABELS[g].color}`}
            >
              {GROUP_LABELS[g].label}
            </span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {SECTIONS_ORDERED.map((section, i) => {
          const isOpen = open === section.id;
          const prevGroup = i > 0 ? SECTIONS_ORDERED[i - 1].group : null;
          const showGroupHeader = section.group !== prevGroup;
          const gl = GROUP_LABELS[section.group];
          return (
            <div key={section.id}>
              {showGroupHeader && (
                <div className={`border-b px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${gl.color}`}>
                  {gl.label}
                </div>
              )}
              <button
                id={`explain-btn-${section.id}`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`explain-panel-${section.id}`}
                onClick={() => setOpen((prev) => (prev === section.id ? null : section.id))}
                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                  isOpen
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="shrink-0" aria-hidden="true">{section.icon}</span>
                <div className="flex-1 min-w-0">
                  <div>{section.title}</div>
                  <div className="text-[10px] font-normal font-mono text-neutral-400 truncate">
                    {section.module}
                  </div>
                </div>
                <span
                  className={`text-xs transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              <div
                id={`explain-panel-${section.id}`}
                role="region"
                aria-labelledby={`explain-btn-${section.id}`}
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-2 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                    {section.summary && <p>{section.summary}</p>}
                    <CodeBlock
                      code={section.code}
                      language={section.language}
                      annotations={section.annotations}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
