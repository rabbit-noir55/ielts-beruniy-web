import { useEffect } from "react";

/* ── Panel ─────────────────────────────────────────────────────────────── */

export function Panel({ isDark, title, desc, actions, children, className = "" }) {
  const rule = isDark ? "border-white/10" : "border-black/10";
  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-sm ${rule} ${
        isDark ? "bg-white/[0.025]" : "bg-white"
      } ${className}`}
    >
      {(title || actions) && (
        <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${rule}`}>
          <div>
            {title && <h2 className="text-sm font-extrabold tracking-tight">{title}</h2>}
            {desc && (
              <p className={`mt-0.5 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>{desc}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* ── Page header ───────────────────────────────────────────────────────── */

export function PageHeader({ title, desc, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-xs opacity-50">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ── Tugma ─────────────────────────────────────────────────────────────── */

export function Btn({
  isDark,
  variant = "ghost",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const base =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 disabled:opacity-40 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
      : variant === "danger"
        ? "border border-red-500/40 text-red-500 hover:bg-red-500/10"
        : variant === "soft"
          ? isDark
            ? "bg-white/[0.06] text-white/75 hover:bg-white/[0.1]"
            : "bg-black/[0.05] text-black/65 hover:bg-black/[0.08]"
          : isDark
            ? "border border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
            : "border border-black/15 text-black/65 hover:bg-black/5 hover:text-black";
  return (
    <button
      type={type}
      className={`${base} ${styles} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

/* ── Maydon ────────────────────────────────────────────────────────────── */

export function Field({ isDark, label, hint, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-black/40"}`}>
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className={`text-[11px] ${isDark ? "text-white/35" : "text-black/35"}`}>{hint}</span>
      )}
      {error && <span className="text-[11px] font-semibold text-red-500">{error}</span>}
    </label>
  );
}

/* ── Bo'sh holat / spinner ─────────────────────────────────────────────── */

export function Empty({ isDark, children }) {
  return (
    <div className={`px-4 py-12 text-center text-sm ${isDark ? "text-white/35" : "text-black/35"}`}>
      {children}
    </div>
  );
}

export function Spinner({ isDark, label = "Yuklanmoqda…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
      <span
        className={`h-6 w-6 animate-spin rounded-full border-2 border-t-transparent ${
          isDark ? "border-white/30" : "border-black/20"
        }`}
        aria-hidden="true"
      />
      <span className={`text-sm ${isDark ? "text-white/35" : "text-black/35"}`}>{label}</span>
    </div>
  );
}

export function SkeletonRows({ isDark, rows = 5, cols = 4 }) {
  const rule = isDark ? "border-white/[0.07]" : "border-black/[0.07]";
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? `border-t ${rule}` : ""}`}>
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className={`h-4 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-black/10"}`}
              style={{ width: j === 0 ? 160 : j === cols - 1 ? 90 : 120 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500">
      {children}
    </div>
  );
}

/* ── Badge ─────────────────────────────────────────────────────────────── */

export function Badge({ isDark, tone = "neutral", dot = false, children }) {
  const tones = {
    neutral: isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/55",
    green: "border-emerald-500/35 bg-emerald-500/10 text-emerald-500",
    red: "border-red-500/35 bg-red-500/10 text-red-500",
    amber: "border-amber-500/35 bg-amber-500/10 text-amber-500",
    blue: "border-sky-500/35 bg-sky-500/10 text-sky-500",
    accent: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
  };
  const dotColors = {
    neutral: "bg-current",
    green: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-sky-500",
    accent: "bg-[var(--accent)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tones[tone] || tones.neutral}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[tone] || dotColors.neutral}`} />}
      {children}
    </span>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────── */

export function Modal({ isDark, open, title, desc, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const rule = isDark ? "border-white/10" : "border-black/10";
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Oyna"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl ${sizes[size] || sizes.md} ${rule} ${
          isDark ? "bg-[#111113] text-[#F5F5F5]" : "bg-white text-[#17171A]"
        }`}
      >
        <header className={`flex items-start justify-between gap-3 border-b px-5 py-3.5 ${rule}`}>
          <div>
            {title && <h2 className="text-sm font-extrabold">{title}</h2>}
            {desc && (
              <p className={`mt-0.5 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>{desc}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className={`-mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-lg leading-none ${
              isDark ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"
            }`}
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className={`flex flex-wrap justify-end gap-2 border-t px-5 py-3 ${rule}`}>{footer}</footer>
        )}
      </div>
    </div>
  );
}

/* ── Jadval sarlavhasi ─────────────────────────────────────────────────── */

export function Th({ children, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider opacity-40 ${className}`}>
      {children}
    </th>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

export function Tabs({ isDark, tabs, value, onChange, label = "Bo'limlar" }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[11px] font-bold transition ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : isDark
                  ? "bg-white/[0.06] text-white/55 hover:bg-white/[0.1]"
                  : "bg-black/[0.05] text-black/55 hover:bg-black/[0.09]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-black/15" : isDark ? "bg-white/10" : "bg-black/10"}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Stat karta ────────────────────────────────────────────────────────── */

export function StatCard({ isDark, label, value, hint, tone = "accent" }) {
  const tones = {
    accent: "text-[var(--accent)] bg-[var(--accent)]/10",
    green: "text-emerald-500 bg-emerald-500/10",
    blue: "text-sky-500 bg-sky-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  };
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.025]" : "border-black/[0.08] bg-white"}`}>
      <div className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold tabular-nums">{value}</div>
      {hint && <div className={`mt-0.5 text-[11px] ${isDark ? "text-white/35" : "text-black/35"}`}>{hint}</div>}
    </div>
  );
}
