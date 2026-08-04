"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, Sparkles, ArrowDown, Copy, Check, Send, ImagePlus, X, Leaf } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE ?? "/api/chat";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
  reasoning: string;
  streaming: boolean;
  reasoningActive: boolean;
  thinkingStartedAt: number | null;
  thinkingEndedAt: number | null;
  images?: UploadedImage[];
};

type UploadedImage = {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
};

/* ─── Design tokens ─── */
const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryDark: "#1E3D2A",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  primaryGlow: "rgba(45, 90, 61, 0.12)",
  accent: "#7C6BEA",
  accentLight: "#9B8DF0",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  successBg: "rgba(45, 90, 61, 0.08)",
  successFg: "#1E3D2A",
};

function parseSSE(buffer: string): { events: any[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: any[] = [];
  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data:"));
    if (!line) continue;
    const json = line.slice(5).trim();
    if (!json) continue;
    try {
      events.push(JSON.parse(json));
    } catch {
      /* ignore malformed */
    }
  }
  return { events, rest };
}

/* ─── Bouncing dot loader ─── */
export function MessageLoading({ className = "text-[#2D5A3D]", style }: { className?: string; style?: React.CSSProperties }) {
  const uid = useId();
  const idA = `spinnerA-${uid}`;
  const idB = `spinnerB-${uid}`;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate id={idA} begin={`0;${idB}.end+0.25s`} attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate begin={`${idA}.begin+0.1s`} attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate id={idB} begin={`${idA}.begin+0.2s`} attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33" />
      </circle>
    </svg>
  );
}

