import { useCallback, useEffect, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { distractors, samplePairs } from "./data";
import { sfx } from "./audio";

const GAME_SECONDS = 60;

function makeQuestion() {
  const pair = samplePairs(1)[0];
  return { pair, options: shuffle([pair, ...distractors(pair, 3)]) };
}

/**
 * Quiz Rush — 60 soniyada imkon qadar ko'p so'z tarjimasini toping.
 * Tez va ketma-ket to'g'ri javoblar combo bonusini beradi.
 */
export default function QuizRush({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState(null);
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("quiz-rush"));
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const nextQuestion = useCallback(() => {
    setQuestion(makeQuestion());
    setPicked(null);
  }, []);

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
    setBest(saveBest("quiz-rush", score));
  }, [status, score]);

  const start = () => {
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
    nextQuestion();
  };

  const choose = (option) => {
    if (status !== "playing" || !question || picked !== null) return;
    setPicked(option.uzbek);
    const isCorrect = option.uzbek === question.pair.uzbek;
    if (isCorrect) {
      setScore((value) => value + 100 + streak * 10);
      setStreak((value) => value + 1);
      setCorrectCount((value) => value + 1);
      sfx("win");
    } else {
      setScore((value) => Math.max(0, value - 40));
      setStreak(0);
      sfx("wrong");
    }
    window.setTimeout(nextQuestion, isCorrect ? 260 : 650);
  };

  const optionClass = (option) => {
    const isPicked = picked === option.uzbek;
    const isCorrect = question && option.uzbek === question.pair.uzbek;
    if (!isPicked) {
      return isDark
        ? "border-white/12 bg-white/[0.05] text-white hover:border-white/25 hover:bg-white/[0.09]"
        : "border-black/12 bg-white text-black hover:border-black/25 hover:bg-black/[0.03]";
    }
    return isCorrect
      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : "border-red-500/60 bg-red-500/15 text-red-600 dark:text-red-400";
  };

  return (
    <GameShell
      title="Quiz Rush"
      tagline={`${timeLeft}s · ${correctCount} to'g'ri · combo ×${streak}`}
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

        {question && (
          <>
            <div className="text-center">
              <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                Tarjimasini toping
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {question.pair.english}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {question.options.map((option) => (
                <button
                  key={option.uzbek}
                  type="button"
                  onClick={() => choose(option)}
                  disabled={picked !== null}
                  className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition active:scale-[0.99] disabled:cursor-default ${optionClass(option)}`}
                >
                  {option.uzbek}
                </button>
              ))}
            </div>
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Vaqt tugadi" : "Quiz Rush"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Inglizcha so'zning o'zbekcha tarjimasini tanlang. Tez va ketma-ket
                to'g'ri javoblar ko'proq ball beradi.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best} · {correctCount} to'g'ri
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  sfx("click");
                  start();
                }}
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
