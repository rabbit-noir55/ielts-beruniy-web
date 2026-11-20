import { useEffect, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { allPairs } from "./data";
import { sfx } from "./audio";

const SIZE = 10;
const WORD_COUNT = 5;
const GAME_SECONDS = 90;

const WORD_POOL = allPairs()
  .map((pair) => pair.english.toUpperCase())
  .filter((word) => /^[A-Z]{4,8}$/.test(word));

function buildPuzzle() {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const words = [];
  const candidates = shuffle([...new Set(WORD_POOL)]).slice(0, 60);

  for (const word of candidates) {
    if (words.length >= WORD_COUNT) break;
    let placed = false;
    for (let attempt = 0; attempt < 60 && !placed; attempt += 1) {
      const horizontal = Math.random() < 0.55;
      const maxRow = horizontal ? SIZE : SIZE - word.length;
      const maxCol = horizontal ? SIZE - word.length : SIZE;
      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);
      let fits = true;
      for (let i = 0; i < word.length; i += 1) {
        const cell = horizontal ? grid[row][col + i] : grid[row + i][col];
        if (cell && cell !== word[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;
      const cells = [];
      for (let i = 0; i < word.length; i += 1) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        grid[r][c] = word[i];
        cells.push({ r, c });
      }
      words.push({ word, cells });
      placed = true;
    }
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return { grid, words };
}

/**
 * Word Search — yashiringan inglizcha so'zlarni toping.
 * So'zning birinchi va oxirgi harfini bosing (gorizontal yoki vertikal).
 */
export default function WordSearch({ theme }) {
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [puzzle, setPuzzle] = useState(() => buildPuzzle());
  const [start, setStart] = useState(null);
  const [foundWords, setFoundWords] = useState(() => new Set());
  const [foundCells, setFoundCells] = useState(() => new Set());
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("word-search"));
  const [error, setError] = useState("");

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
    setBest(saveBest("word-search", score));
  }, [status, score]);

  const startGame = () => {
    setPuzzle(buildPuzzle());
    setStart(null);
    setFoundWords(new Set());
    setFoundCells(new Set());
    setTimeLeft(GAME_SECONDS);
    setScore(0);
    setError("");
    setStatus("playing");
    sfx("click");
  };

  const lineBetween = (from, to) => {
    if (from.r !== to.r && from.c !== to.c) return null;
    const cells = [];
    if (from.r === to.r) {
      const step = from.c <= to.c ? 1 : -1;
      for (let c = from.c; ; c += step) {
        cells.push({ r: from.r, c });
        if (c === to.c) break;
      }
    } else {
      const step = from.r <= to.r ? 1 : -1;
      for (let r = from.r; ; r += step) {
        cells.push({ r, c: from.c });
        if (r === to.r) break;
      }
    }
    return cells;
  };

  const clickCell = (row, col) => {
    if (status !== "playing") return;
    setError("");
    if (!start) {
      setStart({ r: row, c: col });
      sfx("click");
      return;
    }
    if (start.r === row && start.c === col) {
      setStart(null);
      return;
    }
    const cells = lineBetween(start, { r: row, c: col });
    if (!cells) {
      setStart({ r: row, c: col });
      sfx("click");
      return;
    }
    const text = cells.map((cell) => puzzle.grid[cell.r][cell.c]).join("");
    const reversed = [...text].reverse().join("");
    const hit = puzzle.words.find(
      (entry) =>
        !foundWords.has(entry.word) && (entry.word === text || entry.word === reversed)
    );
    if (hit) {
      const nextFound = new Set([...foundWords, hit.word]);
      setFoundWords(nextFound);
      setFoundCells((prev) => new Set([...prev, ...cells.map((cell) => `${cell.r}-${cell.c}`)]));
      setScore((value) => value + 100);
      setStart(null);
      sfx("win");
      if (nextFound.size === puzzle.words.length) {
        const bonus = Math.max(0, timeLeft) * 5;
        setScore((value) => value + bonus);
        setStatus("over");
        sfx("win");
      }
    } else {
      setError("Bu yo'nalishda so'z topilmadi.");
      setStart(null);
      sfx("wrong");
    }
  };

  return (
    <GameShell
      title="Word Search"
      tagline={`${timeLeft}s · ${foundWords.size}/${puzzle.words.length} so'z`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={startGame}
    >
      <div
        className={`relative rounded-2xl border p-4 sm:p-6 ${
          isDark ? "border-white/10 bg-[#0B0B0E]" : "border-black/10 bg-white"
        }`}
      >
        <div className={`mb-4 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%` }}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="mx-auto w-full max-w-md">
            <div className="grid grid-cols-10 gap-0.5 sm:gap-1">
              {puzzle.grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const isFound = foundCells.has(key);
                  const isStart = start?.r === rowIndex && start?.c === colIndex;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => clickCell(rowIndex, colIndex)}
                      className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-bold transition sm:text-sm ${
                        isStart
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                          : isFound
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : isDark
                              ? "bg-white/[0.045] text-white/80 hover:bg-white/[0.1]"
                              : "bg-black/[0.04] text-black/75 hover:bg-black/[0.08]"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>
            {error && <p className="mt-2 text-center text-xs font-bold text-red-500">{error}</p>}
          </div>

          <div className="sm:w-44">
            <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-black/35"}`}>
              So'zlar
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5 sm:flex-col">
              {puzzle.words.map((entry) => (
                <li
                  key={entry.word}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    foundWords.has(entry.word)
                      ? "bg-emerald-500/15 text-emerald-600 line-through dark:text-emerald-400"
                      : isDark
                        ? "bg-white/[0.06] text-white/70"
                        : "bg-black/[0.05] text-black/70"
                  }`}
                >
                  {entry.word}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over"
                  ? foundWords.size === puzzle.words.length
                    ? "Hammasi topildi!"
                    : "Vaqt tugadi"
                  : "Word Search"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Katakdagi so'zning birinchi va oxirgi harfini bosing — so'z
                gorizontal yoki vertikal joylashgan.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best} · {foundWords.size}/
                  {puzzle.words.length}
                </p>
              )}
              <button
                type="button"
                onClick={startGame}
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
