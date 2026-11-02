import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faSpinner,
  faRandom,
  faCheckCircle,
  faPenToSquare,
  faComments,
  faAudioDescription,
} from "@fortawesome/free-solid-svg-icons";
import {
  getToolFeedback,
  buildWritingGeneratorPrompt,
  buildSpeakingGeneratorPrompt,
  buildSpeakingCheckerPrompt,
  buildRandomGeneratorPrompt,
  cleanTaskText,
} from "../utils/aiTools";
import { getWritingFeedback } from "../utils/aiWritingFeedback";
import { getSpeakingFeedback } from "../utils/speakingHelpers";
import { getUser } from "../utils/api";

const AI_COUNT_KEY = "ielts_ai_tools_count";

function getAiUsageToday() {
  return Number(localStorage.getItem(AI_COUNT_KEY) || 0);
}
function incrementAiUsage() {
  const next = getAiUsageToday() + 1;
  localStorage.setItem(AI_COUNT_KEY, String(next));
  return next;
}

const TABS = [
  { key: "wc", label: "Writing Checker", icon: faCheckCircle },
  { key: "wg", label: "Writing Generator", icon: faPenToSquare },
  { key: "sc", label: "Speaking Checker", icon: faComments },
  { key: "sg", label: "Speaking Generator", icon: faAudioDescription },
  { key: "random", label: "Random Task Generator", icon: faRandom },
];

const WRITING_TASKS = [
  { key: "report", label: "Task 1 Report" },
  { key: "letter", label: "Task 1 Letter" },
  { key: "essay", label: "Task 2 Essay" },
];

const SPEAKING_PARTS = [1, 2, 3];

function BandBadge({ band, size = "md" }) {
  if (!band && band !== 0) return null;
  const s = size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-sm";
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-[var(--accent)] font-bold text-[var(--accent-contrast)] ${s}`}>
      {band}
    </span>
  );
}

function ResultCard({ data, type, isDark }) {
  if (!data) return null;
  const cardCls = isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white";

  if (type === "writing" || type === "speaking") {
    const criteria = type === "writing"
      ? [
          { key: "taskAchievement", label: "Task Achievement" },
          { key: "coherenceCohesion", label: "Coherence & Cohesion" },
          { key: "lexicalResource", label: "Lexical Resource" },
          { key: "grammaticalRange", label: "Grammatical Range" },
        ]
      : [
          { key: "fluencyAndCoherence", label: "Fluency & Coherence" },
          { key: "lexicalResource", label: "Lexical Resource" },
          { key: "grammaticalRange", label: "Grammatical Range" },
          { key: "pronunciation", label: "Pronunciation" },
        ];

    return (
      <div className={`rounded-2xl border p-5 ${cardCls}`}>
        <div className="mb-4 flex items-center gap-3">
          <BandBadge band={data.overallBand} />
          <span className="text-sm font-bold">Overall Band</span>
        </div>
        {data.summary && (
          <p className="mb-4 text-sm text-black/60 dark:text-white/60">{data.summary}</p>
        )}
        <div className="space-y-2">
          {criteria.map(({ key, label }) => {
            const item = data[key];
            if (!item) return null;
            return (
              <div key={key} className="flex items-start gap-3">
                <BandBadge band={item.band} size="sm" />
                <div>
                  <p className="text-xs font-bold">{label}</p>
                  <p className="text-xs text-black/50 dark:text-white/50">{item.comment}</p>
                </div>
              </div>
            );
          })}
        </div>
        {data.strengths?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-bold text-emerald-500">Strengths</p>
            <ul className="list-inside list-disc text-xs text-black/60 dark:text-white/60">
              {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {data.improvements?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-bold text-amber-500">Improvements</p>
            <ul className="list-inside list-disc text-xs text-black/60 dark:text-white/60">
              {data.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {data.modelAnswer && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="mb-1 text-xs font-bold text-emerald-500">Model Answer</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed">{data.modelAnswer}</p>
          </div>
        )}
      </div>
    );
  }

  if (type === "random") {
    return (
      <div className={`rounded-2xl border p-5 ${cardCls}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold text-[var(--accent)]">
            {data.type || "task"}
          </span>
          {data.title && <span className="text-sm font-bold">{data.title}</span>}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.task}</p>
      </div>
    );
  }

  return null;
}

