import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faTrophy, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../utils/LanguageContext";
import { getUser } from "../utils/api";
import { parseCSV, buildTable } from "../utils/csv";

const SHEETS = [
  { key: "top", gid: "1685375319", label: "TOP SET" },
  { key: "low", gid: "1168355150", label: "LOW SET" },
  { key: "overall", gid: "1245178641", label: "OVERALL" },
];

// Har hafta 5 ta yo'nalish, har biri 20 ball = jami 100 ball.
const SKILLS = {
  W: { uz: "Writing", en: "Writing", max: 20 },
  WR: { uz: "Vocabulary", en: "Vocabulary", max: 20 },
  RT: { uz: "Reading", en: "Reading", max: 20 },
  S: { uz: "Speaking", en: "Speaking", max: 20 },
  R: { uz: "Random", en: "Random", max: 20 },
  G: { uz: "Grammar", en: "Grammar", max: 20 },
};

function skillOf(code) {
  const key = String(code || "").trim().toUpperCase();
  return SKILLS[key] || { uz: key || "—", en: key || "—", max: 20 };
}

function toCsvUrl(sheetUrl) {
  if (!sheetUrl) return null;
  const m = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
}

function normalizeTokens(s) {
  return (s || "")
    .toLowerCase()
    // O'zbek apostroflari so'zni BO'LMASIN: O'rinboyeva -> orinboyeva
    .replace(/[‘’ʻʼ`´']/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function nameMatches(sheetName, user) {
  if (!user || !sheetName) return false;
  const a = normalizeTokens(sheetName).sort();
  const candidate = [user.first_name, user.last_name, user.email]
    .filter(Boolean)
    .join(" ");
  const b = normalizeTokens(candidate).sort();
  if (!a.length || !b.length) return false;
  return a.every((t) => b.includes(t));
}

function rankMedal(rank) {
  const r = String(rank).trim();
  if (r === "1") return "🥇";
  if (r === "2") return "🥈";
  if (r === "3") return "🥉";
  return null;
}

function toneFor(sheetKey, rankStr) {
  const r = parseInt(String(rankStr).trim(), 10);
  if (Number.isNaN(r)) return null;
  if (sheetKey === "top") return r <= 15 ? "green" : "red";
  if (sheetKey === "low") return r <= 5 ? "green" : "red";
  return null;
}

export default function Competition({ theme }) {
  const isDark = theme === "dark";
  const { lang } = useLang();
  const t = useCallback((uz, en) => (lang === "uz" ? uz : en), [lang]);

  const [active, setActive] = useState("top");
  const [tables, setTables] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const user = getUser();
      const sheetUrl = user?.group_detail?.competition_url;
      if (!sheetUrl) {
        setTables({});
        setError(
          t(
            "Guruhingiz uchun competition sozlanmagan. Admin bilan bog'laning.",
            "Competition is not configured for your group. Contact your admin.",
          ),
        );
        return;
      }
      const csvBase = toCsvUrl(sheetUrl);
      if (!csvBase) {
        setTables({});
        setError(
          t(
            "Noto'g'ri Google Sheet URL. Format: https://docs.google.com/spreadsheets/d/SHEET_ID/...",
            "Invalid Google Sheet URL. Format: https://docs.google.com/spreadsheets/d/SHEET_ID/...",
          ),
        );
        return;
      }
      const results = await Promise.all(
        SHEETS.map(async (s) => {
          const res = await fetch(`${csvBase}&gid=${s.gid}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          return { key: s.key, table: buildTable(parseCSV(text)) };
        }),
      );
      const next = {};
      results.forEach((r) => {
        next[r.key] = r.table;
      });
      setTables(next);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(
        t(
          "Jadvalni yuklab bo'lmadi. Google Sheet ulanishini tekshiring.",
          "Could not load the league. Check the Google Sheet link.",
        ) + ` (${e.message || e})`,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const currentUser = getUser();
  const table = tables[active];

  const skillCodes = useMemo(() => {
    const seen = new Set();
    (table?.groups || []).forEach((g) =>
      (g.subs || []).forEach((sub) => {
        const k = String(sub || "").trim().toUpperCase();
        if (k) seen.add(k);
      }),
    );
    return [...seen];
  }, [table]);

  return (
    <div
      className={`min-h-screen px-4 pt-28 pb-12 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{"English Learning League"}</h1>
            {table?.subtitle && (
              <p className="mt-1 text-sm text-black/40 dark:text-white/40">
                {table.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs text-black/35 dark:text-white/35">
                {t("Yangilandi", "Updated")}: {updatedAt.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => load(true)}
              disabled={loading || refreshing}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                isDark
                  ? "bg-white/10 text-white/70 hover:bg-white/20"
                  : "bg-black/5 text-black/60 hover:bg-black/10"
              } disabled:opacity-50`}
            >
              <FontAwesomeIcon icon={faRotateLeft} size="lg" className={refreshing ? "animate-spin" : ""} />
              {t("Yangilash", "Refresh")}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {SHEETS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                active === s.key
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : isDark
                    ? "bg-white/5 text-white/50 hover:bg-white/10"
                    : "bg-black/5 text-black/50 hover:bg-black/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {!loading && !error && skillCodes.length > 0 && (
          <div
            className={`mb-4 flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] ${
              isDark
                ? "border-white/10 bg-white/[0.03] text-white/50"
                : "border-black/10 bg-black/[0.02] text-black/50"
            }`}
          >
            {skillCodes.map((code) => {
              const sk = skillOf(code);
              return (
                <span
                  key={code}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                    isDark ? "border-white/15" : "border-black/15"
                  }`}
                >
                  <b className={isDark ? "text-white/80" : "text-black/75"}>{code}</b>
                  <span>{lang === "uz" ? sk.uz : sk.en}</span>
                  <span className={isDark ? "text-white/30" : "text-black/30"}>{sk.max}</span>
                </span>
              );
            })}
            <span className={`ml-auto font-bold ${isDark ? "text-white/60" : "text-black/60"}`}>
              {t("Haftada jami 100 ball", "100 points per week")}
            </span>
          </div>
        )}

        {loading ? (
          <div
            className={`flex items-center justify-center gap-3 rounded-2xl border p-16 text-sm ${
              isDark
                ? "border-white/10 bg-white/5 text-white/40"
                : "border-black/10 bg-white text-black/40"
            }`}
          >
            <FontAwesomeIcon icon={faSpinner} size="lg" className="animate-spin" />
            {t("Yuklanmoqda...", "Loading...")}
          </div>
        ) : error ? (
          <div
            className={`rounded-2xl border p-6 text-sm ${
              isDark
                ? "border-white/10 bg-white/5 text-white/60"
                : "border-black/10 bg-white text-black/60"
            }`}
          >
            {error}
          </div>
        ) : !table || !table.data.length ? (
          <div
            className={`rounded-2xl border p-10 text-center text-sm ${
              isDark
                ? "border-white/10 bg-white/5 text-white/40"
                : "border-black/10 bg-white text-black/40"
            }`}
          >
            {t("Jadvalda ma'lumot yo'q.", "No data in this sheet.")}
          </div>
        ) : (
          <div
            className={`overflow-hidden rounded-2xl border ${
              isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"
            }`}
          >
            <table className="w-full table-fixed border-collapse text-left text-xs [&_th]:border [&_td]:border [&_th]:border-black/5 [&_td]:border-black/5 dark:[&_th]:border-white/5 dark:[&_td]:border-white/5">
              <thead>
                {table.groups?.length ? (
                  <>
                    <tr
                      className={`text-[10px] uppercase tracking-wide ${
                        isDark ? "text-white/40" : "text-black/40"
                      }`}
                    >
                      <th style={{ width: "2.5rem" }} className="px-2 py-2 font-bold leading-tight text-center">
                        {table.columns[0] || "#"}
                      </th>
                      <th style={{ width: "9rem" }} className="px-2 py-2 font-bold leading-tight text-left">
                        {table.columns[1] || "NAME"}
                      </th>
                      {table.groups.map((g, gi) => (
                        <th
                          key={gi}
                          colSpan={g.end - g.start + 1}
                          style={
                            gi === table.groups.length - 1
                              ? { width: "6rem" }
                              : undefined
                          }
                          className={`px-2 py-2 font-bold leading-tight text-center whitespace-nowrap ${
                            gi > 0
                              ? isDark
                                ? "!border-l border-white/70"
                                : "!border-l border-black/80"
                              : ""
                          }`}
                        >
                          <span title={t("5 ta yo'nalish × 20 ball = 100", "5 skills × 20 = 100")}>
                            {g.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                    <tr
                      className={`text-[10px] uppercase tracking-wide ${
                        isDark ? "text-white/40" : "text-black/40"
                      }`}
                    >
                      <th className="px-2 py-2 font-bold leading-tight text-center"></th>
                      <th className="px-2 py-2 font-bold leading-tight text-left"></th>
                      {table.groups.map((g, gi) =>
                        g.subs.map((s, si) => (
                          <th
                            key={`${gi}-${si}`}
                            className={`px-2 py-2 font-bold leading-tight text-center ${
                              gi > 0 && si === 0
                                ? isDark
                                  ? "!border-l border-white/70"
                                  : "!border-l border-black/80"
                                : ""
                            }`}
                          >
                            <span title={`${lang === "uz" ? skillOf(s).uz : skillOf(s).en} — ${skillOf(s).max} ball`}>
                              {s}
                            </span>
                          </th>
                        )),
                      )}
                    </tr>
                  </>
                ) : (
                  <tr
                    className={`text-[10px] uppercase tracking-wide ${
                      isDark ? "text-white/40" : "text-black/40"
                    }`}
                  >
                    {table.columns.map((c, i) => (
                      <th
                        key={i}
                        style={
                          i === 0
                            ? { width: "2.75rem" }
                            : i === 1
                              ? { width: "12rem" }
                              : i === table.columns.length - 1
                                ? { width: "5.5rem" }
                                : undefined
                        }
                        className={`px-3 py-2.5 font-bold leading-tight ${
                          i === 1 ? "text-left" : "text-center"
                        }`}
                      >
                        {c || "#"}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {table.data.map((row, i) => {
                  const isMe = nameMatches(row[1], currentUser);
                  const medal = rankMedal(row[0]);
                  const tone = toneFor(active, row[0]);
                  const rowBg = isMe
                    ? "bg-[var(--accent)]/10"
                    : tone === "green"
                      ? "bg-emerald-500/[0.09]"
                      : tone === "red"
                        ? "bg-red-500/[0.09]"
                        : "";
                  const rankColor =
                    !isMe && tone === "green"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : !isMe && tone === "red"
                        ? "text-red-600 dark:text-red-400"
                        : "";
                  return (
                    <tr
                      key={i}
                      className={`border-t ${
                        isDark ? "border-white/5" : "border-black/5"
                      } ${rowBg}`}
                    >
                      {row.map((cell, j) => {
                        const rankCell = j === 0;
                        const groupStart =
                          table.groups?.find((g) => g.start === j && g.start > 1);
                        return (
                          <td
                            key={j}
                            className={`px-2 py-2 ${
                              j === 1
                                ? "font-semibold break-words"
                                : rankCell
                                  ? `text-center font-bold ${rankColor}`
                                  : "whitespace-nowrap text-center"
                            } ${
                              groupStart
                                ? isDark
                                  ? "!border-l border-white/70"
                                  : "!border-l border-black/80"
                                : ""
                            } ${isMe && j === 1 ? "text-[var(--accent)]" : ""}`}
                          >
                            {j === 1 ? (
                              <>
                                {row[1]}
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] font-bold text-[var(--accent)]">
                                    ({t("sen", "you")})
                                  </span>
                                )}
                              </>
                            ) : rankCell ? (
                              medal || cell
                            ) : cell === "" ? (
                              <span className="text-black/25 dark:text-white/25">—</span>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {table && table.data.length > 0 && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
              isDark ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"
            }`}
          >
            <FontAwesomeIcon icon={faTrophy} size="lg" className="text-[var(--accent)]" />
            {t(
              "Ma'lumot Google Sheet'dan olinadi — o'qituvchi Excel'ni yangilasa, sayt ham yangilanadi.",
              "Data comes from Google Sheets — when the teacher updates the Excel, the site updates too.",
            )}
          </div>
        )}
      </div>
    </div>
  );
}
