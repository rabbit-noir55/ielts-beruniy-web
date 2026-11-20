import { useEffect, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { allPairs } from "./data";
import { sfx } from "./audio";

const GAME_SECONDS = 45;

let bankCache = null;

function bank() {
  if (!bankCache) {
    bankCache = allPairs()
      .map((pair) => pair.english.toLowerCase())
      .filter((word) => /^[a-z]{2,14}$/.test(word));
  }
  return bankCache;
}

function pickStart(used) {
  const candidates = shuffle(bank()).slice(0, 200);
  const found = candidates.find((word) => !used.has(word));
  return found || "word";
}

/**
 * Word Chain — oxirgi harfdan boshlanuvchi yangi so'z ayting.
 * Har bir to'g'ri so'z zanjirni uzaytiradi; xato — vaqt jarimasi.
 */
export default function WordChain({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [current, setCurrent] = useState("");
  const [used, setUsed] = useState(() => new Set());
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("word-chain"));
  const [streak, setStreak] = useState(0);

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
    setBest(saveBest("word-chain", score));
  }, [status, score]);

  const start = () => {
    const first = pickStart(new Set());
    setCurrent(first);
    setUsed(new Set([first]));
    setHistory([first]);
    setInput("");
    setError("");
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
    sfx("click");
  };

  const submit = (event) => {
    event.preventDefault();
    if (status !== "playing") return;
    const guess = input.trim().toLowerCase();
    if (!guess) return;
    const required = current.slice(-1);
    if (!/^[a-z]+$/.test(guess)) {
      setError("Faqat ingliz harflaridan foydalaning.");
      sfx("wrong");
      return;
    }
    if (guess[0] !== required) {
      setError(`«${required.toUpperCase()}» harfidan boshlanishi kerak.`);
      sfx("wrong");
      return;
    }
    if (used.has(guess)) {
      setError("Bu so'z allaqachon ishlatilgan.");
      sfx("wrong");
      return;
    }
    if (!bank().includes(guess)) {
      setError("Bu so'z lug'atda topilmadi.");
      sfx("wrong");
      return;
    }
    const gain = guess.length * 10 + streak * 5;
    setScore((value) => value + gain);
    setStreak((value) => value + 1);
    setUsed((prev) => new Set([...prev, guess]));
    setHistory((prev) => [guess, ...prev].slice(0, 5));
    setCurrent(guess);
    setInput("");
    setError(`✓ +${gain}`);
    sfx("win");
  };

  const newChain = () => {
    const next = pickStart(used);
    setCurrent(next);
    setUsed((prev) => new Set([...prev, next]));
    setHistory((prev) => [next, ...prev].slice(0, 5));
    setInput("");
    setError("");
    setTimeLeft((value) => Math.max(0, value - 3));
    sfx("click");
  };

  const required = current.slice(-1).toUpperCase();

  return (
    <GameShell
      title="Word Chain"
      tagline={`${timeLeft}s · zanjir ${history.length}`}
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
                Oxirgi so'z
              </div>
              <div className="mt-1 text-2xl font-extrabold">{current}</div>
              <div className={`mt-2 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                Keyingi so'z shu harf bilan boshlanadi
              </div>
              <div className="mt-1 text-4xl font-black text-[var(--accent)]">{required}</div>
            </div>

            <form onSubmit={submit} className="mx-auto mt-5 max-w-md">
              <input
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (error && error.startsWith("✓")) setError("");
                }}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={`${required.toLowerCase()}… bilan boshlanuvchi so'z`}
                className={`w-full rounded-xl border px-4 py-3 text-center text-lg font-bold outline-none transition focus:ring-2 ${
                  isDark
                    ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/25 focus:ring-white/60"
                    : "border-black/12 bg-[#F6F5F2] text-black placeholder:text-black/25 focus:ring-black/60"
                }`}
              />
              {error && (
                <p
                  className={`mt-2 text-center text-sm font-bold ${
                    error.startsWith("✓") ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {error}
                </p>
              )}
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)]"
                >
                  Qo'shish
                </button>
                <button
                  type="button"
                  onClick={newChain}
                  className={`rounded-full border px-6 py-2.5 text-sm font-bold ${
                    isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/60"
                  }`}
                >
                  Yangi zanjir (−3s)
                </button>
              </div>
            </form>

            {history.length > 1 && (
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {history.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      index === 0
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark
                          ? "bg-white/[0.06] text-white/50"
                          : "bg-black/[0.05] text-black/50"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Vaqt tugadi" : "Word Chain"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Har bir so'z oldingi so'zning oxirgi harfidan boshlanishi va
                lug'atda mavjud bo'lishi kerak. Takrorlash mumkin emas.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best} · {history.length} so'z
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
