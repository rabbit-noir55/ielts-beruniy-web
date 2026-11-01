import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import AudioPlayer from "../components/AudioPlayer";
import MockAudioPlayer from "../components/MockAudioPlayer";
import ListeningAnimations from "../components/ListeningAnimations";
import ListeningTextSelectionMenu from "../components/ListeningTextSelectionMenu";
import ListeningNoteEditor from "../components/ListeningNoteEditor";
import ListeningHighlightPopup from "../components/ListeningHighlightPopup";
import ListeningTranscriptPanel from "../components/ListeningTranscriptPanel";
import ListeningQuestionsPanel from "../components/ListeningQuestionsPanel";
import ListeningResultsModal from "../components/ListeningResultsModal";
import { fetchOurMock, getPreviewToken } from "../utils/ourMockApi";
import {
  parseAnswers,
  splitAlternatives,
  useDebouncedLocalStorage,
  wrapRangeTextNodes,
} from "../utils/helpers";
import { listeningBand, saveResult, getCumulativeRaw } from "../utils/ieltsBand";
import { submitResultSafe } from "../utils/api";
import { DEFAULT_HIGHLIGHT } from "../utils/highlightColors";
import { setMockActive } from "../utils/mockMode";
import { normalizeOurMocksListening } from "../utils/normalizeOurMocks";

