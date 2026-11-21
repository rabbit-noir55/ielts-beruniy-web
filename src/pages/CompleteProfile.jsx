import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { completeName, getUser, saveUser } from "../utils/api";
import logoSvg from "../assets/logo.png";

/**
 * Telegram orqali kelgan hisoblar uchun majburiy qadam: Telegram profilidagi
 * ism ko'pincha ishonchsiz bo'lgani uchun to'liq ism-familiya tasdiqlanadi.
 */
export default function CompleteProfile({ theme = "light" }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.needs_name) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    if (first.length < 2 || last.length < 2) {
      setError("Ism va familiyani to'liq kiriting (kamida 2 ta harf).");
      return;
    }
    if (/\d/.test(first) || /\d/.test(last)) {
      setError("Ism-familiyada raqam bo'lmasligi kerak.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fresh = await completeName(first, last);
      saveUser(fresh);
      localStorage.setItem("user_name", fresh.first_name || "");
      localStorage.setItem("user_surname", fresh.last_name || "");
      const from = location.state?.from?.pathname;
      const target = from || (fresh.role === "teacher" ? "/admin" : "/");
      navigate(target, { replace: true });
    } catch (err) {
      const data = err.data || {};
      setError(
        data.first_name || data.last_name || err.message || "Saqlab bo'lmadi."
      );
    } finally {
      setBusy(false);
    }
  };

  const inputCls = `mb-4 w-full rounded-lg border px-4 py-2.5 outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/10 bg-[#0A0A0B] text-[#F5F5F5] focus:ring-white"
      : "border-black/[0.12] bg-[#F6F5F2] text-[#17171A] focus:ring-[var(--accent)]"
  }`;

  return (
    <div
      className={`relative flex min-h-[calc(100vh-112px)] items-center justify-center overflow-hidden px-4 pb-10 pt-24 ${
        isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      </div>

      <form
        onSubmit={submit}
        className={`relative w-full max-w-md rounded-3xl border p-8 shadow-xl backdrop-blur-xl ${
          isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
        }`}
      >
        <div className="mb-5 flex justify-center">
          <img
            src={logoSvg}
            alt="IELTS Beruniy"
            className="h-14 dark:brightness-0 dark:invert"
          />
        </div>
        <h1 className="text-center text-2xl font-extrabold">Ism va familiya</h1>
        <p className="mt-1.5 text-center text-sm text-black/45 dark:text-white/45">
          Telegram profilingizdagi ism o'zgartirilishi mumkin, shuning uchun
          ustoz sizni to'g'ri tanashi uchun to'liq ism-familiyani yozing.
        </p>
        {user.telegram_username && (
          <p className="mt-2 text-center text-[11px] text-black/35 dark:text-white/35">
            Telegram: @{user.telegram_username}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-500"
          >
            {error}
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="complete-first-name" className="mb-1 block text-sm font-medium">
            Ism
          </label>
          <input
            id="complete-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputCls}
            placeholder="Masalan: Aziz"
            autoComplete="given-name"
            maxLength={150}
            required
          />
          <label htmlFor="complete-last-name" className="mb-1 block text-sm font-medium">
            Familiya
          </label>
          <input
            id="complete-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputCls}
            placeholder="Masalan: Karimov"
            autoComplete="family-name"
            maxLength={150}
            required
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saqlanmoqda…" : "Saqlash va davom etish"}
        </button>
        <p className="mt-3 text-center text-[11px] text-black/35 dark:text-white/35">
          Bu ma'lumot faqat ustoz va saytdagi profilingiz uchun ishlatiladi.
        </p>
      </form>
    </div>
  );
}
