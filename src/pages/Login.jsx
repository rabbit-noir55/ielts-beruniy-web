import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { login, googleLogin, setAuth } from "../utils/api";
import { canUseGoogleLogin } from "../utils/telegram.js";

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
      window.location.href = from;
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
      window.location.href = from;
    } catch (err) {
      setError(err.message || "Google bilan kirishda xatolik");
    } finally {
      setGoogleLoading(false);
    }
  };

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
          width: 320,
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
            width: 320,
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
    </div>
  );
}

export default Login;
