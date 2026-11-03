import { Link } from "react-router-dom";
import { useLang } from "../utils/LanguageContext";

const STATS = [
  { value: "79+", uz: "O'quvchi", en: "Students" },
  { value: "7.0+", uz: "Eng yuqori natija", en: "Top band" },
  { value: "20+", uz: "Podkast", en: "Podcasts" },
  { value: "4", uz: "Ta'lim yo'nalishi", en: "Study formats" },
];

const REASONS = [
  {
    icon: "◎",
    uz: {
      title: "Haqiqiy formatdagi mock",
      desc: "Vaqt chegarasi, baholash mezonlari va imtihon bosimi — hammasi asl IELTS kabi. Listening, Reading, Writing, Speaking.",
    },
    en: {
      title: "Mocks in the real format",
      desc: "Time limits, marking criteria and exam pressure — exactly like the real IELTS. Listening, Reading, Writing, Speaking.",
    },
  },
  {
    icon: "✎",
    uz: {
      title: "AI bilan tezkor fikr-mulohaza",
      desc: "Yozma ishingiz va speaking javoblaringiz bo'yicha bir necha daqiqada tahlil: band taxmini va aniq tuzatishlar.",
    },
    en: {
      title: "Instant AI feedback",
      desc: "Analysis of your writing and speaking within minutes: an estimated band and concrete corrections.",
    },
  },
  {
    icon: "◍",
    uz: {
      title: "Kichik guruhlar",
      desc: "Har bir o'quvchi bilan alohida ishlash imkoniyati. Guruh darajasiga moslashgan dastur va uy vazifalari.",
    },
    en: {
      title: "Small groups",
      desc: "Individual attention for every student. A programme and homework that match the level of the group.",
    },
  },
  {
    icon: "★",
    uz: {
      title: "Haftalik natija nazorati",
      desc: "Har hafta 5 ta yo'nalish: Writing, Vocabulary, Reading, Speaking va Random speaking. Har biri 20 ball.",
    },
    en: {
      title: "Weekly progress control",
      desc: "Five areas every week: Writing, Vocabulary, Reading, Speaking and Random speaking. 20 points each.",
    },
  },
];

const GROUPS = [
  {
    tag: "IELTS",
    uz: {
      title: "IELTS tayyorgarlik",
      desc: "Akademik maqsad uchun to'liq tayyorgarlik: 4 ta ko'nikma, mock testlar va individual tahlil. 6.0–7.5+ oralig'ida natija uchun.",
    },
    en: {
      title: "IELTS preparation",
      desc: "Full academic preparation: four skills, mock tests and individual analysis. Built for results between 6.0 and 7.5+.",
    },
  },
  {
    tag: "Round Up",
    uz: {
      title: "Round Up — umumiy ingliz tili",
      desc: "Grammatika va lug'at asosida tilni mustahkamlash. IELTS'ga hali tayyor bo'lmaganlar uchun mustahkam poydevor.",
    },
    en: {
      title: "Round Up — general English",
      desc: "Strengthen the language through grammar and vocabulary. A solid foundation for those not ready for IELTS yet.",
    },
  },
];

const FEATURES = [
  { uz: "Mock testlar", en: "Mock tests" },
  { uz: "AI Writing feedback", en: "AI Writing feedback" },
  { uz: "AI Speaking feedback", en: "AI Speaking feedback" },
  { uz: "Lug'at va Vocabulary quiz", en: "Dictionary & vocabulary quiz" },
  { uz: "Typing mashqi", en: "Typing practice" },
  { uz: "Interaktiv o'yinlar", en: "Interactive games" },
  { uz: "Band calculator", en: "Band calculator" },
  { uz: "Haftalik league", en: "Weekly league" },
];

const STEPS = [
  {
    n: "01",
    uz: { title: "Ro'yxatdan o'ting", desc: "Saytda akkaunt yarating — bu bir daqiqa oladi." },
    en: { title: "Create an account", desc: "Sign up on the site — it takes a minute." },
  },
  {
    n: "02",
    uz: { title: "Darajani aniqlaymiz", desc: "Qisqa suhbat va test orqali hozirgi darajangizni aniqlaymiz." },
    en: { title: "We assess your level", desc: "A short interview and test show where you are now." },
  },
  {
    n: "03",
    uz: { title: "Guruhingizga qo'shilasiz", desc: "Daraja va maqsadga mos guruhga biriktiriladi va darslar boshlanadi." },
    en: { title: "Join your group", desc: "You are placed in a group that fits your level and goal." },
  },
];

