"use client";

import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export type SectionId = "page" | "layout" | "fetch-notes" | "create-note";
type Group = "routing" | "data" | "mutations";

const GROUP_LABELS: Record<Group, { label: string; color: string }> = {
  routing:   { label: "Routing",       color: "text-sky-500 border-sky-500/30 bg-sky-500/5" },
  data:      { label: "Data fetching", color: "text-indigo-500 border-indigo-500/30 bg-indigo-500/5" },
  mutations: { label: "Mutations",     color: "text-[#FF6B35] border-[#FF6B35]/30 bg-[#FF6B35]/5" },
};

type Section = {
  id: SectionId; icon: string; title: string; module: string;
  group: Group; language: string; code: string;
  annotations: Record<number, string>; summary?: string;
};

function CodeBlock({ code, language, annotations }: {
  code: string; language: string; annotations?: Record<number, string>;
}) {
  return (
    <div className="relative mt-2 rounded-lg overflow-hidden text-[11px]">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "11px", lineHeight: "1.6" }}
        showLineNumbers wrapLines
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

const CODE_PAGE = `export default async function Page() {
  const notes = await getNotes()
  return (
    <main className="container mx-auto p-8">
      <h1>Notes</h1>
      <Suspense fallback={<NoteListSkeleton />}>
        <NoteList notes={notes} />
      </Suspense>
      <NewNoteForm />
    </main>
  )
}`;
const ANNOT_PAGE = {
  1: "Async Server Component — runs on the server, never ships to the client.",
  2: "Direct DB call: no fetch, no API route, no extra hop.",
  6: "Suspense boundary lets the static shell render while notes stream in.",
};

const CODE_LAYOUT = `export const metadata: Metadata = {
  title: "Notes App",
  description: "A tiny Next.js notes app",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}`;
const ANNOT_LAYOUT = {
  1: "metadata export feeds Next.js's SEO defaults — no <Head> needed.",
  9: "Inter font hosted by Next — preloaded with display:swap to avoid FOIT.",
};

const CODE_FETCH_NOTES = `import { cache } from "react"
import { db } from "./db"
import { notes } from "./schema"
import { desc } from "drizzle-orm"

export const getNotes = cache(async () => {
  return db
    .select()
    .from(notes)
    .orderBy(desc(notes.updatedAt))
    .limit(50)
})`;
const ANNOT_FETCH_NOTES = {
  1: "React's cache() ensures a single DB call per request — even across components.",
  10: "orderBy desc(updatedAt) — readers expect newest-first.",
  11: "limit 50 — avoids unbounded payloads on accounts with thousands of notes.",
};

const CODE_CREATE_NOTE = `"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { notes } from "@/lib/schema"
import { revalidatePath } from "next/cache"

const Schema = z.object({
  title: z.string().min(1),
  body: z.string(),
})

export async function createNote(formData: FormData) {
  const data = Schema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
  })
  await db.insert(notes).values(data)
  revalidatePath("/")
}`;
const ANNOT_CREATE_NOTE = {
  1: "'use server' marks this file as server-only code reachable from the client by RPC.",
  14: "Zod parsing throws on invalid input — Next.js converts the throw into a structured form error.",
  19: "revalidatePath flushes the cached page so the new note appears immediately.",
};

const SECTIONS: Section[] = [
  { id: "page", icon: "🚪", title: "App Router page",
    module: "app/page.tsx · Page()", group: "routing",
    language: "tsx", code: CODE_PAGE, annotations: ANNOT_PAGE,
    summary: "Default landing page — fetches notes server-side and renders the list." },
  { id: "layout", icon: "🎨", title: "Root layout",
    module: "app/layout.tsx · RootLayout()", group: "routing",
    language: "tsx", code: CODE_LAYOUT, annotations: ANNOT_LAYOUT,
    summary: "Provides the HTML shell, font, and ThemeProvider." },
  { id: "fetch-notes", icon: "📥", title: "Note query",
    module: "lib/notes.ts · getNotes()", group: "data",
    language: "typescript", code: CODE_FETCH_NOTES, annotations: ANNOT_FETCH_NOTES,
    summary: "Drizzle ORM call wrapped in a memoised function." },
  { id: "create-note", icon: "✏️", title: "Create note action",
    module: "app/actions.ts · createNote()", group: "mutations",
    language: "typescript", code: CODE_CREATE_NOTE, annotations: ANNOT_CREATE_NOTE,
    summary: "Server action invoked from the client form." },
];

const GROUP_ORDER: Group[] = ["routing", "data", "mutations"];
const SECTIONS_ORDERED = GROUP_ORDER.flatMap((g) => SECTIONS.filter((s) => s.group === g));

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
    <aside ref={panelRef} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="border-b border-black/10 dark:border-white/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          📚 How it works — full data flow
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GROUP_ORDER.map((g) => (
            <span key={g} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${GROUP_LABELS[g].color}`}>
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
                  isOpen ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                         : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="shrink-0" aria-hidden="true">{section.icon}</span>
                <div className="flex-1 min-w-0">
                  <div>{section.title}</div>
                  <div className="text-[10px] font-normal font-mono text-neutral-400 truncate">{section.module}</div>
                </div>
                <span className={`text-xs transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
              </button>
              <div
                id={`explain-panel-${section.id}`}
                role="region"
                aria-labelledby={`explain-btn-${section.id}`}
                className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-2 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                    {section.summary && <p>{section.summary}</p>}
                    <CodeBlock code={section.code} language={section.language} annotations={section.annotations} />
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
