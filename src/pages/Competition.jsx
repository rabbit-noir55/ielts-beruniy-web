import { useCallback, useEffect, useState } from "react";
import { getLeaderboard, getWeeks, toggleCheck } from "../utils/competitionApi";
import { getUser } from "../utils/api";
import { useLang } from "../utils/LanguageContext";

// 5 ta task × 20 ball = 100
const SKILLS = [
  { key: "writing", short: "W", uz: "Writing", en: "Writing" },
  { key: "vocabulary", short: "WR", uz: "Vocabulary", en: "Vocabulary" },
  { key: "reading", short: "RT", uz: "Reading", en: "Reading" },
  { key: "speaking", short: "S", uz: "Speaking", en: "Speaking" },
  { key: "random", short: "R", uz: "Random speaking", en: "Random speaking" },
];

function Mark({ state, editable, busy, onClick }) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition";
  const cls =
    state === "done"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : state === "late"
        ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "border-black/10 bg-black/[0.03] text-transparent dark:border-white/10 dark:bg-white/[0.04]";

  const content = state === "done" ? "✓" : state === "late" ? "⏰" : "·";

  if (!editable) {
    return <span className={`${base} ${cls} cursor-default`}>{content}</span>;
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`${base} ${cls} cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40`}
      aria-label={state ? "ptichkani qaytarish" : "ptichka qo'yish"}
    >
      {content}
    </button>
  );
}

