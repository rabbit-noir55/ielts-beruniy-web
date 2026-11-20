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
import { createStarfield, drawBubble } from "./sprites";
import { samplePairs } from "./data";
import { sfx } from "./audio";

const GAME_SECONDS = 60;
const HUES = ["#38bdf8", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb7185"];

/**
 * Bubble Pop — tarjimaga mos inglizcha so'z yozilgan pufakchani yoping.
 * 60 soniya; to'g'ri pufak +150, xato −40.
 */
export default function BubblePop({ theme }) {
  const isDark = theme === "dark";
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const loopRef = useRef(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("bubble-pop"));
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [streak, setStreak] = useState(0);
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState("idle");

  const newTarget = useCallback((state) => {
    const pair = samplePairs(1)[0];
    state.target = pair;
    setTarget(pair);
    state.bubbles.push({
      x: rand(70, Math.max(90, state.width - 70)),
      y: state.height + 40,
      r: 46,
      vy: rand(26, 44),
      word: pair.english,
      correct: true,
      color: HUES[Math.floor(rand(0, HUES.length))],
    });
  }, []);

  const spawnDistractor = useCallback((state) => {
    const pair = samplePairs(1)[0];
    if (!state.target || pair.english === state.target.english) return;
    state.bubbles.push({
      x: rand(70, Math.max(90, state.width - 70)),
      y: state.height + 40,
      r: 44,
      vy: rand(26, 42),
      word: pair.english,
      correct: false,
      color: HUES[Math.floor(rand(0, HUES.length))],
    });
  }, []);

  const finish = useCallback((state) => {
    state.running = false;
    if (loopRef.current) loopRef.current.stop();
    setBest(saveBest("bubble-pop", state.score));
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
      stars: createStarfield(width, height, 60),
      particles: createParticles(),
      bubbles: [],
      target: null,
      running: true,
      score: 0,
      streak: 0,
      timeLeft: GAME_SECONDS,
      lastWhole: GAME_SECONDS,
      spawnIn: 1,
      shake: 0,
    };
    stateRef.current = state;
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_SECONDS);
    setStatus("playing");
    newTarget(state);
    for (let i = 0; i < 3; i += 1) spawnDistractor(state);

    loopRef.current = createLoop({
      update(dt) {
        state.stars.update(dt);
        state.particles.update(dt);
        state.shake = Math.max(0, state.shake - dt * 40);
        state.timeLeft -= dt;

        const whole = Math.max(0, Math.ceil(state.timeLeft));
        if (whole !== state.lastWhole) {
          state.lastWhole = whole;
          setTimeLeft(whole);
        }
        if (state.timeLeft <= 0) {
          finish(state);
          return;
        }

        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
          spawnDistractor(state);
          state.spawnIn = rand(0.9, 1.5);
        }

        state.bubbles.forEach((bubble) => {
          bubble.y -= bubble.vy * dt;
          bubble.x += Math.sin((bubble.y + bubble.r) / 90) * 8 * dt;
        });

        const gone = state.bubbles.filter((bubble) => bubble.y < -bubble.r - 10);
        if (gone.length) {
          state.bubbles = state.bubbles.filter((bubble) => bubble.y >= -bubble.r - 10);
          if (gone.some((bubble) => bubble.word === state.target?.english)) {
            state.streak = 0;
            setStreak(0);
            newTarget(state);
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
        sky.addColorStop(0, "#0a1024");
        sky.addColorStop(1, "#111a34");
        ctx.fillStyle = sky;
        ctx.fillRect(-20, -20, width + 40, height + 40);
        state.stars.draw(ctx);

        state.bubbles.forEach((bubble) => {
          drawBubble(ctx, bubble.x, bubble.y, bubble.r, bubble.color, bubble.word);
        });
        state.particles.draw(ctx);

        if (state.streak > 1) {
          ctx.font = "800 14px Inter, sans-serif";
          ctx.fillStyle = "#fbbf24";
          ctx.textAlign = "left";
          ctx.fillText(`Combo ×${state.streak}`, 16, 26);
        }
        ctx.restore();
      },
    });
  }, [finish, newTarget, spawnDistractor]);

  useEffect(() => {
    return () => {
      if (loopRef.current) loopRef.current.stop();
    };
  }, []);

  const onPointerDown = (event) => {
    const state = stateRef.current;
    if (!state || !state.running) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = [...state.bubbles]
      .reverse()
      .find((bubble) => Math.hypot(bubble.x - x, bubble.y - y) <= bubble.r);
    if (!hit) return;
    state.bubbles = state.bubbles.filter((bubble) => bubble !== hit);
    state.particles.burst(hit.x, hit.y, { color: hit.color, count: 16 });
    if (hit.correct) {
      state.score += 150 + state.streak * 15;
      state.streak += 1;
      setScore(state.score);
      setStreak(state.streak);
      sfx("pop");
      newTarget(state);
    } else {
      state.score = Math.max(0, state.score - 40);
      state.streak = 0;
      state.shake = 8;
      setScore(state.score);
      setStreak(0);
      sfx("wrong");
    }
  };

  const board = (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1024]">
      <canvas
        ref={canvasRef}
        className="block h-[540px] w-full touch-none"
        onPointerDown={onPointerDown}
      />
      {target && status === "playing" && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <div className="rounded-full border border-white/15 bg-black/55 px-5 py-2 text-center backdrop-blur">
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              Tarjimasi
            </span>
            <div className="text-base font-extrabold text-white">{target.uzbek}</div>
          </div>
        </div>
      )}
      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center text-white">
            <h2 className="text-2xl font-extrabold">
              {status === "over" ? "Vaqt tugadi" : "Bubble Pop"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              60 soniya ichida tarjimaga mos inglizcha so'z yozilgan pufakchani
              yoping. To'g'ri — +150, xato — jarima.
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
      title="Bubble Pop"
      tagline={`${timeLeft}s · combo ×${streak}`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      {board}
    </GameShell>
  );
}
