import { useCallback, useEffect, useState } from "react";
import {
  adminCambridgeBook,
  adminMockAction,
  adminMocks,
} from "../adminApi";
import {
  Badge,
  Btn,
  Empty,
  ErrorBox,
  Field,
  Modal,
  PageHeader,
  Panel,
  SkeletonRows,
} from "../ui";
import { inputCls } from "../formStyles";

const SKILLS = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];

const EMPTY = {
  series: "",
  year: "",
  title: "",
  listening: "",
  reading: "",
  writing: "",
  speaking: "",
  is_published: true,
};

export default function AdminCambridgeBooks({ isDark }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return adminMocks()
      .then((response) => {
        setBooks(response.cambridge_books || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Kitoblarni yuklab bo'lmadi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const muted = isDark ? "text-white/40" : "text-black/40";

  const openNew = () => {
    const next = books.length
      ? Math.max(...books.map((book) => Number(book.series) || 0)) + 1
      : 21;
    setForm({
      ...EMPTY,
      series: next,
      year: 2005 + next,
      editing: false,
    });
  };

  const openEdit = async (book) => {
    setError("");
    setForm({ ...EMPTY, series: book.series, year: book.year, title: book.title, busy: true, editing: true });
    try {
      const detail = await adminCambridgeBook(book.series);
      setForm({
        editing: true,
        series: detail.series,
        year: detail.year,
        title: detail.title || "",
        listening: detail.listening && Object.keys(detail.listening).length
          ? JSON.stringify(detail.listening, null, 2)
          : "",
        reading: detail.reading && Object.keys(detail.reading).length
          ? JSON.stringify(detail.reading, null, 2)
          : "",
        writing: detail.writing && Object.keys(detail.writing).length
          ? JSON.stringify(detail.writing, null, 2)
          : "",
        speaking: detail.speaking && Object.keys(detail.speaking).length
          ? JSON.stringify(detail.speaking, null, 2)
          : "",
        is_published: detail.is_published,
      });
    } catch (err) {
      setError(err.message || "Kitobni yuklab bo'lmadi.");
      setForm(null);
    }
  };

  const save = async () => {
    if (!form) return;
    const series = Number(form.series);
    if (!series) {
      setError("Kitob raqami (series) kerak.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminMockAction({
        action: "save_book",
        series,
        year: Number(form.year) || 0,
        title: form.title,
        listening: form.listening,
        reading: form.reading,
        writing: form.writing,
        speaking: form.speaking,
        is_published: Boolean(form.is_published),
      });
      setForm(null);
      await load();
    } catch (err) {
      setError(err.message || "Saqlab bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (book) => {
    if (!window.confirm(`IELTS ${book.series} kitobi o'chirilsinmi?`)) return;
    try {
      await adminMockAction({ action: "delete_book", series: book.series });
      await load();
    } catch (err) {
      setError(err.message || "O'chirib bo'lmadi.");
    }
  };

  const togglePublish = async (book) => {
    try {
      await adminMockAction({
        action: "publish_book",
        series: book.series,
        value: !book.is_published,
      });
      await load();
    } catch (err) {
      setError(err.message || "O'zgartirib bo'lmadi.");
    }
  };

  const readJsonFile = async (file, skill) => {
    if (!file) return;
    const text = await file.text();
    setForm((prev) => ({ ...prev, [skill]: text }));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Cambridge kitoblar"
        desc="Ustoz bitta kitob JSON'ini yuklaydi — saytda IELTS 20 kabi karta (Test 1–4, Listening/Reading/Writing/Speaking) paydo bo'ladi."
        actions={
          <Btn isDark={isDark} variant="primary" onClick={openNew}>
            + Yangi kitob
          </Btn>
        }
      />

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}>
          <SkeletonRows isDark={isDark} rows={3} cols={3} />
        </Panel>
      ) : books.length === 0 ? (
        <Panel isDark={isDark}>
          <Empty isDark={isDark}>
            Hozircha Cambridge kitoblari yo'q. «Yangi kitob» bilan JSON yuklang.
          </Empty>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <article
              key={book.series}
              className={`rounded-2xl border p-4 ${
                isDark ? "border-white/10 bg-white/[0.025]" : "border-black/[0.08] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold">IELTS {book.series}</h2>
                  <p className={`text-[11px] ${muted}`}>{book.year}</p>
                </div>
                <Badge isDark={isDark} tone={book.is_published ? "green" : "neutral"} dot>
                  {book.is_published ? "Saytda" : "Yashirin"}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {SKILLS.map((skill) => (
                  <Badge
                    key={skill.key}
                    isDark={isDark}
                    tone={book.skills?.includes(skill.key) ? "accent" : "neutral"}
                  >
                    {skill.label}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Btn isDark={isDark} onClick={() => openEdit(book)}>
                  Tahrirlash
                </Btn>
                <Btn isDark={isDark} onClick={() => togglePublish(book)}>
                  {book.is_published ? "Yashirish" : "Chiqarish"}
                </Btn>
                <Btn isDark={isDark} variant="danger" onClick={() => remove(book)}>
                  O'chirish
                </Btn>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isDark={isDark}
        open={Boolean(form)}
        title={form?.editing ? "Kitobni tahrirlash" : "Yangi Cambridge kitob"}
        desc="JSON formati: { book, type, series_id, tests } — har skill uchun alohida."
        size="lg"
        onClose={() => setForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setForm(null)}>
              Bekor qilish
            </Btn>
            <Btn isDark={isDark} variant="primary" loading={busy} onClick={save}>
              Saqlash
            </Btn>
          </>
        }
      >
        {form && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Field isDark={isDark} label="Kitob raqami">
                <input
                  type="number"
                  min="1"
                  value={form.series}
                  onChange={(event) => setForm({ ...form, series: event.target.value })}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Yil">
                <input
                  type="number"
                  value={form.year}
                  onChange={(event) => setForm({ ...form, year: event.target.value })}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Sarlavha">
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="IELTS 21"
                  className={inputCls(isDark)}
                />
              </Field>
            </div>

            {SKILLS.map((skill) => (
              <Field key={skill.key} isDark={isDark} label={`${skill.label} JSON`}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="cursor-pointer rounded-lg border border-dashed border-[var(--accent)]/40 px-2.5 py-1 text-[11px] font-bold text-[var(--accent)]">
                      JSON fayl
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(event) => readJsonFile(event.target.files?.[0], skill.key)}
                      />
                    </label>
                    {form[skill.key] && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, [skill.key]: "" })}
                        className="text-[11px] font-bold text-red-400"
                      >
                        Tozalash
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={form[skill.key]}
                    onChange={(event) => setForm({ ...form, [skill.key]: event.target.value })}
                    placeholder='{"book":"IELTS 21","type":"reading","tests":{...}}'
                    spellCheck={false}
                    className={`${inputCls(isDark)} font-mono text-[11px]`}
                  />
                </div>
              </Field>
            ))}

            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Saytda ko'rsatish
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
