import { useCallback, useEffect, useState } from "react";
import { adminLeague, adminLeagueAction, adminStudents } from "../adminApi";
import { Badge, Btn, Empty, ErrorBox, Panel, Spinner } from "../ui";
import { inputCls } from "../formStyles";

function isoPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmt(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export default function AdminLeague({ isDark }) {
  const [data, setData] = useState({ weeks: [], examiners: [] });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [weekForm, setWeekForm] = useState({
    label: "",
    start_date: isoPlus(0),
    end_date: isoPlus(6),
  });
  const [pick, setPick] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([adminLeague(), adminStudents({})])
      .then(([league, st]) => {
        setData(league);
        setStudents(st.students || []);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(body, key = "") {
    setBusy(key);
    setError("");
    try {
      await adminLeagueAction(body);
      await load();
    } catch (e) {
      setError(e.message || "Amal bajarilmadi");
    } finally {
      setBusy("");
    }
  }

  async function createWeek() {
    if (!weekForm.label.trim() || !weekForm.start_date || !weekForm.end_date) {
      setError("Nomi va ikkita sana kerak.");
      return;
    }
    if (weekForm.end_date < weekForm.start_date) {
      setError("Tugash sanasi boshlanishdan keyin bo'lsin.");
      return;
    }
    await act({ action: "week_create", ...weekForm }, "week_create");
    setWeekForm({ label: "", start_date: isoPlus(0), end_date: isoPlus(6) });
  }

  const muted = isDark ? "text-white/40" : "text-black/40";
  const rule = isDark ? "border-white/10" : "border-black/10";
  const activeWeek = data.weeks.find((w) => w.is_active);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Liga</h1>
        <p className={`mt-1 text-xs ${muted}`}>
          Haftalar va examiner biriktirish · 5 task × 20 = 100 ball
        </p>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}>
          <Spinner isDark={isDark} />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-5">
            <Panel isDark={isDark} className="lg:col-span-3" title="Haftalar" desc={activeWeek ? `Faol: ${activeWeek.label}` : "Faol hafta yo'q"}>
              {!data.weeks.length ? (
                <Empty isDark={isDark}>Hafta yaratilmagan.</Empty>
              ) : (
                <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                  {data.weeks.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold">{w.label}</span>
                          {w.is_active && <Badge isDark={isDark} tone="green">Faol</Badge>}
                        </div>
                        <div className={`mt-0.5 text-[11px] ${muted}`}>
                          {fmt(w.start_date)} — {fmt(w.end_date)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {w.is_active ? (
                          <Btn
                            isDark={isDark}
                            disabled={busy === `close-${w.id}`}
                            onClick={() => act({ action: "week_close", week: w.id }, `close-${w.id}`)}
                          >
                            Yopish
                          </Btn>
                        ) : (
                          <Btn
                            isDark={isDark}
                            variant="primary"
                            disabled={busy === `act-${w.id}`}
                            onClick={() => act({ action: "week_activate", week: w.id }, `act-${w.id}`)}
                          >
                            Faollashtirish
                          </Btn>
                        )}
                        <Btn
                          isDark={isDark}
                          variant="danger"
                          disabled={busy === `del-${w.id}`}
                          onClick={() => act({ action: "week_delete", week: w.id }, `del-${w.id}`)}
                        >
                          O'chirish
                        </Btn>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel isDark={isDark} className="lg:col-span-2" title="Yangi hafta" desc="Bir vaqtda faqat bitta faol hafta">
              <div className="flex flex-col gap-3 px-4 py-4">
                <label className="flex flex-col gap-1">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Nomi</span>
                  <input
                    value={weekForm.label}
                    onChange={(e) => setWeekForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="1-hafta"
                    className={inputCls(isDark)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Boshlanish</span>
                    <input
                      type="date"
                      value={weekForm.start_date}
                      onChange={(e) => setWeekForm((f) => ({ ...f, start_date: e.target.value }))}
                      className={inputCls(isDark)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Tugash</span>
                    <input
                      type="date"
                      value={weekForm.end_date}
                      onChange={(e) => setWeekForm((f) => ({ ...f, end_date: e.target.value }))}
                      className={inputCls(isDark)}
                    />
                  </label>
                </div>
                <Btn
                  isDark={isDark}
                  variant="primary"
                  disabled={busy === "week_create"}
                  onClick={createWeek}
                >
                  {busy === "week_create" ? "Yaratilmoqda…" : "Hafta yaratish"}
                </Btn>
              </div>
            </Panel>
          </div>

          <Panel
            isDark={isDark}
            title="Examinerlar"
            desc="Har bir examiner o'z o'quvchilariga ptichka qo'yadi"
          >
            {!data.examiners.length ? (
              <Empty isDark={isDark}>
                Examiner yo'q. O'quvchilar bo'limida «Examiner qilish» tugmasini bosing.
              </Empty>
            ) : (
              <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                {data.examiners.map((e) => {
                  const linkedIds = new Set(e.students.map((s) => s.id));
                  const available = students.filter((s) => s.id !== e.id && !linkedIds.has(s.id));
                  return (
                    <li key={e.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{e.name}</span>
                          <Badge isDark={isDark} tone="accent">{e.students.length} o'quvchi</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={pick[e.id] || ""}
                            onChange={(ev) => setPick((p) => ({ ...p, [e.id]: ev.target.value }))}
                            aria-label={`${e.name} uchun o'quvchi tanlash`}
                            className={`${inputCls(isDark)} w-48 py-1.5 text-xs`}
                          >
                            <option value="">O'quvchi tanlang…</option>
                            {available.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <Btn
                            isDark={isDark}
                            disabled={!pick[e.id] || busy === `link-${e.id}`}
                            onClick={async () => {
                              await act(
                                { action: "link_add", examiner: e.id, student: pick[e.id] },
                                `link-${e.id}`
                              );
                              setPick((p) => ({ ...p, [e.id]: "" }));
                            }}
                          >
                            + Qo'shish
                          </Btn>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {!e.students.length && (
                          <span className={`text-xs ${muted}`}>Hozircha o'quvchi biriktirilmagan.</span>
                        )}
                        {e.students.map((s) => (
                          <span
                            key={s.link_id}
                            className={`inline-flex items-center gap-1 rounded-full border py-1 pl-2.5 pr-1 text-[11px] font-semibold ${rule} ${
                              isDark ? "text-white/70" : "text-black/70"
                            }`}
                          >
                            {s.name}
                            <button
                              type="button"
                              onClick={() =>
                                act({ action: "link_remove", link: s.link_id }, `rm-${s.link_id}`)
                              }
                              disabled={busy === `rm-${s.link_id}`}
                              aria-label={`${s.name} birikmasini olib tashlash`}
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none ${
                                isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                              }`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
