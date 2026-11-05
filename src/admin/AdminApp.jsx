import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, isAuthenticated, getUser } from "../utils/api";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminGroups from "./pages/AdminGroups";
import AdminAttendance from "./pages/AdminAttendance";
import AdminLeague from "./pages/AdminLeague";
import AdminMocks from "./pages/AdminMocks";
import AdminGames from "./pages/AdminGames";
import AdminTools from "./pages/AdminTools";
import AdminAI from "./pages/AdminAI";

const NAV = [
  { to: "/admin", label: "Umumiy", end: true },
  { to: "/admin/students", label: "O'quvchilar" },
  { to: "/admin/groups", label: "Guruhlar" },
  { to: "/admin/attendance", label: "Davomat" },
  { to: "/admin/league", label: "Liga" },
  { to: "/admin/mocks", label: "Mock testlar" },
  { to: "/admin/games", label: "O'yinlar" },
  { to: "/admin/tools", label: "Tool'lar" },
  { to: "/admin/ai", label: "AI boshqaruv" },
];

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

  return (
    <div className={`${isDark ? "dark" : ""} min-h-screen ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className={`hidden w-56 shrink-0 border-r md:block ${rule}`}>
          <div className="sticky top-0 flex h-screen flex-col p-4">
            <div className="px-2 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Admin</div>
              <div className="mt-1 text-sm font-extrabold">IELTS Beruniy</div>
            </div>

            <nav className="mt-4 flex flex-col gap-0.5">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark
                          ? "text-white/55 hover:bg-white/5 hover:text-white/90"
                          : "text-black/55 hover:bg-black/5 hover:text-black/90"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className={`mt-auto border-t pt-3 ${rule}`}>
              <a
                href="/"
                className={`flex min-h-9 items-center rounded-lg px-3 text-xs ${isDark ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"}`}
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
              <div className={`px-3 pt-2 text-[11px] ${isDark ? "text-white/25" : "text-black/25"}`}>
                {user?.full_name || user?.email}
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Mobile nav */}
          <div className={`sticky top-0 z-20 flex gap-1 overflow-x-auto border-b px-3 py-2 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden ${rule} ${isDark ? "bg-[#0A0A0B]/90" : "bg-[#F6F5F2]/90"}`}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : isDark
                        ? "text-white/55"
                        : "text-black/55"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <main className="p-4 sm:p-6">
            <Routes>
              <Route index element={<AdminDashboard isDark={isDark} />} />
              <Route path="students" element={<AdminStudents isDark={isDark} />} />
              <Route path="groups" element={<AdminGroups isDark={isDark} />} />
              <Route path="attendance" element={<AdminAttendance isDark={isDark} />} />
              <Route path="league" element={<AdminLeague isDark={isDark} />} />
              <Route path="mocks" element={<AdminMocks isDark={isDark} />} />
              <Route path="games" element={<AdminGames isDark={isDark} />} />
              <Route path="tools" element={<AdminTools isDark={isDark} />} />
              <Route path="ai" element={<AdminAI isDark={isDark} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
