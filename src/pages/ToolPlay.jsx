import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faExpand, faCompress, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { getUser } from "../utils/api";
import { buildSandboxDoc, fetchTool, getToolState, setToolState } from "../utils/toolsApi";
import { recordRecentTool } from "../utils/recentTools";

export default function ToolPlay({ theme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const iframeRef = useRef(null);
  const initSentRef = useRef(false);

  const [tool, setTool] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Toolni yuklash ─────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setError("");
    initSentRef.current = false;

    fetchTool(id)
      .then((data) => {
        if (!alive) return;
        setTool(data);
        setStatus("ready");
        recordRecentTool(`/tools/play/${id}`, data.title || "Tool");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || "Toolni yuklab bölmadi.");
        setStatus("error");
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const sendInit = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame || !frame.contentWindow || initSentRef.current) return;
    const user = getUser() || {};
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";

    // Sayt dizayn tokenlari — tool sayt bilan bir xil ko'rinishi uchun
    const css = getComputedStyle(document.documentElement);
    const design = {
      accent: css.getPropertyValue("--accent").trim() || (isDark ? "#ffffff" : "#17171a"),
      accentContrast:
        css.getPropertyValue("--accent-contrast").trim() || (isDark ? "#17171a" : "#ffffff"),
      radius: css.getPropertyValue("--radius").trim() || "12px",
      background: isDark ? "#0A0A0B" : "#F6F5F2",
      card: isDark ? "#141416" : "#FFFFFF",
      text: isDark ? "#F5F5F5" : "#17171A",
      muted: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
      border: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
      font: '"Inter", "Segoe UI", system-ui, sans-serif',
    };

    frame.contentWindow.postMessage(
      {
        type: "og:init",
        v: 1,
        user: { id: user.id || 0, name, group: user?.group_detail?.name || "" },
        tool: { id: Number(id), title: tool?.title || "" },
        config: tool?.config || {},
        theme: isDark ? "dark" : "light",
        design,
        locale: "uz",
      },
      "*"
    );
    initSentRef.current = true;
  }, [tool, id, isDark]);

  // ── Bridge: state (bazadagi xotira) ────────────────────────────────────────
  useEffect(() => {
    const onMessage = async (event) => {
      const frame = iframeRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const msg = event.data || {};
      const reply = (type, payload) =>
        frame.contentWindow.postMessage({ type, id: msg.id, ...payload }, "*");

      if (msg.type === "og:ready") {
        sendInit();
        return;
      }

      if (msg.type === "og:exit") {
        navigate("/tools");
        return;
      }

      if (msg.type === "og:state:get") {
        try {
          const res = await getToolState(id, msg.key);
          reply("og:state:value", { key: msg.key, value: res?.value ?? null });
        } catch {
          reply("og:state:error", { key: msg.key });
        }
        return;
      }

      if (msg.type === "og:state:all") {
        try {
          const res = await getToolState(id);
          reply("og:state:all", { items: res?.items || {} });
        } catch {
          reply("og:state:all", { items: {} });
        }
        return;
      }

      if (msg.type === "og:state:set") {
        try {
          await setToolState(id, msg.key, msg.value);
          reply("og:state:ok", { key: msg.key });
        } catch {
          reply("og:state:error", { key: msg.key });
        }
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
    navigate("/tools");
  }, [navigate]);

  const sandboxDoc = tool ? buildSandboxDoc(tool.html_code) : "";
  const dim = isDark ? "text-white/45" : "text-black/45";

  if (status === "error") {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 px-6 ${isDark ? "bg-[#0A0A0B] text-white" : "bg-[#F6F5F2] text-[#17171A]"}`}>
        <div className="text-4xl">🧰</div>
        <h1 className="text-xl font-bold">Tool ochilmadi</h1>
        <p className={`text-sm ${dim}`}>{error}</p>
        <button onClick={exit} className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)]">
          Tools sahifasiga qaytish
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
            <div className="truncate text-sm font-bold">{tool?.title || "Tool"}</div>
            <div className={`truncate text-[11px] ${dim}`}>{tool?.description || ""}</div>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            isDark ? "bg-white/[0.06] hover:bg-white/[0.12]" : "bg-black/[0.05] hover:bg-black/[0.1]"
          }`}
          aria-label="To'liq ekran"
        >
          <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-sm" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        {status === "loading" && (
          <div className={`absolute inset-0 flex items-center justify-center gap-2 text-sm ${dim}`}>
            <FontAwesomeIcon icon={faSpinner} spin />
            Yuklanmoqda...
          </div>
        )}

        {tool && (
          <iframe
            key={id}
            ref={iframeRef}
            title={tool.title}
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
