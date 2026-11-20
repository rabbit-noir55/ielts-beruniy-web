import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, isAuthenticated, getUser } from "../utils/api";
import logoSvg from "../assets/logo.png";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminGroups from "./pages/AdminGroups";
import AdminAttendance from "./pages/AdminAttendance";
import AdminLeague from "./pages/AdminLeague";
import AdminMocks from "./pages/AdminMocks";
import AdminCambridgeBooks from "./pages/AdminCambridgeBooks";
import AdminGames from "./pages/AdminGames";
import AdminTools from "./pages/AdminTools";
import AdminAI from "./pages/AdminAI";
import AdminLessons from "./pages/AdminLessons";
import AdminResources from "./pages/AdminResources";

const NAV_GROUPS = [
  {
    label: "Boshqaruv",
    items: [
      { to: "/admin", label: "Umumiy", end: true },
      { to: "/admin/students", label: "O'quvchilar" },
      { to: "/admin/groups", label: "Guruhlar" },
      { to: "/admin/attendance", label: "Davomat" },
    ],
  },
  {
    label: "Kontent",
    items: [
      { to: "/admin/lessons", label: "Onlayn darslar" },
      { to: "/admin/resources", label: "Materiallar" },
      { to: "/admin/mocks", label: "Mock testlar" },
      { to: "/admin/cambridge", label: "Cambridge kitoblar" },
      { to: "/admin/games", label: "O'yinlar" },
      { to: "/admin/tools", label: "Tool'lar" },
    ],
  },
  {
    label: "Tizim",
    items: [
      { to: "/admin/league", label: "Liga" },
      { to: "/admin/ai", label: "AI boshqaruv" },
    ],
  },
];

const NAV = NAV_GROUPS.flatMap((group) => group.items);

function AccessDenied({ isDark }) {
  return (
    <div className={`${isDark ? "dark" : ""} flex min-h-screen items-center justify-center px-6 ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="max-w-sm text-center">
        <div className="text-5xl font-extrabold tracking-tight">403</div>
        <p className={`mt-3 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
          Bu bo'lim faqat ustoz uchun. Iltimos, ustoz akkaunti bilan kirishda davom eting.
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-contrast)]"
        >
          Kirish
        </a>
      </div>
    </div>
  );
}

export default function AdminApp({ theme }) {
  const isDark = theme === "dark";
  const location = useLocation();
  const user = getUser();
  const navigate = useNavigate();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role !== "teacher") {
    return <AccessDenied isDark={isDark} />;
  }

  const rule = isDark ? "border-white/10" : "border-black/10";
  const initial = (user?.full_name || user?.email || "U").trim().charAt(0).toUpperCase();
  const itemClass = (isActive) =>
    `relative flex min-h-10 items-center rounded-xl px-3 text-[13px] font-semibold transition ${
      isActive
        ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
        : isDark
          ? "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
          : "text-black/55 hover:bg-black/[0.04] hover:text-black/90"
    }`;

  return (
    <div className={`${isDark ? "dark" : ""} min-h-screen ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="mx-auto flex max-w-[1440px]">
        {/* Sidebar */}
        <aside className={`hidden w-64 shrink-0 border-r md:block ${rule}`}>
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto p-4">
            <NavLink to="/admin" className="flex flex-col items-start gap-1 px-2 py-3">
              <img
                src={logoSvg}
                alt="IELTS Beruniy"
                className="h-11 w-auto dark:brightness-0 dark:invert"
              />
              <span className="pl-0.5 font-mono text-[9px] uppercase tracking-[0.22em] opacity-40">
                Ustoz paneli
              </span>
            </NavLink>

            <nav className="mt-3 flex flex-col gap-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className={`px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-white/25" : "text-black/25"}`}>
                    {group.label}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => itemClass(isActive)}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className={`mt-auto border-t pt-3 ${rule}`}>
              <div className="flex items-center gap-2.5 px-2 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-black text-[var(--accent)]">
                  {initial}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{user?.full_name || "Ustoz"}</span>
                  <span className={`block truncate text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>
                    {user?.email}
                  </span>
                </span>
              </div>
              <a
                href="/"
                className={`flex min-h-9 items-center rounded-lg px-3 text-xs transition ${isDark ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"}`}
              >
                ← Saytga qaytish
              </a>
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  navigate("/login");
                }}
                className={`mt-1 flex min-h-9 w-full items-center rounded-lg px-3 text-left text-xs font-semibold ${
                  isDark ? "text-red-400/80 hover:bg-red-500/10" : "text-red-600/80 hover:bg-red-500/10"
                }`}
              >
                Chiqish
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className={`sticky top-0 z-20 border-b backdrop-blur md:hidden ${rule} ${isDark ? "bg-[#0A0A0B]/90" : "bg-[#F6F5F2]/90"}`}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2">
                <img
                  src={logoSvg}
                  alt="IELTS Beruniy"
                  className="h-7 w-auto dark:brightness-0 dark:invert"
                />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-40">
                  Ustoz
                </span>
              </span>
              <span className="flex items-center gap-2">
                <a href="/" className={`text-[11px] font-bold ${isDark ? "text-white/50" : "text-black/50"}`}>
                  Sayt
                </a>
                <button
                  type="button"
                  onClick={() => {
                    clearAuth();
                    navigate("/login");
                  }}
                  className={`text-[11px] font-bold ${isDark ? "text-red-400/80" : "text-red-600/80"}`}
                >
                  Chiqish
                </button>
              </span>
            </div>
            <div className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      isActive
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark
                          ? "bg-white/[0.05] text-white/55"
                          : "bg-black/[0.04] text-black/55"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1200px]">
              <Routes>
                <Route index element={<AdminDashboard isDark={isDark} />} />
                <Route path="students" element={<AdminStudents isDark={isDark} />} />
                <Route path="groups" element={<AdminGroups isDark={isDark} />} />
                <Route path="attendance" element={<AdminAttendance isDark={isDark} />} />
                <Route path="league" element={<AdminLeague isDark={isDark} />} />
                <Route path="lessons" element={<AdminLessons isDark={isDark} />} />
                <Route path="resources" element={<AdminResources isDark={isDark} />} />
                <Route path="mocks" element={<AdminMocks isDark={isDark} />} />
                <Route path="cambridge" element={<AdminCambridgeBooks isDark={isDark} />} />
                <Route path="games" element={<AdminGames isDark={isDark} />} />
                <Route path="tools" element={<AdminTools isDark={isDark} />} />
                <Route path="ai" element={<AdminAI isDark={isDark} />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
