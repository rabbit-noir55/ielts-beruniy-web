/**
 * Sprite'lar — vektor ko'rinishida chiziladi (tashqi rasm fayllarisiz).
 * Har bir funksiya canvas context va koordinata oladi.
 */

/** Yulduzlar maydoni (kosmik fon). */
export function createStarfield(width, height, count = 80) {
  const stars = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.4 + Math.random() * 1.4,
    speed: 6 + Math.random() * 40,
    alpha: 0.2 + Math.random() * 0.7,
  }));

  return {
    update(dt) {
      stars.forEach((star) => {
        star.y += star.speed * dt;
        if (star.y > height + 2) {
          star.y = -2;
          star.x = Math.random() * width;
        }
      });
    },
    draw(ctx) {
      stars.forEach((star) => {
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };
}

/** O'yinchi kemasi. */
export function drawShip(ctx, x, y, scale = 1, color = "#38bdf8") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(11, 10);
  ctx.lineTo(0, 5);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(-4, 6);
  ctx.lineTo(0, 16 + Math.random() * 5);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  ctx.restore();
}

/** Dushman sprite'i. */
export function drawEnemy(ctx, x, y, radius, hue = 340) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = `hsl(${hue} 82% 58%)`;
  ctx.shadowColor = `hsl(${hue} 82% 58%)`;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.restore();
}

/** Pufakcha (so'z yozuvi bilan). */
export function drawBubble(ctx, x, y, radius, color, text) {
  ctx.save();
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.35,
    radius * 0.2,
    x,
    y,
    radius
  );
  gradient.addColorStop(0, `${color}dd`);
  gradient.addColorStop(1, `${color}66`);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = `${color}`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  let fontSize = Math.max(11, Math.round(radius * 0.38));
  ctx.font = `700 ${fontSize}px Inter, sans-serif`;
  while (fontSize > 9 && ctx.measureText(text).width > radius * 1.55) {
    fontSize -= 1;
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Oltin tanga. */
export function drawCoin(ctx, x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#f59e0b";
  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Yurak (jon). */
export function drawHeart(ctx, x, y, size, filled = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size, -size * 0.5, -size * 0.5, -size, 0, -size * 0.35);
  ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.5, 0, size * 0.3);
  ctx.closePath();
  ctx.fillStyle = filled ? "#ef4444" : "rgba(255,255,255,0.16)";
  ctx.fill();
  ctx.restore();
}

/** Zarra portlashi (qisqa animatsiya). */
export function drawShockwave(ctx, x, y, progress, color = "#38bdf8") {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * (1 - progress) + 0.5;
  ctx.beginPath();
  ctx.arc(x, y, 8 + progress * 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
