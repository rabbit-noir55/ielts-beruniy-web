import { Link } from "react-router-dom";
import { useLang } from "../utils/LanguageContext";

/**
 * About Us — Swiss/editorial minimal.
 * 12-ustunli grid, raqamlangan bo'limlar, ingichka chiziqlar, bitta aksent.
 * Dekoratsiya yo'q: faqat tipografiya va bo'sh joy.
 */

const FACTS = [
  { value: "79+", uz: "O'quvchi", en: "Students" },
  { value: "7.0+", uz: "Eng yuqori natija", en: "Highest band" },
  { value: "20+", uz: "Podkast", en: "Podcasts" },
  { value: "4", uz: "Ta'lim formati", en: "Study formats" },
];

const PROBLEMS = [
  {
    n: "01",
    uz: {
      title: "Tizimsiz tayyorgarlik",
      desc: "Tasodifiy materiallar, turli manbalar va rejasiz mashqlar — natija baribir o'lchanmaydi.",
    },
    en: {
      title: "Preparation without a system",
      desc: "Random materials, scattered sources and unplanned practice — progress never gets measured.",
    },
  },
  {
    n: "02",
    uz: {
      title: "Fikr-mulohaza kechikadi",
      desc: "Yozgan ishni tekshirish uchun haftalar ketadi. Xato takrorlanadi, chunki u ko'rinmaydi.",
    },
    en: {
      title: "Feedback arrives too late",
      desc: "Checking a piece of writing takes weeks. Mistakes repeat because nobody sees them.",
    },
  },
  {
    n: "03",
    uz: {
      title: "Natija ko'rinmaydi",
      desc: "Qaysi ko'nikma orqada qolgani noma'lum. Har bir urinish noldan boshlanadi.",
    },
    en: {
      title: "Progress stays invisible",
      desc: "You cannot tell which skill is lagging. Every attempt starts from zero.",
    },
  },
];

const PRINCIPLES = [
  {
    n: "01",
    uz: { title: "Haqiqiy formatdagi mock", desc: "Vaqt chegarasi va baholash mezonlari asl imtihon bilan bir xil." },
    en: { title: "Mocks in the real format", desc: "Time limits and marking criteria match the actual exam." },
  },
  {
    n: "02",
    uz: { title: "Tezkor AI tahlili", desc: "Writing va Speaking bo'yicha bir necha daqiqada band taxmini va tuzatishlar." },
    en: { title: "Fast AI analysis", desc: "An estimated band and corrections for Writing and Speaking within minutes." },
  },
  {
    n: "03",
    uz: { title: "Kichik guruhlar", desc: "Har bir o'quvchiga alohida e'tibor va darajaga mos dastur." },
    en: { title: "Small groups", desc: "Individual attention for every student and a programme matched to the level." },
  },
  {
    n: "04",
    uz: { title: "Haftalik nazorat", desc: "Har hafta 5 ta yo'nalish, har biri 20 ball — tayyorgarlik uzluksiz o'lchanadi." },
    en: { title: "Weekly control", desc: "Five areas every week, 20 points each — preparation is measured continuously." },
  },
];