export default function AiTools({ theme }) {
  const isDark = theme === "dark";

  const [tab, setTab] = useState("wc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiCount, setAiCount] = useState(() => getAiUsageToday());
  const aiLimit = getUser()?.group_detail?.parameters?.ai_limit || 2;
  const limitReached = aiCount >= aiLimit;

  // Writing Checker state
  const [wcTaskType, setWcTaskType] = useState("essay");
  const [wcTaskText, setWcTaskText] = useState("");
  const [wcAnswer, setWcAnswer] = useState("");
  const [wcResult, setWcResult] = useState(null);

  // Writing Generator state
  const [wgTaskType, setWgTaskType] = useState("essay");
  const [wgTaskText, setWgTaskText] = useState("");
  const [wgResult, setWgResult] = useState(null);

  // Speaking Checker state
  const [scPart, setScPart] = useState(1);
  const [scQuestion, setScQuestion] = useState("");
  const [scAnswer, setScAnswer] = useState("");
  const [scResult, setScResult] = useState(null);

  // Speaking Generator state
  const [sgPart, setSgPart] = useState(1);
  const [sgQuestion, setSgQuestion] = useState("");
  const [sgResult, setSgResult] = useState(null);

  // Random state
  const [randomResult, setRandomResult] = useState(null);

  const runWithLimit = async (fn) => {
    if (limitReached) {
      setError("Daily AI limit reached. Try again tomorrow.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fn();
      if (res.success) {
        setAiCount(incrementAiUsage());
      }
      return res;
    } catch (e) {
      setError(e.message || "Unexpected error.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const checkWriting = async () => {
    if (!wcTaskText.trim() || !wcAnswer.trim()) return;
    setWcResult(null);
    const res = await runWithLimit(() =>
      getWritingFeedback({
        taskPart: wcTaskType === "essay" ? 2 : 1,
        requirementText: wcTaskText,
        essayText: wcAnswer,
      })
    );
    if (res?.success) setWcResult(res.data);
    else if (res) setError(res.error || "Failed.");
  };

  const generateWriting = async () => {
    if (!wgTaskText.trim()) return;
    setWgResult(null);
    const prompt = buildWritingGeneratorPrompt(wgTaskType, wgTaskText);
    const res = await runWithLimit(() => getToolFeedback(prompt));
    if (res?.success && res.data) {
      const d = typeof res.data === "object" ? res.data : { answer: res.data };
      setWgResult(d);
    } else if (res) setError(res.error || "Failed.");
  };

  const checkSpeaking = async () => {
    if (!scQuestion.trim() || !scAnswer.trim()) return;
    setScResult(null);
    const prompt = buildSpeakingCheckerPrompt(scPart, scQuestion, scAnswer);
    const res = await runWithLimit(() => getSpeakingFeedback(prompt));
    if (res?.success) setScResult(res.data);
    else if (res) setError(res.error || "Failed.");
  };

  const generateSpeaking = async () => {
    if (!sgQuestion.trim()) return;
    setSgResult(null);
    const prompt = buildSpeakingGeneratorPrompt(sgPart, sgQuestion);
    const res = await runWithLimit(() => getToolFeedback(prompt));
    if (res?.success && res.data) {
      const d = typeof res.data === "object" ? res.data : { answer: res.data };
      setSgResult(d);
    } else if (res) setError(res.error || "Failed.");
  };

  const generateRandom = async () => {
    setRandomResult(null);
    const prompt = buildRandomGeneratorPrompt();
    const res = await runWithLimit(() => getToolFeedback(prompt));
    if (res?.success && res.data) {
      const d = typeof res.data === "object" ? res.data : { task: String(res.data) };
      d.task = cleanTaskText(d.task);
      setRandomResult(d);
    } else if (res) setError(res.error || "Failed.");
  };

  const inputCls = isDark
    ? "border-white/10 bg-[#0A0A0B] text-[#F5F5F5] placeholder-white/30"
    : "border-black/10 bg-[#F6F5F2] text-[#17171A] placeholder-black/30";
  const cardCls = isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white";

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}>
      <div className="flex min-h-screen flex-col pt-24 lg:flex-row">
        {/* Sidebar — always on left */}
        <aside className={`w-full flex-shrink-0 border-b p-3 lg:w-56 lg:border-r lg:border-b-0 ${isDark ? "border-white/10" : "border-black/10"}`}>
          <div className="mb-4">
            <p className="text-xs font-bold text-black/40 dark:text-white/40">Daily AI Limit</p>
            <p className="mt-1 text-[10px] text-black/30 dark:text-white/30">Shared across all AI tools</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${limitReached ? "bg-red-500" : "bg-[var(--accent)]"}`}
                  style={{ width: `${Math.min((aiCount / aiLimit) * 100, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${limitReached ? "text-red-500" : ""}`}>
                {aiCount}/{aiLimit}
              </span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex w-auto items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
                  tab === t.key
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : isDark
                      ? "text-white/50 hover:bg-white/5"
                      : "text-black/50 hover:bg-black/5"
                }`}
              >
                <FontAwesomeIcon icon={t.icon} className="w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Writing Checker */}
          {tab === "wc" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <h2 className="text-xl font-extrabold">Writing Checker</h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Grade your essay/response against IELTS criteria — get band score, corrections and an optimized version.
              </p>
              <div className="flex flex-wrap gap-2">
                {WRITING_TASKS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setWcTaskType(t.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      wcTaskType === t.key
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-black/50 dark:text-white/50">Task (requirement)</label>
                <textarea
                  value={wcTaskText}
                  onChange={(e) => setWcTaskText(e.target.value)}
                  rows={3}
                  placeholder="The chart below shows..."
                  className={`w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)] ${inputCls}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-black/50 dark:text-white/50">Your answer</label>
                <textarea
                  value={wcAnswer}
                  onChange={(e) => setWcAnswer(e.target.value)}
                  rows={10}
                  placeholder="Write your report / letter / essay here..."
                  className={`w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)] ${inputCls}`}
                />
              </div>
              <button
                onClick={checkWriting}
                disabled={loading || limitReached || !wcTaskText.trim() || !wcAnswer.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faWandMagicSparkles} className={loading ? "animate-spin" : ""} />
                Check answer
              </button>
              <ResultCard data={wcResult} type="writing" isDark={isDark} />
            </div>
          )}

          {/* Writing Generator */}
          {tab === "wg" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <h2 className="text-xl font-extrabold">Writing Generator</h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Generate a Band 9 model answer with AI.
              </p>
              <div className="flex flex-wrap gap-2">
                {WRITING_TASKS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setWgTaskType(t.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      wgTaskType === t.key
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-black/50 dark:text-white/50">Task (requirement)</label>
                <textarea
                  value={wgTaskText}
                  onChange={(e) => setWgTaskText(e.target.value)}
                  rows={4}
                  placeholder="The chart below shows..."
                  className={`w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)] ${inputCls}`}
                />
              </div>
              <button
                onClick={generateWriting}
                disabled={loading || limitReached || !wgTaskText.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faWandMagicSparkles} className={loading ? "animate-spin" : ""} />
                Generate Band 9 answer
              </button>
              {wgResult?.answer && (
                <div className={`rounded-2xl border p-5 ${cardCls}`}>
                  <p className="mb-1 text-xs font-bold text-[var(--accent)]">Model Answer</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{wgResult.answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Speaking Checker */}
          {tab === "sc" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <h2 className="text-xl font-extrabold">Speaking Checker</h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Grade your spoken response — fluency, lexical resource, grammar and pronunciation.
              </p>
              <div className="flex flex-wrap gap-2">
                {SPEAKING_PARTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setScPart(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      scPart === p
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50"
                    }`}
                  >
                    Part {p}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-black/50 dark:text-white/50">Question</label>
                <textarea
                  value={scQuestion}
                  onChange={(e) => setScQuestion(e.target.value)}
                  rows={3}
                  placeholder="Paste the speaking question / cue card here..."
                  className={`w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)] ${inputCls}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-black/50 dark:text-white/50">Your answer</label>
                <textarea
                  value={scAnswer}
                  onChange={(e) => setScAnswer(e.target.value)}
                  rows={8}
                  placeholder="Type or paste your spoken response here..."
                  className={`w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)] ${inputCls}`}
                />
              </div>
              <button
                onClick={checkSpeaking}
                disabled={loading || limitReached || !scQuestion.trim() || !scAnswer.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faWandMagicSparkles} className={loading ? "animate-spin" : ""} />
                Check answer
              </button>
              <ResultCard data={scResult} type="speaking" isDark={isDark} />
            </div>
          )}

          {/* Speaking Generator */}
          {tab === "sg" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <h2 className="text-xl font-extrabold">Speaking Generator</h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Generate a Band 9 model spoken response with AI.
              </p>
              <div className="flex flex-wrap gap-2">
                {SPEAKING_PARTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSgPart(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      sgPart === p
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : isDark ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50"
                    }`}
                  >
                    Part {p}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-black/50 dark:text-white/50">Question / cue card</label>
                <textarea
                  value={sgQuestion}
                  onChange={(e) => setSgQuestion(e.target.value)}
                  rows={4}
                  placeholder="Paste the speaking question or cue card here..."
                  className={`w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)] ${inputCls}`}
                />
              </div>
              <button
                onClick={generateSpeaking}
                disabled={loading || limitReached || !sgQuestion.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faWandMagicSparkles} className={loading ? "animate-spin" : ""} />
                Generate Band 9 answer
              </button>
              {sgResult?.answer && (
                <div className={`rounded-2xl border p-5 ${cardCls}`}>
                  <p className="mb-1 text-xs font-bold text-[var(--accent)]">Model Answer</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{sgResult.answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Random Task Generator */}
          {tab === "random" && (
            <div className="mx-auto max-w-2xl space-y-4">
              <h2 className="text-xl font-extrabold">Random Task Generator</h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                AI generates a random IELTS task (Writing or Speaking) for you.
                <br />
                <span className="text-xs">AI randomly selects the topic and task type — just click the button.</span>
              </p>
              <button
                onClick={generateRandom}
                disabled={loading || limitReached}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faRandom} className={loading ? "animate-spin" : ""} />
                Generate random task
              </button>
              <ResultCard data={randomResult} type="random" isDark={isDark} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