/* ─── Markdown ─── */
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: C.border, background: C.bgWarm }}>
      <div className="flex items-center justify-between border-b px-4 py-2 font-mono text-[10px] uppercase tracking-widest" style={{ borderColor: C.border, color: C.textMuted }}>
        <span>{language || "source"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 transition-colors duration-200 hover:opacity-70" style={{ color: C.textMuted }}>
          {copied ? (
            <>
              <Check size={10} style={{ color: C.primary }} />
              <span style={{ color: C.primary }}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="custom-scroll overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed" style={{ color: C.text }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Markdown({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="opacity-60">{children}</del>,
          ul: ({ children }) => <ul className="ml-5 list-disc space-y-1.5" style={{ color: C.primary }}>{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1.5" style={{ color: C.primary }}>{children}</ol>,
          li: ({ children }) => <li className="pl-1.5 text-[13.5px] font-light leading-relaxed">{children}</li>,
          h1: ({ children }) => <h2 className="text-[17px] font-medium tracking-wide">{children}</h2>,
          h2: ({ children }) => <h3 className="text-[15px] font-medium tracking-wide">{children}</h3>,
          h3: ({ children }) => <h4 className="text-[13px] font-semibold tracking-wide">{children}</h4>,
          h4: ({ children }) => <h4 className="text-[12.5px] font-semibold tracking-wide opacity-90">{children}</h4>,
          blockquote: ({ children }) => <blockquote className="border-l-2 pl-4 italic opacity-80" style={{ borderColor: C.accent }}>{children}</blockquote>,
          hr: () => <hr style={{ borderColor: C.border }} />,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: C.border }}>
              <table className="w-full border-collapse text-[12.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: C.bgWarm }}>{children}</thead>,
          th: ({ children }) => <th className="border-b px-3 py-1.5 text-left font-medium" style={{ borderColor: C.border, color: C.primary }}>{children}</th>,
          td: ({ children }) => <td className="border-t px-3 py-1.5" style={{ borderColor: C.borderLight }}>{children}</td>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children).replace(/\n$/, "");
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match) || text.includes("\n");
            if (!isBlock) {
              return <code className="rounded px-1.5 py-0.5 font-mono text-[11px]" style={{ background: C.bgWarm, color: C.primary }}>{children}</code>;
            }
            return <CodeBlock code={text} language={match?.[1]} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ─── Thinking block ─── */
function ThinkingBlock({ text, active, elapsedMs }: { text: string; active: boolean; elapsedMs: number }) {
  const [open, setOpen] = useState(active);
  const userSetRef = useRef(false);
  const wasActiveRef = useRef(active);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userSetRef.current) {
      wasActiveRef.current = active;
      return;
    }
    if (active) {
      setOpen(true);
    } else if (wasActiveRef.current && !active) {
      const t = setTimeout(() => setOpen(false), 500);
      wasActiveRef.current = active;
      return () => clearTimeout(t);
    }
    wasActiveRef.current = active;
  }, [active]);

  useEffect(() => {
    if (active && open && scrollBoxRef.current) {
      scrollBoxRef.current.scrollTop = scrollBoxRef.current.scrollHeight;
    }
  }, [text, active, open]);

  const toggle = () => {
    userSetRef.current = true;
    setOpen((o) => !o);
  };

  if (!text) return null;
  const seconds = Math.max(1, Math.round(elapsedMs / 1000));

  return (
    <div className="relative pl-[26px]">
      <div className="absolute bottom-0 left-[7px] top-[18px] w-[1px]" style={{ background: C.border }} />
      <button type="button" onClick={toggle} className="absolute left-0 top-[1px] flex h-[15px] w-[15px] items-center justify-center transition-transform duration-200 active:scale-90">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5" style={{ color: C.accent }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-30" />
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        </svg>
      </button>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <button onClick={toggle} className="flex items-center gap-1.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-200 hover:opacity-70" style={{ color: C.accent }}>
            <span>{active ? "Thinking" : `Thought for ${seconds}s`}</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="inline-flex">
              <ChevronDown size={11} />
            </motion.span>
          </button>
          {active && !open && (
            <div className="ml-1 flex h-3.5 items-center">
              <MessageLoading className="h-4 w-5" style={{ color: C.accent }} />
            </div>
          )}
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div ref={scrollBoxRef} className="custom-scroll max-h-64 overflow-y-auto overscroll-contain pb-4 pr-4 pt-2.5 font-sans text-[13px] font-light leading-relaxed" style={{ color: C.textMuted }}>
                <Markdown content={text} />
                {active && <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse" style={{ background: C.accent }} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Messages ─── */
function AssistantMessage({
  content,
  reasoning,
  streaming,
  reasoningActive,
  elapsedMs,
}: {
  content: string;
  reasoning: string;
  streaming: boolean;
  reasoningActive: boolean;
  elapsedMs: number;
}) {
  const showWeaving = streaming && !content && !reasoningActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="w-full space-y-4 pr-10"
    >
      <ThinkingBlock text={reasoning} active={reasoningActive} elapsedMs={elapsedMs} />

      <div className="relative pl-[26px]">
        {streaming && <div className="absolute bottom-0 left-[7px] top-[18px] w-[1px]" style={{ background: C.border }} />}
        <div className="absolute left-0 top-[3px] flex h-[15px] w-[15px] items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: C.primary }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.primary }}>Assistant</span>
          <div className="space-y-3 pr-4 pt-1 text-[14px] leading-relaxed" style={{ color: C.text }}>
            {showWeaving ? (
              <div className="flex items-center gap-2 font-mono text-xs italic" style={{ color: C.textMuted }}>
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  Thinking...
                </motion.span>
              </div>
            ) : content ? (
              <Markdown content={content} />
            ) : null}
            {streaming && content && (
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="ml-1 inline-block h-3.5 w-1.5" style={{ background: C.primary }} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserMessage({ content, images }: { content: string; images?: UploadedImage[] }) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="flex w-full justify-end pl-10"
      >
        <div className="flex flex-col items-end gap-1.5">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.textMuted }}>You</span>
          {images && images.length > 0 && (
            <div className="flex gap-2 mb-2">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.preview}
                  alt={`Upload ${idx + 1}`}
                  className="h-20 w-20 rounded-xl object-cover cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ border: `1px solid ${C.border}` }}
                  onClick={() => setExpandedImage(img.preview)}
                />
              ))}
            </div>
          )}
          <div className="max-w-full whitespace-pre-wrap text-right text-[13.5px] font-light leading-relaxed px-4 py-2.5 rounded-2xl" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}>
            {content}
          </div>
        </div>
      </motion.div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ background: "rgba(26, 29, 33, 0.8)" }}
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-[90vw] max-h-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImage}
                alt="Expanded upload"
                className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full shadow-xl transition-colors duration-200 glass"
                style={{ color: C.text }}
              >
                <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const SUGGESTIONS = [
  "What can you help me with?",
  "Give me a quick skincare routine",
  "Tell me about ingredient conflicts",
];

