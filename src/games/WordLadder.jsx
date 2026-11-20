import { useEffect, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { allPairs } from "./data";
import { sfx } from "./audio";

const GAME_SECONDS = 45;

let bankCache = null;
let bankSetCache = null;

function bank() {
  if (!bankCache) {
    bankCache = [
      ...new Set(
        allPairs()
          .map((pair) => pair.english.toLowerCase())
          .filter((word) => /^[a-z]{4}$/.test(word))
      ),
    ];
    bankSetCache = new Set(bankCache);
  }
  return bankCache;
}

function isWord(word) {
  bank();
  return bankSetCache.has(word);
}

function pickStart(used = new Set()) {
  return shuffle(bank()).find((word) => !used.has(word)) || "word";
}

function differsByOne(first, second) {
  if (first.length !== second.length) return false;
  let diff = 0;
  for (let i = 0; i < first.length; i += 1) {
    if (first[i] !== second[i]) diff += 1;
    if (diff > 1) return false;
  }
  return diff === 1;
}

/** Word Ladder — har safar faqat bitta harfni o'zgartirib, so'z zanjirini uzaytiring. */
export default function WordLadder({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [current, setCurrent] = useState("");
  const [used, setUsed] = useState(() => new Set());
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("word-ladder"));
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
    setBest(saveBest("word-ladder", score));
  }, [status, score]);

  const start = () => {
    const first = pickStart(new Set());
    setCurrent(first);
    setUsed(new Set([first]));
    setHistory([first]);
    setInput("");
    setFeedback({ type: "", text: "" });
    setTimeLeft(GAME_SECONDS);
    setScore(0);
    setStreak(0);
    setStatus("playing");
    sfx("click");
  };

  const submit = (event) => {
    event.preventDefault();
    if (status !== "playing") return;
    const guess = input.trim().toLowerCase();
    if (!guess) return;
    if (!/^[a-z]{4}$/.test(guess)) {
      setFeedback({ type: "error", text: "4 ta ingliz harfidan iborat so'z kiriting." });
      sfx("wrong");
      return;
    }
    if (!isWord(guess)) {
      setFeedback({ type: "error", text: "Bu so'z lug'atda topilmadi." });
      sfx("wrong");
      return;
    }
    if (used.has(guess)) {
      setFeedback({ type: "error", text: "Bu so'z allaqachon ishlatilgan." });
      sfx("wrong");
      return;
    }
    if (!differsByOne(current, guess)) {
      setFeedback({ type: "error", text: "Faqat bitta harfni o'zgartiring." });
      sfx("wrong");
      return;
    }
    const gain = 40 + streak * 5;
    setScore((value) => value + gain);
    setStreak((value) => value + 1);
    setUsed((prev) => new Set([...prev, guess]));
    setHistory((prev) => [guess, ...prev].slice(0, 6));
    setCurrent(guess);
    setInput("");
    setFeedback({ type: "ok", text: `✓ +${gain}` });
    sfx("win");
  };

  const newLadder = () => {
    const first = pickStart(used);
    setCurrent(first);
    setUsed((prev) => new Set([...prev, first]));
    setHistory((prev) => [first, ...prev].slice(0, 6));
    setInput("");
    setFeedback({ type: "", text: "" });
    setTimeLeft((value) => Math.max(0, value - 3));
    sfx("click");
  };

  return (
    <GameShell
      title="Word Ladder"
      tagline={`${timeLeft}s · ${history.length} so'z`}
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
                Joriy so'z
              </div>
              <div className="mt-2 flex justify-center gap-2">
                {current.split("").map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    className={`flex h-14 w-12 items-center justify-center rounded-xl border text-2xl font-black uppercase ${
                      isDark
                        ? "border-white/12 bg-white/[0.05] text-white"
                        : "border-black/12 bg-[#F6F5F2] text-black"
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
              <p className={`mt-2 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                Bitta harfni o'zgartirib, yangi so'z tuzing
              </p>
            </div>

            <form onSubmit={submit} className="mx-auto mt-5 max-w-md">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={4}
                placeholder="4 harfli so'z"
                className={`w-full rounded-xl border px-4 py-3 text-center text-xl font-bold uppercase tracking-[0.3em] outline-none transition focus:ring-2 ${
                  isDark
                    ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/20 focus:ring-white/60"
                    : "border-black/12 bg-[#F6F5F2] text-black placeholder:text-black/20 focus:ring-black/60"
                }`}
              />
              {feedback.text && (
                <p
                  className={`mt-2 text-center text-sm font-bold ${
                    feedback.type === "error" ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {feedback.text}
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
                  onClick={newLadder}
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
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
                {status === "over" ? "Vaqt tugadi" : "Word Ladder"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Har bir keyingi so'z oldingisidan faqat bitta harf bilan farq
                qilsin. 4 harfli so'zlar.
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
