import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "./GameShell";
import {
  createLoop,
  createParticles,
  rand,
  readBest,
  saveBest,
  setupCanvas,
} from "./engine";
import { createStarfield } from "./sprites";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const START_LIVES = 3;

/**
 * Falling Words — tushayotgan inglizcha so'zlarni yozib ulguring.
 * Yozilgan harflar faqat mavjud so'zning boshlanishiga mos kelsa qabul qilinadi.
 */
export default function FallingWords({ theme }) {
  const isDark = theme === "dark";
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);
  const typedRef = useRef("");

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("falling-words"));
  const [lives, setLives] = useState(START_LIVES);
  const [combo, setCombo] = useState(0);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle");

  const spawnWord = useCallback((state) => {
    const pair = samplePairs(1)[0];
    state.words.push({
      word: pair.english,
      x: rand(70, Math.max(90, state.width - 70)),
      y: rand(-40, -10),
      vy: 18 + Math.min(40, state.score / 80),
      hue: 190 + rand(-30, 30),
    });
  }, []);

  const finish = useCallback((state) => {
    state.running = false;
    if (loopRef.current) loopRef.current.stop();
    setBest(saveBest("falling-words", state.score));
    setStatus("over");
    sfx("lose");
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
      stars: createStarfield(width, height, 70),
      particles: createParticles(),
      words: [],
      running: true,
      score: 0,
      lives: START_LIVES,
      combo: 0,
      spawnIn: 0.4,
      shake: 0,
      time: 0,
    };
    stateRef.current = state;
    typedRef.current = "";
    setScore(0);
    setLives(START_LIVES);
    setCombo(0);
    setTyped("");
    setStatus("playing");
    spawnWord(state);
    spawnWord(state);

    loopRef.current = createLoop({
      update(dt) {
        state.time += dt;
        state.stars.update(dt);
        state.particles.update(dt);
        state.shake = Math.max(0, state.shake - dt * 40);

        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
          spawnWord(state);
          const pace = Math.max(0.8, 1.9 - state.score / 900);
          state.spawnIn = pace + rand(-0.15, 0.15);
        }

        state.words.forEach((word) => {
          word.y += word.vy * dt;
        });

        const missed = state.words.filter((word) => word.y > state.height - 20);
        if (missed.length) {
          state.words = state.words.filter((word) => word.y <= state.height - 20);
          state.lives -= missed.length;
          state.shake = 14;
          state.combo = 0;
          sfx("wrong");
          setLives(Math.max(0, state.lives));
          setCombo(0);
          if (state.lives <= 0) {
            finish(state);
            return;
          }
        }
      },
      draw() {
        const { ctx, width, height } = state;
        ctx.save();
        if (state.shake > 0) {
          ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake) * 0.5);
        }
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, "#071226");
        sky.addColorStop(1, "#0b1c33");
        ctx.fillStyle = sky;
        ctx.fillRect(-20, -20, width + 40, height + 40);
        state.stars.draw(ctx);

        const prefix = typedRef.current.toLowerCase();
        state.words.forEach((word) => {
          const matched = prefix && word.word.toLowerCase().startsWith(prefix);
          ctx.font = "700 22px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.shadowColor = matched ? "#38bdf8" : `hsl(${word.hue} 85% 60%)`;
          ctx.shadowBlur = matched ? 18 : 8;
          ctx.fillStyle = matched ? "#93c5fd" : "#e2e8f0";
          ctx.fillText(word.word, word.x, word.y);
          ctx.shadowBlur = 0;
        });

        state.particles.draw(ctx);

        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(0, height - 58, width, 58);
        ctx.font = "700 24px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = prefix ? "#38bdf8" : "rgba(255,255,255,0.25)";
        ctx.fillText(prefix || "yozing…", width / 2, height - 22);
        ctx.restore();
      },
    });
  }, [finish, spawnWord]);

  useEffect(() => {
    const onKey = (event) => {
      const state = stateRef.current;
      if (!state || !state.running) return;
      if (event.key === "Backspace") {
        typedRef.current = typedRef.current.slice(0, -1);
        setTyped(typedRef.current);
        return;
      }
      if (!/^[a-zA-Z]$/.test(event.key)) return;
      setTyped(typedRef.current + event.key.toLowerCase());
      const next = typedRef.current + event.key.toLowerCase();
      const alive = state.words.filter((word) => !word.dead);
      const matching = alive.filter((word) =>
        word.word.toLowerCase().startsWith(next)
      );
      if (!matching.length) {
        sfx("wrong");
        state.shake = 8;
        state.combo = 0;
        typedRef.current = "";
        setTyped("");
        setCombo(0);
        return;
      }
      typedRef.current = next;
      setTyped(next);
      sfx("type");
      const exact = matching.find(
        (word) => word.word.toLowerCase() === next
      );
      if (exact) {
        exact.dead = true;
        state.words = state.words.filter((word) => word !== exact);
        state.score += exact.word.length * 10 + state.combo * 5;
        state.combo += 1;
        setScore(state.score);
        setCombo(state.combo);
        state.particles.burst(exact.x, exact.y, {
          color: "#38bdf8",
          count: 16,
        });
        sfx("pop");
        typedRef.current = "";
        setTyped("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (loopRef.current) loopRef.current.stop();
    };
  }, []);

  const board = (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071226]">
      <canvas ref={canvasRef} className="block h-[520px] w-full touch-none" />
      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center text-white">
            <h2 className="text-2xl font-extrabold">
              {status === "over" ? "O'yin tugadi" : "Falling Words"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Tushayotgan inglizcha so'zlarni yozib ulguring. So'z pastga
              yetib borsa — jon kamayadi. Ketma-ket so'zlar uchun bonus.
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
      title="Falling Words"
      tagline={`${lives} jon · combo ×${combo}${typed ? ` · ${typed}` : ""}`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      {board}
    </GameShell>
  );
}
