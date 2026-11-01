import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

const AUDIO_URL = "/audio.mp3";
const START_DELAY = 12;
// Animatsiya audio'dan 0.2s oldin boshlanadi (kechikishni qoplash)
const TIMELINE_LEAD = 0.2;
const BEAT_GAP = 0.55;
const BOX_DURATION_MS = 450;
const FADE_END_BUFFER = 1.4;

const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function getScrollParent(el) {
  let node = el.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

export default function TypingRevealModal({ isOpen, onClose, leaderboard, myRank }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  // Audio haqiqatan boshlanganda vaqt shu paytdan hisoblanadi
  const [audioLive, setAudioLive] = useState(false);

  const rafRef = useRef(null);
  const firedRef = useRef(new Set());
  const startPerfRef = useRef(0);
  const audioPausedRef = useRef(false);
  const boxRefs = useRef([]);
  const scrollRafRef = useRef(null);
  const audioRef = useRef(null);

  const ranked = useMemo(() => [...(leaderboard || [])].slice(0, 20), [leaderboard]);
  const topN = ranked.length;

  const beatTimes = useMemo(
    () => Array.from({ length: topN }, (_, i) => START_DELAY + i * BEAT_GAP),
    [topN],
  );
  const fadeStartTime = useMemo(
    () => (topN > 0 ? beatTimes[topN - 1] : 0),
    [beatTimes, topN],
  );
  const fadeEndTime = useMemo(
    () => (topN > 0 ? (beatTimes[topN - 1] || START_DELAY) + FADE_END_BUFFER : 0),
    [beatTimes, topN],
  );

  // ESC bilan yopish
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // tick — faqat ref'lar va constant'lardan foydalanadi, closure muammosi yo'q
  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = () => {
    // Vaqt audiodan olinadi — audio kechroq boshlansa ham animatsiya
    // u bilan birga boshlanadi (0.2s siljish yo'qoladi).
    const audioNow = audioRef.current;
    const elapsed =
      (audioLive && audioNow && audioNow.currentTime > 0
        ? audioNow.currentTime
        : (performance.now() - startPerfRef.current) / 1000) + TIMELINE_LEAD;
    setLoadProgress(Math.min(100, (elapsed / START_DELAY) * 100));

    if (elapsed >= START_DELAY) {
      setPhase((p) => (p === "loading" ? "revealing" : p));
    }

    beatTimes.forEach((bt, i) => {
      if (elapsed >= bt && !firedRef.current.has(i)) {
        firedRef.current.add(i);
        setVisibleCount((c) => Math.max(c, i + 1));
      }
    });

    // Audio fade out
    const audio = audioRef.current;
    if (audio && AUDIO_URL && elapsed >= fadeStartTime && !audioPausedRef.current) {
      const span = fadeEndTime - fadeStartTime;
      const prog = span > 0 ? Math.min(1, (elapsed - fadeStartTime) / span) : 1;
      audio.volume = Math.max(0, Math.min(1, (1 - prog) ** 2));
      if (prog >= 1) {
        audio.volume = 0;
        audio.pause();
        audioPausedRef.current = true;
      }
    }

    const beatsLeft = firedRef.current.size < beatTimes.length;
    const fadeLeft = audio && AUDIO_URL && !audioPausedRef.current;

    if (beatsLeft || fadeLeft) {
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    } else {
      setPhase("done");
    }
    };
  });

  // Modal ochilganda avtomatik boshlash
  useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(0);
    setRunId((r) => r + 1);
    setLoadProgress(0);
    setAudioLive(false);
    firedRef.current = new Set();
    boxRefs.current = [];

    // Bo'sh leaderboard: 12 soniya "LOADING" ko'rsatishning ma'nosi yo'q.
    if (topN === 0) {
      setPhase("idle");
      const audio = audioRef.current;
      if (audio) { audio.pause(); audio.currentTime = 0; }
      return;
    }

    setPhase("loading");
    startPerfRef.current = performance.now();
    audioPausedRef.current = false;

    const audio = audioRef.current;
    if (audio && AUDIO_URL) {
      audio.currentTime = 0;
      audio.volume = 1;
      audio.play().catch((err) => console.warn('Audio play failed:', err.message));
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => tickRef.current());

    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(scrollRafRef.current);
      if (audio) { audio.pause(); audio.currentTime = 0; }
    };
  }, [isOpen, topN, beatTimes, fadeStartTime, fadeEndTime]);

  // Audio boshlanmasa ham (autoplay bloklangan bo'lsa) animatsiya ishlashi uchun
  useEffect(() => {
    if (!isOpen || audioLive) return;
    const t = setTimeout(() => setAudioLive(true), 800);
    return () => clearTimeout(t);
  }, [isOpen, audioLive]);

  // Auto-scroll
  useEffect(() => {
    if (visibleCount === 0) return;
    const el = boxRefs.current[visibleCount - 1];
    if (!el) return;

    const scrollParent = getScrollParent(el);
    const isWindowScroll =
      scrollParent === document.scrollingElement ||
      scrollParent === document.documentElement;

    const parentBottom = isWindowScroll
      ? window.innerHeight
      : scrollParent.getBoundingClientRect().bottom;
    const elBottom = el.getBoundingClientRect().bottom;
    const overflowBottom = elBottom - parentBottom + 16;

    if (overflowBottom > 0) {
      const duration = Math.max(BEAT_GAP * 1000 * 0.9, 250);
      cancelAnimationFrame(scrollRafRef.current);
      const startPos = isWindowScroll ? window.scrollY : scrollParent.scrollTop;
      const change = overflowBottom;
      const startTime = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const pos = startPos + change * easeInOutQuad(t);
        if (isWindowScroll) {
          window.scrollTo(0, pos);
        } else {
          scrollParent.scrollTop = pos;
        }
        if (t < 1) scrollRafRef.current = requestAnimationFrame(step);
      };
      scrollRafRef.current = requestAnimationFrame(step);
    }
  }, [visibleCount]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm qz-fade-in"
        onClick={onClose}
      />

      <div
        className="relative z-10 mx-4 flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0B] shadow-2xl qz-scale-in"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-extrabold text-white">TYPING LEADERBOARD</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-1.5 text-sm text-white/60 transition hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto p-5" style={{ background: "#000", minHeight: 400 }}>
          <style>{`
            @keyframes tr-boxHit {
              0%   { opacity: 0; transform: translateX(-220px); }
              55%  { opacity: 1; transform: translateX(6px); }
              68%  { transform: translateX(-5px); }
              78%  { transform: translateX(3px); }
              88%  { transform: translateX(-1.5px); }
              100% { opacity: 1; transform: translateX(0); }
            }
            @keyframes tr-hitFlash {
              0%   { opacity: 0.7; }
              100% { opacity: 0; }
            }
            @keyframes tr-microShake {
              0%   { transform: translate(0, 0); }
              20%  { transform: translate(-4px, 2px); }
              40%  { transform: translate(4px, -2px); }
              60%  { transform: translate(-3px, 1px); }
              80%  { transform: translate(2px, -1px); }
              100% { transform: translate(0, 0); }
            }
            @keyframes tr-glitchJitter {
              0%, 100% { transform: translate(0,0); }
              20% { transform: translate(-3px, 2px); }
              40% { transform: translate(3px, -1px); }
              60% { transform: translate(-2px, -2px); }
              80% { transform: translate(2px, 1px); }
            }
            @keyframes tr-glitchClip1 {
              0%, 100% { clip-path: inset(0 0 85% 0); transform: translateX(0); }
              10% { clip-path: inset(10% 0 60% 0); transform: translateX(-6px); }
              30% { clip-path: inset(40% 0 20% 0); transform: translateX(5px); }
              50% { clip-path: inset(70% 0 5% 0); transform: translateX(-4px); }
              70% { clip-path: inset(20% 0 50% 0); transform: translateX(3px); }
              90% { clip-path: inset(55% 0 10% 0); transform: translateX(-2px); }
            }
            @keyframes tr-glitchClip2 {
              0%, 100% { clip-path: inset(80% 0 5% 0); transform: translateX(0); }
              15% { clip-path: inset(5% 0 75% 0); transform: translateX(5px); }
              35% { clip-path: inset(50% 0 30% 0); transform: translateX(-5px); }
              55% { clip-path: inset(15% 0 65% 0); transform: translateX(4px); }
              75% { clip-path: inset(60% 0 15% 0); transform: translateX(-3px); }
              95% { clip-path: inset(25% 0 45% 0); transform: translateX(2px); }
            }
            @keyframes tr-scanline {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
            @keyframes tr-flicker {
              0%, 100% { opacity: 1; }
              45% { opacity: 1; }
              46% { opacity: 0.3; }
              47% { opacity: 1; }
              70% { opacity: 1; }
              71% { opacity: 0.4; }
              72% { opacity: 1; }
            }
            .tr-box { animation: tr-boxHit ${BOX_DURATION_MS}ms cubic-bezier(.16,1,.3,1) both; }
            .tr-flash { animation: tr-hitFlash 180ms ease-out both; }
            .tr-shake-inner { animation: tr-microShake 220ms ease-out; }
            .tr-glitch-text { position: relative; }
            .tr-glitch-text::before, .tr-glitch-text::after {
              content: attr(data-text);
              position: absolute; left: 0; top: 0; width: 100%;
            }
            .tr-glitch-text::before { animation: tr-glitchClip1 1.6s infinite linear; }
            .tr-glitch-text::after { animation: tr-glitchClip2 1.9s infinite linear; }
          `}</style>

          {AUDIO_URL && (
            <audio
              ref={audioRef}
              src={AUDIO_URL}
              onPlaying={() => setAudioLive(true)}
              onEnded={() => setPhase("done")}
            />
          )}

          {phase === "loading" && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center"
              style={{ background: "#000" }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px)",
                }}
              />
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div
                  style={{
                    width: "100%",
                    height: 32,
                    background: "rgba(255,255,255,0.4)",
                    animation: "tr-scanline 2.4s linear infinite",
                  }}
                />
              </div>
              <span
                data-text="LOADING"
                className="tr-glitch-text"
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: "#fff",
                  animation: "tr-flicker 2.2s infinite, tr-glitchJitter 0.25s infinite",
                }}
              >
                LOADING
              </span>
              <span style={{ marginTop: 12, fontSize: 12, color: "#777", letterSpacing: 4 }}>
                TOP {topN} YUKLANMOQDA
              </span>
              <div
                key={runId}
                style={{
                  marginTop: 24,
                  width: 224,
                  height: 8,
                  borderRadius: 999,
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: loadProgress + "%",
                    backgroundColor: "#ffffff",
                    borderRadius: 999,
                  }}
                />
              </div>
              <span style={{ marginTop: 8, fontSize: 11, color: "#777" }}>
                {Math.round(loadProgress)}%
              </span>
            </div>
          )}

          {(phase === "revealing" || phase === "done") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ranked.slice(0, visibleCount).map((entry, idx) => {
                const isNewest = idx === visibleCount - 1;
                const isMe = myRank && entry.student_id === myRank.student_id;
                const medal =
                  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

                return (
                  <div
                    key={`${runId}-${entry.student_id}-${idx}`}
                    ref={(node) => { boxRefs.current[idx] = node; }}
                    className="tr-box"
                    style={{
                      position: "relative",
                      background: isMe ? "rgba(99,102,241,0.18)" : "#111113",
                      border: isMe
                        ? "1px solid rgba(99,102,241,0.5)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="tr-flash"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: isMe ? "var(--accent, #6366f1)" : "rgba(255,255,255,0.08)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      key={isNewest ? "static" : `shake-${visibleCount}`}
                      className={isNewest ? "" : "tr-shake-inner"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: medal ? "transparent" : "#1a1a1e",
                          border: medal ? "none" : "1px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: medal ? 20 : 12,
                          fontWeight: 700,
                          color: "#ccc",
                          flexShrink: 0,
                        }}
                      >
                        {medal || idx + 1}
                      </div>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isMe ? "#6366f1" : "#1a1a1e",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {entry.name?.slice(0, 2).toUpperCase() || "??"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entry.name}
                          {isMe && (
                            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#fff" }}>
                              (sen)
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                          {entry.wpm}{" "}
                          <span style={{ fontSize: 11, fontWeight: 400, color: "#777" }}>wpm</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#4ade80" }}>{entry.accuracy}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {phase === "idle" && ranked.length === 0 && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-center">
              <div className="text-3xl opacity-30">🏆</div>
              <div className="text-sm font-bold text-white/70">
                Hali natija yo'q
              </div>
              <div className="text-xs text-white/40">
                Birinchi bo'lib yozib, leaderboardni boshlang.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <span className="text-xs text-white/40">Alt+A bilan ochish · ESC bilan yopish</span>
          {myRank && (
            <span className="text-xs font-bold text-white/60">
              Sen: #{myRank.rank} · {myRank.wpm} WPM
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
