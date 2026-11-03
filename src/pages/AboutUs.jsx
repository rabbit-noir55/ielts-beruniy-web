import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../utils/LanguageContext";

/**
 * About Us — Swiss/editorial + restrained motion.
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

/* ── SVG: band gauge ─────────────────────────────────────────────────── */
function BandGauge({ isDark, label, value }) {
  return (
    <div className="relative">
      <svg viewBox="0 0 220 132" className="w-full" role="img" aria-label={`${label}: ${value}`}>
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
        {/* ticklar */}
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
        <div className="text-3xl font-extrabold tracking-tight">{value}</div>
        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/35"}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── SVG: haftalik 5 ta task ─────────────────────────────────────────── */
function TaskStrip({ isDark }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {["W", "WR", "RT", "S", "R"].map((k, i) => (
        <div key={k} className="task-sq flex flex-col items-center gap-1.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[11px] font-bold ${
              isDark ? "border-white/15 text-white/70" : "border-black/15 text-black/65"
            }`}
            style={i < 3 ? { background: "var(--accent)", color: "var(--accent-contrast)", borderColor: "transparent" } : undefined}
          >
            {k}
          </span>
          <span className={`h-1 w-1 rounded-full ${i < 3 ? "bg-current opacity-70" : "opacity-0"}`} />
        </div>
      ))}
      <span className={`ml-2 font-mono text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>60/100</span>
    </div>
  );
}

/* ── SVG ikonkalar (stroke, currentColor) ────────────────────────────── */
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

/* ── Kontent ─────────────────────────────────────────────────────────── */
const FACTS = [
  { value: "79+", uz: "O'quvchi", en: "Students" },
  { value: "7.0+", uz: "Eng yuqori natija", en: "Highest band" },
  { value: "20+", uz: "Podkast", en: "Podcasts" },
  { value: "4", uz: "Ta'lim formati", en: "Study formats" },
];

const PROBLEMS = [
  {
    n: "01",
    uz: { title: "Tizimsiz tayyorgarlik", desc: "Tasodifiy materiallar, turli manbalar va rejasiz mashqlar — natija baribir o'lchanmaydi." },
    en: { title: "Preparation without a system", desc: "Random materials, scattered sources and unplanned practice — progress never gets measured." },
  },
  {
    n: "02",
    uz: { title: "Fikr-mulohaza kechikadi", desc: "Yozgan ishni tekshirish uchun haftalar ketadi. Xato takrorlanadi, chunki u ko'rinmaydi." },
    en: { title: "Feedback arrives too late", desc: "Checking a piece of writing takes weeks. Mistakes repeat because nobody sees them." },
  },
  {
    n: "03",
    uz: { title: "Natija ko'rinmaydi", desc: "Qaysi ko'nikma orqada qolgani noma'lum. Har bir urinish noldan boshlanadi." },
    en: { title: "Progress stays invisible", desc: "You cannot tell which skill is lagging. Every attempt starts from zero." },
  },
];

const PRINCIPLES = [
  {
    n: "01",
    icon: "target",
    uz: { title: "Haqiqiy formatdagi mock", desc: "Vaqt chegarasi va baholash mezonlari asl imtihon bilan bir xil." },
    en: { title: "Mocks in the real format", desc: "Time limits and marking criteria match the actual exam." },
  },
  {
    n: "02",
    icon: "spark",
    uz: { title: "Tezkor AI tahlili", desc: "Writing va Speaking bo'yicha bir necha daqiqada band taxmini va tuzatishlar." },
    en: { title: "Fast AI analysis", desc: "An estimated band and corrections for Writing and Speaking within minutes." },
  },
  {
    n: "03",
    icon: "people",
    uz: { title: "Kichik guruhlar", desc: "Har bir o'quvchiga alohida e'tibor va darajaga mos dastur." },
    en: { title: "Small groups", desc: "Individual attention for every student and a programme matched to the level." },
  },
  {
    n: "04",
    icon: "calendar",
    uz: { title: "Haftalik nazorat", desc: "Har hafta 5 ta yo'nalish, har biri 20 ball — tayyorgarlik uzluksiz o'lchanadi." },
    en: { title: "Weekly control", desc: "Five areas every week, 20 points each — preparation is measured continuously." },
  },
];

const TRACKS = [
  {
    tag: "IELTS",
    uz: { title: "IELTS tayyorgarlik", desc: "Akademik maqsad uchun to'liq tayyorgarlik: to'rt ko'nikma, mock testlar va individual tahlil.", meta: ["Listening", "Reading", "Writing", "Speaking"] },
    en: { title: "IELTS preparation", desc: "Full academic preparation: four skills, mock tests and individual analysis.", meta: ["Listening", "Reading", "Writing", "Speaking"] },
  },
  {
    tag: "Round Up",
    uz: { title: "Umumiy ingliz tili", desc: "Grammatika va lug'at asosida tilni mustahkamlash — IELTS'ga tayyor bo'lmaganlar uchun poydevor.", meta: ["Grammar", "Vocabulary", "Speaking", "Practice"] },
    en: { title: "General English", desc: "Strengthen the language through grammar and vocabulary — a foundation before IELTS.", meta: ["Grammar", "Vocabulary", "Speaking", "Practice"] },
  },
];

const PLATFORM = [
  { uz: { t: "Mock testlar", d: "Haqiqiy format va avtomatik baholash" }, en: { t: "Mock tests", d: "Real format, automatic grading" } },
  { uz: { t: "Writing feedback", d: "Matn bo'yicha AI tahlili" }, en: { t: "Writing feedback", d: "AI analysis of your text" } },
  { uz: { t: "Speaking feedback", d: "Nutq bo'yicha AI bahosi" }, en: { t: "Speaking feedback", d: "AI scoring of your speech" } },
  { uz: { t: "Lug'at va quiz", d: "So'z boyligini mustahkamlash" }, en: { t: "Dictionary & quiz", d: "Build your vocabulary" } },
  { uz: { t: "Typing", d: "Tez yozish mashqi" }, en: { t: "Typing", d: "Speed typing practice" } },
  { uz: { t: "O'yinlar", d: "Interaktiv mashqlar" }, en: { t: "Games", d: "Interactive practice" } },
  { uz: { t: "Band calculator", d: "Natijani hisoblash" }, en: { t: "Band calculator", d: "Convert raw scores" } },
  { uz: { t: "Haftalik league", d: "Natijalar reytingi" }, en: { t: "Weekly league", d: "Progress leaderboard" } },
];

const STEPS = [
  { n: "01", uz: { title: "Ro'yxatdan o'tish", desc: "Saytda akkaunt yarating — bir daqiqada." }, en: { title: "Sign up", desc: "Create an account on the site — takes a minute." } },
  { n: "02", uz: { title: "Darajani aniqlash", desc: "Qisqa suhbat va test orqali hozirgi darajangizni aniqlaymiz." }, en: { title: "Level assessment", desc: "A short interview and test show where you are." } },
  { n: "03", uz: { title: "Guruhga qo'shilish", desc: "Maqsadga mos guruhga biriktirilasiz va darslar boshlanadi." }, en: { title: "Join a group", desc: "You are placed in a matching group and lessons begin." } },
];

const FAQ = [
  {
    uz: { q: "Markazga kelmasdan foydalana olamanmi?", a: "Ha. Ro'yxatdan o'tgan har bir foydalanuvchi mock testlar, AI feedback va asboblardan foydalana oladi. Darslar esa faqat guruhga biriktirilgan o'quvchilar uchun." },
    en: { q: "Can I use the platform without attending?", a: "Yes. Every registered user can use mock tests, AI feedback and the tools. Lessons are for students assigned to a group only." },
  },
  {
    uz: { q: "Natija qanday tekshiriladi?", a: "Mock testlar avtomatik baholanadi va natija profilingizda saqlanadi. Writing va Speaking uchun AI tahlili beriladi." },
    en: { q: "How are results checked?", a: "Mocks are graded automatically and saved to your profile. Writing and Speaking come with AI analysis." },
  },
  {
    uz: { q: "Guruhga qanday qo'shilaman?", a: "Ro'yxatdan o'tgach darajangiz aniqlanadi va mos guruhga biriktirilasiz. Guruh, jadval va o'qituvchi profilingizda ko'rinadi." },
    en: { q: "How do I join a group?", a: "After registration we assess your level and place you in a matching group. Your group, schedule and teacher appear in your profile." },
  },
  {
    uz: { q: "Mock testlar pullikmi?", a: "Ro'yxatdan o'tish bepul. Markaz o'quvchilari uchun mock testlar va asboblar to'liq ochiq." },
    en: { q: "Are mock tests paid?", a: "Registration is free. For enrolled students, mocks and tools are fully open." },
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
  const { lang } = useLang();
  const t = (uz, en) => (lang === "uz" ? uz : en);
  const tr = (o) => (lang === "uz" ? o.uz : o.en);

  const rule = isDark ? "border-white/10" : "border-black/10";
  const muted = isDark ? "text-white/45" : "text-black/45";

  return (
    <div className={`min-h-screen pt-28 pb-24 ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">

        {/* ── 00 · HERO ─────────────────────────────── */}
        <section className="grid gap-10 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-7">
            <SectionLabel n="00" isDark={isDark}>{t("Biz haqimizda", "About us")}</SectionLabel>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              {t("Tayyorgarlik", "Preparation")}
              <br />
              <span className={isDark ? "text-white/40" : "text-black/35"}>
                {t("natija bilan o'lchanadi.", "measured by results.")}
              </span>
            </h1>

            <p className={`mt-6 max-w-xl text-[15px] leading-relaxed ${muted}`}>
              {t(
                "IELTS Beruniy — Enthusiastic English loyihasi. Ingliz tilini o'rgatamiz va IELTS'ga tayyorlaymiz: kichik guruhlar, haqiqiy formatdagi mock testlar va har hafta o'lchanadigan natija.",
                "IELTS Beruniy is a project of Enthusiastic English. We teach English and prepare for IELTS: small groups, mocks in the real format, and progress measured every week.",
              )}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {t("Ro'yxatdan o'tish", "Create an account")}
              </Link>
              <Link
                to="/intro"
                className={`inline-flex min-h-12 items-center rounded-full border px-7 text-sm font-bold transition ${isDark ? "border-white/20 text-white/80 hover:border-white/45" : "border-black/15 text-black/70 hover:border-black/35"} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              >
                {t("Markaz bilan tanishish", "Explore the centre")}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="md:col-span-5 md:border-l md:pl-8">
            <div className={rule}>
              <BandGauge isDark={isDark} value="7.0" label={t("Eng yuqori natija", "Highest band")} />
            </div>
            <div className={`mt-6 border-t ${rule}`}>
              {FACTS.map((f) => (
                <div key={f.value} className={`flex items-baseline justify-between border-b py-3.5 ${rule}`}>
                  <span className="text-lg font-extrabold tracking-tight">{f.value}</span>
                  <span className={`text-xs ${muted}`}>{lang === "uz" ? f.uz : f.en}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── 01 · MUAMMO ───────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="01" isDark={isDark}>{t("Muammo", "The problem")}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("Nega ko'pchilik maqsadiga yetmaydi", "Why most people fall short")}
            </h2>
          </Reveal>

          <div className="md:col-span-8">
            {PROBLEMS.map((p, i) => {
              const c = tr(p);
              return (
                <Reveal key={p.n} delay={i * 70}>
                  <div className={`flex gap-6 border-b py-6 first:pt-0 ${rule}`}>
                    <span className={`font-mono text-xs ${isDark ? "text-white/25" : "text-black/25"}`}>{p.n}</span>
                    <div>
                      <h3 className="text-base font-bold">{c.title}</h3>
                      <p className={`mt-1.5 max-w-lg text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 02 · YONDASHUV ────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="02" isDark={isDark}>{t("Bizning yondashuv", "Our approach")}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("To'rt tamoyil", "Four principles")}
            </h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>
              {t("Har bir dars va mashq shu tamoyillarga bo'ysunadi.", "Every lesson and exercise follows these principles.")}
            </p>

            <div className="mt-8">
              <TaskStrip isDark={isDark} />
              <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white/25" : "text-black/25"}`}>
                {t("Haftalik nazorat", "Weekly control")}
              </p>
            </div>
          </Reveal>

          <div className="md:col-span-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => {
              const c = tr(p);
              return (
                <Reveal key={p.n} delay={i * 80}>
                  <div className="group">
                    <div className={`mb-4 h-px origin-left ${isDark ? "bg-white/25" : "bg-black/25"} transition-transform duration-300 group-hover:scale-x-[1.8]`} />
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/12 text-white/60 group-hover:border-white/30 group-hover:text-white/90" : "border-black/10 text-black/55 group-hover:border-black/30 group-hover:text-black/85"}`}>
                        <Icon name={p.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>{p.n}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold">{c.title}</h3>
                    <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 03 · YO'NALISHLAR ─────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="03" isDark={isDark}>{t("Yo'nalishlar", "Programmes")}</SectionLabel>
          </Reveal>

          <div className={`mt-6 border-t ${rule}`}>
            {TRACKS.map((g, i) => {
              const c = tr(g);
              return (
                <Reveal key={g.tag} delay={i * 90}>
                  <div className={`grid gap-4 border-b py-8 md:grid-cols-12 md:items-start ${rule}`}>
                    <div className="md:col-span-3">
                      <span className={`inline-block font-mono text-[11px] uppercase tracking-[0.16em] ${isDark ? "text-white/65" : "text-black/65"}`}>
                        {g.tag}
                      </span>
                    </div>
                    <div className="md:col-span-5">
                      <h3 className="text-lg font-bold">{c.title}</h3>
                      <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 md:col-span-4 md:justify-end">
                      {c.meta.map((m) => (
                        <span key={m} className={`text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>{m}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 04 · PLATFORMA ────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="04" isDark={isDark}>{t("Platforma", "Platform")}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("Darsdan tashqari tizim", "The system outside class")}
            </h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>
              {t("Mashq uyda davom etadi — natija tasodifga qolmaydi.", "Practice continues at home — results never depend on chance.")}
            </p>
          </Reveal>

          <div className="md:col-span-8 grid gap-x-10 sm:grid-cols-2">
            {PLATFORM.map((f, i) => {
              const c = tr(f);
              return (
                <Reveal key={c.t} delay={(i % 2) * 60}>
                  <div className={`flex items-baseline justify-between gap-4 border-b py-3 ${rule}`}>
                    <span className="shrink-0 text-sm font-semibold">{c.t}</span>
                    <span className={`text-right text-xs ${muted}`}>{c.d}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 05 · JARAYON ──────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="05" isDark={isDark}>{t("Qanday boshlanadi", "How it starts")}</SectionLabel>
          </Reveal>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => {
              const c = tr(s);
              return (
                <Reveal key={s.n} delay={i * 90}>
                  <div className={`border-t pt-4 ${rule}`}>
                    <div className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>{s.n}</div>
                    <h3 className="mt-2 text-base font-bold">{c.title}</h3>
                    <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 06 · FAQ ──────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="06" isDark={isDark}>FAQ</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("Savollar", "Questions")}
            </h2>
          </Reveal>

          <div className="md:col-span-8">
            {FAQ.map((item, i) => {
              const c = tr(item);
              return (
                <Reveal key={c.q} delay={i * 60}>
                  <details className={`group border-b ${rule}`}>
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                      {c.q}
                      <span className={`text-lg leading-none transition-transform duration-300 group-open:rotate-45 ${isDark ? "text-white/30" : "text-black/30"}`}>
                        +
                      </span>
                    </summary>
                    <p className={`max-w-2xl pb-5 text-sm leading-relaxed ${muted}`}>{c.a}</p>
                  </details>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 07 · CTA ──────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel n="07" isDark={isDark}>{t("Boshlash", "Start")}</SectionLabel>
                <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
                  {t("Birinchi mock testingizni sinab ko'ring.", "Try your first mock test.")}
                </h2>
                <p className={`mt-3 max-w-md text-sm leading-relaxed ${muted}`}>
                  {t("Ro'yxatdan o'tish bepul — bir daqiqada.", "Registration is free — takes a minute.")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {t("Ro'yxatdan o'tish", "Create an account")}
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
          <span>{t("IELTS Beruniy — Enthusiastic English loyihasi", "IELTS Beruniy — a project of Enthusiastic English")}</span>
          <span className="font-mono">{new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
