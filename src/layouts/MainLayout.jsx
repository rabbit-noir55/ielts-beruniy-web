import { useState, useEffect, useCallback, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Trophy,
  Home,
  Info,
  Book,
  BookOpen,
  Gamepad2,
  Moon,
  Sun,
  Wrench,
  Calculator,
  Wand2,
  Keyboard,
  FileText,
  Mic,
  GraduationCap,
  ScanLine,
  ClipboardList,
} from "lucide-react";
import logoSvg from "../assets/logo.png";
import { getBackgroundImage, getUser, hasMockAccess, getUserGroupName, getUserGroupLogo, isIeltsGroup } from "../utils/api";
import { getMockActive, onMockChange } from "../utils/mockMode";
import { getRecentTools, recordRecentTool, toolLabelForPath, isCustomToolPath } from "../utils/recentTools";

// Recent bo'lmasa ko'rsatiladigan foydali tool'lar
const DEFAULT_TOOLS = [
  { to: "/tools/band", label: "Band Calculator" },
  { to: "/typing", label: "Typing test" },
  { to: "/tools/vocabulary", label: "Vocabulary Quiz" },
  { to: "/tools/dictionary", label: "Dictionary" },
];

const BG_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
  "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
  "bg-rose-500",
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function MainLayout({ theme, toggleTheme, registered }) {
  const isDark = theme === "dark";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const canAccessMocks = hasMockAccess();
  const userGroupName = getUserGroupName();
  const userGroupLogo = getUserGroupLogo();
  const userGroupSlug = user?.group_detail?.slug || '';
  const isIelts = isIeltsGroup();
  const showGroupHeader = userGroupName && isIelts && (user?.group_detail?.parameters?.show_logo ?? true);

  const ieltsDate = isIelts ? user?.group_detail?.ielts_date : null;
  const [countdown, setCountdown] = useState(null);
  // Logo yuklanmasa (fayl o'chirilgan/o'lik havola) — guruh bosh harfi ko'rsatiladi
  const [failedLogo, setFailedLogo] = useState(null);
  const showGroupLogo = Boolean(userGroupLogo) && failedLogo !== userGroupLogo;
  useEffect(() => {
    if (!ieltsDate) { setCountdown(null); return; }
    const calc = () => {
      const diff = new Date(ieltsDate) - new Date();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, mins: 0, secs: 0, expired: true }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [ieltsDate]);

  const isReading = /^\/academic\/.+\/reading\/.+/.test(pathname);

  // Header balandligi (countdown bari bilan) — kontent ostida qolmasligi uchun
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const [mockActive, setMockActiveState] = useState(() => getMockActive());
  // O'yin to'liq ekranda ochiladi — sayt header'i va tab bari yashiriladi
  const isAppPlay =
    pathname.startsWith("/games/play/") || pathname.startsWith("/tools/play/");
  const immersive = mockActive || isAppPlay;
  useEffect(() => onMockChange(setMockActiveState), []);

  useEffect(() => {
    if (immersive) {
      setHeaderHeight(0);
      return;
    }
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [immersive, showGroupHeader]);

  useEffect(() => {
    if (!mockActive) return;
    document.documentElement.requestFullscreen?.().catch((err) => console.warn('Fullscreen request failed:', err.message));
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch((err) => console.warn('Exit fullscreen failed:', err.message));
      }
    };
  }, [mockActive]);
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
  const [mockSheetOpen, setMockSheetOpen] = useState(false);
  const [bgImage, setBgImage] = useState(() => getBackgroundImage());

  const userName = localStorage.getItem("user_name") || "";
  const userSurname = localStorage.getItem("user_surname") || "";
  const initial = (userName[0] || "") + (userSurname[0] || "");
  const bgColor = initial
    ? BG_COLORS[hashStr(initial) % BG_COLORS.length]
    : "bg-slate-400";

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [isDark, theme]);

  useEffect(() => {
    const sync = () => setBgImage(getBackgroundImage());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const navLinks = [
    { to: "/scan", label: "Davomat", icon: ScanLine },
    { to: "/attendance", label: "Mening davomatim", icon: ClipboardList },
    { to: "/competition", label: "Competition", icon: Trophy },
    { to: "/games", label: "Games", icon: Gamepad2, shine: true },
    { to: "/lessons", label: "Lessons", icon: Book },
    { to: "/about-us", label: "About Us", icon: Info },
  ];


  // Oxirgi ishlatilgan tool'lar
  const [recentTools, setRecentTools] = useState(() => getRecentTools());
  const refreshRecentTools = useCallback(() => setRecentTools(getRecentTools()), []);

  useEffect(() => {
    const label = toolLabelForPath(pathname);
    if (label) recordRecentTool(pathname, label);
    else if (isCustomToolPath(pathname)) {
      // custom tool: nomi ToolPlay sahifasi yuklangach yoziladi
      const existing = getRecentTools().find((it) => it.to === pathname);
      if (!existing) recordRecentTool(pathname, "Tool");
    }
    refreshRecentTools();
  }, [pathname, refreshRecentTools]);

  const toolIcon = (to) => {
    if (to === "/tools/ai") return Wand2;
    if (to === "/tools/band") return Calculator;
    if (to === "/tools/vocabulary") return BookOpen;
    if (to === "/tools/speaking-draw") return Mic;
    if (to === "/typing") return Keyboard;
    if (to === "/tools/words") return FileText;
    if (to === "/tools/dictionary") return Book;
    return Wrench;
  };

  const isActive = (to) => {
    const base = to.split("#")[0];
    return base === "/"
      ? pathname === "/"
      : pathname === base || pathname.startsWith(`${base}/`);
  };

  const bottomTabs = [
    { id: "mock", label: "Mock", icon: BookOpen },
    { to: "/lessons", label: "Lessons", icon: Book },
    { to: "/scan", label: "Scan", icon: ScanLine },
    { id: "competition", to: "/competition", label: "Competition", icon: Trophy, center: true },
    { id: "tools", label: "Tools", icon: Wrench },
    { to: "/account", label: "Account", icon: null },
  ];

  return (
    <div
      className={`relative min-h-screen transition-colors duration-300 ${
        isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
      }`}
      style={bgImage ? undefined : { backgroundColor: isDark ? "#0A0A0B" : "#F6F5F2" }}
    >
      {/* ===== CUSTOM BACKGROUND ===== */}
      {bgImage && (
        <div
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
          style={{ backgroundColor: isDark ? "#0A0A0B" : "#F6F5F2" }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className={`absolute inset-0 ${isDark ? "bg-black/25" : "bg-white/20"}`} />
        </div>
      )}

      {/* ===== HEADER ===== */}
      {!immersive && (
      <header ref={headerRef} className={`fixed w-full top-0 z-50 border-b backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-[#0A0A0B]/90"
            : "border-black/[0.08] bg-white/90"
        }`}>
        {/* Countdown bar */}
        {showGroupHeader && countdown && !countdown.expired && (
          <div className="bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2">
            <div className="flex items-center justify-center gap-1 text-white text-xs font-bold">
              <span className="text-[10px] opacity-70 mr-1">IELTS EXAM</span>
              <span className="text-[10px] opacity-50 mx-0.5">—</span>
              <div className="text-center"><span className="tabular-nums text-sm">{countdown.days}</span><div className="text-[8px] opacity-60 leading-none">kun</div></div>
              <span className="opacity-40 mx-0.5">:</span>
              <div className="text-center"><span className="tabular-nums text-sm">{String(countdown.hours).padStart(2,'0')}</span><div className="text-[8px] opacity-60 leading-none">soat</div></div>
              <span className="opacity-40 mx-0.5">:</span>
              <div className="text-center"><span className="tabular-nums text-sm">{String(countdown.mins).padStart(2,'0')}</span><div className="text-[8px] opacity-60 leading-none">daqiqa</div></div>
              <span className="opacity-40 mx-0.5">:</span>
              <div className="text-center"><span className="tabular-nums text-sm">{String(countdown.secs).padStart(2,'0')}</span><div className="text-[8px] opacity-60 leading-none">soniya</div></div>
              <span className="text-[10px] opacity-70 ml-2">Tayyorlaning!</span>
            </div>
          </div>
        )}

        {/* Desktop header */}
        <div className="hidden md:flex mx-auto max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logoSvg} alt="IELTS Beruniy Logo" className="h-20 dark:brightness-0 dark:invert" />
          </Link>
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {registered && canAccessMocks && isIelts && (
              <div className="relative group">
                <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 cursor-pointer ${
                  isActive("/") || isActive("/mocks")
                    ? isDark ? "text-[var(--accent)] bg-white/[0.08]" : "text-[var(--accent)] bg-black/[0.05]"
                    : isDark ? "text-white/50 hover:text-white hover:bg-white/[0.06]" : "text-black/50 hover:text-[#17171A] hover:bg-black/[0.03]"
                }`}>
                  <Home size={14} className={`text-xs transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 group-hover:text-[var(--accent)] ${isActive("/") || isActive("/mocks") ? "text-[var(--accent)]" : ""}`} />
                  <span className="relative">
                    Mocktest
                    <span className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-[var(--accent)] dark:bg-[var(--accent)] transition-all duration-300 ${
                      isActive("/") || isActive("/mocks") ? "w-full" : "w-0 group-hover:w-full"
                    }`} />
                  </span>
                </span>
                <div className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-full mt-1 min-w-[180px] rounded-xl border p-1.5 shadow-xl backdrop-blur-xl transition-all duration-200 ${
                  isDark ? "border-white/10 bg-[#0A0A0B]/95" : "border-black/[0.08] bg-white/95"
                }`}>
                  <Link to="/" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white hover:bg-white/[0.06]" : "text-black/60 hover:text-[#17171A] hover:bg-black/[0.03]"}`}>
                    <Book size={14} className="w-3.5 text-xs opacity-60" />
                    Cambridge
                  </Link>
                  <Link to="/mocks" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white hover:bg-white/[0.06]" : "text-black/60 hover:text-[#17171A] hover:bg-black/[0.03]"}`}>
                    <Trophy size={14} className="w-3.5 text-xs opacity-60" />
                    Our Mock
                  </Link>
                </div>
              </div>
            )}
            {registered && (
              <div className="relative group">
                <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 cursor-pointer ${
                  isActive("/tools") || isActive("/typing")
                    ? isDark ? "text-[var(--accent)] bg-white/[0.08]" : "text-[var(--accent)] bg-black/[0.05]"
                    : isDark ? "text-white/50 hover:text-white hover:bg-white/[0.06]" : "text-black/50 hover:text-[#17171A] hover:bg-black/[0.03]"
                }`}>
                  <Wrench size={14} className={`text-xs transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 group-hover:text-[var(--accent)] ${isActive("/tools") || isActive("/typing") ? "text-[var(--accent)]" : ""}`} />
                  <span className="relative">
                    Tools
                    <span className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-[var(--accent)] dark:bg-[var(--accent)] transition-all duration-300 ${
                      isActive("/tools") || isActive("/typing") ? "w-full" : "w-0 group-hover:w-full"
                    }`} />
                  </span>
                </span>
                <div
                  onMouseEnter={refreshRecentTools}
                  className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-full mt-1 min-w-[240px] rounded-xl border p-1.5 shadow-xl backdrop-blur-xl transition-all duration-200 ${
                    isDark ? "border-white/10 bg-[#0A0A0B]/95" : "border-black/[0.08] bg-white/95"
                  }`}
                >
                  {(recentTools.length ? recentTools : DEFAULT_TOOLS).map((item) => {
                    const Icon = toolIcon(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isDark ? "text-white/70 hover:text-white hover:bg-white/[0.06]" : "text-black/60 hover:text-[#17171A] hover:bg-black/[0.03]"
                        }`}
                      >
                        <Icon size={14} className="w-3.5 text-xs opacity-60" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}

                  <Link
                    to="/tools"
                    className={`mt-1 flex items-center justify-between gap-2 rounded-lg border-t px-3 py-2 text-xs font-semibold transition-colors ${
                      isDark
                        ? "border-white/10 text-[var(--accent)] hover:bg-white/[0.06]"
                        : "border-black/[0.06] text-[var(--accent)] hover:bg-black/[0.03]"
                    }`}
                  >
                    All tools
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            )}
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                isActive(link.to)
                  ? isDark ? "text-[var(--accent)] bg-white/[0.08]" : "text-[var(--accent)] bg-black/[0.05]"
                  : isDark ? "text-white/50 hover:text-white hover:bg-white/[0.06]" : "text-black/50 hover:text-[#17171A] hover:bg-black/[0.03]"
              } ${link.shine ? "qz-games-glow" : ""}`}>
                <link.icon size={14} className={`text-xs transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 group-hover:text-[var(--accent)] ${isActive(link.to) ? "text-[var(--accent)]" : ""}`} />
                <span className={`relative ${link.shine ? "qz-games-shine" : ""}`}>
                  {link.label}
                  <span className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-[var(--accent)] dark:bg-[var(--accent)] transition-all duration-300 ${
                    isActive(link.to) ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {showGroupHeader && (
              <button onClick={() => userGroupSlug && navigate(`/group/${userGroupSlug}`)} className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 transition hover:scale-105 hover:shadow-lg hover:shadow-rose-500/10 cursor-pointer">
                {showGroupLogo ? (
                  <img src={userGroupLogo} alt="" className="h-7 w-7 rounded-lg object-cover shadow-sm" onError={() => setFailedLogo(userGroupLogo)} />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/25 text-[11px] font-bold">
                    {(userGroupName || "?").trim().charAt(0).toUpperCase()}
                  </span>
                )}
                {userGroupName}
              </button>
            )}
            <button onClick={toggleTheme} className={`group relative flex h-9 w-9 items-center justify-center rounded-lg text-base transition-all duration-200 hover:scale-105 ${isDark ? "text-white/50 hover:text-white hover:bg-white/[0.06]" : "text-black/50 hover:text-[#17171A] hover:bg-black/[0.03]"}`} aria-label="Toggle theme">
              <span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"}`}>
                <Moon size={14} className="group-hover:text-[var(--accent)]" />
              </span>
              <span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isDark ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}>
                <Sun size={14} className="group-hover:text-[var(--accent)]" />
              </span>
            </button>
            <Link to="/account" className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${bgColor}`} aria-label="Account">
              {initial || "?"}
            </Link>
          </div>
        </div>

        {/* Mobile header — compact app-style */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logoSvg} alt="IELTS Beruniy" className="h-10 dark:brightness-0 dark:invert" />
          </Link>
          <div className="flex items-center gap-1.5">
            {showGroupHeader && (
              <button onClick={() => userGroupSlug && navigate(`/group/${userGroupSlug}`)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 transition active:scale-95 cursor-pointer">
                {showGroupLogo ? (
                  <img src={userGroupLogo} alt="" className="h-5 w-5 rounded-md object-cover" onError={() => setFailedLogo(userGroupLogo)} />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500/25 text-[9px] font-bold">
                    {(userGroupName || "?").trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[70px] truncate">{userGroupName}</span>
              </button>
            )}
            <button onClick={toggleTheme} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all active:scale-90 ${isDark ? "text-white/50" : "text-black/50"}`} aria-label="Toggle theme">
              {isDark ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main
        style={immersive ? undefined : { paddingTop: headerHeight ? `${headerHeight}px` : undefined }}
        className={`relative z-10 ${
          immersive
            ? ""
            : isReading
              ? "pt-24 md:pt-24"
              : "px-2 pt-16 pb-24 sm:px-3 md:pt-24 md:pb-6 lg:px-4"
        }`}
      >
        <div
          className={
            immersive || isReading
              ? ""
              : `rounded-2xl border px-3 py-5 sm:px-4 ${
                  isDark
                    ? "border-white/10 bg-[#0A0A0B]/60 backdrop-blur-[2px]"
                    : "border-black/[0.08] bg-[#F6F5F2]/60 backdrop-blur-[2px]"
                }`
          }
        >
          <Outlet />
        </div>
      </main>

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      {!immersive && (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-[#0A0A0B]/90"
            : "border-black/[0.08] bg-white/90"
        }`}>
          <div className="flex items-center justify-around px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
            {bottomTabs.map((tab) => {
              if (tab.center) {
                return (
                  <Link
                    key={tab.id}
                    to={tab.to}
                    className="flex flex-col items-center -mt-4 min-w-[56px]"
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-90 ${
                      isActive(tab.to)
                        ? "bg-[var(--accent)] text-white shadow-[var(--accent)]/30"
                        : isDark
                          ? "bg-white/10 text-white/70"
                          : "bg-black/10 text-black/60"
                    }`}>
                      <tab.icon size={22} strokeWidth={isActive(tab.to) ? 2.5 : 1.8} />
                    </span>
                    <span className={`mt-0.5 text-[10px] leading-none font-medium ${
                      isActive(tab.to) ? "font-semibold text-[var(--accent)]" : isDark ? "text-white/40" : "text-black/40"
                    }`}>
                      {tab.label}
                    </span>
                  </Link>
                );
              }

              if (tab.id === "tools") {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setToolsSheetOpen(true)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] ${
                      isDark ? "text-white/40" : "text-black/40"
                    }`}
                  >
                    <tab.icon size={20} strokeWidth={1.8} />
                    <span className="text-[10px] leading-none font-medium">{tab.label}</span>
                  </button>
                );
              }

              if (tab.id === "mock") {
                const mockActive = pathname === "/" || pathname.startsWith("/mocks");
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMockSheetOpen(true)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] ${
                      mockActive
                        ? "text-[var(--accent)]"
                        : isDark ? "text-white/40" : "text-black/40"
                    }`}
                  >
                    <tab.icon size={20} strokeWidth={mockActive ? 2.5 : 1.8} />
                    <span className={`text-[10px] leading-none font-medium ${mockActive ? "font-semibold" : ""}`}>{tab.label}</span>
                    {mockActive && (
                      <span className="mt-0.5 h-1 w-4 rounded-full bg-[var(--accent)]" />
                    )}
                  </button>
                );
              }

              const active = isActive(tab.to);
              return (
                <Link
                  key={tab.id || tab.to}
                  to={tab.to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] ${
                    active
                      ? "text-[var(--accent)]"
                      : isDark ? "text-white/40" : "text-black/40"
                  }`}
                >
                  {tab.icon ? (
                    <tab.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  ) : (
                    <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white ${bgColor}`}>
                      {initial || "?"}
                    </span>
                  )}
                  <span className={`text-[10px] leading-none font-medium ${active ? "font-semibold" : ""}`}>
                    {tab.label}
                  </span>
                  {active && (
                    <span className="mt-0.5 h-1 w-4 rounded-full bg-[var(--accent)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ===== TOOLS BOTTOM SHEET (mobile) ===== */}
      {toolsSheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setToolsSheetOpen(false)} />
          <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${
            isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
          }`}>
            <div className="flex justify-center mb-3">
              <div className={`w-10 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-black/15"}`} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(recentTools.length ? recentTools : DEFAULT_TOOLS).map((item) => {
                const Icon = toolIcon(item.to);
                return (
                  <Link key={item.to} to={item.to} onClick={() => setToolsSheetOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all active:scale-95 ${
                      isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-white/70" : "bg-black/[0.03] hover:bg-black/[0.06] text-black/60"
                    }`}>
                    <Icon size={20} className={isActive(item.to) ? "text-[var(--accent)]" : ""} />
                    <span className="text-[10px] leading-tight font-medium text-center line-clamp-2">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <Link to="/tools" onClick={() => setToolsSheetOpen(false)}
              className={`mt-3 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                isDark ? "border-white/15 text-[var(--accent)] hover:bg-white/[0.06]" : "border-black/10 text-[var(--accent)] hover:bg-black/[0.03]"
              }`}>
              All tools →
            </Link>
          </div>
        </div>
      )}

      {/* ===== MOCK BOTTOM SHEET (mobile) ===== */}
      {mockSheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMockSheetOpen(false)} />
          <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${
            isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
          }`}>
            <div className="flex justify-center mb-3">
              <div className={`w-10 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-black/15"}`} />
            </div>
            <h3 className={`text-sm font-bold mb-3 ${isDark ? "text-white/70" : "text-black/60"}`}>Mock Tests</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/" onClick={() => setMockSheetOpen(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-4 transition-all active:scale-95 ${
                  isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-white/70" : "bg-black/[0.03] hover:bg-black/[0.06] text-black/60"
                }`}>
                <Book size={24} />
                <span className="text-xs font-medium">Cambridge</span>
              </Link>
              <Link to="/mocks" onClick={() => setMockSheetOpen(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-4 transition-all active:scale-95 ${
                  isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-white/70" : "bg-black/[0.03] hover:bg-black/[0.06] text-black/60"
                }`}>
                <GraduationCap size={24} />
                <span className="text-xs font-medium">Our Mock</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
