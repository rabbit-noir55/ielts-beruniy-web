import { useState } from "react";
import {
  changePassword,
  clearAuth,
  clearBackgroundImage,
  clearPendingResults,
  getBackgroundImage,
  getSettings,
  getUser,
  isAuthenticated,
  setBackgroundImage,
  setSettings,
  updateProfile,
} from "../utils/api";

const THEMES = [
  { id: "graphite", label: "Graphite", emoji: "🪨", swatch: "#17171A", darkSwatch: "#FFFFFF" },
  { id: "ocean", label: "Ocean", emoji: "🌊", swatch: "#2563EB", darkSwatch: "#60A5FA" },
  { id: "forest", label: "Forest", emoji: "🌲", swatch: "#15803D", darkSwatch: "#4ADE80" },
  { id: "sunset", label: "Sunset", emoji: "🌅", swatch: "#EA580C", darkSwatch: "#FB923C" },
  { id: "violet", label: "Violet", emoji: "💜", swatch: "#7C3AED", darkSwatch: "#A78BFA" },
  { id: "crimson", label: "Crimson", emoji: "🔴", swatch: "#DC2626", darkSwatch: "#F87171" },
  { id: "teal", label: "Teal", emoji: "🩵", swatch: "#0D9488", darkSwatch: "#2DD4BF" },
  { id: "gold", label: "Gold", emoji: "⭐", swatch: "#CA8A04", darkSwatch: "#FACC15" },
  { id: "indigo", label: "Indigo", emoji: "💎", swatch: "#4F46E5", darkSwatch: "#818CF8" },
];

const PRESETS = [
  { id: "minimalist", label: "Minimalist", emoji: "🪨", accent: "graphite", radius: "sharp", font: "inter" },
  { id: "ocean-breeze", label: "Ocean Breeze", emoji: "🌊", accent: "ocean", radius: "round", font: "inter" },
  { id: "forest-walk", label: "Forest Walk", emoji: "🌲", accent: "forest", radius: "normal", font: "noto-serif" },
  { id: "sunset-vibes", label: "Sunset Vibes", emoji: "🌅", accent: "sunset", radius: "round", font: "inter" },
  { id: "violet-dream", label: "Violet Dream", emoji: "💜", accent: "violet", radius: "round", font: "inter" },
  { id: "crimson-bold", label: "Crimson Bold", emoji: "🔴", accent: "crimson", radius: "normal", font: "inter" },
  { id: "teal-calm", label: "Teal Calm", emoji: "🩵", accent: "teal", radius: "round", font: "noto-serif" },
  { id: "gold-premium", label: "Gold Premium", emoji: "⭐", accent: "gold", radius: "sharp", font: "jetbrains" },
  { id: "indigo-pro", label: "Indigo Pro", emoji: "💎", accent: "indigo", radius: "normal", font: "inter" },
];

const RADIUS_OPTIONS = [
  { id: "sharp", label: "Sharp", icon: "⬜", desc: "0px" },
  { id: "normal", label: "Normal", icon: "🔲", desc: "12px" },
  { id: "round", label: "Round", icon: "⬛", desc: "20px" },
];

const FONT_OPTIONS = [
  { id: "inter", label: "Inter", desc: "Zamonaviy, tiniq", sample: "Aa" },
  { id: "jetbrains", label: "JetBrains Mono", desc: "Kod uslubi", sample: "Aa" },
  { id: "noto-serif", label: "Noto Serif", desc: "Kitob uslubi", sample: "Aa" },
];

