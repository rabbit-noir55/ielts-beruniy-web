import { useState, useCallback, useRef, useEffect } from "react";

const PLAYERS = [
  { id: 1, name: "Sardor", score: 4820 },
  { id: 2, name: "Jasur", score: 4510 },
  { id: 3, name: "Nodira", score: 4390 },
  { id: 4, name: "Aziz", score: 4105 },
  { id: 5, name: "Malika", score: 3980 },
  { id: 6, name: "Diyor", score: 3740 },
  { id: 7, name: "Kamola", score: 3502 },
  { id: 8, name: "Bekzod", score: 3210 },
  { id: 9, name: "Zarina", score: 2990 },
  { id: 10, name: "Otabek", score: 2760 },
];

// ============================================================
//  SOZLASH BO'LIMI — faqat shu qismga tegining
// ============================================================
const AUDIO_URL = "audio.mp3";
const TOP_N = PLAYERS.length; // dinamik: PLAYERS massividan avtomatik olinadi
const START_DELAY = 12;
const BEAT_GAP = 0.55;
const BOX_DURATION_MS = 500;
const FADE_START_BEAT = TOP_N; // audio doim ENG OXIRGI odam chiqqanda o'chira boshlaydi
const FADE_END_BUFFER = 1.4;
const SCROLL_BOTTOM_PADDING = 16; // yangi quti pastdan qancha bo'shliq bilan ko'rinsin
// ============================================================

const BEAT_TIMES = PLAYERS.slice(0, TOP_N).map(
  (_, i) => START_DELAY + i * BEAT_GAP,
);
const FADE_START_TIME = BEAT_TIMES[Math.min(FADE_START_BEAT, TOP_N) - 1];
const FADE_END_TIME = BEAT_TIMES[TOP_N - 1] + FADE_END_BUFFER;

