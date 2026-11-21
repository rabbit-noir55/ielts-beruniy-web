import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getUser } from "../utils/api";
import { isOnboardingDone, markOnboardingDone } from "../utils/onboarding";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function buildSteps(authed) {
  return [
    {
      title: "IELTS Beruniy'ga xush kelibsiz",
      text:
        "Saytni 30 soniyada tanishtirib chiqamiz: testlar, asboblar, o'yinlar va liga. Istalgan paytda o'tkazib yuborishingiz mumkin.",
    },
    {
      title: "Mock testlar",
      text:
        "Cambridge kitoblari va Our Mock — Listening, Reading, Writing va Speaking bir joyda. Natijalar profilingizda saqlanadi.",
      targets: { desktop: '[data-tour="mocks"]', mobile: '[data-tour="mobile-mock"]' },
    },
    {
      title: "Asboblar",
      text:
        "Band kalkulyator, lug'at, so'z hisoblagich, typing testi va AI yordamchi — hammasi bitta bo'limda.",
      targets: { desktop: '[data-tour="tools"]', mobile: '[data-tour="mobile-tools"]' },
    },
    {
      title: "O'yinlar",
      text:
        "15 ta o'yin: Word Shooter, Falling Words, Word Snake, xotira va boshqalar. Har birida ovoz, animatsiya va rekord bor.",
      targets: { desktop: '[data-tour="nav-/games"]' },
    },
    {
      title: "Haftalik liga",
      text:
        "Ustoz har hafta ptichka qo'yadi, siz ball yig'asiz. Examiner bo'lsangiz, PIN yoki biometrik tasdiqlash bilan baholaysiz.",
      targets: {
        desktop: '[data-tour="nav-/competition"]',
        mobile: '[data-tour="mobile-competition"]',
      },
    },
    {
      title: "Essential 4000",
      text:
        "Lessons bo'limida asosiy 4000 so'z, mashqlar va takrorlash. Har kuni 10 daqiqa — katta natija.",
      targets: {
        desktop: '[data-tour="nav-/lessons"]',
        mobile: '[data-tour="mobile-lessons"]',
      },
    },
    authed
      ? {
          title: "Hisob va sozlamalar",
          text:
            "Profil, natijalar, tema va til — shu yerda. Tungi rejimni ham bir bosishda almashtirasiz.",
          targets: { desktop: '[data-tour="account"]', mobile: '[data-tour="mobile-account"]' },
        }
      : {
          title: "Kirish",
          text:
            "Hisob yaratsangiz natijalar saqlanadi, liga va guruh sahifalari ochiladi. Google yoki Telegram bilan ham kirish mumkin.",
          targets: { desktop: '[data-tour="account"]', mobile: '[data-tour="mobile-account"]' },
        },
    {
      title: "Tayyormiz!",
      text:
        "Qo'llanmani istalgan payt Sozlamalar → Yordam bo'limidan qayta ko'rishingiz mumkin. Omad!",
    },
  ];
}