function Kicker({ children }) {
  return (
    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/[0.12] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/50 dark:border-white/15 dark:text-white/50">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {children}
    </span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        checked ? "bg-[var(--accent)]" : "bg-black/15 dark:bg-white/15"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full shadow transition-all ${
          checked
            ? "left-6 bg-[var(--accent-contrast)]"
            : "left-1 bg-white dark:bg-white/70"
        }`}
      />
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <Kicker>{title}</Kicker>
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 dark:border-white/10 dark:bg-[#141416]">
        {children}
      </div>
    </section>
  );
}

function Row({ title, desc, isDark, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-semibold text-black/80 dark:text-white/80">{title}</div>
        {desc && (
          <div className={`mt-0.5 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>{desc}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Notice({ type, text }) {
  if (!text) return null;
  return (
    <div
      className={`mb-4 rounded-xl border p-3 text-sm ${
        type === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-500"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {text}
    </div>
  );
}

const inputCls = (isDark) =>
  `mb-4 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/30 focus:ring-white"
      : "border-black/[0.12] bg-[#F6F5F2] text-black placeholder:text-black/30 focus:ring-black"
  }`;

const submitBtnCls =
  "rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-40 dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] dark:hover:opacity-90";

export default function Settings({ theme, toggleTheme, themeId, setThemeId, radius, setRadius, font, setFont }) {
  const isDark = theme === "dark";
  const [authed] = useState(() => isAuthenticated());
  const user = getUser();

  // Preview state — o'zgarishlar avtomatik ko'rinadi
  const [previewTheme, setPreviewTheme] = useState(themeId);
  const [previewRadius, setPreviewRadius] = useState(radius);
  const [previewFont, setPreviewFont] = useState(font);
  const [hasChanges, setHasChanges] = useState(false);

  const [settings, setSettingsState] = useState(() => getSettings());
  const [name, setName] = useState(user?.first_name || "");
  const [surname, setSurname] = useState(user?.last_name || "");
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [profileBusy, setProfileBusy] = useState(false);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [pwBusy, setPwBusy] = useState(false);

  const [bgImage, setBgImage] = useState(() => getBackgroundImage());

  const update = (patch) => {
    const s = setSettings(patch);
    setSettingsState(s);
  };

  // Preview — avtomatik DOM'ga qo'llash
  const applyPreview = (t, r, f) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.setAttribute("data-radius", r);
    document.documentElement.setAttribute("data-font", f);
  };

  const setPreviewAndApply = (key, value) => {
    const newTheme = key === "theme" ? value : previewTheme;
    const newRadius = key === "radius" ? value : previewRadius;
    const newFont = key === "font" ? value : previewFont;

    if (key === "theme") setPreviewTheme(value);
    if (key === "radius") setPreviewRadius(value);
    if (key === "font") setPreviewFont(value);

    applyPreview(newTheme, newRadius, newFont);
    setHasChanges(newTheme !== themeId || newRadius !== radius || newFont !== font);
  };

  // Saqlash
  const saveCustomize = () => {
    setThemeId(previewTheme);
    setRadius(previewRadius);
    setFont(previewFont);
    setHasChanges(false);
  };

  // Bekor qilish
  const cancelCustomize = () => {
    setPreviewTheme(themeId);
    setPreviewRadius(radius);
    setPreviewFont(font);
    applyPreview(themeId, radius, font);
    setHasChanges(false);
  };

  // Preset tanlash
  const applyPreset = (preset) => {
    setPreviewTheme(preset.accent);
    setPreviewRadius(preset.radius);
    setPreviewFont(preset.font);
    applyPreview(preset.accent, preset.radius, preset.font);
    setHasChanges(preset.accent !== themeId || preset.radius !== radius || preset.font !== font);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setProfileBusy(true);
    try {
      const updated = await updateProfile({ first_name: name.trim(), last_name: surname.trim() });
      localStorage.setItem("user_name", updated.first_name);
      localStorage.setItem("user_surname", updated.last_name);
      setProfileMsg({ type: "ok", text: "Profile saved successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (newPw.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw("");
      setNewPw("");
      setPwMsg({ type: "ok", text: "Password changed successfully." });
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwBusy(false);
    }
  };

  const clearLocalData = () => {
    clearPendingResults();
    clearBackgroundImage();
    localStorage.removeItem("ielts_registered");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_surname");
    if (authed) {
      clearAuth();
      window.location.href = "/login";
    } else {
      window.location.reload();
    }
  };

  const onPickBackground = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setBackgroundImage(dataUrl);
      setBgImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeBackground = () => {
    clearBackgroundImage();
    setBgImage("");
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <Kicker>Customize</Kicker>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Customize</h1>
        <p className={`mt-2 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
          Saytning ko'rinishini o'zgartiring.
        </p>
      </div>

      {/* Preset Themes */}
      <Section title="Preset Themes">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PRESETS.map((p) => {
            const active = previewTheme === p.accent && previewRadius === p.radius && previewFont === p.font;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : isDark
                      ? "border-white/10 bg-[#0A0A0B] text-white/60 hover:border-white/25"
                      : "border-black/[0.12] bg-[#F6F5F2] text-black/60 hover:border-black/30"
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-[10px] leading-tight">{p.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Accent Rang */}
      <Section title="Accent Rang">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {THEMES.map((t) => {
            const active = previewTheme === t.id;
            const swatch = isDark ? t.darkSwatch : t.swatch;
            return (
              <button
                key={t.id}
                onClick={() => setPreviewAndApply("theme", t.id)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : isDark
                      ? "border-white/10 bg-[#0A0A0B] text-white/60 hover:border-white/25"
                      : "border-black/[0.12] bg-[#F6F5F2] text-black/60 hover:border-black/30"
                }`}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: swatch }}
                />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.emoji}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Qirra Radiusi */}
      <Section title="Qirra Radiusi">
        <div className="grid grid-cols-3 gap-2">
          {RADIUS_OPTIONS.map((r) => {
            const active = previewRadius === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setPreviewAndApply("radius", r.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : isDark
                      ? "border-white/10 bg-[#0A0A0B] text-white/60 hover:border-white/25"
                      : "border-black/[0.12] bg-[#F6F5F2] text-black/60 hover:border-black/30"
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <span>{r.label}</span>
                <span className={`text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>{r.desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Font Family */}
      <Section title="Font Family">
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((f) => {
            const active = previewFont === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setPreviewAndApply("font", f.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : isDark
                      ? "border-white/10 bg-[#0A0A0B] text-white/60 hover:border-white/25"
                      : "border-black/[0.12] bg-[#F6F5F2] text-black/60 hover:border-black/30"
                }`}
              >
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: f.id === "jetbrains" ? "var(--font-mono)" : f.id === "noto-serif" ? "var(--font-serif)" : "var(--font-sans)"
                  }}
                >
                  {f.sample}
                </span>
                <span className="text-xs">{f.label}</span>
                <span className={`text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>{f.desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Save/Cancel */}
      {hasChanges && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
          <button onClick={saveCustomize} className={submitBtnCls}>
            Saqlash
          </button>
          <button
            onClick={cancelCustomize}
            className={`rounded-full border px-6 py-2.5 text-sm font-bold transition-colors ${
              isDark
                ? "border-white/20 text-white/60 hover:bg-white/5"
                : "border-black/20 text-black/60 hover:bg-black/5"
            }`}
          >
            Bekor qilish
          </button>
        </div>
      )}

      {/* Dark Mode */}
      <Section title="Appearance">
        <Row title="Dark mode" desc="Toggle between light and dark mode">
          <Toggle checked={isDark} onChange={toggleTheme} />
        </Row>
      </Section>

      {/* Background */}
      <Section title="Background">
        <Row
          title="Custom background image"
          desc="Set a background picture behind the whole app."
        />
        <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/*"
            onChange={onPickBackground}
            className={`block w-full cursor-pointer text-xs file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white file:dark:text-[var(--accent-contrast)] sm:w-auto ${
              isDark ? "text-white/70" : "text-black/60"
            }`}
          />
          {bgImage ? (
            <button
              onClick={removeBackground}
              className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/10"
            >
              Remove background
            </button>
          ) : (
            <span className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
              No background image set.
            </span>
          )}
        </div>
        {bgImage && (
          <div className="mt-4 overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/10">
            <img src={bgImage} alt="Background preview" className="h-32 w-full object-cover" />
          </div>
        )}
      </Section>

      {/* Data */}
      <Section title="Data">
        <Row
          title="Auto-save results to server"
          desc="Upload test results to your account automatically"
        >
          <Toggle
            checked={settings.autoSync}
            onChange={(v) => update({ autoSync: v })}
          />
        </Row>
        <div className="mt-3 border-t border-black/[0.08] pt-4 dark:border-white/10">
          <button
            onClick={clearLocalData}
            className="rounded-full border border-red-500/40 px-6 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/10"
          >
            Clear local data
          </button>
          <p className={`mt-2 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
            Remove test results and account data stored on this device.
          </p>
        </div>
      </Section>

      {authed && (
        <>
          <Section title="Profile">
            <Notice type={profileMsg.type} text={profileMsg.text} />
            <form onSubmit={saveProfile}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className={inputCls(isDark)}
              />
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Surname"
                className={inputCls(isDark)}
              />
              <button type="submit" disabled={profileBusy} className={submitBtnCls}>
                {profileBusy ? "Saving..." : "Save profile"}
              </button>
            </form>
          </Section>

          <Section title="Security">
            <Notice type={pwMsg.type} text={pwMsg.text} />
            <form onSubmit={savePassword}>
              <input
                type="password"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                placeholder="Current password"
                className={inputCls(isDark)}
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 6 characters)"
                className={inputCls(isDark)}
              />
              <button type="submit" disabled={pwBusy} className={submitBtnCls}>
                {pwBusy ? "Saving..." : "Change password"}
              </button>
            </form>
          </Section>
        </>
      )}
    </div>
  );
}
