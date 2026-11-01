import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKeyboard,
  faPlay,
  faGamepad,
  faMagnifyingGlass,
  faXmark,
  faSpinner,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { fetchGames } from "../utils/gamesApi";
import { rateGame } from "../utils/toolsApi";
import { getRecentGames, recordRecentGame } from "../utils/recentGames";
import { useLang } from "../utils/LanguageContext";

// Saytning o'z o'yinlari (hozircha faqat Typing)
const BUILTIN = [
  {
    key: "typing",
    icon: faKeyboard,
    to: "/typing",
    title: (t) => t("Tez yozish", "Typing Speed"),
    desc: (t) =>
      t(
        "Matnni tez va xatosiz yozish bo'yicha test — tezlik va aniqlikni oshiring.",
        "Type fast and accurately — improve your WPM and accuracy.",
      ),
  },
];

export default function Games({ theme }) {
  const isDark = theme === "dark";
  const { lang } = useLang();
  const t = (uz, en) => (lang === "uz" ? uz : en);

  // Ustoz qo'shgan o'yinlar — bitta ro'yxatda, ajratilmasdan
  const [customGames, setCustomGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("az");
  const [ratings, setRatings] = useState({});
  const [ratingPending, setRatingPending] = useState({});

  useEffect(() => {
    let alive = true;
    fetchGames()
      .then((res) => {
        if (!alive) return;
        const items = Array.isArray(res?.items) ? res.items : [];
        setCustomGames(items);
        setRatings(
          Object.fromEntries(
            items.map((g) => [
              g.id,
              { stars: g.stars || 0, starred: Boolean(g.starred) },
            ])
          )
        );
      })
      .catch(() => {
        if (alive) setCustomGames([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleStar = async (event, gameId) => {
    event.preventDefault();
    event.stopPropagation();
    if (ratingPending[gameId]) return;

    const current = ratings[gameId] || { stars: 0, starred: false };
    const nextStarred = !current.starred;

    setRatingPending((prev) => ({ ...prev, [gameId]: true }));
    try {
      const res = await rateGame(gameId, nextStarred);
      setRatings((prev) => ({
        ...prev,
        [gameId]: {
          stars: res?.stars ?? current.stars + (nextStarred ? 1 : -1),
          starred: Boolean(res?.starred ?? nextStarred),
        },
      }));
    } catch {
      /* ignore */
    } finally {
      setRatingPending((prev) => {
        const next = { ...prev };
        delete next[gameId];
        return next;
      });
    }
  };

  const cards = [
    ...BUILTIN.map((g) => ({
      key: `builtin-${g.key}`,
      icon: g.icon,
      colors: [],
      to: g.to,
      title: g.title(t),
      desc: g.desc(t),
    })),
    ...customGames.map((g) => ({
      key: `game-${g.id}`,
      id: g.id,
      icon: g.icon || "",
      colors: Array.isArray(g.colors) ? g.colors : [],
      to: `/games/play/${g.id}`,
      title: g.title,
      desc: g.description || "",
    })),
  ];

  const q = query.trim().toLowerCase();
  const matched = q
    ? cards.filter((c) => `${c.title} ${c.desc}`.toLowerCase().includes(q))
    : cards;

  const recentOrder = getRecentGames();
  const filtered = [...matched].sort((a, b) => {
    if (sort === "rating") {
      const diff = (ratings[b.id]?.stars || 0) - (ratings[a.id]?.stars || 0);
      if (diff !== 0) return diff;
    } else if (sort === "recent") {
      const ia = recentOrder.indexOf(a.to);
      const ib = recentOrder.indexOf(b.to);
      const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
      const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
      if (ra !== rb) return ra - rb;
      // hech qachon o'ynalmaganlar: yangisi birinchi
      const nid = (b.id || 0) - (a.id || 0);
      if (nid !== 0) return nid;
    }
    return String(a.title).localeCompare(String(b.title), "uz");
  });

  return (
    <div
      className={`min-h-screen px-3 sm:px-4 pt-3 sm:pt-4 pb-10 sm:pb-12 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="relative mb-5 sm:mb-6">
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
            placeholder={t("O'yin qidirish...", "Search games...")}
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
              aria-label={t("Tozalash", "Clear")}
              className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition ${
                isDark ? "bg-white/10 text-white/60 hover:bg-white/20" : "bg-black/5 text-black/50 hover:bg-black/10"
              }`}
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-[var(--accent)]" />
            <span className={`text-xs font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>
              {t("O'yinlar yuklanmoqda...", "Loading games...")}
            </span>
          </div>
        ) : (
        <>
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {[
            { key: "az", label: t("A–Z", "A–Z") },
            { key: "rating", label: t("Reyting", "Rating") },
            { key: "recent", label: t("Recently", "Recently") },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSort(opt.key)}
              aria-pressed={sort === opt.key}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${
                sort === opt.key
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : isDark
                  ? "bg-white/[0.06] text-white/55 hover:bg-white/[0.1] hover:text-white/80"
                  : "bg-black/[0.05] text-black/50 hover:bg-black/[0.09] hover:text-black/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className={`ml-auto text-[11px] font-semibold ${isDark ? "text-white/35" : "text-black/35"}`}>
            {filtered.length} {t("ta o'yin", "games")}
          </span>
        </div>

        <div
          data-ai="games-grid"
          data-ai-label="O'yinlar ro'yxati"
          className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-5"
        >
          {filtered.map((g) => (
            <Link
              key={g.key}
              to={g.to}
              aria-label={g.title}
              onClick={() => recordRecentGame(g.to)}
              className="block h-full focus:outline-none"
            >
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-6 transition-all duration-200 ${
                  isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"
                } hover:scale-[1.02] hover:shadow-lg`}
              >
                {g.colors && g.colors.length > 0 && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 opacity-45 blur-2xl dark:opacity-55"
                      aria-hidden="true"
                    >
                      {g.colors.map((color, i) => {
                        const size = 120 + i * 26;
                        return (
                          <span
                            key={i}
                            className="absolute rounded-full"
                            style={{
                              background: color,
                              width: size,
                              height: size,
                              left: `${[6, 55, 28, 68][i % 4]}%`,
                              top: `${[52, 6, 68, 42][i % 4]}%`,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 bg-white/55 dark:bg-[#0A0A0B]/55"
                      aria-hidden="true"
                    />
                  </>
                )}

                <div className="relative">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl text-xl sm:text-2xl ${
                        isDark ? "bg-black/30 text-[var(--accent)]" : "bg-white/70 text-[var(--accent)]"
                      } backdrop-blur-sm`}
                    >
                      {typeof g.icon === "string" && g.icon.trim().toLowerCase().startsWith("<svg") ? (
                        <img
                          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                            g.icon.trim().toLowerCase().startsWith("<svg") &&
                              !/xmlns=/i.test(g.icon.slice(0, 200))
                              ? g.icon.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
                              : g.icon
                          )}`}
                          alt=""
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          draggable={false}
                        />
                      ) : typeof g.icon === "string" && g.icon ? (
                        <span>{g.icon}</span>
                      ) : (
                        <FontAwesomeIcon
                          icon={typeof g.icon === "object" ? g.icon : faGamepad}
                          className="text-base sm:text-lg"
                        />
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold">{g.title}</h2>
                  </div>
                  <p className={`mt-2 sm:mt-3 line-clamp-3 text-xs sm:text-sm ${isDark ? "text-white/60" : "text-black/55"}`}>
                    {g.desc || "—"}
                  </p>
                  {g.id && (
                    <div className="mt-3 flex min-h-[22px] items-center gap-1">
                      {ratingPending[g.id] ? (
                        <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${isDark ? "text-white/50" : "text-black/45"}`}>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          {t("Saqlanmoqda...", "Saving...")}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStar(e, g.id)}
                            aria-pressed={Boolean(ratings[g.id]?.starred)}
                            aria-label={
                              ratings[g.id]?.starred
                                ? t("Yulduzchani olib tashlash", "Remove star")
                                : t("Yulduzcha qo'yish", "Add star")
                            }
                            className="flex items-center gap-1 rounded-full p-0.5 transition hover:scale-110 active:scale-95"
                          >
                            <FontAwesomeIcon
                              icon={faStar}
                              className={`text-base transition-colors ${
                                ratings[g.id]?.starred
                                  ? "text-amber-400"
                                  : isDark
                                  ? "text-white/25"
                                  : "text-black/20"
                              }`}
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                ratings[g.id]?.starred
                                  ? "text-amber-500"
                                  : isDark
                                  ? "text-white/45"
                                  : "text-black/40"
                              }`}
                            >
                              {ratings[g.id]?.stars || 0}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-3 sm:mt-4">
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[var(--accent)] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-[var(--accent-contrast)]">
                      <FontAwesomeIcon icon={faPlay} />
                      {t("O'ynash", "Play")}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!loading && filtered.length === 0 && (
            <div
              className={`col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-14 text-center ${
                isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
              }`}
            >
              <div className="text-3xl opacity-30">🔍</div>
              <div className="text-sm font-bold">{t("Hech narsa topilmadi", "No games found")}</div>
              <div className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                {t("Boshqa so'z bilan qidirib ko'ring.", "Try a different keyword.")}
              </div>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-2 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-[var(--accent-contrast)]"
              >
                {t("Tozalash", "Clear")}
              </button>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
