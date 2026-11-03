import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Brend logo
const BRAND_LOGO = "/brand/logo.png";

// Podkastlar — youtubeId: youtube.com/watch?v=XXXXXXXXXXX dagi qism
const PODCASTS = [
  { id: 1, title: "Enthusiastic Talks #1", youtubeId: "rDRJc7ies_Q" },
  { id: 2, title: "Enthusiastic Talks #2", youtubeId: "ZQxqRywGHmc" },
  { id: 3, title: "Enthusiastic Talks #3", youtubeId: "gHiWNcx82TQ" },
  { id: 4, title: "Enthusiastic Talks #4", youtubeId: "ivf0yjeE2TQ" },
];
const EPISODE_COUNT = 20;
const PODCAST_CHANNEL_URL = "https://www.youtube.com/@enthusiasticenglish";

const FTL_VIDEO_ID = "1JoIqOHe0lk";
const DEBATE_VIDEO_SRC = "/debate.mov";

// Hamkorlar — public/ ildizidagi fayl nomlariga mos (m(3).png yo'q)
const PARTNERS = [
  { name: "Hamkor 1", logo: "/m(1).png" },
  { name: "Hamkor 2", logo: "/m(2).png" },
  { name: "Hamkor 4", logo: "/m(4).png" },
  { name: "Hamkor 5", logo: "/m(5).png" },
];

// Sertifikatlar — public/certificates/cert-1.jpg ... cert-79.jpg
const CERTIFICATE_COUNT = 79;
const CERTIFICATES = Array.from({ length: CERTIFICATE_COUNT }, (_, i) => ({
  id: i + 1,
  src: `/certificates/cert-${i + 1}.jpg`,
}));

const SERVICES = [
  {
    n: "01",
    tagKey: "Onlayn darslar",
    titleKey: "Uydan turib intensiv tayyorgarlik",
    descKey: "Jonli video darslar, uy vazifalari va shaxsiy nazorat.",
  },
  {
    n: "02",
    tagKey: "Oflayn darslar",
    titleKey: "Markazda kichik guruh darslari",
    descKey: "O'qituvchi bilan yuzma-yuz muloqot va tezkor fikr-mulohaza.",
  },
  {
    n: "03",
    tagKey: "Musobaqalar",
    titleKey: "Debat, viktorinalar va FTL",
    descKey: "Bilim va nutq ko'nikmalarini haqiqiy tomoshabin oldida sinang.",
  },
  {
    n: "04",
    tagKey: "Mock test",
    titleKey: "Haqiqiy IELTS formatidagi test",
    descKey: "Vaqt chegarasi va baholash mezonlari imtihonga to'liq mos.",
  },
];

const SKILLS = [
  {
    n: "01",
    tagKey: "Listening",
    titleKey: "Eshitib tushunish",
    descKey: "Vaqt chegarasi bilan haqiqiy audio format.",
  },
  {
    n: "02",
    tagKey: "Reading",
    titleKey: "O'qish va tahlil qilish",
    descKey: "Akademik matnlar, tez va aniq javoblar.",
  },
  {
    n: "03",
    tagKey: "Writing",
    titleKey: "Fikrni yozma ravishda ifodalash",
    descKey: "Baholash mezonlariga asoslangan Task 1 va Task 2.",
  },
  {
    n: "04",
    tagKey: "Speaking",
    titleKey: "Erkin muloqot",
    descKey: "Intervyu formatidagi jonli simulyatsiya.",
  },
];

const EVENTS = [
  {
    tagKey: "Musobaqa",
    titleKey: "Future Teacher",
    descKey: "Bo'lajak o'qituvchilar uchun mahorat musobaqasi.",
  },
  {
    tagKey: "Debat",
    titleKey: "IELTS guruh musobaqasi",
    descKey: "Guruh muhokamasi, fikrni himoya qilish.",
  },
  {
    tagKey: "Viktorina",
    titleKey: "Bilimlar musobaqasi",
    descKey: "Til va umumiy bilim bo'yicha qiziqarli kechki viktorina.",
  },
];

const TICKER_ITEMS = [
  "IELTS Beruniy",
  "Enthusiastic English",
  "Mock test",
  "Debat",
  "FTL",
  "Liga",
  "Sertifikatlar",
  "Podkast",
];

/* English Learning League — haftalik ballar. [W, WR, RT, S, G], 20 = to'liq,
   0 = ball yo'q, null = hali baholanmagan */
