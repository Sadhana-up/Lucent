"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Leaf,
  Loader2,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  StickyNote,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { StoreNavbar } from "@/components/store-navbar";
import { formatCurrency } from "@/lib/utils";
import { analyseRoutine, streakFromDays, TIME_OF_DAY, type TimeOfDay } from "@/lib/routine";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ProductInfo = {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  image: string | null;
  category: string | null;
  ingredients: string | null;
  skinType: string | null;
  skinConcerns: string | null;
  stock?: number;
  matchScore?: number;
};

type Step = {
  id: string;
  productId: string;
  timeOfDay: string;
  stepOrder: number;
  notes: string | null;
  titleSnapshot: string;
  imageSnapshot: string | null;
  priceSnapshot: number;
  completedToday: boolean;
  product: ProductInfo | null;
};

type Routine = {
  id: string;
  name: string;
  description: string | null;
  skinType: string | null;
  concerns: string | null;
  isArchived: boolean;
  steps: Step[];
  completions: { stepId: string; day: string }[];
};

type Toast = { id: number; kind: "success" | "error"; message: string };
type PickerState = {
  open: boolean;
  time: TimeOfDay;
  tab: "browse" | "recommended";
  query: string;
  category: string | null;
};
type WeekDay = { key: string; letter: string; label: string; done: boolean; today: boolean };

/* -------------------------------------------------------------------------- */
/*  Design tokens + helpers                                                   */
/* -------------------------------------------------------------------------- */

const C = {
  primary: "#2D5A3D",
  primaryDark: "#1E3D2A",
  primarySoft: "rgba(45,90,61,0.08)",
  primaryTint: "#E7F3EA",
  accent: "#7C6BEA",
  accentSoft: "rgba(124,107,234,0.10)",
  bg: "#FAF6F0",
  surfaceAlt: "#F4EFE7",
  card: "#FFFFFF",
  text: "#1A1D21",
  muted: "#6B6F79",
  border: "#E8E2D9",
  borderStrong: "#D9D1C4",
  danger: "#B42318",
  dangerSoft: "#FEE4E2",
  warn: "#92400E",
  warnSoft: "#FFFBEB",
  warnBorder: "#FDE68A",
  sun: "#D97706",
  sunSoft: "#FEF3C7",
};

const CSS = `
.rt-root { -webkit-font-smoothing: antialiased; }
.rt-root button, .rt-root a, .rt-root input { -webkit-tap-highlight-color: transparent; }
.rt-root button:focus-visible, .rt-root a:focus-visible, .rt-root input:focus-visible {
  outline: 2px solid ${C.accent}; outline-offset: 2px;
}
.rt-card { box-shadow: 0 1px 2px rgba(26,29,33,0.04), 0 14px 32px -18px rgba(26,29,33,0.14); }
.rt-press { transition: transform .15s ease, background-color .15s ease, filter .15s ease, opacity .15s ease; }
.rt-press:active:not(:disabled) { transform: scale(0.96); }
.rt-step:not(:last-child)::before {
  content: ""; position: absolute; left: 27px; top: 48px; bottom: -20px; width: 2px;
  background: ${C.border}; border-radius: 2px;
}
.rt-step.rt-done:not(:last-child)::before { background: rgba(45,90,61,0.35); }
.rt-skeleton { position: relative; overflow: hidden; background: #EFE9DF; }
.rt-skeleton::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
  animation: rt-shimmer 1.4s infinite;
}
.rt-note { background: transparent; border-bottom: 1px dashed transparent; transition: border-color .15s, background-color .15s; }
.rt-note:hover { border-bottom-color: ${C.borderStrong}; }
.rt-note:focus { border-bottom-color: ${C.primary}; background: ${C.card}; }
.rt-pop { animation: rt-pop .32s cubic-bezier(.3,1.6,.5,1); }
.rt-fade { animation: rt-fade .18s ease-out; }
.rt-sheet { animation: rt-slide-up .26s cubic-bezier(.2,.8,.2,1); }
.rt-toast { animation: rt-toast-in .22s cubic-bezier(.2,.8,.2,1); }
.rt-flash { animation: rt-flash 1.1s ease-out 2; }
.rt-menu { animation: rt-toast-in .14s ease-out; transform-origin: top right; }
@keyframes rt-shimmer { 100% { transform: translateX(100%); } }
@keyframes rt-pop { 0% { transform: scale(.4); } 100% { transform: scale(1); } }
@keyframes rt-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rt-slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes rt-toast-in { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes rt-flash { 0% { box-shadow: 0 0 0 0 rgba(217,119,6,.45); } 100% { box-shadow: 0 0 0 14px rgba(217,119,6,0); } }
@media (prefers-reduced-motion: reduce) {
  .rt-root *, .rt-root *::before, .rt-root *::after {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important;
  }
}
`;

const periodLabel = (p: string) => (p === "MORNING" ? "Morning" : "Evening");
const effectivePrice = (p: { price: number; discountPrice: number | null }) =>
  p.discountPrice != null && p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price;
const splitList = (value: string | null | undefined) =>
  (value ?? "")
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const defaultPeriod = () => (new Date().getHours() < 15 ? "MORNING" : "EVENING") as TimeOfDay;
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const statusOf = (err: unknown) => (err as { status?: number } | null)?.status;

const normaliseProduct = (p: any): ProductInfo => {
  const category = typeof p.category === "object" && p.category ? p.category.name : p.category;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    image: p.image ?? p.images?.[0]?.url ?? null,
    category: typeof category === "string" ? category : null,
    ingredients: p.ingredients ?? null,
    skinType: p.skinType ?? null,
    skinConcerns: p.skinConcerns ?? null,
    stock: p.stock,
    matchScore: p.matchScore,
  };
};

const normaliseRoutine = (r: any): Routine => ({
  ...r,
  steps: (r.steps ?? []).map((s: any) => ({
    ...s,
    product: s.product ? normaliseProduct(s.product) : null,
  })),
});

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/* -------------------------------------------------------------------------- */
/*  Small presentational components                                           */
/* -------------------------------------------------------------------------- */

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="rt-root min-h-screen pb-28" style={{ background: C.bg, color: C.text }}>
      <style>{CSS}</style>
      <StoreNavbar />
      {children}
    </div>
  );
}