/* ─── Page ─── */
export default function ChatPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinnedRef = useRef(true);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      pinnedRef.current = isAtBottom;
      setShowScrollBottom((prev) => (prev === !isAtBottom ? prev : !isAtBottom));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;
    const ro = new ResizeObserver(() => {
      if (pinnedRef.current) scrollEl.scrollTop = scrollEl.scrollHeight;
    });
    ro.observe(contentEl);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in?callbackUrl=/chat");
    }
  }, [session, isPending, router]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 3 - uploadedImages.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    const newImages: UploadedImage[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) continue;

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        base64,
        mimeType: file.type,
      });
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadedImages.length]);

  const removeImage = useCallback((index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && uploadedImages.length === 0) || busy) return;

    if (!session) {
      router.replace("/sign-in?callbackUrl=/chat");
      return;
    }

    const imagesToSend = uploadedImages.length > 0
      ? uploadedImages.map((img) => ({
          mime_type: img.mimeType,
          data: img.base64,
        }))
      : undefined;

    const blank = {
      reasoning: "",
      streaming: false,
      reasoningActive: false,
      thinkingStartedAt: null,
      thinkingEndedAt: null,
    } as const;
    const next: Message[] = [
      ...messages,
      { role: "user", content: text || "(Image upload)", ...blank, images: uploadedImages.length > 0 ? [...uploadedImages] : undefined },
      { role: "assistant", content: "", ...blank, streaming: true },
    ];
    setMessages(next);
    setInput("");
    setUploadedImages([]);
    setBusy(true);

    pinnedRef.current = true;
    setShowScrollBottom(false);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

    const idx = next.length - 1;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          message: text || "Please describe these images.",
          images: imagesToSend,
        }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const { events, rest } = parseSSE(buffer);
        buffer = rest;

        for (const ev of events) {
          if (ev.type === "session") {
            sessionIdRef.current = ev.session_id;
          } else if (ev.type === "reasoning") {
            setMessages((prev) =>
              prev.map((m, i) => {
                if (i !== idx) return m;
                return {
                  ...m,
                  reasoning: m.reasoning + ev.text,
                  reasoningActive: true,
                  thinkingStartedAt: m.thinkingStartedAt ?? Date.now(),
                };
              })
            );
          } else if (ev.type === "answer") {
            setMessages((prev) =>
              prev.map((m, i) => {
                if (i !== idx) return m;
                const closingThinking = m.reasoningActive;
                return {
                  ...m,
                  content: m.content + ev.text,
                  reasoningActive: false,
                  thinkingEndedAt: closingThinking ? Date.now() : m.thinkingEndedAt,
                };
              })
            );
          } else if (ev.type === "error") {
            setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, content: m.content || `⚠ ${ev.text}` } : m)));
          }
        }
      }
    } catch (err) {
      setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, content: m.content || `⚠ ${String(err)}` } : m)));
    } finally {
      setMessages((prev) =>
        prev.map((m, i) => {
          if (i !== idx) return m;
          return {
            ...m,
            streaming: false,
            reasoningActive: false,
            thinkingEndedAt: m.thinkingEndedAt ?? (m.thinkingStartedAt ? Date.now() : null),
          };
        })
      );
      setBusy(false);
    }
  }, [input, busy, messages, uploadedImages, session, router]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copyMessage = (i: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    pinnedRef.current = true;
    setShowScrollBottom(false);
  };

  return (
    <div className="flex h-screen w-full flex-col" style={{ background: C.bg }}>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 9999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: ${C.textMuted}; }
      `}</style>

      {isPending && (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: C.border, borderTopColor: C.primary }} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.textMuted }}>Verifying session...</span>
          </div>
        </div>
      )}

      {!isPending && session && (
        <>
          {/* Header — glass-strong */}
          <div
            className="flex items-center justify-between px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-[18px]"
            style={{
              borderBottom: `1px solid ${C.border}`,
              background: "rgba(250, 251, 252, 0.85)",
              boxShadow: `0 1px 3px rgba(45, 90, 61, 0.04), inset 0 1px 0 rgba(255,255,255,0.6)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
                <Leaf size={14} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: C.text }}>AI Skincare Advisor</span>
                <span className="text-[10px] font-semibold block" style={{ color: C.textMuted }}>Ask me anything about skincare</span>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Chat area — subtle ambient background */}
            <div
              ref={scrollRef}
              className="custom-scroll flex-1 overflow-y-auto overscroll-contain"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${C.primaryGhost}, transparent), ${C.bg}`,
              }}
            >
              <div ref={contentRef} className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: C.primaryGhost, border: `1px solid ${C.primaryGlow}` }}
                    >
                      <Sparkles size={24} style={{ color: C.primary }} />
                    </motion.div>
                    <h3 className="mt-2 text-base font-medium" style={{ color: C.text }}>Start a conversation</h3>
                    <p className="mt-2 max-w-[280px] px-2 text-[13px] font-semibold leading-relaxed" style={{ color: C.textMuted }}>
                      Ask a question or pick a suggestion below to get started.
                    </p>

                    <div className="mt-10 flex w-full max-w-[360px] flex-col gap-3">
                      <span className="mb-1 pb-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
                        Suggested questions
                      </span>
                      {SUGGESTIONS.map((s, idx) => (
                        <motion.button
                          key={s}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          whileHover={{ x: 2 }}
                          onClick={() => {
                            setInput(s);
                            textareaRef.current?.focus();
                          }}
                          className="group flex items-center justify-between py-2.5 text-left text-[13px] font-light transition-all duration-200"
                          style={{ color: C.textSecondary }}
                        >
                          <span className="line-clamp-1">{s}</span>
                          <span className="translate-x-[-4px] text-xs opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" style={{ color: C.primary }}>↗</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <UserMessage key={i} content={m.content} images={m.images} />
                    ) : (
                      <div key={i} className="group/msg relative">
                        <AssistantMessage
                          content={m.content}
                          reasoning={m.reasoning}
                          streaming={m.streaming}
                          reasoningActive={m.reasoningActive}
                          elapsedMs={m.thinkingStartedAt ? (m.thinkingEndedAt ?? Date.now()) - m.thinkingStartedAt : 0}
                        />
                        {!m.streaming && m.content && (
                          <button
                            onClick={() => copyMessage(i, m.content)}
                            className="absolute right-0 top-0 rounded p-1.5 opacity-0 transition-opacity duration-200 hover:opacity-100 group-hover/msg:opacity-100"
                            style={{ color: C.textMuted }}
                            title="Copy reply"
                          >
                            {copiedIdx === i ? <Check size={12} style={{ color: C.primary }} /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showScrollBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  onClick={jumpToBottom}
                  className="absolute bottom-5 right-4 z-30 flex h-8 w-8 items-center justify-center rounded-full shadow-lg glass backdrop-blur-md transition-all duration-300 sm:right-6"
                  style={{ color: C.text }}
                >
                  <ArrowDown size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Image preview area */}
          <AnimatePresence>
            {uploadedImages.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-3 sm:px-6"
                style={{ borderTop: `1px solid ${C.border}`, background: C.bgWarm }}
              >
                <div className="mx-auto flex max-w-3xl gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Upload ${idx + 1}`}
                        className="h-20 w-20 rounded-xl object-cover"
                        style={{ border: `1px solid ${C.border}` }}
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 glass"
                        style={{ color: C.textMuted }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input area — refined glass */}
          <div
            className="px-4 py-4 sm:px-6 sm:py-[22px]"
            style={{
              borderTop: `1px solid ${C.border}`,
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(12px)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5)`,
            }}
          >
            <div className="mx-auto flex max-w-3xl items-end gap-3 pb-2.5 transition-all" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || uploadedImages.length >= 3}
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-20 hover:bg-[rgba(45,90,61,0.06)]"
                style={{ border: `1px solid ${C.border}`, color: C.textMuted }}
                title="Upload image (max 3)"
              >
                <ImagePlus size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={busy ? "Thinking..." : uploadedImages.length > 0 ? "Add a message about the images..." : "Type your message..."}
                disabled={busy}
                className="max-h-[160px] min-h-[34px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] font-light leading-relaxed focus:outline-none disabled:opacity-50"
                style={{ color: C.text }}
              />
              <button
                onClick={send}
                disabled={busy || (!input.trim() && uploadedImages.length === 0)}
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full shadow-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-20 magnetic-btn"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}
                title="Send"
              >
                <motion.span
                  animate={busy ? { rotate: 360 } : { rotate: 0 }}
                  transition={busy ? { duration: 1.2, repeat: Infinity, ease: "linear" } : { duration: 0.25 }}
                  className="flex items-center justify-center"
                >
                  {busy ? <span className="block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white" /> : <Send size={11} className="ml-0.5" />}
                </motion.span>
              </button>
            </div>
            <div className="mx-auto mt-3 flex max-w-3xl justify-between px-1">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: C.textMuted }}>
                {uploadedImages.length > 0 ? `${uploadedImages.length}/3 images attached` : "Shift+Enter for new line"}
              </span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: C.primary }}>{busy ? "Thinking" : "Ready"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
