import { useCallback, useEffect, useState } from "react";
import { adminMockAction, adminMockDetail, adminMocks } from "../adminApi";
import { inputCls } from "../formStyles";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, Panel, Spinner } from "../ui";

const TEMPLATE = {
  schema: "ourmock/v2",
  meta: { skill: "listening", series: 1, test: 1, title: "", duration_seconds: 0 },
  media: { audio_urls: [] },
  parts: [],
  answer_key: {},
};

function newForm(series, skill = "listening") {
  return {
    id: null,
    skill,
    series,
    test_num: 1,
    title: "",
    is_published: true,
    text: JSON.stringify(TEMPLATE, null, 2),
  };
}

export default function AdminMocks({ isDark }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ errors: [], warnings: [], stats: null });
  const [aiText, setAiText] = useState("");
  const [aiName, setAiName] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return adminMocks()
      .then((d) => {
        setRows(d.series || []);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew(skill = "listening") {
    const next = rows.length ? Math.max(...rows.map((r) => r.series)) + 1 : 1;
    setFeedback({ errors: [], warnings: [], stats: null });
    setForm(newForm(next, skill));
  }

  async function openEdit(mock) {
    setFeedback({ errors: [], warnings: [], stats: null });
    setForm({ ...newForm(mock.series, mock.skill), id: mock.id, busy: true });
    try {
      const d = await adminMockDetail(mock.id);
      setForm({
        id: d.id,
        skill: d.skill,
        series: d.series,
        test_num: d.test_num,
        title: d.title,
        is_published: d.is_published,
        text: JSON.stringify(d.payload, null, 2),
      });
    } catch (e) {
      setError(e.message || "Mockni yuklab bo'lmadi");
      setForm(null);
    }
  }

  function collect(action) {
    let payload;
    try {
      payload = JSON.parse(form.text);
    } catch (e) {
      setFeedback({ errors: [`JSON sintaksisi xato: ${e.message}`], warnings: [], stats: null });
      return null;
    }
    return {
      action,
      id: form.id || undefined,
      skill: form.skill,
      series: form.series,
      test_num: form.test_num,
      title: form.title,
      is_published: form.is_published,
      payload,
    };
  }

  async function validate() {
    const body = collect("validate");
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      const d = await adminMockAction(body);
      setFeedback({
        errors: [],
        warnings: d.warnings || [],
        stats: d.stats || null,
        text: JSON.stringify(d.payload, null, 2),
      });
      setForm((f) => ({ ...f, text: JSON.stringify(d.payload, null, 2) }));
    } catch (e) {
      setFeedback({
        errors: e.data?.errors || [e.message || "Tekshirib bo'lmadi"],
        warnings: e.data?.warnings || [],
        stats: e.data?.stats || null,
      });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const body = collect("save");
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      const d = await adminMockAction(body);
      setFeedback({ errors: [], warnings: d.warnings || [], stats: d.stats || null });
      setForm(null);
      await load();
    } catch (e) {
      setFeedback({
        errors: e.data?.errors || [e.message || "Saqlab bo'lmadi"],
        warnings: e.data?.warnings || [],
        stats: e.data?.stats || null,
      });
    } finally {
      setBusy(false);
    }
  }

  async function extract() {
    if (!aiText.trim()) {
      setFeedback({ errors: ["Avval HTML faylni yuklang."], warnings: [], stats: null });
      return;
    }
    setAiBusy(true);
    setFeedback({ errors: [], warnings: [], stats: null });
    try {
      const d = await adminMockAction({
        action: "extract",
        skill: form.skill,
        series: form.series,
        test_num: form.test_num,
        html: aiText,
      });
      const v = d.validation || {};
      setForm((f) => ({ ...f, text: JSON.stringify(d.payload, null, 2) }));
      setFeedback({
        errors: [],
        warnings: v.warnings || [],
        stats: v.stats || null,
        note: `AI tayyor${d.model ? ` (${d.model})` : ""}${d.attempts ? ` · ${d.attempts} urinish` : ""}`,
      });
    } catch (e) {
      setFeedback({
        errors: e.data?.errors || [e.message || "AI xatosi."],
        warnings: e.data?.warnings || [],
        stats: null,
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function remove(mock) {
    if (!window.confirm(`Mock ${mock.series} (${mock.skill}) o'chirilsinmi?`)) return;
    try {
      await adminMockAction({ action: "delete", id: mock.id });
      await load();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    }
  }

  async function togglePublish(mock) {
    try {
      await adminMockAction({ action: "publish", id: mock.id, value: !mock.is_published });
      await load();
    } catch (e) {
      setError(e.message || "O'zgartirib bo'lmadi");
    }
  }

  const muted = isDark ? "text-white/40" : "text-black/40";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Mock testlar</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            {rows.length} seriya · listening va reading testlari
          </p>
        </div>
        <Btn isDark={isDark} variant="primary" onClick={() => openNew("listening")}>
          + Yangi mock
        </Btn>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}>
          <Spinner isDark={isDark} />
        </Panel>
      ) : !rows.length ? (
        <Panel isDark={isDark}>
          <Empty isDark={isDark}>Hozircha mock yo'q.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <Panel
              key={row.series}
              isDark={isDark}
              title={`Mock ${row.series}`}
              desc="Listening va Reading"
            >
              <div className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                {["listening", "reading"].map((skill) => {
                  const m = row.skills[skill];
                  return (
                    <div key={skill} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold capitalize">{skill}</span>
                          {m ? (
                            <Badge isDark={isDark} tone={m.is_published ? "green" : "neutral"}>
                              {m.is_published ? "Saytda" : "Yashirin"}
                            </Badge>
                          ) : (
                            <Badge isDark={isDark}>Yo'q</Badge>
                          )}
                        </div>
                        {m ? (
                          <div className={`mt-0.5 text-[11px] ${muted}`}>
                            {m.questions} savol · {m.updated_at}
                          </div>
                        ) : (
                          <div className={`mt-0.5 text-[11px] ${muted}`}>Hali qo'shilmagan</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m && (
                          <>
                            <a
                              href={`${origin}/mock/${m.series}/1/${skill}/1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-bold ${
                                isDark ? "border-white/15 text-white/70" : "border-black/15 text-black/65"
                              }`}
                            >
                              Ochish ↗
                            </a>
                            <Btn isDark={isDark} onClick={() => openEdit(m)}>
                              Tahrirlash
                            </Btn>
                            <Btn isDark={isDark} onClick={() => togglePublish(m)}>
                              {m.is_published ? "Yashirish" : "Chiqarish"}
                            </Btn>
                            <Btn isDark={isDark} variant="danger" onClick={() => remove(m)}>
                              O'chirish
                            </Btn>
                          </>
                        )}
                        {!m && (
                          <Btn isDark={isDark} onClick={() => openNew(skill)}>
                            + Qo'shish
                          </Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        isDark={isDark}
        open={!!form}
        title={form?.id ? "Mockni tahrirlash" : "Yangi mock"}
        desc="ourmock/v2 JSON formati"
        onClose={() => setForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setForm(null)}>
              Bekor qilish
            </Btn>
            <Btn isDark={isDark} disabled={busy} onClick={validate}>
              Tekshirish
            </Btn>
            <Btn isDark={isDark} variant="primary" disabled={busy} onClick={save}>
              {busy ? "…" : "Saqlash"}
            </Btn>
          </>
        }
      >
        {form && (
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2">
              <Field isDark={isDark} label="Skill">
                <select
                  value={form.skill}
                  onChange={(e) => setForm((f) => ({ ...f, skill: e.target.value }))}
                  className={inputCls(isDark)}
                >
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                </select>
              </Field>
              <Field isDark={isDark} label="Mock №">
                <input
                  type="number"
                  min={1}
                  value={form.series}
                  onChange={(e) => setForm((f) => ({ ...f, series: Number(e.target.value) }))}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Test №">
                <input
                  type="number"
                  min={1}
                  value={form.test_num}
                  onChange={(e) => setForm((f) => ({ ...f, test_num: Number(e.target.value) }))}
                  className={inputCls(isDark)}
                />
              </Field>
            </div>
            <Field isDark={isDark} label="Sarlavha">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Mock 1 — Listening"
                className={inputCls(isDark)}
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              />
              Saytda ko'rsatish
            </label>
            <div className={`rounded-lg border p-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
              <div className="text-xs font-bold">HTML → AI (ixtiyoriy)</div>
              <p className={`mt-0.5 text-[11px] ${muted}`}>
                Sayt sahifasini HTML sifatida saqlang va shu yerga yuklang — Gemini JSON tayyorlaydi.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAiText(await file.text());
                    setAiName(file.name);
                  }}
                  aria-label="HTML faylni yuklash"
                  className={`${inputCls(isDark)} flex-1 py-1.5 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-black/5 file:px-2 file:py-1 file:text-[11px] dark:file:bg-white/10`}
                />
                <Btn isDark={isDark} disabled={aiBusy || !aiText} onClick={extract}>
                  {aiBusy ? "AI ishlamoqda…" : "AI bilan to'ldirish"}
                </Btn>
              </div>
              {aiName && <div className={`mt-1 truncate text-[11px] ${muted}`}>Fayl: {aiName}</div>}
            </div>
            <Field isDark={isDark} label="Payload (JSON)">
              <textarea
                rows={14}
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                spellCheck={false}
                className={`${inputCls(isDark)} font-mono text-[11px] leading-relaxed`}
              />
            </Field>

            {!!feedback.errors.length && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                <div className="font-bold">Xatolar:</div>
                <ul className="mt-1 list-disc pl-4">
                  {feedback.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!feedback.warnings.length && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                <div className="font-bold">Ogohlantirish:</div>
                <ul className="mt-1 list-disc pl-4">
                  {feedback.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.note && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                {feedback.note}
              </div>
            )}
            {feedback.stats && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "border-white/10 text-white/60" : "border-black/10 text-black/60"}`}>
                Savollar: <span className="font-bold">{feedback.stats.questions ?? "—"}</span> · Javoblar:{" "}
                <span className="font-bold">{feedback.stats.answers ?? "—"}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
