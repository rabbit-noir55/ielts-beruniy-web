import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import ListeningAnimations from "../components/ListeningAnimations";
import ListeningTextSelectionMenu from "../components/ListeningTextSelectionMenu";
import ListeningNoteEditor from "../components/ListeningNoteEditor";
import ListeningHighlightPopup from "../components/ListeningHighlightPopup";
import ListeningResultsModal from "../components/ListeningResultsModal";
import { fetchOurMock, getPreviewToken } from "../utils/ourMockApi";
import ReadingPassagePanel from "../components/ReadingPassagePanel";
import ReadingQuestionsPanel from "../components/ReadingQuestionsPanel";
import ReadingControlPanel from "../components/ReadingControlPanel";
import {
  parseAnswers,
  useDebouncedLocalStorage,
  wrapRangeTextNodes,
} from "../utils/helpers";
import { readingBand, saveResult, getCumulativeRaw } from "../utils/ieltsBand";
import { submitResultSafe } from "../utils/api";
import { DEFAULT_HIGHLIGHT } from "../utils/highlightColors";
import { setMockActive } from "../utils/mockMode";
import { normalizeOurMocksReading } from "../utils/normalizeOurMocks";

// IELTS qoidalariga muvofiq: oddiy (mock bo'lmagan) rejimda har bir
// passage uchun 20 daqiqalik tavsiya etilgan taymer, mock rejimda esa
// butun Reading bo'limi (3 passage) uchun bitta umumiy 60 daqiqalik
// taymer — real imtihondagidek.
const NORMAL_PART_DURATION = 20 * 60; // soniyalarda
const MOCK_TOTAL_DURATION_MS = 60 * 60 * 1000; // millisekundlarda
const MAX_PART = 3;
// YANGI: saytning umumiy (global) headeri balandligi — suzib yuruvchi
// panel hech qachon shundan yuqoriga (header ostiga/orqasiga) sudralib
// ketmasligi uchun minimal Y chegarasi sifatida ishlatiladi.
const HEADER_SAFE_Y = 112;

