import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

// Alt+M bilan ochiladigan ikkinchi leaderboard modali.
// Audio2 (97.5 BPM) bilan sinxron: qatorlar baraban zarbasida pastdan
// ko'tarilib chiqadi, ismlar shu zarbada tebranadi, ranglar ham zarbada
// "nafas oladi". Dizayn — aurora/gradient uslubi (birinchi modaldan farqli).

const AUDIO_URL = "/audio2.m4a";
// audio2.m4a tahlili (kick-drum): ~97.5 BPM — zarba har 616.7 ms da.
// Birinchi zarba 128.4 ms da, keyin 128.4 + k*616.7 ms.
const BEAT_PERIOD = 0.6167;
const BEAT_OFFSET = 0.1284;
const START_DELAY = 4.8; // birinchi qator chiqadigan vaqt (audio 4.8s)
const BEAT_GAP = BEAT_PERIOD;
const MAX_ROWS = 10;
const ROW_DURATION_MS = 600;
const FADE_END_BUFFER = 1.4;
// Tebranish tsikli = bitta baraban zarbasi
const BOB_MS = Math.round(BEAT_PERIOD * 1000);
// Cho'qqi (62%) baraban zarbasiga tushishi uchun manfiy kechikish
const BOB_DELAY_MS = -Math.round((0.62 * BEAT_PERIOD - BEAT_OFFSET) * 1000);
const BOB_PX = 12;

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

// Rank bo'yicha gradient juftliklari (audio palitrasi: cyan / violet / pink / amber)
const RANK_GRADIENTS = [
  ["#FBBF24", "#F97316"],
  ["#A5F3FC", "#22D3EE"],
  ["#F9A8D4", "#F472B6"],
];

