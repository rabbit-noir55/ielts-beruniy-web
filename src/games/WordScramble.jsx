import { useCallback, useEffect, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const GAME_SECONDS = 60;

function makeLetters(word) {
  return shuffle(word.split("").map((char, index) => ({ char, id: index })));
}

/**
 * Word Scramble — aralashtirilgan harflardan to'g'ri inglizcha so'zni tuzing.
 */
export default function WordScramble({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState(null);
  const [letters, setLetters] = useState([]);
  const [picked, setPicked] = useState([]);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("word-scramble"));
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [shake, setShake] = useState(false);

  const nextQuestion = useCallback(() => {
    const pair = samplePairs(1)[0];
    setQuestion(pair);
    setLetters(makeLetters(pair.english.toLowerCase()));
    setPicked([]);
    setFeedback("");
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
    setBest(saveBest("word-scramble", score));
  }, [status, score]);

  const start = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
    nextQuestion();
  };

  const evaluate = (ids) => {
    if (!question) return;
    const word = question.english.toLowerCase();
    const guess = ids
      .map((id) => letters.find((letter) => letter.id === id)?.char || "")
      .join("");
    if (guess === word) {
      const gain = 30 + streak * 5;
      setScore((value) => value + gain);
      setStreak((value) => value + 1);
      setFeedback(`✓ +${gain}`);
      sfx("win");
      nextQuestion();
    } else {
      setStreak(0);
      setShake(true);
      setFeedback(`✗ ${guess.toUpperCase()} — qayta urinib ko'ring`);
      sfx("wrong");
      window.setTimeout(() => {
        setPicked([]);
        setShake(false);
      }, 450);
    }
  };

  const pickLetter = (id) => {
    if (status !== "playing" || !question) return;
    if (picked.includes(id)) return;
    const next = [...picked, id];
    setPicked(next);
    sfx("type");
    if (next.length === question.english.length) evaluate(next);
  };

  const undo = () => {
    if (!picked.length) return;
    setPicked(picked.slice(0, -1));
    sfx("click");
  };

  const skip = () => {
    if (status !== "playing") return;
    setTimeLeft((value) => Math.max(0, value - 3));
    setStreak(0);
    nextQuestion();
  };

  const answer = picked
    .map((id) => letters.find((letter) => letter.id === id)?.char || "")
    .join("");

  return (
    <GameShell
      title="Word Scramble"
      tagline={`${timeLeft}s · combo ×${streak}`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      <div
        className={`relative rounded-2xl border p-5 sm:p-7 ${
          isDark ? "border-white/10 bg-[#0B0B0E]" : "border-black/10 bg-white"
        } ${shake ? "animate-pulse" : ""}`}
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
                Ma'nosi
              </div>
              <div className="mt-1 text-xl font-extrabold">{question.uzbek}</div>
              <div className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                {question.english.length} harf
              </div>
            </div>

            <div
              className={`mx-auto mt-5 flex min-h-14 max-w-md items-center justify-center rounded-xl border px-3 py-2 text-lg font-extrabold tracking-[0.3em] ${
                isDark ? "border-white/10 bg-[#0A0A0B] text-white" : "border-black/12 bg-[#F6F5F2] text-black"
              }`}
            >
              {answer || <span className={isDark ? "text-white/20" : "text-black/20"}>…</span>}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {letters.map((letter) => {
                const used = picked.includes(letter.id);
                return (
                  <button
                    key={letter.id}
                    type="button"
                    disabled={used}
                    onClick={() => pickLetter(letter.id)}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-extrabold transition active:scale-95 disabled:opacity-25 ${
                      isDark
                        ? "border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                        : "border-black/15 bg-white text-black hover:bg-black/[0.05]"
                    }`}
                  >
                    {letter.char.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <p
                className={`mt-3 text-center text-sm font-bold ${
                  feedback.startsWith("✓") ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {feedback}
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={undo}
                className={`rounded-full border px-5 py-2 text-sm font-bold ${
                  isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/60"
                }`}
              >
                ← O'chirish
              </button>
              <button
                type="button"
                onClick={skip}
                className={`rounded-full border px-5 py-2 text-sm font-bold ${
                  isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/60"
                }`}
              >
                O'tkazish (−3s)
              </button>
            </div>
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Vaqt tugadi" : "Word Scramble"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Harflarni bosib, ma'noga mos inglizcha so'zni tuzing. To'g'ri
                so'z avtomatik tekshiriladi.
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
