import { useEffect, useRef, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { WORD_BANKS } from "../data/typingBanks";
import { sfx } from "./audio";

const GAME_SECONDS = 45;
const BATCH = 12;

const POOL = [...new Set([...(WORD_BANKS.general || []), ...(WORD_BANKS.ielts || [])])].filter(
  (word) => /^[a-z]{3,10}$/.test(word)
);

function nextBatch() {
  return shuffle(POOL).slice(0, BATCH);
}

/** Typing Race — so'zlarni imkon qadar tez va xatosiz yozing. */
export default function TypingRace({ theme }) {
  const isDark = theme === "dark";
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [queue, setQueue] = useState(() => nextBatch());
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("typing-race"));
  const [streak, setStreak] = useState(0);
  const [chars, setChars] = useState(0);
  const [doneWords, setDoneWords] = useState(0);

  useEffect(() => {
    if (status !== "playing") return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "playing" || timeLeft > 0) return;
    setStatus("over");
    sfx("lose");
  }, [timeLeft, status]);

  useEffect(() => {
    if (status !== "over") return;
    setBest(saveBest("typing-race", score));
  }, [status, score]);

  const start = () => {
    setQueue(nextBatch());
    setIndex(0);
    setInput("");
    setChars(0);
    setDoneWords(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
    sfx("click");
    window.setTimeout(() => inputRef.current?.focus(), 100);
  };

  const onChange = (event) => {
    if (status !== "playing") return;
    const value = event.target.value;
    setInput(value);
    const word = queue[index] || "";
    if (!word) return;
    if (value.trim().toLowerCase() === word) {
      const gain = word.length * 5 + streak * 3;
      setScore((current) => current + gain);
      setStreak((current) => current + 1);
      setChars((current) => current + word.length);
      setDoneWords((current) => current + 1);
      sfx("type");
      setInput("");
      if (index + 1 >= queue.length) {
        setQueue(nextBatch());
        setIndex(0);
      } else {
        setIndex(index + 1);
      }
      inputRef.current?.focus();
    }
  };

  const word = queue[index] || "";
  const elapsed = GAME_SECONDS - timeLeft;
  const wpm = elapsed > 0 ? Math.round(chars / 5 / (elapsed / 60)) : 0;

  return (
    <GameShell
      title="Typing Race"
      tagline={`${timeLeft}s · ${doneWords} so'z · ${wpm} WPM`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      <div
        className={`relative rounded-2xl border p-5 sm:p-7 ${
          isDark ? "border-white/10 bg-[#0B0B0E]" : "border-black/10 bg-white"
        }`}
      >
        <div className={`mb-5 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%` }}
          />
        </div>

        {status === "playing" && (
          <>
            <div className="text-center">
              <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                Shu so'zni yozing
              </div>
              <div className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {word.split("").map((char, charIndex) => (
                  <span
                    key={`${char}-${charIndex}`}
                    className={
                      charIndex < input.length
                        ? input[charIndex]?.toLowerCase() === char
                          ? "text-emerald-500"
                          : "text-red-500"
                        : ""
                    }
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            <input
              ref={inputRef}
              value={input}
              onChange={onChange}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="yozing…"
              className={`mx-auto mt-6 block w-full max-w-md rounded-xl border px-4 py-3 text-center text-xl font-bold outline-none transition focus:ring-2 ${
                isDark
                  ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/20 focus:ring-white/60"
                  : "border-black/12 bg-[#F6F5F2] text-black placeholder:text-black/20 focus:ring-black/60"
              }`}
            />

            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {queue.slice(index + 1, index + 6).map((next, nextIndex) => (
                <span
                  key={`${next}-${nextIndex}`}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isDark ? "bg-white/[0.05] text-white/45" : "bg-black/[0.04] text-black/45"
                  }`}
                >
                  {next}
                </span>
              ))}
            </div>
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Vaqt tugadi" : "Typing Race"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Ko'rsatilgan so'zlarni imkon qadar tez yozing. Xato harf
                qizil, to'g'ri harf yashil ko'rinadi.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best} · {doneWords} so'z · {wpm} WPM
                </p>
              )}
              <button
                type="button"
                onClick={start}
                className="mt-5 rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90"
              >
                {status === "over" ? "Yana o'ynash" : "Boshlash"}
              </button>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
