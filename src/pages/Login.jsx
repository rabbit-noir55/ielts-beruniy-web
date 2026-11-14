import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { googleLogin, login, pollTelegramDevice, setAuth, startTelegramDevice } from "../utils/api";
import { canUseGoogleLogin, isTelegram } from "../utils/telegram.js";

const TG_CODE_KEY = "tg_login_code";
const TG_BOT_KEY = "tg_login_bot";

function Login({ theme = "dark" }) {
  const isDark = theme === "dark";
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const [tgFlow, setTgFlow] = useState(null);
  const [tgStatus, setTgStatus] = useState("idle");
  const [tgError, setTgError] = useState("");

  // WebView/Telegramga o'tib qaytganda kodni tiklab, pollingni davom ettiramiz.
  useEffect(() => {
    const code = sessionStorage.getItem(TG_CODE_KEY);
    const botUrl = sessionStorage.getItem(TG_BOT_KEY);
    if (code && botUrl) {
      setTgFlow({ code, bot_url: botUrl });
      setTgStatus("waiting");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      setAuth(data.token, data.user);
      localStorage.setItem("ielts_registered", "1");
      localStorage.setItem("user_name", data.user.first_name);
      localStorage.setItem("user_surname", data.user.last_name);
      const target = data.user.role === "teacher" && (!from || from === "/") ? "/admin" : from;
      window.location.href = target;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    setGoogleLoading(true);
    try {
      const data = await googleLogin(credential);
      setAuth(data.token, data.user);
      localStorage.setItem("ielts_registered", "1");
      localStorage.setItem("user_name", data.user.first_name);
      localStorage.setItem("user_surname", data.user.last_name);
      const target = data.user.role === "teacher" && (!from || from === "/") ? "/admin" : from;
      window.location.href = target;
    } catch (err) {
      setError(err.message || "Google bilan kirishda xatolik");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google tugmasi kartochka ichiga sig'ishi uchun kenglikni moslaymiz
  const googleButtonWidth = () => {
    const el = googleBtnRef.current;
    const w = el ? Math.floor(el.getBoundingClientRect().width) : 320;
    return Math.max(200, Math.min(320, w || 320));
  };

  const startTelegramLogin = async () => {
    setTgError("");
    setTgStatus("starting");
    try {
      const data = await startTelegramDevice();
      sessionStorage.setItem(TG_CODE_KEY, data.code);
      sessionStorage.setItem(TG_BOT_KEY, data.bot_url);
      setTgFlow(data);
      setTgStatus("waiting");
      try {
        window.open(data.bot_url, "_blank", "noopener,noreferrer");
      } catch {
        /* WebView ochmasa — modalda havola bor */
      }
    } catch (err) {
      setTgStatus("error");
      setTgError(err.message || "Telegram kirishni boshlab bo'lmadi.");
    }
  };

  const finishTelegramLogin = (data) => {
    sessionStorage.removeItem(TG_CODE_KEY);
    sessionStorage.removeItem(TG_BOT_KEY);
    setAuth(data.token, data.user);
    localStorage.setItem("ielts_registered", "1");
    localStorage.setItem("user_name", data.user.first_name || "");
    localStorage.setItem("user_surname", data.user.last_name || "");
    const target =
      data.user.role === "teacher" && (!from || from === "/") ? "/admin" : from;
    window.location.href = target;
  };

  useEffect(() => {
    if (!tgFlow?.code || tgStatus !== "waiting") return;
    let stopped = false;
    let attempts = 0;
    let timer = null;

    const tick = async () => {
      try {
        const data = await pollTelegramDevice(tgFlow.code);
        if (stopped) return;
        if (data?.token) {
          stopped = true;
          finishTelegramLogin(data);
          return;
        }
      } catch (err) {
        if (stopped) return;
        if (err.status === 410 || err.status === 404) {
          sessionStorage.removeItem(TG_CODE_KEY);
          sessionStorage.removeItem(TG_BOT_KEY);
          setTgStatus("expired");
          setTgError(err.message || "Kod muddati tugagan.");
          return;
        }
      }
      attempts += 1;
      if (attempts >= 150) {
        setTgStatus("expired");
        setTgError("Vaqt tugadi. Qayta urinib ko'ring.");
        return;
      }
      timer = setTimeout(tick, 2000);
    };

    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !stopped) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tgFlow?.code, tgStatus]);

  // Google Identity Services initialize
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          width: googleButtonWidth(),
          text: "signin_with",
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handleGoogleCredential(response.credential),
        });
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: isDark ? "filled_black" : "outline",
            size: "large",
            width: googleButtonWidth(),
            text: "signin_with",
          });
        }
      }
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [isDark]);

  const inputCls = `mb-4 w-full rounded-lg border px-4 py-2.5 outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/10 bg-[#0A0A0B] text-[#F5F5F5] focus:ring-white"
      : "border-black/[0.12] bg-[#F6F5F2] text-[#17171A] focus:ring-[var(--accent)]"
  }`;

  return (
    <div
      className={`flex min-h-[calc(100vh-112px)] items-center justify-center px-4 pt-28 ${
        isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-2xl border p-8 shadow-lg backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-[#141416]"
            : "border-black/[0.08] bg-white"
        }`}
      >
        <h1 className="mb-2 text-center text-2xl font-bold">{"Login"}</h1>
        <p className="mb-6 text-center text-sm text-black/40 dark:text-white/40">
          {"Welcome back! Sign in to continue"}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Telegram Login */}
        {!isTelegram() && (
          <div className="mb-4">
            <button
              type="button"
              onClick={startTelegramLogin}
              disabled={tgStatus === "starting" || tgStatus === "waiting"}
              className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-bold transition disabled:opacity-50 ${
                isDark
                  ? "border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  : "border-black/15 bg-black/[0.03] text-black hover:bg-black/[0.06]"
              }`}
            >
              <span aria-hidden="true">✈️</span>
              {tgStatus === "starting" ? "Ulanmoqda…" : "Telegram bilan kirish"}
            </button>
            <p className={`mt-1.5 text-center text-[11px] ${isDark ? "text-white/35" : "text-black/35"}`}>
              Telegramni ochib «Start» bosing — avtomatik kirasiz.
            </p>
          </div>
        )}

        {/* Google Login Button */}
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && canUseGoogleLogin() && (
          <>
            <div className="mb-4">
              <div ref={googleBtnRef} className="flex justify-center"></div>
              {googleLoading && (
                <p className="mt-2 text-center text-xs text-black/40 dark:text-white/40">Google bilan kirilmoqda...</p>
              )}
            </div>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? "border-white/10" : "border-black/10"}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 text-xs ${isDark ? "bg-[#141416] text-white/30" : "bg-white text-black/30"}`}>YOKI</span>
              </div>
            </div>
          </>
        )}

        <label className="mb-1 block text-sm font-medium">{"Email"}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder={"your@email.com"}
          required
        />

        <label className="mb-1 block text-sm font-medium">{"Password"}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder={"Your password"}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-bold text-white transition hover:bg-black disabled:opacity-50 dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] dark:hover:opacity-90"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-black/40 dark:text-white/40">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold underline">
            Register
          </Link>
        </p>
      </form>

      {tgFlow && ["waiting", "expired", "error"].includes(tgStatus) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 text-center shadow-2xl ${
              isDark ? "border-white/10 bg-[#141416] text-white" : "border-black/10 bg-white text-black"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Telegram bilan kirish"
          >
            <h2 className="text-lg font-bold">Telegram bilan kirish</h2>
            {tgStatus === "waiting" ? (
              <>
                <div className="mx-auto my-5 h-9 w-9 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
                <p className={`text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Telegram botda <b>Start</b> tugmasini bosing. Tasdiqlangach bu oyna
                  avtomatik yopiladi.
                </p>
                <a
                  href={tgFlow.bot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)]"
                >
                  Telegramni ochish
                </a>
              </>
            ) : (
              <>
                <p className={`mt-3 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                  {tgError || "Kirish tasdiqlanmadi."}
                </p>
                <button
                  type="button"
                  onClick={startTelegramLogin}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)]"
                >
                  Qayta urinish
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(TG_CODE_KEY);
                sessionStorage.removeItem(TG_BOT_KEY);
                setTgFlow(null);
                setTgStatus("idle");
                setTgError("");
              }}
              className={`mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full border px-5 text-sm font-semibold ${
                isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/60"
              }`}
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
