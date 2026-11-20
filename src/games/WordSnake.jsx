import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "./GameShell";
import {
  clamp,
  createLoop,
  createParticles,
  pick,
  rand,
  readBest,
  saveBest,
  setupCanvas,
  shuffle,
} from "./engine";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const COLS = 20;
const ROWS = 14;
const START_LIVES = 3;

function simplePairs(count = 30) {
  return samplePairs(count).filter((pair) => /^[a-z]{3,9}$/.test(pair.english.toLowerCase()));
}

/**
 * Word Snake — ilonni boshqarib, maqsad so'zning harflarini tartib bilan yeb chiqing.
 * Xato harf yoki o'ziga urilish — jon kamayadi.
 */
export default function WordSnake({ theme }) {
  const isDark = theme === "dark";
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("word-snake"));
  const [lives, setLives] = useState(START_LIVES);
  const [target, setTarget] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");

  const placeLetters = useCallback((state) => {
    const cells = [];
    for (let x = 0; x < COLS; x += 1) {
      for (let y = 0; y < ROWS; y += 1) {
        if (state.snake.some((part) => part.x === x && part.y === y)) continue;
        cells.push({ x, y });
      }
    }
    const free = shuffle(cells);
    state.letters = [];
    const needed = state.word[state.progress];
    const first = free.pop();
    if (first) state.letters.push({ ...first, ch: needed });
    const decoyPool = "abcdefghijklmnopqrstuvwxyz".split("").filter((ch) => ch !== needed);
    for (let i = 0; i < 6; i += 1) {
      const cell = free.pop();
      if (!cell) break;
      state.letters.push({ ...cell, ch: pick(decoyPool) });
    }
  }, []);

  const newWord = useCallback((state) => {
    const pairs = simplePairs(40);
    const pair = pairs[0] || samplePairs(1)[0];
    state.pair = pair;
    state.word = pair.english.toLowerCase();
    state.progress = 0;
    setTarget(pair);
    setProgress(0);
    placeLetters(state);
  }, [placeLetters]);

  const loseLife = useCallback((state) => {
    state.lives -= 1;
    state.shake = 12;
    setLives(Math.max(0, state.lives));
    sfx("wrong");
    if (state.lives <= 0) {
      state.running = false;
      if (loopRef.current) loopRef.current.stop();
      setBest(saveBest("word-snake", state.score));
      setStatus("over");
      sfx("lose");
      return false;
    }
    return true;
  }, []);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (loopRef.current) loopRef.current.stop();
    const { ctx, width, height } = setupCanvas(canvas);
    const state = {
      ctx,
      width,
      height,
      particles: createParticles(),
      snake: [
        { x: 6, y: 7 },
        { x: 5, y: 7 },
        { x: 4, y: 7 },
      ],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      letters: [],
      word: "",
      pair: null,
      progress: 0,
      score: 0,
      lives: START_LIVES,
      running: true,
      tick: 0,
      speed: 0.17,
      shake: 0,
      time: 0,
    };
    stateRef.current = state;
    setScore(0);
    setLives(START_LIVES);
    setStatus("playing");
    newWord(state);

    loopRef.current = createLoop({
      update(dt) {
        state.time += dt;
        state.particles.update(dt);
        state.shake = Math.max(0, state.shake - dt * 40);
        state.tick += dt;
        if (state.tick < state.speed) return;
        state.tick = 0;

        state.dir = state.nextDir;
        const head = state.snake[0];
        const next = {
          x: (head.x + state.dir.x + COLS) % COLS,
          y: (head.y + state.dir.y + ROWS) % ROWS,
        };

        if (state.snake.some((part) => part.x === next.x && part.y === next.y)) {
          if (!loseLife(state)) return;
          state.snake = [
            { x: 6, y: 7 },
            { x: 5, y: 7 },
            { x: 4, y: 7 },
          ];
          state.dir = { x: 1, y: 0 };
          state.nextDir = { x: 1, y: 0 };
          state.progress = 0;
          setProgress(0);
          placeLetters(state);
          return;
        }

        state.snake.unshift(next);
        const letterIndex = state.letters.findIndex(
          (letter) => letter.x === next.x && letter.y === next.y
        );
        if (letterIndex === -1) {
          state.snake.pop();
          return;
        }

        const letter = state.letters[letterIndex];
        if (letter.ch === state.word[state.progress]) {
          state.letters.splice(letterIndex, 1);
          state.progress += 1;
          state.score += 10;
          setProgress(state.progress);
          setScore(state.score);
          state.particles.burst(0, 0, { count: 0 });
          sfx("eat");
          if (state.progress >= state.word.length) {
            state.score += state.word.length * 25;
            setScore(state.score);
            sfx("win");
            state.speed = Math.max(0.085, state.speed - 0.006);
            newWord(state);
          }
        } else {
          state.snake.pop();
          if (loseLife(state)) {
            state.progress = 0;
            setProgress(0);
            state.snake = [
              { x: 6, y: 7 },
              { x: 5, y: 7 },
              { x: 4, y: 7 },
            ];
            state.dir = { x: 1, y: 0 };
            state.nextDir = { x: 1, y: 0 };
            placeLetters(state);
          }
        }
      },
      draw() {
        const { ctx, width, height } = state;
        const cell = Math.floor(Math.min(width / COLS, (height - 8) / ROWS));
        const offsetX = (width - cell * COLS) / 2;
        const offsetY = (height - cell * ROWS) / 2;

        ctx.save();
        if (state.shake > 0) {
          ctx.translate(rand(-state.shake, state.shake) / 2, rand(-state.shake, state.shake) / 2);
        }
        ctx.fillStyle = "#0a0f1e";
        ctx.fillRect(-20, -20, width + 40, height + 40);

        for (let x = 0; x < COLS; x += 1) {
          for (let y = 0; y < ROWS; y += 1) {
            ctx.fillStyle = (x + y) % 2 ? "rgba(255,255,255,0.018)" : "rgba(255,255,255,0.03)";
            ctx.fillRect(offsetX + x * cell, offsetY + y * cell, cell - 1, cell - 1);
          }
        }

        state.letters.forEach((letter) => {
          const cx = offsetX + letter.x * cell + cell / 2;
          const cy = offsetY + letter.y * cell + cell / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.34, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(56,189,248,0.16)";
          ctx.fill();
          ctx.fillStyle = "#bae6fd";
          ctx.font = `700 ${Math.round(cell * 0.46)}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(letter.ch.toUpperCase(), cx, cy);
        });

        state.snake.forEach((part, index) => {
          const x = offsetX + part.x * cell + 1;
          const y = offsetY + part.y * cell + 1;
          ctx.fillStyle = index === 0 ? "#38bdf8" : `rgba(56,189,248,${clamp(0.72 - index * 0.02, 0.25, 0.72)})`;
          ctx.beginPath();
          ctx.roundRect(x, y, cell - 3, cell - 3, cell * 0.24);
          ctx.fill();
        });

        state.particles.draw(ctx);
        ctx.restore();
      },
    });
  }, [loseLife, newWord, placeLetters]);

  useEffect(() => {
    const onKey = (event) => {
      const state = stateRef.current;
      if (!state || !state.running) return;
      const key = event.key.toLowerCase();
      const directions = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const next = directions[key];
      if (!next) return;
      event.preventDefault();
      if (next.x === -state.dir.x && next.y === -state.dir.y) return;
      state.nextDir = next;
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (loopRef.current) loopRef.current.stop();
    };
  }, []);

  const board = (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e]">
      <canvas ref={canvasRef} className="block h-[540px] w-full touch-none" />
      {target && status === "playing" && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <div className="rounded-2xl border border-white/15 bg-black/55 px-5 py-2 text-center backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/50">
              {target.uzbek}
            </div>
            <div className="mt-1 flex items-center justify-center gap-1">
              {target.english.split("").map((ch, index) => (
                <span
                  key={`${ch}-${index}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-extrabold ${
                    index < progress
                      ? "bg-sky-500 text-white"
                      : "border border-white/15 text-white/70"
                  }`}
                >
                  {ch.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center text-white">
            <h2 className="text-2xl font-extrabold">
              {status === "over" ? "O'yin tugadi" : "Word Snake"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Ilonni harakatlantirib, so'z harflarini tartib bilan yeb chiqing.
              Xato harf yoki o'ziga urilish jonni kamaytiradi.
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
  );

  return (
    <GameShell
      title="Word Snake"
      tagline={`${lives} jon · ↓↑←→ yoki WASD`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      {board}
    </GameShell>
  );
}