const IELTSListening = ({ theme, isOurMockRoute }) => {
  const { series, testNum, partNum } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const isOurMock = isOurMockRoute === true;

  // DOM refs
  const audioRef = useRef(null);
  const questionRefs = useRef({});
  const transcriptRef = useRef(null);
  const dragHandleRef = useRef(null);
  const questionsContainerRef = useRef(null);
  const selectionTimeout = useRef(null);
  const noteTextareaRef = useRef(null);

  const getStoredAnswers = (key) => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  };

  // Ma'lumot holati
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Javoblar va natijalar
  const [userAnswers, setUserAnswers] = useState(() => {
    const key = `ielts_answers_${series}_${testNum}_${partNum}`;
    return getStoredAnswers(key);
  });
  useDebouncedLocalStorage(
    `ielts_answers_${series}_${testNum}_${partNum}`,
    userAnswers,
  );
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState({});
  const [showModal, setShowModal] = useState(false);

  // Audio holati
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // UI holati
  const [audioPosition, setAudioPosition] = useState({ x: 20, y: 112 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentHighlightedIndex, setCurrentHighlightedIndex] = useState(-1);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [mockMode, setMockMode] = useState(() => {
    try {
      return localStorage.getItem(`mock_active_${series}_${testNum}`) === "true";
    } catch {
      return false;
    }
  });
  const [mockTimeLeft, setMockTimeLeft] = useState(null);
  const [guidedMode, setGuidedMode] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(true);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [completedParts, setCompletedParts] = useState(() => {
    try {
      const stored = localStorage.getItem(`mock_completed_parts_${series}_${testNum}`);
      return stored ? new Set(stored.split(",").map(Number)) : new Set();
    } catch {
      return new Set();
    }
  });

  // MockAudioPlayer dan keladigan state (faqat Our Mocks uchun)
  const [mockPlayerTime, setMockPlayerTime] = useState(0);
  const [mockPlayerMode, setMockPlayerMode] = useState(false);
  const [, setMockPlayerTimeLeft] = useState(null);
  const [, setMockPlayerPlaying] = useState(false);

  // Annotation holati
  const [noteModeEnabled] = useState(true);
  const [selectionMenu, setSelectionMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedText: "",
    selection: null,
  });
  const [annotations, setAnnotations] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const key = `ielts_answers_${series}_${testNum}_${partNum}`;
    setUserAnswers(getStoredAnswers(key));
    setShowResults(false);
    setScores({});
    setShowModal(false);

    // Mock mode'ni saqlab qolish - yangi qismga o'tganda ham davom etadi
    let isActive = false;
    try {
      isActive = localStorage.getItem(`mock_active_${series}_${testNum}`) === "true";
      setMockMode(isActive);
      setTranscriptVisible(!isActive);
    } catch {
      setMockMode(false);
      setTranscriptVisible(true);
    }

    // Mock mode'da audio'ni to'xtatmasdan qoldiramiz — avtomatik play
    // effect o'zi boshqaradi. Normal mode'da to'xtatamiz.
    if (!isActive) {
      setMockTimeLeft(null);
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [series, testNum, partNum]);

  // ── Ma'lumotlarni yuklash ──────────────────────────────────────────────────
  useEffect(() => {
    if (!series || !testNum || !partNum) return;
    setLoading(true);
    setError(null);
    // Skeleton kamida 450ms ko'rinadi (Cambridge'dagi kabi silliq o'tish)
    const startedAt = Date.now();

    const previewToken = getPreviewToken(searchParams);
    const load = isOurMock
      ? fetchOurMock(series, "listening", { previewToken })
      : fetch(`/json/IELTS_${series}_Listening.json`).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const contentType = r.headers.get("content-type") || "";
          if (!contentType.includes("json")) {
            throw new Error(`Test ma'lumotlari topilmadi (IELTS_${series}_Listening.json)`);
          }
          return r.json();
        });

    load
      .then((json) => {
        if (isOurMock) {
          setData(normalizeOurMocksListening(json, testNum));
        } else {
          setData(json);
        }
      })
      .catch((err) => {
        console.error("❌ Xatolik:", err.message);
        setError(err.message);
      })
      .finally(() => {
        const wait = Math.max(0, 450 - (Date.now() - startedAt));
        if (wait > 0) setTimeout(() => setLoading(false), wait);
        else setLoading(false);
      });
  }, [series, testNum, partNum, isOurMock, searchParams]);

  // ── Annotationlarni yuklash ──────────────────────────────────────────────
  useEffect(() => {
    const key = `ielts_notes_${series}_${testNum}_${partNum}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnnotations(parsed);
        const ids = Object.keys(parsed).map(Number);
        setNextId(ids.length ? Math.max(...ids) + 1 : 1);
      } else {
        setAnnotations({});
        setNextId(1);
      }
    } catch {
      setAnnotations({});
      setNextId(1);
    }
  }, [series, testNum, partNum]);

  // ── Annotationlarni saqlash ──────────────────────────────────────────────
  useDebouncedLocalStorage(
    `ielts_notes_${series}_${testNum}_${partNum}`,
    annotations,
  );

  // ── Ma'lumotlardan hisoblangan qiymatlar ──────────────────────────────────
  const currentTest = useMemo(
    () => data?.tests?.[testNum] ?? Object.values(data?.tests ?? {})[0],
    [data, testNum],
  );
  const currentPart = useMemo(
    () => currentTest?.parts?.[partNum],
    [currentTest, partNum],
  );
  const questions = useMemo(
    () => currentPart?.question?.test_question || [],
    [currentPart],
  );
  const textData = useMemo(
    () => currentPart?.text?.test_text || currentPart?.text || {},
    [currentPart],
  );

  const audioSrc = useMemo(() => {
    // Yangi format: audio_src to'g'ridan-to'g'ri part ichida
    // Eski format: text.test_text.audio_src
    const raw = mockMode
      ? (currentPart?.mock_audio_src || currentPart?.audio_src || textData.mock_audio_src || textData.audio_src)
      : (currentPart?.audio_src || textData.audio_src);
    if (!raw) return null;
    if (raw.startsWith("http")) {
      // oss.jumpinto.com URL'larini proxy orqali yo'naltirish (CORS uchun)
      if (raw.includes("oss.jumpinto.com")) {
        return raw.replace("https://oss.jumpinto.com", "/oss");
      }
      return raw;
    }
    // Nisbiy yo'llarni proxy orqali (CORS uchun)
    return `/oss/${raw.replace(/^\//, "")}`;
  }, [textData, mockMode]);

  const rawAudioscript = useMemo(() => textData.audioscript || [], [textData]);
  const hasTranscript = rawAudioscript.length > 0;

  // Our Mocks: MockAudioPlayer dan keladigan state; Cambridge: local state
  const effectiveMockMode = isOurMock ? mockPlayerMode : mockMode;
  const effectiveCurrentTime = isOurMock ? mockPlayerTime : currentTime;

  const parsedAnswers = useMemo(() => {
    const raw =
      currentTest?.answers ??
      currentPart?.answers ??
      currentPart?.text?.test_text?.answers ??
      currentPart?.text?.answers ??
      currentPart?.question?.answers ??
      {};
    return parseAnswers(raw);
  }, [currentPart, currentTest]);

  // ─── allQuestionIds ───────────────────────────────────────────────────────
  const allQuestionIds = useMemo(() => {
    const ids = [];
    (questions || []).forEach((q) => {
      if (
        q.type === "option-abc" ||
        q.type === "option-true-false" ||
        q.type === "option-yes-no" ||
        q.type === "tf-yn"
      ) {
        const items = q.body_smart?.items || q.body?.items || [];
        const start = q.start || 0;
        items.forEach((_, idx) => {
          ids.push(String(start + idx));
        });
      } else if (q.type === "matching") {
        const items = q.body_smart?.items || q.body?.items || [];
        items.forEach((item) => {
          if (item.question_num) ids.push(String(item.question_num));
        });
      } else if (q.type === "checkbox") {
        const itemQids = q.body_smart?.item_qids || [];
        if (itemQids.length > 0) {
          itemQids.forEach((id) => ids.push(String(id)));
        } else {
          for (let i = q.start; i <= q.end; i++) {
            ids.push(String(i));
          }
        }
      } else if (
        q.type === "select-given-list" ||
        q.type === "select-given-diagram"
      ) {
        const itemQids = q.body_smart?.item_qids || [];
        if (itemQids.length > 0) {
          itemQids.forEach((id) => ids.push(String(id)));
        } else {
          for (let i = q.start; i <= q.end; i++) {
            ids.push(String(i));
          }
        }
      } else if (
        q.type === "input-table" ||
        q.type === "input-note" ||
        q.type === "input-form" ||
        q.type === "input-sentence" ||
        q.type === "input-flowchart" ||
        q.type === "input-summary" ||
        q.type === "input-answer" ||
        q.type === "radio-table" ||
        q.type === "select-summary-given-list"
      ) {
        if (q.start && q.end) {
          for (let i = q.start; i <= q.end; i++) {
            ids.push(String(i));
          }
        } else if (q.start) {
          ids.push(String(q.start));
        }
      }
    });
    return ids;
  }, [questions]);

  const allQuestionIdsSet = useMemo(
    () => new Set(allQuestionIds),
    [allQuestionIds],
  );

  const getCorrectAnswer = useCallback(
    (qid) => {
      if (Array.isArray(parsedAnswers)) {
        const idx = parseInt(qid, 10) - 1;
        return idx >= 0 && idx < parsedAnswers.length ? parsedAnswers[idx] : "";
      }
      return parsedAnswers[qid] ?? "";
    },
    [parsedAnswers],
  );

  // ── Audio sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audioSrc]);

  // ── Audio avtomatik play (mock mode'da part o'zgarganda) ────────────────────
  useEffect(() => {
    if (!mockMode || !audioSrc) return;
    const audio = audioRef.current;
    if (!audio) return;

    const timer = setTimeout(() => {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Audio autoplay failed:', err.message));
    }, 300);

    return () => clearTimeout(timer);
  }, [audioSrc, mockMode, partNum]);

  // ── Audio transcript sync ──────────────────────────────────────────────────
  // Our Mocks: MockAudioPlayer dan keladigan currentTimedan foydalanamiz
  useEffect(() => {
    if (isOurMock) {
      // Our Mocks: effectiveCurrentTime o'zgarganda transcript sync
      if (!rawAudioscript.length) return;
      const idx = rawAudioscript.findIndex(
        (s) =>
          s.start_time != null &&
          s.end_time != null &&
          effectiveCurrentTime >= s.start_time &&
          effectiveCurrentTime <= s.end_time,
      );
      setCurrentHighlightedIndex(idx);
      return;
    }

    // Cambridge: audioRef orqali
    const audio = audioRef.current;
    if (!audio || !rawAudioscript.length) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      const idx = rawAudioscript.findIndex(
        (s) =>
          s.start_time != null &&
          s.end_time != null &&
          t >= s.start_time &&
          t <= s.end_time,
      );
      setCurrentHighlightedIndex(idx);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [rawAudioscript, isOurMock, effectiveCurrentTime]);

  // ── Audio event handlerlar ─────────────────────────────────────────────────
  const handleAudioLoadStart = useCallback(() => {
    setAudioLoading(true);
    setAudioError(null);
  }, []);

  const handleAudioCanPlay = useCallback(() => {
    setAudioLoading(false);
  }, []);

  const handleAudioError = useCallback(() => {
    setAudioLoading(false);
    setAudioError("Audio faylni yuklab bo'lmadi. Internetga ulanishni tekshiring.");
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    if (mockMode) {
      checkAnswersRef.current();
    }
  }, [mockMode]);

  // ── Audio tezligini (playbackRate) qo'llash ───────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate, audioSrc]);

  // ── Auto-scroll transcript ─────────────────────────────────────────────────
  useEffect(() => {
    if (!autoScrollEnabled || currentHighlightedIndex < 0) return;
    document
      .getElementById(`sentence-${currentHighlightedIndex}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentHighlightedIndex, autoScrollEnabled]);

  // ── Mock mode taymer ───────────────────────────────────────────────────────
  useEffect(() => {
    setMockActive(mockMode);
    try {
      if (mockMode) {
        localStorage.setItem(`mock_active_${series}_${testNum}`, "true");
      } else {
        localStorage.removeItem(`mock_active_${series}_${testNum}`);
      }
    } catch (err) {
      console.warn('localStorage error:', err.message);
    }
    return () => setMockActive(false);
  }, [mockMode, series, testNum]);

  useEffect(() => {
    if (!mockMode) return;
    // Faqat mock mode yangi boshlanganda (mockTimeLeft null bo'lganda) taymerni o'rnating
    if (mockTimeLeft !== null) return;
    const d =
      Number.isFinite(duration) && duration > 0 ? duration : 1800;
    setMockTimeLeft(Math.ceil(d));
  }, [mockMode, duration]);

  useEffect(() => {
    if (!mockMode) return;
    if (mockTimeLeft === null || mockTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setMockTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => {
            checkAnswersRef.current();
          }, 0);
          audioRef.current?.pause();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mockMode]);

  // ── Draggable player ───────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e) => {
      if (
        !dragHandleRef.current?.contains(e.target) &&
        e.target !== dragHandleRef.current
      )
        return;
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - audioPosition.x,
        y: e.clientY - audioPosition.y,
      });
    },
    [audioPosition],
  );

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    const move = (e) => {
      setAudioPosition({
        x: Math.max(
          0,
          Math.min(window.innerWidth - 380, e.clientX - dragOffset.x),
        ),
        y: Math.max(
          0,
          Math.min(window.innerHeight - 140, e.clientY - dragOffset.y),
        ),
      });
    };
    const end = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
    };
  }, [isDragging, dragOffset]);

  // ── Audio boshqaruv ────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (mockMode) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Audio play failed:', err.message));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [mockMode]);

  const skip = useCallback(
    (s) => {
      if (!mockMode && audioRef.current) audioRef.current.currentTime += s;
    },
    [mockMode],
  );

  const handleSeek = useCallback(
    (e) => {
      if (!mockMode && audioRef.current) {
        const t = parseFloat(e.target.value);
        audioRef.current.currentTime = t;
        setCurrentTime(t);
      }
    },
    [mockMode],
  );

  const handleVolumeChange = useCallback(
    (e) => {
      const v = parseFloat(e.target.value);
      setVolume(v);
      if (audioRef.current) audioRef.current.volume = v;
      setIsMuted(v === 0);
    },
    [],
  );

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // ── Text tanlash ───────────────────────────────────────────────────────────
  const getSelectionDetails = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text) return null;
    const anchor = range.startContainer;
    if (
      !questionsContainerRef.current?.contains(anchor) &&
      !transcriptRef.current?.contains(anchor)
    )
      return null;
    return { range: range.cloneRange(), text };
  }, []);

  const handleTextSelection = useCallback(
    (e) => {
      if (!noteModeEnabled) return;
      if (e.target.closest(".custom-highlight, .custom-note")) return;
      if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
      selectionTimeout.current = setTimeout(() => {
        const details = getSelectionDetails();
        if (details) {
          const rect = details.range.getBoundingClientRect();
          const menuX = Math.max(10, rect.left + rect.width / 2 - 80);
          const menuY = Math.max(10, rect.top - 50);
          setSelectionMenu({
            visible: true,
            x: menuX,
            y: menuY,
            selectedText: details.text,
            selection: details.range,
          });
        } else {
          setSelectionMenu((p) => ({ ...p, visible: false }));
        }
      }, 10);
    },
    [noteModeEnabled, getSelectionDetails],
  );

  useEffect(
    () => () => {
      if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
    },
    [],
  );

  // Menu tashqarisiga bosish
  useEffect(() => {
    const onDown = (e) => {
      if (selectionMenu.visible && !e.target.closest(".selection-menu")) {
        setSelectionMenu((p) => ({ ...p, visible: false }));
        window.getSelection()?.removeAllRanges();
      }
      if (editingHighlight && !e.target.closest(".highlight-popup"))
        setEditingHighlight(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selectionMenu.visible, editingHighlight]);

  // Note textarea focus
  useEffect(() => {
    if (editingNote) noteTextareaRef.current?.focus();
  }, [editingNote]);

  // ── Highlight / Note qo'shish ──────────────────────────────────────────────
  const buildSpan = (id, type, color) => {
    const span = document.createElement("span");
    span.className = type === "highlight" ? "custom-highlight" : "custom-note";
    span.setAttribute("data-id", id);
    span.setAttribute("data-type", type);
    if (type === "highlight") {
      span.setAttribute("data-color", color || DEFAULT_HIGHLIGHT);
      Object.assign(span.style, {
        padding: "0",
        margin: "0",
        border: "none",
        display: "inline",
        fontSize: "inherit",
        lineHeight: "inherit",
        verticalAlign: "baseline",
      });
    } else {
      span.style.borderBottom = "2px solid #2563eb";
      span.style.cursor = "pointer";
    }
    return span;
  };

  const applyHighlight = useCallback(
    (color) => {
      if (!selectionMenu.selection) return;
      const id = nextId;
      wrapRangeTextNodes(
        selectionMenu.selection,
        buildSpan(id, "highlight", color),
      );
      setAnnotations((p) => ({
        ...p,
        [id]: {
          id,
          type: "highlight",
          color,
          text: selectionMenu.selectedText,
          note: null,
        },
      }));
      setNextId(id + 1);
      setSelectionMenu((p) => ({ ...p, visible: false }));
      window.getSelection()?.removeAllRanges();
    },
    [selectionMenu, nextId],
  );

  const recolorHighlight = useCallback((id, color) => {
    document.querySelectorAll(`[data-id="${id}"]`).forEach((span) => {
      if (span.getAttribute("data-type") === "highlight") {
        span.setAttribute("data-color", color);
      }
    });
    setAnnotations((p) => ({ ...p, [id]: { ...p[id], color } }));
    setEditingHighlight((p) => (p ? { ...p, color } : p));
  }, []);

  const applyNote = useCallback(() => {
    if (!selectionMenu.selection) return;
    const id = nextId;
    wrapRangeTextNodes(selectionMenu.selection, buildSpan(id, "note"));
    setAnnotations((p) => ({
      ...p,
      [id]: { id, type: "note", text: selectionMenu.selectedText, note: "" },
    }));
    setNextId(id + 1);
    setEditingNote({
      id,
      text: selectionMenu.selectedText,
      note: "",
      x: selectionMenu.x,
      y: selectionMenu.y,
    });
    setSelectionMenu((p) => ({ ...p, visible: false }));
    window.getSelection()?.removeAllRanges();
  }, [selectionMenu, nextId]);

  const deleteAnnotation = useCallback((id) => {
    document.querySelectorAll(`[data-id="${id}"]`).forEach((span) => {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize();
    });
    setAnnotations((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setEditingNote(null);
    setEditingHighlight(null);
  }, []);

  const saveNote = useCallback((id, noteText) => {
    setAnnotations((p) => ({ ...p, [id]: { ...p[id], note: noteText } }));
    setEditingNote(null);
  }, []);

  const clearAllAnnotations = useCallback(() => {
    if (!window.confirm("Clear all highlights and notes?")) return;
    document
      .querySelectorAll(".custom-highlight, .custom-note")
      .forEach((span) => {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      });
    setAnnotations({});
    setNextId(1);
  }, []);

  // YANGI: faqat javoblarni (inputlarni) tozalash — highlight/note'larga tegmaydi.
  // localStorage'dagi saqlangan javoblar ham o'chiriladi, shunda keyingi safar
  // sahifa ochilganda eski javoblar qayta paydo bo'lmaydi.
  const clearAllAnswers = useCallback(() => {
    if (!window.confirm("Confirm clear all answers?")) return;
    const key = `ielts_answers_${series}_${testNum}_${partNum}`;
    localStorage.removeItem(key);
    setUserAnswers({});
    setShowResults(false);
    setScores({});
  }, [series, testNum, partNum]);

  const handleAnnotatedClick = useCallback(
    (e) => {
      const hl = e.target.closest(".custom-highlight");
      if (hl) {
        e.stopPropagation();
        const id = parseInt(hl.getAttribute("data-id"), 10);
        const ann = annotations[id];
        if (ann?.type === "highlight") {
          const rect = hl.getBoundingClientRect();
          setEditingHighlight({
            id,
            text: ann.text,
            color: ann.color,
            x: rect.left,
            y: rect.top,
          });
        }
        return;
      }
      const note = e.target.closest(".custom-note");
      if (!note) return;
      e.stopPropagation();
      const id = parseInt(note.getAttribute("data-id"), 10);
      const ann = annotations[id];
      if (ann?.type === "note") {
        const rect = note.getBoundingClientRect();
        setEditingNote({
          id,
          text: ann.text,
          note: ann.note || "",
          x: rect.left,
          y: rect.top - 10,
        });
      }
    },
    [annotations],
  );

  // ── Javoblar ───────────────────────────────────────────────────────────────
  const handleAnswerChange = useCallback(
    (qid, value) => setUserAnswers((p) => ({ ...p, [String(qid)]: value })),
    [],
  );

  // ─── checkAnswers ─────────────────────────────────────────────────────────
  const checkAnswers = useCallback(() => {
    const newScores = {};

    (questions || []).forEach((q) => {
      // 1. OPTION-ABC / OPTION-TRUE-FALSE / OPTION-YES-NO
      if (
        q.type === "option-abc" ||
        q.type === "option-true-false" ||
        q.type === "option-yes-no" ||
        q.type === "tf-yn"
      ) {
        const items = q.body_smart?.items || q.body?.items || [];
        const start = q.start || 0;

        items.forEach((item, idx) => {
          const qid = String(start + idx);
          const userVal = (userAnswers[qid] || "")
            .toString()
            .trim()
            .toUpperCase();
          const correct = String(getCorrectAnswer(qid)).toUpperCase();
          newScores[qid] = Boolean(
            userVal !== "" && userVal === correct && correct !== "",
          );
        });
      }
      // 1b. MATCHING
      else if (q.type === "matching") {
        const items = q.body_smart?.items || q.body?.items || [];

        items.forEach((item) => {
          if (!item.question_num) return;
          const qid = String(item.question_num);
          const userVal = (userAnswers[qid] || "")
            .toString()
            .trim()
            .toUpperCase();
          const correct = String(getCorrectAnswer(qid)).toUpperCase();
          newScores[qid] = Boolean(
            userVal !== "" && userVal === correct && correct !== "",
          );
        });
      }
      // 2. CHECKBOX
      else if (q.type === "checkbox") {
        // BUGFIX: ChoiceGroupBlock javobni `String(q.start)` kaliti bilan
        // saqlaydi (masalan "17"), lekin bu yerda oldin "17-18" (start-end)
        // kaliti qidirilardi — ular hech qachon mos kelmagani uchun
        // checkbox javoblari doim "bo'sh" deb hisoblanardi va foydalanuvchi
        // to'g'ri belgilagan taqdirda ham natija doim noto'g'ri chiqardi.
        const groupId = String(q.start);
        const groupAnswer = String(userAnswers[groupId] ?? "").trim();
        const userSelected = groupAnswer
          .split("|")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        const selectedSet = new Set(userSelected);

        const qids =
          q.body_smart?.item_qids?.map(String) ||
          Array.from({ length: q.end - q.start + 1 }, (_, i) =>
            String(q.start + i),
          );

        qids.forEach((qid) => {
          const correctOptions = splitAlternatives(getCorrectAnswer(qid))
            .map((s) => s.toUpperCase());

          newScores[qid] = Boolean(
            userSelected.length > 0 &&
            correctOptions.length > 0 &&
            correctOptions.some((option) => selectedSet.has(option)),
          );
        });
      }
      // 3. SELECT-GIVEN-LIST
      else if (q.type === "select-given-list") {
        const itemQids = q.body_smart?.item_qids || [];
        const items = q.body_smart?.items || q.body?.items || [];

        items.forEach((item, idx) => {
          const qid = itemQids[idx]
            ? String(itemQids[idx])
            : String(q.start + idx);
          const userVal = (userAnswers[qid] || "")
            .toString()
            .trim()
            .toUpperCase();
          const correct = String(getCorrectAnswer(qid)).toUpperCase();
          newScores[qid] = Boolean(
            userVal !== "" && userVal === correct && correct !== "",
          );
        });
      }
      // 4. SELECT-GIVEN-DIAGRAM
      else if (q.type === "select-given-diagram") {
        const itemQids = q.body_smart?.item_qids || [];
        const items = q.body_smart?.items || q.body?.items || [];

        items.forEach((item, idx) => {
          const qid = itemQids[idx]
            ? String(itemQids[idx])
            : String(q.start + idx);
          const userVal = (userAnswers[qid] || "")
            .toString()
            .trim()
            .toLowerCase();
          const correct = getCorrectAnswer(qid);
          newScores[qid] =
            userVal !== "" && userVal === correct && correct !== "";
        });
      }
      // 5. INPUT-TABLE / RADIO-TABLE
      else if (q.type === "input-table" || q.type === "radio-table") {
        if (q.start && q.end) {
          for (let i = q.start; i <= q.end; i++) {
            const qid = String(i);
            const userVal = (userAnswers[qid] || "")
              .toString()
              .trim()
              .toLowerCase();
            const correct = getCorrectAnswer(qid);
            const correctOptions = splitAlternatives(correct)
              .map((s) => s.toLowerCase());
            newScores[qid] = Boolean(
              userVal !== "" &&
              correctOptions.some((c) => userVal === c) &&
              correct !== "",
            );
          }
        }
      }
      // 6. INPUT-NOTE (va boshqa matn kiritish bloklari)
      else if (
        q.type === "input-note" ||
        q.type === "input-table" ||
        q.type === "input-form" ||
        q.type === "input-sentence" ||
        q.type === "input-flowchart" ||
        q.type === "input-summary" ||
        q.type === "input-answer" ||
        q.type === "radio-table" ||
        q.type === "select-summary-given-list"
      ) {
        if (q.start && q.end) {
          for (let i = q.start; i <= q.end; i++) {
            const qid = String(i);
            const userVal = (userAnswers[qid] || "")
              .toString()
              .trim()
              .toLowerCase();
            const correct = getCorrectAnswer(qid);
            const correctOptions = splitAlternatives(correct)
              .map((s) => s.toLowerCase());
            newScores[qid] = Boolean(
              userVal !== "" &&
              correctOptions.some((c) => userVal === c) &&
              correct !== "",
            );
          }
        }
      }
    });

    setScores(newScores);
    setShowResults(true);
    setShowModal(true);

    const total = Object.keys(newScores).length;
    if (total > 0) {
      const partDetails = {};
      Object.keys(newScores).forEach((qid) => {
        partDetails[qid] = {
          userAns: String(userAnswers[qid] ?? "").trim() || "No answer",
          correctAns: getCorrectAnswer(qid),
          isCorrect: newScores[qid] === true,
        };
      });
      // Avval details ni saqlash, keyin cumulative hisoblash
      saveResult({
        series: parseInt(series),
        testNum: parseInt(testNum),
        details: { listening: { [`part${partNum}`]: partDetails } },
      });
      const cumRaw = getCumulativeRaw("listening", parseInt(series), parseInt(testNum));
      // Yakuniy natija: cumulative raw + band
      saveResult({
        series: parseInt(series),
        testNum: parseInt(testNum),
        listening: { raw: cumRaw, band: listeningBand(cumRaw) },
      });
      submitResultSafe({
        skill: "listening",
        series_id: parseInt(series),
        test_num: parseInt(testNum),
        part_num: parseInt(partNum),
        raw_score: cumRaw,
        total_questions: 40,
        band: listeningBand(cumRaw),
      });
    }

    const newCompleted = new Set(completedParts);
    newCompleted.add(parseInt(partNum));
    setCompletedParts(newCompleted);
    try {
      localStorage.setItem(
        `mock_completed_parts_${series}_${testNum}`,
        Array.from(newCompleted).join(","),
      );
    } catch (err) {
      console.warn('localStorage error:', err.message);
    }
  }, [questions, userAnswers, getCorrectAnswer, series, testNum, partNum, completedParts]);

  const checkAnswersRef = useRef(checkAnswers);

  useEffect(() => {
    // Ref doim eng so'nggi `checkAnswers`ni saqlaydi — audio event handler va
    // taymerlar stale closure'ga tushmasligi uchun (ataylab yoziladi).
    // eslint-disable-next-line react-hooks/immutability
    checkAnswersRef.current = checkAnswers;
  }, [checkAnswers]);

  // ── Navigatsiya ────────────────────────────────────────────────────────────
  const goToPart = useCallback(
    (part) => {
      setShowModal(false);
      const prefix = isOurMock ? "mock" : "academic";
      navigate(`/${prefix}/${series}/${testNum}/listening/${part}`);
    },
    [navigate, series, testNum, isOurMock],
  );

  const goToPrevPart = useCallback(() => {
    const p = parseInt(partNum, 10) - 1;
    if (p >= 1) goToPart(p);
  }, [partNum, goToPart]);

  const goToNextPart = useCallback(() => {
    const p = parseInt(partNum, 10) + 1;
    if (p <= 4) goToPart(p);
  }, [partNum, goToPart]);

  const scrollToQuestion = useCallback((qid) => {
    setVisitedQuestions((prev) => new Set([...prev, qid]));
    const el = questionRefs.current[qid];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => {
      const input = document.querySelector(`input[data-qid="${qid}"]`);
      if (input) {
        input.focus({ behavior: "smooth" });
        input.classList.add("ring-2", "ring-[var(--accent)]");
        setTimeout(() => {
          input.classList.remove("ring-2", "ring-[var(--accent)]");
        }, 1500);
      }
    }, 300);
  }, []);

  // ── Mock ───────────────────────────────────────────────────────────────────
  const startMockTest = useCallback(() => {
    const audio = audioRef.current;
    const key = `ielts_answers_${series}_${testNum}_${partNum}`;
    localStorage.removeItem(key);
    setMockMode(true);
    setShowResults(false);
    setShowModal(false);
    setTranscriptVisible(false);
    setUserAnswers({});
    setScores({});
    setCompletedParts(new Set());
    try {
      localStorage.removeItem(`mock_completed_parts_${series}_${testNum}`);
    } catch (err) {
      console.warn('localStorage error:', err.message);
    }
    if (audio && audio.paused)
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Audio play failed:', err.message));
  }, [partNum, series, testNum]);

  const exitMockMode = useCallback(() => {
    const key = `ielts_answers_${series}_${testNum}_${partNum}`;
    localStorage.removeItem(key);
    setMockMode(false);
    // BUGFIX: startMockTest transkriptni yashiradi (setTranscriptVisible(false))
    // lekin mockdan chiqishda hech qachon qaytarilmagan edi — shu sababli
    // mock testdan chiqqandan keyin ham transkript ko'rinmay qolardi.
    setTranscriptVisible(true);
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [partNum, series, testNum]);

  // ── Audioscript ──────────────────────────────────────────────────────────
  const audioscriptNodes = useMemo(() => {
    return rawAudioscript.map((sentence, idx) => {
      const { speaker, text, question_ids } = sentence;
      const isHighlighted = idx === currentHighlightedIndex;
      const guidedQids =
        guidedMode && question_ids
          ? question_ids.map(String).filter((q) => allQuestionIdsSet.has(q))
          : [];
      const hasGuided = guidedQids.length > 0;
      const previousSpeaker = rawAudioscript[idx - 1]?.speaker ?? null;
      const showSpeaker = speaker !== previousSpeaker;

      const bgClass = hasGuided
        ? "bg-blue-400 text-white"
        : isHighlighted
          ? "bg-green-600 text-white"
          : "";

      const displayText = (text || "")
        .toString()
        .replace(/Q\s*\d+(?:,\s*\d+)*/g, "")
        .trim();

      return (
        <div
          key={idx}
          id={`sentence-${idx}`}
          className={`inline mt-5 ${bgClass} rounded px-1 transition-colors duration-150`}
        >
          {showSpeaker && (
            <span
              className={`font-semibold my-3 mr-2 ${
                isDark ? "text-white/50" : "text-[#17171A]"
              }`}
            >
              <br />
              <br />
              {speaker}:
            </span>
          )}
          <span className="lyric my-4 text-base leading-relaxed">
            {displayText}
            {guidedQids.length > 0 && (
              <span className="ml-1 px-1 py-0.5 text-xs bg-blue-200 dark:bg-blue-800                 text-[#17171A] dark:text-white/80 rounded font-mono font-semibold">
                Q{guidedQids.join(", ")}
              </span>
            )}
          </span>
        </div>
      );
    });
  }, [
    rawAudioscript,
    currentHighlightedIndex,
    guidedMode,
    allQuestionIdsSet,
    isDark,
  ]);

  // ── Natijalar ──────────────────────────────────────────────────────────────
  const { correctCount, totalQuestions, resultRows } = useMemo(() => {
    const rows = [];

    (questions || []).forEach((q) => {
      if (
        q.type === "option-abc" ||
        q.type === "option-true-false" ||
        q.type === "option-yes-no" ||
        q.type === "tf-yn"
      ) {
        const start = Number(q.start) || 0;
        const items = q.body_smart?.items || q.body?.items || [];

        items.forEach((_, idx) => {
          const qid = String(start + idx);
          const userAns = String(userAnswers[qid] ?? "").trim();
          rows.push({
            qid,
            number: qid,
            userAns: userAns || "No answer",
            correctAns: getCorrectAnswer(qid),
            isCorrect: scores[qid] === true,
          });
        });
      } else if (q.type === "matching") {
        const items = q.body_smart?.items || q.body?.items || [];

        items.forEach((item) => {
          if (!item.question_num) return;
          const qid = String(item.question_num);
          const userAns = String(userAnswers[qid] ?? "").trim();
          rows.push({
            qid,
            number: qid,
            userAns: userAns || "No answer",
            correctAns: getCorrectAnswer(qid),
            isCorrect: scores[qid] === true,
          });
        });
      } else if (q.type === "checkbox") {
        // BUGFIX: xuddi shu "start-end" vs "start" kalit nomuvofiqligi
        // bu yerda ham bor edi — natijada jadvalda foydalanuvchi belgilagan
        // checkbox javoblari har doim "No answer" bo'lib ko'rinardi.
        const groupId = String(q.start);
        const selectedValue = String(userAnswers[groupId] ?? "").trim();
        const selectedLetters = selectedValue
          .split("|")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        const qids =
          q.body_smart?.item_qids?.map(String) ||
          Array.from({ length: Number(q.end) - Number(q.start) + 1 }, (_, i) =>
            String(Number(q.start) + i),
          );

        // BUGFIX: avval har bir qatorga index bo'yicha harf (0→A, 1→B, ...)
        // bog'lanardi va shu harf tanlanganmi deb tekshirilardi — bu
        // noto'g'ri edi, chunki foydalanuvchi tanlagan harflar savol
        // tartib raqamiga emas, ro'yxatdagi variantlarga tegishli. Endi
        // guruh ichidagi barcha savol raqamlariga foydalanuvchi haqiqatda
        // tanlagan harflar (masalan "A, E") bir xilda ko'rsatiladi, har
        // biri o'z to'g'ri javobiga alohida solishtiriladi.
        const userAnsDisplay =
          selectedLetters.length > 0
            ? selectedLetters.join(", ")
            : "No answer";

        qids.forEach((qid) => {
          rows.push({
            qid,
            number: qid,
            userAns: userAnsDisplay,
            correctAns: getCorrectAnswer(qid),
            isCorrect: scores[qid] === true,
          });
        });
      } else if (
        q.type === "select-given-list" ||
        q.type === "select-given-diagram"
      ) {
        const itemQids = q.body_smart?.item_qids || [];
        const items = q.body_smart?.items || q.body?.items || [];

        items.forEach((_, idx) => {
          const qid = itemQids[idx]
            ? String(itemQids[idx])
            : String(q.start + idx);
          const userAns = String(userAnswers[qid] ?? "").trim();
          rows.push({
            qid,
            number: qid,
            userAns: userAns || "No answer",
            correctAns: getCorrectAnswer(qid),
            isCorrect: scores[qid] === true,
          });
        });
      } else if (
        q.type === "input-table" ||
        q.type === "input-note" ||
        q.type === "input-form" ||
        q.type === "input-sentence" ||
        q.type === "input-flowchart" ||
        q.type === "input-summary" ||
        q.type === "input-answer" ||
        q.type === "radio-table" ||
        q.type === "select-summary-given-list"
      ) {
        if (q.start && q.end) {
          for (let i = q.start; i <= q.end; i++) {
            const qid = String(i);
            const userAns = String(userAnswers[qid] ?? "").trim();
            rows.push({
              qid,
              number: qid,
              userAns: userAns || "No answer",
              correctAns: getCorrectAnswer(qid),
              isCorrect: scores[qid] === true,
            });
          }
        }
      }
    });

    return {
      correctCount: rows.filter((row) => row.isCorrect).length,
      totalQuestions: rows.length,
      resultRows: rows,
    };
  }, [questions, scores, userAnswers, getCorrectAnswer]);

  // ── Early returns ──────────────────────────────────────────────────────────
  // BUGFIX/YANGI: oddiy "Yuklanmoqda..." matni o'rniga animatsiyali skeleton
  // — hech qanday yangi kutubxonasiz, faqat CSS shimmer (ListeningAnimations
  // ichida). Sahifa strukturasiga (audio pleer + 2 panel) o'xshash bo'lgani
  // uchun yuklangandan keyingi "sakrash" his qilinmaydi.
  if (loading)
    return (
      <div
        className={`min-h-screen p-6 qz-anim-fade-in ${
          isDark ? "bg-[#0A0A0B]" : "bg-white"
        }`}
      >
        <ListeningAnimations />
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full qz-skeleton" />
            <div className="w-40 h-4 qz-skeleton" />
          </div>
          <div className="flex gap-6">
            <div className="w-1/2 space-y-3">
              <div className="w-2/3 h-5 qz-skeleton" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 qz-skeleton"
                  style={{ width: `${85 - (i % 3) * 12}%` }}
                />
              ))}
            </div>
            <div className="w-1/2 space-y-3">
              <div className="w-2/3 h-5 qz-skeleton" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl qz-skeleton" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div
        className={`p-8 text-red-500 qz-anim-scale-in ${
          isDark ? "bg-red-900/50" : "bg-red-50"
        } rounded`}
      >
        <ListeningAnimations />
        {"An error occurred"}: {error}
      </div>
    );
  if (!currentTest || !currentPart)
    return (
      <div
        className={`p-8 qz-anim-fade-in ${isDark ? "text-white/40" : "text-black/40"}`}
      >
        <ListeningAnimations />
        {"Data not found"}
      </div>
    );

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div
      data-ai="listening-page"
      data-ai-label="Listening Practice sahifasi"
      className={`min-h-screen md:h-screen flex flex-col qz-anim-fade-in ${
        isDark ? "bg-[#141416] text-[#F5F5F5]" : "bg-white text-[#17171A]"
      }`}
    >
      <ListeningAnimations />
      {isOurMock ? (
        <MockAudioPlayer
          data={data}
          testNum={testNum}
          series={series}
          onCheckAnswers={() => checkAnswersRef.current?.()}
          autoScrollEnabled={autoScrollEnabled}
          setAutoScrollEnabled={setAutoScrollEnabled}
          onTimeUpdate={setMockPlayerTime}
          onMockModeChange={setMockPlayerMode}
          onMockTimeLeftChange={setMockPlayerTimeLeft}
          onPlayStateChange={setMockPlayerPlaying}
          onStartMock={startMockTest}
          onExitMock={exitMockMode}
        />
      ) : createPortal(
        <AudioPlayer
          audioRef={audioRef}
          audioSrc={audioSrc}
          position={audioPosition}
          dragHandleRef={dragHandleRef}
          onDragStart={handleDragStart}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          skip={skip}
          volume={volume}
          isMuted={isMuted}
          toggleMute={toggleMute}
          onVolumeChange={handleVolumeChange}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          autoScrollEnabled={autoScrollEnabled}
          setAutoScrollEnabled={setAutoScrollEnabled}
          mockMode={mockMode}
          mockTimeLeft={mockTimeLeft}
          startMockTest={startMockTest}
          exitMockMode={exitMockMode}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          audioLoading={audioLoading}
          audioError={audioError}
          onAudioLoadStart={handleAudioLoadStart}
          onAudioCanPlay={handleAudioCanPlay}
          onAudioError={handleAudioError}
          onAudioEnded={handleAudioEnded}
        />,
        document.body,
      )}

      <ListeningTextSelectionMenu
        selectionMenu={selectionMenu}
        applyNote={applyNote}
        applyHighlight={applyHighlight}
        hideMenu={() => setSelectionMenu((p) => ({ ...p, visible: false }))}
      />

      <ListeningNoteEditor
        editingNote={editingNote}
        setEditingNote={setEditingNote}
        saveNote={saveNote}
        deleteAnnotation={deleteAnnotation}
        noteTextareaRef={noteTextareaRef}
      />

      <ListeningHighlightPopup
        editingHighlight={editingHighlight}
        setEditingHighlight={setEditingHighlight}
        deleteAnnotation={deleteAnnotation}
        recolorHighlight={recolorHighlight}
      />

      <main className="flex flex-col md:flex-row md:flex-1 md:overflow-hidden relative">
        {hasTranscript && (
          <ListeningTranscriptPanel
            isDark={isDark}
            transcriptVisible={transcriptVisible}
            setTranscriptVisible={setTranscriptVisible}
            guidedMode={guidedMode}
            setGuidedMode={setGuidedMode}
            audioscriptNodes={audioscriptNodes}
            transcriptRef={transcriptRef}
            handleTextSelection={handleTextSelection}
            handleAnnotatedClick={handleAnnotatedClick}
          />
        )}

        {!transcriptVisible && !effectiveMockMode && hasTranscript && (
          <button
            onClick={() => setTranscriptVisible(true)}
            title={"Show transcript"}
            className="qz-btn qz-anim-pop-in absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg bg-[var(--accent)] hover:bg-black text-white dark:text-[var(--accent-contrast)] dark:hover:text-white text-sm"
          >
            <FontAwesomeIcon icon={faEye} size="lg" /> {"Transcript"}
          </button>
        )}

        <ListeningQuestionsPanel
          isDark={isDark}
          transcriptVisible={hasTranscript && transcriptVisible}
          questions={questions}
          containerRef={questionsContainerRef}
          showResults={showResults}
          onMouseUp={handleTextSelection}
          onClick={handleAnnotatedClick}
          userAnswers={userAnswers}
          handleAnswerChange={handleAnswerChange}
          getCorrectAnswer={getCorrectAnswer}
          onClearAnswers={clearAllAnswers}
          onClearAnnotations={clearAllAnnotations}
        />
      </main>

      <footer
        className={`border-t p-3 flex justify-between items-center ${
          isDark
            ? "border-white/10 bg-[#141416]/50"
            : "border-black/[0.08] bg-black/[0.02]"
        }`}
      >
        <div className="hidden md:flex gap-2 overflow-x-auto max-w-md">
          {allQuestionIds.map((qid) => {
            const isVisited = visitedQuestions.has(qid);
            const hasAnswer = userAnswers[qid] !== undefined && userAnswers[qid] !== "";
            return (
              <button
                key={qid}
                onClick={() => scrollToQuestion(qid)}
                className={`w-8 h-8 rounded-full border transition-all duration-200 font-medium ${
                  hasAnswer
                    ? isDark
                      ? "bg-green-600 border-green-500 text-white"
                      : "bg-green-500 border-green-400 text-white"
                    : isVisited
                      ? isDark
                        ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                        : "bg-blue-100 border-blue-400 text-blue-600"
                      : isDark
                        ? "bg-white/10 border-white/15 text-white/50 hover:bg-green-900 hover:border-green-600"
                        : "bg-white border-black/[0.12] text-black/50 hover:bg-green-100 hover:border-green-500"
                }`}
              >
                {qid}
              </button>
            );
          })}
        </div>
        <div
          className={`hidden md:block text-sm ${isDark ? "text-white/40" : "text-black/50"}`}
        >
          {"Listening · Part"} {partNum}
        </div>
        <div className="flex gap-2">
          {isOurMock && completedParts.size >= 4 ? (
            <button
              onClick={() => navigate(`/results/${series}/${testNum}`)}
              className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              {"Overall"}
            </button>
          ) : (
            <>
              <button
                onClick={goToPrevPart}
                disabled={parseInt(partNum) <= 1}
                className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
              >
                {"← Previous"}
              </button>
              <button
                onClick={goToNextPart}
                disabled={parseInt(partNum) >= 4}
                className="bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] dark:hover:text-white px-3 py-1 rounded-lg hover:bg-black transition disabled:opacity-50"
              >
                {"Next →"}
              </button>
            </>
          )}
          {isOurMock && !effectiveMockMode && !completedParts.has(parseInt(partNum)) && (
            <button
              onClick={checkAnswers}
              className="bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 transition"
            >
              {"Scores"}
            </button>
          )}
          {!isOurMock && effectiveMockMode && showResults && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              {"Overall"}
            </button>
          )}
          {!isOurMock && !effectiveMockMode && (
            <button
              onClick={checkAnswers}
              className="bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 transition"
            >
              {"Scores"}
            </button>
          )}
        </div>
      </footer>

      <ListeningResultsModal
        showModal={showModal}
        setShowModal={setShowModal}
        isDark={isDark}
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        resultRows={resultRows}
        goToPrevPart={goToPrevPart}
        goToNextPart={goToNextPart}
        partNum={partNum}
        series={series}
        testNum={testNum}
        allPartsCompleted={isOurMock && completedParts.size >= 4}
        isOurMock={isOurMock}
      />
    </div>
  );
};

export default IELTSListening;
