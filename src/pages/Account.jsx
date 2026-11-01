import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAllResults } from "../utils/ieltsBand";
import { clearAuth, getUser, isAuthenticated } from "../utils/api";

const skillColor = (band) => {
  if (band == null) return "text-black/30 dark:text-white/30";
  if (band >= 7) return "text-green-600 dark:text-green-400";
  if (band >= 5.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

function Account({ theme = "dark" }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [authed] = useState(() => isAuthenticated());

  const name = localStorage.getItem("user_name") || "";
  const surname = localStorage.getItem("user_surname") || "";
  const user = getUser();
  const results = useMemo(() => loadAllResults(), []);

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("ielts_registered");
    navigate("/login");
  };

  return (
    <div className={`min-h-[calc(100vh-112px)] pt-28 ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <div className={`mb-8 rounded-2xl border p-6 backdrop-blur-xl ${isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"}`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${isDark ? "bg-white/10 text-[#F5F5F5]" : "bg-black/[0.06] text-[#17171A]"}`}>
              {name ? name[0].toUpperCase() : "?"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{name || "User"} {surname}</h1>
              <p className="text-sm text-black/40 dark:text-white/40">
                {authed ? `Login: ${user?.email || ""} · Natijalar serverga saqlanadi` : "Kirilmagan — natijalar faqat bu qurilmada saqlanadi"}
              </p>
            </div>
            {authed ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  className="rounded-lg border border-black/[0.15] px-4 py-2 text-sm font-semibold text-black/70 transition-colors hover:border-black/30 hover:text-black dark:border-white/20 dark:text-white/80 dark:hover:border-white/40 dark:hover:text-white"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)]"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {results.length === 0 && (
          <div className={`rounded-2xl border p-10 text-center backdrop-blur-xl ${isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"}`}>
            <p className="text-lg text-black/40 dark:text-white/40">{"No test data yet"}</p>
            <Link to="/" className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-bold text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] hover:opacity-90 dark:hover:opacity-90">
              {"Start test"}
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {results.map((r) => (
            <Link
              key={`${r.series}-${r.testNum}`}
              to={`/results/${r.series}/${r.testNum}`}
              className={`block rounded-xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"}`}
            >
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-black/40 dark:text-white/40">
                IELTS {r.series} &middot; Academic &middot; Test {r.testNum}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black/40 dark:text-white/40">Overall</span>
                  <span className={`text-3xl font-extrabold ${skillColor(r.overall)}`}>{r.overall ?? "—"}</span>
                </div>
                <div className="flex gap-4 text-center text-sm">
                  {[
                    { label: "Listening", band: r.listening?.band },
                    { label: "Reading", band: r.reading?.band },
                    { label: "Writing", band: r.writing?.band },
                    { label: "Speaking", band: r.speaking?.band },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-xs text-black/30 dark:text-white/30">{s.label.slice(0, 4)}</div>
                      <div className={`font-bold ${skillColor(s.band)}`}>{s.band ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Account;
