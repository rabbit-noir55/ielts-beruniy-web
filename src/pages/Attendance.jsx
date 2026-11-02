import { useEffect, useState } from "react";
import { myAttendance } from "../utils/attendanceApi";
import { getUser } from "../utils/api";
import { useLang } from "../utils/LanguageContext";

const MESSAGES = {
  uz: {
    title: "Mening davomatim",
    noGroup: "Siz guruhga biriktirilmagansiz.",
    empty: "Hali davomat yozuvlari yo'q.",
    date: "Sana",
    source: "Manba",
    distance: "Masofa",
    source_qr: "QR",
    source_manual: "Qo'lda",
  },
  ru: {
    title: "Моя посещаемость",
    noGroup: "Вы не прикреплены к группе.",
    empty: "Записей о посещаемости пока нет.",
    date: "Дата",
    source: "Источник",
    distance: "Расстояние",
    source_qr: "QR",
    source_manual: "Вручную",
  },
  en: {
    title: "My attendance",
    noGroup: "You are not assigned to a group.",
    empty: "No attendance records yet.",
    date: "Date",
    source: "Source",
    distance: "Distance",
    source_qr: "QR",
    source_manual: "Manual",
  },
};

function useMessages() {
  const { lang } = useLang();
  return MESSAGES[lang] || MESSAGES.en;
}

export default function Attendance({ theme }) {
  const isDark = theme === "dark";
  const t = useMessages();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getUser();
  const hasGroup = !!user?.group;

  useEffect(() => {
    if (!hasGroup) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await myAttendance();
        if (!cancelled) setRecords(data.results || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [hasGroup]);

  return (
    <div className={`mx-auto max-w-md px-6 py-10 ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
      <h1 className="mb-6 font-display text-3xl font-bold">{t.title}</h1>

      {!hasGroup ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {t.noGroup}
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {loading ? (
            <p className={`text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>Loading...</p>
          ) : records.length === 0 ? (
            <p className={`text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>{t.empty}</p>
          ) : (
            <div className="rounded-2xl border border-black/[0.08] bg-white dark:border-white/10 dark:bg-[#141416]">
              <div className="grid grid-cols-3 gap-2 border-b border-black/[0.08] p-4 text-xs font-bold uppercase tracking-wider text-black/50 dark:border-white/10 dark:text-white/50">
                <span>{t.date}</span>
                <span>{t.source}</span>
                <span>{t.distance}</span>
              </div>
              <ul>
                {records.map((r, idx) => (
                  <li
                    key={idx}
                    className="grid grid-cols-3 gap-2 border-b border-black/[0.06] p-4 text-sm last:border-0 dark:border-white/5"
                  >
                    <span>{r.date}</span>
                    <span>{r.source === "qr" ? t.source_qr : t.source_manual}</span>
                    <span>{r.distance_m != null ? `${r.distance_m} m` : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
