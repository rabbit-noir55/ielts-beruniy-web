import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";

function WordCounterPage({ theme }) {
  const isDark = theme === "dark";
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    return { words, chars, charsNoSpace };
  }, [text]);

  const cardCls = `rounded-xl border p-4 text-center ${
    isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/[0.03]"
  }`;

  const sectionTitle = (icon, textTitle) => (
    <div className="lib-fly-down mb-5 flex items-center gap-3">
      <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
      <h2
        className={`flex items-center gap-2 text-center text-xl font-bold sm:text-2xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}
      >
        {icon && <FontAwesomeIcon icon={icon} size="lg" className="text-[var(--accent)]" />}
        {textTitle}
      </h2>
      <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section>
        {sectionTitle(faFileLines, "Word Counter")}
        <div
          className={`rounded-2xl border p-5 sm:p-6 ${
            isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
          }`}
        >
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              rows={6}
              className={`w-full resize-y rounded-xl border p-3 text-sm focus:outline-none ${
                isDark
                  ? "border-white/15 bg-white/5 text-white placeholder-white/30"
                  : "border-black/10 bg-white text-[#17171A] placeholder-black/30"
              }`}
            />
            <div className="grid grid-cols-3 gap-3">
              <div className={cardCls}>
                <div className="text-2xl font-bold text-[var(--accent)]">{stats.words}</div>
                <div className="text-xs font-semibold opacity-60">Words</div>
              </div>
              <div className={cardCls}>
                <div className="text-2xl font-bold text-[var(--accent)]">{stats.chars}</div>
                <div className="text-xs font-semibold opacity-60">Characters</div>
              </div>
              <div className={cardCls}>
                <div className="text-2xl font-bold text-[var(--accent)]">{stats.charsNoSpace}</div>
                <div className="text-xs font-semibold opacity-60">Characters (no spaces)</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WordCounterPage;