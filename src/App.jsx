import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { clearAuth, flushPendingResults, isAuthenticated, refreshUser } from "./utils/api";
import RequireAuth from "./components/RequireAuth";
import RequireGroup from "./components/RequireGroup";
import Home from "./pages/Home";
import Mocks from "./pages/Mocks";
import Tools from "./pages/Tools";
import AboutUs from "./pages/AboutUs";
import IntroPage from "./pages/IntroPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Lessons from "./pages/Lessons";
import TestResults from "./pages/TestResults";
import NotFound from "./pages/NotFound";
import LeaderboardReveal from "./pages/LeaderboardReveal";
const AdminApp = lazy(() => import("./admin/AdminApp"));
import { LanguageProvider } from "./utils/LanguageContext";

const Settings = lazy(() => import("./pages/Settings"));
const BandCalculator = lazy(() => import("./pages/BandCalculator"));
const WordCounter = lazy(() => import("./pages/WordCounter"));
const Competition = lazy(() => import("./pages/Competition"));
const Listening = lazy(() => import("./pages/Listening"));
const Reading = lazy(() => import("./pages/Reading"));
const Speaking = lazy(() => import("./pages/Speaking"));
const Writing = lazy(() => import("./pages/Writing"));
const Typing = lazy(() => import("./pages/Typing"));
const Dictionary = lazy(() => import("./pages/Dictionary"));
const VocabularyQuiz = lazy(() => import("./pages/VocabularyQuiz"));
const SpeakingDraw = lazy(() => import("./pages/SpeakingDraw"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Games = lazy(() => import("./pages/Games"));
const GamePlay = lazy(() => import("./pages/GamePlay"));
const ToolPlay = lazy(() => import("./pages/ToolPlay"));
const AiTools = lazy(() => import("./pages/AiTools"));

function PageLoader({ theme }) {
  const isDark = theme === "dark";
  return (
    <div className={`p-6 text-center ${isDark ? "text-white/40" : "text-black/40"}`}>
      Loading...
    </div>
  );
}

function BlockedScreen({ theme, onLogout }) {
  const isDark = theme === "dark";
  return (
    <div
      className={`flex min-h-screen items-center justify-center px-6 ${
        isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
      }`}
    >
      <div className="w-full max-w-md text-center">
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            isDark ? "bg-red-500/10" : "bg-red-500/10"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-9 w-9 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Hisobingiz bloklangan</h1>
        <p className={`mt-3 text-sm leading-relaxed ${isDark ? "text-white/50" : "text-black/50"}`}>
          Iltimos, ustoz bilan bog'laning. Blokdan chiqarilganingizdan so'ng saytdan
          yana foydalanishingiz mumkin bo'ladi.
        </p>
        <button
          onClick={onLogout}
          className={`mt-8 rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            isDark
              ? "border border-white/15 text-white/80 hover:bg-white/10"
              : "border border-black/15 text-black/70 hover:bg-black/5"
          }`}
        >
          Chiqish
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  // Admin panelda sticky sidebar ishlashi uchun overflow-hidden qo'llanmaydi.
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem("theme_id") || "graphite";
  });

  const [radius, setRadius] = useState(() => {
    return localStorage.getItem("theme_radius") || "normal";
  });

  const [font, setFont] = useState(() => {
    return localStorage.getItem("theme_font") || "inter";
  });

  const [registered, setRegistered] = useState(() => {
    return !!localStorage.getItem("ielts_registered");
  });

  const finishRegistration = () => {
    localStorage.setItem("ielts_registered", "1");
    setRegistered(true);
  };

  const [, setIsTransitioning] = useState(false);

  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;

    const check = async () => {
      try {
        const freshUser = await refreshUser();
        if (!cancelled) {
          if (freshUser) {
            setBlocked(!!freshUser.is_blocked);
          }
        }
      } catch {
        // refreshUser ichki catch'da boshqaradi
      }
    };

    check();
    const timer = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setBlocked(false);
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("theme_id", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem("theme_radius", radius);
    document.documentElement.setAttribute("data-radius", radius);
  }, [radius]);

  useEffect(() => {
    localStorage.setItem("theme_font", font);
    document.documentElement.setAttribute("data-font", font);
  }, [font]);

  useEffect(() => {
    if (isAuthenticated()) {
      flushPendingResults().catch((err) => console.warn('Failed to flush results:', err.message));
    }
  }, []);

  const toggleTheme = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setTheme((current) => (current === "dark" ? "light" : "dark"));
      setIsTransitioning(false);
    }, 180);
  };

  return (
    <LanguageProvider>
    <div
      className={`relative min-h-screen transition-all duration-500 ${
        isAdminRoute ? "" : "overflow-hidden"
      } ${theme === "dark" ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>

      {blocked ? (
        <BlockedScreen theme={theme} onLogout={handleLogout} />
      ) : (
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader theme={theme} />}><AdminApp theme={theme} /></Suspense>} />
        <Route element={<MainLayout theme={theme} toggleTheme={toggleTheme} registered={registered} />}>
          <Route path="/" element={registered ? <RequireAuth><Home theme={theme} /></RequireAuth> : <IntroPage theme={theme} finishRegistration={finishRegistration} />} />
          <Route path="/mocks" element={<RequireAuth><RequireGroup type="mock"><Mocks theme={theme} /></RequireGroup></RequireAuth>} />
          <Route path="/tools" element={<RequireAuth><Tools theme={theme} /></RequireAuth>} />
          <Route path="/tools/play/:id" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><ToolPlay theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/tools/ai" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><AiTools theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/tools/band" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><BandCalculator theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/tools/words" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><WordCounter theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/tools/dictionary" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Dictionary theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/tools/vocabulary" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><VocabularyQuiz theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/tools/speaking-draw" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><SpeakingDraw theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/competition" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Competition theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/about-us" element={<AboutUs theme={theme} />} />

          <Route
            path="/academic/:series/:testNum/reading/:partNum"
            element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Reading theme={theme} /></Suspense></RequireAuth>}
          />

          <Route
            path="/academic/:series/:testNum/speaking/:taskPart"
            element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Speaking theme={theme} /></Suspense></RequireAuth>}
          />
          <Route path="/speaking" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Speaking theme={theme} /></Suspense></RequireAuth>} />

          <Route
            path="/academic/:series/:testNum/writing/:taskPart"
            element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Writing theme={theme} /></Suspense></RequireAuth>}
          />

          <Route path="/writing" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Writing theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/typing" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Typing theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/games" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Games theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/games/play/:id" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><GamePlay theme={theme} /></Suspense></RequireAuth>} />
          <Route path="/group/:slug" element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><GroupDetail theme={theme} /></Suspense></RequireAuth>} />
          <Route
            path="/academic/:series/:testNum/listening/:partNum"
            element={<RequireAuth><Suspense fallback={<PageLoader theme={theme} />}><Listening theme={theme} /></Suspense></RequireAuth>}
          />

          {/* Our Mock routes */}
          <Route
            path="/mock/:series/:testNum/reading/:partNum"
            element={<RequireAuth><RequireGroup type="mock"><Suspense fallback={<PageLoader theme={theme} />}><Reading theme={theme} isOurMockRoute /></Suspense></RequireGroup></RequireAuth>}
          />
          <Route
            path="/mock/:series/:testNum/listening/:partNum"
            element={<RequireAuth><RequireGroup type="mock"><Suspense fallback={<PageLoader theme={theme} />}><Listening theme={theme} isOurMockRoute /></Suspense></RequireGroup></RequireAuth>}
          />

          <Route path="/intro" element={<IntroPage theme={theme} />} />
          <Route path="/register" element={<Register theme={theme} />} />
          <Route path="/login" element={<Login theme={theme} />} />
          <Route path="/account" element={<RequireAuth><Account theme={theme} /></RequireAuth>} />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader theme={theme} />}>
                <RequireAuth><Settings theme={theme} toggleTheme={toggleTheme} themeId={themeId} setThemeId={setThemeId} radius={radius} setRadius={setRadius} font={font} setFont={setFont} /></RequireAuth>
              </Suspense>
            }
          />
          <Route path="/lessons" element={<RequireAuth><Lessons theme={theme} /></RequireAuth>} />
          <Route path="/results/:series/:testNum" element={<RequireAuth><TestResults theme={theme} /></RequireAuth>} />
          <Route path="/experiment" element={<LeaderboardReveal />} />
          <Route path="*" element={<NotFound theme={theme} />} />
        </Route>
      </Routes>
      )}
    </div>
    </LanguageProvider>
  );
}
