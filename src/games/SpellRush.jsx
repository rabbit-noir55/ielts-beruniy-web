import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest } from "./engine";
import { samplePairs } from "./data";
import { sfx, speak } from "./audio";

const GAME_SECONDS = 60;

/**
 * Spell Rush — ma'nosi ko'rsatilgan so'zni eshitib, to'g'ri yozing.
 * 60 soniya; ketma-ket to'g'ri javoblar bonus beradi.
 */
export default function SpellRush({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("spell-rush"));
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const inputRef = useRef(null);

  const nextQuestion = useCallback(() => {
    const pair = samplePairs(1)[0];
    setQuestion(pair);
    setAnswer("");
    setRevealed(false);
    setFeedback({ type: "", text: "" });
    window.setTimeout(() => speak(pair.english), 150);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (status !== "playing") return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) return 0;
        return value - 1;
      });
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
    setBest(saveBest("spell-rush", score));
  }, [status, score]);

  const start = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
    nextQuestion();
  };

  const submit = (event) => {
    event.preventDefault();
    if (status !== "playing" || !question || revealed) return;
    const guess = answer.trim().toLowerCase();
    if (!guess) return;
    if (guess === question.english.toLowerCase()) {
      const gain = 25 + streak * 5;
      setScore((value) => value + gain);
      setStreak((value) => value + 1);
      sfx("win");
      nextQuestion();
    } else {
      setStreak(0);
      setRevealed(true);
      setFeedback({
        type: "error",
        text: `To'g'ri javob: ${question.english}`,
      });
      sfx("wrong");
    }
  };

  const skip = () => {
    if (status !== "playing") return;
    setTimeLeft((value) => Math.max(0, value - 3));
    setStreak(0);
    nextQuestion();
  };

  return (
    <GameShell
      title="Spell Rush"
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

        {question && (
          <>
            <div className="text-center">
              <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                Tarjimasi
              </div>
              <div className="mt-1 text-xl font-extrabold sm:text-2xl">{question.uzbek}</div>
              <button
                type="button"
                onClick={() => speak(question.english)}
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${
                  isDark
                    ? "border-white/15 text-white/70 hover:bg-white/5"
                    : "border-black/15 text-black/70 hover:bg-black/[0.04]"
                }`}
              >
                🔊 Eshitish
              </button>
            </div>

            <form onSubmit={submit} className="mt-6">
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={revealed}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Inglizcha so'zni yozing…"
                className={`w-full rounded-xl border px-4 py-3 text-center text-lg font-bold outline-none transition focus:ring-2 disabled:opacity-60 ${
                  isDark
                    ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/25 focus:ring-white/60"
                    : "border-black/12 bg-[#F6F5F2] text-black placeholder:text-black/25 focus:ring-black/60"
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
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {revealed ? (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)]"
                  >
                    Keyingi
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)]"
                  >
                    Tekshirish
                  </button>
                )}
                <button
                  type="button"
                  onClick={skip}
                  className={`rounded-full border px-6 py-2.5 text-sm font-bold ${
                    isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/60"
                  }`}
                >
                  O'tkazish (−3s)
                </button>
              </div>
            </form>
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Vaqt tugadi" : "Spell Rush"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                So'zning o'zbekcha ma'nosi ko'rsatiladi va u ovoz bilan
                o'qiladi. Inglizcha yozilishini yozing.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best}
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