const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Elementning eng yaqin skroll bo'ladigan ota-konteynerini topadi.
// Topilmasa, sahifaning o'zi (window) qaytariladi.
function getScrollParent(el) {
  let node = el.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (
      /(auto|scroll)/.test(style.overflowY) &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

export default function BoxRevealSynced() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | loading | revealing | done
  const [loadProgress, setLoadProgress] = useState(0);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const firedRef = useRef(new Set());
  const startPerfRef = useRef(0);
  const audioPausedRef = useRef(false);

  const boxRefs = useRef([]);
  const scrollRafRef = useRef(null);

  const ranked = [...PLAYERS].sort((a, b) => b.score - a.score).slice(0, TOP_N);

  const tick = useCallback(function tickLoop() {
    const audio = audioRef.current;
    const elapsed =
      audio && AUDIO_URL
        ? audio.currentTime
        : (performance.now() - startPerfRef.current) / 1000;

    setLoadProgress(Math.min(100, (elapsed / START_DELAY) * 100));

    setPhase((p) =>
      elapsed >= START_DELAY && p === "loading" ? "revealing" : p,
    );

    BEAT_TIMES.forEach((beatTime, i) => {
      if (elapsed >= beatTime && !firedRef.current.has(i)) {
        firedRef.current.add(i);
        setVisibleCount((c) => Math.max(c, i + 1));
      }
    });

    if (
      audio &&
      AUDIO_URL &&
      elapsed >= FADE_START_TIME &&
      !audioPausedRef.current
    ) {
      const span = FADE_END_TIME - FADE_START_TIME;
      const progress =
        span > 0 ? Math.min(1, (elapsed - FADE_START_TIME) / span) : 1;
      const eased = (1 - progress) ** 2;
      audio.volume = Math.max(0, Math.min(1, eased));
      if (progress >= 1) {
        audio.volume = 0;
        audio.pause();
        audioPausedRef.current = true;
      }
    }

    const beatsLeft = firedRef.current.size < BEAT_TIMES.length;
    const fadeLeft = audio && AUDIO_URL && !audioPausedRef.current;

    if (beatsLeft || fadeLeft) {
      rafRef.current = requestAnimationFrame(tickLoop);
    } else {
      setPhase("done");
    }
  }, []);

  const animateScrollTo = useCallback((getPos, setPos, target, duration) => {
    cancelAnimationFrame(scrollRafRef.current);
    const start = getPos();
    const change = target - start;
    if (Math.abs(change) < 1) return;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      setPos(start + change * easeInOutQuad(t));
      if (t < 1) {
        scrollRafRef.current = requestAnimationFrame(step);
      }
    };
    scrollRafRef.current = requestAnimationFrame(step);
  }, []);

  // Ro'yxat cheklanmagan holda pastga qarab to'liq cho'ziladi (hech qanday
  // fiksirlangan balandlik yo'q). Agar odamlar ko'p bo'lib, yangi quti
  // ko'rinadigan joydan pastda qolib ketsa, uni o'z ichiga olgan haqiqiy
  // skroll konteyner (yoki sahifaning o'zi) SEKIN, bitta "beat" oralig'ida
  // pastga siljiydi — hech narsa qisilib yoki ustma-ust chiqmaydi.
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
    const overflowBottom = elBottom - parentBottom + SCROLL_BOTTOM_PADDING;

    if (overflowBottom > 0) {
      const duration = Math.max(BEAT_GAP * 1000 * 0.9, 250);
      if (isWindowScroll) {
        const target = window.scrollY + overflowBottom;
        animateScrollTo(
          () => window.scrollY,
          (v) => window.scrollTo(0, v),
          target,
          duration,
        );
      } else {
        const target = scrollParent.scrollTop + overflowBottom;
        animateScrollTo(
          () => scrollParent.scrollTop,
          (v) => {
            scrollParent.scrollTop = v;
          },
          target,
          duration,
        );
      }
    }
  }, [visibleCount, animateScrollTo]);

  useEffect(() => () => cancelAnimationFrame(scrollRafRef.current), []);

  const play = useCallback(() => {
    setVisibleCount(0);
    setRunId((r) => r + 1);
    setPhase("loading");
    setLoadProgress(0);
    firedRef.current = new Set();
    startPerfRef.current = performance.now();
    audioPausedRef.current = false;
    boxRefs.current = [];

    const audio = audioRef.current;
    if (audio && AUDIO_URL) {
      audio.currentTime = 0;
      audio.volume = 1;
      audio.play().catch((err) => console.warn('Audio play failed:', err.message));
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        padding: 24,
        borderRadius: 16,
        minHeight: 380,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes boxHit {
          0%   { opacity: 0;   transform: translateX(-220px); }
          55%  { opacity: 1;   transform: translateX(6px); }
          68%  { transform: translateX(-5px); }
          78%  { transform: translateX(3px); }
          88%  { transform: translateX(-1.5px); }
          100% { opacity: 1;   transform: translateX(0); }
        }
        @keyframes hitFlash {
          0%   { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes microShake {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(-4px, 2px); }
          40%  { transform: translate(4px, -2px); }
          60%  { transform: translate(-3px, 1px); }
          80%  { transform: translate(2px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes glitchJitter {
          0%, 100% { transform: translate(0,0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -1px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 1px); }
        }
        @keyframes glitchClip1 {
          0%, 100% { clip-path: inset(0 0 85% 0); transform: translateX(0); }
          10% { clip-path: inset(10% 0 60% 0); transform: translateX(-6px); }
          30% { clip-path: inset(40% 0 20% 0); transform: translateX(5px); }
          50% { clip-path: inset(70% 0 5% 0); transform: translateX(-4px); }
          70% { clip-path: inset(20% 0 50% 0); transform: translateX(3px); }
          90% { clip-path: inset(55% 0 10% 0); transform: translateX(-2px); }
        }
        @keyframes glitchClip2 {
          0%, 100% { clip-path: inset(80% 0 5% 0); transform: translateX(0); }
          15% { clip-path: inset(5% 0 75% 0); transform: translateX(5px); }
          35% { clip-path: inset(50% 0 30% 0); transform: translateX(-5px); }
          55% { clip-path: inset(15% 0 65% 0); transform: translateX(4px); }
          75% { clip-path: inset(60% 0 15% 0); transform: translateX(-3px); }
          95% { clip-path: inset(25% 0 45% 0); transform: translateX(2px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          45% { opacity: 1; }
          46% { opacity: 0.3; }
          47% { opacity: 1; }
          70% { opacity: 1; }
          71% { opacity: 0.4; }
          72% { opacity: 1; }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .box { animation: boxHit ${BOX_DURATION_MS}ms cubic-bezier(.16,1,.3,1) both; }
        .flash { animation: hitFlash 180ms ease-out both; }
        .shake-inner { animation: microShake 220ms ease-out; }
        .glitch-text { position: relative; }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute; left: 0; top: 0; width: 100%;
        }
        .glitch-text::before { animation: glitchClip1 1.6s infinite linear; }
        .glitch-text::after { animation: glitchClip2 1.9s infinite linear; }
        .progress-fill { animation: fillBar ${START_DELAY}s linear forwards; }
      `}</style>

      {AUDIO_URL && (
        <audio
          ref={audioRef}
          src={AUDIO_URL}
          onEnded={() => setPhase("done")}
        />
      )}

      {phase === "idle" && (
        <button
          onClick={play}
          style={{
            marginBottom: 20,
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            fontSize: 14,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Reytingni ochish
        </button>
      )}

      {phase === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.1,
              pointerEvents: "none",
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
              opacity: 0.2,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 32,
                background: "rgba(255,255,255,0.4)",
                animation: "scanline 2.4s linear infinite",
              }}
            />
          </div>
          <span
            data-text="LOADING"
            className="glitch-text"
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#fff",
              animation: "flicker 2.2s infinite, glitchJitter 0.25s infinite",
            }}
          >
            LOADING
          </span>
          <span
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#777",
              letterSpacing: 4,
            }}
          >
            TOP {TOP_N} YUKLANMOQDA
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
              className="progress-fill"
              style={{
                height: "100%",
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
          {ranked.slice(0, visibleCount).map((p, idx) => {
            const isNewest = idx === visibleCount - 1;
            return (
              <div
                key={`${runId}-${p.id}`}
                ref={(node) => {
                  boxRefs.current[idx] = node;
                }}
                className="box"
                style={{
                  position: "relative",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  overflow: "hidden",
                }}
              >
                <div
                  className="flash"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#fff",
                    pointerEvents: "none",
                  }}
                />
                {/* ==== ICHKI QATLAM: har safar yangi quti tushganda, oldingi qutilar shu yerdagi kalit (key) o'zgarishi orqali qayta titraydi ==== */}
                <div
                  key={isNewest ? "static" : `shake-${visibleCount}`}
                  className={isNewest ? "" : "shake-inner"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#ccc",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#fff",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc" }}>
                    {p.score.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
