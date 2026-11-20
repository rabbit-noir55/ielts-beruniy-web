import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "./GameShell";
import {
  clamp,
  createLoop,
  createParticles,
  rand,
  readBest,
  saveBest,
  setupCanvas,
} from "./engine";
import { createStarfield, drawEnemy, drawShip } from "./sprites";
import { samplePairs, shuffle } from "./data";
import { sfx } from "./audio";

const START_LIVES = 3;

/**
 * Word Shooter — tarjimasi berilgan so'zning inglizcha juftini otib tushiring.
 * Boshqaruv: ← → yoki sichqoncha; Space yoki bosish — o'q otish.
 */
export default function WordShooter({ theme }) {
  const isDark = theme === "dark";
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const loopRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest("word-shooter"));
  const [lives, setLives] = useState(START_LIVES);
  const [round, setRound] = useState(1);
  const [status, setStatus] = useState("idle");
  const [prompt, setPrompt] = useState(null);

  const spawnRound = useCallback((state) => {
    const pairs = samplePairs(4);
    const target = pairs[0];
    const entries = shuffle([
      { pair: target, correct: true },
      ...pairs.slice(1).map((pair) => ({ pair, correct: false })),
    ]);
    const padding = 78;
    const step = (state.width - padding * 2) / (entries.length - 1);
    state.enemies = entries.map((entry, index) => ({
      x: padding + step * index,
      y: rand(-100, 10),
      vy: 26 + state.round * 3,
      ...entry,
      // Rang to'g'ri javobni oshkor qilmasligi kerak.
      hue: rand(0, 360),
    }));
    state.target = target;
    setPrompt(target);
  }, []);

  const finish = useCallback((state) => {
    state.running = false;
    if (loopRef.current) loopRef.current.stop();
    const finalScore = state.score;
    setBest(saveBest("word-shooter", finalScore));
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
      stars: createStarfield(width, height, 80),
      particles: createParticles(),
      shipX: width / 2,
      bullets: [],
      enemies: [],
      keys: {},
      running: true,
      round: 1,
      score: 0,
      lives: START_LIVES,
      time: 0,
      shake: 0,
      invuln: 0,
    };
    gameRef.current = state;
    setScore(0);
    setLives(START_LIVES);
    setRound(1);
    setStatus("playing");
    spawnRound(state);

    const shoot = (shooter) => {
      if (!shooter || !shooter.running) return;
      if (shooter.bullets.length >= 6) return;
      shooter.bullets.push({ x: shooter.shipX, y: shooter.height - 48 });
      sfx("shoot");
    };
    state.shoot = () => shoot(state);

    loopRef.current = createLoop({
      update(dt) {
        state.time += dt;
        state.stars.update(dt);
        state.particles.update(dt);
        state.shake = Math.max(0, state.shake - dt * 40);
        state.invuln = Math.max(0, state.invuln - dt);

        const left = state.keys.ArrowLeft || state.keys.a;
        const right = state.keys.ArrowRight || state.keys.d;
        if (left) state.shipX -= 430 * dt;
        if (right) state.shipX += 430 * dt;
        state.shipX = clamp(state.shipX, 34, state.width - 34);

        state.bullets.forEach((bullet) => {
          bullet.y -= 640 * dt;
        });
        state.bullets = state.bullets.filter((bullet) => bullet.y > -20);

        state.enemies.forEach((enemy) => {
          enemy.y += enemy.vy * dt;
        });

        state.bullets.forEach((bullet) => {
          state.enemies.forEach((enemy) => {
            if (enemy.hit) return;
            if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < 30) {
              enemy.hit = true;
              bullet.dead = true;
              state.particles.burst(enemy.x, enemy.y, {
                color: enemy.correct ? "#38bdf8" : "#f87171",
                count: 18,
              });
              if (enemy.correct) {
                sfx("hit");
                state.score += 100 + state.round * 10;
                state.round += 1;
                setScore(state.score);
                setRound(state.round);
                spawnRound(state);
              } else {
                sfx("wrong");
                state.score = Math.max(0, state.score - 40);
                state.shake = 10;
                setScore(state.score);
              }
            }
          });
        });
        state.bullets = state.bullets.filter((bullet) => !bullet.dead);
        state.enemies = state.enemies.filter((enemy) => !enemy.hit);

        const escaped = state.enemies.find((enemy) => enemy.y > state.height - 24);
        if (escaped) {
          if (escaped.correct) {
            state.lives -= 1;
            state.shake = 14;
            sfx("wrong");
            setLives(state.lives);
            if (state.lives <= 0) {
              finish(state);
              return;
            }
          }
          state.enemies = state.enemies.filter((enemy) => enemy !== escaped);
          if (!state.enemies.some((enemy) => enemy.correct)) spawnRound(state);
        }
      },
      draw() {
        const { ctx, width, height } = state;
        ctx.save();
        if (state.shake > 0) {
          ctx.translate(rand(-state.shake, state.shake) / 3, rand(-state.shake, state.shake) / 3);
        }
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, "#060a18");
        sky.addColorStop(1, "#0b1224");
        ctx.fillStyle = sky;
        ctx.fillRect(-20, -20, width + 40, height + 40);
        state.stars.draw(ctx);

        state.particles.draw(ctx);
        state.enemies.forEach((enemy) => {
          ctx.globalAlpha = clamp((enemy.y + 40) / 80, 0, 1);
          drawEnemy(ctx, enemy.x, enemy.y, 24, enemy.hue);
          ctx.globalAlpha = 1;
          ctx.font = "700 13px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#e5e7eb";
          ctx.fillText(enemy.pair.english, enemy.x, enemy.y + 44);
        });

        state.bullets.forEach((bullet) => {
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 10;
          ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 14);
          ctx.shadowBlur = 0;
        });

        ctx.globalAlpha = state.invuln > 0 ? 0.45 : 1;
        drawShip(ctx, state.shipX, height - 40, 1, "#38bdf8");
        ctx.globalAlpha = 1;
        ctx.restore();
      },
    });
  }, [finish, spawnRound]);

  useEffect(() => {
    const down = (event) => {
      const state = gameRef.current;
      if (!state || !state.running) return;
      if (["ArrowLeft", "ArrowRight", "a", "d", " "].includes(event.key)) {
        event.preventDefault();
      }
      state.keys[event.key] = true;
      if (event.key === " " && state.shoot) state.shoot();
    };
    const up = (event) => {
      const state = gameRef.current;
      if (state) state.keys[event.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      if (loopRef.current) loopRef.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const onPointerMove = (event) => {
    const state = gameRef.current;
    if (!state || !state.running) return;
    const rect = canvasRef.current.getBoundingClientRect();
    state.shipX = clamp(event.clientX - rect.left, 34, state.width - 34);
  };

  const board = (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#060a18]">
      <canvas
        ref={canvasRef}
        className="block h-[520px] w-full touch-none"
        onPointerMove={onPointerMove}
        onPointerDown={() => gameRef.current?.shoot?.()}
      />
      {prompt && status === "playing" && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <div className="rounded-full border border-white/15 bg-black/55 px-5 py-2 text-center backdrop-blur">
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              Tarjimasi
            </span>
            <div className="text-base font-extrabold text-white">{prompt.uzbek}</div>
          </div>
        </div>
      )}

      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center text-white">
            <h2 className="text-2xl font-extrabold">
              {status === "over" ? "O'yin tugadi" : "Word Shooter"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Tarjimasi ko'rsatilgan so'zning inglizcha juftini otib tushiring.
              Xato so'z — jarima, to'g'ri so'z pastga tushsa — jon kamayadi.
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
      title="Word Shooter"
      tagline={`Bosqich ${round} · ${lives} jon`}
      score={score}
      best={best}
      isDark={isDark}
      onRestart={start}
    >
      {board}
    </GameShell>
  );
}
