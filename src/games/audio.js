/**
 * O'yin tovushlari — WebAudio orqali sintez qilinadi.
 * Tashqi audio fayl kerak emas; ovoz o'chirish holati localStorage'da.
 */

const MUTE_KEY = "ielts_games_muted";

let context = null;
let muted = false;

try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {
  muted = false;
}

function ensureContext() {
  if (typeof window === "undefined") return null;
  if (!context) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    context = new AudioCtx();
  }
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* xotira yopiq */
  }
}

function tone({ frequency, duration = 0.12, type = "sine", gain = 0.05, slide = 0 }) {
  const ctx = ensureContext();
  if (!ctx || muted) return;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (slide) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, frequency + slide),
      ctx.currentTime + duration
    );
  }
  volume.gain.setValueAtTime(gain, ctx.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

const SOUNDS = {
  click: () => tone({ frequency: 520, duration: 0.05, type: "triangle", gain: 0.03 }),
  type: () => tone({ frequency: 720, duration: 0.03, type: "square", gain: 0.015 }),
  shoot: () => {
    tone({ frequency: 880, duration: 0.08, type: "sawtooth", gain: 0.03, slide: -500 });
  },
  hit: () => tone({ frequency: 260, duration: 0.16, type: "triangle", gain: 0.06, slide: -120 }),
  wrong: () => {
    tone({ frequency: 180, duration: 0.18, type: "sawtooth", gain: 0.05, slide: -60 });
  },
  eat: () => tone({ frequency: 640, duration: 0.08, type: "sine", gain: 0.05, slide: 240 }),
  pop: () => tone({ frequency: 420, duration: 0.09, type: "sine", gain: 0.05, slide: 300 }),
  win: () => {
    [523, 659, 784, 1046].forEach((freq, index) => {
      window.setTimeout(() => tone({ frequency: freq, duration: 0.16, gain: 0.05 }), index * 90);
    });
  },
  lose: () => {
    [330, 262, 196].forEach((freq, index) => {
      window.setTimeout(
        () => tone({ frequency: freq, duration: 0.22, type: "triangle", gain: 0.05 }),
        index * 120
      );
    });
  },
};

export function sfx(name) {
  const play = SOUNDS[name];
  if (play) play();
}

/** So'zni ovozli o'qish (Spell Rush uchun). */
export function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* TTS yo'q */
  }
}