export default function OnboardingTour({ isDark, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState({ left: 16, top: 16, side: "none", arrowX: 0 });
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const cardRef = useRef(null);
  const previousFocusRef = useRef(null);
  const authed = Boolean(getUser()?.id);
  const steps = buildSteps(authed);
  const step = steps[index] || steps[0];
  const selector = step.targets ? step.targets[isMobile ? "mobile" : "desktop"] : null;

  const finish = useCallback(() => {
    setOpen(false);
    markOnboardingDone();
    setIndex(0);
    if (previousFocusRef.current?.focus) previousFocusRef.current.focus();
  }, []);

  const goNext = useCallback(() => {
    if (index >= steps.length - 1) {
      setOpen(false);
      markOnboardingDone();
      setIndex(0);
      if (previousFocusRef.current?.focus) previousFocusRef.current.focus();
      return;
    }
    setIndex(index + 1);
  }, [index, steps.length]);

  const goPrev = useCallback(() => {
    setIndex((value) => Math.max(0, value - 1));
  }, []);

  useEffect(() => {
    // Qo'llanma faqat tizimga kirgan foydalanuvchilarga ko'rsatiladi.
    if (disabled || !authed || isOnboardingDone()) return undefined;
    const timer = window.setTimeout(() => {
      previousFocusRef.current = document.activeElement;
      setIndex(0);
      setOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [disabled, authed]);

  useEffect(() => {
    const handler = () => {
      if (disabled || !authed) return;
      previousFocusRef.current = document.activeElement;
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("ielts:onboarding", handler);
    return () => window.removeEventListener("ielts:onboarding", handler);
  }, [disabled, authed]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Target'ni o'lchash va sahifada ko'rinadigan joyga surish.
  useEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const element = selector ? document.querySelector(selector) : null;
      if (!element) {
        setRect(null);
        return;
      }
      const style = window.getComputedStyle(element);
      const box = element.getBoundingClientRect();
      if (style.visibility === "hidden" || box.width === 0 || box.height === 0) {
        setRect(null);
        return;
      }
      setRect({ x: box.x, y: box.y, w: box.width, h: box.height });
    };

    if (selector) {
      const element = document.querySelector(selector);
      if (element) element.scrollIntoView({ block: "center", inline: "center" });
    }
    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 160);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, index, selector, isMobile]);

  // Tooltip joylashuvi: target ostida, sig'masa ustida.
  useLayoutEffect(() => {
    if (!open) return;
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;

    if (!rect) {
      setPos({
        left: Math.max(16, (vw - cw) / 2),
        top: Math.max(16, (vh - ch) / 2),
        side: "none",
        arrowX: 0,
      });
      return;
    }

    const gap = 16;
    let side = "bottom";
    let top = rect.y + rect.h + gap;
    if (top + ch > vh - 16) {
      if (rect.y - ch - gap >= 16) {
        side = "top";
        top = rect.y - ch - gap;
      } else {
        top = clamp(top, 16, vh - ch - 16);
      }
    }
    const left = clamp(rect.x + rect.w / 2 - cw / 2, 16, Math.max(16, vw - cw - 16));
    const arrowX = clamp(rect.x + rect.w / 2 - left, 26, cw - 26);
    setPos({ left, top, side, arrowX });
  }, [open, rect, index]);

  useEffect(() => {
    if (!open) return undefined;
    cardRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Tab") {
        const card = cardRef.current;
        if (!card) return;
        const focusable = card.querySelectorAll(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish, goNext, goPrev]);

  if (!open) return null;

  const isLast = index === steps.length - 1;
  const cardBg = isDark ? "bg-[#141416]/95" : "bg-white/95";

  return (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <div
        className={`absolute inset-0 ${rect ? "" : "bg-black/60"}`}
        onPointerDown={goNext}
        aria-hidden="true"
      />

      {rect && (
        <div
          className="pointer-events-none fixed z-[101] rounded-2xl transition-all duration-300 ease-out motion-reduce:transition-none"
          style={{
            left: rect.x - 6,
            top: rect.y - 6,
            width: rect.w + 12,
            height: rect.h + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl border-2 border-[var(--accent)]/80 motion-safe:animate-pulse motion-reduce:animate-none" />
        </div>
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-text"
        tabIndex={-1}
        style={{ left: pos.left, top: pos.top, width: "min(360px, calc(100vw - 32px))" }}
        className={`fixed z-[102] rounded-2xl border p-5 shadow-2xl outline-none backdrop-blur-xl ${cardBg} ${
          isDark ? "border-white/12 text-white" : "border-black/10 text-[#17171A]"
        }`}
      >
        {pos.side !== "none" && (
          <span
            className={`absolute h-3 w-3 rotate-45 border ${cardBg} ${
              isDark ? "border-white/12" : "border-black/10"
            } ${pos.side === "top" ? "border-l-0 border-t-0" : "border-b-0 border-r-0"}`}
            style={{
              left: pos.arrowX - 6,
              top: pos.side === "top" ? "calc(100% - 5px)" : "-5px",
            }}
            aria-hidden="true"
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-[var(--accent)]/12 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">
            {index + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold transition ${
              isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-black/45 hover:bg-black/5 hover:text-black"
            }`}
          >
            O'tkazish
          </button>
        </div>

        <h2 id="onboarding-title" className="mt-2 text-lg font-extrabold tracking-tight">
          {step.title}
        </h2>
        <p
          id="onboarding-text"
          className={`mt-1.5 text-sm leading-relaxed ${isDark ? "text-white/60" : "text-black/55"}`}
        >
          {step.text}
        </p>

        <div className="mt-4 flex items-center gap-1.5" aria-label="Qadamlar">
          {steps.map((item, dotIndex) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setIndex(dotIndex)}
              aria-label={`${dotIndex + 1}-qadam`}
              aria-current={dotIndex === index ? "step" : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? "w-6 bg-[var(--accent)]"
                  : dotIndex < index
                    ? "w-1.5 bg-[var(--accent)]/50"
                    : isDark
                      ? "w-1.5 bg-white/20"
                      : "w-1.5 bg-black/15"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition disabled:opacity-40 ${
              isDark
                ? "border-white/15 text-white/70 hover:bg-white/5"
                : "border-black/15 text-black/65 hover:bg-black/[0.04]"
            }`}
          >
            ← Orqaga
          </button>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 active:scale-[0.98]"
          >
            {isLast ? "Tugatish" : "Keyingi →"}
          </button>
        </div>
      </div>
    </div>
  );
}
