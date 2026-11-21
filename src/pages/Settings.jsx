import { useEffect, useRef, useState } from "react";
import {
  changePassword,
  clearAuth,
  clearBackgroundImage,
  clearPendingResults,
  getBackgroundImage,
  getDeviceStatus,
  getSettings,
  getTelegramStatus,
  getUser,
  isAuthenticated,
  refreshUser,
  releaseDevice,
  saveTelegramContact,
  setBackgroundImage,
  setPin,
  setSettings,
  updateProfile,
} from "../utils/api";
import {
  biometricErrorMessage,
  isBiometricAvailable,
  registerBiometricDevice,
  removeBiometricDevice,
} from "../utils/webauthn";
import { restartOnboarding } from "../utils/onboarding";
import {
  Database,
  Fingerprint,
  KeyRound,
  LifeBuoy,
  Palette,
  Send,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { isInApp, isTelegram } from "../utils/telegram.js";
import { getDeviceId, getPlatform } from "../utils/deviceIdentity";

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

const SECTION_SLUGS = {
  "Telegram bog'lash": "telegram",
  "Preset Themes": "preset-themes",
};

const SECTION_ICONS = {
  Profile: User,
  Security: ShieldCheck,
  Qurilma: Smartphone,
  "Examiner PIN": KeyRound,
  "Biometrik tasdiqlash": Fingerprint,
  "Telegram bog'lash": Send,
  "Preset Themes": Palette,
  "Accent Rang": Palette,
  "Qirra Radiusi": Palette,
  "Font Family": Palette,
  Data: Database,
  Yordam: LifeBuoy,
};

function Kicker({ children, icon: Icon }) {
  return (
    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/[0.12] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black/50 dark:border-white/15 dark:text-white/50">
      {Icon ? (
        <Icon size={11} className="opacity-70" aria-hidden="true" />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

function SettingsHero({ user, isDark }) {
  const name =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "Mehmon";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-black text-[var(--accent-contrast)]">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold">{name}</div>
          <div className={`truncate text-[11px] ${isDark ? "text-white/40" : "text-black/40"}`}>
            {user?.email || "Hisobga kiring"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {user?.role && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isDark ? "bg-white/[0.07] text-white/55" : "bg-black/[0.05] text-black/50"}`}>
            {user.role === "teacher" ? "Ustoz" : "O'quvchi"}
          </span>
        )}
        {user?.group_detail?.name && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${isDark ? "bg-white/[0.07] text-white/55" : "bg-black/[0.05] text-black/50"}`}>
            {user.group_detail.name}
          </span>
        )}
        {user?.is_examiner && (
          <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--accent)]">
            Examiner
          </span>
        )}
      </div>
    </div>
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

function Section({ title, children, id }) {
  const slug =
    id ||
    SECTION_SLUGS[title] ||
    String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const Icon = SECTION_ICONS[title];
  return (
    <section id={`settings-${slug}`} className="mb-6 scroll-mt-28">
      <Kicker icon={Icon}>{title}</Kicker>
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#141416]">
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
  // Joriy parolni bilmaydigan (eski Google) foydalanuvchi uchun tasdiqlash.
  const [showGoogleVerify, setShowGoogleVerify] = useState(false);
  const [googleCredential, setGoogleCredential] = useState("");
  const googleBtnRef = useRef(null);

  const [pinValue, setPinValue] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMsg, setPinMsg] = useState({ type: "", text: "" });
  const [hasPin, setHasPin] = useState(Boolean(getUser()?.has_pin));

  const [bioSupported, setBioSupported] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(Boolean(user?.has_biometric));
  const [bioBusy, setBioBusy] = useState(false);
  const [bioMsg, setBioMsg] = useState({ type: "", text: "" });

  const [bgImage, setBgImage] = useState(() => getBackgroundImage());

  // Qurilma (bir qurilma — bir hisob)
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [deviceAsk, setDeviceAsk] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [deviceMsg, setDeviceMsg] = useState({ type: "", text: "" });

  // Telegram bog'lash
  const [tgStatus, setTgStatus] = useState(null);
  const [tgPhone, setTgPhone] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [tgMsg, setTgMsg] = useState({ type: "", text: "" });
  const [tgBusy, setTgBusy] = useState(false);

  useEffect(() => {
    if (!authed) return;
    getTelegramStatus()
      .then((data) => {
        setTgStatus(data);
        setTgPhone(data.telegram_phone || "");
        setTgUsername(data.telegram_username || "");
      })
      .catch(() => {});
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    isBiometricAvailable()
      .then(setBioSupported)
      .catch(() => setBioSupported(false));
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    getDeviceStatus()
      .then(setDeviceStatus)
      .catch(() => {});
  }, [authed]);

  const switchDeviceAccount = async () => {
    setDeviceBusy(true);
    setDeviceMsg({ type: "", text: "" });
    try {
      await releaseDevice();
      clearAuth();
      window.location.href = "/login";
    } catch (err) {
      setDeviceMsg({
        type: "error",
        text: err.message || "Qurilma bog'lanishini uzib bo'lmadi.",
      });
      setDeviceBusy(false);
    }
  };

  // Joriy parolni bilmaydigan (eski Google) foydalanuvchi Google hisobi
  // bilan tasdiqlab, yangi parol o'rnatadi.
  useEffect(() => {
    if (!showGoogleVerify) return;
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID || window.__VITE_GOOGLE_CLIENT_ID__;
    if (!clientId) return;
    let cancelled = false;

    const init = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (cancelled) return;
          setGoogleCredential(response.credential);
          setShowGoogleVerify(false);
          setPwMsg({
            type: "ok",
            text: "Google tasdiqlandi. Endi yangi parolni saqlang.",
          });
        },
      });
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      }
    };

    if (window.google?.accounts?.id) {
      init();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [showGoogleVerify, isDark]);

  const saveTelegram = async (e) => {
    e.preventDefault();
    setTgBusy(true);
    setTgMsg({ type: "", text: "" });
    try {
      const data = await saveTelegramContact({ phone: tgPhone, username: tgUsername });
      setTgStatus((prev) => ({ ...(prev || {}), ...data }));
      setTgMsg({ type: "success", text: data.instructions || "Saqlandi." });
    } catch (err) {
      setTgMsg({ type: "error", text: err.message || "Saqlab bo'lmadi." });
    } finally {
      setTgBusy(false);
    }
  };

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
      await changePassword(oldPw, newPw, googleCredential || undefined);
      setOldPw("");
      setNewPw("");
      setGoogleCredential("");
      setShowGoogleVerify(false);
      setPwMsg({ type: "ok", text: "Password changed successfully." });
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwBusy(false);
    }
  };

  const savePin = async (e) => {
    e.preventDefault();
    setPinMsg({ type: "", text: "" });
    if (!/^\d{4}$/.test(pinValue)) {
      setPinMsg({ type: "error", text: "PIN 4 xonali son bo'lishi kerak." });
      return;
    }
    if (hasPin && !/^\d{4}$/.test(oldPin)) {
      setPinMsg({ type: "error", text: "Joriy PINni kiriting." });
      return;
    }
    setPinBusy(true);
    try {
      await setPin(pinValue, hasPin ? oldPin : undefined);
      setHasPin(true);
      setPinValue("");
      setOldPin("");
      setPinMsg({ type: "ok", text: "PIN saqlandi." });
    } catch (err) {
      setPinMsg({ type: "error", text: err.message || "PIN saqlab bo'lmadi." });
    } finally {
      setPinBusy(false);
    }
  };

  const enableBiometric = async () => {
    setBioBusy(true);
    setBioMsg({ type: "", text: "" });
    try {
      await registerBiometricDevice();
      setHasBiometric(true);
      await refreshUser();
      setBioMsg({ type: "ok", text: "Biometrik tasdiqlash yoqildi." });
    } catch (err) {
      setBioMsg({ type: "error", text: biometricErrorMessage(err) });
    } finally {
      setBioBusy(false);
    }
  };

  const disableBiometric = async () => {
    setBioBusy(true);
    setBioMsg({ type: "", text: "" });
    try {
      await removeBiometricDevice();
      setHasBiometric(false);
      await refreshUser();
      setBioMsg({ type: "ok", text: "Biometrik tasdiqlash o'chirildi." });
    } catch (err) {
      setBioMsg({ type: "error", text: err.message || "O'chirib bo'lmadi." });
    } finally {
      setBioBusy(false);
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

  const scrollToSection = (id) => {
    document
      .getElementById(`settings-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    { id: "preset-themes", label: "Ko'rinish", icon: Palette },
    { id: "profile", label: "Profil", icon: User },
    { id: "security", label: "Xavfsizlik", icon: ShieldCheck },
    { id: "qurilma", label: "Qurilma", icon: Smartphone },
    ...(user?.is_examiner
      ? [
          { id: "examiner-pin", label: "Examiner PIN", icon: KeyRound },
          { id: "biometrik-tasdiqlash", label: "Biometrika", icon: Fingerprint },
        ]
      : []),
    ...(authed && !isTelegram() && !isInApp()
      ? [{ id: "telegram", label: "Telegram", icon: Send }]
      : []),
    { id: "data", label: "Ma'lumot", icon: Database },
    { id: "yordam", label: "Yordam", icon: LifeBuoy },
  ];

  return (
    <div className="px-4 pb-16 pt-24">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <SettingsHero user={user} isDark={isDark} />
            <nav className="flex flex-col gap-0.5" aria-label="Sozlamalar bo'limlari">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-left text-xs font-bold transition ${
                      isDark
                        ? "text-white/55 hover:bg-white/[0.05] hover:text-white"
                        : "text-black/55 hover:bg-black/[0.04] hover:text-black"
                    }`}
                  >
                    <Icon size={14} className="opacity-60" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sozlamalar</h1>
            <p className={`mt-1 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
              Ko'rinish, hisob va xavfsizlik — barchasi bir joyda.
            </p>
          </div>

          <div className="mb-5 lg:hidden">
            <SettingsHero user={user} isDark={isDark} />
          </div>
          <nav
            className="mb-5 flex gap-1.5 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Sozlamalar bo'limlari"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  isDark
                    ? "bg-white/[0.06] text-white/55 hover:bg-white/[0.1]"
                    : "bg-black/[0.05] text-black/55 hover:bg-black/[0.08]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

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

      {/* Telegram */}
      {authed && !isTelegram() && !isInApp() && (
        <Section title="Telegram">
          <Notice type={tgMsg.type} text={tgMsg.text} />
          <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/[0.08] bg-white"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Telegram bog'lash</div>
                <div className={`mt-0.5 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                  {tgStatus?.linked
                    ? `Ulangan${tgStatus.telegram_username ? `: @${tgStatus.telegram_username}` : ""}`
                    : "Raqam yoki username kiriting, keyin botda /start bosing."}
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                tgStatus?.linked
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isDark ? "border-white/15 text-white/50" : "border-black/15 text-black/50"
              }`}>
                {tgStatus?.linked ? "✓ Ulangan" : "Ulanmagan"}
              </span>
            </div>

            {!tgStatus?.linked && (
              <form onSubmit={saveTelegram} className="mt-3 flex flex-col gap-3">
                <input
                  type="tel"
                  value={tgPhone}
                  onChange={(e) => setTgPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  aria-label="Telegram telefon raqami"
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:border-white/10 dark:bg-[#0A0A0B] dark:text-white dark:focus:ring-white"
                />
                <input
                  type="text"
                  value={tgUsername}
                  onChange={(e) => setTgUsername(e.target.value)}
                  placeholder="@telegram_username (ixtiyoriy)"
                  aria-label="Telegram username"
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:border-white/10 dark:bg-[#0A0A0B] dark:text-white dark:focus:ring-white"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={tgBusy} className={submitBtnCls}>
                    {tgBusy ? "Saqlanmoqda…" : "Saqlash"}
                  </button>
                  <a
                    href={tgStatus?.bot_url || import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/ielts_beruniy_bot"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-bold ${
                      isDark ? "border-white/15 text-white/75" : "border-black/15 text-black/70"
                    }`}
                  >
                    Botni ochish
                  </a>
                </div>
              </form>
            )}

            {tgStatus?.linked && (
              <a
                href={tgStatus?.bot_url || import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/ielts_beruniy_bot"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white"
              >
                Botni ochish
              </a>
            )}
          </div>
        </Section>
      )}

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
                placeholder="Joriy parol (bo'lmasa bo'sh qoldiring)"
                className={inputCls(isDark)}
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Yangi parol (kamida 6 belgi)"
                className={inputCls(isDark)}
              />
              <p className={`mb-3 text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                Telegram orqali kirgan bo'lsangiz parolingiz yo'q — joriy parolni bo'sh qoldiring.
                Joriy parolni bilmasangiz, Google hisobingiz bilan tasdiqlang.
              </p>
              {googleCredential ? (
                <p className="mb-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Google tasdiqlandi
                </p>
              ) : showGoogleVerify ? (
                <div className="mb-3">
                  <div ref={googleBtnRef} className="flex justify-center"></div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPwMsg({ type: "", text: "" });
                    setShowGoogleVerify(true);
                  }}
                  className="mb-4 block text-left text-xs font-bold underline opacity-70 transition hover:opacity-100"
                >
                  Joriy parolni bilmayman — Google bilan tasdiqlash
                </button>
              )}
              <button type="submit" disabled={pwBusy} className={submitBtnCls}>
                {pwBusy ? "Saqlanmoqda…" : "Parolni o'rnatish"}
              </button>
            </form>
          </Section>

          <Section title="Qurilma">
            <Notice type={deviceMsg.type} text={deviceMsg.text} />
            <p className={`mb-3 text-xs leading-relaxed ${isDark ? "text-white/40" : "text-black/40"}`}>
              Bir qurilmada bitta hisob saqlanadi — bu hisoblarning qayta-qayta
              yaratilishini oldini oladi. Chiqish qilganingizda bog'lanish
              saqlanadi. Boshqa hisobga o'tish uchun avval shu qurilma
              bog'lanishini uzasiz.
            </p>
            {(() => {
              const platform = deviceStatus?.platform || getPlatform();
              const platformLabel =
                platform === "android"
                  ? "Android ilova"
                  : platform === "telegram"
                    ? "Telegram Mini App"
                    : "Brauzer";
              const deviceId = getDeviceId();
              const account = deviceStatus?.account;
              return (
                <>
                  <div className={`divide-y ${isDark ? "divide-white/8" : "divide-black/[0.06]"}`}>
                    <Row title="Platforma" desc="Qurilma turi" isDark={isDark}>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          isDark ? "bg-white/[0.07] text-white/60" : "bg-black/[0.05] text-black/55"
                        }`}
                      >
                        {platformLabel}
                      </span>
                    </Row>
                    <Row title="Qurilma ID" desc="Brauzer va ilova uchun bir xil" isDark={isDark}>
                      <code
                        title={deviceId}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                          isDark ? "bg-white/[0.06] text-white/55" : "bg-black/[0.04] text-black/55"
                        }`}
                      >
                        {deviceId.slice(0, 8)}…
                      </code>
                    </Row>
                    <Row title="Bog'langan hisob" desc="Hozir shu qurilmaga biriktirilgan" isDark={isDark}>
                      <span className="max-w-[55%] truncate text-right text-xs font-semibold">
                        {deviceStatus == null
                          ? "Tekshirilmoqda…"
                          : account
                            ? `${account.name || "Hisob"}${account.email_masked ? ` · ${account.email_masked}` : ""}`
                            : "Bog'lanmagan"}
                      </span>
                    </Row>
                  </div>
                  <div className="mt-4">
                    {deviceAsk ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={deviceBusy}
                          onClick={switchDeviceAccount}
                          className="inline-flex min-h-11 items-center rounded-full bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                          {deviceBusy ? "Uzilmoqda…" : "Ha, uzish va chiqish"}
                        </button>
                        <button
                          type="button"
                          disabled={deviceBusy}
                          onClick={() => setDeviceAsk(false)}
                          className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-bold ${
                            isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/60"
                          }`}
                        >
                          Bekor qilish
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeviceAsk(true)}
                        className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-bold transition ${
                          isDark
                            ? "border-white/15 text-white/65 hover:bg-white/5"
                            : "border-black/15 text-black/65 hover:bg-black/[0.04]"
                        }`}
                      >
                        Hisobni almashtirish
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </Section>

          {user?.is_examiner && (
          <Section title="Examiner PIN">
            <Notice type={pinMsg.type} text={pinMsg.text} />
            <Row title="4 xonali PIN" desc="Har baho qo'yishda tasdiqlash uchun. Faqat raqamlar.">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                  hasPin
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isDark
                      ? "border-white/15 text-white/50"
                      : "border-black/15 text-black/50"
                }`}
              >
                {hasPin ? "✓ O'rnatilgan" : "O'rnatilmagan"}
              </span>
            </Row>
            <form onSubmit={savePin} className="mt-3">
              {hasPin && (
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Joriy PIN"
                  className={inputCls(isDark)}
                />
              )}
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Yangi 4 xonali PIN"
                className={inputCls(isDark)}
              />
              <button type="submit" disabled={pinBusy} className={submitBtnCls}>
                {pinBusy ? "Saqlanmoqda…" : hasPin ? "PINni yangilash" : "PIN o'rnatish"}
              </button>
            </form>
          </Section>
          )}

          {user?.is_examiner && (
          <Section title="Biometrik tasdiqlash">
            <Notice type={bioMsg.type} text={bioMsg.text} />
            <Row
              title="Qurilma biometrikasi"
              desc="Barmoq izi, yuz yoki Windows Hello. PIN o'rniga ishlatiladi."
            >
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                  hasBiometric
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isDark
                      ? "border-white/15 text-white/50"
                      : "border-black/15 text-black/50"
                }`}
              >
                {hasBiometric ? "✓ Ulangan" : "Ulanmagan"}
              </span>
            </Row>
            {!bioSupported ? (
              <p
                className={`mt-3 text-xs ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                Bu qurilma yoki brauzer biometrik tasdiqlashni qo'llab-quvvatlamaydi — PIN ishlatiladi.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={enableBiometric}
                  disabled={bioBusy}
                  className={submitBtnCls}
                >
                  {bioBusy
                    ? "Kutilmoqda…"
                    : hasBiometric
                      ? "Qayta ulash"
                      : "Biometrikani yoqish"}
                </button>
                {hasBiometric && (
                  <button
                    type="button"
                    onClick={disableBiometric}
                    disabled={bioBusy}
                    className="rounded-full border border-red-500/40 px-5 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-500/10 disabled:opacity-40"
                  >
                    O'chirish
                  </button>
                )}
              </div>
            )}
          </Section>
          )}
          <Section title="Yordam">
            <Row
              title="Sayt qo'llanmasi"
              desc="Asosiy bo'limlar va tugmalar bo'yicha qisqa tur."
            >
              <button
                type="button"
                onClick={() => restartOnboarding()}
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--accent)]/40 px-4 text-sm font-bold text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
              >
                Qo'llanmani ko'rish
              </button>
            </Row>
          </Section>
        </>
      )}
        </div>
      </div>
    </div>
  );
}
