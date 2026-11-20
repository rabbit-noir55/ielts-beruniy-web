import { useState } from "react";
import { Link } from "react-router-dom";
import { isMuted, setMuted, sfx } from "./audio";

/**
 * Barcha ichki o'yinlar uchun umumiy qobiq: sarlavha, ball, rekord,
 * ovoz va qayta boshlash tugmalari.
 */
export default function GameShell({
  title,
  tagline,
  score,
  best,
  isDark,
  onRestart,
  right,
  children,
  className = "",
}) {
  const [muted, setMutedState] = useState(isMuted());

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx("click");
  };

  return (
    <div
      className={`min-h-screen px-4 pt-24 pb-10 ${
        isDark ? "bg-[#08080A] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/games"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                isDark
                  ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  : "border-black/10 bg-white hover:bg-black/[0.04]"
              }`}
              aria-label="O'yinlarga qaytish"
            >
              ←
            </Link>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">{title}</h1>
              {tagline && (
                <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                  {tagline}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`rounded-xl border px-3 py-1.5 text-center ${
                isDark ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white"
              }`}
            >
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/35" : "text-black/35"}`}>
                Ball
              </div>
              <div className="text-base font-extrabold tabular-nums">{score}</div>
            </div>
            <div
              className={`rounded-xl border px-3 py-1.5 text-center ${
                isDark ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white"
              }`}
            >
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/35" : "text-black/35"}`}>
                Rekord
              </div>
              <div className="text-base font-extrabold tabular-nums">{best}</div>
            </div>
            {right}
            <button
              type="button"
              onClick={toggleMute}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-base ${
                isDark
                  ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  : "border-black/10 bg-white hover:bg-black/[0.04]"
              }`}
              aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              title={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
            {onRestart && (
              <button
                type="button"
                onClick={() => {
                  sfx("click");
                  onRestart();
                }}
                className="inline-flex h-10 items-center rounded-xl bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                Qayta
              </button>
            )}
          </div>
        </div>

        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
