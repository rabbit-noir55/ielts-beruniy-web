import { useEffect, useState } from "react";
import GameShell from "./GameShell";
import { rand, readBest, saveBest, shuffle } from "./engine";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const GAME_SECONDS = 60;
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function makeQuestion() {
  const pair = samplePairs(1)[0];
  const word = pair.english.toLowerCase();
  const index = Math.floor(rand(0, Math.max(1, word.length)));
  const correct = word[index];
  const others = shuffle(LETTERS.filter((letter) => letter !== correct)).slice(0, 3);
  return {
    pair,
    word,
    index,
    correct,
    options: shuffle([correct, ...others]),
  };
}

/** Missing Letter — so'zdagi tushib qolgan harfni toping. */
export default function MissingLetter({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("missing-letter"));
  const [streak, setStreak] = useState(0);
  const [wrongPick, setWrongPick] = useState("");

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
    setBest(saveBest("missing-letter", score));
  }, [status, score]);

  const start = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_SECONDS);
    setWrongPick("");
    setQuestion(makeQuestion());
    setStatus("playing");
    sfx("click");
  };

  const pick = (letter) => {
    if (status !== "playing" || !question) return;
    if (letter === question.correct) {
      setScore((value) => value + 50 + streak * 5);
      setStreak((value) => value + 1);
      setWrongPick("");
      sfx("win");
      setQuestion(makeQuestion());
    } else {
      setStreak(0);
      setWrongPick(letter);
      sfx("wrong");
    }
  };

  return (
    <GameShell
      title="Missing Letter"
      tagline={`${timeLeft}s · combo ×${streak}`}
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

        {question && status === "playing" && (
          <>
            <div className="text-center">
              <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                Ma'nosi
              </div>
              <div className="mt-1 text-lg font-extrabold">{question.pair.uzbek}</div>
            </div>

            <div className="mt-6 flex justify-center gap-1.5">
              {question.word.split("").map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  className={`flex h-12 w-9 items-center justify-center rounded-xl border text-2xl font-extrabold sm:h-14 sm:w-11 ${
                    index === question.index
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : isDark
                        ? "border-white/10 bg-white/[0.04] text-white"
                        : "border-black/10 bg-[#F6F5F2] text-black"
                  }`}
                >
                  {index === question.index ? "?" : char.toUpperCase()}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 grid max-w-md grid-cols-4 gap-2">
              {question.options.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => pick(letter)}
                  className={`h-14 rounded-xl border text-xl font-extrabold uppercase transition active:scale-95 ${
                    wrongPick === letter
                      ? "border-red-500/60 bg-red-500/15 text-red-500"
                      : isDark
                        ? "border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.1]"
                        : "border-black/12 bg-white text-black hover:bg-black/[0.04]"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Vaqt tugadi" : "Missing Letter"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Ma'nosi ko'rsatilgan so'zdagi tushib qolgan harfni tanlang.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best}
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
