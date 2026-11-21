import { useEffect, useState } from "react";
import { clearAuth, releaseDevice } from "../utils/api";

/**
 * Bir qurilma — bir hisob. Boshqa hisobga kirishga urinilganda backend 409
 * (`device_linked`) qaytaradi; `request()` `ielts:device-conflict` eventini
 * yuboradi va bu modal tasdiqlash bilan hisobni almashtirishga ruxsat beradi.
 */
export default function DeviceConflictModal() {
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (event) => {
      setConflict(event.detail || {});
      setError("");
    };
    window.addEventListener("ielts:device-conflict", handler);
    return () => window.removeEventListener("ielts:device-conflict", handler);
  }, []);

  if (!conflict) return null;
  const account = conflict.account || {};

  const switchAccount = async () => {
    setBusy(true);
    setError("");
    try {
      await releaseDevice();
      clearAuth();
      window.location.assign("/login");
    } catch (err) {
      setError(err.message || "Hisobni almashtirib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-conflict-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-5 text-[#17171A] shadow-2xl dark:border-white/10 dark:bg-[#141416] dark:text-white">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-lg text-[var(--accent)]">
          🔒
        </div>
        <h2 id="device-conflict-title" className="mt-3 text-lg font-extrabold">
          Bu qurilma boshqa hisobga bog'langan
        </h2>
        <p className="mt-1.5 text-sm text-black/55 dark:text-white/55">
          {account.name || "Mavjud hisob"}
          {account.email_masked ? ` · ${account.email_masked}` : ""} shu
          qurilmada ishlatilmoqda. Bir qurilmada bitta hisob saqlanadi.
        </p>
        <p className="mt-1.5 text-xs text-black/40 dark:text-white/40">
          Boshqa hisobga kirish uchun avval joriy bog'lanishni uzasiz. Hisob
          o'chirilmaydi — keyin qayta kirishingiz mumkin.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setConflict(null)}
            className="inline-flex min-h-11 items-center rounded-full border border-black/15 px-4 text-sm font-bold text-black/65 transition hover:bg-black/[0.04] dark:border-white/15 dark:text-white/65 dark:hover:bg-white/5"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={switchAccount}
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Kutilmoqda…" : "Boshqa hisobga o'tish"}
          </button>
        </div>
      </div>
    </div>
  );
}
