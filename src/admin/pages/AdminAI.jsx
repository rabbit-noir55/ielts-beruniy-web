import { useCallback, useEffect, useState } from "react";
import {
  adminAIModels,
  adminAIModelSave,
  adminAIProviders,
  adminAIProviderSave,
  adminAIUsage,
} from "../adminApi";
import { inputCls } from "../formStyles";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, Panel, Spinner, Th } from "../ui";

const PROVIDER_DEFAULTS = {
  id: null,
  name: "",
  slug: "",
  kind: "openai",
  base_url: "",
  api_key_env: "",
  enabled: true,
};

const MODEL_DEFAULTS = {
  id: null,
  provider: "",
  name: "",
  model_id: "",
  features: ["*"],
  priority: 100,
  enabled: true,
  max_tokens: 8192,
  temperature: 0.7,
};

function fmtNum(n) {
  return new Intl.NumberFormat("en-US").format(Number(n) || 0);
}

export default function AdminAI({ isDark }) {
  const [tab, setTab] = useState("usage");
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [features, setFeatures] = useState([]);
  const [usage, setUsage] = useState(null);
  const [days, setDays] = useState(7);
  const [featureFilter, setFeatureFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [providerForm, setProviderForm] = useState(null);
  const [modelForm, setModelForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadConfig = useCallback(() => {
    setLoading(true);
    return Promise.all([adminAIProviders(), adminAIModels()])
      .then(([p, m]) => {
        setProviders(p.providers || []);
        setFeatures(m.features || p.features || []);
        setModels(m.models || []);
        setError("");
      })
      .catch((e) => setError(e.message || "Yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  const loadUsage = useCallback(() => {
    return adminAIUsage({ days, feature: featureFilter })
      .then((d) => {
        setUsage(d);
        setError("");
      })
      .catch((e) => setError(e.message || "Sarflarni yuklab bo'lmadi"));
  }, [days, featureFilter]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (tab === "usage") loadUsage();
  }, [tab, loadUsage]);

  async function saveProvider() {
    if (!providerForm.name.trim() || !providerForm.slug.trim()) {
      setError("Nom va slug kerak.");
      return;
    }
    setBusy(true);
    try {
      await adminAIProviderSave({ ...providerForm, action: "save" });
      setProviderForm(null);
      await loadConfig();
    } catch (e) {
      setError(e.message || "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function seedProviders() {
    setBusy(true);
    try {
      const d = await adminAIProviderSave({ action: "seed" });
      await loadConfig();
      setError(d.created?.length ? `Qo'shildi: ${d.created.join(", ")}` : "Hammasi mavjud.");
    } catch (e) {
      setError(e.message || "Qo'shib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProvider(p) {
    if (!window.confirm(`«${p.name}» provayderi va uning modellari o'chirilsinmi?`)) return;
    try {
      await adminAIProviderSave({ action: "delete", id: p.id });
      await loadConfig();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    }
  }

  async function toggleProvider(p) {
    try {
      await adminAIProviderSave({
        action: "save",
        id: p.id,
        name: p.name,
        slug: p.slug,
        kind: p.kind,
        base_url: p.base_url,
        api_key_env: p.api_key_env,
        enabled: !p.enabled,
      });
      await loadConfig();
    } catch (e) {
      setError(e.message || "O'zgartirib bo'lmadi");
    }
  }

  async function saveModel() {
    if (!modelForm.provider || !modelForm.name.trim() || !modelForm.model_id.trim()) {
      setError("Provayder, nom va model ID kerak.");
      return;
    }
    setBusy(true);
    try {
      await adminAIModelSave({ ...modelForm, action: "save" });
      setModelForm(null);
      await loadConfig();
    } catch (e) {
      setError(e.message || "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function deleteModel(m) {
    if (!window.confirm(`«${m.name}» modeli o'chirilsinmi?`)) return;
    try {
      await adminAIModelSave({ action: "delete", id: m.id });
      await loadConfig();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    }
  }

  async function toggleModel(m) {
    try {
      await adminAIModelSave({
        action: "save",
        id: m.id,
        provider: m.provider,
        name: m.name,
        model_id: m.model_id,
        features: m.features,
        priority: m.priority,
        enabled: !m.enabled,
        max_tokens: m.max_tokens,
        temperature: m.temperature,
      });
      await loadConfig();
    } catch (e) {
      setError(e.message || "O'zgartirib bo'lmadi");
    }
  }

  const muted = isDark ? "text-white/40" : "text-black/40";
  const rule = isDark ? "border-white/10" : "border-black/10";
  const tabs = [
    { id: "usage", label: "Sarflar" },
    { id: "providers", label: "Provayderlar" },
    { id: "models", label: "Modellar" },
  ];
  const maxDaily = Math.max(1, ...(usage?.daily || []).map((d) => d.calls));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">AI boshqaruv</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Provayder, model va sarflar — kod o'zgartirmasdan
          </p>
        </div>
        {tab === "providers" && (
          <div className="flex gap-2">
            <Btn isDark={isDark} onClick={seedProviders} disabled={busy}>
              Standartlarni qo'shish
            </Btn>
            <Btn isDark={isDark} variant="primary" onClick={() => setProviderForm({ ...PROVIDER_DEFAULTS })}>
              + Provayder
            </Btn>
          </div>
        )}
        {tab === "models" && (
          <Btn
            isDark={isDark}
            variant="primary"
            onClick={() =>
              setModelForm({
                ...MODEL_DEFAULTS,
                provider: providers[0]?.id || "",
              })
            }
            disabled={!providers.length}
          >
            + Model
          </Btn>
        )}
      </div>

      <ErrorBox>{error}</ErrorBox>

      <div className={`flex w-fit gap-1 rounded-full border p-1 ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
        {tabs.map((t) => (
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

      {loading && tab !== "usage" ? (
        <Panel isDark={isDark}>
          <Spinner isDark={isDark} />
        </Panel>
      ) : tab === "providers" ? (
        <Panel
          isDark={isDark}
          title="Provayderlar"
          desc="API kalitlar Render env'ida saqlanadi — bu yerda faqat env nomi ko'rsatiladi"
        >
          {!providers.length ? (
            <Empty isDark={isDark}>Provayder yo'q. «Standartlarni qo'shish» tugmasini bosing.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                    <Th>Provayder</Th>
                    <Th>Turi</Th>
                    <Th>Env kalit</Th>
                    <Th>Holat</Th>
                    <Th className="text-right">Amallar</Th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className={`border-t ${rule}`}>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold">{p.name}</div>
                        <div className={`font-mono text-[10px] ${muted}`}>{p.slug}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{p.kind}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[10px]">{p.api_key_env || "—"}</div>
                        <div className="mt-1">
                          {p.env_ready ? (
                            <Badge isDark={isDark} tone="green">Kalit bor</Badge>
                          ) : (
                            <Badge isDark={isDark} tone="red">Kalit yo'q</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge isDark={isDark} tone={p.enabled ? "green" : "neutral"}>
                          {p.enabled ? "Faol" : "O'chirilgan"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Btn
                            isDark={isDark}
                            onClick={() =>
                              setProviderForm({
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                kind: p.kind,
                                base_url: p.base_url,
                                api_key_env: p.api_key_env,
                                enabled: p.enabled,
                              })
                            }
                          >
                            Tahrirlash
                          </Btn>
                          <Btn isDark={isDark} onClick={() => toggleProvider(p)}>
                            {p.enabled ? "O'chirish" : "Faollashtirish"}
                          </Btn>
                          <Btn isDark={isDark} variant="danger" onClick={() => deleteProvider(p)}>
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
      ) : tab === "models" ? (
        <Panel
          isDark={isDark}
          title="Modellar"
          desc="Har bir bo'lim uchun model tanlanadi; kichik priority — birinchi uriniladi"
        >
          {!models.length ? (
            <Empty isDark={isDark}>Model qo'shilmagan. Provayder qo'shib, keyin model qo'shing.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                    <Th>Model</Th>
                    <Th>Provayder</Th>
                    <Th>Bo'limlar</Th>
                    <Th>Priority</Th>
                    <Th>Holat</Th>
                    <Th className="text-right">Amallar</Th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className={`border-t ${rule}`}>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold">{m.name}</div>
                        <div className={`font-mono text-[10px] ${muted}`}>{m.model_id}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{m.provider_name}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {m.features.includes("*") ? (
                            <Badge isDark={isDark} tone="accent">Barchasi</Badge>
                          ) : (
                            m.features.map((f) => (
                              <Badge isDark={isDark} key={f}>
                                {features.find((x) => x.code === f)?.label || f}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-bold">{m.priority}</td>
                      <td className="px-3 py-2.5">
                        <Badge isDark={isDark} tone={m.enabled ? "green" : "neutral"}>
                          {m.enabled ? "Faol" : "O'chirilgan"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Btn isDark={isDark} onClick={() => setModelForm({ ...m })}>
                            Tahrirlash
                          </Btn>
                          <Btn isDark={isDark} onClick={() => toggleModel(m)}>
                            {m.enabled ? "O'chirish" : "Faollashtirish"}
                          </Btn>
                          <Btn isDark={isDark} variant="danger" onClick={() => deleteModel(m)}>
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
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label="Davr"
              className={`${inputCls(isDark)} w-32 py-1.5`}
            >
              <option value={1}>1 kun</option>
              <option value={7}>7 kun</option>
              <option value={30}>30 kun</option>
              <option value={90}>90 kun</option>
            </select>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              aria-label="Bo'lim"
              className={`${inputCls(isDark)} w-48 py-1.5`}
            >
              <option value="">Barcha bo'limlar</option>
              {features.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.label}
                </option>
              ))}
            </select>
            <Btn isDark={isDark} onClick={loadUsage}>Yangilash</Btn>
          </div>

          {!usage ? (
            <Panel isDark={isDark}>
              <Spinner isDark={isDark} />
            </Panel>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "So'rovlar", value: fmtNum(usage.totals.calls) },
                  {
                    label: "Muvaffaqiyat",
                    value: usage.totals.calls
                      ? `${Math.round((usage.totals.success / usage.totals.calls) * 100)}%`
                      : "—",
                  },
                  {
                    label: "Tokenlar",
                    value: fmtNum(usage.totals.tokens_in + usage.totals.tokens_out),
                  },
                  { label: "O'rtacha javob", value: `${usage.totals.avg_latency} ms` },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border px-4 py-3 ${rule} ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
                    <div className="text-2xl font-extrabold">{s.value}</div>
                    <div className={`text-[11px] font-semibold ${muted}`}>{s.label}</div>
                  </div>
                ))}
              </div>

              {!!usage.daily.length && (
                <Panel isDark={isDark} title="Kunlik so'rovlar">
                  <div className="flex h-28 items-end gap-1 px-4 py-3">
                    {usage.daily.map((d) => (
                      <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.calls} so'rov, ${d.failures} xato`}>
                        <div
                          className="w-full rounded-t bg-[var(--accent)]"
                          style={{ height: `${Math.max(3, (d.calls / maxDaily) * 80)}px`, opacity: 0.75 }}
                        />
                        <span className={`text-[9px] ${muted}`}>{d.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel isDark={isDark} title="Bo'limlar bo'yicha">
                  {!usage.by_feature.length ? (
                    <Empty isDark={isDark}>Ma'lumot yo'q.</Empty>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                          <Th>Bo'lim</Th>
                          <Th>So'rov</Th>
                          <Th>Token</Th>
                          <Th>OK</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.by_feature.map((f) => (
                          <tr key={f.feature} className={`border-t ${rule}`}>
                            <td className="px-3 py-2 font-semibold">{f.label}</td>
                            <td className="px-3 py-2">{fmtNum(f.calls)}</td>
                            <td className="px-3 py-2">{fmtNum(f.tokens)}</td>
                            <td className={`px-3 py-2 ${muted}`}>{f.success}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Panel>

                <Panel isDark={isDark} title="Modellar bo'yicha">
                  {!usage.by_model.length ? (
                    <Empty isDark={isDark}>Ma'lumot yo'q.</Empty>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                          <Th>Model</Th>
                          <Th>So'rov</Th>
                          <Th>Token</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.by_model.map((m) => (
                          <tr key={`${m.provider}-${m.model}`} className={`border-t ${rule}`}>
                            <td className="px-3 py-2">
                              <div className="font-semibold">{m.model || "—"}</div>
                              <div className={`text-[10px] ${muted}`}>{m.provider}</div>
                            </td>
                            <td className="px-3 py-2">{fmtNum(m.calls)}</td>
                            <td className="px-3 py-2">{fmtNum(m.tokens)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Panel>
              </div>

              <Panel isDark={isDark} title="Oxirgi so'rovlar" desc="Eng ko'pi 200 ta">
                {!usage.recent.length ? (
                  <Empty isDark={isDark}>Hozircha AI so'rovi yo'q.</Empty>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] border-collapse text-xs">
                      <thead>
                        <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                          <Th>Vaqt</Th>
                          <Th>Bo'lim</Th>
                          <Th>Provayder / model</Th>
                          <Th>Token</Th>
                          <Th>Vaqt</Th>
                          <Th>Holat</Th>
                          <Th>Foydalanuvchi</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.recent.map((r) => (
                          <tr key={r.id} className={`border-t ${rule}`}>
                            <td className={`whitespace-nowrap px-3 py-2 ${muted}`}>{r.created_at}</td>
                            <td className="px-3 py-2 font-semibold">{r.feature}</td>
                            <td className="px-3 py-2">
                              <div>{r.provider}</div>
                              <div className={`font-mono text-[10px] ${muted}`}>{r.model}</div>
                            </td>
                            <td className="px-3 py-2">
                              {fmtNum(r.tokens_in)} / {fmtNum(r.tokens_out)}
                            </td>
                            <td className="px-3 py-2">{r.latency_ms} ms</td>
                            <td className="px-3 py-2">
                              {r.success ? (
                                <Badge isDark={isDark} tone="green">OK</Badge>
                              ) : (
                                <span title={r.error}><Badge isDark={isDark} tone="red">Xato</Badge></span>
                              )}
                            </td>
                            <td className={`px-3 py-2 ${muted}`}>{r.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </>
          )}
        </>
      )}

      <Modal
        isDark={isDark}
        open={!!providerForm}
        title={providerForm?.id ? "Provayderni tahrirlash" : "Yangi provayder"}
        desc="API kalit env o'zgaruvchisida turadi"
        onClose={() => setProviderForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setProviderForm(null)}>Bekor qilish</Btn>
            <Btn isDark={isDark} variant="primary" disabled={busy} onClick={saveProvider}>
              {busy ? "Saqlanmoqda…" : "Saqlash"}
            </Btn>
          </>
        }
      >
        {providerForm && (
          <div className="flex flex-col gap-3">
            <Field isDark={isDark} label="Nomi">
              <input
                value={providerForm.name}
                onChange={(e) => setProviderForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls(isDark)}
                placeholder="Groq"
              />
            </Field>
            <Field isDark={isDark} label="Slug">
              <input
                value={providerForm.slug}
                onChange={(e) => setProviderForm((f) => ({ ...f, slug: e.target.value }))}
                className={inputCls(isDark)}
                placeholder="groq"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Turi">
                <select
                  value={providerForm.kind}
                  onChange={(e) => setProviderForm((f) => ({ ...f, kind: e.target.value }))}
                  className={inputCls(isDark)}
                >
                  <option value="openai">OpenAI-compatible</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </Field>
              <Field isDark={isDark} label="Faol">
                <select
                  value={providerForm.enabled ? "1" : "0"}
                  onChange={(e) => setProviderForm((f) => ({ ...f, enabled: e.target.value === "1" }))}
                  className={inputCls(isDark)}
                >
                  <option value="1">Ha</option>
                  <option value="0">Yo'q</option>
                </select>
              </Field>
            </div>
            <Field isDark={isDark} label="Base URL">
              <input
                value={providerForm.base_url}
                onChange={(e) => setProviderForm((f) => ({ ...f, base_url: e.target.value }))}
                className={inputCls(isDark)}
                placeholder="https://api.groq.com/openai/v1"
              />
            </Field>
            <Field isDark={isDark} label="Env kalit nomi (vergul bilan)">
              <input
                value={providerForm.api_key_env}
                onChange={(e) => setProviderForm((f) => ({ ...f, api_key_env: e.target.value }))}
                className={inputCls(isDark)}
                placeholder="GROQ_KEY_1,GROQ_KEY_2"
              />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        isDark={isDark}
        open={!!modelForm}
        title={modelForm?.id ? "Modelni tahrirlash" : "Yangi model"}
        desc="Model ID provayder hujjatidagi nom bilan bir xil bo'lsin"
        onClose={() => setModelForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setModelForm(null)}>Bekor qilish</Btn>
            <Btn isDark={isDark} variant="primary" disabled={busy} onClick={saveModel}>
              {busy ? "Saqlanmoqda…" : "Saqlash"}
            </Btn>
          </>
        }
      >
        {modelForm && (
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
            <Field isDark={isDark} label="Provayder">
              <select
                value={modelForm.provider}
                onChange={(e) => setModelForm((f) => ({ ...f, provider: e.target.value }))}
                className={inputCls(isDark)}
              >
                <option value="">Tanlang…</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field isDark={isDark} label="Ko'rsatiladigan nom">
              <input
                value={modelForm.name}
                onChange={(e) => setModelForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls(isDark)}
                placeholder="Llama 3.3 70B"
              />
            </Field>
            <Field isDark={isDark} label="Model ID">
              <input
                value={modelForm.model_id}
                onChange={(e) => setModelForm((f) => ({ ...f, model_id: e.target.value }))}
                className={inputCls(isDark)}
                placeholder="llama-3.3-70b-versatile"
              />
            </Field>
            <Field isDark={isDark} label="Qaysi bo'limlarda">
              <div className="flex flex-wrap gap-2">
                {[{ code: "*", label: "Barchasi" }, ...features].map((f) => {
                  const active = modelForm.features.includes(f.code);
                  return (
                    <button
                      key={f.code}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setModelForm((prev) => ({
                          ...prev,
                          features: active
                            ? prev.features.filter((x) => x !== f.code)
                            : [...prev.features.filter((x) => x !== "*" || f.code === "*"), f.code],
                        }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                          : isDark
                            ? "border-white/15 text-white/60"
                            : "border-black/15 text-black/60"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field isDark={isDark} label="Priority">
                <input
                  type="number"
                  value={modelForm.priority}
                  onChange={(e) => setModelForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Max tokens">
                <input
                  type="number"
                  value={modelForm.max_tokens}
                  onChange={(e) => setModelForm((f) => ({ ...f, max_tokens: Number(e.target.value) }))}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Temperature">
                <input
                  type="number"
                  step="0.1"
                  value={modelForm.temperature}
                  onChange={(e) => setModelForm((f) => ({ ...f, temperature: Number(e.target.value) }))}
                  className={inputCls(isDark)}
                />
              </Field>
            </div>
            <Field isDark={isDark} label="Faol">
              <select
                value={modelForm.enabled ? "1" : "0"}
                onChange={(e) => setModelForm((f) => ({ ...f, enabled: e.target.value === "1" }))}
                className={inputCls(isDark)}
              >
                <option value="1">Ha</option>
                <option value="0">Yo'q</option>
              </select>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
