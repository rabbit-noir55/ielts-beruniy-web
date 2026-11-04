import { useCallback, useEffect, useState } from "react";
import {
  adminAttendanceDayOff,
  adminAttendanceDayOffAction,
  adminAttendanceMark,
  adminAttendanceMonthly,
  adminAttendanceToday,
} from "../adminApi";
import { inputCls } from "../formStyles";
import { Badge, Btn, Empty, ErrorBox, Field, Panel, Spinner } from "../ui";

const TABS = [
  { id: "today", label: "Bugun" },
  { id: "month", label: "Oylik jurnal" },
  { id: "off", label: "Dam olish kunlari" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAttendance({ isDark }) {
  const [tab, setTab] = useState("today");
  const [group, setGroup] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthData, setMonthData] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);

  const [offData, setOffData] = useState(null);
  const [offForm, setOffForm] = useState({ date: todayIso(), group: "", reason: "" });
  const [offBusy, setOffBusy] = useState(false);

  const loadToday = useCallback(
    (groupId = group) => {
      setLoading(true);
      return adminAttendanceToday(groupId)
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
        .finally(() => setLoading(false));
    },
    [group]
  );

  useEffect(() => {
    loadToday(group);
  }, [loadToday, group]);

  const loadMonth = useCallback(() => {
    if (!group) return;
    const [year, m] = month.split("-");
    setMonthLoading(true);
    adminAttendanceMonthly({ group, year, month: m })
      .then((d) => {
        setMonthData(d);
        setError("");
      })
      .catch((e) => setError(e.message || "Oylik jurnal yuklanmadi"))
      .finally(() => setMonthLoading(false));
  }, [group, month]);

  useEffect(() => {
    if (tab === "month") loadMonth();
  }, [tab, loadMonth]);

  const loadOff = useCallback(() => {
    return adminAttendanceDayOff()
      .then((d) => setOffData(d))
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"));
  }, []);

  useEffect(() => {
    if (tab === "off") loadOff();
  }, [tab, loadOff]);

  async function toggle(student) {
    setBusyId(student.id);
    setError("");
    try {
      const res = await adminAttendanceMark(student.id);
      setData((d) =>
        d
          ? {
              ...d,
              students: d.students.map((s) =>
                s.id === student.id
                  ? { ...s, present: res.present, source: res.present ? "manual" : null }
                  : s
              ),
            }
          : d
      );
    } catch (e) {
      setError(e.message || "Belgilab bo'lmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function addDayOff() {
    if (!offForm.date) {
      setError("Sanani tanlang.");
      return;
    }
    setOffBusy(true);
    setError("");
    try {
      await adminAttendanceDayOffAction({
        date: offForm.date,
        group: offForm.group || null,
        reason: offForm.reason,
      });
      setOffForm({ date: todayIso(), group: "", reason: "" });
      await loadOff();
    } catch (e) {
      setError(e.message || "Qo'shib bo'lmadi");
    } finally {
      setOffBusy(false);
    }
  }

  async function removeDayOff(row) {
    if (!window.confirm(`${row.date} dam olish kuni o'chirilsinmi?`)) return;
    try {
      await adminAttendanceDayOffAction({ action: "delete", id: row.id });
      await loadOff();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    }
  }

  function downloadCsv() {
    if (!monthData?.students?.length) return;
    const head = ["O'quvchi", ...monthData.days.map(String)];
    const lines = [head];
    monthData.students.forEach((s) => {
      lines.push([s.name, ...s.days.map((v) => (v ? "+" : "-"))]);
    });
    const csv = "\uFEFF" + lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `davomat_${monthData.group?.slug || "guruh"}_${month}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const present = data?.students.filter((s) => s.present).length || 0;
  const total = data?.students.length || 0;
  const muted = isDark ? "text-white/40" : "text-black/40";
  const rule = isDark ? "border-white/10" : "border-black/10";
  const groups = data?.groups || offData?.groups || [];

  const monthTotals = (row) => row.days.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Davomat</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            {data?.today || "Bugun"} · belgilash, oylik jurnal va dam olish kunlari
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === "today" && data?.day_off && <Badge isDark={isDark} tone="accent">Dam olish kuni</Badge>}
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Guruhni tanlash"
            className={`${inputCls(isDark)} sm:w-52`}
          >
            <option value="">Guruhni tanlang…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {tab === "today" && (
            <Btn isDark={isDark} onClick={() => loadToday(group)} disabled={loading}>
              Yangilash
            </Btn>
          )}
        </div>
      </div>

      <div className={`flex w-fit gap-1 rounded-full border p-1 ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`min-h-8 rounded-full px-3.5 text-xs font-bold transition ${
              tab === t.id
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : isDark
                  ? "text-white/50 hover:text-white/85"
                  : "text-black/50 hover:text-black/85"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBox>{error}</ErrorBox>

      {tab === "today" && (
        <>
          {loading ? (
            <Panel isDark={isDark}>
              <Spinner isDark={isDark} />
            </Panel>
          ) : !group ? (
            <Panel isDark={isDark}>
              <Empty isDark={isDark}>Davomatni ko'rish uchun guruh tanlang.</Empty>
            </Panel>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl border px-4 py-3 ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
                  <div className="text-2xl font-extrabold">{present}</div>
                  <div className={`text-[11px] font-semibold ${muted}`}>Keldi</div>
                </div>
                <div className={`rounded-xl border px-4 py-3 ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
                  <div className="text-2xl font-extrabold">{Math.max(total - present, 0)}</div>
                  <div className={`text-[11px] font-semibold ${muted}`}>Kelmadi</div>
                </div>
                <div className={`rounded-xl border px-4 py-3 ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
                  <div className="text-2xl font-extrabold">
                    {total ? Math.round((present / total) * 100) : 0}%
                  </div>
                  <div className={`text-[11px] font-semibold ${muted}`}>Davomat</div>
                </div>
              </div>

              {total > 0 && (
                <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                    style={{ width: `${total ? (present / total) * 100 : 0}%` }}
                  />
                </div>
              )}

              <Panel isDark={isDark} title={data?.group?.name} desc={`${present}/${total} belgilangan`}>
                {!total ? (
                  <Empty isDark={isDark}>Bu guruhda o'quvchi yo'q.</Empty>
                ) : (
                  <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                    {data.students.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => toggle(s)}
                          disabled={busyId === s.id}
                          aria-pressed={s.present}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition disabled:opacity-50 ${
                            isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.025]"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                s.present
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                                  : isDark
                                    ? "border-white/15 text-white/30"
                                    : "border-black/15 text-black/30"
                              }`}
                              aria-hidden="true"
                            >
                              {s.present ? "✓" : "—"}
                            </span>
                            <span className="truncate text-sm font-semibold">{s.name}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {s.source === "qr" && <Badge isDark={isDark} tone="accent">QR</Badge>}
                            <Badge isDark={isDark} tone={s.present ? "green" : "neutral"}>
                              {s.present ? "Keldi" : "Kelmadi"}
                            </Badge>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </>
          )}
        </>
      )}

      {tab === "month" && (
        <Panel
          isDark={isDark}
          title="Oylik jurnal"
          desc={
            monthData?.group
              ? `${monthData.group.name} · ${monthData.days.length} kun`
              : "Guruh tanlang"
          }
          actions={
            <>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Oy"
                className={`${inputCls(isDark)} w-40 py-1.5`}
              />
              <Btn isDark={isDark} onClick={downloadCsv} disabled={!monthData?.students?.length}>
                CSV yuklash
              </Btn>
            </>
          }
        >
          {!group ? (
            <Empty isDark={isDark}>Jurnalni ko'rish uchun guruh tanlang.</Empty>
          ) : monthLoading ? (
            <Spinner isDark={isDark} />
          ) : !monthData?.students?.length ? (
            <Empty isDark={isDark}>Bu guruhda o'quvchi yo'q.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                    <th className={`sticky left-0 z-10 whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? "bg-[#0d0d0f] text-white/45" : "bg-[#fafafa] text-black/45"
                    }`}>
                      O'quvchi
                    </th>
                    {monthData.days.map((d) => (
                      <th key={d} className="min-w-[26px] px-1 py-2 text-center text-[10px] font-bold opacity-45">
                        {d}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center text-[10px] font-bold opacity-45">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.students.map((s) => (
                    <tr key={s.id} className={`border-t ${isDark ? "border-white/[0.07]" : "border-black/[0.07]"}`}>
                      <td
                        className={`sticky left-0 z-10 whitespace-nowrap px-3 py-2 font-semibold ${
                          isDark ? "bg-[#0d0d0f]" : "bg-[#fafafa]"
                        }`}
                      >
                        {s.name}
                      </td>
                      {s.days.map((v, i) => (
                        <td
                          key={i}
                          className={`px-1 py-2 text-center font-bold ${
                            v ? "text-emerald-500" : isDark ? "text-white/15" : "text-black/15"
                          }`}
                        >
                          {v ? "✓" : "·"}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-extrabold">{monthTotals(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === "off" && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel isDark={isDark} className="lg:col-span-3" title="Dam olish kunlari" desc="Dars bo'lmagan istisno kunlar">
            {!offData ? (
              <Spinner isDark={isDark} />
            ) : !offData.days_off.length ? (
              <Empty isDark={isDark}>Hozircha dam olish kuni yo'q.</Empty>
            ) : (
              <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                {offData.days_off.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <div className="text-sm font-bold">{d.date}</div>
                      <div className={`text-[11px] ${muted}`}>
                        {d.group || "Barcha guruhlar"}
                        {d.reason ? ` · ${d.reason}` : ""}
                      </div>
                    </div>
                    <Btn isDark={isDark} variant="danger" onClick={() => removeDayOff(d)}>
                      O'chirish
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel isDark={isDark} className="lg:col-span-2" title="Kun qo'shish">
            <div className="flex flex-col gap-3 px-4 py-4">
              <Field isDark={isDark} label="Sana">
                <input
                  type="date"
                  value={offForm.date}
                  onChange={(e) => setOffForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Guruh">
                <select
                  value={offForm.group}
                  onChange={(e) => setOffForm((f) => ({ ...f, group: e.target.value }))}
                  className={inputCls(isDark)}
                >
                  <option value="">Barcha guruhlar</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field isDark={isDark} label="Sabab (ixtiyoriy)">
                <input
                  value={offForm.reason}
                  onChange={(e) => setOffForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Bayram, ta'mir…"
                  className={inputCls(isDark)}
                />
              </Field>
              <Btn isDark={isDark} variant="primary" disabled={offBusy} onClick={addDayOff}>
                {offBusy ? "Qo'shilmoqda…" : "Qo'shish"}
              </Btn>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