const LEAGUE_WEEKS = ["1-hafta", "2-hafta", "3-hafta", "4-hafta"];
const N = null;
const LEAGUE_DATA = [
  {
    name: "Amangeldiyeva Jumagul",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Usmanova Anora",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Isakova Baxtjan",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Davlatnazarova Zilola",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Abilkasinova Dilnura",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Baxtibayeva Diana",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Yuldasheva Bekposhsha",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Saliyeva Muqaddas",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, 0],
    ],
    total: 300,
  },
  {
    name: "Sadullayev Jahongir",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Nurmuxammedov Fayzbek",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Rajapbayeva Moxichexra",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 300,
  },
  {
    name: "Sobirov Ismoiljon",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 0, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 280,
  },
  {
    name: "Ismailova Nuray",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 0, 20, 20],
      [N, N, N, N, N],
    ],
    total: 280,
  },
  {
    name: "Bahramov Mehriddin",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 0, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 280,
  },
  {
    name: "Kenjaboyeva Kamshat",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 0, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 280,
  },
  {
    name: "Saparbayeva Farangiz",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 0, 20],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 280,
  },
  {
    name: "Davletbayeva Indira",
    weeks: [
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 0, 20, 0],
      [N, N, N, N, N],
    ],
    total: 260,
  },
  {
    name: "Sadullayeva Gulchexra",
    weeks: [
      [20, 0, 20, 20, 20],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 0],
      [N, N, N, N, N],
    ],
    total: 260,
  },
  {
    name: "Po'latova Farangiz",
    weeks: [
      [20, 20, 20, 20, 0],
      [20, 20, 20, 20, 20],
      [20, 20, 20, 20, 0],
      [N, N, N, N, N],
    ],
    total: 260,
  },
  {
    name: "Axmedjanova Mexrihon",
    weeks: [
      [20, 0, 20, 20, 0],
      [20, 20, 0, 20, 0],
      [20, 20, 20, 20, 20],
      [N, N, N, N, N],
    ],
    total: 220,
  },
];

const PATH_D =
  "M50,6 C 34,16 24,20 18,30 C 12,40 62,46 78,56 C 88,63 48,70 34,82";

/* ---------- yuqoridagi scroll-progress chizig'i ---------- */
function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = document.documentElement;
        const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
        if (ref.current) ref.current.style.transform = `scaleX(${p})`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed left-0 top-0 z-[60] h-[3px] w-full bg-transparent">
      <div
        ref={ref}
        className="h-full w-full origin-left bg-[var(--accent)] dark:bg-[var(--accent)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/* ---------- kursorga ergashuvchi nur ---------- */
function useCursorGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    let raf;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.08;
      pos.current.y += (target.current.y - pos.current.y) * 0.08;
      if (glowRef.current)
        glowRef.current.style.transform = `translate3d(${pos.current.x - 260}px, ${pos.current.y - 260}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return glowRef;
}

/* ---------- magnit tugma + bosilganda ripple effekti ---------- */
function MagneticButton({
  children,
  className = "",
  as = "button",
  onClick,
  ...rest
}) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.08s linear";
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.transform = "translate(0,0)";
  };
  const handleClick = (e) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const id = Date.now() + Math.random();
      setRipples((r) => [
        ...r,
        { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 650);
    }
    onClick?.(e);
  };

  const Tag = as;
  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="animate-ripple pointer-events-none absolute rounded-full bg-white/50"
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
        />
      ))}
      {children}
    </Tag>
  );
}

/* ---------- brend belgisi (g'ovak nafas olish animatsiyasi bilan) ---------- */
function BrandMark({ size = 34 }) {
  const [broken, setBroken] = useState(false);
  return broken ? (
    <div
      className="flex animate-breathe items-center justify-center rounded-xl border border-black/15 bg-white font-black text-black dark:border-white/15"
      style={{ width: size, height: size }}
    >
      B
    </div>
  ) : (
    <img
      src={BRAND_LOGO}
      alt="IELTS Beruniy"
      style={{ width: size, height: size }}
      className="animate-breathe rounded-xl border border-black/10 bg-white object-contain grayscale dark:border-white/10"
      onError={() => setBroken(true)}
    />
  );
}

/* ---------- scrollda 3D burilib paydo bo'ladigan karta ---------- */
function Tilt3D({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-out ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transform: visible
          ? "perspective(1000px) rotateX(0) rotateY(0) translateY(0) translateZ(0)"
          : "perspective(1000px) rotateX(20deg) rotateY(-16deg) translateY(50px) translateZ(-40px)",
        opacity: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- oddiy fade+slide reveal — matn bloklari uchun ---------- */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- maxsus dizaynli video pleer ---------- */
function fmtTime(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

function VideoPlayer({ src, className = "", aspectClass = "aspect-video" }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setStarted(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const onSeek = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width),
    );
    v.currentTime = ratio * v.duration;
    setProgress(ratio * 100);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div
      ref={wrapRef}
      className={`group relative ${aspectClass} w-full overflow-hidden rounded-2xl bg-black ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        className="h-full w-full cursor-pointer object-cover"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setCurrent(v.currentTime);
          if (v.duration) setProgress((v.currentTime / v.duration) * 100);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      {!playing && (
        <button
          onClick={togglePlay}
          aria-label="Videoni ijro etish"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition-transform duration-300 hover:scale-110 dark:bg-[var(--accent)]">
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-6 w-6"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-8 transition-opacity duration-300 ${started ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
      >
        <div
          onClick={onSeek}
          className="h-1.5 w-full cursor-pointer rounded-full bg-white/25"
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-white/85">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pauza" : "Ijro etish"}
            >
              {playing ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleMute}
              aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
            >
              {muted ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                </svg>
              )}
            </button>
            <span className="text-xs tabular-nums text-white/70">
              {fmtTime(current)} / {fmtTime(duration)}
            </span>
          </div>
          <button onClick={toggleFullscreen} aria-label="To'liq ekran">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- shine sweep + sichqoncha bilan yengil 3D og'ish ---------- */
