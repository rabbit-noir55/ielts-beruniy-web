import { useCallback, useEffect, useState } from "react";
import {
  adminLeague,
  adminLeagueAction,
  adminLeagueCheckToggle,
  adminLeagueChecks,
} from "../adminApi";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [weekForm, setWeekForm] = useState({
    label: "",
    start_date: isoPlus(0),
    end_date: isoPlus(6),
  });
  const [checks, setChecks] = useState(null);
  const [checkBusy, setCheckBusy] = useState("");

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    return adminLeague()
      .then((league) => {
        setData(league);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  const loadChecks = useCallback(() => {
    return adminLeagueChecks()
      .then((d) => setChecks(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    loadChecks();
  }, [load, loadChecks]);

  async function toggleCheck(student, skill) {
    setCheckBusy(`${student.id}-${skill}`);
    try {
      await adminLeagueCheckToggle(student.id, skill);
      await loadChecks();
    } catch (e) {
      setError(e.message || "Ptichkani o'zgartirib bo'lmadi");
    } finally {
      setCheckBusy("");
    }
  }

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

  async function toggleLink(examiner, candidate) {
    setBusy(`link-${candidate.id}`);
    setError("");
    try {
      await adminLeagueAction({
        action: "link_toggle",
        examiner: examiner.id,
        student: candidate.id,
      });
      await load(true);
    } catch (e) {
      setError(e.message || "Bog'lab bo'lmadi");
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
            title="Faol hafta ptichkalari"
            desc={
              checks?.week
                ? `${checks.week.label} · har ptichka 20 ball · jami ${checks.max_score}`
                : "Faol hafta yo'q — avval haftani faollashtiring"
            }
          >
            {!checks?.week ? (
              <Empty isDark={isDark}>Faol hafta yo'q.</Empty>
            ) : !checks.students.length ? (
              <Empty isDark={isDark}>Guruhga biriktirilgan o'quvchilar yo'q.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead>
                    <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider opacity-40">O'quvchi</th>
                      {checks.skills.map((s) => (
                        <th key={s.code} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider opacity-40" title={s.label}>
                          {s.short}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider opacity-40">Ball</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.students.map((st) => (
                      <tr key={st.id} className={`border-t ${isDark ? "border-white/[0.07]" : "border-black/[0.07]"}`}>
                        <td className="px-3 py-2">
                          <div className="font-semibold">{st.name}</div>
                          <div className={`text-[11px] ${muted}`}>{st.group}</div>
                        </td>
                        {checks.skills.map((sk) => {
                          const done = st.marks[sk.code];
                          const key = `${st.id}-${sk.code}`;
                          return (
                            <td key={sk.code} className="px-1.5 py-2 text-center">
                              <button
                                type="button"
                                aria-pressed={done}
                                aria-label={`${st.name} — ${sk.label}`}
                                title={sk.label}
                                disabled={checkBusy === key}
                                onClick={() => toggleCheck(st, sk.code)}
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition disabled:opacity-40 ${
                                  done
                                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                                    : isDark
                                      ? "border-white/12 text-white/25 hover:border-white/30 hover:text-white/60"
                                      : "border-black/12 text-black/25 hover:border-black/30 hover:text-black/60"
                                }`}
                              >
                                {done ? "✓" : "·"}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right">
                          <div className="text-sm font-extrabold">{st.score}</div>
                          <div className={`text-[10px] ${muted}`}>{st.done}/{checks.skills.length} ptichka</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            isDark={isDark}
            title="Examinerlar"
            desc="Faqat bir xil guruhdagi o'quvchilar. Ismni bosing — biriktiriladi yoki olib tashlanadi."
          >
            {!data.examiners.length ? (
              <Empty isDark={isDark}>
                Examiner yo'q. O'quvchilar bo'limida «Examiner qilish» tugmasini bosing.
              </Empty>
            ) : (
              <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                {data.examiners.map((e) => {
                  const linkedCount = e.candidates.filter((c) => c.linked).length;
                  return (
                    <li key={e.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{e.name}</span>
                        {e.group_id ? (
                          <Badge isDark={isDark}>{e.group}</Badge>
                        ) : (
                          <Badge isDark={isDark} tone="red">Guruhsiz</Badge>
                        )}
                        {e.group_id && (
                          <Badge isDark={isDark} tone="accent">
                            {linkedCount} bog'langan
                          </Badge>
                        )}
                      </div>

                      {!e.group_id ? (
                        <p className={`mt-1.5 text-xs ${muted}`}>
                          Examiner guruhga biriktirilmagan. «O'quvchilar» bo'limida guruh tanlang.
                        </p>
                      ) : !e.candidates.length ? (
                        <p className={`mt-1.5 text-xs ${muted}`}>Bu guruhda boshqa o'quvchi yo'q.</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {e.candidates.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              aria-pressed={c.linked}
                              disabled={busy === `link-${c.id}`}
                              onClick={() => toggleLink(e, c)}
                              title={
                                c.linked
                                  ? `${c.name} — bog'lanishni olib tashlash`
                                  : `${c.name} — biriktirish`
                              }
                              className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:opacity-40 ${
                                c.linked
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : isDark
                                    ? "border-white/12 text-white/55 hover:border-white/25 hover:text-white/85"
                                    : "border-black/12 text-black/55 hover:border-black/25 hover:text-black/85"
                              }`}
                            >
                              <span aria-hidden="true">{c.linked ? "✓" : "+"}</span>
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
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
