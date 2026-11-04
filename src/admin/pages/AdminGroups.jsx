import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGroupDelete, adminGroupSave, adminGroups } from "../adminApi";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, Panel, Spinner } from "../ui";
import { inputCls } from "../formStyles";

const EMPTY_FORM = {
  id: null,
  name: "",
  slug: "",
  group_type: "ielts",
  schedule_type: "",
  schedule_time: "",
  description: "",
};

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function AdminGroups({ isDark }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return adminGroups()
      .then((d) => {
        setGroups(d.groups || []);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(g) {
    setForm({
      id: g.id,
      name: g.name,
      slug: g.slug,
      group_type: g.group_type || "ielts",
      schedule_type: g.schedule_type || "",
      schedule_time: g.schedule_time || "",
      description: g.description || "",
    });
  }

  function set(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !f.id) next.slug = slugify(value);
      return next;
    });
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Guruh nomini kiriting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminGroupSave({
        ...form,
        slug: form.slug || slugify(form.name),
        schedule_time: form.schedule_time || null,
      });
      setForm(null);
      await load();
    } catch (e) {
      setError(e.message || "Saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const g = del;
    setDel(null);
    try {
      await adminGroupDelete(g.id);
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
          <h1 className="text-xl font-extrabold tracking-tight">Guruhlar</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            {groups.length} ta guruh · jadval va tarkibni boshqaring
          </p>
        </div>
        <Btn isDark={isDark} variant="primary" onClick={openNew}>
          + Yangi guruh
        </Btn>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}>
          <Spinner isDark={isDark} />
        </Panel>
      ) : !groups.length ? (
        <Panel isDark={isDark}>
          <Empty isDark={isDark}>Hozircha guruh yo'q. Yangi guruh qo'shing.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <section
              key={g.id}
              className={`flex flex-col rounded-xl border ${rule} ${
                isDark ? "bg-white/[0.02]" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-extrabold">{g.name}</h2>
                  <div className={`mt-0.5 truncate font-mono text-[10px] ${muted}`}>/{g.slug}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge isDark={isDark} tone={g.group_type === "ielts" ? "accent" : "neutral"}>
                    {g.group_type === "ielts" ? "IELTS" : "Round Up"}
                  </Badge>
                  {(!g.schedule_time || !g.schedule_type) && (
                    <Badge isDark={isDark} tone="red">Jadval yo'q</Badge>
                  )}
                </div>
              </div>

              <dl className={`mt-3 grid grid-cols-2 gap-2 border-t px-4 py-3 text-xs ${rule}`}>
                <div>
                  <dt className={muted}>O'quvchilar</dt>
                  <dd className="mt-0.5 font-bold">{g.users} ta</dd>
                </div>
                <div>
                  <dt className={muted}>Jadval</dt>
                  <dd className="mt-0.5 font-bold">
                    {g.schedule_type === "odd"
                      ? "Toq kunlar"
                      : g.schedule_type === "even"
                        ? "Juft kunlar"
                        : "Belgilanmagan"}
                  </dd>
                </div>
                <div>
                  <dt className={muted}>Dars vaqti</dt>
                  <dd className="mt-0.5 font-bold">{g.schedule_time || "—"}</dd>
                </div>
                <div>
                  <dt className={muted}>Davomat</dt>
                  <dd className="mt-0.5">
                    <Link
                      to="/admin/attendance"
                      className="font-bold text-[var(--accent)] underline underline-offset-2"
                    >
                      Ochish →
                    </Link>
                  </dd>
                </div>
              </dl>

              {g.description && (
                <p className={`line-clamp-2 px-4 pb-3 text-xs ${muted}`}>{g.description}</p>
              )}

              <div className={`mt-auto flex flex-wrap gap-2 border-t px-4 py-2.5 ${rule}`}>
                <Btn isDark={isDark} onClick={() => openEdit(g)}>
                  Tahrirlash
                </Btn>
                <Btn isDark={isDark} variant="danger" onClick={() => setDel(g)}>
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
        title={form?.id ? "Guruhni tahrirlash" : "Yangi guruh"}
        desc="Nom, slug va dars jadvali"
        onClose={() => setForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setForm(null)}>
              Bekor qilish
            </Btn>
            <Btn isDark={isDark} variant="primary" disabled={saving} onClick={save}>
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </Btn>
          </>
        }
      >
        {form && (
          <div className="flex flex-col gap-3">
            <Field isDark={isDark} label="Nomi">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="IELTS Intensive A"
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Slug (havola)">
              <input
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="ielts-intensive-a"
                className={inputCls(isDark)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Turi">
                <select
                  value={form.group_type}
                  onChange={(e) => set("group_type", e.target.value)}
                  className={inputCls(isDark)}
                >
                  <option value="ielts">IELTS</option>
                  <option value="roundup">Round Up</option>
                </select>
              </Field>
              <Field isDark={isDark} label="Kunlar">
                <select
                  value={form.schedule_type}
                  onChange={(e) => set("schedule_type", e.target.value)}
                  className={inputCls(isDark)}
                >
                  <option value="">Belgilanmagan</option>
                  <option value="odd">Toq kunlar</option>
                  <option value="even">Juft kunlar</option>
                </select>
              </Field>
            </div>
            <Field isDark={isDark} label="Dars vaqti">
              <input
                type="time"
                value={form.schedule_time}
                onChange={(e) => set("schedule_time", e.target.value)}
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Tavsif">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Guruh haqida qisqacha…"
                className={inputCls(isDark)}
              />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        isDark={isDark}
        open={!!del}
        title="Guruhni o'chirish"
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
          <span className="font-bold">{del?.name}</span> guruhi o'chiriladi. O'quvchilar guruhsiz
          qoladi, ularning hisoblari saqlanadi.
        </p>
      </Modal>
    </div>
  );
}
