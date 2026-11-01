import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faSearch,
  faSpinner,
  faClock,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const HISTORY_KEY = "dict_search_history";
const MAX_HISTORY = 20;

function DictionaryPage({ theme }) {
  const isDark = theme === "dark";
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const search = (word) => {
    const w = (word || query).trim();
    if (!w) return;
    setQuery(w);
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/dict?sp=${encodeURIComponent(w)}&md=d&max=1`)
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json) && json.length > 0 && json[0].defs?.length) {
          setData(json[0]);
          setHistory((prev) => {
            const filtered = prev.filter(
              (h) => h.toLowerCase() !== w.toLowerCase()
            );
            return [w, ...filtered].slice(0, MAX_HISTORY);
          });
        } else {
          setError("No definition found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("No definition found");
        setLoading(false);
      });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const parseDefs = (defs) =>
    (defs || []).map((d) => {
      const [pos, ...rest] = d.split("\t");
      return { pos, text: rest.join("\t") };
    });

  const inputCls = `w-full rounded-xl border px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition ${
    isDark
      ? "border-white/15 bg-white/5 text-white placeholder-white/30"
      : "border-black/10 bg-white text-[#17171A] placeholder-black/30"
  }`;

  const sectionTitle = (icon, text) => (
    <div className="lib-fly-down mb-5 flex items-center gap-3">
      <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
      <h2
        className={`flex items-center gap-2 text-center text-xl font-bold sm:text-2xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}
      >
        {icon && (
          <FontAwesomeIcon icon={icon} className="text-[var(--accent)]" />
        )}
        {text}
      </h2>
      <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section>
        {sectionTitle(faBook, "Dictionary")}
        <div
          className={`rounded-2xl border p-5 sm:p-6 ${
            isDark
              ? "border-white/10 bg-[#141416]"
              : "border-black/[0.08] bg-white"
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
            className="relative mb-6"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a word and press Enter..."
              className={inputCls}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--accent)]"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-xl text-[var(--accent)]"
              />
            </div>
          )}

          {error && (
            <p
              className={`text-sm text-center py-4 ${
                isDark ? "text-white/50" : "text-black/50"
              }`}
            >
              {error}
            </p>
          )}

          {data && (
            <div
              className={`rounded-xl border p-4 ${
                isDark
                  ? "border-white/10 bg-white/5"
                  : "border-black/10 bg-black/[0.03]"
              }`}
            >
              <p className="text-lg font-bold mb-3">{data.word}</p>
              {parseDefs(data.defs).map((d, i) => (
                <p
                  key={i}
                  className={`text-sm leading-relaxed mb-2 last:mb-0 ${
                    isDark ? "text-white/70" : "text-black/70"
                  }`}
                >
                  <span className="text-[var(--accent)] font-semibold text-xs mr-1 uppercase">
                    {d.pos}
                  </span>
                  {d.text}
                </p>
              ))}
            </div>
          )}

          {!loading && !error && !data && history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold opacity-50">
                  <FontAwesomeIcon icon={faClock} />
                  Recent searches
                </div>
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} /> Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((w) => (
                  <button
                    key={w}
                    onClick={() => search(w)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition hover:border-[var(--accent)] ${
                      isDark
                        ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                        : "border-black/10 bg-black/[0.03] hover:bg-black/[0.06] text-black/70"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && !data && history.length === 0 && (
            <p
              className={`text-sm text-center py-4 ${
                isDark ? "text-white/30" : "text-black/30"
              }`}
            >
              Search for any English word to see its definition.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default DictionaryPage;
