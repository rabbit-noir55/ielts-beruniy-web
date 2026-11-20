/** O'yin dvigateli: canvas o'lchami, loop, mayda yordamchilar. */

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (from, to, t) => from + (to - from) * t;
export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (items) => items[Math.floor(Math.random() * items.length)];

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Canvas'ni ekran o'lchamiga moslaydi (devicePixelRatio bilan). */
export function setupCanvas(canvas) {
  const context = canvas.getContext("2d");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx: context, width, height };
}

/** requestAnimationFrame loop; `stop()` bilan to'xtaydi. */
export function createLoop({ update, draw }) {
  let frameId = 0;
  let last = performance.now();
  let running = true;

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    frameId = requestAnimationFrame(frame);
  };

  frameId = requestAnimationFrame(frame);
  return {
    stop() {
      running = false;
      cancelAnimationFrame(frameId);
    },
  };
}

/** Klaviatura kiritishini boshqarish. */
export function createKeyboard(onKeyDown, onKeyUp) {
  const down = (event) => {
    if (event.repeat) return;
    onKeyDown(event);
  };
  window.addEventListener("keydown", down);
  if (onKeyUp) window.addEventListener("keyup", onKeyUp);
  return () => {
    window.removeEventListener("keydown", down);
    if (onKeyUp) window.removeEventListener("keyup", onKeyUp);
  };
}

/** Portlash / yulduzcha zarralari. */
export function createParticles() {
  let items = [];

  return {
    burst(x, y, { count = 14, color = "#ffffff", speed = 160, life = 0.6 } = {}) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = rand(speed * 0.3, speed);
        items.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life,
          maxLife: life,
          color,
          size: rand(1.5, 3.5),
        });
      }
    },
    update(dt) {
      items = items.filter((particle) => particle.life > 0);
      items.forEach((particle) => {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= 0.98;
        particle.vy = particle.vy * 0.98 + 20 * dt;
      });
    },
    draw(ctx) {
      items.forEach((particle) => {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
    clear() {
      items = [];
    },
  };
}

/** localStorage'dagi eng yaxshi natija. */
export function readBest(key) {
  try {
    return Number(localStorage.getItem(`ielts_game_best_${key}`)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(key, score) {
  const best = readBest(key);
  if (score <= best) return best;
  try {
    localStorage.setItem(`ielts_game_best_${key}`, String(score));
  } catch {
    /* xotira yopiq */
  }
  return score;
}