export default function Competition({ theme }) {
  const isDark = theme === "dark";
  const { lang } = useLang();
  const t = (uz, en) => (lang === "uz" ? uz : en);

  const [weekKey, setWeekKey] = useState("active");
  const [view, setView] = useState("all");
  const [weeks, setWeeks] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const loadWeeks = useCallback(async () => {
    try {
      const res = await getWeeks();
      setWeeks(res.weeks || []);
    } catch {
      /* selector ixtiyoriy */
    }
  }, []);

  const loadBoard = useCallback(
    async (key) => {
      setLoading(true);
      setError("");
      try {
        const res = await getLeaderboard(key);
        setData(res);
      } catch (err) {
        setError(err.message || "Jadvalni yuklab bo'lmadi.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  useEffect(() => {
    loadBoard(weekKey);
  }, [loadBoard, weekKey]);

  const onToggle = async (row, skill) => {
    const key = `${row.student_id}-${skill}`;
    setBusyKey(key);
    try {
      const res = await toggleCheck({
        student: row.student_id,
        skill,
        week: data?.week?.id,
      });
      const state = res.checked ? (res.is_late ? "late" : "done") : null;
      setData((prev) => {
        if (!prev) return prev;
        const rows = prev.rows.map((r) => {
          if (r.student_id !== row.student_id) return r;
          const checks = { ...r.checks, [skill]: state };
          const score = SKILLS.reduce(
            (sum, sk) => sum + (checks[sk.key] === "done" ? prev.points_per_task : 0),
            0
          );
          const late_count = SKILLS.filter((sk) => checks[sk.key] === "late").length;
          return { ...r, checks, score, late_count };
        });
        rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
        return { ...prev, rows };
      });
    } catch (err) {
      setError(err.message || "Ptichkani o'zgartirib bo'lmadi.");
    } finally {
      setBusyKey("");
    }
  };

  const activeWeek = data?.week;
  const rows = data?.rows || [];
  const maxScore = data?.max_score || 100;

  const user = getUser();
  const isExaminer =
    user?.role === "student" && rows.some((r) => r.can_edit);
  const visibleRows =
    isExaminer && view === "mine" ? rows.filter((r) => r.can_edit) : rows;
  // Umumiy reytingdagi o'rin (2-bo'limda ham to'g'ri raqam ko'rsatiladi)
  const rankOf = new Map(rows.map((r, idx) => [r.student_id, idx + 1]));

  const card = `rounded-2xl border ${
    isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
  }`;

  return (
    <div
      className={`min-h-screen px-4 pt-28 pb-16 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <span
          className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isDark ? "border-white/15 text-white/50" : "border-black/12 text-black/50"
          }`}
        >
          League
        </span>

        <h1 className="text-2xl font-extrabold">English Learning League</h1>
        <p className={`mt-1 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
          {activeWeek
            ? `${activeWeek.label} · ${activeWeek.start_date} — ${activeWeek.end_date}`
            : t("Faol hafta yo'q", "No active week")}
        </p>

        {/* Hafta tanlash */}
        {weeks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setWeekKey("active")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                weekKey === "active"
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : isDark
                    ? "border border-white/10 text-white/60 hover:bg-white/5"
                    : "border border-black/10 text-black/60 hover:bg-black/5"
              }`}
            >
              {t("Faol hafta", "Active")}
            </button>
            {weeks
              .filter((w) => !w.is_active)
              .slice(0, 6)
              .map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWeekKey(String(w.id))}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    weekKey === String(w.id)
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : isDark
                        ? "border border-white/10 text-white/60 hover:bg-white/5"
                        : "border border-black/10 text-black/60 hover:bg-black/5"
                  }`}
                >
                  {w.label}
                </button>
              ))}
          </div>
        )}

        {isExaminer && (
          <div className="mt-4 flex gap-2">
            {[
              { key: "all", label: t("Umumiy reyting", "Overall ranking") },
              { key: "mine", label: t("Mening o'quvchilarim", "My students") },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  view === tab.key
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : isDark
                      ? "border border-white/10 text-white/60 hover:bg-white/5"
                      : "border border-black/10 text-black/60 hover:bg-black/5"
                }`}
              >
                {tab.label}
                {tab.key === "mine" && (
                  <span className={`ml-2 text-xs font-normal ${view === tab.key ? "opacity-70" : "opacity-50"}`}>
                    {rows.filter((r) => r.can_edit).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className={`mt-4 ${card} p-10 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
            {t("Yuklanmoqda...", "Loading...")}
          </div>
        ) : !visibleRows.length ? (
          <div className={`mt-4 ${card} p-10 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
            {t("Ma'lumot yo'q.", "No data.")}
          </div>
        ) : (
          <div className={`mt-4 overflow-x-auto ${card}`}>
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/40" : "text-black/40"}`}>
                  <th className="w-10 px-3 py-3 text-center">#</th>
                  <th className="px-3 py-3">{t("O'quvchi", "Student")}</th>
                  {SKILLS.map((s) => (
                    <th key={s.key} className="w-12 px-2 py-3 text-center" title={t(s.uz, s.en)}>
                      {s.short}
                    </th>
                  ))}
                  <th className="w-16 px-3 py-3 text-center">{t("Ball", "Score")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const mine = row.is_me;
                  return (
                    <tr
                      key={row.student_id}
                      className={`border-t ${
                        isDark ? "border-white/5" : "border-black/5"
                      } ${mine ? "bg-[var(--accent)]/10" : ""}`}
                    >
                      <td className={`px-3 py-2 text-center text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>
                        {rankOf.get(row.student_id) || i + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className={`font-semibold ${mine ? "text-[var(--accent)]" : ""}`}>
                          {row.name}
                        </div>
                        <div className={`text-[11px] ${isDark ? "text-white/35" : "text-black/35"}`}>
                          {row.group}
                        </div>
                      </td>
                      {SKILLS.map((s) => (
                        <td key={s.key} className="px-2 py-2 text-center">
                          <Mark
                            state={row.checks[s.key]}
                            editable={row.can_edit}
                            busy={busyKey === `${row.student_id}-${s.key}`}
                            onClick={() => onToggle(row, s.key)}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold">
                        {row.score}
                        <span className={`text-[10px] font-normal ${isDark ? "text-white/30" : "text-black/30"}`}>
                          /{maxScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