const TRACKS = [
  {
    tag: "IELTS",
    uz: {
      title: "IELTS tayyorgarlik",
      desc: "Akademik maqsad uchun to'liq tayyorgarlik: to'rt ko'nikma, mock testlar va individual tahlil.",
      meta: ["Listening", "Reading", "Writing", "Speaking"],
    },
    en: {
      title: "IELTS preparation",
      desc: "Full academic preparation: four skills, mock tests and individual analysis.",
      meta: ["Listening", "Reading", "Writing", "Speaking"],
    },
  },
  {
    tag: "Round Up",
    uz: {
      title: "Umumiy ingliz tili",
      desc: "Grammatika va lug'at asosida tilni mustahkamlash — IELTS'ga tayyor bo'lmaganlar uchun poydevor.",
      meta: ["Grammar", "Vocabulary", "Speaking", "Practice"],
    },
    en: {
      title: "General English",
      desc: "Strengthen the language through grammar and vocabulary — a foundation before IELTS.",
      meta: ["Grammar", "Vocabulary", "Speaking", "Practice"],
    },
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
  {
    n: "01",
    uz: { title: "Ro'yxatdan o'tish", desc: "Saytda akkaunt yarating — bir daqiqada." },
    en: { title: "Sign up", desc: "Create an account on the site — takes a minute." },
  },
  {
    n: "02",
    uz: { title: "Darajani aniqlash", desc: "Qisqa suhbat va test orqali hozirgi darajangizni aniqlaymiz." },
    en: { title: "Level assessment", desc: "A short interview and test show where you are." },
  },
  {
    n: "03",
    uz: { title: "Guruhga qo'shilish", desc: "Maqsadga mos guruhga biriktirilasiz va darslar boshlanadi." },
    en: { title: "Join a group", desc: "You are placed in a matching group and lessons begin." },
  },
];

const FAQ = [
  {
    uz: {
      q: "Markazga kelmasdan foydalana olamanmi?",
      a: "Ha. Ro'yxatdan o'tgan har bir foydalanuvchi mock testlar, AI feedback va asboblardan foydalana oladi. Darslar esa faqat guruhga biriktirilgan o'quvchilar uchun.",
    },
    en: {
      q: "Can I use the platform without attending?",
      a: "Yes. Every registered user can use mock tests, AI feedback and the tools. Lessons are for students assigned to a group only.",
    },
  },
  {
    uz: {
      q: "Natija qanday tekshiriladi?",
      a: "Mock testlar avtomatik baholanadi va natija profilingizda saqlanadi. Writing va Speaking uchun AI tahlili beriladi.",
    },
    en: {
      q: "How are results checked?",
      a: "Mocks are graded automatically and saved to your profile. Writing and Speaking come with AI analysis.",
    },
  },
  {
    uz: {
      q: "Guruhga qanday qo'shilaman?",
      a: "Ro'yxatdan o'tgach darajangiz aniqlanadi va mos guruhga biriktirilasiz. Guruh, jadval va o'qituvchi profilingizda ko'rinadi.",
    },
    en: {
      q: "How do I join a group?",
      a: "After registration we assess your level and place you in a matching group. Your group, schedule and teacher appear in your profile.",
    },
  },
  {
    uz: {
      q: "Mock testlar pullikmi?",
      a: "Ro'yxatdan o'tish bepul. Markaz o'quvchilari uchun mock testlar va asboblar to'liq ochiq.",
    },
    en: {
      q: "Are mock tests paid?",
      a: "Registration is free. For enrolled students, mocks and tools are fully open.",
    },
  },
];

function SectionLabel({ n, isDark, children }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className={`font-mono text-[11px] ${isDark ? "text-white/30" : "text-black/30"}`}>
        {n}
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
          isDark ? "text-white/65" : "text-black/65"
        }`}
      >
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
  const mutedStrong = isDark ? "text-white/65" : "text-black/65";

  return (
    <div className={`min-h-screen pt-28 pb-24 ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">

        {/* ── 00 · HERO ───────────────────────────────────────── */}
        <section className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
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
          </div>

          {/* Faktlar varaqasi */}
          <aside className={`md:col-span-5 md:border-l md:pl-8 ${rule}`}>
            <div className={`border-t ${rule}`}>
              {FACTS.map((f) => (
                <div key={f.value} className={`flex items-baseline justify-between border-b ${rule} py-4`}>
                  <span className="text-2xl font-extrabold tracking-tight">{f.value}</span>
                  <span className={`text-xs ${muted}`}>{lang === "uz" ? f.uz : f.en}</span>
                </div>
              ))}
            </div>
            <p className={`mt-5 font-mono text-[11px] leading-relaxed ${isDark ? "text-white/25" : "text-black/25"}`}>
              {t("2026 · Beruniy, O'zbekiston", "2026 · Beruniy, Uzbekistan")}
            </p>
          </aside>
        </section>

        {/* ── 01 · MUAMMO ─────────────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <div className="md:col-span-4">
            <SectionLabel n="01" isDark={isDark}>{t("Muammo", "The problem")}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("Nega ko'pchilik maqsadiga yetmaydi", "Why most people fall short")}
            </h2>
          </div>

          <div className="md:col-span-8">
            {PROBLEMS.map((p) => {
              const c = tr(p);
              return (
                <div key={p.n} className={`flex gap-6 border-b py-6 first:pt-0 ${rule}`}>
                  <span className={`font-mono text-xs ${isDark ? "text-white/25" : "text-black/25"}`}>{p.n}</span>
                  <div>
                    <h3 className="text-base font-bold">{c.title}</h3>
                    <p className={`mt-1.5 max-w-lg text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 02 · YECHIM ─────────────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <div className="md:col-span-4">
            <SectionLabel n="02" isDark={isDark}>{t("Bizning yondashuv", "Our approach")}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("To'rt tamoyil", "Four principles")}
            </h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>
              {t(
                "Har bir dars va mashq shu tamoyillarga bo'ysunadi.",
                "Every lesson and exercise follows these principles.",
              )}
            </p>
          </div>

          <div className="md:col-span-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {PRINCIPLES.map((p) => {
              const c = tr(p);
              return (
                <div key={p.n}>
                  <div className={`mb-3 h-px w-10 ${isDark ? "bg-white/25" : "bg-black/25"}`} />
                  <div className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>{p.n}</div>
                  <h3 className="mt-1 text-base font-bold">{c.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 03 · YO'NALISHLAR ───────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <SectionLabel n="03" isDark={isDark}>{t("Yo'nalishlar", "Programmes")}</SectionLabel>

          <div className={`mt-6 border-t ${rule}`}>
            {TRACKS.map((g) => {
              const c = tr(g);
              return (
                <div key={g.tag} className={`grid gap-4 border-b py-8 md:grid-cols-12 md:items-start ${rule}`}>
                  <div className="md:col-span-3">
                    <span className={`inline-block font-mono text-[11px] uppercase tracking-[0.16em] ${mutedStrong}`}>
                      {g.tag}
                    </span>
                  </div>
                  <div className="md:col-span-5">
                    <h3 className="text-lg font-bold">{c.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                  </div>
                  <div className="md:col-span-4 flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
                    {c.meta.map((m) => (
                      <span key={m} className={`text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 04 · PLATFORMA ──────────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <div className="md:col-span-4">
            <SectionLabel n="04" isDark={isDark}>{t("Platforma", "Platform")}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("Darsdan tashqari tizim", "The system outside class")}
            </h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>
              {t(
                "Mashq uyda davom etadi — natija tasodifga qolmaydi.",
                "Practice continues at home — results never depend on chance.",
              )}
            </p>
          </div>

          <div className="md:col-span-8 grid gap-x-10 sm:grid-cols-2">
            {PLATFORM.map((f) => {
              const c = tr(f);
              return (
                <div key={c.t} className={`flex items-baseline justify-between border-b py-3 ${rule}`}>
                  <span className="text-sm font-semibold">{c.t}</span>
                  <span className={`ml-4 text-right text-xs ${muted}`}>{c.d}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 05 · JARAYON ────────────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <SectionLabel n="05" isDark={isDark}>{t("Qanday boshlanadi", "How it starts")}</SectionLabel>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => {
              const c = tr(s);
              return (
                <div key={s.n} className={`border-t pt-4 ${rule}`}>
                  <div className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>{s.n}</div>
                  <h3 className="mt-2 text-base font-bold">{c.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 06 · FAQ ────────────────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <div className="md:col-span-4">
            <SectionLabel n="06" isDark={isDark}>FAQ</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
              {t("Savollar", "Questions")}
            </h2>
          </div>

          <div className="md:col-span-8">
            {FAQ.map((item) => {
              const c = tr(item);
              return (
                <details key={c.q} className={`group border-b ${rule}`}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                    {c.q}
                    <span className={`text-lg leading-none transition-transform group-open:rotate-45 ${isDark ? "text-white/30" : "text-black/30"}`}>
                      +
                    </span>
                  </summary>
                  <p className={`max-w-2xl pb-5 text-sm leading-relaxed ${muted}`}>{c.a}</p>
                </details>
              );
            })}
          </div>
        </section>

        {/* ── 07 · CTA ────────────────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel n="07" isDark={isDark}>{t("Boshlash", "Start")}</SectionLabel>
              <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
                {t("Birinchi mock testingizni sinab ko'ring.", "Try your first mock test.")}
              </h2>
              <p className={`mt-3 max-w-md text-sm leading-relaxed ${muted}`}>
                {t(
                  "Ro'yxatdan o'tish bepul — bir daqiqada.",
                  "Registration is free — takes a minute.",
                )}
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
        </section>

        <footer className={`mt-20 flex flex-wrap items-center justify-between gap-2 border-t pt-6 text-xs ${rule} ${muted}`}>
          <span>{t("IELTS Beruniy — Enthusiastic English loyihasi", "IELTS Beruniy — a project of Enthusiastic English")}</span>
          <span className="font-mono">{new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