export default function TypingRevealModalBottom({ isOpen, onClose, leaderboard, myRank }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  // Audio haqiqatan boshlanganda tebranish ham o'sha paytdan hisoblanadi
  const [audioLive, setAudioLive] = useState(false);

  const rafRef = useRef(null);
  const firedRef = useRef(new Set());
  const startPerfRef = useRef(0);
  const audioPausedRef = useRef(false);
  const boxRefs = useRef([]);
  const scrollRafRef = useRef(null);
  const audioRef = useRef(null);

  const ranked = useMemo(
    () => [...(leaderboard || [])].slice(0, MAX_ROWS),
    [leaderboard],
  );
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
    () => (topN > 0 ? beatTimes[topN - 1] + FADE_END_BUFFER : 0),
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

  // tick — ref'lar va konstantalardan foydalanadi
  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = () => {
      // Vaqt audiodan olinadi — shunda qatorlar va tebranish baraban
      // zarbalariga aniq tushadi. Audio ishlamasa — performance.now.
      const audioEl = audioRef.current;
      const elapsed =
        audioLive && audioEl && audioEl.currentTime > 0
          ? audioEl.currentTime
          : (performance.now() - startPerfRef.current) / 1000;
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

    if (topN === 0) {
      setPhase("idle");
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }

    setPhase("loading");
    startPerfRef.current = performance.now();
    audioPausedRef.current = false;

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 1;
      audio.play().catch((err) => console.warn("Audio play failed:", err.message));
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => tickRef.current());

    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(scrollRafRef.current);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [isOpen, topN, beatTimes, fadeStartTime, fadeEndTime]);

  // Audio boshlanmasa ham (autoplay bloklangan bo'lsa) tebranish ishlashi uchun
  useEffect(() => {
    if (!isOpen || audioLive) return;
    const t = setTimeout(() => setAudioLive(true), 800);
    return () => clearTimeout(t);
  }, [isOpen, audioLive]);

  // Auto-scroll — yangi qator pastdan chiqqanda ko'rinadigan joyga suriladi
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

  const titleGradient =
    "linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6, #fbbf24, #22d3ee)";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md qz-fade-in"
        onClick={onClose}
      />

      <div
        className="relative z-10 mx-4 flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_120px_-20px_rgba(34,211,238,0.35)]"
        style={{
          background:
            "linear-gradient(160deg, #0B0A15 0%, #07060C 55%, #0B0713 100%)",
          animation: audioLive
            ? `qz-scale-in 0.25s ease-out both, tr2-beat ${BOB_MS}ms linear ${BOB_DELAY_MS}ms infinite`
            : "qz-scale-in 0.25s ease-out both",
        }}
      >
        {/* Aurora fon — zarbada nafas oladi */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ animation: "tr2-hue 22s linear infinite" }}
        >
          <div
            style={{
              position: "absolute",
              top: "-30%",
              left: "-18%",
              width: "78%",
              height: "72%",
              background:
                "radial-gradient(circle, rgba(34,211,238,0.55), transparent 62%)",
              filter: "blur(70px)",
              opacity: "calc(0.30 + 0.40 * var(--tr2-pulse, 0))",
              animation: "tr2-drift 13s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-34%",
              right: "-18%",
              width: "82%",
              height: "74%",
              background:
                "radial-gradient(circle, rgba(139,92,246,0.60), transparent 62%)",
              filter: "blur(80px)",
              opacity: "calc(0.28 + 0.38 * var(--tr2-pulse, 0))",
              animation: "tr2-drift 17s ease-in-out infinite reverse",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "28%",
              right: "-12%",
              width: "58%",
              height: "58%",
              background:
                "radial-gradient(circle, rgba(244,114,182,0.50), transparent 60%)",
              filter: "blur(70px)",
              opacity: "calc(0.22 + 0.34 * var(--tr2-pulse, 0))",
              animation: "tr2-drift 21s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              left: "12%",
              width: "52%",
              height: "46%",
              background:
                "radial-gradient(circle, rgba(251,191,36,0.42), transparent 62%)",
              filter: "blur(65px)",
              opacity: "calc(0.16 + 0.30 * var(--tr2-pulse, 0))",
              animation: "tr2-drift 15s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div
          className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4"
          style={{ background: "rgba(8,7,14,0.55)" }}
        >
          <h2
            className="text-base font-extrabold tracking-wide"
            style={{
              background: titleGradient,
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              animation: "tr2-shimmer 5s linear infinite",
            }}
          >
            TOP {Math.min(topN || MAX_ROWS, MAX_ROWS)} · TYPING
          </h2>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22d3ee",
                boxShadow:
                  "0 0 calc(6px + 18px * var(--tr2-pulse, 0)) rgba(34,211,238,0.9)",
                opacity: "calc(0.55 + 0.45 * var(--tr2-pulse, 0))",
              }}
            />
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-1.5 text-sm text-white/60 transition hover:bg-white/15 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="relative z-10 flex-1 overflow-y-auto p-5"
          style={{ minHeight: 420 }}
        >
          <style>{`
            @property --tr2-bob {
              syntax: "<length>";
              inherits: true;
              initial-value: 0px;
            }
            @property --tr2-pulse {
              syntax: "<number>";
              inherits: true;
              initial-value: 0;
            }
            @keyframes tr2-beat {
              /* 1) o'z joyida kutadi */
              0%, 16% {
                --tr2-bob: 0px;
                --tr2-pulse: 0;
                animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
              }
              /* 2) sekin boshlanib, tez tugab yuqoriga chiqadi */
              62% {
                --tr2-bob: -${BOB_PX}px;
                --tr2-pulse: 1;
                animation-timing-function: cubic-bezier(0.2, 0, 0.35, 1);
              }
              /* 3) tez orqaga qaytadi va 4) yana kutadi */
              76%, 100% {
                --tr2-bob: 0px;
                --tr2-pulse: 0;
              }
            }
            @keyframes tr2-drift {
              0%, 100% { transform: translate3d(-4%, -3%, 0) scale(1); }
              50%      { transform: translate3d(5%, 4%, 0) scale(1.18); }
            }
            @keyframes tr2-hue {
              0%   { filter: hue-rotate(0deg); }
              100% { filter: hue-rotate(360deg); }
            }
            @keyframes tr2-shimmer {
              0%   { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
            @keyframes tr2-in-left {
              0%   { opacity: 0; transform: translateX(-46px) scale(0.975); filter: blur(5px); }
              62%  { opacity: 1; transform: translateX(5px) scale(1.004); filter: blur(0); }
              100% { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes tr2-in-right {
              0%   { opacity: 0; transform: translateX(46px) scale(0.975); filter: blur(5px); }
              62%  { opacity: 1; transform: translateX(-5px) scale(1.004); filter: blur(0); }
              100% { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes tr2-flash {
              0%   { opacity: 0.55; }
              100% { opacity: 0; }
            }
            @keyframes tr2-ring {
              0%   { transform: scale(0.85); opacity: 0.55; }
              100% { transform: scale(1.9); opacity: 0; }
            }
            @keyframes tr2-riseText {
              0%   { opacity: 0; transform: translateY(18px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes tr2-barSheen {
              0%   { transform: translateX(-120%); }
              100% { transform: translateX(320%); }
            }
            .tr2-row { opacity: 0; }
            .tr2-row-left { animation: tr2-in-left ${ROW_DURATION_MS}ms cubic-bezier(.16,1,.3,1) both; }
            .tr2-row-right { animation: tr2-in-right ${ROW_DURATION_MS}ms cubic-bezier(.16,1,.3,1) both; }
            .tr2-flash { animation: tr2-flash 220ms ease-out both; }
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
              style={{ background: "rgba(6,5,10,0.55)", backdropFilter: "blur(6px)" }}
            >
              <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
                {[0, 1].map((k) => (
                  <span
                    key={k}
                    aria-hidden
                    style={{
                      position: "absolute",
                      width: 190 + k * 46,
                      height: 190 + k * 46,
                      borderRadius: "50%",
                      border: `1px solid ${k ? "rgba(244,114,182,0.45)" : "rgba(34,211,238,0.5)"}`,
                      opacity: "calc(0.55 - 0.35 * var(--tr2-pulse, 0))",
                      transform:
                        "scale(calc(0.9 + 0.35 * var(--tr2-pulse, 0)))",
                    }}
                  />
                ))}
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    letterSpacing: 6,
                    background: titleGradient,
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    animation: "tr2-shimmer 4s linear infinite",
                  }}
                >
                  TOP {topN}
                </span>
              </div>
              <span
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  letterSpacing: 5,
                  color: "rgba(255,255,255,0.55)",
                  animation: "tr2-riseText 700ms ease-out both",
                }}
              >
                TAYYORLANMOQDA
              </span>
              <div
                key={runId}
                style={{
                  marginTop: 24,
                  width: 240,
                  height: 8,
                  borderRadius: 999,
                  overflow: "hidden",
                  position: "relative",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: loadProgress + "%",
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6, #fbbf24)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
                    animation: "tr2-barSheen 1.8s linear infinite",
                  }}
                />
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {Math.round(loadProgress)}%
              </span>
            </div>
          )}

          {(phase === "revealing" || phase === "done") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ranked.slice(0, visibleCount).map((entry, idx) => {
                const isMe = myRank && entry.student_id === myRank.student_id;
                const medal =
                  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                const pair =
                  RANK_GRADIENTS[idx] ||
                  (isMe ? ["#8B5CF6", "#22D3EE"] : ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.05)"]);
                const glow = isMe
                  ? "rgba(139,92,246,0.55)"
                  : idx < 3
                    ? `${pair[1]}66`
                    : "rgba(255,255,255,0.10)";

                return (
                  <div
                    key={`${runId}-${entry.student_id}-${idx}`}
                    ref={(node) => {
                      boxRefs.current[idx] = node;
                    }}
                    className={`tr2-row ${idx % 2 === 0 ? "tr2-row-left" : "tr2-row-right"}`}
                    style={{
                      position: "relative",
                      padding: 1,
                      borderRadius: 14,
                      background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
                      boxShadow: `0 0 calc(6px + 20px * var(--tr2-pulse, 0)) ${glow}`,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 13,
                        padding: "12px 16px",
                        overflow: "hidden",
                        background: isMe
                          ? "linear-gradient(135deg, rgba(76,29,149,0.70), rgba(8,7,14,0.94))"
                          : "linear-gradient(180deg, rgba(19,17,30,0.92), rgba(9,8,15,0.96))",
                      }}
                    >
                      <div
                        className="tr2-flash"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(90deg, transparent, ${pair[1]}, transparent)`,
                          opacity: 0.25,
                          pointerEvents: "none",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: medal
                              ? "transparent"
                              : "rgba(255,255,255,0.06)",
                            border: medal
                              ? "none"
                              : "1px solid rgba(255,255,255,0.10)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: medal ? 20 : 12,
                            fontWeight: 700,
                            color: "#cbd5e1",
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
                            background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
                            color: "#0b0713",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {entry.name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: "inline-block",
                              maxWidth: "100%",
                              transform: "translateY(var(--tr2-bob, 0px))",
                              willChange: "transform",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                fontSize: 14,
                                fontWeight: 500,
                                color: "#f8fafc",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {entry.name}
                              {isMe && (
                                <span
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: 0.5,
                                    color: "#a5f3fc",
                                  }}
                                >
                                  (sen)
                                </span>
                              )}
                            </span>
                          </span>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#f8fafc",
                            }}
                          >
                            {entry.wpm}{" "}
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 400,
                                color: "rgba(255,255,255,0.45)",
                              }}
                            >
                              wpm
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#5eead4",
                              fontWeight: 600,
                            }}
                          >
                            {entry.accuracy}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {phase === "idle" && ranked.length === 0 && (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center">
              <div className="text-3xl opacity-40">🏆</div>
              <div className="text-sm font-bold text-white/80">
                Hali natija yo'q
              </div>
              <div className="text-xs text-white/40">
                Birinchi bo'lib yozib, leaderboardni boshlang.
              </div>
            </div>
          )}
        </div>

        <div
          className="relative z-10 flex items-center justify-between border-t border-white/10 px-5 py-3"
          style={{ background: "rgba(8,7,14,0.55)" }}
        >
          <span className="text-xs text-white/40">
            Alt+M bilan ochish · ESC bilan yopish
          </span>
          {myRank && (
            <span
              className="text-xs font-bold"
              style={{
                background: titleGradient,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation: "tr2-shimmer 5s linear infinite",
              }}
            >
              Sen: #{myRank.rank} · {myRank.wpm} WPM
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
