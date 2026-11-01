import { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faStop,
  faClock,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { SPEAKING_CARDS } from "../data/speakingCards";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const PREP_TIME = 60;
const SPEAK_TIME = 120;
const CIRCUMFERENCE = 2 * Math.PI * 44;

export default function SpeakingDraw({ theme = "dark" }) {
  const isDark = theme === "dark";

  const [deck, setDeck] = useState(() => shuffle(SPEAKING_CARDS));
  const [drawn, setDrawn] = useState([]);
  const [current, setCurrent] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [flickerTitle, setFlickerTitle] = useState("");

  const [timerState, setTimerState] = useState("idle"); // idle | prep | speak
  const [secondsLeft, setSecondsLeft] = useState(PREP_TIME);
  const timerRef = useRef(null);

  const drawCard = useCallback(() => {
    if (drawing) return;

    let pool = deck;
    if (pool.length === 0) {
      pool = shuffle(SPEAKING_CARDS.filter((c) => c.id !== current?.id));
    }

    setDrawing(true);
    setTimerState("idle");
    setSecondsLeft(PREP_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    let ticks = 0;
    const maxTicks = 9;
    const flicker = setInterval(() => {
      const r = SPEAKING_CARDS[Math.floor(Math.random() * SPEAKING_CARDS.length)];
      setFlickerTitle(r.title);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(flicker);
        const card = pool[pool.length - 1];
        const newPool = pool.slice(0, -1);
        setDeck(newPool);
        setDrawn((prev) => [...prev, card]);
        setCurrent(card);
        setDrawing(false);
      }
    }, 65);
  }, [deck, current, drawing]);

  const showFromHistory = (card) => {
    setTimerState("idle");
    setSecondsLeft(PREP_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(card);
  };

  const resetSession = () => {
    setDeck(shuffle(SPEAKING_CARDS));
    setDrawn([]);
    setCurrent(null);
    setTimerState("idle");
    setSecondsLeft(PREP_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (timerState === "idle") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (timerState === "prep") {
            setTimerState("speak");
            return SPEAK_TIME;
          } else {
            setTimerState("idle");
            return PREP_TIME;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerState]);

  const handleTimerBtn = () => {
    if (timerState === "idle") {
      setSecondsLeft(PREP_TIME);
      setTimerState("prep");
    } else if (timerState === "prep") {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(SPEAK_TIME);
      setTimerState("speak");
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerState("idle");
      setSecondsLeft(PREP_TIME);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space" && !["BUTTON", "INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        if (!drawing) drawCard();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drawing, drawCard]);

  const total = timerState === "prep" ? PREP_TIME : SPEAK_TIME;
  const progress = secondsLeft / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const displayTitle = drawing
    ? flickerTitle
    : current?.title || null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-2 text-center">
        <h1 className={`flex items-center gap-3 text-2xl font-bold sm:text-3xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}>
          <span className="flex items-center justify-center rounded-xl bg-[var(--accent)] p-3 text-white shadow-lg">
            <FontAwesomeIcon icon={faMicrophone} size="lg" />
          </span>
          Random Speaking
        </h1>
        <p className={`mt-2 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
          IELTS Part 2 — Random cue card, 1 min prep, 2 min speak
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
        {/* Left: Card + Draw button */}
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          {/* Card */}
          <div className={`relative w-full overflow-hidden rounded-2xl border p-6 sm:p-8 ${
            isDark
              ? "border-white/10 bg-[#141416]"
              : "border-black/[0.08] bg-white"
          } ${drawing ? "scale-[0.98] opacity-90" : ""} transition-all duration-300`}>
            {/* Seat number + stamp */}
            <div className="mb-4 flex items-start justify-between">
              <span className={`font-mono text-xs ${
                isDark ? "text-white/30" : "text-black/30"
              }`}>
                NO. <span className="font-bold">{current ? String(current.id).padStart(3, "0") : "—"}</span> / {SPEAKING_CARDS.length}
              </span>
              {current && !drawing && (
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-500/10 text-rose-600"
                }`}>
                  Drawn
                </span>
              )}
            </div>

            {/* Part label */}
            <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${
              isDark ? "text-white/25" : "text-black/25"
            }`}>
              You will talk about the topic below
            </p>

            {/* Title */}
            <h2 className={`mb-4 min-h-[3em] font-serif text-xl font-semibold leading-snug sm:text-2xl ${
              isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
            } ${drawing ? "animate-pulse" : ""}`}>
              {displayTitle ? (
                displayTitle
              ) : (
                <span className={`italic ${isDark ? "text-white/25" : "text-black/25"}`}>
                  "Draw a card" tugmasini bosing
                </span>
              )}
            </h2>

            {/* Bullets */}
            {current && !drawing && (
              <div>
                <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-white/30" : "text-black/30"
                }`}>
                  You should say:
                </p>
                <ul className={`space-y-1.5 border-l-2 pl-4 ${
                  isDark ? "border-rose-500/40" : "border-rose-500/30"
                }`}>
                  {current.prompt.you_should_say.map((item, i) => (
                    <li
                      key={i}
                      className={`text-sm leading-relaxed ${
                        isDark ? "text-white/60" : "text-black/60"
                      }`}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Draw button */}
          <div className="flex items-center gap-3">
            <button
              onClick={drawCard}
              disabled={drawing}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition ${
                drawing
                  ? "opacity-50"
                  : "hover:opacity-90"
              } bg-[var(--accent)] text-white`}
            >
              <FontAwesomeIcon icon={faLayerGroup} />
              {current ? "Draw another card" : "Draw a card"}
            </button>
            <span className={`text-xs ${isDark ? "text-white/20" : "text-black/20"}`}>
              yoki <kbd className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                isDark ? "bg-white/10 text-white/40" : "bg-black/5 text-black/40"
              }`}>Space</kbd>
            </span>
          </div>
        </div>

        {/* Right: Timer + History */}
        <div className="flex w-full max-w-md flex-col items-center gap-5 lg:max-w-xs lg:pt-8">
          {/* Timer */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-[118px] w-[118px]">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  className={isDark ? "stroke-white/5" : "stroke-black/5"}
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  className={timerState === "speak" ? "stroke-rose-500" : ""}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-mono text-xl font-bold ${
                  isDark ? "text-white/80" : "text-black/80"
                }`}>
                  {formatTime(secondsLeft)}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                  isDark ? "text-white/25" : "text-black/25"
                }`}>
                  {timerState === "idle" ? "Ready" : timerState === "prep" ? "Prepare" : "Speak!"}
                </span>
              </div>
            </div>
            <button
              onClick={handleTimerBtn}
              disabled={!current}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                !current
                  ? "opacity-30"
                  : isDark
                    ? "border-white/10 text-white/50 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    : "border-black/10 text-black/50 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              <FontAwesomeIcon icon={timerState === "speak" ? faStop : faClock} />
              {timerState === "idle"
                ? "Start 1-min prep"
                : timerState === "prep"
                  ? "Skip to speaking"
                  : "Stop"}
            </button>
          </div>

          {/* History */}
          {drawn.length > 0 && (
            <div className="w-full text-center">
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${
                isDark ? "text-white/20" : "text-black/20"
              }`}>
                Drawn this session
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {drawn.slice().reverse().map((card) => (
                  <button
                    key={card.id}
                    onClick={() => showFromHistory(card)}
                    className={`rounded px-2 py-1 font-mono text-[10px] transition ${
                      current?.id === card.id
                        ? isDark
                          ? "border border-[var(--accent)] text-[var(--accent)]"
                          : "border border-[var(--accent)] text-[var(--accent)]"
                        : isDark
                          ? "border border-white/10 text-white/30 hover:text-white/50"
                          : "border border-black/10 text-black/30 hover:text-black/50"
                    }`}
                    title={card.title}
                  >
                    #{String(card.id).padStart(3, "0")}
                  </button>
                ))}
              </div>
              <button
                onClick={resetSession}
                className={`mt-3 text-[11px] underline underline-offset-2 transition ${
                  isDark ? "text-white/20 hover:text-white/40" : "text-black/20 hover:text-black/40"
                }`}
              >
                reset session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
