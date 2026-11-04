import { useCallback, useEffect, useState } from "react";
import { adminGroups, adminStudentAction, adminStudentDetail, adminStudents } from "../adminApi";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, Panel, Spinner, Th } from "../ui";
import { inputCls } from "../formStyles";

export default function AdminStudents({ isDark }) {
  const [data, setData] = useState({ students: [], total: 0 });
  const [groups, setGroups] = useState([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [pwd, setPwd] = useState({ open: false, student: null, value: "" });
  const [del, setDel] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return adminStudents({ q, group })
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, [q, group]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => {
    adminGroups()
      .then((d) => setGroups(d.groups || []))
      .catch(() => {});
  }, []);

  async function act(student, body) {
    setBusyId(student.id);
    setError("");
    try {
      await adminStudentAction(student.id, body);
      await load();
    } catch (e) {
      setError(e.message || "Amal bajarilmadi");
    } finally {
      setBusyId(null);
    }
  }

  async function showDetail(student) {
    setDetail({ loading: true, student, data: null });
    try {
      const d = await adminStudentDetail(student.id);
      setDetail({ loading: false, student, data: d });
    } catch (e) {
      setDetail(null);
      setError(e.message || "Natijalarni yuklab bo'lmadi");
    }
  }

  async function savePassword() {
    if (pwd.value.trim().length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lsin.");
      return;
    }
    await act(pwd.student, { action: "password", password: pwd.value.trim() });
    setPwd({ open: false, student: null, value: "" });
  }

  async function confirmDelete() {
    const student = del;
    setDel(null);
    await act(student, { action: "delete" });
  }

  const muted = isDark ? "text-white/40" : "text-black/40";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">O'quvchilar</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            {data.total} ta o'quvchi · guruh, parol va bloklashni boshqaring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ism yoki email…"
            aria-label="O'quvchini qidirish"
            className={`${inputCls(isDark)} sm:w-56`}
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Guruh bo'yicha filter"
            className={`${inputCls(isDark)} sm:w-44`}
          >
            <option value="">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ErrorBox>{error}</ErrorBox>

      <Panel isDark={isDark}>
        {loading ? (
          <Spinner isDark={isDark} />
        ) : !data.students.length ? (
          <Empty isDark={isDark}>O'quvchi topilmadi.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                  <Th>O'quvchi</Th>
                  <Th>Guruh</Th>
                  <Th>Holat</Th>
                  <Th className="text-right">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-t transition ${
                      isDark ? "border-white/[0.07] hover:bg-white/[0.02]" : "border-black/[0.07] hover:bg-black/[0.02]"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{s.name}</div>
                      <div className={`text-[11px] ${muted}`}>{s.email}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={s.group_id || ""}
                        onChange={(e) => act(s, { action: "group", group: e.target.value || null })}
                        aria-label={`${s.name} guruhini tanlash`}
                        className={`${inputCls(isDark)} min-w-[140px] py-1.5 text-xs`}
                      >
                        <option value="">Guruhsiz</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {s.is_blocked ? (
                          <Badge isDark={isDark} tone="red">Bloklangan</Badge>
                        ) : (
                          <Badge isDark={isDark} tone="green">Faol</Badge>
                        )}
                        {s.is_examiner && <Badge isDark={isDark} tone="accent">Examiner</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Btn
                          isDark={isDark}
                          disabled={busyId === s.id}
                          onClick={() => showDetail(s)}
                        >
                          Natijalar
                        </Btn>
                        <Btn
                          isDark={isDark}
                          disabled={busyId === s.id}
                          onClick={() =>
                            act(s, { action: s.is_blocked ? "unblock" : "block" })
                          }
                        >
                          {s.is_blocked ? "Blokdan chiqarish" : "Bloklash"}
                        </Btn>
                        <Btn
                          isDark={isDark}
                          disabled={busyId === s.id}
                          onClick={() => setPwd({ open: true, student: s, value: "" })}
                        >
                          Parol
                        </Btn>
                        <Btn
                          isDark={isDark}
                          disabled={busyId === s.id}
                          onClick={() =>
                            act(s, { action: "examiner", value: !s.is_examiner })
                          }
                        >
                          {s.is_examiner ? "Examinerni o'chirish" : "Examiner qilish"}
                        </Btn>
                        <Btn
                          isDark={isDark}
                          variant="danger"
                          disabled={busyId === s.id}
                          onClick={() => setDel(s)}
                        >
                          O'chirish
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        isDark={isDark}
        open={pwd.open}
        title="Parolni yangilash"
        desc={pwd.student ? `${pwd.student.name} · ${pwd.student.email}` : ""}
        onClose={() => setPwd({ open: false, student: null, value: "" })}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setPwd({ open: false, student: null, value: "" })}>
              Bekor qilish
            </Btn>
            <Btn isDark={isDark} variant="primary" onClick={savePassword}>
              Saqlash
            </Btn>
          </>
        }
      >
        <Field isDark={isDark} label="Yangi parol">
          <input
            type="text"
            autoFocus
            value={pwd.value}
            onChange={(e) => setPwd((p) => ({ ...p, value: e.target.value }))}
            placeholder="kamida 6 belgi"
            className={inputCls(isDark)}
          />
        </Field>
        <p className={`mt-2 text-[11px] ${muted}`}>
          O'quvchi yangi parol bilan saytga kirishi mumkin.
        </p>
      </Modal>

      <Modal
        isDark={isDark}
        open={!!detail}
        title={detail?.student?.name || "O'quvchi"}
        desc={detail?.student?.email}
        onClose={() => setDetail(null)}
      >
        {!detail?.data ? (
          <Spinner isDark={isDark} />
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`rounded-lg border px-2 py-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <div className="text-lg font-extrabold">{detail.data.overall.attempts}</div>
                <div className={`text-[10px] font-semibold uppercase ${muted}`}>Urinish</div>
              </div>
              <div className={`rounded-lg border px-2 py-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <div className="text-lg font-extrabold">{detail.data.overall.avg_band ?? "—"}</div>
                <div className={`text-[10px] font-semibold uppercase ${muted}`}>O'rtacha</div>
              </div>
              <div className={`rounded-lg border px-2 py-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <div className="text-lg font-extrabold">{detail.data.overall.best_band ?? "—"}</div>
                <div className={`text-[10px] font-semibold uppercase ${muted}`}>Eng yaxshi</div>
              </div>
            </div>

            <div className={`divide-y rounded-lg border ${isDark ? "divide-white/[0.07] border-white/10" : "divide-black/[0.07] border-black/10"}`}>
              {detail.data.summary.map((s) => (
                <div key={s.skill} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-bold">{s.label}</span>
                  <span className={muted}>
                    {s.attempts} urinish · o'rtacha {s.avg_band ?? "—"} · eng yaxshi {s.best_band ?? "—"}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <div className={`mb-1 text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                Oxirgi natijalar
              </div>
              {!detail.data.recent.length ? (
                <div className={`text-xs ${muted}`}>Hozircha natija yo'q.</div>
              ) : (
                <ul className={`divide-y rounded-lg border ${isDark ? "divide-white/[0.07] border-white/10" : "divide-black/[0.07] border-black/10"}`}>
                  {detail.data.recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span>
                        Mock {r.series} · {r.skill}
                        {r.part ? ` · part ${r.part}` : ""}
                      </span>
                      <span className="font-bold">{r.band ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={`text-[11px] ${muted}`}>
              Guruh: {detail.data.student.group || "guruhsiz"} · Qo'shilgan: {detail.data.student.joined}
              {detail.data.student.last_activity ? ` · Faollik: ${detail.data.student.last_activity}` : ""}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isDark={isDark}
        open={!!del}
        title="O'quvchini o'chirish"
        onClose={() => setDel(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setDel(null)}>
              Bekor qilish
            </Btn>
            <Btn isDark={isDark} variant="danger" onClick={confirmDelete}>
              Ha, o'chirish
            </Btn>
          </>
        }
      >
        <p className="text-sm">
          <span className="font-bold">{del?.name}</span> butunlay o'chiriladi. Davomat va liga
          natijalari ham o'chadi. Bu amalni qaytarib bo'lmaydi.
        </p>
      </Modal>
    </div>
  );
}