function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  track = "rgba(255,255,255,0.2)",
  color = "#fff",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <ul className="flex items-center gap-2.5" aria-label="Check-ins over the last 7 days">
      {days.map((d) => (
        <li key={d.key} className="flex flex-col items-center gap-1.5" title={d.label}>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
              d.done
                ? "bg-white text-[#2D5A3D]"
                : d.today
                  ? "border border-dashed border-white/60 text-white"
                  : "bg-white/10 text-white/60"
            }`}
          >
            {d.done ? <Check size={13} strokeWidth={3} aria-label="Checked in" /> : null}
          </span>
          <span className={`text-[10px] ${d.today ? "font-bold text-white" : "text-white/60"}`}>{d.letter}</span>
        </li>
      ))}
    </ul>
  );
}

function RoutineSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-8 sm:px-6" aria-busy="true" aria-label="Loading your routines">
      <div className="space-y-3">
        <div className="rt-skeleton h-3 w-32 rounded-full" />
        <div className="rt-skeleton h-9 w-64 rounded-xl" />
        <div className="rt-skeleton h-4 w-96 max-w-full rounded-lg" />
      </div>
      <div className="flex gap-2">
        <div className="rt-skeleton h-9 w-32 rounded-full" />
        <div className="rt-skeleton h-9 w-28 rounded-full" />
      </div>
      <div className="rt-skeleton h-60 rounded-[28px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rt-skeleton h-96 rounded-3xl" />
        <div className="rt-skeleton h-96 rounded-3xl" />
      </div>
    </div>
  );
}

function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className="rt-toast pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl"
          style={{ background: C.text }}
        >
          {t.kind === "error" ? (
            <AlertTriangle size={16} className="shrink-0" style={{ color: "#FCA5A5" }} />
          ) : (
            <CheckCircle2 size={16} className="shrink-0" style={{ color: "#86EFAC" }} />
          )}
          <span className="min-w-0">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="rt-press -mr-1 ml-1 rounded-full p-1 text-white/60 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="rt-fade absolute inset-0" style={{ background: "rgba(16,32,26,0.5)" }} onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="rt-sheet relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: C.dangerSoft }}>
          <Trash2 size={18} style={{ color: C.danger }} />
        </div>
        <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
        <p id="confirm-body" className="mt-1.5 text-sm leading-relaxed" style={{ color: C.muted }}>{body}</p>
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rt-press flex-1 rounded-xl py-3 text-sm font-semibold"
            style={{ background: C.surfaceAlt, color: C.text }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rt-press flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: C.danger }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  adding,
  locked,
  featured,
  onAdd,
}: {
  product: ProductInfo;
  adding: boolean;
  locked: boolean;
  featured?: boolean;
  onAdd: () => void;
}) {
  const soldOut = (product.stock ?? 1) === 0;
  const price = effectivePrice(product);
  const discounted = price < product.price;
  const tags = [product.skinType, ...splitList(product.skinConcerns)].filter(Boolean).slice(0, 3) as string[];

  return (
    <li
      className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[#FAF6F0]"
      style={{ border: `1px solid ${C.border}` }}
    >
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ background: C.primarySoft }}>
          <Leaf size={18} style={{ color: C.primary }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{product.title}</p>
          {featured && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              <Sparkles size={10} /> Top match
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px]" style={{ color: C.muted }}>
          <span className="truncate">{product.category ?? "Product"}</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold" style={{ color: C.text }}>{formatCurrency(price)}</span>
          {discounted && <s className="opacity-70">{formatCurrency(product.price)}</s>}
          {product.matchScore ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Match {product.matchScore}</span>
            </>
          ) : null}
        </p>
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: C.surfaceAlt, color: C.muted }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={locked || soldOut}
        onClick={onAdd}
        aria-label={`Add ${product.title}`}
        className="rt-press inline-flex min-w-[68px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
        style={{ background: C.primary }}
      >
        {adding ? <Loader2 size={14} className="animate-spin" /> : soldOut ? "Sold out" : (<><Plus size={14} /> Add</>)}
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function RoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState<null | "empty" | "template">(null);
  const [showArchived, setShowArchived] = useState(false);
  const [catalog, setCatalog] = useState<ProductInfo[]>([]);
  const [picker, setPicker] = useState<PickerState>({ open: false, time: "MORNING", tab: "browse", query: "", category: null });
  const [suggestions, setSuggestions] = useState<ProductInfo[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [showAllIssues, setShowAllIssues] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const toastId = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------ notifications ----------------------------- */

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const pushToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3600);
  }, []);
  const fail = (err: unknown, fallback: string) => pushToast("error", err instanceof Error ? err.message : fallback);

  /* --------------------------------- loading -------------------------------- */

  const load = useCallback(async () => {
    try {
      const data = await api<{ routines: any[] }>("/api/routines");
      const list = (data.routines ?? []).map(normaliseRoutine);
      setRoutines(list);
      setLoadError("");
      setActiveId((current) =>
        current && list.some((r) => r.id === current) ? current : ((list.find((r) => !r.isArchived) ?? list[0])?.id ?? null),
      );
    } catch (err) {
      if (statusOf(err) === 401) setNeedsSignIn(true);
      else setLoadError(err instanceof Error ? err.message : "Failed to load routines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    api<{ products: any[] } | any[]>("/api/products")
      .then((data) => setCatalog((Array.isArray(data) ? data : (data.products ?? [])).map(normaliseProduct)))
      .catch(() => setCatalog([]));
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [load]);

  const active = routines.find((r) => r.id === activeId) ?? null;
  const activeRoutineId = active?.id;

  /* ------------------------------ picker effects ---------------------------- */

  const closePicker = useCallback(() => {
    setPicker((p) => ({ ...p, open: false }));
    lastFocus.current?.focus?.();
  }, []);

  const openPicker = (time?: TimeOfDay) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setAddedCount(0);
    setPicker({ open: true, time: time ?? defaultPeriod(), tab: "browse", query: "", category: null });
  };

  useEffect(() => {
    if (!picker.open || picker.tab !== "recommended" || !activeRoutineId) return;
    let cancelled = false;
    setSuggestionsLoading(true);
    api<{ suggestions: any[] }>(`/api/routines/${activeRoutineId}/suggestions`)
      .then((data) => {
        if (!cancelled) setSuggestions((data.suggestions ?? []).map(normaliseProduct));
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [picker.open, picker.tab, activeRoutineId]);

  useEffect(() => {
    if (picker.open && picker.tab === "browse" && window.matchMedia("(min-width: 640px)").matches) {
      searchRef.current?.focus();
    }
  }, [picker.open, picker.tab]);

  useEffect(() => {
    if (!picker.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePicker();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [picker.open, closePicker]);

  /* --------------------------- misc transient effects ----------------------- */

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!confirmRemoveId) return;
    const t = setTimeout(() => setConfirmRemoveId(null), 3500);
    return () => clearTimeout(t);
  }, [confirmRemoveId]);

  useEffect(() => {
    if (!highlightIds.length) return;
    const t = setTimeout(() => setHighlightIds([]), 2400);
    return () => clearTimeout(t);
  }, [highlightIds]);

  /* -------------------------------- derived data ---------------------------- */

  const analysis = useMemo(
    () => analyseRoutine(active?.steps ?? [], active?.skinType),
    [active?.steps, active?.skinType],
  );

  const usedIds = useMemo(() => new Set(active?.steps.map((s) => s.productId) ?? []), [active?.steps]);

  const doneCount = useMemo(() => active?.steps.filter((s) => s.completedToday).length ?? 0, [active?.steps]);

  const cartCost = useMemo(
    () =>
      (active?.steps ?? [])
        .filter((s) => s.product && (s.product.stock ?? 1) > 0)
        .reduce((sum, s) => sum + effectivePrice(s.product as ProductInfo), 0),
    [active?.steps],
  );

  const week = useMemo<WeekDay[]>(() => {
    const days = new Set((active?.completions ?? []).map((c) => String(c.day).slice(0, 10)));
    const out: WeekDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      out.push({
        key,
        letter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        label: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        done: i === 0 ? doneCount > 0 : days.has(key),
        today: i === 0,
      });
    }
    return out;
  }, [active?.completions, doneCount]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    catalog.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [catalog]);

  const browseResults = useMemo(() => {
    const q = picker.query.trim().toLowerCase();
    return catalog
      .filter((p) => !usedIds.has(p.id))
      .filter((p) => !picker.category || p.category === picker.category)
      .filter((p) => !q || `${p.title} ${p.category ?? ""} ${p.skinConcerns ?? ""} ${p.ingredients ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number((a.stock ?? 1) === 0) - Number((b.stock ?? 1) === 0))
      .slice(0, q ? 30 : 24);
  }, [catalog, picker.query, picker.category, usedIds]);

  const recommended = useMemo(() => suggestions.filter((p) => !usedIds.has(p.id)), [suggestions, usedIds]);

  /* --------------------------------- actions -------------------------------- */

  const replaceActive = (updated: any) => {
    const normalised = normaliseRoutine(updated);
    setRoutines((prev) => prev.map((r) => (r.id === normalised.id ? normalised : r)));
  };

  const createRoutine = async (kind: "empty" | "template") => {
    setCreating(kind);
    try {
      const created = await api<any>("/api/routines", jsonInit("POST", { name: newName.trim() || "My Daily Routine", template: kind === "template" }));
      await load();
      setActiveId(created.id);
      setNewName("");
      pushToast(
        "success",
        kind === "template" ? "Starter routine built from your skin profile. Edit anything you like." : "Routine created. Add your first step when you're ready.",
      );
    } catch (err) {
      fail(err, "Failed to create routine");
    } finally {
      setCreating(null);
    }
  };

  const addStep = async (product: ProductInfo) => {
    if (!active) return;
    setBusy(true);
    setAddingId(product.id);
    try {
      replaceActive(await api<any>(`/api/routines/${active.id}/steps`, jsonInit("POST", { productId: product.id, timeOfDay: picker.time })));
      setAddedCount((n) => n + 1);
      pushToast("success", `${product.title} added to ${periodLabel(picker.time).toLowerCase()}.`);
      setPicker((p) => ({ ...p, query: "" }));
    } catch (err) {
      fail(err, "Failed to add product");
    } finally {
      setBusy(false);
      setAddingId(null);
    }
  };

  const removeStep = async (step: Step) => {
    if (!active) return;
    setConfirmRemoveId(null);
    try {
      replaceActive(await api<any>(`/api/routines/${active.id}/steps/${step.id}`, { method: "DELETE" }));
      pushToast("success", `${step.product?.title ?? step.titleSnapshot} removed.`);
    } catch (err) {
      fail(err, "Failed to remove step");
    }
  };

  const moveStep = async (step: Step, direction: -1 | 1) => {
    if (!active) return;
    // Reorder within this time of day only, keeping the global slots of the other period untouched.
    const ordered = [...active.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const slots = ordered.map((s, i) => (s.timeOfDay === step.timeOfDay ? i : -1)).filter((i) => i >= 0);
    const periodSteps = slots.map((i) => ordered[i]);
    const from = periodSteps.findIndex((s) => s.id === step.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= periodSteps.length) return;
    [periodSteps[from], periodSteps[to]] = [periodSteps[to], periodSteps[from]];
    slots.forEach((slot, k) => {
      ordered[slot] = periodSteps[k];
    });
    const updates = ordered.map((s, i) => ({ id: s.id, stepOrder: i + 1, timeOfDay: s.timeOfDay }));
    const orderMap = new Map(updates.map((u) => [u.id, u.stepOrder]));

    // Optimistic update for an instant feel.
    setRoutines((prev) =>
      prev.map((r) => (r.id === active.id ? { ...r, steps: r.steps.map((s) => ({ ...s, stepOrder: orderMap.get(s.id) ?? s.stepOrder })) } : r)),
    );
    try {
      replaceActive(await api<any>(`/api/routines/${active.id}/steps`, jsonInit("PATCH", { updates })));
    } catch (err) {
      fail(err, "Failed to reorder steps");
      void load();
    }
  };

  const togglePeriod = async (step: Step) => {
    if (!active) return;
    const timeOfDay = step.timeOfDay === "MORNING" ? "EVENING" : "MORNING";
    try {
      replaceActive(await api<any>(`/api/routines/${active.id}/steps/${step.id}`, jsonInit("PATCH", { timeOfDay })));
      pushToast("success", `Moved to ${periodLabel(timeOfDay).toLowerCase()}.`);
    } catch (err) {
      fail(err, "Failed to move step");
    }
  };

  const setStepDone = (routineId: string, stepId: string, value: boolean) =>
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, steps: r.steps.map((s) => (s.id === stepId ? { ...s, completedToday: value } : s)) } : r,
      ),
    );

  const toggleDone = async (step: Step) => {
    if (!active) return;
    const routineId = active.id;
    const previous = step.completedToday;
    setStepDone(routineId, step.id, !previous); // optimistic
    try {
      await api(`/api/routines/${routineId}/complete`, jsonInit("POST", { stepId: step.id }));
      // Refresh quietly so the streak and history stay accurate.
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => void load(), 700);
    } catch (err) {
      setStepDone(routineId, step.id, previous);
      fail(err, "Failed to update progress");
    }
  };

  const addAllToCart = async () => {
    if (!active) return;
    setBusy(true);
    let added = 0;
    try {
      for (const step of active.steps) {
        if (step.product && (step.product.stock ?? 1) > 0) {
          await api("/api/cart", jsonInit("POST", { productId: step.productId, quantity: 1 }));
          added++;
        }
      }
      if (added) pushToast("success", `${added} product${added === 1 ? "" : "s"} added to your cart.`);
      else pushToast("error", "No in-stock products to add.");
    } catch (err) {
      fail(err, "Failed to add products to cart");
    } finally {
      setBusy(false);
    }
  };

  const updateRoutine = async (patch: { name?: string; isArchived?: boolean }) => {
    if (!active) return;
    try {
      replaceActive(await api<any>(`/api/routines/${active.id}`, jsonInit("PATCH", patch)));
      if (patch.isArchived) {
        const next = routines.find((r) => r.id !== active.id && !r.isArchived);
        setActiveId(next?.id ?? null);
        pushToast("success", "Routine archived. You can restore it anytime.");
      } else if (patch.isArchived === false) {
        pushToast("success", "Routine restored.");
      }
    } catch (err) {
      fail(err, "Failed to update routine");
    }
  };

  const deleteRoutine = async () => {
    if (!active) return;
    setDeleting(true);
    try {
      await api(`/api/routines/${active.id}`, { method: "DELETE" });
      setConfirmDelete(false);
      setActiveId(null);
      await load();
      pushToast("success", "Routine deleted.");
    } catch (err) {
      fail(err, "Failed to delete routine");
    } finally {
      setDeleting(false);
    }
  };

  const focusSteps = (ids: string[]) => {
    if (!ids.length) return;
    setHighlightIds(ids);
    document.getElementById(`step-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* ------------------------------ early renders ----------------------------- */

  if (loading) {
    return (
      <PageShell>
        <RoutineSkeleton />
      </PageShell>
    );
  }

  if (needsSignIn) {
    return (
      <PageShell>
        <div className="rt-card mx-4 mt-16 max-w-lg rounded-[28px] bg-white p-10 text-center sm:mx-auto" style={{ border: `1px solid ${C.border}` }}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: C.primarySoft }}>
            <Leaf size={26} style={{ color: C.primary }} />
          </div>
          <h1 className="font-serif text-2xl font-bold">Keep your routine with you</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed" style={{ color: C.muted }}>
            Sign in to build a routine, track daily progress and pick it back up on any device.
          </p>
          <Link
            href="/sign-in?callbackUrl=/shop/routine"
            className="rt-press mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
            style={{ background: C.primary }}
          >
            Sign in to continue <ArrowRight size={15} />
          </Link>
        </div>
      </PageShell>
    );
  }

  if (loadError && routines.length === 0) {
    return (
      <PageShell>
        <div className="rt-card mx-4 mt-16 max-w-lg rounded-[28px] bg-white p-10 text-center sm:mx-auto" style={{ border: `1px solid ${C.border}` }}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: C.dangerSoft }}>
            <AlertTriangle size={24} style={{ color: C.danger }} />
          </div>
          <h1 className="text-xl font-bold">We couldn&apos;t load your routines</h1>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError("");
              void load();
            }}
            className="rt-press mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
            style={{ background: C.primary }}
          >
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      </PageShell>
    );
  }

  /* ------------------------------- derived (late) --------------------------- */

  const totalCount = active?.steps.length ?? 0;
  const remaining = totalCount - doneCount;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const streak = streakFromDays([...new Set((active?.completions ?? []).map((c) => c.day))]);
  const visibleRoutines = routines.filter((r) => showArchived || !r.isArchived || r.id === activeId);
  const hasArchived = routines.some((r) => r.isArchived);
  const allDone = totalCount > 0 && doneCount === totalCount;
  const nowPeriod = defaultPeriod();
  const concerns = splitList(active?.concerns).slice(0, 3);
  const warnings = analysis.issues.filter((i) => i.level === "warning");
  const flaggedIds = new Set(warnings.flatMap((i) => i.stepIds));
  const visibleIssues = showAllIssues ? analysis.issues : analysis.issues.slice(0, 3);
  const scoreLabel = !totalCount
    ? "No steps yet"
    : analysis.score >= 90
      ? "Excellent"
      : analysis.score >= 80
        ? "Well balanced"
        : analysis.score >= 60
          ? "Needs tuning"
          : "Review needed";
  const titleOf = (id: string) => {
    const s = active?.steps.find((x) => x.id === id);
    return s ? (s.product?.title ?? s.titleSnapshot) : "";
  };

  const pickerCount = (p: string) => active?.steps.filter((s) => s.timeOfDay === p).length ?? 0;
  const pickerList = picker.tab === "recommended" ? recommended : browseResults;
  const hasFilter = Boolean(picker.query.trim() || picker.category);

  /* --------------------------------- render --------------------------------- */

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-8 sm:px-6">
        {/* Page header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.accent }}>Your skincare plan</p>
            <h1 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">Daily routine</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: C.muted }}>
              {active ? (
                <>
                  <span className="font-semibold" style={{ color: C.text }}>{greeting()}.</span>{" "}
                  {!totalCount
                    ? "Add a few products to get started."
                    : allDone
                      ? "You've completed every step today."
                      : `${remaining} step${remaining === 1 ? "" : "s"} left today.`}
                </>
              ) : (
                "A simple morning and evening plan built from our catalog, with daily check-ins and ingredient checks."
              )}
            </p>
          </div>
          {active && (
            <button
              type="button"
              onClick={() => openPicker()}
              className="rt-press hidden items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 sm:inline-flex"
              style={{ background: C.primary }}
            >
              <Plus size={16} /> Add a step
            </button>
          )}
        </header>

        {!active ? (
          <>
            {/* Guided start */}
            <section className="rt-card relative overflow-hidden rounded-[28px] bg-white p-6 sm:p-10" style={{ border: `1px solid ${C.border}` }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(124,107,234,0.14), transparent 70%)" }}
              />
              <div className="relative">
                {routines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveId((routines.find((r) => !r.isArchived) ?? routines[0]).id)}
                    className="rt-press mb-5 inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: C.muted }}
                  >
                    <ArrowRight size={13} className="rotate-180" /> Back to my routines
                  </button>
                )}
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: C.primarySoft, color: C.primary }}>
                  <Sparkles size={13} /> Let&apos;s build your routine
                </span>
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Start fresh, or let us suggest one</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: C.muted }}>
                  Every routine is saved to your account. Add, remove and reorder steps whenever you like.
                </p>

                <label className="mt-7 block max-w-md">
                  <span className="mb-1.5 block text-xs font-semibold" style={{ color: C.muted }}>Routine name (optional)</span>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Glow routine"
                    maxLength={60}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(45,90,61,0.15)]"
                    style={{ border: `1px solid ${C.borderStrong}` }}
                  />
                </label>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    disabled={creating !== null}
                    onClick={() => void createRoutine("empty")}
                    className="rt-press group rounded-2xl p-6 text-left disabled:opacity-60"
                    style={{ background: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: C.accentSoft }}>
                      {creating === "empty" ? <Loader2 size={18} className="animate-spin" style={{ color: C.accent }} /> : <Plus size={18} style={{ color: C.accent }} />}
                    </div>
                    <h3 className="text-base font-bold">Start from scratch</h3>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>An empty routine. You choose every product and step.</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.primary }}>
                      Create empty routine <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={creating !== null}
                    onClick={() => void createRoutine("template")}
                    className="rt-press group relative rounded-2xl p-6 text-left disabled:opacity-60"
                    style={{ background: C.bg, border: `1px solid ${C.primary}` }}
                  >
                    <span className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: C.primary }}>
                      Recommended
                    </span>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: C.primarySoft }}>
                      {creating === "template" ? <Loader2 size={18} className="animate-spin" style={{ color: C.primary }} /> : <Sparkles size={18} style={{ color: C.primary }} />}
                    </div>
                    <h3 className="text-base font-bold">Build it for me</h3>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: C.muted }}>
                      We pick up to 4 matching products from the live catalog using your skin profile. Fully editable.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.primary }}>
                      Generate starter routine <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3" aria-label="How it works">
              {[
                { n: "01", t: "Choose products", d: "Pick real products from the catalog for morning and evening.", icon: ShoppingBag },
                { n: "02", t: "Check interactions", d: "See ingredient conflicts before they irritate your skin.", icon: ShieldCheck },
                { n: "03", t: "Check off daily", d: "Build a streak as you follow your routine each day.", icon: Flame },
              ].map((item) => (
                <div key={item.n} className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: C.accent }}>{item.n}</span>
                    <item.icon size={16} style={{ color: C.muted }} />
                  </div>
                  <h3 className="mt-2 text-sm font-bold">{item.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>{item.d}</p>
                </div>
              ))}
            </section>
          </>
        ) : (
          <>
            {/* Routine switcher */}
            <div className="flex items-center gap-2">
              <div role="tablist" aria-label="Your routines" className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 py-1">
                {visibleRoutines.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="tab"
                    aria-selected={r.id === activeId}
                    onClick={() => setActiveId(r.id)}
                    className="rt-press shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
                    style={{
                      background: r.id === activeId ? C.primary : C.card,
                      color: r.id === activeId ? "#fff" : C.text,
                      border: `1px solid ${r.id === activeId ? C.primary : C.border}`,
                    }}
                  >
                    {r.name}
                    {r.isArchived ? " · archived" : ""}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(null);
                    setNewName("");
                  }}
                  className="rt-press inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold"
                  style={{ border: `1px dashed ${C.borderStrong}`, color: C.muted }}
                >
                  <Plus size={13} /> New routine
                </button>
              </div>
              {hasArchived && (
                <button type="button" onClick={() => setShowArchived((v) => !v)} className="shrink-0 text-xs font-medium underline-offset-2 hover:underline" style={{ color: C.muted }}>
                  {showArchived ? "Hide archived" : "Show archived"}
                </button>
              )}
            </div>

            {/* Summary hero */}
            <section
              className="relative rounded-[28px] text-white"
              style={{ background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%)`, boxShadow: "0 24px 48px -28px rgba(30,61,42,0.7)" }}
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
                <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)" }} />
                <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(124,107,234,0.30), transparent 70%)" }} />
              </div>

              <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <label className="relative block max-w-md">
                    <span className="sr-only">Routine name</span>
                    <input
                      key={active.id}
                      defaultValue={active.name}
                      maxLength={60}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value && value !== active.name) void updateRoutine({ name: value });
                        else e.target.value = active.name;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="w-full min-w-0 border-b border-white/20 bg-transparent pb-1 pr-8 font-serif text-2xl font-bold text-white outline-none transition-colors placeholder:text-white/50 hover:border-white/50 focus:border-white sm:text-3xl"
                    />
                    <Pencil size={14} className="pointer-events-none absolute right-1 top-2.5 opacity-60" aria-hidden="true" />
                  </label>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                    <span className="rounded-full bg-white/10 px-3 py-1">{active.skinType ? `${active.skinType} skin` : "General routine"}</span>
                    {concerns.map((c) => (
                      <span key={c} className="rounded-full bg-white/10 px-3 py-1">{c}</span>
                    ))}
                    <span className="rounded-full bg-white/10 px-3 py-1">{totalCount} step{totalCount === 1 ? "" : "s"}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={busy || cartCost === 0}
                      onClick={() => void addAllToCart()}
                      className="rt-press inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold hover:brightness-95 disabled:opacity-50"
                      style={{ color: C.primaryDark }}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                      Add all to cart{cartCost > 0 ? ` · ${formatCurrency(cartCost)}` : ""}
                    </button>

                    <div className="relative" ref={menuRef}>
                      <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="More routine actions"
                        className="rt-press flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen && (
                        <div role="menu" className="rt-menu absolute left-0 top-12 z-30 w-52 overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl" style={{ border: `1px solid ${C.border}`, color: C.text }}>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpen(false);
                              void updateRoutine({ isArchived: !active.isArchived });
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#FAF6F0]"
                          >
                            {active.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                            {active.isArchived ? "Restore routine" : "Archive routine"}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirmDelete(true);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#FEE4E2]"
                            style={{ color: C.danger }}
                          >
                            <Trash2 size={14} /> Delete routine
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-4 sm:gap-6 sm:p-5">
                  <div className="flex flex-col items-center text-center">
                    <ProgressRing value={progress} size={64} stroke={6}>
                      <span className="text-sm font-bold tabular-nums">{progress}%</span>
                    </ProgressRing>
                    <p className="mt-2 text-[11px] text-white/70">Today {doneCount}/{totalCount}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <Flame size={22} style={{ color: streak > 0 ? "#FDBA74" : "rgba(255,255,255,0.6)" }} />
                    <p className="mt-1 text-2xl font-bold tabular-nums leading-none">{streak}</p>
                    <p className="mt-1.5 text-[11px] text-white/70">day streak</p>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: !totalCount || analysis.score >= 80 ? "#fff" : "#FCD34D" }}>
                      {totalCount ? analysis.score : "—"}
                    </p>
                    <p className="mt-2 text-[11px] text-white/70">routine score</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-white/90">{scoreLabel}</p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-4 sm:px-8">
                <WeekStrip days={week} />
                <p className="flex items-center gap-2 text-xs font-medium text-white/85">
                  {allDone ? (
                    <>
                      <Sparkles size={14} /> All done for today. Nice work.
                    </>
                  ) : totalCount ? (
                    <>
                      <Clock size={14} /> {remaining} step{remaining === 1 ? "" : "s"} to go today
                    </>
                  ) : (
                    <>Add your first step to start a streak</>
                  )}
                </p>
              </div>
            </section>

            {/* Ingredient check */}
            <section aria-labelledby="ingredient-check" className="rt-card rounded-3xl bg-white p-5 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: warnings.length ? C.sunSoft : C.primarySoft }}>
                  {warnings.length ? <AlertTriangle size={18} style={{ color: C.sun }} /> : <ShieldCheck size={18} style={{ color: C.primary }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="ingredient-check" className="text-base font-bold">Ingredient check</h2>
                  <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
                    {totalCount < 2
                      ? "Add two or more products and we'll check how their ingredients work together."
                      : analysis.issues.length === 0
                        ? "All clear. No ingredient conflicts found in this routine."
                        : `${analysis.issues.length} thing${analysis.issues.length === 1 ? "" : "s"} worth a look${warnings.length ? `, ${warnings.length} important` : ""}.`}
                  </p>
                </div>
              </div>

              {analysis.issues.length > 0 && (
                <>
                  <ul className="mt-4 space-y-2.5">
                    {visibleIssues.map((issue, i) => {
                      const warn = issue.level === "warning";
                      return (
                        <li
                          key={i}
                          className="rounded-2xl p-3.5"
                          style={{ background: warn ? C.warnSoft : C.primarySoft, border: `1px solid ${warn ? C.warnBorder : "transparent"}`, color: warn ? C.warn : C.text }}
                        >
                          <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                            {warn ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <Info size={14} className="mt-0.5 shrink-0" />}
                            <span>{issue.message}</span>
                          </div>
                          {issue.stepIds.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5 pl-6">
                              {issue.stepIds.map((id) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => focusSteps(issue.stepIds)}
                                  className="rt-press max-w-[200px] truncate rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold hover:brightness-95"
                                  style={{ border: `1px solid ${warn ? C.warnBorder : C.border}`, color: C.text }}
                                  title="Show in routine"
                                >
                                  {titleOf(id) || "Product"}
                                </button>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {analysis.issues.length > 3 && (
                    <button type="button" onClick={() => setShowAllIssues((v) => !v)} className="mt-3 text-xs font-semibold" style={{ color: C.primary }}>
                      {showAllIssues ? "Show fewer" : `Show ${analysis.issues.length - 3} more`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Morning / Evening */}
            <div className="grid gap-6 lg:grid-cols-2">
              {TIME_OF_DAY.map((period) => {
                const steps = active.steps.filter((s) => s.timeOfDay === period).sort((a, b) => a.stepOrder - b.stepOrder);
                const periodDone = steps.filter((s) => s.completedToday).length;
                const complete = steps.length > 0 && periodDone === steps.length;
                const isMorning = period === "MORNING";
                return (
                  <section key={period} aria-label={`${periodLabel(period)} routine`} className="rt-card rounded-3xl bg-white p-5 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: isMorning ? C.sunSoft : C.accentSoft }}>
                          {isMorning ? <Sun size={18} style={{ color: C.sun }} /> : <Moon size={18} style={{ color: C.accent }} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold">{periodLabel(period)}</h2>
                            {period === nowPeriod && !complete && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: C.primarySoft, color: C.primary }}>Now</span>
                            )}
                            {complete && (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: C.primaryTint, color: C.primary }}>
                                <Check size={10} strokeWidth={3} /> Done
                              </span>
                            )}
                          </div>
                          <p className="text-[11px]" style={{ color: C.muted }}>
                            {steps.length ? `${periodDone} of ${steps.length} done` : "No steps yet"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPicker(period)}
                        className="rt-press inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold hover:brightness-95"
                        style={{ background: C.primarySoft, color: C.primary }}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    {steps.length > 0 && (
                      <div className="-mt-2 mb-5 h-1.5 overflow-hidden rounded-full" style={{ background: C.surfaceAlt }} aria-hidden="true">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(periodDone / steps.length) * 100}%`, background: C.primary, transition: "width .5s cubic-bezier(.4,0,.2,1)" }}
                        />
                      </div>
                    )}

                    {steps.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openPicker(period)}
                        className="rt-press w-full rounded-2xl border border-dashed px-6 py-12 text-center hover:bg-[#FAF6F0]"
                        style={{ borderColor: C.borderStrong, color: C.muted }}
                      >
                        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: C.surfaceAlt }}>
                          <Plus size={18} />
                        </span>
                        <span className="block text-sm font-semibold" style={{ color: C.text }}>Add your first {periodLabel(period).toLowerCase()} product</span>
                        <span className="mt-1 block text-xs">Cleanser, serum, moisturiser — whatever you use.</span>
                      </button>
                    ) : (
                      <ol className="flex flex-col gap-3">
                        {steps.map((step, index) => {
                          const done = step.completedToday;
                          const title = step.product?.title ?? step.titleSnapshot;
                          const image = step.product?.image ?? step.imageSnapshot;
                          const price = step.product ? effectivePrice(step.product) : step.priceSnapshot;
                          const outOfStock = step.product ? (step.product.stock ?? 1) === 0 : false;
                          const confirming = confirmRemoveId === step.id;
                          const flagged = flaggedIds.has(step.id);
                          const highlighted = highlightIds.includes(step.id);
                          return (
                            <li
                              id={`step-${step.id}`}
                              key={step.id}
                              className={`rt-step group relative flex items-start gap-3 rounded-2xl p-3 transition-colors ${done ? "rt-done" : ""} ${highlighted ? "rt-flash" : ""}`}
                              style={{
                                background: done ? C.primarySoft : C.bg,
                                border: `1px solid ${flagged ? C.warnBorder : "transparent"}`,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => void toggleDone(step)}
                                aria-pressed={done}
                                aria-label={`${done ? "Mark as not done" : "Mark as done"}: ${title}`}
                                className="rt-press relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                                style={{ borderColor: done ? C.primary : C.borderStrong, background: done ? C.primary : "#fff", color: done ? "#fff" : C.muted }}
                              >
                                {done ? <Check size={15} strokeWidth={3} className="rt-pop" /> : index + 1}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  {image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={image} alt="" className={`h-12 w-12 shrink-0 rounded-xl object-cover transition-opacity ${done ? "opacity-70" : ""}`} loading="lazy" />
                                  ) : (
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
                                      <Leaf size={16} style={{ color: C.primary }} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    {step.product ? (
                                      <Link
                                        href={`/shop/${step.product.slug}`}
                                        className={`block truncate text-sm font-semibold hover:underline ${done ? "opacity-70" : ""}`}
                                      >
                                        {title}
                                      </Link>
                                    ) : (
                                      <p className="truncate text-sm font-semibold">{title}</p>
                                    )}
                                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px]" style={{ color: C.muted }}>
                                      <span>{step.product?.category ?? "Product"}</span>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-semibold" style={{ color: C.text }}>{formatCurrency(price)}</span>
                                      {step.product && effectivePrice(step.product) < step.product.price && (
                                        <s className="opacity-70">{formatCurrency(step.product.price)}</s>
                                      )}
                                      {outOfStock && <span className="font-semibold" style={{ color: C.danger }}>Out of stock</span>}
                                      {!step.product && <span className="font-semibold" style={{ color: C.danger }}>No longer available</span>}
                                      {flagged && (
                                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: C.warn }}>
                                          <AlertTriangle size={11} /> Check ingredients
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <label className="relative min-w-[160px] flex-1">
                                    <span className="sr-only">Note for {title}</span>
                                    <StickyNote size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} aria-hidden="true" />
                                    <input
                                      key={`${step.id}:${step.notes ?? ""}`}
                                      defaultValue={step.notes ?? ""}
                                      placeholder="Add a note…"
                                      maxLength={200}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                      }}
                                      onBlur={(e) => {
                                        const value = e.target.value.trim();
                                        if (value === (step.notes ?? "")) return;
                                        void api(`/api/routines/${active.id}/steps/${step.id}`, jsonInit("PATCH", { notes: value }))
                                          .then((r) => replaceActive(r))
                                          .catch((err) => fail(err, "Couldn't save note"));
                                      }}
                                      className="rt-note w-full rounded-lg py-2 pl-8 pr-3 text-xs outline-none"
                                    />
                                  </label>

                                  <div className="ml-auto flex items-center gap-1">
                                    {confirming ? (
                                      <>
                                        <button type="button" onClick={() => setConfirmRemoveId(null)} className="rt-press rounded-lg px-3 py-1.5 text-[11px] font-semibold" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                                          Keep
                                        </button>
                                        <button type="button" onClick={() => void removeStep(step)} className="rt-press rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: C.danger }}>
                                          Remove
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button type="button" disabled={index === 0} onClick={() => void moveStep(step, -1)} title="Move earlier" aria-label={`Move ${title} earlier`} className="rt-press flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                                          <ArrowUp size={13} style={{ color: C.muted }} />
                                        </button>
                                        <button type="button" disabled={index === steps.length - 1} onClick={() => void moveStep(step, 1)} title="Move later" aria-label={`Move ${title} later`} className="rt-press flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                                          <ArrowDown size={13} style={{ color: C.muted }} />
                                        </button>
                                        <button type="button" onClick={() => void togglePeriod(step)} title={isMorning ? "Move to evening" : "Move to morning"} aria-label={isMorning ? `Move ${title} to evening` : `Move ${title} to morning`} className="rt-press flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                                          {isMorning ? <Moon size={13} style={{ color: C.muted }} /> : <Sun size={13} style={{ color: C.muted }} />}
                                        </button>
                                        <button type="button" onClick={() => setConfirmRemoveId(step.id)} title="Remove step" aria-label={`Remove ${title}`} className="rt-press flex h-8 w-8 items-center justify-center rounded-lg hover:brightness-95" style={{ background: C.dangerSoft }}>
                                          <Trash2 size={13} style={{ color: C.danger }} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                );
              })}
            </div>

            <p className="flex items-center gap-2 pb-2 text-xs" style={{ color: C.muted }}>
              <Clock size={13} /> Check off steps each day to keep your streak. Your history is saved to your account.
            </p>
          </>
        )}
      </main>

      {/* Mobile quick-add */}
      {active && !picker.open && (
        <button
          type="button"
          onClick={() => openPicker()}
          aria-label="Add a step"
          className="rt-press fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-xl sm:hidden"
          style={{ background: C.primary, boxShadow: "0 12px 28px -8px rgba(30,61,42,0.6)" }}
        >
          <Plus size={18} /> Add step
        </button>
      )}

      {/* Product picker */}
      {picker.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div className="rt-fade absolute inset-0" style={{ background: "rgba(16,32,26,0.5)", backdropFilter: "blur(2px)" }} onClick={closePicker} aria-hidden="true" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
            className="rt-sheet relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[84vh] sm:max-w-2xl sm:rounded-[28px]"
          >
            <div className="border-b p-5 sm:p-6" style={{ borderColor: C.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="picker-title" className="text-lg font-bold">Add a product</h2>
                  <p className="mt-1 text-xs" style={{ color: C.muted }}>Choose when you&apos;ll use it, then pick a product.</p>
                </div>
                <button type="button" onClick={closePicker} aria-label="Close" className="rt-press flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.surfaceAlt }}>
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: C.surfaceAlt }}>
                {TIME_OF_DAY.map((period) => {
                  const selected = picker.time === period;
                  return (
                    <button
                      key={period}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPicker((p) => ({ ...p, time: period }))}
                      className="rt-press flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                      style={{ background: selected ? "#fff" : "transparent", color: selected ? C.text : C.muted, boxShadow: selected ? "0 1px 3px rgba(26,29,33,0.12)" : "none" }}
                    >
                      {period === "MORNING" ? <Sun size={14} style={{ color: selected ? C.sun : undefined }} /> : <Moon size={14} style={{ color: selected ? C.accent : undefined }} />}
                      {periodLabel(period)}
                      <span className="rounded-full px-1.5 text-[10px]" style={{ background: selected ? C.surfaceAlt : "rgba(0,0,0,0.05)" }}>{pickerCount(period)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-b px-5 pb-4 pt-4 sm:px-6" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-3 focus-within:shadow-[0_0_0_3px_rgba(45,90,61,0.15)]" style={{ border: `1px solid ${C.borderStrong}`, background: C.bg }}>
                <Search size={16} style={{ color: C.muted }} aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={picker.query}
                  onChange={(e) => setPicker((p) => ({ ...p, query: e.target.value, tab: "browse" }))}
                  placeholder="Search products, ingredients or concerns"
                  aria-label="Search products"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                {picker.query && (
                  <button type="button" onClick={() => setPicker((p) => ({ ...p, query: "" }))} aria-label="Clear search" className="rt-press rounded-full p-1">
                    <X size={14} style={{ color: C.muted }} />
                  </button>
                )}
              </div>

              <div role="tablist" aria-label="Product source" className="mt-3 flex items-center gap-2">
                {([
                  { id: "browse", label: "Browse all", icon: Search },
                  { id: "recommended", label: "For your skin", icon: Sparkles },
                ] as const).map((t) => {
                  const selected = picker.tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setPicker((p) => ({ ...p, tab: t.id }))}
                      className="rt-press inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold"
                      style={{ background: selected ? C.primary : "transparent", color: selected ? "#fff" : C.muted, border: `1px solid ${selected ? C.primary : C.border}` }}
                    >
                      <t.icon size={12} /> {t.label}
                    </button>
                  );
                })}
              </div>

              {picker.tab === "browse" && categories.length > 0 && (
                <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter by category">
                  {categories.map((cat) => {
                    const selected = picker.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPicker((p) => ({ ...p, category: selected ? null : cat }))}
                        className="rt-press shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                        style={{ background: selected ? C.primarySoft : C.surfaceAlt, color: selected ? C.primary : C.muted, border: `1px solid ${selected ? C.primary : "transparent"}` }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div role="tabpanel" className="flex-1 overflow-y-auto p-5 sm:p-6">
              {picker.tab === "recommended" ? (
                suggestionsLoading ? (
                  <div className="space-y-2" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rt-skeleton h-[84px] rounded-2xl" />
                    ))}
                  </div>
                ) : recommended.length === 0 ? (
                  <div className="py-10 text-center">
                    <Sparkles size={22} className="mx-auto mb-3" style={{ color: C.muted }} />
                    <p className="text-sm font-semibold">No suggestions right now</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs" style={{ color: C.muted }}>Try browsing the full catalog instead.</p>
                    <button type="button" onClick={() => setPicker((p) => ({ ...p, tab: "browse" }))} className="rt-press mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: C.primarySoft, color: C.primary }}>
                      Browse all products
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-xs" style={{ color: C.muted }}>Ranked using your saved skin type and concerns.</p>
                    <ul className="space-y-2">
                      {recommended.map((product, i) => (
                        <ProductRow key={product.id} product={product} featured={i === 0} adding={addingId === product.id} locked={busy} onAdd={() => void addStep(product)} />
                      ))}
                    </ul>
                  </>
                )
              ) : catalog.length === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: C.muted }}>The catalog isn&apos;t available right now. Please try again shortly.</p>
              ) : pickerList.length === 0 ? (
                <div className="py-10 text-center">
                  <Search size={22} className="mx-auto mb-3" style={{ color: C.muted }} />
                  <p className="text-sm font-semibold">{hasFilter ? "No products match" : "Everything is already in your routine"}</p>
                  {hasFilter && (
                    <button type="button" onClick={() => setPicker((p) => ({ ...p, query: "", category: null }))} className="rt-press mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: C.primarySoft, color: C.primary }}>
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="mb-3 text-xs" style={{ color: C.muted }}>
                    {hasFilter ? `${pickerList.length} result${pickerList.length === 1 ? "" : "s"}` : "Popular in the catalog"}
                  </p>
                  <ul className="space-y-2">
                    {pickerList.map((product) => (
                      <ProductRow key={product.id} product={product} adding={addingId === product.id} locked={busy} onAdd={() => void addStep(product)} />
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t p-4 sm:px-6" style={{ borderColor: C.border, background: C.bg }}>
              <p className="text-xs" style={{ color: C.muted }}>
                {addedCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: C.primary }}>
                    <CheckCircle2 size={14} /> {addedCount} added to {periodLabel(picker.time).toLowerCase()}
                  </span>
                ) : (
                  `Adding to your ${periodLabel(picker.time).toLowerCase()} routine`
                )}
              </p>
              <button type="button" onClick={closePicker} className="rt-press rounded-xl px-5 py-2.5 text-xs font-semibold text-white hover:brightness-110" style={{ background: C.primary }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && active && (
        <ConfirmDialog
          title={`Delete "${active.name}"?`}
          body="This removes the routine and its progress history. This can't be undone."
          confirmLabel="Delete routine"
          busy={deleting}
          onConfirm={() => void deleteRoutine()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </PageShell>
  );
}