import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";
import { getUser } from "../utils/api";
import { buildSandboxDoc, fetchGame, fetchGameResults, submitGameResult } from "../utils/gamesApi";

export default function GamePlay({ theme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const iframeRef = useRef(null);
  const sentRef = useRef(false);
  const initSentRef = useRef(false);
  const resultsRef = useRef([]);

  const [game, setGame] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── O'yinni yuklash ────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setError("");
    setSaved(false);
    sentRef.current = false;
    initSentRef.current = false;

    fetchGameResults(id, 200)
      .then((res) => {
        if (alive) resultsRef.current = Array.isArray(res?.items) ? res.items : [];
      })
      .catch(() => {
        if (alive) resultsRef.current = [];
      });

    fetchGame(id)
      .then((data) => {
        if (!alive) return;
        setGame(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || "O'yinni yuklab bo'lmadi.");
        setStatus("error");
      });

    return () => {
      alive = false;
    };
  }, [id]);

  // ── Bridge: init ───────────────────────────────────────────────────────────
  const sendInit = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame || !frame.contentWindow || initSentRef.current) return;
    const user = getUser() || {};
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "O'quvchi";
    frame.contentWindow.postMessage(
      {
        type: "og:init",
        v: 1,
        user: { id: user.id || 0, name, group: user?.group_detail?.name || "" },
        game: { id: Number(id), title: game?.title || "" },
        config: game?.config || {},
        leaderboard: resultsRef.current,
        theme: isDark ? "dark" : "light",
        locale: "uz",
      },
      "*"
    );
    initSentRef.current = true;
  }, [game, id, isDark]);

  // ── Bridge: storage + finish ───────────────────────────────────────────────
  useEffect(() => {
    const onMessage = (event) => {
      const frame = iframeRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const msg = event.data || {};

      // Brauzer xotirasi — backendga yuborilmaydi
      if (typeof msg.type === "string" && msg.type.startsWith("og:storage:")) {
        const user = getUser() || {};
        const key = `og:g${id}:u${user.id || 0}:${String(msg.key || "")}`;
        const reply = (type, payload) =>
          frame.contentWindow.postMessage({ type, id: msg.id, ...payload }, "*");
        try {
          if (msg.type === "og:storage:get") {
            const raw = localStorage.getItem(key);
            let value = null;
            if (raw != null) {
              try {
                value = JSON.parse(raw);
              } catch {
                value = raw;
              }
            }
            reply("og:storage:value", { value });
          } else if (msg.type === "og:storage:set") {
            localStorage.setItem(key, JSON.stringify(msg.value ?? null));
            reply("og:storage:ok", {});
          } else if (msg.type === "og:storage:remove") {
            localStorage.removeItem(key);
            reply("og:storage:ok", {});
          }
        } catch {
          reply("og:storage:error", {});
        }
        return;
      }

      if (msg.type === "og:ready") {
        sendInit();
        return;
      }

      // O'yin o'z leaderboard'i uchun yangilangan ro'yxatni so'raydi
      if (msg.type === "og:leaderboard:get") {
        fetchGameResults(id, 200)
          .then((res) => {
            const items = Array.isArray(res?.items) ? res.items : [];
            resultsRef.current = items;
            frame.contentWindow.postMessage(
              { type: "og:leaderboard:list", id: msg.id, items },
              "*"
            );
          })
          .catch(() => {
            frame.contentWindow.postMessage(
              { type: "og:leaderboard:list", id: msg.id, items: [] },
              "*"
            );
          });
        return;
      }

      if (msg.type === "og:exit") {
        navigate("/games");
        return;
      }

      // O'yin tugadi — ma'lumotni saqlaymiz (server tahlil qilmaydi)
      if (msg.type === "og:finish" && !sentRef.current) {
        sentRef.current = true;
        const payload =
          typeof msg.data === "string"
            ? msg.data
            : JSON.stringify(msg.stats ?? { score: msg.score ?? null });

        submitGameResult(id, payload)
          .then(() => setSaved(true))
          .catch(() => setSaved(false));
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id, navigate, sendInit]);

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    navigate("/games");
  }, [navigate]);

  const sandboxDoc = game ? buildSandboxDoc(game.html_code) : "";
  const dim = isDark ? "text-white/45" : "text-black/45";

  if (status === "error") {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 px-6 ${isDark ? "bg-[#0A0A0B] text-white" : "bg-[#F6F5F2] text-[#17171A]"}`}>
        <div className="text-4xl">🎮</div>
        <h1 className="text-xl font-bold">O'yin ochilmadi</h1>
        <p className={`text-sm ${dim}`}>{error}</p>
        <button onClick={exit} className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)]">
          O'yinlarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full flex-col ${isDark ? "bg-[#0A0A0B] text-white" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <header
        className={`flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-4 ${
          isDark ? "border-b border-white/10" : "border-b border-black/[0.08]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={exit}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
              isDark ? "bg-white/[0.06] hover:bg-white/[0.12]" : "bg-black/[0.05] hover:bg-black/[0.1]"
            }`}
            aria-label="Chiqish"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{game?.title || "O'yin"}</div>
            <div className={`truncate text-[11px] ${dim}`}>{game?.description || ""}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Saqlandi ✓
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              isDark ? "bg-white/[0.06] hover:bg-white/[0.12]" : "bg-black/[0.05] hover:bg-black/[0.1]"
            }`}
            aria-label="To'liq ekran"
          >
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-sm" />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {status === "loading" && (
          <div className={`absolute inset-0 flex items-center justify-center text-sm ${dim}`}>
            Yuklanmoqda...
          </div>
        )}

        {game && (
          <iframe
            key={id}
            ref={iframeRef}
            title={game.title}
            sandbox="allow-scripts"
            srcDoc={sandboxDoc}
            className="h-full w-full border-0"
            onLoad={() => {
              setTimeout(() => {
                if (!initSentRef.current) sendInit();
              }, 700);
            }}
          />
        )}
      </div>
    </div>
  );
}
