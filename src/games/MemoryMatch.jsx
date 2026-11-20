import { useCallback, useEffect, useState } from "react";
import GameShell from "./GameShell";
import { readBest, saveBest, shuffle } from "./engine";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const PAIR_COUNT = 8;

function buildDeck() {
  const pairs = samplePairs(PAIR_COUNT);
  return shuffle(
    pairs.flatMap((pair, index) => [
      { id: `${index}-en`, pairId: index, text: pair.english, kind: "en" },
      { id: `${index}-uz`, pairId: index, text: pair.uzbek, kind: "uz" },
    ])
  );
}

/**
 * Memory Match — so'z va tarjima juftliklarini toping.
 * Kam harakat va tez vaqt — yuqori ball.
 */
export default function MemoryMatch({ theme }) {
  const isDark = theme === "dark";
  const [deck, setDeck] = useState(() => buildDeck());
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(() => new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("idle");
  const [best, setBest] = useState(() => readBest("memory-match"));
  const [score, setScore] = useState(0);

  const reset = useCallback(() => {
    setDeck(buildDeck());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setSeconds(0);
    setScore(0);
    setStatus("playing");
    sfx("click");
  }, []);

  useEffect(() => {
    if (status !== "playing") return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "playing") return;
    if (matched.size !== deck.length) return;
    const finalScore = Math.max(120, 1600 - moves * 40 - seconds * 6);
    setScore(finalScore);
    setBest(saveBest("memory-match", finalScore));
    setStatus("over");
    sfx("win");
  }, [matched, deck.length, moves, seconds, status]);

  const flip = (index) => {
    if (status !== "playing") return;
    if (flipped.includes(index) || matched.has(index)) return;
    if (flipped.length >= 2) return;
    const next = [...flipped, index];
    setFlipped(next);
    sfx("click");
    if (next.length < 2) return;
    setMoves((value) => value + 1);
    const [first, second] = next;
    if (deck[first].pairId === deck[second].pairId) {
      window.setTimeout(() => {
        setMatched((prev) => new Set([...prev, first, second]));
        setFlipped([]);
        sfx("pop");
      }, 320);
    } else {
      window.setTimeout(() => {
        setFlipped([]);
        sfx("wrong");
      }, 720);
    }
  };

  const cardBase =
    "relative flex h-20 sm:h-24 items-center justify-center rounded-2xl border px-2 text-center text-xs sm:text-sm font-bold transition-all duration-300";

  return (
    <GameShell
      title="Memory Match"
      tagline={`${moves} harakat · ${seconds}s`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={reset}
    >
      <div
        className={`relative rounded-2xl border p-4 ${
          isDark ? "border-white/10 bg-[#0B0B0E]" : "border-black/10 bg-white"
        }`}
      >
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {deck.map((card, index) => {
            const isOpen = flipped.includes(index) || matched.has(index);
            const isMatched = matched.has(index);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => flip(index)}
                className={`${cardBase} ${
                  isMatched
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isOpen
                      ? isDark
                        ? "border-white/15 bg-[#17171C] text-white"
                        : "border-black/15 bg-[#F6F5F2] text-black"
                      : isDark
                        ? "border-white/10 bg-[#141419] text-white/20 hover:bg-[#1C1C23]"
                        : "border-black/10 bg-[#EFEEE9] text-black/20 hover:bg-[#E7E6E1]"
                }`}
                aria-label={isOpen ? card.text : "Yopiq kartochka"}
              >
                {isOpen ? (
                  <span className={card.kind === "en" ? "" : "opacity-90"}>
                    {card.text}
                    <span className="mt-1 block text-[9px] font-normal uppercase tracking-widest opacity-40">
                      {card.kind === "en" ? "EN" : "UZ"}
                    </span>
                  </span>
                ) : (
                  <span className="text-2xl">✦</span>
                )}
              </button>
            );
          })}
        </div>

        {status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center text-white">
              <h2 className="text-2xl font-extrabold">
                {status === "over" ? "Topildi!" : "Memory Match"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                16 kartochka — 8 juft so'z va tarjima. Harakat kamroq va vaqt
                tezroq bo'lsa, ball shuncha yuqori.
              </p>
              {status === "over" && (
                <p className="mt-3 text-lg font-bold text-amber-400">
                  Ball: {score} · Rekord: {best} · {moves} harakat · {seconds}s
                </p>
              )}
              <button
                type="button"
                onClick={reset}
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