function ShineCard({ className = "", children, tilt = true }) {
  const ref = useRef(null);
  const handleEnter = () => {
    const el = ref.current;
    if (el) el.style.transition = "transform .05s linear";
  };
  const handleMove = (e) => {
    if (!tilt) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform .5s ease";
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
  };
  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transformStyle: "preserve-3d" }}
      className={`group relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#141416] dark:shadow-none ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-white/[0.06]" />
      {children}
    </div>
  );
}

/* ---------- raqam yig'iluvchi ko'rsatkich ---------- */
function CountUp({ value, decimals = 0, suffix = "", duration = 1100 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setStarted(true),
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration]);
  return (
    <span ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------- skill yo'li: scroll bilan chizilib boruvchi SVG chiziq ---------- */
function PathDraw() {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const progress = Math.min(
            1,
            Math.max(0, (vh - rect.top) / (rect.height + vh * 0.3)),
          );
          path.style.strokeDashoffset = `${length * (1 - progress)}`;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d={PATH_D}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1.2"
          className="text-[#17171A] dark:text-white"
        />
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-[#17171A] dark:text-white"
        />
      </svg>
    </div>
  );
}

const PATH_POINTS = [
  { top: 6, left: 50 },
  { top: 30, left: 18 },
  { top: 56, left: 78 },
  { top: 82, left: 34 },
];

/* ---------- brend chizig'i — cheksiz o'tuvchi lenta ---------- */
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative z-10 overflow-hidden border-y border-black/[0.08] py-4 dark:border-white/10">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {items.map((t, i) => (
          <span
            key={i}
            className="font-display text-sm font-semibold text-black/35 dark:text-white/30"
          >
            {t}{" "}
            <span className="ml-10 text-black/15 dark:text-white/15">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- yulduzcha zarrachalar — CTA fonida ---------- */
// Deterministik pseudo-random (render paytida impure Math.random chaqirmaslik uchun)
const seeded01 = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function Sparkles({ count = 8 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: seeded01(i + 1) * 100,
        left: seeded01(i + 101) * 100,
        delay: seeded01(i + 201) * 2.4,
        size: 6 + seeded01(i + 301) * 7,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <svg
          key={s.id}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="animate-twinkle absolute text-[var(--accent)]"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        >
          <path d="M12 0l2.5 8.5L23 11l-8.5 2.5L12 23l-2.5-9.5L1 11l8.5-2.5z" />
        </svg>
      ))}
    </div>
  );
}

/* ---------- aylanuvchi conic-gradient ramka — CTA kartasi uchun ---------- */
function BorderTraceFrame({ children, className = "" }) {
  return (
    <div
      className={`relative mx-auto max-w-2xl overflow-hidden rounded-[28px] p-[1.5px] ${className}`}
    >
      <div className="animate-border-trace absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] h-[400px] rounded-[28px] bg-[conic-gradient(from_0deg,transparent_0deg,var(--accent)_70deg,transparent_160deg)] opacity-70 dark:opacity-80" />
      <div className="relative rounded-[28px] bg-[#F6F5F2] px-8 py-14 sm:px-14 dark:bg-[#0A0A0B]">
        {children}
      </div>
    </div>
  );
}

/* ---------- sertifikat devori — scrollda uchadi ---------- */
function CertificateWall() {
  const sectionRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const columns = useMemo(() => {
    const cols = [[], [], [], [], []];
    CERTIFICATES.forEach((c, i) => cols[i % cols.length].push(c));
    return cols.map((col) => [...col, ...col]);
  }, []);
  const speeds = [0.5, -0.35, 0.65, -0.45, 0.4];

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          setOffset((vh - rect.top) / (vh + rect.height));
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative h-[560px] overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#F0EEE9] dark:border-white/10 dark:bg-[#111113] md:h-[620px]"
    >
      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-4 md:grid-cols-5">
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="flex flex-col gap-4"
            style={{
              transform: `translateY(${(offset - 0.5) * speeds[ci] * 420}px)`,
              transition: "transform 0.1s linear",
            }}
          >
            {col.map((cert, j) => (
              <CertificateCard key={`${cert.id}-${j}`} cert={cert} />
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F0EEE9] to-transparent dark:from-[#111113]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F0EEE9] to-transparent dark:from-[#111113]" />
    </div>
  );
}

function CertificateCard({ cert }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:rotate-1 dark:border-white/10 dark:bg-[#1c1c1f] dark:shadow-none">
      {broken ? (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-black/[0.04] via-black/[0.01] to-black/[0.06] text-black/45 dark:from-white/[0.06] dark:via-white/[0.01] dark:to-white/[0.02] dark:text-white/45">
          <span
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
            }}
          />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-current/25 font-mono text-[11px] font-bold">
            {cert.id}
          </span>
          <span className="relative text-[8px] uppercase tracking-[0.22em] opacity-60">
            IELTS
          </span>
        </div>
      ) : (
        <img
          src={cert.src}
          alt={`Sertifikat ${cert.id}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover grayscale contrast-125"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}

/* ---------- reyting jadvalidagi haftalik yig'indi katakchasi ---------- */
function weekTotal(values) {
  if (values.every((v) => v === null)) return null;
  return values.reduce((sum, v) => sum + (v || 0), 0);
}

function WeekCell({ value }) {
  if (value === null) {
    return (
      <span className="inline-flex h-9 w-16 items-center justify-center rounded-lg bg-black/[0.04] text-xs font-bold text-black/30 dark:bg-white/[0.05] dark:text-white/25">
        –
      </span>
    );
  }
  let cls = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (value === 100)
    cls = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  else if (value === 0) cls = "bg-red-500/15 text-red-700 dark:text-red-400";
  return (
    <span
      className={`animate-scalepop inline-flex h-9 w-16 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${cls}`}
    >
      {value}
    </span>
  );
}

/* ---------- bo'lim sarlavhasi ustidagi animatsiyali belgi ---------- */
function Kicker({ children }) {
  return (
    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/[0.12] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black/50 dark:border-white/15 dark:text-white/50">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {children}
    </span>
  );
}

/* ---------- bo'lim sarlavhasi — kicker, sarlavha, ixtiyoriy izoh, o'suvchi chiziq ---------- */
function SectionHeader({ kicker, title, subtitle }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="mx-auto mb-16 max-w-xl text-center">
      <Kicker>{kicker}</Kicker>
      <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-black/50 dark:text-white/45">{subtitle}</p>
      )}
      <span
        className="animate-shimmer mx-auto mt-5 block h-[3px] w-16 origin-left rounded-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent bg-[length:200%_100%] transition-transform duration-700 ease-out"
        style={{ transform: visible ? "scaleX(1)" : "scaleX(0)" }}
      />
    </div>
  );
}

