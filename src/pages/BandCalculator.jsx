import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";
import { listeningBand, readingBand, calcOverall, calcWritingBand } from "../utils/ieltsBand";

function BandCalculatorPage({ theme }) {
  const isDark = theme === "dark";
  const [listening, setListening] = useState("");
  const [reading, setReading] = useState("");
  const [readingType, setReadingType] = useState("academic");
  const [task1, setTask1] = useState("");
  const [task2, setTask2] = useState("");

  const listeningNum = Number(listening);
  const readingNum = Number(reading);
  const t1 = Number(task1);
  const t2 = Number(task2);

  const lBand =
    listening !== "" && !isNaN(listeningNum) ? listeningBand(listeningNum) : null;
  const rBand =
    reading !== "" && !isNaN(readingNum)
      ? readingBand(readingNum, readingType)
      : null;
  const wBand = calcWritingBand(t1, t2);
  const overall = calcOverall([lBand, rBand, wBand].filter((b) => b != null));

  const inputCls = `w-24 rounded-lg border px-2 py-1.5 text-sm focus:outline-none ${
    isDark
      ? "border-white/15 bg-white/5 text-white"
      : "border-black/10 bg-white text-[#17171A]"
  }`;

  const sectionTitle = (icon, text) => (
    <div className="lib-fly-down mb-5 flex items-center gap-3">
      <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
      <h2
        className={`flex items-center gap-2 text-center text-xl font-bold sm:text-2xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}
      >
        {icon && <FontAwesomeIcon icon={icon} className="text-[var(--accent)]" />}
        {text}
      </h2>
      <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <section>
        {sectionTitle(faCalculator, "Band Calculator")}
        <div
          className={`rounded-2xl border p-5 sm:p-6 ${
            isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
          }`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-70">
                  Listening (correct answers: 0–40)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={listening}
                  onChange={(e) => setListening(e.target.value)}
                  className={inputCls}
                  placeholder="0–40"
                />
                {lBand != null && (
                  <p className="text-sm font-bold text-emerald-500">
                    Band: {lBand.toFixed(1)}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-70">
                  Reading (correct answers: 0–40)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={reading}
                    onChange={(e) => setReading(e.target.value)}
                    className={inputCls}
                    placeholder="0–40"
                  />
                  <select
                    value={readingType}
                    onChange={(e) => setReadingType(e.target.value)}
                    className={`rounded-lg border px-2 py-1.5 text-sm focus:outline-none ${
                      isDark
                        ? "border-white/15 bg-white/5 text-white"
                        : "border-black/10 bg-white text-[#17171A]"
                    }`}
                  >
                    <option value="academic">Academic</option>
                    <option value="general">General</option>
                  </select>
                </div>
                {rBand != null && (
                  <p className="text-sm font-bold text-emerald-500">
                    Band: {rBand.toFixed(1)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-70">
                  Writing Task 1 (band 0–9)
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  step="0.5"
                  value={task1}
                  onChange={(e) => setTask1(e.target.value)}
                  className={inputCls}
                  placeholder="0–9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold opacity-70">
                  Writing Task 2 (band 0–9)
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  step="0.5"
                  value={task2}
                  onChange={(e) => setTask2(e.target.value)}
                  className={inputCls}
                  placeholder="0–9"
                />
              </div>
            </div>

            {(lBand != null || rBand != null || wBand != null) && (
              <div
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/[0.03]"
                }`}
              >
                <div className="text-sm font-semibold opacity-70">Overall Band</div>
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {overall != null ? overall.toFixed(1) : "—"}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default BandCalculatorPage;