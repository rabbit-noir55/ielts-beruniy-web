import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faClock, faKeyboard, faRotateLeft, faXmark, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../utils/LanguageContext";
import { saveTypingResult, fetchTypingLeaderboard } from "../utils/api";
import { WORD_BANKS, MODE_OPTIONS, TIME_OPTIONS } from "../data/typingBanks";
import TypingRevealModal from "./TypingRevealModal";
import TypingRevealModalBottom from "./TypingRevealModalBottom";

const KEYBOARD_ROWS = [
  [
    "`",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "-",
    "=",
    "Backspace",
  ],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["Caps Lock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
  ["Space"],
];

function pickWords(mode, count) {
  const bank = WORD_BANKS[mode] || WORD_BANKS.general;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const units = [];
  const pushTokens = (text) => {
    text
      .split(/\s+/)
      .filter(Boolean)
      .forEach((tk) => units.push({ text: tk }));
  };
  if (mode === "sentences") {
    let si = 0;
    while (units.length < count && si < 500) {
      pushTokens(shuffled[si % shuffled.length]);
      si += 1;
    }
  } else {
    shuffled.slice(0, count).forEach(pushTokens);
  }
  return units;
}

const KEY_LABEL = {
  Backspace: "⌫",
  Tab: "⇥",
  "Caps Lock": "⇪",
  Enter: "↵",
  Shift: "⇧",
  Space: "",
};

function countMatches(typed, target) {
  let n = 0;
  const len = Math.min(typed.length, target.length);
  for (let i = 0; i < len; i++) {
    if (typed[i] === target[i]) n++;
  }
  return n;
}

function buildStats(list, currentTyped, currentWord, extras, startAt, elapsedSeconds) {
  let correct = 0;
  let incorrect = 0;
  let missed = 0;
  const perWordWpm = [];

  const allWords = currentWord
    ? [...list, { typed: currentTyped, word: currentWord, at: Date.now() }]
    : list;

  let prevAt = startAt || allWords[0]?.at || Date.now();
  for (const w of allWords) {
    const len = w.word.length;
    const typedLen = Math.min(w.typed.length, len);
    const c = countMatches(w.typed, w.word);
    correct += c;
    incorrect += typedLen - c;
    if (w.aborted) {
      incorrect += len - typedLen;
    } else {
      missed += len - typedLen;
    }
    const dt = Math.max(0.001, (w.at - prevAt) / 1000);
    prevAt = w.at;
    perWordWpm.push(dt > 0 ? (c / 5) / (dt / 60) : 0);
  }

  const minutes = Math.max(0.01, elapsedSeconds / 60);
  const totalTyped = Math.max(1, correct + incorrect + extras);
  const wpm = Math.round((correct / 5 / minutes) * 10) / 10;
  const raw = Math.round((totalTyped / 5 / minutes) * 10) / 10;
  const accuracy = Math.round((correct / totalTyped) * 1000) / 10;

  let consistency = 100;
  if (perWordWpm.length >= 2) {
    const mean = perWordWpm.reduce((a, b) => a + b, 0) / perWordWpm.length;
    const variance =
      perWordWpm.reduce((a, b) => a + (b - mean) ** 2, 0) / perWordWpm.length;
    const sd = Math.sqrt(variance);
    consistency =
      mean > 0.0001 ? Math.round(Math.max(0, 100 - (sd / mean) * 100) * 10) / 10 : 100;
  }

  return { wpm, raw, accuracy, correct, incorrect, extra: extras, missed, consistency };
}

const Typing = ({ theme }) => {
  const isDark = theme === "dark";
  const { lang } = useLang();
  const t = (uz, en) => (lang === "uz" ? uz : en);

  const [mode, setMode] = useState("general");
  const [timeSec, setTimeSec] = useState(30);

  const [words, setWords] = useState(() => pickWords("general", 30));
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [input, setInput] = useState("");
  const [typedWords, setTypedWords] = useState([]);
  const [errors, setErrors] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(
    () => localStorage.getItem("typing-show-keyboard") !== "0",
  );
  const [perfError, setPerfError] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showRevealModal2, setShowRevealModal2] = useState(false);

  useEffect(() => {
    localStorage.setItem("typing-show-keyboard", showKeyboard ? "1" : "0");
  }, [showKeyboard]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "a") {
        e.preventDefault();
        setShowRevealModal2(false);
        setShowRevealModal((v) => !v);
      } else if (key === "m") {
        e.preventDefault();
        setShowRevealModal(false);
        setShowRevealModal2((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const timeRef = useRef(0);
  const startAtRef = useRef(null);
  const modeRef = useRef(mode);
  const wordsRef = useRef(null);
  const wordElsRef = useRef({});
  const typedPrefixRef = useRef(null);
  const caretRef = useRef(null);
  const extrasRef = useRef(0);
  const inputRef = useRef(input);
  const charIndexRef = useRef(charIndex);
  const wordIndexRef = useRef(wordIndex);
  const typedWordsRef = useRef([]);
  const errorsRef = useRef(0);
  const remainingRef = useRef(0);
  const wordListRef = useRef(words);
  const autoSavedRef = useRef(false);
  const celebrateTimerRef = useRef(null);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);
  useEffect(() => {
    wordListRef.current = words;
  }, [words]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  const visibleWords = useMemo(() => {
    return words.slice(0, wordIndex + 40);
  }, [words, wordIndex]);

  const reset = useCallback(
    (nextMode, nextTime) => {
      if (timeRef.current) {
        clearInterval(timeRef.current);
        timeRef.current = 0;
      }
      const m = nextMode || modeRef.current;
      const tm = nextTime ?? timeSec;
      setWords(pickWords(m, Math.max(60, tm * 8)));
      setWordIndex(0);
      setCharIndex(0);
      setInput("");
      setTypedWords([]);
      setErrors(0);
      setStarted(false);
      setFinished(false);
      setRemaining(0);
      setResult(null);
      setPerfError(false);
      autoSavedRef.current = false;
      setCelebrate(false);
      if (celebrateTimerRef.current) {
        clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = null;
      }
      extrasRef.current = 0;
      inputRef.current = "";
      charIndexRef.current = 0;
      wordIndexRef.current = 0;
      typedWordsRef.current = [];
      errorsRef.current = 0;
      remainingRef.current = 0;
      startAtRef.current = null;
    },
    [modeRef, timeSec],
  );

  useEffect(() => {
    const caret = caretRef.current;
    const prefix = typedPrefixRef.current;
    if (!caret || !prefix) return;
    caret.style.left = `${prefix.offsetWidth}px`;
  }, [input, wordIndex, words]);

  useEffect(() => {
    if (!started || finished) return;
    if (words.length - wordIndex < 25) {
      setWords((prev) => [...prev, ...pickWords(modeRef.current, 40)]);
    }
  }, [started, finished, wordIndex, words.length]);

  useEffect(() => {
    reset(mode, timeSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeSec]);

  const startCountdown = useCallback(() => {
    if (timeRef.current) clearInterval(timeRef.current);
    timeRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timeRef.current);
          timeRef.current = 0;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const start = useCallback(() => {
    if (!started && !finished) {
      setStarted(true);
      setRemaining(timeSec);
      remainingRef.current = timeSec;
      startAtRef.current = Date.now();
      startCountdown();
    }
  }, [started, finished, timeSec, startCountdown]);

  // Alt+A / Alt+M bilan leaderboard ochilganda test pauza bo'ladi: taymer
  // to'xtaydi, yopilganda esa o'tgan pauza vaqti hisobga olinmaydi.
  useEffect(() => {
    if (!showRevealModal && !showRevealModal2) return;
    const wasRunning = Boolean(timeRef.current);
    if (!wasRunning) return;
    clearInterval(timeRef.current);
    timeRef.current = 0;
    const pausedAt = Date.now();

    return () => {
      if (startedRef.current && !finishedRef.current && remainingRef.current > 0) {
        if (startAtRef.current) {
          startAtRef.current += Date.now() - pausedAt;
        }
        startCountdown();
      }
    };
  }, [showRevealModal, showRevealModal2, startCountdown]);

  const finish = useCallback(
    (list, currentTyped, currentWord, finalErrors, elapsed) => {
      clearInterval(timeRef.current);
      timeRef.current = 0;
      const seconds = elapsed || (Date.now() - (startAtRef.current || Date.now())) / 1000;
      const stats = buildStats(
        list,
        currentTyped,
        currentWord,
        extrasRef.current,
        startAtRef.current || Date.now(),
        seconds,
      );

      setResult({
        mode: modeRef.current,
        duration_seconds: Math.round(seconds),
        wpm: stats.wpm,
        raw: stats.raw,
        accuracy: stats.accuracy,
        characters: stats.correct,
        correct: stats.correct,
        incorrect: stats.incorrect,
        extra: stats.extra,
        missed: stats.missed,
        consistency: stats.consistency,
        errors: finalErrors,
      });
      setFinished(true);
      setStarted(false);
    },
    [],
  );

  const advanceWord = useCallback(
    (typedText, feedChar) => {
      const wIndex = wordIndexRef.current;
      const wordList = wordListRef.current;
      const currentWord = wordList[wIndex]?.text || "";
      const nextWord = wordList[wIndex + 1]?.text || "";
      const aborted = typedText.length < currentWord.length;
      const newTypedWords = [
        ...typedWordsRef.current,
        { word: currentWord, typed: typedText, aborted },
      ];

      if (wIndex === wordList.length - 1) {
        if (remainingRef.current > 0) {
          clearInterval(timeRef.current);
          timeRef.current = 0;
          setStarted(false);
          setPerfError(true);
          return;
        }
        const extraCorrect = feedChar ? countMatches(feedChar, nextWord) : 0;
        const extraError = feedChar && !extraCorrect ? 1 : 0;
        const elapsed = (Date.now() - (startAtRef.current || Date.now())) / 1000;
        finish(newTypedWords, "", "", errorsRef.current + extraError, elapsed);
        return;
      }

      typedWordsRef.current = newTypedWords;
      setTypedWords(newTypedWords);
      wordIndexRef.current = wIndex + 1;
      setWordIndex(wIndex + 1);
      charIndexRef.current = feedChar ? 1 : 0;
      setCharIndex(feedChar ? 1 : 0);
      inputRef.current = feedChar || "";
      setInput(feedChar || "");
      if (feedChar && feedChar !== nextWord[0]) {
        errorsRef.current += 1;
        setErrors((prev) => prev + 1);
        extrasRef.current += 1;
      }
    },
    [finish],
  );

const handleKey = useCallback(
    (e) => {
      if (finished || showRevealModal || showRevealModal2) return;
      if (e.key === "Enter" && !started) {
        e.preventDefault();
        start();
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        if (e.key === "Enter" && started) e.preventDefault();
        return;
      }
      e.preventDefault();

      if (!started) start();

      const curWord = (wordListRef.current[wordIndexRef.current] || {}).text || "";
      const ci = charIndexRef.current;

      if (e.key === " ") {
        if (curWord[ci] === " ") {
          inputRef.current += " ";
          setInput((prev) => prev + " ");
          charIndexRef.current = ci + 1;
          setCharIndex(ci + 1);
          return;
        }
        if (ci === 0) return;
        advanceWord(inputRef.current);
        return;
      }

      const nextInput = inputRef.current + e.key;
      if (nextInput.length > curWord.length) {
        advanceWord(inputRef.current, e.key);
        return;
      }

      if (e.key !== curWord[ci]) {
        errorsRef.current += 1;
        setErrors((prev) => prev + 1);
      }
      inputRef.current = nextInput;
      setInput(nextInput);
      charIndexRef.current = ci + 1;
      setCharIndex(ci + 1);
    },
    [started, finished, start, advanceWord, showRevealModal, showRevealModal2],
  );

  const handleBackspace = useCallback(
    (e) => {
      if (finished || !started) return;
      e.preventDefault();
      if (inputRef.current.length > 0) {
        inputRef.current = inputRef.current.slice(0, -1);
        setInput(inputRef.current);
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setCharIndex(charIndexRef.current);
      } else if (wordIndexRef.current > 0) {
        const wIndex = wordIndexRef.current;
        const popped =
          typedWordsRef.current[typedWordsRef.current.length - 1] || {
            typed: "",
          };
        const restored = popped.typed || "";
        wordIndexRef.current = wIndex - 1;
        setWordIndex(wordIndexRef.current);
        typedWordsRef.current = typedWordsRef.current.slice(0, -1);
        setTypedWords(typedWordsRef.current);
        inputRef.current = restored;
        setInput(restored);
        charIndexRef.current = restored.length;
        setCharIndex(restored.length);
      }
    },
    [started, finished],
  );

  const onKeyDown = useCallback(
    (e) => {
      if (showRevealModal || showRevealModal2) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      setActiveKey(key);
      if (e.key === "Backspace") {
        handleBackspace(e);
      } else {
        handleKey(e);
      }
    },
    [handleKey, handleBackspace, showRevealModal, showRevealModal2],
  );

  useEffect(() => {
    const clear = () => setActiveKey(null);
    window.addEventListener("keyup", clear, true);
    window.addEventListener("blur", clear, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", clear, true);
      window.removeEventListener("blur", clear, true);
    };
  }, [onKeyDown]);

  useEffect(() => {
    return () => {
      if (timeRef.current) clearInterval(timeRef.current);
      if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (remaining === 0 && started) {
      const currentWord = words[wordIndex]?.text || "";
      const elapsed = (Date.now() - (startAtRef.current || Date.now())) / 1000;
      finish(typedWords, input, currentWord, errors, elapsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, started]);

  useEffect(() => {
    const wrap = wordsRef.current;
    const active = wordElsRef.current[wordIndex];
    if (!wrap || !active) return;
    const wrapRect = wrap.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const target =
      wrap.scrollTop +
      (activeRect.top - wrapRect.top) -
      (wrapRect.height - activeRect.height) / 2;
    if (Math.abs(target - wrap.scrollTop) > 2) {
      wrap.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  }, [wordIndex, words]);

  const loadLeaderboard = useCallback(async (m) => {
    try {
      const data = await fetchTypingLeaderboard(m);
      setLeaderboard(data.entries || []);
      setMyRank(data.me || null);
      return data;
    } catch {
      setLeaderboard([]);
      setMyRank(null);
      return { entries: [], me: null };
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(mode); // eslint-disable-line react-hooks/set-state-in-effect
  }, [mode, loadLeaderboard]);

  const saveResult = useCallback(async () => {
    if (!result || saving) return;
    setSaving(true);
    const prevRank = myRank?.rank ?? null;
    try {
      await saveTypingResult(result);
      const data = await loadLeaderboard(modeRef.current);
      const newRank = data?.me?.rank ?? null;
      const overtook =
        newRank !== null && (newRank < prevRank || newRank === 1);
      if (overtook) {
        setCelebrate(true);
        if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = setTimeout(
          () => setCelebrate(false),
          4500,
        );
      }
    } catch {
      // offline — natija backendda saqlanmaydi, lekin UI buzilmaydi
    } finally {
      setSaving(false);
    }
  }, [result, saving, loadLeaderboard, myRank?.rank]);

  const isNewBest = !myRank || result?.wpm > myRank.wpm;

  useEffect(() => {
    if (!finished || !result || saving || autoSavedRef.current) return;
    autoSavedRef.current = true;
    if (isNewBest) saveResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, result, saving, myRank]);

  const elapsedLive = started ? timeSec - remaining : 0;
  const currentWord = words[wordIndex]?.text || "";
  const correctLive =
    typedWords.reduce((s, w) => s + countMatches(w.typed, w.word), 0) +
    countMatches(input, currentWord);
  const typedChars = correctLive + errors;
  const liveWpm =
    started && elapsedLive > 0
      ? Math.round((correctLive / 5 / (elapsedLive / 60)) * 10) / 10
      : 0;
  const liveAccuracy =
    started && typedChars > 0
      ? Math.round((correctLive / typedChars) * 1000) / 10
      : 100;

  const renderWord = (word, idx, globalIndex) => {
    const text = typeof word === "string" ? word : word?.text || "";
    const isCurrent = globalIndex === wordIndex && !finished;
    const isDone = globalIndex < wordIndex || finished;
    const doneTyped =
      finished && globalIndex === wordIndex
        ? input
        : typedWords[globalIndex]?.typed || "";
    const isAborted = isDone && typedWords[globalIndex]?.aborted;
    let className = "mr-2 inline-block text-[1.15rem] leading-8 sm:text-2xl";
    if (isDone) {
      className += isDark ? " text-stone-300" : " text-stone-600";
    } else if (isCurrent) {
      className += isDark ? " text-stone-100" : " text-stone-800";
    } else {
      className += isDark ? " text-stone-500" : " text-stone-400";
    }

    if (isCurrent) {
      return (
        <span
          key={idx}
          ref={(el) => {
            if (el) wordElsRef.current[globalIndex] = el;
          }}
          className={`relative ${className}`}
        >
          <span
            ref={typedPrefixRef}
            className="whitespace-pre"
            aria-hidden="true"
          >
            {input.split("").map((ch, ci) => {
              const ok = ch === text[ci];
              return (
                <span
                  key={ci}
                  className={
                    ok
                      ? isDark
                        ? "text-stone-100"
                        : "text-stone-800"
                      : isDark
                        ? "text-red-400 underline decoration-red-400/70"
                        : "text-red-500 underline decoration-red-500/70"
                  }
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              );
            })}
          </span>
          {text.slice(input.length).split("").map((ch, ci) => (
            <span
              key={ci}
              className={isDark ? "text-stone-500" : "text-stone-400"}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
          <span
            ref={caretRef}
            className="pointer-events-none absolute top-1/2 w-[2px] -translate-y-1/2 bg-[var(--accent)]"
            style={{
              left: 0,
              height: "1.5em",
              transition: "left 120ms ease",
            }}
          />
        </span>
      );
    }

    return (
      <span
        key={idx}
        className={className}
      >
{text.split("").map((ch, ci) => {
          const displayCh = ch === " " ? "\u00A0" : ch;
          if (isAborted && !doneTyped[ci]) {
            return (
              <span
                key={ci}
                className={`${isDark ? "text-red-400" : "text-red-500"} underline decoration-red-500/60`}
              >
                {displayCh}
              </span>
            );
          }
          if (isDone && doneTyped[ci] && doneTyped[ci] !== ch) {
            return (
              <span
                key={ci}
                className={`${isDark ? "text-red-400" : "text-red-500"} underline`}
              >
                {displayCh}
              </span>
            );
          }
          return <span key={ci}>{displayCh}</span>;
        })}
      </span>
    );
  };

  const card = (extra = "") =>
    `rounded-2xl border ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"} ${extra}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6">
      {/* Sarlavha */}
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2 text-[var(--accent)]">
           <FontAwesomeIcon icon={faKeyboard} size="lg" />
          <span className="text-sm font-bold uppercase tracking-widest">
            {t("Tezkor yozuv", "Fast typing")}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {t("Tez yozish testi", "Typing test")}
        </h1>
        <p className={`text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
          {t(
            "Yozish tezligingizni o'lchang va leaderboardda o'rningizni ko'ring.",
            "Measure your typing speed and see your place on the leaderboard.",
          )}
        </p>
      </div>

      {/* Sozlamalar: rejim + vaqt + kalaviatura/reyting */}
      <div className={`${card()} p-3 sm:p-4`}>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          {/* Rejim */}
          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              {t("Rejim", "Mode")}
            </span>
            <div
              className={`flex flex-wrap justify-center gap-1 rounded-full border p-1 ${
                isDark
                  ? "border-white/10 bg-white/[0.05]"
                  : "border-black/[0.06] bg-black/[0.04]"
              }`}
            >
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                    mode === opt.key
                      ? "qz-pill-active bg-[var(--accent)] text-white shadow dark:text-[var(--accent-contrast)]"
                      : isDark
                        ? "text-white/60 hover:bg-white/10"
                        : "text-black/55 hover:bg-black/[0.05]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vaqt */}
          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              {t("Vaqt", "Time")}
            </span>
            <div
              className={`flex flex-wrap justify-center gap-1 rounded-full border p-1 ${
                isDark
                  ? "border-white/10 bg-white/[0.05]"
                  : "border-black/[0.06] bg-black/[0.04]"
              }`}
            >
              {TIME_OPTIONS.map((tm) => (
                <button
                  key={tm}
                  onClick={() => setTimeSec(tm)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 sm:text-sm ${
                    timeSec === tm
                      ? "qz-pill-active bg-[var(--accent)] text-white shadow dark:text-[var(--accent-contrast)]"
                      : isDark
                        ? "text-white/60 hover:bg-white/10"
                        : "text-black/55 hover:bg-black/[0.05]"
                  }`}
                >
                  {tm}
                </button>
              ))}
            </div>
          </div>

          {/* Ajratuvchi chiziq */}
          <div
            className={`hidden h-10 w-px sm:block ${
              isDark ? "bg-white/10" : "bg-black/[0.08]"
            }`}
          />

          {/* Sozlamalar tugmalari */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setShowKeyboard((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                showKeyboard
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow dark:text-[var(--accent-contrast)]"
                  : isDark
                    ? "border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10"
                    : "border-black/[0.08] bg-white text-black/60 shadow-sm hover:bg-black/[0.03]"
              }`}
              title={t(
                showKeyboard
                  ? "Ekrandagi klaviaturani yashirish"
                  : "Ekrandagi klaviaturani ko'rsatish",
                showKeyboard
                  ? "Hide on-screen keyboard"
                  : "Show on-screen keyboard",
              )}
            >
              <FontAwesomeIcon icon={faKeyboard} size="lg" />
              {t("Klaviatura", "Keyboard")}
            </button>
            <button
              onClick={() => setShowLeaderboard((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                showLeaderboard
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)]"
                  : isDark
                    ? "border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10"
                    : "border-black/[0.08] bg-white text-black/60 shadow-sm hover:bg-black/[0.03]"
              }`}
              title={t("Leaderboard", "Leaderboard")}
            >
               <FontAwesomeIcon icon={faAward} size="lg" />
               {t("Reyting", "Leaderboard")}
            </button>
          </div>
        </div>
      </div>

      {/* Statistikalar — faqat test tugagandan so'ng ko'rsatiladi */}
      {finished && (
        <div className={`${card()} grid grid-cols-3 gap-2 p-4 text-center`}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
              WPM
            </div>
            <div className="text-2xl font-extrabold text-[var(--accent)]">
              {finished ? (result?.wpm ?? 0) : liveWpm}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
              %
            </div>
            <div className="text-2xl font-extrabold text-emerald-500">
              {finished ? (result?.accuracy ?? 0) : liveAccuracy}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
              {t("Vaqt", "Time")}
            </div>
            <div className="text-2xl font-extrabold text-rose-500">
              {finished ? "✓" : remaining}
            </div>
          </div>
        </div>
      )}

      {/* Matn maydoni */}
      <div
        className={`${card(" relative select-none p-5 sm:p-8")} ${
          finished ? "opacity-50" : ""
        }`}
      >
        {perfError && (
          <div className="absolute right-4 top-4 z-10 max-w-xs rounded-xl border border-rose-500/40 bg-rose-950/90 p-3 text-xs font-semibold text-rose-200 shadow-lg">
            {t(
              "Yomon unumdorlik sababli test to'xtatildi. Bu hisob-kitoblarni noto'g'ri qilib qo'yishi mumkin edi.",
              "Stopping the test due to bad performance. This would cause test calculations to be incorrect.",
            )}
          </div>
        )}
        <div className="mb-4 flex h-7 items-center justify-between">
          {started && !finished ? (
            <div className="text-2xl font-extrabold text-[var(--accent)]">
              {remaining}
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 text-xs ${
                isDark ? "text-white/40" : "text-black/40"
              }`}
            >
              <FontAwesomeIcon icon={faClock} size="lg" />
              <span className={isDark ? "text-white/50" : "text-black/50"}>
                {t("Yo'naltirilgan so'zlar", "Active words")} · {words.length}
              </span>
            </div>
          )}
          <button
            onClick={() => reset(mode, timeSec)}
            className={`rounded-full p-2 text-sm transition ${
              isDark
                ? "bg-white/10 text-white/60 hover:bg-white/20"
                : "bg-black/5 text-black/50 hover:bg-black/10"
            }`}
            aria-label="Reset"
          >
            <FontAwesomeIcon icon={faRotateLeft} size="lg" />
          </button>
        </div>
        <div
          ref={wordsRef}
          className={`scrollbar-hide flex h-[5.8rem] flex-wrap justify-center gap-x-2 gap-y-1 overflow-y-auto overflow-x-hidden font-mono leading-8 sm:h-[6.5rem] ${
            started || finished ? "cursor-default" : "cursor-text"
          }`}
        >
          {visibleWords.map((w, i) => renderWord(w, i, i))}
        </div>
        {!started && !finished && (
          <div className="mt-4 text-center text-sm font-semibold text-white/40">
            <span className={isDark ? "text-white/60" : "text-black/60"}>
              {t(
                "Yozishni boshlash uchun yozishni boshla yoki Enter",
                "Start typing to begin",
              )}
            </span>
          </div>
        )}
      </div>

      {/* On-screen keyboard */}
      {showKeyboard && (
        <div className={`${card(" p-4")} hidden sm:block`}>
          <div className="flex flex-col items-center gap-1.5">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-1.5">
                {row.map((key, ki) => {
                  const isSpace = key === "Space";
                  const isActive = activeKey === key;
                  const keyStyle = isSpace
                    ? "w-64"
                    : key.length > 2
                      ? "min-w-16 px-2"
                      : "w-10";
                  return (
                    <div
                      key={`${ri}-${ki}-${key}`}
                      className={`flex h-11 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-75 ${
                        isActive
                          ? "scale-110 border-[var(--accent)] bg-[var(--accent)] text-white shadow-lg dark:text-[var(--accent-contrast)]"
                          : isDark
                            ? "border-white/10 bg-white/5 text-white/60"
                            : "border-black/10 bg-black/5 text-black/60"
                      } ${keyStyle}`}
                    >
                      {KEY_LABEL[key] ?? key}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Natija */}
      {finished && result && (
        <div className={`${card(" p-6")}`}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-6xl font-black leading-none tracking-tight">
                {result.wpm}
              </div>
              <div
                className={`mt-1 text-sm font-bold uppercase tracking-widest ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                wpm
              </div>
            </div>
            <div className="text-right">
              <div className="text-6xl font-black leading-none tracking-tight text-emerald-500">
                {result.accuracy}%
              </div>
              <div
                className={`mt-1 text-sm font-bold uppercase tracking-widest ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                acc
              </div>
            </div>
          </div>

          {/* Test turi */}
          <div
            className={`mt-6 border-t pt-4 text-sm font-semibold ${
              isDark ? "border-white/10 text-white/50" : "border-black/10 text-black/50"
            }`}
          >
            {t("test turi", "test type")}{" "}
            <span className="text-[var(--accent)]">
              {t("vaqt", "time")} {result.duration_seconds}
            </span>{" "}
            ·{" "}
            <span className="text-[var(--accent)]">
              {MODE_OPTIONS.find((m) => m.key === result.mode)?.label}
            </span>
          </div>

          {/* Statistika to'ri */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-extrabold">{result.raw}</div>
              <div
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                raw
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">
                <span className="text-emerald-500">{result.correct}</span>/
                <span className="text-rose-500">{result.incorrect}</span>/
                <span className="text-amber-500">{result.extra}</span>/
                <span className="opacity-50">{result.missed}</span>
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                {t("harflar", "characters")}
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">
                {result.consistency}%
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                {t("bir xillik", "consistency")}
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">
                {result.duration_seconds}s
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "text-white/40" : "text-black/40"
                }`}
              >
                {t("vaqt", "time")}
              </div>
            </div>
          </div>

          {/* Harflar legendasi */}
          <div
            className={`mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold ${
              isDark ? "text-white/40" : "text-black/40"
            }`}
          >
            <span>
              <span className="text-emerald-500">✓</span>{" "}
              {t("to'g'ri", "correct")}
            </span>
            <span>
              <span className="text-rose-500">✗</span> {t("xato", "incorrect")}
            </span>
            <span>
              <span className="text-amber-500">+</span> {t("ortiqcha", "extra")}
            </span>
            <span>
              <span className="opacity-50">−</span>{" "}
              {t("o'tkazib yuborilgan", "missed")}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={`flex items-center gap-2 text-sm font-bold ${
                isNewBest
                  ? "text-emerald-500"
                  : isDark
                    ? "text-white/40"
                    : "text-black/40"
              }`}
            >
              {saving ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("Saqlanmoqda...", "Saving...")}
                </>
              ) : isNewBest ? (
                <>
                   <FontAwesomeIcon icon={faTrophy} size="lg" className="text-[var(--accent)]" />{" "}
                   {t(
                     "Yangi rekord — Leaderboardga avtomatik saqlandi",
                    "New record — auto-saved to leaderboard",
                  )}
                </>
              ) : (
                <>
                  {t(
                    "Bu avvalgi rekordingizdan past — saqlanmadi",
                    "Lower than your best — not saved",
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => reset(mode, timeSec)}
              disabled={saving}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                isDark
                  ? "bg-white/10 text-white/70 hover:bg-white/20"
                  : "bg-black/5 text-black/60 hover:bg-black/10"
              }`}
            >
              <FontAwesomeIcon icon={faRotateLeft} size="lg" className="mr-1" />
              {t("Qayta urinish", "Retry")}
            </button>
          </div>
        </div>
      )}

      {/* Tabriklash animatsiyasi */}
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center">
          <div className="qz-confetti" />
          <div className="qz-congrats-pop relative rounded-3xl border border-[var(--accent)] bg-white/90 px-10 py-8 text-center shadow-2xl backdrop-blur dark:bg-[#141416]/95">
            <div className="text-5xl">🎉🏆</div>
            <div className="mt-2 text-3xl font-black text-[var(--accent)]">
              {t("Tabriklayman!", "Congratulations!")}
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-white/50" : "text-black/50"
              }`}
            >
              {t(
                `Leaderboardda birovdan o'zib ketdingiz!`,
                "You overtook someone on the leaderboard!",
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[998] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm qz-fade-in"
            onClick={() => setShowLeaderboard(false)}
          />

          <div
            className={`relative flex h-full w-full max-w-md flex-col overflow-hidden border-l shadow-2xl ${card(" p-5 qz-slide-right-in")}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <FontAwesomeIcon
                  icon={faAward}
                  size="lg"
                  className="text-[var(--accent)]"
                />
                {t("Leaderboard", "Leaderboard")}
              </h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className={`rounded-full p-1.5 text-sm transition ${
                  isDark
                    ? "bg-white/10 text-white/60 hover:bg-white/20"
                    : "bg-black/5 text-black/50 hover:bg-black/10"
                }`}
                title={t("Yopish", "Close")}
              >
                 <FontAwesomeIcon icon={faXmark} size="lg" />
              </button>
            </div>

            <span
              className={`mb-3 text-xs font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}
            >
              {t("Eng yaxshi WPM", "Best WPM")} ·{" "}
              {MODE_OPTIONS.find((m) => m.key === mode)?.label}
            </span>

            <div className="flex-1 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div
                  className={`rounded-xl p-6 text-center text-sm ${isDark ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}
                >
                  {t(
                    "Hali natija yo'q. Birinchi bo'lib o'rningni ol!",
                    "No results yet. Be the first to take a spot!",
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      className={`text-xs uppercase tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}
                    >
                      <th className="pb-2 pr-2 font-bold">#</th>
                      <th className="pb-2 pr-2 font-bold">
                        {t("O'quvchi", "Student")}
                      </th>
                      <th className="pb-2 pr-2 text-right font-bold">WPM</th>
                      <th className="pb-2 text-right font-bold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => {
                      const isMe =
                        myRank && entry.student_id === myRank.student_id;
                      return (
                        <tr
                          key={`${entry.student_id}-${i}`}
                          className={`border-t ${
                            isDark ? "border-white/5" : "border-black/5"
                          } ${i < 3 ? "text-[var(--accent)]" : ""}`}
                        >
                          <td className="py-2 pr-2 font-bold">
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : i + 1}
                          </td>
                          <td
                            className={`py-2 pr-2 font-semibold ${isMe ? "text-[var(--accent)]" : ""}`}
                          >
                            {entry.name}
                            {isMe && (
                              <span className="ml-1 text-[10px] font-bold">
                                ({t("sen", "you")})
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-2 text-right font-bold">
                            {entry.wpm}
                          </td>
                          <td className="py-2 text-right text-emerald-500">
                            {entry.accuracy}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {myRank && myRank.student_id !== undefined && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${isDark ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"}`}
                >
                  <FontAwesomeIcon
                    icon={faTrophy}
                    size="lg"
                    className="text-[var(--accent)]"
                  />
                  {t(
                    `Sening eng yaxshi WPM: ${myRank.wpm} (o'rin #${myRank.rank})`,
                    `Your best WPM: ${myRank.wpm} (rank #${myRank.rank})`,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aura Reveal leaderboard */}
      <TypingRevealModal
        isOpen={showRevealModal}
        onClose={() => setShowRevealModal(false)}
        leaderboard={leaderboard}
        myRank={myRank}
      />

      {/* Pastdan chiqadigan TOP 10 leaderboard (Alt+M) */}
      <TypingRevealModalBottom
        isOpen={showRevealModal2}
        onClose={() => setShowRevealModal2(false)}
        leaderboard={leaderboard}
        myRank={myRank}
      />
    </div>
  );
};

export default Typing;