function LegendDot({ colorClass, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${colorClass}`} />
      {label}
    </span>
  );
}

/* ---------- English Learning League — reyting jadvali ---------- */
function LeagueTable() {
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="overflow-x-auto rounded-2xl border border-black/[0.08] dark:border-white/10"
    >
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/[0.08] dark:border-white/10">
            <th className="px-4 py-3 text-left font-bold text-black/60 dark:text-white/60">
              {"O'quvchi"}
            </th>
            {LEAGUE_WEEKS.map((w) => (
              <th
                key={w}
                className="border-l border-black/[0.08] px-2 py-3 text-center font-bold text-black/50 dark:border-white/10 dark:text-white/50"
              >
                {w}
              </th>
            ))}
            <th className="border-l border-black/[0.08] px-4 py-3 text-center font-bold text-black/60 dark:text-white/60">
              {"Jami"}
            </th>
          </tr>
        </thead>
        <tbody>
          {LEAGUE_DATA.map((row, i) => {
            const zebra = i % 2 === 1;
            const delay = Math.min(i * 35, 500);
            const medal =
              i === 0
                ? "bg-amber-400/25 text-amber-700 dark:text-amber-400"
                : i === 1
                  ? "bg-slate-300/40 text-slate-600 dark:text-slate-300"
                  : i === 2
                    ? "bg-orange-400/25 text-orange-700 dark:text-orange-400"
                    : "text-black/30 dark:text-white/25";
            return (
              <tr
                key={row.name}
                className={`border-b border-black/[0.05] dark:border-white/5 ${zebra ? "bg-[#EFEDE8] dark:bg-[#111113]" : ""}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-14px)",
                  transition: `opacity .5s ease ${delay}ms, transform .5s ease ${delay}ms`,
                }}
              >
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-transform duration-300 hover:scale-125 ${medal}`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-semibold text-black/80 dark:text-white/80">
                      {row.name}
                    </span>
                  </div>
                </td>
                {row.weeks.map((weekValues, wi) => (
                  <td
                    key={wi}
                    className="border-l border-black/[0.05] px-2 py-2 text-center dark:border-white/5"
                  >
                    <WeekCell value={weekTotal(weekValues)} />
                  </td>
                ))}
                <td className="border-l border-black/[0.08] px-4 py-2.5 text-center font-display text-base font-bold dark:border-white/10">
                  {row.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function IntroPage() {
  const glowRef = useCursorGlow();

  return (
    <div className="relative overflow-x-hidden bg-[#F6F5F2]/70 font-sans text-[#17171A] dark:bg-[#0A0A0B]/70 dark:text-[#F5F5F5]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-sans{ font-family:'Inter',sans-serif; }
        .font-display{ font-family:'Space Grotesk',sans-serif; letter-spacing:-0.01em; }
        @keyframes marquee{ from{transform:translateX(0);} to{transform:translateX(-50%);} }
        .animate-marquee{ animation:marquee 26s linear infinite; }
        @keyframes float{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        .animate-float{ animation:float 4.5s ease-in-out infinite; }
        @keyframes pulseGlow{ 0%,100%{ box-shadow:0 0 0 0 rgba(23,23,26,0.18);} 50%{ box-shadow:0 0 0 14px rgba(23,23,26,0);} }
        .animate-pulse-glow{ animation:pulseGlow 2.6s ease-out infinite; }
        .dark .animate-pulse-glow{ animation-name: pulseGlowDark; }
        @keyframes pulseGlowDark{ 0%,100%{ box-shadow:0 0 0 0 rgba(245,245,245,0.22);} 50%{ box-shadow:0 0 0 14px rgba(245,245,245,0);} }
        @keyframes wordUp{ from{ opacity:0; transform:translateY(24px);} to{ opacity:1; transform:translateY(0);} }
        .word-up{ display:inline-block; opacity:0; animation:wordUp .7s cubic-bezier(.16,.84,.44,1) forwards; }
        @keyframes spinSlow{ from{ transform:rotate(0deg);} to{ transform:rotate(360deg);} }
        .animate-spin-slow{ animation:spinSlow 22s linear infinite; }
        @keyframes spinSlowReverse{ from{ transform:rotate(360deg);} to{ transform:rotate(0deg);} }
        .animate-spin-slow-reverse{ animation:spinSlowReverse 30s linear infinite; }
        @keyframes shimmer{ 0%{ background-position:-200% 0;} 100%{ background-position:200% 0;} }
        .animate-shimmer{ background-size:200% 100%; animation:shimmer 2.4s linear infinite; }
        @keyframes softPing{ 0%{ transform:scale(1); opacity:0.7;} 75%,100%{ transform:scale(2.4); opacity:0;} }
        .animate-soft-ping{ animation:softPing 1.8s cubic-bezier(0,0,0.2,1) infinite; }
        @keyframes fadeInUp{ from{ opacity:0; transform:translateY(18px);} to{ opacity:1; transform:translateY(0);} }
        @keyframes scalePop{ 0%{ transform:scale(0.85); opacity:0;} 70%{ transform:scale(1.04); opacity:1;} 100%{ transform:scale(1); opacity:1;} }
        .animate-scalepop{ animation:scalePop .5s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes wiggle{ 0%,100%{ transform:rotate(0deg);} 25%{ transform:rotate(-6deg);} 75%{ transform:rotate(6deg);} }
        .hover-wiggle:hover{ animation:wiggle .4s ease-in-out; }
        @keyframes breathe{ 0%,100%{ transform:scale(1);} 50%{ transform:scale(1.04);} }
        .animate-breathe{ animation:breathe 3.6s ease-in-out infinite; }
        @keyframes twinkle{ 0%,100%{ opacity:0; transform:scale(0.4) rotate(0deg);} 50%{ opacity:1; transform:scale(1) rotate(90deg);} }
        .animate-twinkle{ animation:twinkle 2.4s ease-in-out infinite; }
        @keyframes borderTrace{ to{ transform:rotate(360deg);} }
        .animate-border-trace{ animation:borderTrace 4s linear infinite; }
        @keyframes ripple{ from{ transform:scale(0); opacity:.45;} to{ transform:scale(3); opacity:0;} }
        .animate-ripple{ animation:ripple .65s ease-out forwards; }
        @media (prefers-reduced-motion: reduce){ .animate-marquee,.animate-float,.animate-pulse-glow,.word-up,.animate-spin-slow,.animate-spin-slow-reverse,.animate-shimmer,.animate-soft-ping,.animate-scalepop,.animate-breathe,.animate-twinkle,.animate-border-trace,.animate-ripple,.hover-wiggle:hover{ animation:none !important; opacity:1 !important; } }
      `}</style>

      <ScrollProgress />
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[520px] w-[520px] rounded-full bg-[var(--accent)] opacity-[0.03] blur-[130px] md:block dark:bg-[var(--accent)] dark:opacity-[0.05]"
      />

      {/* HERO */}
      <section className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-16 text-center">
        <div className="intro-orb" style={{ width: 520, height: 320, top: "-4%", right: "-10%" }} />
        <div className="intro-orb-soft" style={{ width: 420, height: 260, bottom: "-6%", left: "-8%" }} />
        <svg
          viewBox="0 0 400 400"
          className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 text-black/[0.05] dark:text-white/[0.06]"
          fill="none"
        >
          <circle
            cx="200"
            cy="200"
            r="190"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="4 10"
          />
        </svg>
        <svg
          viewBox="0 0 400 400"
          className="animate-spin-slow-reverse pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 text-black/[0.06] dark:text-white/[0.08]"
          fill="none"
        >
          <circle
            cx="200"
            cy="200"
            r="150"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="1 8"
          />
        </svg>

        <Kicker>{"IELTS Beruniy"}</Kicker>
        <h1 className="font-display max-w-3xl text-[2.6rem] font-bold leading-[1.05] sm:text-6xl md:text-[5.2rem]">
          {"Salohiyatingizni yangi bosqichga olib chiqing"
            .split(" ")
            .map((w, i) => (
              <span
                key={i}
                className="word-up mr-3"
                style={{ animationDelay: `${i * 0.09}s` }}
              >
                {w}
              </span>
            ))}
        </h1>
        <Reveal delay={650}>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-black/50 dark:text-white/45">
            {
              "IELTS'ga tayyorgarlik shunchaki test emas — bu chet elda o'qish va yangi imkoniyatlar sari birinchi qadam."
            }
          </p>
        </Reveal>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <MagneticButton className="animate-pulse-glow rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] dark:hover:opacity-90">
            {"Darslarga yozilish"}
          </MagneticButton>
          <MagneticButton className="rounded-full border border-black/[0.15] px-8 py-4 text-sm font-bold text-black/70 transition-colors hover:border-black/30 dark:border-white/20 dark:text-white/80 dark:hover:border-white/40">
            {"Mock testni sinab ko'ring"}
          </MagneticButton>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-4">
          {[
            "Onlayn + oflayn darslar",
            `${EPISODE_COUNT}+ podkast epizodi`,
            `${CERTIFICATE_COUNT}+ sertifikat`,
            "Musobaqalar",
          ].map((label, i) => (
            <div
              key={label}
              className="animate-float rounded-full border border-black/[0.1] bg-black/[0.03] px-4 py-2 text-xs font-semibold text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              {label}
            </div>
          ))}
        </div>
      </section>

      <Ticker />

      {/* PARTNERS */}
      <div className="relative z-10 border-b border-black/[0.08] py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-14 gap-y-6 px-6">
          {PARTNERS.map((p, i) => (
            <img
              key={i}
              src={p.logo}
              alt={p.name}
              className="h-14 max-w-[140px] object-contain opacity-70 grayscale brightness-0 transition-all duration-300 hover:scale-105 hover:opacity-100 dark:invert dark:opacity-70 dark:hover:opacity-100 md:h-16"
            />
          ))}
        </div>
      </div>

      {/* XIZMATLAR */}
      <section
        id="services"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <Tilt3D>
          <SectionHeader
            kicker="Xizmatlarimiz"
            title="To'rtta yo'nalish, bitta maqsad"
            subtitle="Sizga mos formatni tanlang."
          />
        </Tilt3D>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Tilt3D key={s.n} delay={i * 110}>
              <ShineCard className="group h-full p-6 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.1] font-display text-sm font-bold text-black/70 transition-transform duration-500 group-hover:rotate-12 dark:border-white/15 dark:text-white/70">
                    {s.n}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-black/40 dark:text-white/40">
                    {s.tagKey}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-lg font-bold">
                  {s.titleKey}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-black/50 dark:text-white/45">
                  {s.descKey}
                </p>
              </ShineCard>
            </Tilt3D>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section
        id="skills"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <Tilt3D>
          <SectionHeader
            kicker="Metodika"
            title="Qanday ko'nikmalar rivojlantiriladi?"
            subtitle="Har bir o'quvchining individual ehtiyojlariga mos yondashuv."
          />
        </Tilt3D>

        <div className="relative mx-auto hidden h-[760px] max-w-2xl md:block">
          <PathDraw />
          {SKILLS.map((s, i) => {
            const pt = PATH_POINTS[i];
            const isRight = pt.left > 50;
            return (
              <div
                key={s.n}
                className="absolute"
                style={{
                  top: `${pt.top}%`,
                  left: `${pt.left}%`,
                  transform: "translate(-50%,-50%)",
                }}
              >
                <Tilt3D
                  delay={i * 120}
                  className={`flex items-center gap-4 ${isRight ? "" : "flex-row-reverse"}`}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-black/[0.1] bg-white font-display text-sm font-bold text-black/70 shadow-sm dark:border-white/15 dark:bg-[#141416] dark:text-white/70 dark:shadow-none">
                    {s.n}
                  </div>
                  <div className="w-56 rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#141416] dark:shadow-none">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-black/40 dark:text-white/40">
                      {s.tagKey}
                    </span>
                    <h3 className="font-display mt-1 text-base font-bold">
                      {s.titleKey}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-black/50 dark:text-white/45">
                      {s.descKey}
                    </p>
                  </div>
                </Tilt3D>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 md:hidden">
          {SKILLS.map((s, i) => (
            <Tilt3D key={s.n} delay={i * 100}>
              <div className="flex items-center gap-4 rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#141416] dark:shadow-none">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.1] font-display text-xs font-bold text-black/70 dark:border-white/15 dark:text-white/70">
                  {s.n}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-black/40 dark:text-white/40">
                    {s.tagKey}
                  </span>
                  <h3 className="font-display text-base font-bold">
                    {s.titleKey}
                  </h3>
                  <p className="mt-0.5 text-xs text-black/50 dark:text-white/45">
                    {s.descKey}
                  </p>
                </div>
              </div>
            </Tilt3D>
          ))}
        </div>
      </section>

      {/* PODCASTS */}
      <section
        id="podcasts"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <Tilt3D>
          <SectionHeader
            kicker="Enthusiastic Talks"
            title="Tinglab, tushunib boring"
            subtitle="IELTS va til o'rganish haqida foydali suhbatlar."
          />
        </Tilt3D>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PODCASTS.map((pod, i) => (
            <Tilt3D key={pod.id} delay={i * 90}>
              <ShineCard>
                <div className="relative aspect-video w-full bg-black">
                  {pod.youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${pod.youtubeId}`}
                      title={pod.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/30">
                      youtubeId qo'shilmagan
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 text-sm font-semibold text-black/80 dark:text-white/80">
                  {pod.title}
                </div>
              </ShineCard>
            </Tilt3D>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <MagneticButton
            as="a"
            href={PODCAST_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-black/[0.15] px-7 py-3.5 text-sm font-bold text-black/70 transition-colors hover:border-black/30 hover:text-black dark:border-white/20 dark:text-white/80 dark:hover:border-white/40 dark:hover:text-white"
          >
            {"Barcha epizodlar"}
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </MagneticButton>
        </div>
      </section>

      {/* REYTING */}
      <section
        id="reyting"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <Tilt3D>
          <SectionHeader
            kicker="Liga"
            title="English Learning League"
            subtitle="Haftalik ball asosidagi reyting."
          />
        </Tilt3D>

        <LeagueTable />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-black/45 dark:text-white/40">
          <LegendDot colorClass="bg-emerald-500/70" label="100%" />
          <LegendDot colorClass="bg-amber-500/70" label="50%" />
          <LegendDot colorClass="bg-red-500/70" label="0%" />
          <LegendDot colorClass="bg-black/10 dark:bg-white/10" label="--" />
        </div>
      </section>

      {/* CERTIFICATES */}
      <section
        id="certificates"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <Tilt3D>
          <div className="mx-auto mb-16 max-w-xl text-center">
            <Kicker>{"Sertifikatlar"}</Kicker>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              <CountUp value={CERTIFICATE_COUNT} suffix={` ${"sertifikat"}`} />
            </h2>
            <p className="mt-4 text-black/50 dark:text-white/45">
              {"Kattalashtirish uchun bosing"}
            </p>
          </div>
        </Tilt3D>
        <CertificateWall />
        <p className="mt-3 text-center text-xs text-black/35 dark:text-white/25">
          public/certificates/ papkasiga cert-1.jpg dan cert-{CERTIFICATE_COUNT}
          .jpg gacha nomlangan fayllarni joylashtiring
        </p>
      </section>

      {/* STATS */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-32">
        <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            {
              value: SERVICES.length,
              decimals: 0,
              suffix: "",
              label: "Xizmatlar",
            },
            {
              value: 100,
              decimals: 0,
              suffix: "+",
              label: "Yaroqli IELTS ball",
            },
            { value: 8, decimals: 0, suffix: "", label: "Eng yuqori natija" },
            {
              value: EPISODE_COUNT,
              decimals: 0,
              suffix: "+",
              label: "Podkastlar",
            },
          ].map((s, i) => (
            <Tilt3D key={s.label} delay={i * 80}>
              <div className="group">
                <div className="font-display text-4xl font-bold">
                  <CountUp
                    value={s.value}
                    decimals={s.decimals}
                    suffix={s.suffix}
                  />
                </div>
                <div className="mx-auto mt-2 h-px w-0 bg-black/25 transition-all duration-700 group-hover:w-10 dark:bg-white/30" />
                <div className="mt-2 text-xs text-black/45 dark:text-white/40">
                  {s.label}
                </div>
              </div>
            </Tilt3D>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section
        id="events"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <Tilt3D>
          <SectionHeader
            kicker="Tadbirlar"
            title="Sinfdan tashqari maydon"
            subtitle="Musobaqalar, debatlar va jonli kechalar."
          />
        </Tilt3D>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {EVENTS.map((e, i) => (
            <Tilt3D key={e.tagKey} delay={i * 100}>
              <ShineCard className="h-full p-6">
                <span className="text-xs font-bold uppercase tracking-wide text-black/40 dark:text-white/40">
                  {e.tagKey}
                </span>
                <h3 className="font-display mt-3 text-lg font-bold">
                  {e.titleKey}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-black/50 dark:text-white/45">
                  {e.descKey}
                </p>
              </ShineCard>
            </Tilt3D>
          ))}
        </div>
      </section>

      {/* FTL */}
      <section id="ftl" className="relative z-10 mx-auto max-w-6xl px-6 py-32">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <Tilt3D>
            <div>
              <Kicker>FTL</Kicker>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {"Future Teacher League"}
              </h2>
              <Reveal delay={150}>
                <p className="mt-5 leading-relaxed text-black/50 dark:text-white/45">
                  {
                    "FTL — o'quvchilar o'zi o'rgangan mavzuni katta auditoriya oldida xuddi o'qituvchidek tushuntiradigan mahorat dasturi. Bu jarayon bilimni chuqurlashtiradi va erkin, ishonchli gapirish ko'nikmasini shakllantiradi — har qanday intervyu yoki taqdimot uchun foydali."
                  }
                </p>
              </Reveal>
            </div>
          </Tilt3D>
          <Tilt3D delay={100}>
            <ShineCard className="mx-auto w-full max-w-xs">
              <div className="relative aspect-[9/16] w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${FTL_VIDEO_ID}`}
                  title="FTL — Future Teacher League"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </ShineCard>
          </Tilt3D>
        </div>
      </section>

      {/* DEBATE */}
      <section
        id="debate"
        className="relative z-10 mx-auto max-w-6xl px-6 py-32"
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <Tilt3D>
            <VideoPlayer
              src={DEBATE_VIDEO_SRC}
              aspectClass="aspect-[9/16]"
              className="mx-auto w-full max-w-xs shadow-lg"
            />
          </Tilt3D>
          <Tilt3D delay={100}>
            <div>
              <Kicker>{"Debat"}</Kicker>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {"Debat"}
              </h2>
              <Reveal delay={150}>
                <p className="mt-5 leading-relaxed text-black/50 dark:text-white/45">
                  {
                    "Debat — o'quvchilar mavzu bo'yicha ikki guruhga bo'linib, o'z pozitsiyasini asoslaydi va raqib dalillariga real vaqtda javob beradi. Bu format tez fikrlash va bosim ostida ishonch bilan gapirishni o'rgatadi — IELTS Speaking'da ham, hayotda ham foydali ko'nikma."
                  }
                </p>
              </Reveal>
            </div>
          </Tilt3D>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-44 text-center">
        <Sparkles count={9} />
        <Tilt3D>
          <BorderTraceFrame>
            <h2 className="font-display mx-auto max-w-xl text-3xl font-bold sm:text-5xl">
              {"O'qish sayohatingizni hoziroq boshlang"}
            </h2>
            <p className="mx-auto mt-6 max-w-md text-black/50 dark:text-white/45">
              {
                "Darslar, musobaqalar va mock testlar — izchil IELTS tayyorgarligi bir joyda."
              }
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <MagneticButton
                as={Link}
                to="/register"
                className="animate-pulse-glow rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] dark:hover:opacity-90"
              >
                {"Darslarga yozilish"}
              </MagneticButton>
              <MagneticButton
                as={Link}
                to="/register"
                className="rounded-full border border-black/[0.15] px-8 py-4 text-sm font-bold text-black/70 transition-colors hover:border-black/30 dark:border-white/20 dark:text-white/80 dark:hover:border-white/40"
              >
                {"Mock testni sinab ko'ring"}
              </MagneticButton>
            </div>
          </BorderTraceFrame>
        </Tilt3D>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] px-6 py-9 text-sm text-black/45 dark:border-white/10 dark:text-white/40">
        <div className="flex items-center gap-3">
          <span className="inline-block hover-wiggle">
            <BrandMark size={26} />
          </span>
          {"IELTS Beruniy — Enthusiastic English loyihasi"}
        </div>
        <div>
          © {new Date().getFullYear()}. {"Barcha huquqlar himoyalangan."}
        </div>
      </footer>
    </div>
  );
}