const FAQ = [
  {
    uz: {
      q: "Markazga kelmasdan foydalana olamanmi?",
      a: "Ha. Saytdagi mock testlar, AI feedback va asboblar ro'yxatdan o'tgan har bir foydalanuvchi uchun ochiq. Darslar esa faqat guruhga biriktirilgan o'quvchilar uchun.",
    },
    en: {
      q: "Can I use the platform without attending?",
      a: "Yes. Mock tests, AI feedback and the tools are open to every registered user. Lessons are available only to students assigned to a group.",
    },
  },
  {
    uz: {
      q: "Natijani qanday tekshiraman?",
      a: "Har bir mock test avtomatik baholanadi va natija profilingizda saqlanadi. Writing va Speaking uchun AI tahlili beriladi.",
    },
    en: {
      q: "How are results checked?",
      a: "Every mock is graded automatically and saved to your profile. Writing and Speaking come with an AI analysis.",
    },
  },
  {
    uz: {
      q: "Guruhga qanday qo'shilaman?",
      a: "Ro'yxatdan o'tgach darajangiz aniqlanadi va mos guruhga biriktirilasiz. Guruh, dars vaqti va o'qituvchi haqida ma'lumot profilingizda ko'rinadi.",
    },
    en: {
      q: "How do I join a group?",
      a: "After registration we assess your level and place you in a matching group. Your group, schedule and teacher appear in your profile.",
    },
  },
  {
    uz: {
      q: "Mock test pullikmi?",
      a: "Saytda ro'yxatdan o'tish bepul. Markaz o'quvchilari uchun mock va asboblar to'liq ochiq.",
    },
    en: {
      q: "Are mock tests paid?",
      a: "Registration is free. For enrolled students, mocks and tools are fully open.",
    },
  },
];

