import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ListeningAnimations from "../components/ListeningAnimations";
import SpeakingQuestionPanel from "../components/SpeakingQuestionPanel";
import SpeakingAudioPanel from "../components/SpeakingAudioPanel";
import {
  buildSegments,
  getSpeakingFeedback,
  buildFeedbackPrompt,
} from "../utils/speakingHelpers";
import { useDebouncedLocalStorage, formatTime } from "../utils/helpers";
import { saveResult } from "../utils/ieltsBand";
import { submitResultSafe } from "../utils/api";
import { setMockActive } from "../utils/mockMode";

const MOCK_TOTAL_DURATION_MS = 15 * 60 * 1000; // Speaking uchun ~15 daqiqa

const IELTSSpeaking = ({ theme }) => {
  const { series, testNum, taskPart } = useParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const draftKey = `ielts_speaking_recordings_${series}_${testNum}_${taskPart}`;
  const transcriptKey = `ielts_speaking_transcripts_${series}_${testNum}_${taskPart}`;
  const mockKey = `ielts_speaking_mock_end_${series}_${testNum}`;

  const [allEntries, setAllEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/json/ielts_speaking_1785135606378.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setAllEntries(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entry = useMemo(() => {
    if (!allEntries) return null;
    const t = taskPart || "1";
    return allEntries.find(
      (d) =>
        String(d.series_id) === String(series) &&
        String(d.test_id) === String(testNum) &&
        String(d.task_part) === String(t),
    );
  }, [allEntries, series, testNum, taskPart]);

  const topics = useMemo(() => entry?.data?.test_text?.topics || [], [entry]);
  const title = useMemo(() => entry?.data?.test_text?.title || "", [entry]);
  const currentPart = Number(taskPart) || 1;

  const segments = useMemo(
    () => buildSegments(topics, currentPart, series, testNum),
    [topics, currentPart, series, testNum],
  );

  const [currentIdx, setCurrentIdx] = useState(0);

  const currentSegment = segments[currentIdx] || null;

  const [recordings, setRecordings] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  useDebouncedLocalStorage(draftKey, recordings);

  const [transcripts, setTranscripts] = useState(() => {
    try {
      const saved = localStorage.getItem(transcriptKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  useDebouncedLocalStorage(transcriptKey, transcripts);

  const [playingId, setPlayingId] = useState(null);
  const [recordingId, setRecordingId] = useState(null);
  const [recordedBlobs, setRecordedBlobs] = useState({});
  const [interimText, setInterimText] = useState("");
  const [liveTranscripts, setLiveTranscripts] = useState({});
  const [audioPlayed, setAudioPlayed] = useState({});

  // ── Mock rejim ──────────────────────────────────────────────────────────
  const [mockMode, setMockMode] = useState(() => {
    try {
      return localStorage.getItem(`mock_active_speaking`) === "true";
    } catch {
      return false;
    }
  });
  const [mockTimeLeft, setMockTimeLeft] = useState(null);

  useEffect(() => {
    setMockActive(mockMode);
    try {
      if (mockMode) {
        localStorage.setItem(`mock_active_speaking`, "true");
      } else {
        localStorage.removeItem(`mock_active_speaking`);
      }
    } catch (err) {
      console.warn('localStorage error:', err.message);
    }
    return () => setMockActive(false);
  }, [mockMode]);

  // Davom etganda (sahifa yangilansa yoki qism o'zgarsa) mock taymerini qayta tiklash
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const playAudio = useCallback(
    (segId, url) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playingId === segId) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingId(null);
        return;
      }
      audio.pause();
      audio.src = url;
      audio.currentTime = 0;
      audio.play();
      setPlayingId(segId);
      setAudioPlayed((prev) => ({ ...prev, [segId]: true }));
    },
    [playingId],
  );

  const handleAudioEnded = useCallback(() => setPlayingId(null), []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(
    async (segId) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setRecordedBlobs((prev) => ({ ...prev, [segId]: url }));
          setRecordings((prev) => ({ ...prev, [segId]: true }));
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        };
        recorder.start();
        setRecordingId(segId);
        setInterimText("");

        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognitionRef.current = recognition;

          recognition.onresult = (event) => {
            let interim = "";
            let newFinal = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                newFinal += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            setTranscripts((prev) => {
              const existing = prev[segId] || "";
              return { ...prev, [segId]: existing + newFinal.trim() + " " };
            });
            setInterimText(interim);
          };

          recognition.onerror = () => {
            /* silent fail */
          };

          recognition.start();
        }
      } catch (err) {
        console.error("Recording error:", err);
        alert("Microphone permission required. Check your browser settings.");
      }
    },
    [],
  );

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    stopSpeechRecognition();
    setRecordingId(null);
    setInterimText("");
  }, [stopSpeechRecognition]);

  const deleteRecording = useCallback((segId) => {
    setRecordedBlobs((prev) => {
      if (prev[segId]) URL.revokeObjectURL(prev[segId]);
      const n = { ...prev };
      delete n[segId];
      return n;
    });
    setRecordings((prev) => {
      const n = { ...prev };
      delete n[segId];
      return n;
    });
    setTranscripts((prev) => {
      const n = { ...prev };
      delete n[segId];
      return n;
    });
  }, []);

  const clearAllRecordings = useCallback(() => {
    if (!window.confirm("Confirm clear all recordings?")) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRecordedBlobs((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
    setRecordings({});
    setTranscripts({});
    setCurrentIdx(0);
    setPlayingId(null);
    setAudioPlayed({});
    setLiveTranscripts({});
    localStorage.removeItem(draftKey);
    localStorage.removeItem(transcriptKey);
  }, [draftKey, transcriptKey]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      stopSpeechRecognition();
    };
  }, [stopSpeechRecognition]);

  const goToPart = useCallback(
    (t) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      setCurrentIdx(0);
      navigate(`/academic/${series}/${testNum}/speaking/${t}`);
    },
    [navigate, series, testNum],
  );

  useEffect(() => {
    if (currentSegment && recordedBlobs[currentSegment.id] && currentIdx < segments.length - 1) {
      const t = setTimeout(() => setCurrentIdx((i) => i + 1), 600);
      return () => clearTimeout(t);
    }
  }, [recordedBlobs, currentSegment?.id, currentIdx, segments.length]);

  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);

  const submitForFeedback = useCallback(async () => {
    const aiFeedbackEnabled = import.meta.env?.VITE_AI_FEEDBACK === "true";
    if (!aiFeedbackEnabled) {
      setFeedbackError("AI feedback hozircha o'chirilgan.");
      return;
    }
    const recordedCount = Object.keys(recordedBlobs).length;
    if (recordedCount === 0) {
      setFeedbackError("Record at least one answer first.");
      return;
    }
    setFeedbackLoading(true);
    setFeedbackResult(null);
    setFeedbackError(null);

    const transcriptParts = [];
    segments.forEach((seg) => {
      const hasTranscript = transcripts[seg.id];
      const userText = hasTranscript
        ? `"${hasTranscript}"`
        : "[audio recorded, no transcript]";
      transcriptParts.push(
        `${seg.label}: ${seg.text}\nTalaba: ${userText}`,
      );
    });
    const transcriptText = transcriptParts.join("\n\n");
    const prompt = buildFeedbackPrompt(transcriptText, currentPart, topics);

    const result = await getSpeakingFeedback(prompt);
    if (result.success) {
      setFeedbackResult(result.data);
      saveResult({
        series: parseInt(series),
        testNum: parseInt(testNum),
        speaking: result.data.overallBand,
      });
      submitResultSafe({
        skill: "speaking",
        series_id: parseInt(series),
        test_num: parseInt(testNum),
        task_part: parseInt(taskPart),
        band: result.data.overallBand,
      }).catch((err) => {
        setFeedbackError(err?.message || "Failed to submit result.");
      });
    } else {
      setFeedbackError("AI evaluation error" + ": " + result.error);
    }
    setFeedbackLoading(false);
  }, [recordedBlobs, transcripts, segments, currentPart, topics, taskPart, series, testNum]);

  if (loading)
    return (
      <div
        className={`min-h-screen p-6 qz-anim-fade-in ${isDark ? "bg-[#0A0A0B]" : "bg-[#F6F5F2]"}`}
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
        className={`p-8 text-red-500 qz-anim-scale-in rounded ${isDark ? "bg-red-900/30" : "bg-red-50"}`}
      >
        <ListeningAnimations />
        {"Error:"} {error}
      </div>
    );

  if (!entry)
    return (
      <div
        className={`p-8 qz-anim-fade-in ${isDark ? "text-white/40" : "text-black/35"}`}
      >
        <ListeningAnimations />
        {"Data not found"}
      </div>
    );

  const recordedCount = Object.keys(recordedBlobs).length;
  const totalSegments = segments.length;

  return (
    <div
      data-ai="speaking-page"
      data-ai-label="Speaking Practice sahifasi"
      className={`min-h-screen flex flex-col qz-anim-fade-in ${isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"}`}
    >
      <ListeningAnimations />

      <div
        className={`flex items-center justify-between gap-4 px-4 py-1.5 border-b text-xs ${
          isDark
            ? "border-white/10 bg-[#0A0A0B]/40 text-white/40"
            : "border-black/[0.08] bg-black/[0.02] text-black/35"
        }`}
      >
        <span>
          {"Speaking"} · Part {currentPart} ·{" "}
          <span className="font-semibold">
            {currentIdx + 1}/{totalSegments}
          </span>
        </span>
        {mockMode ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-yellow-600 dark:text-yellow-400">
              {"Mock"} · {formatTime(mockTimeLeft)}
            </span>
            <button
              onClick={exitMockMode}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-semibold"
            >
              {"Exit"}
            </button>
          </div>
        ) : (
          <button
            onClick={startMockTest}
            className="bg-[var(--accent)] hover:bg-black text-white px-3 py-1 rounded-lg text-xs font-semibold dark:text-[var(--accent-contrast)] dark:hover:opacity-90"
          >
            {"Start Mock"}
          </button>
        )}
        {recordedCount > 0 && !mockMode && (
          <span className="text-green-500">
            {recordedCount}/{totalSegments} {"recorded"}
          </span>
        )}
      </div>

      <main className="flex flex-1 overflow-hidden">
        <SpeakingQuestionPanel
          currentPart={currentPart}
          topics={topics}
          title={title}
          isDark={isDark}
          feedbackResult={feedbackResult}
        />

        <SpeakingAudioPanel
          isDark={isDark}
          currentSegment={currentSegment}
          segments={segments}
          playingId={playingId}
          recordingId={recordingId}
          recordedBlobs={recordedBlobs}
          recordings={recordings}
          transcripts={transcripts}
          interimText={interimText}
          liveTranscripts={liveTranscripts}
          audioPlayed={audioPlayed}
          onPlay={playAudio}
          onStartRecord={startRecording}
          onStopRecord={stopRecording}
          onDelete={deleteRecording}
          onClearAll={clearAllRecordings}
          onToggleLiveTranscript={(segId) =>
            setLiveTranscripts((prev) => ({
              ...prev,
              [segId]: !prev[segId],
            }))
          }
          recordedCount={recordedCount}
          totalCount={totalSegments}
          currentIdx={currentIdx}
          onSubmitFeedback={submitForFeedback}
          feedbackLoading={feedbackLoading}
          feedbackError={feedbackError}
        />
      </main>

      <audio
        ref={audioRef}
        className="hidden"
        onEnded={handleAudioEnded}
        onError={handleAudioEnded}
      />

      <footer
        className={`border-t p-3 flex justify-center gap-3 ${
          isDark
            ? "border-white/10 bg-[#0A0A0B]/50"
            : "border-black/[0.08] bg-black/[0.02]"
        }`}
      >
        {[1, 2, 3].map((t) => (
          <button
            key={t}
            onClick={() => goToPart(t)}
            disabled={mockMode}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-40 ${
              Number(taskPart) === t
                ? "bg-[var(--accent)] text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)]"
                : isDark
                  ? "bg-white/[0.08] text-white/50 hover:bg-white/[0.12]"
                  : "bg-white border border-black/[0.12] text-black/50 hover:bg-black/[0.03]"
            }`}
          >
            Part {t}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default IELTSSpeaking;
