import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminSummary } from "../adminApi";
import { Panel, ErrorBox, Spinner } from "../ui";

function Stat({ isDark, label, value, hint }) {
  return (
    <div className={`rounded-xl border px-4 py-4 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-white"}`}>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className={`mt-1 text-xs font-semibold ${isDark ? "text-white/55" : "text-black/55"}`}>{label}</div>
      {hint && (
        <div className={`mt-0.5 text-[11px] ${isDark ? "text-white/30" : "text-black/30"}`}>{hint}</div>
      )}
    </div>
  );
}

export default function AdminDashboard({ isDark }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    adminSummary()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message || "Xatolik"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Umumiy ko'rinish</h1>
        <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
          Bugungi holat va tezkor havolalar
        </p>
      </div>

      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <Panel isDark={isDark}><Spinner isDark={isDark} /></Panel>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat isDark={isDark} label="O'quvchilar" value={data.students} hint={`${data.students_with_group} guruhda`} />
            <Stat isDark={isDark} label="Guruhlar" value={data.groups} />
            <Stat isDark={isDark} label="Bugun keldi" value={data.attended_today} hint={data.today} />
            <Stat isDark={isDark} label="Liga ptichkalari" value={data.week_checked} hint={data.active_week?.label || "faol hafta yo'q"} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat isDark={isDark} label="Mock testlar" value={data.mocks} hint="listening + reading" />
            <Stat isDark={isDark} label="O'yinlar" value={data.games} hint="sandbox HTML" />
            <Stat isDark={isDark} label="Tool'lar" value={data.tools} hint="vositalar" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel isDark={isDark} title="Faol hafta">
              <div className="px-4 py-4 text-sm">
                {data.active_week ? (
                  <>
                    <div className="font-bold">{data.active_week.label}</div>
                    <div className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                      {data.active_week.start_date} — {data.active_week.end_date}
                    </div>
                    <Link to="/admin/league" className="mt-3 inline-block text-xs font-bold text-[var(--accent)] underline">
                      Ligani boshqarish →
                    </Link>
                  </>
                ) : (
                  <div className={isDark ? "text-white/40" : "text-black/40"}>
                    Faol hafta yo'q.{" "}
                    <Link to="/admin/league" className="font-bold text-[var(--accent)] underline">
                      Hafta yaratish
                    </Link>
                  </div>
                )}
              </div>
            </Panel>

            <Panel isDark={isDark} title="Yangi o'quvchilar">
              <div className="divide-y" style={{ borderColor: "transparent" }}>
                {data.recent.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className={`text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>{s.group || "guruhsiz"}</span>
                  </div>
                ))}
                {!data.recent.length && (
                  <div className={`px-4 py-6 text-xs ${isDark ? "text-white/35" : "text-black/35"}`}>Hozircha yo'q</div>
                )}
              </div>
            </Panel>
          </div>

          <Panel isDark={isDark} title="Tezkor havolalar">
            <div className="flex flex-wrap gap-2 px-4 py-4 text-xs font-bold">
              <Link to="/admin/students" className="rounded-full border border-white/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">O'quvchilar</Link>
              <Link to="/admin/groups" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">Guruhlar</Link>
              <Link to="/admin/attendance" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">Davomat</Link>
              <Link to="/admin/league" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">Liga</Link>
              <Link to="/admin/mocks" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">Mock testlar</Link>
              <Link to="/admin/games" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">O'yinlar</Link>
              <Link to="/admin/tools" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">Tool'lar</Link>
              <Link to="/admin/ai" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">AI boshqaruv</Link>
              <a href="https://ieltsberuniy.onrender.com/api/panel/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-black/15 px-3 py-1.5 dark:border-white/15 dark:text-white/70">
                Eski panel ↗
              </a>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
