import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCalculator,
  faKeyboard,
  faFileLines,
  faBook,
  faMicrophone,
  faMagnifyingGlass,
  faXmark,
  faArrowRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { fetchTools } from "../utils/toolsApi";

const BUILTIN_TOOLS = [
  {
    key: "band",
    to: "/tools/band",
    title: "Band kalkulyator",
    desc: "Listening, Reading va Writing natijalaridan umumiy bandni hisoblang.",
    icon: faCalculator,
    color: "from-sky-500 to-blue-600",
  },
  {
    key: "typing",
    to: "/typing",
    title: "Typing test",
    desc: "Yozish tezligi va aniqlikni tekshiring.",
    icon: faKeyboard,
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    key: "words",
    to: "/tools/words",
    title: "Word Counter",
    desc: "Matndagi so'z va belgilar sonini sanang.",
    icon: faFileLines,
    color: "from-amber-500 to-orange-600",
  },
  {
    key: "dictionary",
    to: "/tools/dictionary",
    title: "Dictionary",
    desc: "So'z ma'nosi va ta'rifini darhol toping.",
    icon: faBook,
    color: "from-emerald-500 to-teal-600",
  },
  {
    key: "vocabulary",
    to: "/tools/vocabulary",
    title: "Vocabulary Quiz",
    desc: "1 200+ inglizcha-o'zbekcha so'z kartochkalari testi.",
    icon: faBookOpen,
    color: "from-rose-500 to-pink-600",
  },
  {
    key: "speaking",
    to: "/tools/speaking-draw",
    title: "Random Speaking",
    desc: "Part 2 uchun tasodifiy cue card — tayyorgarlik va javob taymeri.",
    icon: faMicrophone,
    color: "from-violet-500 to-purple-600",
  },
];

function ToolCard({ tool, isDark, delay }) {
  const isSvg =
    typeof tool.icon === "string" && tool.icon.trim().toLowerCase().startsWith("<svg");
  const tint = Array.isArray(tool.colors) && tool.colors.length ? tool.colors[0] : null;

  return (
    <Link
      to={tool.to}
      aria-label={tool.title}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transform-none ${
        isDark
          ? "border-white/10 bg-[#141416] hover:border-white/25 hover:shadow-black/40"
          : "border-black/[0.08] bg-white hover:border-black/20 hover:shadow-black/[0.06]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {tint && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          aria-hidden="true"
          style={{
            background: `radial-gradient(120% 90% at 15% 0%, ${tint} 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${
            tool.color ? `bg-gradient-to-br ${tool.color}` : isDark ? "bg-white/10" : "bg-black/[0.06]"
          }`}
        >
          {isSvg ? (
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                tool.icon.indexOf("xmlns=") === -1
                  ? tool.icon.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
                  : tool.icon
              )}`}
              alt=""
              className="h-6 w-6"
              draggable={false}
            />
          ) : tool.emoji ? (
            <span className="text-xl leading-none">{tool.emoji}</span>
          ) : (
            <FontAwesomeIcon icon={tool.icon} className="text-base" />
          )}
        </div>

        <h3
          className={`pt-0.5 text-base font-bold leading-snug ${
            isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
          }`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tool.title}
        </h3>
      </div>

      <p
        className={`relative mt-3 text-xs leading-relaxed ${isDark ? "text-white/45" : "text-black/45"}`}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: "2.1rem",
        }}
      >
        {tool.desc || "—"}
      </p>

      <span
        className={`relative mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${
          isDark ? "text-white/70 group-hover:text-white" : "text-black/60 group-hover:text-[#17171A]"
        }`}
      >
        Open
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

export default function Tools({ theme = "dark" }) {
  const isDark = theme === "dark";

  const [customTools, setCustomTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetchTools()
      .then((res) => {
        if (alive) setCustomTools(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (alive) setCustomTools([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const tools = useMemo(() => {
    const builtins = BUILTIN_TOOLS.map((t) => ({
      key: `builtin-${t.key}`,
      to: t.to,
      title: t.title,
      desc: t.desc,
      icon: t.icon,
      color: t.color,
      colors: [],
      emoji: "",
    }));

    const custom = customTools.map((t) => ({
      key: `tool-${t.id}`,
      to: `/tools/play/${t.id}`,
      title: t.title,
      desc: t.description || "",
      icon: t.icon || "",
      color: "",
      colors: Array.isArray(t.colors) ? t.colors : [],
      emoji:
        typeof t.icon === "string" && !t.icon.trim().toLowerCase().startsWith("<svg")
          ? t.icon || "🧰"
          : "",
    }));

    return [...builtins, ...custom];
  }, [customTools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => `${t.title} ${t.desc}`.toLowerCase().includes(q));
  }, [tools, query]);

  return (
    <div
      data-ai="tools-page"
      data-ai-label="Tools sahifasi"
      className={`mx-auto flex max-w-6xl flex-col gap-5 px-4 py-3 sm:px-6 sm:py-4 ${
        isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
      }`}
    >
      {/* Sarlavha */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Tools</h1>
          <p className={`mt-1 text-xs sm:text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
            Kundalik mashq uchun vositalar — kalkulyator, testlar, luğat va boshqalar.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            isDark ? "bg-white/[0.08] text-white/60" : "bg-black/[0.05] text-black/50"
          }`}
        >
          {tools.length} ta vosita
        </span>
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${
            isDark ? "text-white/35" : "text-black/35"
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
          }}
          placeholder="Vosita qidirish..."
          aria-label="Vosita qidirish"
          className={`w-full rounded-2xl border py-3 pl-11 pr-11 text-sm outline-none transition focus:ring-2 ${
            isDark
              ? "border-white/10 bg-white/[0.04] text-white placeholder-white/30 focus:ring-white/20"
              : "border-black/[0.08] bg-white text-[#17171A] placeholder-black/30 focus:ring-black/10"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Tozalash"
            className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition ${
              isDark
                ? "bg-white/10 text-white/60 hover:bg-white/20"
                : "bg-black/5 text-black/50 hover:bg-black/10"
            }`}
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        )}
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className={`flex flex-col items-center justify-center gap-3 py-20 ${isDark ? "text-white/40" : "text-black/40"}`}>
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-[var(--accent)]" />
          <span className="text-xs font-semibold">Vositalar yuklanmoqda...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-16 text-center ${
            isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
          }`}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={`text-2xl ${isDark ? "text-white/20" : "text-black/20"}`}
          />
          <div className="text-sm font-bold">Hech narsa topilmadi</div>
          <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
            Boshqa so'z bilan qidirib ko'ring.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-2 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-[var(--accent-contrast)]"
          >
            Tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool, index) => (
            <ToolCard key={tool.key} tool={tool} isDark={isDark} delay={index * 60} />
          ))}
        </div>
      )}
    </div>
  );
}
