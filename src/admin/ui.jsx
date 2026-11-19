export function Panel({ isDark, title, desc, actions, children, className = "" }) {
  const rule = isDark ? "border-white/10" : "border-black/10";
  return (
    <section className={`rounded-xl border ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"} ${className}`}>
      {(title || actions) && (
        <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${rule}`}>
          <div>
            {title && <h2 className="text-sm font-extrabold">{title}</h2>}
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

export function Btn({ isDark, variant = "ghost", loading = false, disabled, className = "", children, ...props }) {
  const base =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
      : variant === "danger"
        ? "border border-red-500/40 text-red-500 hover:bg-red-500/10"
        : isDark
          ? "border border-white/15 text-white/70 hover:bg-white/5 hover:text-white"
          : "border border-black/15 text-black/65 hover:bg-black/5 hover:text-black";
  return (
    <button className={`${base} ${styles} ${className}`} disabled={loading || disabled} {...props}>
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function Field({ isDark, label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-black/40"}`}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function Empty({ isDark, children }) {
  return (
    <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-white/35" : "text-black/35"}`}>
      {children}
    </div>
  );
}

export function Spinner({ isDark, label = "Yuklanmoqda…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10">
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

// Jadval yuklanayotganda skeleton qatorlar.
export function SkeletonRows({ isDark, rows = 5, cols = 4 }) {
  const rule = isDark ? "border-white/[0.07]" : "border-black/[0.07]";
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? `border-t ${rule}` : ""}`}>
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
    <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
      {children}
    </div>
  );
}

export function Badge({ isDark, tone = "neutral", children }) {
  const tones = {
    neutral: isDark
      ? "border-white/15 text-white/60"
      : "border-black/15 text-black/55",
    green: "border-emerald-500/35 bg-emerald-500/10 text-emerald-500",
    red: "border-red-500/35 bg-red-500/10 text-red-500",
    accent: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tones[tone] || tones.neutral}`}
    >
      {children}
    </span>
  );
}

export function Modal({ isDark, open, title, desc, onClose, children, footer }) {
  if (!open) return null;
  const rule = isDark ? "border-white/10" : "border-black/10";
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Oyna"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${rule} ${
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
            className={`-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-lg leading-none ${
              isDark ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"
            }`}
          >
            ×
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <footer className={`flex flex-wrap justify-end gap-2 border-t px-5 py-3 ${rule}`}>{footer}</footer>
        )}
      </div>
    </div>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider opacity-40 ${className}`}>
      {children}
    </th>
  );
}
