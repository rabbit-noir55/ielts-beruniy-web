import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ListeningAnimations from "../components/ListeningAnimations";
import WritingControlPanel from "../components/WritingControlPanel";
import WritingFeedbackPanel from "../components/WritingFeedbackPanel";
import { useDebouncedLocalStorage } from "../utils/helpers";
import { saveResult } from "../utils/ieltsBand";
import { submitResultSafe } from "../utils/api";
import { setMockActive } from "../utils/mockMode";
import { getWritingFeedback, imageUrlToBase64 } from "../utils/aiWritingFeedback";

const HEADER_SAFE_Y = 112;
const MOCK_TOTAL_DURATION_MS = 60 * 60 * 1000;

const normalDurationFor = (taskPart) => (Number(taskPart) === 1 ? 20 : 40) * 60;

const IELTSWriting = ({ theme }) => {
  const { series, testNum, taskPart } = useParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const dragHandleRef = useRef(null);
  const mockAnimTimeout = useRef(null);

  const draftKey = `ielts_writing_draft_${series}_${testNum}_${taskPart}`;
  const mockKey = `ielts_writing_mock_end_${series}_${testNum}`;

  const [allEntries, setAllEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/json/jumpinto_ielts_writing_academic.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setAllEntries(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const entry = useMemo(() => {
    if (!allEntries) return null;
    return allEntries.find(
      (d) =>
        String(d.series_id) === String(series) &&
        String(d.test_id) === String(testNum) &&
        String(d.task_part) === String(taskPart),
    );
  }, [allEntries, series, testNum, taskPart]);

  const testText = entry?.data?.test_text || {};
  const requirementText = (testText.requirement || []).join("\n\n");
  const imageFileName = testText.image ? testText.image.split("/").pop() : null;
  const isTask1 = Number(taskPart) === 1;
  const minWords = isTask1 ? 150 : 250;

  const [essayText, setEssayText] = useState("");
  useDebouncedLocalStorage(draftKey, essayText);
  const [showSample, setShowSample] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      setEssayText(saved ? JSON.parse(saved) : "");
    } catch {
      setEssayText("");
    }
    setShowSample(false);
  }, [draftKey]);

  const wordCount = useMemo(
    () => essayText.trim().split(/\s+/).filter(Boolean).length,
    [essayText],
  );

  const [controlPosition, setControlPosition] = useState({
    x: 20,
    y: HEADER_SAFE_Y,
  });
  const [isDraggingControl, setIsDraggingControl] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleControlDragStart = useCallback(
    (e) => {
      if (
        !dragHandleRef.current?.contains(e.target) &&
        e.target !== dragHandleRef.current
      )
        return;
      e.preventDefault();
      setIsDraggingControl(true);
      setDragOffset({
        x: e.clientX - controlPosition.x,
        y: e.clientY - controlPosition.y,
      });
    },
    [controlPosition],
  );

  useEffect(() => {
    if (!isDraggingControl) return;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    const move = (e) => {
      setControlPosition({
        x: Math.max(
          0,
          Math.min(window.innerWidth - 320, e.clientX - dragOffset.x),
        ),
        y: Math.max(
          HEADER_SAFE_Y,
          Math.min(window.innerHeight - 100, e.clientY - dragOffset.y),
        ),
      });
    };
    const end = () => setIsDraggingControl(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
    };
  }, [isDraggingControl, dragOffset]);

  const [normalTimeLeft, setNormalTimeLeft] = useState(() =>
    normalDurationFor(taskPart),
  );
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setNormalTimeLeft(normalDurationFor(taskPart));
    setTimerRunning(false);
  }, [taskPart]);

  const [mockMode, setMockMode] = useState(() => {
    try {
      return localStorage.getItem(`mock_active_writing`) === "true";
    } catch {
      return false;
    }
  });
  const [mockTimeLeft, setMockTimeLeft] = useState(null);

  useEffect(() => {
    setMockActive(mockMode);
    try {
      if (mockMode) {
        localStorage.setItem(`mock_active_writing`, "true");
      } else {
        localStorage.removeItem(`mock_active_writing`);
      }
    } catch (err) {
      console.warn('localStorage error:', err.message);
    }
    return () => setMockActive(false);
  }, [mockMode]);

  useEffect(() => {
    if (mockMode || !timerRunning) return;
    const t = window.setInterval(() => {
      setNormalTimeLeft((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [mockMode, timerRunning]);

  const startTimer = useCallback(() => setTimerRunning(true), []);
  const pauseTimer = useCallback(() => setTimerRunning(false), []);
  const restartTimer = useCallback(() => {
    setNormalTimeLeft(normalDurationFor(taskPart));
    setTimerRunning(false);
  }, [taskPart]);

  useEffect(() => {
    const storedEnd = Number(localStorage.getItem(mockKey));
    if (storedEnd) {
      const remain = Math.round((storedEnd - Date.now()) / 1000);
      if (remain > 0) {
        setMockMode(true);
        setMockTimeLeft(remain);
      } else {
        localStorage.removeItem(mockKey);
      }
    }
  }, [series, testNum, taskPart]);

  useEffect(() => {
    if (!mockMode) return;
    const t = window.setInterval(() => {
      const storedEnd = Number(localStorage.getItem(mockKey));
      const remain = Math.round((storedEnd - Date.now()) / 1000);
      if (remain <= 0) {
        window.clearInterval(t);
        localStorage.removeItem(mockKey);
        setMockMode(false);
        setMockTimeLeft(0);
        return;
      }
      setMockTimeLeft(remain);
    }, 1000);
    return () => window.clearInterval(t);
  }, [mockMode]);

  const startMockTest = useCallback(() => {
    const endTime = Date.now() + MOCK_TOTAL_DURATION_MS;
    localStorage.setItem(mockKey, String(endTime));
    setMockMode(true);
    setMockTimeLeft(Math.round(MOCK_TOTAL_DURATION_MS / 1000));
  }, [mockKey]);

  const exitMockMode = useCallback(() => {
    localStorage.removeItem(mockKey);
    setMockMode(false);
    setMockTimeLeft(null);
  }, [mockKey]);

  useEffect(() => () => clearTimeout(mockAnimTimeout.current), []);

  const timerSeconds = mockMode ? mockTimeLeft : normalTimeLeft;
  const timerIsLow = mockMode ? timerSeconds <= 300 : timerSeconds <= 120;

  const goToTask = useCallback(
    (t) => navigate(`/academic/${series}/${testNum}/writing/${t}`),
    [navigate, series, testNum],
  );

  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);

  const dismissFeedback = useCallback(() => {
    setFeedbackResult(null);
    setFeedbackError(null);
  }, []);

  const submitForFeedback = useCallback(async () => {
    if (wordCount < 10) return;

    setFeedbackLoading(true);
    setFeedbackResult(null);
    setFeedbackError(null);

    try {
      let image = null;
      if (isTask1 && imageFileName) {
        try {
          image = await imageUrlToBase64(`/images/${imageFileName}`);
        } catch (imgErr) {
          console.error("[AI Feedback] Rasm yuklanmadi:", imgErr.message);
          image = null;
        }
      }

      const res = await getWritingFeedback({
        taskPart: Number(taskPart),
        requirementText,
        essayText,
        image,
      });

      if (res.success) {
        setFeedbackResult({ ...res.data, aiDetection: res.aiDetection });
        saveResult({
          series: parseInt(series),
          testNum: parseInt(testNum),
          writingTask: {
            taskPart: Number(taskPart),
            band: res.data.overallBand,
          },
        });
        await submitResultSafe({
          skill: "writing",
          series_id: parseInt(series),
          test_num: parseInt(testNum),
          task_part: Number(taskPart),
          band: res.data.overallBand,
        });
      } else {
        setFeedbackError(res.error || "An unknown error occurred.");
      }
    } catch (err) {
      setFeedbackError("Unexpected error:" + " " + err.message);
    } finally {
      setFeedbackLoading(false);
    }
  }, [
    wordCount,
    isTask1,
    imageFileName,
    taskPart,
    requirementText,
    essayText,
  ]);

  if (loading)
    return (
      <div
        className={`min-h-screen p-6 qz-anim-fade-in ${isDark ? "bg-[#0A0A0B]" : "bg-white"}`}
      >
        <ListeningAnimations />
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="w-40 h-4 qz-skeleton" />
          <div className="flex gap-6">
            <div className="w-1/2 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 qz-skeleton"
                  style={{ width: `${85 - (i % 3) * 12}%` }}
                />
              ))}
            </div>
            <div className="w-1/2 h-64 rounded-xl qz-skeleton" />
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div
        className={`p-8 text-red-500 qz-anim-scale-in ${isDark ? "bg-red-900/50" : "bg-red-50"} rounded`}
      >
        <ListeningAnimations />
        {"An error occurred"}: {error}
      </div>
    );
  if (!entry)
    return (
      <div
        className={`p-8 qz-anim-fade-in ${isDark ? "text-white/40" : "text-black/40"}`}
      >
        <ListeningAnimations />
        {"Data not found"}
      </div>
    );

  return (
    <div
      data-ai="writing-page"
      data-ai-label="Writing Practice sahifasi"
      className={`min-h-screen md:h-screen flex flex-col pb-14 md:pb-0 qz-anim-fade-in ${isDark ? "bg-[#141416] text-[#F5F5F5]" : "bg-white text-[#17171A]"}`}
    >
      <ListeningAnimations />

      <WritingControlPanel
        position={controlPosition}
        dragHandleRef={dragHandleRef}
        onDragStart={handleControlDragStart}
        isDragging={isDraggingControl}
        mockMode={mockMode}
        timerSeconds={timerSeconds}
        timerIsLow={timerIsLow}
        timerRunning={timerRunning}
        onStart={startTimer}
        onPause={pauseTimer}
        onRestart={restartTimer}
        onStartMock={startMockTest}
        onExitMock={exitMockMode}
      />

      <div
        className={`flex items-center justify-between gap-4 px-4 py-1.5 border-b text-xs ${
          isDark
            ? "border-white/10 bg-[#141416]/40 text-white/40"
            : "border-black/[0.08] bg-black/[0.02] text-black/40"
        }`}
      >
        <span>{"Writing · Task"} {taskPart}</span>
      </div>

      <main className="flex flex-col md:flex-row md:flex-1 md:overflow-hidden overflow-y-auto">
        {/* Chap panel — topshiriq matni + rasm + namuna javob */}
        <div
          className="w-full md:w-1/2 overflow-y-auto md:border-r p-4 md:p-6"
          style={{ borderRightColor: isDark ? "#334155" : "#e5e7eb" }}
        >
          <h1 className="text-2xl font-bold mb-1">{"TASK"} {taskPart}</h1>
          <p
            className={`text-sm mb-4 ${isDark ? "text-white/40" : "text-black/40"}`}
          >
            {isTask1 ? "You should spend about 20 minutes on this task." : "You should spend about 40 minutes on this task."}
          </p>

          <div
            className={`rounded-lg border p-4 mb-4 font-semibold italic ${
              isDark
                ? "border-white/10 bg-[#141416]/40"
                : "border-black/[0.12] bg-black/[0.02]"
            }`}
          >
            {requirementText.split("\n\n").map((p, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>
                {p}
              </p>
            ))}
          </div>

          <p
            className={`text-sm mb-4 ${isDark ? "text-white/40" : "text-black/40"}`}
          >
            {"Write at least {n} words.".replace("{n}", minWords)}
          </p>

          {isTask1 && imageFileName && (
            <div
              className={`rounded-md border p-3 mb-4 qz-anim-fade-in ${isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.12] bg-white"}`}
            >
              <img
                src={`/images/${imageFileName}`}
                alt={"Task 1 diagram/chart"}
                className="max-w-full h-auto rounded mx-auto"
              />
            </div>
          )}

          {/* Namuna javob */}
          {testText.sample?.length > 0 && (
            <div
              className={`rounded-lg border mt-6 ${isDark ? "border-white/10" : "border-black/[0.08]"}`}
            >
              <button
                onClick={() => setShowSample((p) => !p)}
                className={`qz-btn w-full flex items-center justify-between px-4 py-3 text-sm font-semibold ${
                  isDark ? "hover:bg-[#141416]" : "hover:bg-black/[0.02]"
                }`}
              >
                {"Sample Writing Answer"}
                {showSample ? <FontAwesomeIcon icon={faChevronUp} size="lg" /> : <FontAwesomeIcon icon={faChevronDown} size="lg" />}
              </button>
              {showSample && (
                <div className="px-4 pb-4 space-y-3 text-sm leading-relaxed qz-anim-fade-in">
                  {testText.title && (
                    <h3 className="text-base font-bold">{testText.title}</h3>
                  )}
                  {testText.sample.map((p, i) => (
                    <p
                      key={i}
                      className={isDark ? "text-white/50" : "text-black/50"}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* O'ng panel — yozish maydoni + pastida AI Feedback */}
        <div className="w-full md:w-1/2 overflow-y-auto p-4 md:p-6">
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder={"Please input"}
            className={`w-full min-h-[340px] resize-y rounded-lg border p-4 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors ${
              isDark
                ? "bg-[#141416] border-white/15 text-[#F5F5F5] placeholder-white/50"
                : "bg-white border-black/[0.12] text-[#17171A] placeholder-black/40"
            }`}
          />
          <div className="flex items-center justify-between mt-3">
            <span
              className={`text-sm font-medium ${
                wordCount < minWords
                  ? isDark
                    ? "text-amber-400"
                    : "text-amber-600"
                  : isDark
                    ? "text-green-400"
                    : "text-green-600"
              }`}
            >
              {"Words:"} {wordCount}{" "}
              {wordCount < minWords && `(${"at least"} ${minWords} ${"needed"})`}
            </span>
            <button
              onClick={submitForFeedback}
              disabled={wordCount < 10 || feedbackLoading}
              className="qz-btn flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold text-sm"
            >
              <FontAwesomeIcon icon={faPaperPlane} size="lg" /> {"Submit for Feedback"}
            </button>
          </div>

          <WritingFeedbackPanel
            isDark={isDark}
            loading={feedbackLoading}
            result={feedbackResult}
            errorMessage={feedbackError}
            onDismiss={dismissFeedback}
          />
        </div>
      </main>

      <footer
        className={`border-t p-3 flex justify-center gap-3 ${isDark ? "border-white/10 bg-[#141416]/50" : "border-black/[0.08] bg-black/[0.02]"}`}
      >
        {[1, 2].map((t) => (
          <button
            key={t}
            onClick={() => goToTask(t)}
            className={`qz-btn px-4 py-1.5 rounded-lg text-sm font-semibold ${
              Number(taskPart) === t
                ? "bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)]"
                : isDark
                  ? "bg-white/10 text-white/50 hover:bg-white/15"
                  : "bg-white border border-black/[0.12] text-black/50 hover:bg-black/[0.02]"
            }`}
          >
            Task {t}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default IELTSWriting;