export default function AboutUs({ theme }) {
  const isDark = theme === "dark";
  const { lang } = useLang();
  const t = (uz, en) => (lang === "uz" ? uz : en);

  const card = `rounded-2xl border ${
    isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
  }`;
  const kicker = `mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
    isDark ? "border-white/15 text-white/50" : "border-black/[0.12] text-black/50"
  }`;

  return (
    <div
      className={`min-h-screen pt-28 pb-20 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* ── Hero ───────────────────────────────────────── */}
        <section>
          <span className={kicker}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {t("Biz haqimizda", "About us")}
          </span>

          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {t(
              "IELTS Beruniy — natijaga olib boradigan tayyorgarlik",
              "IELTS Beruniy — preparation that leads to results",
            )}
          </h1>

          <p className={`mt-4 max-w-2xl text-base leading-relaxed ${isDark ? "text-white/55" : "text-black/55"}`}>
            {t(
              "Biz ingliz tilini o'rgatamiz va IELTS'ga tayyorlaymiz. Markazda kichik guruhlarda dars o'tamiz, onlayn formatni ham qo'llab-quvvatlaymiz. Har bir o'quvchining natijasini haftalik nazorat qilamiz — shuning uchun tayyorgarlik uzluksiz va o'lchanadigan bo'ladi.",
              "We teach English and prepare students for IELTS. Lessons run in small groups, with online formats supported as well. Every student's progress is tracked weekly — so preparation stays continuous and measurable.",
            )}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90"
            >
              {t("Ro'yxatdan o'tish", "Create an account")}
            </Link>
            <Link
              to="/intro"
              className={`rounded-full border px-7 py-3.5 text-sm font-bold transition ${
                isDark
                  ? "border-white/20 text-white/80 hover:border-white/40"
                  : "border-black/15 text-black/70 hover:border-black/30"
              }`}
            >
              {t("Markaz bilan tanishish", "Explore the centre")}
            </Link>
          </div>
        </section>

        {/* ── Raqamlar ───────────────────────────────────── */}
        <section className={`mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4`}>
          {STATS.map((s) => (
            <div key={s.value} className={`${card} px-5 py-6 text-center`}>
              <div className="text-3xl font-extrabold tracking-tight">{s.value}</div>
              <div className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                {t(s.uz, s.en)}
              </div>
            </div>
          ))}
        </section>

        {/* ── Nima uchun biz ─────────────────────────────── */}
        <section className="mt-16">
          <span className={kicker}>{t("Nega biz", "Why us")}</span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("To'rt sabab", "Four reasons")}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {REASONS.map((r) => {
              const c = lang === "uz" ? r.uz : r.en;
              return (
                <div key={c.title} className={`${card} p-6`}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-lg text-[var(--accent)]">
                    {r.icon}
                  </div>
                  <h3 className="text-base font-bold">{c.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Guruhlar ───────────────────────────────────── */}
        <section className="mt-16">
          <span className={kicker}>{t("Yo'nalishlar", "Programmes")}</span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("Ikki yo'nalish", "Two tracks")}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {GROUPS.map((g) => {
              const c = lang === "uz" ? g.uz : g.en;
              return (
                <div key={g.tag} className={`${card} p-6`}>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? "bg-white/10 text-white/70" : "bg-black/[0.06] text-black/60"
                    }`}
                  >
                    {g.tag}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Platforma ──────────────────────────────────── */}
        <section className={`mt-16 ${card} p-6 sm:p-8`}>
          <span className={kicker}>{t("Platforma", "Platform")}</span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("Bir joyda hamma narsa", "Everything in one place")}
          </h2>
          <p className={`mt-2 max-w-2xl text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
            {t(
              "Darsdan tashqari mashg'ulotlar ham tizimga ulangan — natija tasodifga qolmaydi.",
              "Practice outside class is part of the system too — so results never depend on chance.",
            )}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <span
                key={f.en}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  isDark ? "border-white/12 text-white/65" : "border-black/10 text-black/65"
                }`}
              >
                {t(f.uz, f.en)}
              </span>
            ))}
          </div>
        </section>

        {/* ── Qadamlar ───────────────────────────────────── */}
        <section className="mt-16">
          <span className={kicker}>{t("Qanday boshlanadi", "How it starts")}</span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("Uch qadam", "Three steps")}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => {
              const c = lang === "uz" ? s.uz : s.en;
              return (
                <div key={s.n} className={`${card} p-6`}>
                  <div className={`text-xs font-bold ${isDark ? "text-white/30" : "text-black/30"}`}>
                    {s.n}
                  </div>
                  <h3 className="mt-2 text-base font-bold">{c.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────── */}
        <section className="mt-16">
          <span className={kicker}>FAQ</span>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t("Ko'p so'raladigan savollar", "Frequently asked")}
          </h2>

          <div className="mt-6 space-y-3">
            {FAQ.map((item) => {
              const c = lang === "uz" ? item.uz : item.en;
              return (
                <details key={c.q} className={`${card} group px-5 py-4`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                    {c.q}
                    <span
                      className={`text-lg transition-transform group-open:rotate-45 ${
                        isDark ? "text-white/35" : "text-black/35"
                      }`}
                    >
                      +
                    </span>
                  </summary>
                  <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
                    {c.a}
                  </p>
                </details>
              );
            })}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────── */}
        <section className={`mt-16 overflow-hidden ${card} p-8 text-center sm:p-12`}>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("Bugun boshlang", "Start today")}
          </h2>
          <p className={`mx-auto mt-3 max-w-lg text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
            {t(
              "Bir daqiqada ro'yxatdan o'ting — birinchi mock testingizni bepul sinab ko'ring.",
              "Sign up in a minute — try your first mock test for free.",
            )}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90"
            >
              {t("Ro'yxatdan o'tish", "Create an account")}
            </Link>
            <a
              href="https://t.me/ielts_beruniy_bot"
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full border px-7 py-3.5 text-sm font-bold transition ${
                isDark
                  ? "border-white/20 text-white/80 hover:border-white/40"
                  : "border-black/15 text-black/70 hover:border-black/30"
              }`}
            >
              Telegram
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
