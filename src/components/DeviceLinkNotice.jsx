import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clearAuth, getDeviceStatus, releaseDevice } from "../utils/api";

/**
 * Login/Register sahifalarida "bir qurilma — bir hisob" holatini ko'rsatadi.
 * Bloklamaydi: bog'langan hisob bilan kirish odatdagidek ishlaydi, boshqa
 * hisob uchun esa bog'lanishni uzish tasdiqlanadi.
 */
export default function DeviceLinkNotice({ mode = "login" }) {
  const [account, setAccount] = useState(null);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [released, setReleased] = useState(false);

  useEffect(() => {
    let alive = true;
    getDeviceStatus()
      .then((data) => {
        if (alive && data?.linked) setAccount(data.account || {});
      })
      .catch(() => {
        /* qurilma ma'lumoti bo'lmasa — odatiy forma */
      });
    return () => {
      alive = false;
    };
  }, []);

  const release = async () => {
    setBusy(true);
    setError("");
    try {
      await releaseDevice();
      clearAuth();
      setAccount(null);
      setAsk(false);
      setReleased(true);
    } catch (err) {
      setError(err.message || "Bog'lanishni uzib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  if (released) {
    return (
      <div role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
        Qurilma bog'lanishi uzildi. Endi boshqa hisob bilan kirishingiz mumkin.
      </div>
    );
  }

  if (!account) return null;

  const name = account.name || "Mavjud hisob";
  const email = account.email_masked ? ` · ${account.email_masked}` : "";

  return (
    <div className="mb-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-sm" aria-hidden="true">
          🔒
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-black/75 dark:text-white/80">
            Bu qurilmada {name}
            {email} hisobi bog'langan
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-black/45 dark:text-white/45">
            Bir qurilmada bitta hisob saqlanadi. Bu hisob bilan kirish odatdagidek
            ishlaydi.
          </p>
          {error && (
            <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-500">
              {error}
            </p>
          )}
          {ask ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={release}
                className="inline-flex min-h-11 items-center rounded-full bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {busy ? "Uzilmoqda…" : "Ha, bog'lanishni uzish"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAsk(false)}
                className="inline-flex min-h-11 items-center rounded-full border border-black/15 px-4 text-xs font-bold text-black/60 dark:border-white/15 dark:text-white/60"
              >
                Bekor qilish
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {mode === "register" ? (
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-contrast)]"
                >
                  Shu hisob bilan kirish
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAccount(null)}
                  className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-contrast)]"
                >
                  Shu hisob bilan kirish
                </button>
              )}
              <button
                type="button"
                onClick={() => setAsk(true)}
                className="inline-flex min-h-11 items-center rounded-full border border-black/15 px-4 text-xs font-bold text-black/60 dark:border-white/15 dark:text-white/60"
              >
                Boshqa hisobga o'tish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
