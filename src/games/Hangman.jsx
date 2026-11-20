import { useCallback, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest } from "./engine";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const MAX_WRONG = 6;

function nextWord(used = new Set()) {
  const bank = samplePairs(40).filter((pair) => /^[a-z]{4,10}$/.test(pair.english.toLowerCase()));
  return bank.find((pair) => !used.has(pair.english.toLowerCase())) || samplePairs(1)[0];
}

/**
 * Hangman — tarjima yordamida yashiringan so'zni harflab toping.
 * 6 xato harf — o'yin tugaydi.
 */
export default function Hangman({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState(null);
  const [guessed, setGuessed] = useState(() => new Set());
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("hangman"));
  const [won, setWon] = useState(0);
  const [used, setUsed] = useState(() => new Set());

  const loadQuestion = useCallback((usedWords) => {
    const pair = nextWord(usedWords);
    setQuestion(pair);
    setGuessed(new Set());
    setWrong(0);
  }, []);

  const start = () => {
    setScore(0);
    setWon(0);
    setUsed(new Set());
    setStatus("playing");
    loadQuestion(new Set());
    sfx("click");
  };

  const guess = (letter) => {
    if (status !== "playing" || !question || guessed.has(letter)) return;
    const word = question.english.toLowerCase();
    const nextGuessed = new Set(guessed);
    nextGuessed.add(letter);
    setGuessed(nextGuessed);

    if (!word.includes(letter)) {
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      sfx("wrong");
      if (nextWrong >= MAX_WRONG) {
        setStatus("over");
        setBest(saveBest("hangman", score));
        sfx("lose");
      }
      return;
    }

    sfx("type");
    const solved = word.split("").every((char) => nextGuessed.has(char));
    if (solved) {
      const gain = word.length * 20 + (MAX_WRONG - wrong) * 10;
      setScore((value) => value + gain);
      setWon((value) => value + 1);
      setUsed((prev) => new Set([...prev, word]));
      sfx("win");
      window.setTimeout(() => loadQuestion(new Set([...used, word])), 650);
    }
  };

  const word = question?.english?.toLowerCase() || "";
  const wrongLetters = [...guessed].filter((letter) => !word.includes(letter));

  const gallows = (
    <svg viewBox="0 0 160 160" className="h-32 w-32" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" className="text-black/30 dark:text-white/30">
        <path d="M25 145h110" />
        <path d="M55 145V20h50" />
        <path d="M105 20v25" />
      </g>
      <g stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" fill="none">
        {wrong > 0 && <circle cx="105" cy="58" r="14" />}
        {wrong > 1 && <path d="M105 72v34" />}
        {wrong > 2 && <path d="M105 80l-18 14" />}
        {wrong > 3 && <path d="M105 80l18 14" />}
        {wrong > 4 && <path d="M105 106l-14 22" />}
        {wrong > 5 && <path d="M105 106l14 22" />}
      </g>
    </svg>
  );

  return (
    <GameShell
      title="Hangman"
      tagline={`${won} so'z · ${MAX_WRONG - wrong} urinish qoldi`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-7 ${
          isDark ? "border-white/10 bg-[#0B0B0E]" : "border-black/10 bg-white"
        }`}
      >
        {question && status === "playing" && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                  Ma'nosi
                </div>
                <div className="mt-1 max-w-xs text-lg font-extrabold">{question.uzbek}</div>
                <div className={`mt-3 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Xato harflar: {wrongLetters.join(", ") || "—"}
                </div>
              </div>
              {gallows}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-1.5">
              {word.split("").map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  className={`flex h-11 w-8 sm:w-9 items-center justify-center rounded-lg border-b-2 text-xl font-extrabold ${
                    guessed.has(char)
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : isDark
                        ? "border-white/20 text-white/20"
                        : "border-black/20 text-black/20"
                  }`}
                >
                  {guessed.has(char) ? char.toUpperCase() : ""}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 grid max-w-lg grid-cols-7 gap-1.5 sm:grid-cols-9">
              {ALPHABET.map((letter) => {
                const usedLetter = guessed.has(letter);
                const wrongLetter = usedLetter && !word.includes(letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={usedLetter}
                    onClick={() => guess(letter)}
                    className={`h-10 rounded-lg text-sm font-bold transition active:scale-95 disabled:opacity-40 ${
                      wrongLetter
                        ? "bg-red-500/15 text-red-500"
                        : usedLetter
                          ? "bg-emerald-500/15 text-emerald-500"
                          : isDark
                            ? "bg-white/[0.06] text-white hover:bg-white/[0.12]"
                            : "bg-black/[0.05] text-black hover:bg-black/[0.1]"
                    }`}
                  >
                    {letter.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "O'yin tugadi" : "Hangman"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                O'zbekcha ma'nosi berilgan so'zni harflab toping. 6 xato harf
                — o'yin tugaydi.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best} · {won} so'z
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
