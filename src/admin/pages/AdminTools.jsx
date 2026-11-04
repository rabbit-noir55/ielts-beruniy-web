import { useCallback, useEffect, useState } from "react";
import { adminToolAction, adminToolDetail, adminTools } from "../adminApi";
import { inputCls } from "../formStyles";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, Panel, Spinner } from "../ui";

function ToolIcon({ icon, isDark }) {
  const raw = (icon || "").trim();
  const isSvg = raw.startsWith("<svg");
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-lg ${
        isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/[0.03]"
      }`}
    >
      {isSvg ? (
        <span className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: raw }} />
      ) : (
        raw || "🧰"
      )}
    </span>
  );
}

export default function AdminTools({ isDark }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ errors: [], warnings: [] });

  const load = useCallback(() => {
    setLoading(true);
    return adminTools()
      .then((d) => {
        setTools(d.tools || []);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setFeedback({ errors: [], warnings: [] });
    setForm({
      id: null,
      title: "",
      description: "",
      html_code: "",
      is_active: true,
      order: tools.length,
      fileName: "",
    });
  }

  async function openEdit(tool) {
    setFeedback({ errors: [], warnings: [] });
    try {
      const d = await adminToolDetail(tool.id);
      setForm({
        id: d.id,
        title: d.title,
        description: d.description,
        html_code: d.html_code,
        is_active: d.is_active,
        order: d.order,
        fileName: "",
      });
    } catch (e) {
      setError(e.message || "Toolni yuklab bo'lmadi");
    }
  }

  async function readFile(file) {
    if (!file) return;
    const text = await file.text();
    setForm((f) => ({ ...f, html_code: text, fileName: file.name }));
  }

  async function save() {
    if (!form.html_code.trim()) {
      setFeedback({ errors: ["HTML faylni tanlang yoki kodni joylang."], warnings: [] });
      return;
    }
    setBusy(true);
    setFeedback({ errors: [], warnings: [] });
    try {
      const d = await adminToolAction({
        action: "save",
        id: form.id || undefined,
        title: form.title,
        description: form.description,
        html_code: form.html_code,
        is_active: form.is_active,
        order: form.order,
      });
      setForm(null);
      await load();
      if (d.warnings?.length) setError(d.warnings.join(" "));
    } catch (e) {
      setFeedback({
        errors: e.data?.errors || [e.message || "Saqlab bo'lmadi"],
        warnings: e.data?.warnings || [],
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(tool) {
    setError("");
    try {
      await adminToolAction({ action: "toggle", id: tool.id, value: !tool.is_active });
      await load();
    } catch (e) {
      setError(e.message || "O'zgartirib bo'lmadi");
    }
  }

  async function remove(tool) {
    if (!window.confirm(`«${tool.title}» tooli o'chirilsinmi?`)) return;
    setError("");
    try {
      await adminToolAction({ action: "delete", id: tool.id });
      await load();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    }
  }

  const muted = isDark ? "text-white/40" : "text-black/40";
  const rule = isDark ? "border-white/10" : "border-black/10";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Tool'lar</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            {tools.length} ta vosita · bazada o'z xotirasi bor
          </p>
        </div>
        <Btn isDark={isDark} variant="primary" onClick={openNew}>
          + Yangi tool
        </Btn>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}>
          <Spinner isDark={isDark} />
        </Panel>
      ) : !tools.length ? (
        <Panel isDark={isDark}>
          <Empty isDark={isDark}>Hozircha tool yo'q.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((t) => (
            <section
              key={t.id}
              className={`flex flex-col rounded-xl border ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}
            >
              <div className="flex items-start gap-3 px-4 pt-3.5">
                <ToolIcon icon={t.icon} isDark={isDark} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-extrabold">{t.title}</h2>
                  <p className={`mt-0.5 line-clamp-2 text-[11px] ${muted}`}>
                    {t.description || "Tavsif yo'q"}
                  </p>
                </div>
                <Badge isDark={isDark} tone={t.is_active ? "green" : "neutral"}>
                  {t.is_active ? "Faol" : "Yashirin"}
                </Badge>
              </div>

              <dl className={`mt-3 grid grid-cols-2 gap-2 border-t px-4 py-2.5 text-[11px] ${rule}`}>
                <div>
                  <dt className={muted}>Foydalanuvchi</dt>
                  <dd className="font-bold">{t.users}</dd>
                </div>
                <div>
                  <dt className={muted}>Hajm</dt>
                  <dd className="font-bold">{t.size_kb} KB</dd>
                </div>
              </dl>

              <div className={`mt-auto flex flex-wrap gap-1.5 border-t px-4 py-2.5 ${rule}`}>
                <Btn isDark={isDark} onClick={() => openEdit(t)}>
                  Tahrirlash
                </Btn>
                <Btn isDark={isDark} onClick={() => toggle(t)}>
                  {t.is_active ? "Yashirish" : "Faollashtirish"}
                </Btn>
                <Btn isDark={isDark} variant="danger" onClick={() => remove(t)}>
                  O'chirish
                </Btn>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        isDark={isDark}
        open={!!form}
        title={form?.id ? "Toolni tahrirlash" : "Yangi tool"}
        desc="Bitta HTML fayl · meta blokida title bo'lishi shart"
        onClose={() => setForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setForm(null)}>
              Bekor qilish
            </Btn>
            <Btn isDark={isDark} variant="primary" disabled={busy} onClick={save}>
              {busy ? "Tekshirilmoqda…" : "Saqlash"}
            </Btn>
          </>
        }
      >
        {form && (
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
            <Field isDark={isDark} label="HTML fayl">
              <input
                type="file"
                accept=".html,text/html"
                onChange={(e) => readFile(e.target.files?.[0])}
                className={`${inputCls(isDark)} py-1.5 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-black/5 file:px-2 file:py-1 file:text-[11px] dark:file:bg-white/10`}
              />
            </Field>
            {form.fileName && (
              <div className={`text-[11px] ${muted}`}>
                Tanlandi: <span className="font-semibold">{form.fileName}</span>
              </div>
            )}
            <Field isDark={isDark} label="Sarlavha (bo'sh bo'lsa metadan olinadi)">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Tavsif">
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputCls(isDark)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Tartib">
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  className={inputCls(isDark)}
                />
              </Field>
              <label className="mt-5 flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Faol
              </label>
            </div>
            <Field isDark={isDark} label="HTML kod">
              <textarea
                rows={10}
                value={form.html_code}
                onChange={(e) => setForm((f) => ({ ...f, html_code: e.target.value }))}
                spellCheck={false}
                placeholder="<!doctype html> …"
                className={`${inputCls(isDark)} font-mono text-[11px]`}
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
          </div>
        )}
      </Modal>
    </div>
  );
}