const IELTSReading = ({ theme, isOurMockRoute }) => {
  const { series, testNum, partNum } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // DOM refs
  const passageRef = useRef(null);
  const questionRefs = useRef({});
  const questionsContainerRef = useRef(null);
  const selectionTimeout = useRef(null);
  const noteTextareaRef = useRef(null);
  const mainRef = useRef(null); // YANGI: ikki panelni o'rab turuvchi konteyner (resize hisoblash uchun)
  const dragHandleRef = useRef(null); // YANGI: suzib yuruvchi boshqaruv paneli tutqichi
  const skimAnimRef = useRef(null); // YANGI: skimming requestAnimationFrame ID

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

  const answersKey = `ielts_reading_answers_${series}_${testNum}_${partNum}`;
  const notesKey = `ielts_reading_notes_${series}_${testNum}_${partNum}`;
  // Mock taymer — 3 ta qismning barchasiga umumiy, shuning uchun kalitda
  // partNum YO'Q (qism almashtirilganda ham taymer davom etadi).
  const mockKey = `ielts_reading_mock_end_${series}_${testNum}`;

  // Ma'lumot holati
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Javoblar va natijalar
  const [userAnswers, setUserAnswers] = useState(() =>
    getStoredAnswers(answersKey),
  );
  useDebouncedLocalStorage(answersKey, userAnswers);
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState({});
  const [showModal, setShowModal] = useState(false);

  // UI holati
  const [guidedMode, setGuidedMode] = useState(false);
  const [passageVisible, setPassageVisible] = useState(true);
  const [mockMode, setMockMode] = useState(() => {
    try {
      return localStorage.getItem(`mock_active_${series}_${testNum}`) === "true";
    } catch {
      return false;
    }
  });
  const [mockTimeLeft, setMockTimeLeft] = useState(null);
  const [normalTimeLeft, setNormalTimeLeft] = useState(NORMAL_PART_DURATION);
  const [normalTimerRunning, setNormalTimerRunning] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const isOurMock = isOurMockRoute === true;
  const [completedParts, setCompletedParts] = useState(() => {
    try {
      const stored = localStorage.getItem(`mock_completed_parts_${series}_${testNum}`);
      return stored ? new Set(stored.split(",").map(Number)) : new Set();
    } catch {
      return new Set();
    }
  });

  // YANGI: suzib yuruvchi boshqaruv panelining ekrandagi joylashuvi —
  // AudioPlayer.jsx bilan bir xil drag mexanizmi.
  const [controlPosition, setControlPosition] = useState({
    x: 20,
    y: HEADER_SAFE_Y,
  });
  const [isDraggingControl, setIsDraggingControl] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // YANGI: ikki panel orasidagi ajratgichni sudrab o'lchamini o'zgartirish
  const [splitRatio, setSplitRatio] = useState(50); // %  (passage paneli)
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  // YANGI: Skimming Practice
  const [skimSpeed, setSkimSpeed] = useState(300); // so'z/daqiqa
  const [skimActive, setSkimActive] = useState(false);
  const [skimProgress, setSkimProgress] = useState(null); // 0..1
  const [skimWordIndex, setSkimWordIndex] = useState(0); // hozirgacha "o'qib bo'lingan" so'z indeksi

  // Annotation holati
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

  // ── Qism almashganda holatni tozalash ───────────────────────────────────────
  useEffect(() => {
    setUserAnswers(getStoredAnswers(answersKey));
    setShowResults(false);
    setScores({});
    setShowModal(false);
    setPassageVisible(true);
    setNormalTimeLeft(NORMAL_PART_DURATION);
    setNormalTimerRunning(false);
    setSkimActive(false);
    setSkimProgress(null);

    // Mock mode'ni saqlab qolish
    try {
      const isMockActive = localStorage.getItem(`mock_active_${series}_${testNum}`) === "true";
      setMockMode(isMockActive);
    } catch {
      setMockMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      ? fetchOurMock(series, "reading", { previewToken })
      : fetch(`/json/IELTS_${series}_Reading.json`).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const contentType = r.headers.get("content-type") || "";
          if (!contentType.includes("json")) {
            throw new Error(`Test ma'lumotlari topilmadi (IELTS_${series}_Reading.json)`);
          }
          return r.json();
        });

    load
      .then((json) => {
        if (isOurMock) {
          setData(normalizeOurMocksReading(json, testNum));
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

  // ── Annotationlarni yuklash / saqlash ───────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(notesKey);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, testNum, partNum]);
  useDebouncedLocalStorage(notesKey, annotations);

  // ── Ma'lumotlardan hisoblangan qiymatlar ────────────────────────────────────
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
  const article = useMemo(() => textData.article || {}, [textData]);

  // Convert new passages format to old sections format for ReadingPassagePanel
  const convertPassages = (passagesArr, partNumStr) => {
    const partPassage = passagesArr.find((p) => String(p.part) === partNumStr);
    if (!partPassage || !Array.isArray(partPassage.paragraphs)) return [];
    return partPassage.paragraphs.map((paraText) => ({
      items: [
        {
          items: [
            {
              sentence_raw: paraText,
              items: [],
            },
          ],
        },
      ],
    }));
  };

  const sections = useMemo(() => {
    if (isOurMock && currentTest?.passages) {
      return convertPassages(currentTest.passages, partNum);
    }
    return article.sections || [];
  }, [article, currentTest, partNum, isOurMock]);

  const passageSubtitle = useMemo(
    () => (article.subtitles && article.subtitles[0]) || "",
    [article],
  );

  const parsedAnswers = useMemo(() => {
    const raw = currentTest?.answers ?? currentPart?.answers ?? {};
    return parseAnswers(raw);
  }, [currentPart]);

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

  // ─── questionDescriptors ────────────────────────────────────────────────────
  // BUGFIX/YANGI DIZAYN: Listening'da "qaysi qid'lar mavjud" (allQuestionIds),
  // "javob to'g'rimi" (checkAnswers/scores) va "natijalar jadvali"
  // (resultRows) — bir xil savol-turi mantig'ini UCH XIL JOYDA alohida-
  // alohida qayta yozardi. Aynan shu takrorlanish (masalan checkbox'da
  // "start-end" vs "start" kaliti) ilgari haqiqiy xatolarga sabab bo'lgan.
  // Reading'da savol turlari yanada ko'p (14 xil) bo'lgani uchun, endi
  // BITTA YAGONA joyda har bir savolning {qid, qanday solishtirish kerak}
  // ro'yxati tuziladi, qolgan uchta joy shu ro'yxatdan foydalanadi.
  const questionDescriptors = useMemo(() => {
    const list = [];
    (questions || []).forEach((q) => {
      switch (q.type) {
        case "option-abc":
        case "mcq": {
          const items = q.body_smart?.items || q.body?.items || [];
          const start = q.start || 0;
          items.forEach((_, idx) =>
            list.push({ qid: String(start + idx), mode: "exact" }),
          );
          break;
        }
        case "checkbox": {
          const groupId = String(q.start);
          const qids =
            q.body_smart?.item_qids?.map(String) ||
            Array.from({ length: q.end - q.start + 1 }, (_, i) =>
              String(q.start + i),
            );
          qids.forEach((qid) => list.push({ qid, mode: "checkbox", groupId }));
          break;
        }
        case "select-given-list":
        case "select-flowchart-given-list":
        case "select-section": {
          // MUHIM: haqiqiy `ListGroupBlock.jsx` `body_smart`ga emas,
          // `body.items`ga tayanadi va ketma-ket raqamlaydi ("↓" strelka
          // belgilarini hisobga olmay). Scoring mantig'i aynan shu bilan
          // bir xil bo'lishi kerak, aks holda raqamlar mos kelmay qoladi.
          const items = q.body?.items || [];
          let running = q.start;
          items.forEach((item) => {
            if (item === "↓") return; // strelka — savol emas
            list.push({ qid: String(running), mode: "exact" });
            running++;
          });
          break;
        }
        case "select-given-diagram": {
          // MUHIM: haqiqiy `DiagramGroupBlock.jsx` ham `body_smart`ni
          // emas, `body.items`ni ishlatadi va ketma-ket (`start+idx`)
          // raqamlaydi — `item_qids`ga umuman qaramaydi.
          const items = q.body?.items || [];
          items.forEach((_, idx) => {
            list.push({ qid: String(q.start + idx), mode: "exact-lower" });
          });
          break;
        }
        case "input-diagram": {
          // DiagramGroupBlock.jsx dagi normallashtirish bilan bir xil
          // mantiq — 3 xil real shaklni (tekis / o'ralgan / nomlangan
          // guruhlar) hisobga olib, jami "bo'sh joy" sonini topamiz.
          const raw = q.body?.items || [];
          let total;
          if (
            raw.length > 0 &&
            typeof raw[0] === "object" &&
            !Array.isArray(raw[0]) &&
            raw[0] !== null &&
            Array.isArray(raw[0].items)
          ) {
            total = raw.reduce((sum, g) => sum + (g.items?.length || 0), 0);
          } else if (Array.isArray(raw[0])) {
            total = raw.flat().length;
          } else {
            total = raw.length;
          }
          for (let i = 0; i < total; i++) {
            list.push({ qid: String(q.start + i), mode: "text-alt" });
          }
          break;
        }
        case "option-true-false":
        case "option-yes-no":
        case "tf-yn": {
          const items = q.body?.items || [];
          items.forEach((_, idx) =>
            list.push({ qid: String(q.start + idx), mode: "exact" }),
          );
          break;
        }
        case "select-section-given-list": {
          // "example" turidagi statik (oldindan yechilgan) qatorlarni
          // hisobga OLMAYMIZ — ular haqiqiy savol emas.
          const items = q.body?.items || [];
          let running = q.start;
          items.forEach((it) => {
            const isExample =
              it && typeof it === "object" && it.type === "example";
            if (isExample) return;
            list.push({ qid: String(running), mode: "exact-lower" });
            running++;
          });
          break;
        }
        case "select-summary-given-list": {
          // SummarySelectGroupBlock o'z bo'shliqlarini `[qzone-input-N]`
          // ko'rinishida beradi (yoki oddiy `<input>` bilan ketma-ket).
          const items = q.body?.items || [];
          let running = q.start;
          items.forEach((p) => {
            const text = String(p ?? "");
            const re = /\[qzone-input-([^\]]+)\]|<input[^>]*>/g;
            let m;
            let found = false;
            while ((m = re.exec(text)) !== null) {
              found = true;
              list.push({
                qid: String(m[1] ? m[1].trim() : running++),
                mode: "exact",
              });
            }
            if (!found) return;
          });
          break;
        }
        case "input-table":
        case "input-note":
        case "input-sentence":
        case "input-summary":
        case "input-answer":
        case "input-form":
        case "input-flowchart": {
          if (q.start && q.end) {
            for (let i = q.start; i <= q.end; i++) {
              list.push({ qid: String(i), mode: "text-alt" });
            }
          }
          break;
        }
        case "matching": {
          const items = q.body?.items || [];
          items.forEach((item) => {
            if (item.question_num) {
              list.push({ qid: String(item.question_num), mode: "exact" });
            }
          });
          break;
        }
        default:
          break;
      }
    });
    return list;
  }, [questions]);

  const allQuestionIds = useMemo(
    () => questionDescriptors.map((d) => d.qid),
    [questionDescriptors],
  );
  const allQuestionIdsSet = useMemo(
    () => new Set(allQuestionIds),
    [allQuestionIds],
  );

  // ── Javoblar ───────────────────────────────────────────────────────────────
  const handleAnswerChange = useCallback(
    (qid, value) => setUserAnswers((p) => ({ ...p, [String(qid)]: value })),
    [],
  );

  // ─── checkAnswers — questionDescriptors'dan yagona hisoblash ───────────────
  const checkAnswers = useCallback(() => {
    const newScores = {};
    questionDescriptors.forEach((d) => {
      if (d.mode === "checkbox") {
        const groupAnswer = String(userAnswers[d.groupId] ?? "").trim();
        const selectedSet = new Set(
          groupAnswer
            .split("|")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean),
        );
        const correctOptions = String(getCorrectAnswer(d.qid))
          .split("|")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        newScores[d.qid] = Boolean(
          selectedSet.size > 0 &&
          correctOptions.length > 0 &&
          correctOptions.some((o) => selectedSet.has(o)),
        );
        return;
      }
      const userVal = String(userAnswers[d.qid] ?? "").trim();
      const correctRaw = String(getCorrectAnswer(d.qid) ?? "").trim();
      if (!userVal || !correctRaw) {
        newScores[d.qid] = false;
        return;
      }
      if (d.mode === "exact") {
        newScores[d.qid] = userVal.toUpperCase() === correctRaw.toUpperCase();
      } else if (d.mode === "exact-lower") {
        newScores[d.qid] = userVal.toLowerCase() === correctRaw.toLowerCase();
      } else {
        // text-alt — "so'z1|so'z2" kabi bir nechta to'g'ri variant
        const alts = correctRaw
          .split("|")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        newScores[d.qid] = alts.includes(userVal.toLowerCase());
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
      saveResult({
        series: parseInt(series),
        testNum: parseInt(testNum),
        details: { reading: { [`part${partNum}`]: partDetails } },
      });
      const cumRaw = getCumulativeRaw("reading", parseInt(series), parseInt(testNum));
      saveResult({
        series: parseInt(series),
        testNum: parseInt(testNum),
        reading: { raw: cumRaw, band: readingBand(cumRaw) },
      });
      submitResultSafe({
        skill: "reading",
        series_id: parseInt(series),
        test_num: parseInt(testNum),
        part_num: parseInt(partNum),
        raw_score: cumRaw,
        total_questions: 40,
        band: readingBand(cumRaw),
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
  }, [questionDescriptors, userAnswers, getCorrectAnswer, series, testNum, partNum, completedParts]);

  const checkAnswersRef = useRef(checkAnswers);
  useEffect(() => {
    checkAnswersRef.current = checkAnswers;
  }, [checkAnswers]);

  // ── Natijalar jadvali — xuddi shu questionDescriptors'dan ──────────────────
  const { correctCount, totalQuestions, resultRows } = useMemo(() => {
    const groupDisplayCache = {};
    const rows = questionDescriptors.map((d) => {
      let userAns;
      if (d.mode === "checkbox") {
        if (!(d.groupId in groupDisplayCache)) {
          const raw = String(userAnswers[d.groupId] ?? "").trim();
          const letters = raw
            .split("|")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
          groupDisplayCache[d.groupId] =
            letters.length > 0 ? letters.join(", ") : "No answer";
        }
        userAns = groupDisplayCache[d.groupId];
      } else {
        const raw = String(userAnswers[d.qid] ?? "").trim();
        userAns = raw || "No answer";
      }
      return {
        qid: d.qid,
        number: d.qid,
        userAns,
        correctAns: getCorrectAnswer(d.qid),
        isCorrect: scores[d.qid] === true,
      };
    });
    return {
      correctCount: rows.filter((r) => r.isCorrect).length,
      totalQuestions: rows.length,
      resultRows: rows,
    };
  }, [questionDescriptors, userAnswers, scores, getCorrectAnswer]);

  // ── Navigatsiya ────────────────────────────────────────────────────────────
  const goToPart = useCallback(
    (part) => {
      setShowModal(false);
      const prefix = isOurMock ? "mock" : "academic";
      navigate(`/${prefix}/${series}/${testNum}/reading/${part}`);
    },
    [navigate, series, testNum, isOurMock],
  );
  const goToPrevPart = useCallback(() => {
    const p = parseInt(partNum, 10) - 1;
    if (p >= 1) goToPart(p);
  }, [partNum, goToPart]);
  const goToNextPart = useCallback(() => {
    const p = parseInt(partNum, 10) + 1;
    if (p <= MAX_PART) goToPart(p);
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

  // ── Suzib yuruvchi boshqaruv paneli — AudioPlayer.jsx bilan bir xil drag ────
  const handleControlDragStart = useCallback(
    (e) => {
      if (
        !dragHandleRef.current?.contains(e.target) &&
        e.target !== dragHandleRef.current
      )
        return;
      // BUGFIX: sudrash paytida sichqoncha orqa fondagi matn ustidan
      // o'tganda, brauzer buni "matn tanlash" deb hisoblab, sahifa
      // matnini ko'kartirib (select qilib) qo'yardi. `preventDefault`
      // shu default xatti-harakatni to'xtatadi.
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
    // BUGFIX (davomi): drag paytida BUTUN sahifada matn tanlashni
    // vaqtincha o'chiramiz — faqat mousedown nuqtasida emas, chunki
    // mousemove paytida kursor boshqa elementlar ustidan ham o'tadi.
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    const move = (e) => {
      setControlPosition({
        x: Math.max(
          0,
          Math.min(window.innerWidth - 320, e.clientX - dragOffset.x),
        ),
        y: Math.max(
          0,
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

  // ── Ikki panel orasidagi ajratgichni sudrash (resize) ───────────────────────
  const handleSplitDragStart = useCallback((e) => {
    e.preventDefault(); // BUGFIX: xuddi shu matn-tanlash muammosi
    setIsResizingSplit(true);
  }, []);

  useEffect(() => {
    if (!isResizingSplit) return;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    const move = (e) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = ((e.clientX - rect.left) / rect.width) * 100;
      // 20%-80% oralig'ida cheklaymiz — panellardan biri butunlay
      // "yo'qolib" ketmasligi uchun.
      setSplitRatio(Math.min(80, Math.max(20, ratio)));
    };
    const end = () => setIsResizingSplit(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    return () => {
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
    };
  }, [isResizingSplit]);

  // ── Skimming Practice ────────────────────────────────────────────────────────
  // Passagedagi barcha so'zlarni sanab, tanlangan tezlik (wpm) asosida
  // umumiy davomiylikni hisoblaymiz, so'ng shu davomiylik ichida matnni
  // requestAnimationFrame bilan tekis pastga aylantiramiz va o'qish
  // chizig'ini shunga sinxron siljitamiz.
  const totalWordCount = useMemo(() => {
    let count = 0;
    const walk = (node) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (typeof node === "object") {
        if (typeof node.sentence_raw === "string") {
          count += node.sentence_raw.trim().split(/\s+/).filter(Boolean).length;
          return;
        }
        if (Array.isArray(node.items)) walk(node.items);
      }
    };
    sections.forEach((s) => walk(s.items));
    return count;
  }, [sections]);

  const stopSkimming = useCallback(() => {
    if (skimAnimRef.current) cancelAnimationFrame(skimAnimRef.current);
    skimAnimRef.current = null;
    setSkimActive(false);
    setSkimProgress(null);
    setSkimWordIndex(0);
  }, []);

  const startSkimming = useCallback(() => {
    if (!passageRef.current || totalWordCount === 0) return;
    setPassageVisible(true);
    setSkimActive(true);
    const durationMs = (totalWordCount / skimSpeed) * 60000;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      setSkimProgress(progress);
      // YANGI: hozirgi "o'qish nuqtasi"gacha bo'lgan so'zlar indeksi —
      // ReadingPassagePanel shu indeksdan oldingi so'zlarni opacity:0
      // qilib, ko'zdan g'oyib qiladi (haqiqiy skimming trenajyoridagidek).
      setSkimWordIndex(Math.floor(progress * totalWordCount));
      const el = passageRef.current;
      if (el) {
        const maxScroll = el.scrollHeight - el.clientHeight;
        el.scrollTop = progress * Math.max(0, maxScroll);
      }
      if (progress < 1) {
        skimAnimRef.current = requestAnimationFrame(step);
      } else {
        skimAnimRef.current = null;
        setSkimActive(false);
      }
    };
    skimAnimRef.current = requestAnimationFrame(step);
  }, [totalWordCount, skimSpeed]);
  const toggleSkimming = useCallback(() => {
    if (skimActive) stopSkimming();
    else startSkimming();
  }, [skimActive, stopSkimming, startSkimming]);

  useEffect(() => stopSkimming, [series, testNum, partNum, stopSkimming]);

  // ── Oddiy (mock bo'lmagan) 20 daqiqalik taymer ──────────────────────────────
  // YANGI: endi avtomatik yurmaydi — faqat `normalTimerRunning=true`
  // bo'lganda (foydalanuvchi "Start" bosgandan keyin) ishlaydi. Faqat
  // ma'lumot beruvchi — 0'ga yetganda majburiy tekshirmaydi.
  useEffect(() => {
    if (mockMode || !normalTimerRunning) return;
    const t = window.setInterval(() => {
      setNormalTimeLeft((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [mockMode, normalTimerRunning]);

  const startNormalTimer = useCallback(() => setNormalTimerRunning(true), []);
  const pauseNormalTimer = useCallback(() => setNormalTimerRunning(false), []);
  const restartNormalTimer = useCallback(() => {
    setNormalTimeLeft(NORMAL_PART_DURATION);
    setNormalTimerRunning(false);
  }, []);

  // ── Mock taymer — 60 daqiqa, 3 qismning barchasiga umumiy ──────────────────
  // localStorage'da ABSOLYUT tugash vaqti (`mockKey`) saqlanadi, shuning
  // uchun foydalanuvchi 1-qismdan 2-qismga o'tsa ham (sahifa butunlay
  // qayta yuklansa ham) taymer to'xtamaydi/qayta boshlanmaydi — real
  // IELTS imtihonidagidek.
  useEffect(() => {
    const storedEnd = Number(localStorage.getItem(mockKey));
    if (storedEnd) {
      const remain = Math.round((storedEnd - Date.now()) / 1000);
      if (remain > 0) {
        setMockMode(true);
        setMockTimeLeft(remain);
      } else {
        localStorage.removeItem(mockKey);
        setMockMode(false);
        setMockTimeLeft(null);
      }
    } else {
      setMockMode(false);
      setMockTimeLeft(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, testNum, partNum]);

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
    const t = window.setInterval(() => {
      const storedEnd = Number(localStorage.getItem(mockKey));
      const remain = Math.round((storedEnd - Date.now()) / 1000);
      if (remain <= 0) {
        window.clearInterval(t);
        localStorage.removeItem(mockKey);
        setMockMode(false);
        setMockTimeLeft(0);
        window.setTimeout(() => checkAnswersRef.current(), 0);
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
    for (let p = 1; p <= MAX_PART; p++) {
      localStorage.removeItem(
        `ielts_reading_answers_${series}_${testNum}_${p}`,
      );
    }
    setUserAnswers({});
    setScores({});
    setShowResults(false);
    setShowModal(false);
    setMockMode(true);
    setMockTimeLeft(Math.round(MOCK_TOTAL_DURATION_MS / 1000));
    setCompletedParts(new Set());
    try {
      localStorage.removeItem(`mock_completed_parts_${series}_${testNum}`);
    } catch (err) {
      console.warn('localStorage error:', err.message);
    }
  }, [series, testNum, mockKey]);

  const exitMockMode = useCallback(() => {
    localStorage.removeItem(mockKey);
    setMockMode(false);
    setMockTimeLeft(null);
  }, [mockKey]);

  // ── Text tanlash (highlight/note) ───────────────────────────────────────────
  const getSelectionDetails = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text) return null;
    const anchor = range.startContainer;
    if (
      !questionsContainerRef.current?.contains(anchor) &&
      !passageRef.current?.contains(anchor)
    )
      return null;
    return { range: range.cloneRange(), text };
  }, []);

  const handleTextSelection = useCallback(
    (e) => {
      // Mock rejimida real imtihondagidek annotatsiya (belgilash/eslatma)
      // o'chirilgan — faqat javob berish mumkin.
      if (mockMode) return;
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
    [mockMode, getSelectionDetails],
  );

  useEffect(
    () => () => {
      if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
    },
    [],
  );

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

  useEffect(() => {
    if (editingNote) noteTextareaRef.current?.focus();
  }, [editingNote]);

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

  const clearAllAnswers = useCallback(() => {
    if (!window.confirm("Confirm clear all answers?")) return;
    localStorage.removeItem(answersKey);
    setUserAnswers({});
    setShowResults(false);
    setScores({});
  }, [answersKey]);

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

  // ── Early returns ────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        className={`min-h-screen p-6 qz-anim-fade-in ${isDark ? "bg-[#0A0A0B]" : "bg-white"}`}
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
              {Array.from({ length: 8 }).map((_, i) => (
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
        className={`p-8 text-red-500 qz-anim-scale-in ${isDark ? "bg-red-900/50" : "bg-red-50"} rounded`}
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

  const timerSeconds = mockMode ? mockTimeLeft : normalTimeLeft;
  const timerIsLow = mockMode ? timerSeconds <= 300 : timerSeconds <= 120;

  return (
    <div
      data-ai="reading-page"
      data-ai-label="Reading Practice sahifasi"
      className={`h-screen flex flex-col pb-14 md:pb-0 qz-anim-fade-in ${isDark ? "bg-[#141416] text-[#F5F5F5]" : "bg-white text-[#17171A]"}`}
    >
      <ListeningAnimations />

      {/* ── Suzib yuruvchi boshqaruv paneli — Listening'dagi MP3 pleer kabi,
          istalgan joyga sudrab ko'chirsa bo'ladi ── */}
      {createPortal(
        <ReadingControlPanel
          position={controlPosition}
          dragHandleRef={dragHandleRef}
          onDragStart={handleControlDragStart}
          isDragging={isDraggingControl}
          mockMode={mockMode}
          timerSeconds={timerSeconds}
          timerIsLow={timerIsLow}
          normalTimerRunning={normalTimerRunning}
          onStart={startNormalTimer}
          onPause={pauseNormalTimer}
          onRestart={restartNormalTimer}
          onStartMock={startMockTest}
          onExitMock={exitMockMode}
          skimActive={skimActive}
          skimSpeed={skimSpeed}
          setSkimSpeed={setSkimSpeed}
          onToggleSkim={toggleSkimming}
          skimProgress={skimProgress}
        />,
        document.body,
      )}

      <div
        className={`flex items-center justify-between gap-4 px-4 py-1.5 border-b text-xs ${
          isDark
            ? "border-white/10 bg-[#141416]/40 text-white/40"
            : "border-black/[0.08] bg-black/[0.02] text-black/40"
        }`}
      >
        <span>{"Reading · Passage"} {partNum}</span>
        <span>
          {"Drag the control panel anywhere"}
        </span>
      </div>

      <main ref={mainRef} className="flex flex-col md:flex-row flex-1 md:overflow-hidden overflow-y-auto relative">
        <ReadingPassagePanel
          isDark={isDark}
          passageVisible={passageVisible}
          setPassageVisible={setPassageVisible}
          guidedMode={guidedMode}
          setGuidedMode={setGuidedMode}
          title={textData.title}
          subtitle={passageSubtitle}
          sections={sections}
          passageRef={passageRef}
          handleTextSelection={handleTextSelection}
          handleAnnotatedClick={handleAnnotatedClick}
          allQuestionIdsSet={allQuestionIdsSet}
          widthPercent={splitRatio}
          skimActive={skimActive}
          skimWordIndex={skimWordIndex}
          mockMode={mockMode}
        />

        {!passageVisible && (
          <button
            onClick={() => setPassageVisible(true)}
            title={"Show passage"}
            className="qz-btn qz-anim-pop-in absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg bg-[var(--accent)] hover:bg-black text-white dark:text-[var(--accent-contrast)] dark:hover:text-white text-sm"
          >
            <FontAwesomeIcon icon={faEye} size="lg" /> {"Passage"}
          </button>
        )}

        {/* YANGI: ikki panel orasidagi sudraladigan ajratgich — mouse bilan
            bosib, chapga/o'ngga tortib panellar kengligini o'zgartirish
            mumkin. */}
        {passageVisible && (
          <div
            onMouseDown={handleSplitDragStart}
            className={`hidden md:block w-1.5 cursor-col-resize shrink-0 z-10 hover:bg-blue-400 active:bg-blue-500 transition-colors ${
              isResizingSplit
                ? "bg-[var(--accent)]"
                : isDark
                  ? "bg-white/10"
                  : "bg-gray-200"
            }`}
            title={"Drag to resize panels"}
          />
        )}

        <ReadingQuestionsPanel
          isDark={isDark}
          questions={questions}
          containerRef={questionsContainerRef}
          showResults={showResults}
          onMouseUp={handleTextSelection}
          onClick={handleAnnotatedClick}
          userAnswers={userAnswers}
          handleAnswerChange={handleAnswerChange}
          getCorrectAnswer={getCorrectAnswer}
          onClearAnswers={mockMode ? undefined : clearAllAnswers}
          onClearAnnotations={mockMode ? undefined : clearAllAnnotations}
          widthPercent={passageVisible ? 100 - splitRatio : 100}
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
                className={`qz-btn w-8 h-8 rounded-full border transition-all duration-200 font-medium ${
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
          {"Reading · Passage"} {partNum}
        </div>
        <div className="flex gap-2">
          {isOurMock && completedParts.size >= MAX_PART ? (
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
                className="qz-btn bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                {"← Previous"}
              </button>
              <button
                onClick={goToNextPart}
                disabled={parseInt(partNum) >= MAX_PART}
                className="qz-btn bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] dark:hover:text-white px-3 py-1 rounded-lg hover:bg-black disabled:opacity-50"
              >
                {"Next →"}
              </button>
            </>
          )}
          {isOurMock && !mockMode && !completedParts.has(parseInt(partNum)) && (
            <button
              onClick={checkAnswers}
              className="qz-btn bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700"
            >
              {"Scores"}
            </button>
          )}
          {!isOurMock && !mockMode && (
            <button
              onClick={checkAnswers}
              className="qz-btn bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700"
            >
              {"Scores"}
            </button>
          )}
        </div>
      </footer>

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
        maxPart={MAX_PART}
        series={series}
        testNum={testNum}
        allPartsCompleted={isOurMock && completedParts.size >= MAX_PART}
        isOurMock={isOurMock}
      />
    </div>
  );
};

export default IELTSReading;
