import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUser, request } from "../utils/api";

export default function GroupDetail({ theme = "dark" }) {
  const isDark = theme === "dark";
  const { slug } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchGroup = async () => {
      try {
        const data = await request(`/groups/${slug}/`);
        if (!cancelled) {
          setGroup(data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Guruh topilmadi");
          setLoading(false);
        }
      }
    };
    fetchGroup();
    return () => { cancelled = true; };
  }, [slug]);

  const user = getUser();
  const isIelts = group?.group_type === "ielts";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className={`text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>Yuklanmoqda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <div className="text-4xl opacity-30">😢</div>
        <p className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>{error}</p>
        <Link to="/" className="mt-2 text-sm font-semibold text-rose-500 hover:underline">Bosh sahifa</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Sarlavha */}
      <div className="mb-6 flex items-center gap-4">
        {isIelts && group.logo_url ? (
          <img src={group.logo_url} alt={group.name} className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-2xl font-bold text-rose-500">
            {group.name?.slice(0, 1)?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>{group.name}</h1>
            {isIelts ? (
              <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">IELTS</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">Round Up</span>
            )}
          </div>
          <p className={`text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>@{group.slug}</p>
        </div>
      </div>

      {/* IELTS: Dars jadvali */}
      {isIelts && (group.schedule_type || group.schedule_time) && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
          isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
        }`}>
          {group.schedule_type && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              group.schedule_type === 'odd'
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            }`}>
              {group.schedule_type === 'odd' ? 'Toq' : 'Juft'}
            </span>
          )}
          {group.schedule_time && (
            <span className={`font-bold tabular-nums ${isDark ? "text-white/60" : "text-black/60"}`}>
              {group.schedule_time.slice(0, 5)}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Tavsif */}
      {group.description && (
        <div className={`col-span-full rounded-2xl border p-5 ${
          isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
        }`}>
          <h2 className={`mb-2 text-sm font-bold uppercase tracking-wide ${
            isDark ? "text-white/50" : "text-black/50"
          }`}>Guruh haqida</h2>
          <p className={`whitespace-pre-line text-sm leading-relaxed ${
            isDark ? "text-white/70" : "text-black/70"
          }`}>{group.description}</p>
        </div>
      )}

      {/* Round Up: Kontent bo'sh */}
      {!isIelts && (
        <div className={`col-span-full rounded-2xl border p-8 text-center ${
          isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
        }`}>
          <div className="text-4xl opacity-30 mb-3">📚</div>
          <h2 className={`text-lg font-bold ${isDark ? "text-white/70" : "text-black/70"}`}>Grammatika kontenti</h2>
          <p className={`mt-2 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>Tez orada grammatika testlari va materiallari qo'shiladi.</p>
        </div>
      )}

      {/* O'quvchilar */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
      }`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`text-sm font-bold uppercase tracking-wide ${
            isDark ? "text-white/50" : "text-black/50"
          }`}>O'quvchilar</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/40"
          }`}>{group.student_count}</span>
        </div>
        {group.students?.length > 0 ? (
          <div className="space-y-2">
            {group.students.map((s) => (
              <div key={s.id}
                   className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                     isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-black/[0.02] hover:bg-black/[0.04]"
                   } ${s.id === user?.id ? "ring-1 ring-rose-500/30" : ""}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-black/50"
                }`}>{s.full_name?.slice(0, 1)?.toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>
                    {s.full_name}
                    {s.id === user?.id && <span className="ml-1.5 text-[10px] text-rose-500">(siz)</span>}
                  </div>
                  <div className={`text-xs ${isDark ? "text-white/30" : "text-black/30"}`}>{s.email}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-xs ${isDark ? "text-white/30" : "text-black/30"}`}>Hozircha o'quvchilar yo'q</p>
        )}
      </div>
      </div>
    </div>
  );
}
