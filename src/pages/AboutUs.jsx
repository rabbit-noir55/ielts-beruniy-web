import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * About Us — Swiss/editorial + restrained motion. Matn: o'zbek tilida.
 * Scroll reveal: 380ms, cubic-bezier(.25,.1,.25,1), y 12px, bir marta.
 * Barcha animatsiya `prefers-reduced-motion` ga bo'ysunadi (index.css).
 */

/* ── Scroll reveal ───────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ── SVG: band ko'rsatkichi ──────────────────────────────────────────── */
function BandGauge({ isDark, label, band }) {
  // Yoy 0..9 oralig'ini ifodalaydi — band qiymatiga qarab to'ladi.
  const ARC = 283;
  const ratio = Math.min(1, Math.max(0, band / 9));
  const offset = (ARC * (1 - ratio)).toFixed(1);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 220 132"
        className="w-full"
        role="img"
        aria-label={`${label}: ${band}`}
        style={{ "--gauge-offset": `${offset}px` }}
      >
        <path
          d="M20 116 A 90 90 0 0 1 200 116"
          fill="none"
          stroke="currentColor"
          strokeOpacity={isDark ? 0.12 : 0.1}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          className="gauge-arc"
          d="M20 116 A 90 90 0 0 1 200 116"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const a = Math.PI - (i * Math.PI) / 6;
          const x1 = 110 + Math.cos(a) * 74;
          const y1 = 116 - Math.sin(a) * 74;
          const x2 = 110 + Math.cos(a) * 66;
          const y2 = 116 - Math.sin(a) * 66;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <div className="text-3xl font-extrabold tracking-tight">{band}</div>
        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/35"}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── SVG: haftalik 5 ta task ─────────────────────────────────────────── */
function TaskStrip() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {["W", "WR", "RT", "S", "R"].map((k, i) => (
        <div key={k} className="task-sq flex flex-col items-center gap-1.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/15 text-[11px] font-bold text-black/65 dark:border-white/15 dark:text-white/70"
            style={
              i < 3
                ? { background: "var(--accent)", color: "var(--accent-contrast)", borderColor: "transparent" }
                : undefined
            }
          >
            {k}
          </span>
          <span className={`h-1 w-1 rounded-full ${i < 3 ? "bg-current opacity-70" : "opacity-0"}`} />
        </div>
      ))}
      <span className="ml-2 font-mono text-xs text-black/35 dark:text-white/35">60/100</span>
    </div>
  );
}

/* ── SVG ikonkalar ───────────────────────────────────────────────────── */
const ICONS = {
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M17.7 6.3l-2.5 2.5M8.8 15.2l-2.5 2.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="10" r="2.3" />
      <path d="M16 14.2c2.4.2 4.2 2 4.2 4.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M9 3.5v4M15 3.5v4" />
      <path d="M8.5 14h2M13.5 14h2M8.5 17h2" />
    </>
  ),
};

