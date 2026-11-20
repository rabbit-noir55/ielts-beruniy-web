import { useCallback, useEffect, useState } from "react";
import {
  adminResourceAction,
  adminResources,
  adminUpload,
} from "../adminApi";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, PageHeader, Panel, SkeletonRows } from "../ui";
import { inputCls } from "../formStyles";

const EMPTY = {
  id: null,
  group: "",
  kind: "pdf",
  title: "",
  description: "",
  url: "",
  order: 0,
  is_published: true,
};

const KIND_LABEL = {
  pdf: "PDF kitob",
  link: "Havola",
  mock: "Mock",
  video: "Video",
};

export default function AdminResources({ isDark }) {
  const [data, setData] = useState({ resources: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadNote, setUploadNote] = useState("");

  const load = useCallback((group = "") => {
    setLoading(true);
    return adminResources(group)
      .then((response) => setData(response))
      .catch((err) => setError(err.message || "Materiallarni yuklab bo'lmadi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const muted = isDark ? "text-white/40" : "text-black/40";

  const save = async () => {
    if (!form) return;
    if (!form.title.trim()) {
      setError("Material nomi kerak.");
      return;
    }
    if (!form.group) {
      setError("Guruhni tanlang.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminResourceAction({
        action: "save",
        id: form.id || undefined,
        group: form.group,
        kind: form.kind,
        title: form.title,
        description: form.description,
        url: form.url,
        order: Number(form.order) || 0,
        is_published: Boolean(form.is_published),
      });
      setForm(null);
      await load(groupFilter);
    } catch (err) {
      setError(err.message || "Saqlab bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (resource) => {
    if (!window.confirm(`«${resource.title}» o'chirilsinmi?`)) return;
    try {
      await adminResourceAction({ action: "delete", id: resource.id });
      await load(groupFilter);
    } catch (err) {
      setError(err.message || "O'chirib bo'lmadi.");
    }
  };

  const togglePublish = async (resource) => {
    try {
      await adminResourceAction({
        action: "publish",
        id: resource.id,
        value: !resource.is_published,
      });
      await load(groupFilter);
    } catch (err) {
      setError(err.message || "Amal bajarilmadi.");
    }
  };

  const upload = async (file, kind) => {
    if (!file) return;
    setUploadNote("Yuklanmoqda…");
    try {
      const result = await adminUpload(file, kind);
      setForm((prev) => (prev ? { ...prev, url: result.url } : prev));
      setUploadNote("Yuklandi");
    } catch (err) {
      setUploadNote("");
      setError(err.message || "Faylni yuklab bo'lmadi.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Guruh materiallari"
        desc="IELTS guruhlari uchun mocklar, Round Up guruhlari uchun PDF kitoblar va qo'shimcha havolalar."
        actions={
          <>
            <select
              value={groupFilter}
              onChange={(event) => {
                setGroupFilter(event.target.value);
                load(event.target.value);
              }}
              className={`${inputCls(isDark)} w-auto py-2 text-xs`}
              aria-label="Guruh bo'yicha filtrlash"
            >
              <option value="">Barcha guruhlar</option>
              {data.groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <Btn isDark={isDark} variant="primary" onClick={() => setForm({ ...EMPTY, group: data.groups[0]?.id || "" })}>
              + Yangi material
            </Btn>
          </>
        }
      />

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}><SkeletonRows isDark={isDark} rows={4} cols={3} /></Panel>
      ) : data.resources.length === 0 ? (
        <Panel isDark={isDark}>
          <Empty isDark={isDark}>Materiallar yo'q. «Yangi material» bilan qo'shing.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.resources.map((resource) => (
            <article
              key={resource.id}
              className={`flex flex-col rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.025]" : "border-black/[0.08] bg-white"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-lg bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                  {KIND_LABEL[resource.kind] || resource.kind}
                </span>
                <Badge isDark={isDark} tone={resource.is_published ? "green" : "neutral"} dot>
                  {resource.is_published ? "Faol" : "Yashirin"}
                </Badge>
              </div>
              <h2 className="mt-2 line-clamp-2 text-sm font-extrabold">{resource.title}</h2>
              <p className={`mt-1 line-clamp-2 text-xs ${muted}`}>
                {resource.description || "Tavsif yo'q"}
              </p>
              <div className={`mt-2 text-[11px] ${muted}`}>
                {resource.group?.name || "Guruhsiz"}
                {resource.group?.group_type ? ` · ${resource.group.group_type === "roundup" ? "Round Up" : "IELTS"}` : ""}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {resource.url && (
                  <Btn
                    isDark={isDark}
                    variant="soft"
                    onClick={() => window.open(resource.url, "_blank", "noopener,noreferrer")}
                  >
                    Ochish
                  </Btn>
                )}
                <Btn isDark={isDark} onClick={() => setForm({ ...EMPTY, ...resource, group: resource.group?.id || "" })}>
                  Tahrirlash
                </Btn>
                <Btn isDark={isDark} onClick={() => togglePublish(resource)}>
                  {resource.is_published ? "Yashirish" : "Chop etish"}
                </Btn>
                <Btn isDark={isDark} variant="danger" onClick={() => remove(resource)}>O'chirish</Btn>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isDark={isDark}
        open={Boolean(form)}
        title={form?.id ? "Materialni tahrirlash" : "Yangi material"}
        onClose={() => setForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setForm(null)}>Bekor qilish</Btn>
            <Btn isDark={isDark} variant="primary" loading={busy} onClick={save}>Saqlash</Btn>
          </>
        }
      >
        {form && (() => {
          const selectedType = data.groups.find(
            (group) => String(group.id) === String(form.group)
          )?.group_type;
          const kindOptions =
            selectedType === "roundup"
              ? [["pdf", "PDF kitob"], ["link", "Havola"]]
              : selectedType === "ielts"
                ? [["mock", "Mock"], ["link", "Havola"], ["video", "Video"]]
                : [
                    ["pdf", "PDF kitob"],
                    ["mock", "Mock"],
                    ["link", "Havola"],
                    ["video", "Video"],
                  ];
          return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Guruh">
                <select
                  value={form.group}
                  onChange={(event) => {
                    const nextGroup = event.target.value;
                    const nextType = data.groups.find(
                      (group) => String(group.id) === String(nextGroup)
                    )?.group_type;
                    setForm({
                      ...form,
                      group: nextGroup,
                      kind: nextType === "roundup" ? "pdf" : nextType === "ielts" ? "mock" : form.kind,
                    });
                  }}
                  className={inputCls(isDark)}
                >
                  <option value="">Tanlang…</option>
                  {data.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.group_type === "roundup" ? "Round Up" : "IELTS"})
                    </option>
                  ))}
                </select>
              </Field>
              <Field isDark={isDark} label="Turi">
                <select
                  value={form.kind}
                  onChange={(event) => setForm({ ...form, kind: event.target.value })}
                  className={inputCls(isDark)}
                >
                  {kindOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field isDark={isDark} label="Nomi">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className={inputCls(isDark)}
                placeholder="Masalan: Round Up 2 — Unit 1"
              />
            </Field>
            <Field isDark={isDark} label="Tavsif">
              <textarea
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Havola yoki fayl" hint="PDF/video yuklang yoki tayyor URL qo'ying">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={form.url}
                  onChange={(event) => setForm({ ...form, url: event.target.value })}
                  className={inputCls(isDark)}
                  placeholder="https://…"
                />
                <label className="cursor-pointer rounded-xl border border-dashed border-[var(--accent)]/40 px-3 py-2 text-xs font-bold text-[var(--accent)]">
                  Fayl yuklash
                  <input
                    type="file"
                    accept={form.kind === "video" ? "video/*" : ".pdf"}
                    className="hidden"
                    onChange={(event) => upload(event.target.files?.[0], form.kind === "video" ? "video" : "pdf")}
                  />
                </label>
              </div>
            </Field>
            {uploadNote && <p className={`text-[11px] ${muted}`}>{uploadNote}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Tartib">
                <input
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(event) => setForm({ ...form, order: event.target.value })}
                  className={inputCls(isDark)}
                />
              </Field>
              <label className="flex items-end gap-2 pb-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Chop etilgan
              </label>
            </div>
          </div>
          );
        })()}
      </Modal>
    </div>
  );
}
