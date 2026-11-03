import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * About Us — Swiss/editorial + restrained motion.
 * 3 til: o'zbek · русский · English (sahifa ichida tanlanadi, localStorage'da saqlanadi).
 * Scroll reveal 380ms, y 12px, bir marta. `prefers-reduced-motion` hurmat qilinadi.
 */

const LANGS = [
  { id: "uz", label: "UZ" },
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
];

const STORAGE_KEY = "about_lang";

/* ── Tarjimalar ──────────────────────────────────────────────────────── */
const T = {
  uz: {
    kicker: "Biz haqimizda",
    hero1: "Tayyorgarlik",
    hero2: "natija bilan o'lchanadi.",
    heroDesc:
      "IELTS Beruniy — Enthusiastic English loyihasi. 2020 yildan beri ingliz tilini o'rgatamiz va IELTS'ga tayyorlaymiz: kichik guruhlar, haqiqiy formatdagi mock testlar va har hafta o'lchanadigan natija.",
    cta1: "Ro'yxatdan o'tish",
    cta2: "Markaz bilan tanishish",
    gaugeLabel: "Eng yuqori natija",
    est: "2020 · Beruniy, O'zbekiston",
    facts: ["Yaroqli IELTS ball", "Eng yuqori natija", "Podkast", "Ta'lim formati"],

    sBrands: "Brendlar",
    hBrands: "Ikki brend — bitta asoschi",
    brandsDesc: "Ular bir-biriga bog'liq, lekin vazifalari boshqacha.",
    owns: "egalik qiladi",
    brand1: {
      tag: "O'quv markazi · Asosiy brend",
      name: "Enthusiastic English",
      desc: "Ingliz tilini o'rgatuvchi brend. Markazdagi darslar, mock natijalari va barcha yutuqlar shu brendga tegishli. Aynan shu brend boshqa ingliz kurslari bilan raqobat qiladi.",
      chips: ["Darslar", "Natijalar", "Sertifikatlar"],
    },
    brand2: {
      tag: "Trening platformasi · Neytral",
      name: "IELTS Beruniy",
      desc: "Betaraf mashq platformasi. Undan markazimiz o'quvchilari ham, boshqa o'quv markazlari o'quvchilari ham foydalanadi. Bu yerda raqobat yo'q — faqat mashq va o'lchov.",
      chips: ["Mock testlar", "AI feedback", "Asboblar"],
    },
    brandsNote: "IELTS Beruniy — Enthusiastic English egalik qiladigan, lekin mustaqil ishlaydigan platforma.",

    s1: "Muammo",
    h1: "Nega ko'pchilik maqsadiga yetmaydi",
    problems: [
      { title: "Tizimsiz tayyorgarlik", desc: "Tasodifiy materiallar, turli manbalar va rejasiz mashqlar — natija baribir o'lchanmaydi." },
      { title: "Fikr-mulohaza kechikadi", desc: "Yozgan ishni tekshirish uchun haftalar ketadi. Xato takrorlanadi, chunki u ko'rinmaydi." },
      { title: "Natija ko'rinmaydi", desc: "Qaysi ko'nikma orqada qolgani noma'lum. Har bir urinish noldan boshlanadi." },
    ],

    s2: "Bizning yondashuv",
    h2: "To'rt tamoyil",
    h2desc: "Har bir dars va mashq shu tamoyillarga bo'ysunadi.",
    weekly: "Haftalik nazorat",
    principles: [
      { title: "Haqiqiy formatdagi mock", desc: "Vaqt chegarasi va baholash mezonlari asl imtihon bilan bir xil." },
      { title: "Tezkor AI tahlili", desc: "Writing va Speaking bo'yicha bir necha daqiqada band taxmini va tuzatishlar." },
      { title: "Kichik guruhlar", desc: "Har bir o'quvchiga alohida e'tibor va darajaga mos dastur." },
      { title: "Haftalik nazorat", desc: "Har hafta 5 ta yo'nalish, har biri 20 ball — tayyorgarlik uzluksiz o'lchanadi." },
    ],

    s3: "Yo'nalishlar",
    tracks: [
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
    ],

    s4: "Platforma",
    h4: "Darsdan tashqari tizim",
    h4desc: "Mashq uyda davom etadi — natija tasodifga qolmaydi.",
    platform: [
      { t: "Mock testlar", d: "Haqiqiy format va avtomatik baholash" },
      { t: "Writing feedback", d: "Matn bo'yicha AI tahlili" },
      { t: "Speaking feedback", d: "Nutq bo'yicha AI bahosi" },
      { t: "Lug'at va quiz", d: "So'z boyligini mustahkamlash" },
      { t: "Typing", d: "Tez yozish mashqi" },
      { t: "O'yinlar", d: "Interaktiv mashqlar" },
      { t: "Band calculator", d: "Natijani hisoblash" },
      { t: "Haftalik league", d: "Natijalar reytingi" },
    ],

    s5: "Qanday boshlanadi",
    steps: [
      { title: "Ro'yxatdan o'tish", desc: "Saytda akkaunt yarating — bir daqiqada." },
      { title: "Darajani aniqlash", desc: "Qisqa suhbat va test orqali hozirgi darajangizni aniqlaymiz." },
      { title: "Guruhga qo'shilish", desc: "Maqsadga mos guruhga biriktirilasiz va darslar boshlanadi." },
    ],

    s6: "Savol-javob",
    h6: "Ko'p so'raladigan savollar",
    faq: [
      { q: "Markazga kelmasdan foydalana olamanmi?", a: "Ha. Ro'yxatdan o'tgan har bir foydalanuvchi mock testlar, AI feedback va asboblardan foydalana oladi. Darslar esa faqat guruhga biriktirilgan o'quvchilar uchun." },
      { q: "Natija qanday tekshiriladi?", a: "Mock testlar avtomatik baholanadi va natija profilingizda saqlanadi. Writing va Speaking uchun AI tahlili beriladi." },
      { q: "Guruhga qanday qo'shilaman?", a: "Ro'yxatdan o'tgach darajangiz aniqlanadi va mos guruhga biriktirilasiz. Guruh, jadval va o'qituvchi profilingizda ko'rinadi." },
      { q: "Mock testlar pullikmi?", a: "Ro'yxatdan o'tish bepul. Markaz o'quvchilari uchun mock testlar va asboblar to'liq ochiq." },
    ],

    s7: "Boshlash",
    h7: "Birinchi mock testingizni sinab ko'ring.",
    h7desc: "Ro'yxatdan o'tish bepul — bir daqiqada.",
    footer: "IELTS Beruniy — Enthusiastic English loyihasi",
  },

  ru: {
    kicker: "О нас",
    hero1: "Подготовка",
    hero2: "измеряется результатом.",
    heroDesc:
      "IELTS Beruniy — проект Enthusiastic English. С 2020 года мы обучаем английскому и готовим к IELTS: небольшие группы, мок-тесты в реальном формате и прогресс, который измеряется каждую неделю.",
    cta1: "Зарегистрироваться",
    cta2: "Познакомиться с центром",
    gaugeLabel: "Лучший результат",
    est: "2020 · Беруний, Узбекистан",
    facts: ["Действительный балл IELTS", "Лучший результат", "Подкасты", "Формата обучения"],

    sBrands: "Бренды",
    hBrands: "Два бренда — один основатель",
    brandsDesc: "Они связаны, но задачи у них разные.",
    owns: "владеет",
    brand1: {
      tag: "Учебный центр · Основной бренд",
      name: "Enthusiastic English",
      desc: "Бренд, который обучает английскому. Занятия в центре, результаты мок-тестов и все достижения принадлежат этому бренду. Именно он конкурирует с другими курсами английского.",
      chips: ["Занятия", "Результаты", "Сертификаты"],
    },
    brand2: {
      tag: "Тренировочная платформа · Нейтральная",
      name: "IELTS Beruniy",
      desc: "Нейтральная платформа для практики. Ею пользуются и наши ученики, и ученики других учебных центров. Здесь нет конкуренции — только практика и измерение.",
      chips: ["Мок-тесты", "AI feedback", "Инструменты"],
    },
    brandsNote: "IELTS Beruniy — платформа, которой владеет Enthusiastic English, но работает она самостоятельно.",

    s1: "Проблема",
    h1: "Почему большинство не достигает цели",
    problems: [
      { title: "Подготовка без системы", desc: "Случайные материалы, разрозненные источники и практика без плана — результат всё равно не измеряется." },
      { title: "Обратная связь приходит поздно", desc: "Проверка письменной работы занимает недели. Ошибка повторяется, потому что её не видно." },
      { title: "Результат не виден", desc: "Непонятно, какой навык отстаёт. Каждая попытка начинается с нуля." },
    ],

    s2: "Наш подход",
    h2: "Четыре принципа",
    h2desc: "Каждое занятие и упражнение подчиняются этим принципам.",
    weekly: "Недельный контроль",
    principles: [
      { title: "Мок-тесты в реальном формате", desc: "Лимит времени и критерии оценки совпадают с настоящим экзаменом." },
      { title: "Быстрый AI-анализ", desc: "Оценка band и правки по Writing и Speaking за несколько минут." },
      { title: "Небольшие группы", desc: "Внимание каждому ученику и программа под уровень." },
      { title: "Еженедельный контроль", desc: "Пять направлений каждую неделю, по 20 баллов — подготовка измеряется постоянно." },
    ],

    s3: "Направления",
    tracks: [
      {
        tag: "IELTS",
        title: "Подготовка к IELTS",
        desc: "Полная академическая подготовка: четыре навыка, мок-тесты и индивидуальный анализ.",
        meta: ["Listening", "Reading", "Writing", "Speaking"],
      },
      {
        tag: "Round Up",
        title: "Общий английский",
        desc: "Укрепляем язык через грамматику и лексику — прочная база для тех, кто ещё не готов к IELTS.",
        meta: ["Грамматика", "Лексика", "Speaking", "Практика"],
      },
    ],

    s4: "Платформа",
    h4: "Система вне занятий",
    h4desc: "Практика продолжается дома — результат не зависит от случая.",
    platform: [
      { t: "Мок-тесты", d: "Реальный формат и автопроверка" },
      { t: "Writing feedback", d: "AI-анализ вашего текста" },
      { t: "Speaking feedback", d: "AI-оценка вашей речи" },
      { t: "Словарь и квиз", d: "Пополнение словарного запаса" },
      { t: "Typing", d: "Практика быстрой печати" },
      { t: "Игры", d: "Интерактивные упражнения" },
      { t: "Band calculator", d: "Пересчёт баллов" },
      { t: "Недельная лига", d: "Рейтинг результатов" },
    ],

    s5: "Как начать",
    steps: [
      { title: "Регистрация", desc: "Создайте аккаунт на сайте — это минута." },
      { title: "Определение уровня", desc: "Короткое собеседование и тест покажут ваш текущий уровень." },
      { title: "Присоединение к группе", desc: "Вас распределяют в подходящую группу и начинаются занятия." },
    ],

    s6: "Вопросы и ответы",
    h6: "Частые вопросы",
    faq: [
      { q: "Могу ли я пользоваться без посещения центра?", a: "Да. Каждый зарегистрированный пользователь может использовать мок-тесты, AI feedback и инструменты. Занятия — только для учеников, закреплённых за группой." },
      { q: "Как проверяются результаты?", a: "Мок-тесты проверяются автоматически и сохраняются в профиле. Для Writing и Speaking даётся AI-анализ." },
      { q: "Как попасть в группу?", a: "После регистрации мы определяем уровень и закрепляем за подходящей группой. Группа, расписание и преподаватель отображаются в профиле." },
      { q: "Мок-тесты платные?", a: "Регистрация бесплатна. Для учеников центра мок-тесты и инструменты полностью открыты." },
    ],

    s7: "Начать",
    h7: "Попробуйте свой первый мок-тест.",
    h7desc: "Регистрация бесплатна — за минуту.",
    footer: "IELTS Beruniy — проект Enthusiastic English",
  },

  en: {
    kicker: "About us",
    hero1: "Preparation",
    hero2: "measured by results.",
    heroDesc:
      "IELTS Beruniy is a project of Enthusiastic English. Since 2020 we have taught English and prepared students for IELTS: small groups, mocks in the real format, and progress measured every week.",
    cta1: "Create an account",
    cta2: "Explore the centre",
    gaugeLabel: "Highest band",
    est: "2020 · Beruniy, Uzbekistan",
    facts: ["Valid IELTS results", "Highest band", "Podcasts", "Study formats"],

    sBrands: "Brands",
    hBrands: "Two brands — one founder",
    brandsDesc: "They are connected, but their roles are different.",
    owns: "owns",
    brand1: {
      tag: "Learning centre · Core brand",
      name: "Enthusiastic English",
      desc: "The brand that teaches English. Lessons at the centre, mock results and every achievement belong to it. This is the brand that competes with other English courses.",
      chips: ["Lessons", "Results", "Certificates"],
    },
    brand2: {
      tag: "Training platform · Neutral",
      name: "IELTS Beruniy",
      desc: "A neutral practice platform. It is used by our own students and by students of other centres alike. There is no competition here — only practice and measurement.",
      chips: ["Mock tests", "AI feedback", "Tools"],
    },
    brandsNote: "IELTS Beruniy is owned by Enthusiastic English, yet it operates independently.",

    s1: "The problem",
    h1: "Why most people fall short",
    problems: [
      { title: "Preparation without a system", desc: "Random materials, scattered sources and unplanned practice — progress never gets measured." },
      { title: "Feedback arrives too late", desc: "Checking a piece of writing takes weeks. Mistakes repeat because nobody sees them." },
      { title: "Progress stays invisible", desc: "You cannot tell which skill is lagging. Every attempt starts from zero." },
    ],

    s2: "Our approach",
    h2: "Four principles",
    h2desc: "Every lesson and exercise follows these principles.",
    weekly: "Weekly control",
    principles: [
      { title: "Mocks in the real format", desc: "Time limits and marking criteria match the actual exam." },
      { title: "Fast AI analysis", desc: "An estimated band and corrections for Writing and Speaking within minutes." },
      { title: "Small groups", desc: "Individual attention for every student and a programme matched to the level." },
      { title: "Weekly control", desc: "Five areas every week, 20 points each — preparation is measured continuously." },
    ],

    s3: "Programmes",
    tracks: [
      {
        tag: "IELTS",
        title: "IELTS preparation",
        desc: "Full academic preparation: four skills, mock tests and individual analysis.",
        meta: ["Listening", "Reading", "Writing", "Speaking"],
      },
      {
        tag: "Round Up",
        title: "General English",
        desc: "Strengthen the language through grammar and vocabulary — a foundation before IELTS.",
        meta: ["Grammar", "Vocabulary", "Speaking", "Practice"],
      },
    ],

    s4: "Platform",
    h4: "The system outside class",
    h4desc: "Practice continues at home — results never depend on chance.",
    platform: [
      { t: "Mock tests", d: "Real format, automatic grading" },
      { t: "Writing feedback", d: "AI analysis of your text" },
      { t: "Speaking feedback", d: "AI scoring of your speech" },
      { t: "Dictionary & quiz", d: "Build your vocabulary" },
      { t: "Typing", d: "Speed typing practice" },
      { t: "Games", d: "Interactive practice" },
      { t: "Band calculator", d: "Convert raw scores" },
      { t: "Weekly league", d: "Progress leaderboard" },
    ],

    s5: "How it starts",
    steps: [
      { title: "Sign up", desc: "Create an account on the site — takes a minute." },
      { title: "Level assessment", desc: "A short interview and test show where you are." },
      { title: "Join a group", desc: "You are placed in a matching group and lessons begin." },
    ],

    s6: "Questions",
    h6: "Frequently asked",
    faq: [
      { q: "Can I use the platform without attending?", a: "Yes. Every registered user can use mock tests, AI feedback and the tools. Lessons are for students assigned to a group only." },
      { q: "How are results checked?", a: "Mocks are graded automatically and saved to your profile. Writing and Speaking come with AI analysis." },
      { q: "How do I join a group?", a: "After registration we assess your level and place you in a matching group. Your group, schedule and teacher appear in your profile." },
      { q: "Are mock tests paid?", a: "Registration is free. For enrolled students, mocks and tools are fully open." },
    ],

    s7: "Start",
    h7: "Try your first mock test.",
    h7desc: "Registration is free — takes a minute.",
    footer: "IELTS Beruniy — a project of Enthusiastic English",
  },
};

