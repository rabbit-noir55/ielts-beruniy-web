import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faSpinner } from "@fortawesome/free-solid-svg-icons";

const WordDefinitionPopup = ({ word, position, onClose, isDark }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!word) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/dict?sp=${encodeURIComponent(word)}&md=d&max=1`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (Array.isArray(json) && json.length > 0 && json[0].defs?.length) {
          setData(json[0]);
        } else {
          setError("No definition found");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No definition found");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [word]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const left = Math.max(10, Math.min(position.x, window.innerWidth - 320));
  const popupTop = Math.min(position.y + 24, window.innerHeight - 340);

  const parseDefs = (defs) =>
    (defs || []).map((d) => {
      const [pos, ...rest] = d.split("\t");
      return { pos, text: rest.join("\t") };
    });

  return (
    <div
      ref={popupRef}
      className={`fixed z-[200] w-72 max-h-[300px] flex flex-col rounded-xl shadow-2xl border qz-anim-pop-in ${
        isDark ? "border-white/15 bg-[#1a1a1f]" : "border-black/10 bg-white"
      }`}
      style={{ left, top: popupTop }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b shrink-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          Dictionary
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
        </button>
      </div>

      <div className="overflow-y-auto px-4 py-3 min-h-0 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-[var(--accent)]"
            />
          </div>
        )}

        {error && (
          <p className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
            {error}
          </p>
        )}

        {data && (
          <div>
            <p className="text-base font-bold mb-2">{data.word}</p>
            {parseDefs(data.defs).map((d, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed mb-2 last:mb-0 ${
                  isDark ? "text-white/70" : "text-black/70"
                }`}
              >
                <span className="text-[var(--accent)] font-semibold text-xs mr-1">
                  {d.pos}
                </span>
                {d.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordDefinitionPopup;