function Icon({ name, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/* ── Kontent (o'zbekcha) ─────────────────────────────────────────────── */
const FACTS = [
  { value: "79+", label: "O'quvchi" },
  { value: "8.5+", label: "Eng yuqori natija" },
  { value: "20+", label: "Podkast" },
  { value: "4", label: "Ta'lim formati" },
];

const PROBLEMS = [
  {
    n: "01",
    title: "Tizimsiz tayyorgarlik",
    desc: "Tasodifiy materiallar, turli manbalar va rejasiz mashqlar — natija baribir o'lchanmaydi.",
  },
  {
    n: "02",
    title: "Fikr-mulohaza kechikadi",
    desc: "Yozgan ishni tekshirish uchun haftalar ketadi. Xato takrorlanadi, chunki u ko'rinmaydi.",
  },
  {
    n: "03",
    title: "Natija ko'rinmaydi",
    desc: "Qaysi ko'nikma orqada qolgani noma'lum. Har bir urinish noldan boshlanadi.",
  },
];

const PRINCIPLES = [
  {
    n: "01",
    icon: "target",
    title: "Haqiqiy formatdagi mock",
    desc: "Vaqt chegarasi va baholash mezonlari asl imtihon bilan bir xil.",
  },
  {
    n: "02",
    icon: "spark",
    title: "Tezkor AI tahlili",
    desc: "Writing va Speaking bo'yicha bir necha daqiqada band taxmini va tuzatishlar.",
  },
  {
    n: "03",
    icon: "people",
    title: "Kichik guruhlar",
    desc: "Har bir o'quvchiga alohida e'tibor va darajaga mos dastur.",
  },
  {
    n: "04",
    icon: "calendar",
    title: "Haftalik nazorat",
    desc: "Har hafta 5 ta yo'nalish, har biri 20 ball — tayyorgarlik uzluksiz o'lchanadi.",
  },
];

const TRACKS = [
  {
    tag: "IELTS",
    title: "IELTS tayyorgarlik",
    desc: "Akademik maqsad uchun to'liq tayyorgarlik: to'rt ko'nikma, mock testlar va individual tahlil.",
    meta: ["Listening", "Reading", "Writing", "Speaking"],
  },
  {
    tag: "Round Up",
    title: "Umumiy ingliz tili",
    desc: "Grammatika va lug'at asosida tilni mustahkamlash — IELTS'ga hali tayyor bo'lmaganlar uchun mustahkam poydevor.",
    meta: ["Grammatika", "Lug'at", "Speaking", "Mashq"],
  },
];

const PLATFORM = [
  { t: "Mock testlar", d: "Haqiqiy format va avtomatik baholash" },
  { t: "Writing feedback", d: "Matn bo'yicha AI tahlili" },
  { t: "Speaking feedback", d: "Nutq bo'yicha AI bahosi" },
  { t: "Lug'at va quiz", d: "So'z boyligini mustahkamlash" },
  { t: "Typing", d: "Tez yozish mashqi" },
  { t: "O'yinlar", d: "Interaktiv mashqlar" },
  { t: "Band calculator", d: "Natijani hisoblash" },
  { t: "Haftalik league", d: "Natijalar reytingi" },
];

const STEPS = [
  { n: "01", title: "Ro'yxatdan o'tish", desc: "Saytda akkaunt yarating — bir daqiqada." },
  { n: "02", title: "Darajani aniqlash", desc: "Qisqa suhbat va test orqali hozirgi darajangizni aniqlaymiz." },
  { n: "03", title: "Guruhga qo'shilish", desc: "Maqsadga mos guruhga biriktirilasiz va darslar boshlanadi." },
];

const FAQ = [
  {
    q: "Markazga kelmasdan foydalana olamanmi?",
    a: "Ha. Ro'yxatdan o'tgan har bir foydalanuvchi mock testlar, AI feedback va asboblardan foydalana oladi. Darslar esa faqat guruhga biriktirilgan o'quvchilar uchun.",
  },
  {
    q: "Natija qanday tekshiriladi?",
    a: "Mock testlar avtomatik baholanadi va natija profilingizda saqlanadi. Writing va Speaking uchun AI tahlili beriladi.",
  },
  {
    q: "Guruhga qanday qo'shilaman?",
    a: "Ro'yxatdan o'tgach darajangiz aniqlanadi va mos guruhga biriktirilasiz. Guruh, jadval va o'qituvchi profilingizda ko'rinadi.",
  },
  {
    q: "Mock testlar pullikmi?",
    a: "Ro'yxatdan o'tish bepul. Markaz o'quvchilari uchun mock testlar va asboblar to'liq ochiq.",
  },
];

/* ── Sahifa ──────────────────────────────────────────────────────────── */
function SectionLabel({ n, isDark, children }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className={`font-mono text-[11px] ${isDark ? "text-white/30" : "text-black/30"}`}>{n}</span>
      <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-white/65" : "text-black/65"}`}>
        {children}
      </span>
    </div>
  );
}

export default function AboutUs({ theme }) {
  const isDark = theme === "dark";

  const rule = isDark ? "border-white/10" : "border-black/10";
  const muted = isDark ? "text-white/45" : "text-black/45";

  return (
    <div className={`min-h-screen pt-28 pb-24 ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">

        {/* ── 00 · BIZ HAQIMIZDA ─────────────────────── */}
        <section className="grid gap-10 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-7">
            <SectionLabel n="00" isDark={isDark}>Biz haqimizda</SectionLabel>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Tayyorgarlik
              <br />
              <span className={isDark ? "text-white/40" : "text-black/35"}>
                natija bilan o'lchanadi.
              </span>
            </h1>

            <p className={`mt-6 max-w-xl text-[15px] leading-relaxed ${muted}`}>
              IELTS Beruniy — Enthusiastic English loyihasi. Ingliz tilini o'rgatamiz va IELTS'ga
              tayyorlaymiz: kichik guruhlar, haqiqiy formatdagi mock testlar va har hafta
              o'lchanadigan natija.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Ro'yxatdan o'tish
              </Link>
              <Link
                to="/intro"
                className={`inline-flex min-h-12 items-center rounded-full border px-7 text-sm font-bold transition ${isDark ? "border-white/20 text-white/80 hover:border-white/45" : "border-black/15 text-black/70 hover:border-black/35"} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              >
                Markaz bilan tanishish
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="md:col-span-5 md:border-l md:pl-8">
            <div className={rule}>
              <BandGauge isDark={isDark} band={8.5} label="Eng yuqori natija" />
            </div>
            <div className={`mt-6 border-t ${rule}`}>
              {FACTS.map((f) => (
                <div key={f.value} className={`flex items-baseline justify-between border-b py-3.5 ${rule}`}>
                  <span className="text-lg font-extrabold tracking-tight">{f.value}</span>
                  <span className={`text-xs ${muted}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── 01 · MUAMMO ───────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="01" isDark={isDark}>Muammo</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              Nega ko'pchilik maqsadiga yetmaydi
            </h2>
          </Reveal>

          <div className="md:col-span-8">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 70}>
                <div className={`flex gap-6 border-b py-6 first:pt-0 ${rule}`}>
                  <span className={`font-mono text-xs ${isDark ? "text-white/25" : "text-black/25"}`}>{p.n}</span>
                  <div>
                    <h3 className="text-base font-bold">{p.title}</h3>
                    <p className={`mt-1.5 max-w-lg text-sm leading-relaxed ${muted}`}>{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 02 · YONDASHUV ────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="02" isDark={isDark}>Bizning yondashuv</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              To'rt tamoyil
            </h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>
              Har bir dars va mashq shu tamoyillarga bo'ysunadi.
            </p>

            <div className="mt-8">
              <TaskStrip />
              <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white/25" : "text-black/25"}`}>
                Haftalik nazorat
              </p>
            </div>
          </Reveal>

          <div className="md:col-span-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.n} delay={i * 80}>
                <div className="group">
                  <div className={`mb-4 h-px origin-left ${isDark ? "bg-white/25" : "bg-black/25"} transition-transform duration-300 group-hover:scale-x-[1.8]`} />
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/12 text-white/60 group-hover:border-white/30 group-hover:text-white/90" : "border-black/10 text-black/55 group-hover:border-black/30 group-hover:text-black/85"}`}>
                      <Icon name={p.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>{p.n}</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold">{p.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 03 · YO'NALISHLAR ─────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="03" isDark={isDark}>Yo'nalishlar</SectionLabel>
          </Reveal>

          <div className={`mt-6 border-t ${rule}`}>
            {TRACKS.map((g, i) => (
              <Reveal key={g.tag} delay={i * 90}>
                <div className={`grid gap-4 border-b py-8 md:grid-cols-12 md:items-start ${rule}`}>
                  <div className="md:col-span-3">
                    <span className={`inline-block font-mono text-[11px] uppercase tracking-[0.16em] ${isDark ? "text-white/65" : "text-black/65"}`}>
                      {g.tag}
                    </span>
                  </div>
                  <div className="md:col-span-5">
                    <h3 className="text-lg font-bold">{g.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{g.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 md:col-span-4 md:justify-end">
                    {g.meta.map((m) => (
                      <span key={m} className={`text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>{m}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 04 · PLATFORMA ────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="04" isDark={isDark}>Platforma</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              Darsdan tashqari tizim
            </h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>
              Mashq uyda davom etadi — natija tasodifga qolmaydi.
            </p>
          </Reveal>

          <div className="md:col-span-8 grid gap-x-10 sm:grid-cols-2">
            {PLATFORM.map((f, i) => (
              <Reveal key={f.t} delay={(i % 2) * 60}>
                <div className={`flex items-baseline justify-between gap-4 border-b py-3 ${rule}`}>
                  <span className="shrink-0 text-sm font-semibold">{f.t}</span>
                  <span className={`text-right text-xs ${muted}`}>{f.d}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 05 · JARAYON ──────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="05" isDark={isDark}>Qanday boshlanadi</SectionLabel>
          </Reveal>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className={`border-t pt-4 ${rule}`}>
                  <div className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>{s.n}</div>
                  <h3 className="mt-2 text-base font-bold">{s.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 06 · FAQ ──────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="06" isDark={isDark}>Savol-javob</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              Ko'p so'raladigan savollar
            </h2>
          </Reveal>

          <div className="md:col-span-8">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className={`group border-b ${rule}`}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                    {item.q}
                    <span className={`text-lg leading-none transition-transform duration-300 group-open:rotate-45 ${isDark ? "text-white/30" : "text-black/30"}`}>
                      +
                    </span>
                  </summary>
                  <p className={`max-w-2xl pb-5 text-sm leading-relaxed ${muted}`}>{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 07 · BOSHLASH ─────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel n="07" isDark={isDark}>Boshlash</SectionLabel>
                <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
                  Birinchi mock testingizni sinab ko'ring.
                </h2>
                <p className={`mt-3 max-w-md text-sm leading-relaxed ${muted}`}>
                  Ro'yxatdan o'tish bepul — bir daqiqada.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Ro'yxatdan o'tish
                </Link>
                <a
                  href="https://t.me/ielts_beruniy_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-12 items-center rounded-full border px-7 text-sm font-bold transition ${isDark ? "border-white/20 text-white/80 hover:border-white/45" : "border-black/15 text-black/70 hover:border-black/35"} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                >
                  Telegram
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className={`mt-20 flex flex-wrap items-center justify-between gap-2 border-t pt-6 text-xs ${rule} ${muted}`}>
          <span>IELTS Beruniy — Enthusiastic English loyihasi</span>
          <span className="font-mono">{new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