const FACTS = [
  { value: "100+", idx: 0 },
  { value: "8.0+", idx: 1 },
  { value: "20+", idx: 2 },
  { value: "4", idx: 3 },
];

const PRINCIPLE_ICONS = ["target", "spark", "people", "calendar"];

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
  const ARC = 283;
  const ratio = Math.min(1, Math.max(0, band / 9));
  const offset = (ARC * (1 - ratio)).toFixed(1);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 220 132"
        className="w-full"
        role="img"
        aria-label={`${label}: ${Number(band).toFixed(1)}`}
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
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.25} strokeWidth="1.5" />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <div className="text-3xl font-extrabold tracking-tight">{Number(band).toFixed(1)}</div>
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
            style={i < 3 ? { background: "var(--accent)", color: "var(--accent-contrast)", borderColor: "transparent" } : undefined}
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

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

function BrandCard({ brand, isDark, solid }) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border p-6 transition-colors ${
        solid ? "" : "border-dashed"
      } ${isDark ? "border-white/12 bg-white/[0.02] hover:bg-white/[0.04]" : "border-black/[0.12] bg-white hover:bg-black/[0.01]"}`}
    >
      <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/35"}`}>
        {brand.tag}
      </span>
      <h3 className="mt-3 text-lg font-extrabold tracking-tight">{brand.name}</h3>
      <p className={`mt-2 flex-1 text-sm leading-relaxed ${isDark ? "text-white/45" : "text-black/45"}`}>
        {brand.desc}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {brand.chips.map((ch) => (
          <span
            key={ch}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] ${isDark ? "border-white/12 text-white/50" : "border-black/10 text-black/50"}`}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

function LangSwitch({ lang, setLang, isDark }) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 ${isDark ? "border-white/12" : "border-black/10"}`}
    >
      {LANGS.map((l) => {
        const active = lang === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={active}
            className={`min-h-8 rounded-full px-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : isDark
                  ? "text-white/40 hover:text-white/75"
                  : "text-black/40 hover:text-black/75"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AboutUs({ theme }) {
  const isDark = theme === "dark";

  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && T[saved]) return saved;
    } catch {
      /* localStorage yo'q */
    }
    return "uz";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const c = T[lang];

  const rule = isDark ? "border-white/10" : "border-black/10";
  const muted = isDark ? "text-white/45" : "text-black/45";

  return (
    <div className={`min-h-screen pt-28 pb-24 ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">

        {/* ── 00 · BIZ HAQIMIZDA ─────────────────────── */}
        <section className="grid gap-10 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className={`font-mono text-[11px] ${isDark ? "text-white/30" : "text-black/30"}`}>00</span>
                <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-white/65" : "text-black/65"}`}>
                  {c.kicker}
                </span>
              </div>
              <LangSwitch lang={lang} setLang={setLang} isDark={isDark} />
            </div>

            <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              {c.hero1}
              <br />
              <span className={isDark ? "text-white/40" : "text-black/35"}>{c.hero2}</span>
            </h1>

            <p className={`mt-6 max-w-xl text-[15px] leading-relaxed ${muted}`}>{c.heroDesc}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {c.cta1}
              </Link>
              <Link
                to="/intro"
                className={`inline-flex min-h-12 items-center rounded-full border px-7 text-sm font-bold transition ${isDark ? "border-white/20 text-white/80 hover:border-white/45" : "border-black/15 text-black/70 hover:border-black/35"} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              >
                {c.cta2}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="md:col-span-5 md:border-l md:pl-8">
            <div className={rule}>
              <BandGauge isDark={isDark} band={8.0} label={c.gaugeLabel} />
            </div>
            <div className={`mt-6 border-t ${rule}`}>
              {FACTS.map((f) => (
                <div key={f.value} className={`flex items-baseline justify-between border-b py-3.5 ${rule}`}>
                  <span className="text-lg font-extrabold tracking-tight">{f.value}</span>
                  <span className={`text-xs ${muted}`}>{c.facts[f.idx]}</span>
                </div>
              ))}
            </div>
            <p className={`mt-4 font-mono text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white/25" : "text-black/25"}`}>
              {c.est}
            </p>
          </Reveal>
        </section>

        {/* ── 01 · BRENDLAR ─────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="01" isDark={isDark}>{c.sBrands}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">{c.hBrands}</h2>
            <p className={`mt-3 max-w-xl text-sm leading-relaxed ${muted}`}>{c.brandsDesc}</p>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <Reveal>
              <BrandCard brand={c.brand1} isDark={isDark} solid />
            </Reveal>

            <div className="flex flex-col items-center justify-center gap-1 py-1 md:px-3">
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 rotate-90 md:rotate-0 ${isDark ? "text-white/30" : "text-black/25"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
              <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${isDark ? "text-white/25" : "text-black/25"}`}>
                {c.owns}
              </span>
            </div>

            <Reveal delay={90}>
              <BrandCard brand={c.brand2} isDark={isDark} />
            </Reveal>
          </div>

          <Reveal delay={160}>
            <p className={`mt-6 max-w-2xl border-l pl-4 text-xs leading-relaxed ${isDark ? "border-white/15 text-white/30" : "border-black/15 text-black/30"}`}>
              {c.brandsNote}
            </p>
          </Reveal>
        </section>

        {/* ── 02 · MUAMMO ───────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="02" isDark={isDark}>{c.s1}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">{c.h1}</h2>
          </Reveal>

          <div className="md:col-span-8">
            {c.problems.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className={`flex gap-6 border-b py-6 first:pt-0 ${rule}`}>
                  <span className={`font-mono text-xs ${isDark ? "text-white/25" : "text-black/25"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{p.title}</h3>
                    <p className={`mt-1.5 max-w-lg text-sm leading-relaxed ${muted}`}>{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 03 · YONDASHUV ────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="03" isDark={isDark}>{c.s2}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">{c.h2}</h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>{c.h2desc}</p>

            <div className="mt-8">
              <TaskStrip />
              <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white/25" : "text-black/25"}`}>
                {c.weekly}
              </p>
            </div>
          </Reveal>

          <div className="md:col-span-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {c.principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="group">
                  <div className={`mb-4 h-px origin-left ${isDark ? "bg-white/25" : "bg-black/25"} transition-transform duration-300 group-hover:scale-x-[1.8]`} />
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/12 text-white/60 group-hover:border-white/30 group-hover:text-white/90" : "border-black/10 text-black/55 group-hover:border-black/30 group-hover:text-black/85"}`}>
                      <Icon name={PRINCIPLE_ICONS[i]} className="h-[18px] w-[18px]" />
                    </span>
                    <span className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold">{p.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 04 · YO'NALISHLAR ─────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="04" isDark={isDark}>{c.s3}</SectionLabel>
          </Reveal>

          <div className={`mt-6 border-t ${rule}`}>
            {c.tracks.map((g, i) => (
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

        {/* ── 05 · PLATFORMA ────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="05" isDark={isDark}>{c.s4}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">{c.h4}</h2>
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${muted}`}>{c.h4desc}</p>
          </Reveal>

          <div className="md:col-span-8 grid gap-x-10 sm:grid-cols-2">
            {c.platform.map((f, i) => (
              <Reveal key={f.t} delay={(i % 2) * 60}>
                <div className={`flex items-baseline justify-between gap-4 border-b py-3 ${rule}`}>
                  <span className="shrink-0 text-sm font-semibold">{f.t}</span>
                  <span className={`text-right text-xs ${muted}`}>{f.d}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 06 · JARAYON ──────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <SectionLabel n="06" isDark={isDark}>{c.s5}</SectionLabel>
          </Reveal>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {c.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className={`border-t pt-4 ${rule}`}>
                  <div className={`font-mono text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-2 text-base font-bold">{s.title}</h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 07 · FAQ ──────────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule} grid gap-10 md:grid-cols-12`}>
          <Reveal className="md:col-span-4">
            <SectionLabel n="07" isDark={isDark}>{c.s6}</SectionLabel>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">{c.h6}</h2>
          </Reveal>

          <div className="md:col-span-8">
            {c.faq.map((item, i) => (
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

        {/* ── 08 · BOSHLASH ─────────────────────────── */}
        <section className={`mt-24 border-t pt-12 ${rule}`}>
          <Reveal>
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel n="08" isDark={isDark}>{c.s7}</SectionLabel>
                <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
                  {c.h7}
                </h2>
                <p className={`mt-3 max-w-md text-sm leading-relaxed ${muted}`}>{c.h7desc}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {c.cta1}
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
          <span>{c.footer}</span>
          <span className="font-mono">{new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
