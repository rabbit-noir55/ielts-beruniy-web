import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faBookOpen,
  faCheck,
  faXmark,
  faRotateLeft,
  faArrowLeft,
  faTrophy,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { book, book2 } from "../data/book";

const TIMER_SECONDS = 7;

const BookSelection = ({ onSelect, isDark }) => (
  <div className={`rounded-2xl border p-6 sm:p-8 ${
    isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
  }`}>
    <div className="mb-6 text-center">
      <span className={`mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
        isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"
      }`}>
        <FontAwesomeIcon icon={faBookOpen} />
      </span>
      <h2 className={`text-xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
        Vocabulary Quiz
      </h2>
      <p className={`mt-1 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
        Lug'atni o'rganing — 1,200+ so'z
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        onClick={() => onSelect("book1")}
        className={`group rounded-xl border p-5 text-left transition ${
          isDark
            ? "border-white/10 bg-white/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/5"
            : "border-black/[0.08] bg-white hover:border-emerald-500/40 hover:bg-emerald-500/5"
        }`}
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 transition group-hover:scale-110">
            <FontAwesomeIcon icon={faBook} />
          </span>
          <div>
            <p className={`text-lg font-bold ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
              Book 1
            </p>
            <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
              {Object.keys(book).length} unit · 600 so'z
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelect("book2")}
        className={`group rounded-xl border p-5 text-left transition ${
          isDark
            ? "border-white/10 bg-white/[0.03] hover:border-rose-500/40 hover:bg-rose-500/5"
            : "border-black/[0.08] bg-white hover:border-rose-500/40 hover:bg-rose-500/5"
        }`}
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 transition group-hover:scale-110">
            <FontAwesomeIcon icon={faBookOpen} />
          </span>
          <div>
            <p className={`text-lg font-bold ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
              Book 2
            </p>
            <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
              {Object.keys(book2).length} unit · 600 so'z
            </p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-500/10 text-rose-600"
            }`}>
              Book 1 ham kiradi
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
);

const UnitSelection = ({ selectedBook, onStart, onBack, isDark }) => {
  const maxUnits = selectedBook === "book1"
    ? Object.keys(book).length
    : Object.keys(book2).length;

  const totalWords = useMemo(() => {
    if (selectedBook === "book1") {
      let count = 0;
      for (let i = 1; i <= maxUnits; i++) {
        const unitKey = `unit${i}`;
        if (book[unitKey]) count += book[unitKey].length;
      }
      return count;
    }
    let count = 0;
    for (let i = 1; i <= 30; i++) {
      const k = `unit${i}`;
      if (book[k]) count += book[k].length;
    }
    for (let i = 1; i <= maxUnits; i++) {
      const k = `unit${i}`;
      if (book2[k]) count += book2[k].length;
    }
    return count;
  }, [selectedBook, maxUnits]);

  return (
    <div className={`rounded-2xl border p-6 sm:p-8 ${
      isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
    }`}>
      <button
        onClick={onBack}
        className={`mb-4 inline-flex items-center gap-1.5 text-sm font-semibold transition ${
          isDark ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"
        }`}
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Orqaga
      </button>

      <div className="mb-5 text-center">
        <h2 className={`text-xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
          {selectedBook === "book1" ? "Book 1" : "Book 2"} — Unit tanlang
        </h2>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/50"
          }`}>
            {maxUnits} unit · {totalWords} so'z
          </span>
          {selectedBook === "book2" && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-500/10 text-rose-600"
            }`}>
              Book 1 ham kiradi
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">
        {Array.from({ length: maxUnits }, (_, i) => i + 1).map((unit) => (
          <button
            key={unit}
            onClick={() => onStart(unit)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              selectedBook === "book1"
                ? isDark
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                : isDark
                  ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                  : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
            }`}
          >
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
};

const Quiz = ({ unitNumber, selectedBook, onRestart, onBack, isDark }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  const audioTimerRef = useRef(null);
  const nextQuestionTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const allWords = useMemo(() => {
    const words = [];
    if (selectedBook === "book2") {
      for (let i = 1; i <= 30; i++) {
        const k = `unit${i}`;
        if (book[k]) words.push(...book[k]);
      }
      const n = Math.min(unitNumber, Object.keys(book2).length);
      for (let i = 1; i <= n; i++) {
        const k = `unit${i}`;
        if (book2[k]) words.push(...book2[k]);
      }
    } else {
      const n = Math.min(unitNumber, Object.keys(book).length);
      for (let i = 1; i <= n; i++) {
        const k = `unit${i}`;
        if (book[k]) words.push(...book[k]);
      }
    }
    return words;
  }, [unitNumber, selectedBook]);

  const genOptions = useCallback((word, pool) => {
    if (!word) return;
    const wrong = pool
      .filter((w) => w.english !== word.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.english);
    setOptions([word.english, ...wrong].sort(() => Math.random() - 0.5));
  }, []);

  const handleAutoNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next < questions.length) {
      setCurrentIndex(next);
      setSelected(null); setIsCorrect(null); setTimeLeft(TIMER_SECONDS);
      genOptions(questions[next], questions);
    } else {
      const reshuffled = [...allWords].sort(() => Math.random() - 0.5);
      setQuestions(reshuffled); setCurrentIndex(0);
      setSelected(null); setIsCorrect(null); setTimeLeft(TIMER_SECONDS);
      genOptions(reshuffled[0], reshuffled);
    }
  }, [currentIndex, questions, allWords, genOptions]);

  const handleNextQuestion = useCallback(() => {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    handleAutoNext();
  }, [handleAutoNext]);

  useEffect(() => {
    if (questions.length > 0 && selected === null) {
      if (timeLeft > 0) {
        countdownTimerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        handleAutoNext();
      }
    }
    return () => { if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current); };
  }, [timeLeft, selected, questions.length, handleAutoNext]);

  useEffect(() => {
    if (questions.length > 0) setTimeLeft(TIMER_SECONDS);
  }, [currentIndex, questions.length]);

  useEffect(() => {
    const audioTimer = audioTimerRef;
    const nextQuestionTimer = nextQuestionTimerRef;
    return () => {
      if (audioTimer.current) clearTimeout(audioTimer.current);
      if (nextQuestionTimer.current) clearTimeout(nextQuestionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (selected !== null) {
      if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
      nextQuestionTimerRef.current = setTimeout(() => handleNextQuestion(), isCorrect ? 2000 : 7000);
    }
    return () => { if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current); };
  }, [selected, isCorrect, handleNextQuestion]);

  useEffect(() => {
    if (allWords.length > 0) {
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      if (shuffled.length > 0) genOptions(shuffled[0], shuffled);
    }
  }, [allWords, genOptions]);

  const handleSelect = (option) => {
    if (selected !== null) return;
    const correct = option === questions[currentIndex].english;
    setSelected(option);
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
  };

  const handleSkip = () => {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    setShowResult(true);
  };

  if (questions.length === 0) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${
        isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
      }`}>
        <div className={`mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent`} />
        <p className={`text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>Yuklanmoqda...</p>
      </div>
    );
  }

  const currentWord = questions[currentIndex];
  const total = showResult ? currentIndex + 1 : questions.length;

  if (showResult) {
    const pct = Math.round((score / total) * 100);
    const color = pct >= 80 ? "text-emerald-500" : pct >= 60 ? "text-blue-500" : "text-amber-500";
    const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : "bg-amber-500";

    return (
      <div className={`rounded-2xl border p-6 sm:p-8 ${
        isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
      }`}>
        <div className="mb-6 text-center">
          <span className={`mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"
          }`}>
            <FontAwesomeIcon icon={faTrophy} />
          </span>
          <h2 className={`text-xl font-bold ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
            Quiz Natijalari
          </h2>
          <p className={`mt-1 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
            {selectedBook === "book1" ? "Book 1" : "Book 2"} · Unit {unitNumber}
          </p>
        </div>

        <div className="mb-6 text-center">
          <p className={`text-4xl font-black ${color}`}>{score} / {total}</p>
          <p className={`mt-1 text-lg font-bold ${color}`}>{pct}% To'g'ri</p>
          <div className={`mx-auto mt-3 h-3 w-full max-w-xs overflow-hidden rounded-full ${
            isDark ? "bg-white/10" : "bg-black/10"
          }`}>
            <div className={`h-3 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRestart}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              isDark ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-black/5 text-black/60 hover:bg-black/10"
            }`}
          >
            <FontAwesomeIcon icon={faRotateLeft} /> Qaytadan
          </button>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            <FontAwesomeIcon icon={faBook} /> Yangi tanlash
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 ${
      isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
    }`}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/40"
          }`}>
            {selectedBook === "book1" ? "Book 1" : "Book 2"}
          </span>
          <span className={`text-xs ${isDark ? "text-white/20" : "text-black/20"}`}>·</span>
          <span className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-black/50"}`}>
            Unit {unitNumber}
          </span>
          <span className={`text-xs ${isDark ? "text-white/20" : "text-black/20"}`}>·</span>
          <span className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-black/50"}`}>
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
            timeLeft <= 3
              ? "bg-red-500/15 text-red-500"
              : isDark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/40"
          }`}>
            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
            {timeLeft}s
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"
          }`}>
            {score}
          </span>
        </div>
      </div>

      {/* Countdown bar */}
      <div className={`mb-5 h-1.5 overflow-hidden rounded-full ${
        isDark ? "bg-white/5" : "bg-black/5"
      }`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            timeLeft <= 3 ? "bg-red-500" : "bg-[var(--accent)]"
          }`}
          style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-5 text-center">
        <p className={`text-2xl font-bold sm:text-3xl ${isDark ? "text-[#F5F5F5]" : "text-[#17171A]"}`}>
          {currentWord.uzbek}
        </p>
        <p className={`mt-2 text-xs ${isDark ? "text-white/30" : "text-black/30"}`}>
          Inglizchasini toping
        </p>
      </div>

      {/* Options */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const isSel = selected === opt;
          const isCorrectOpt = opt === currentWord.english;
          const answered = selected !== null;

          let cls;
          if (!answered) {
            cls = isDark
              ? "border-white/10 bg-white/[0.03] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 text-[#F5F5F5]"
              : "border-black/[0.08] bg-white hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 text-[#17171A]";
          } else if (isCorrectOpt) {
            cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
          } else if (isSel && !isCorrectOpt) {
            cls = "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400";
          } else {
            cls = isDark
              ? "border-white/5 bg-white/[0.01] text-white/20"
              : "border-black/[0.05] bg-black/[0.01] text-black/20";
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={answered}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${cls}`}
            >
              {answered && isCorrectOpt && <FontAwesomeIcon icon={faCheck} className="mr-2 text-emerald-500" />}
              {answered && isSel && !isCorrectOpt && <FontAwesomeIcon icon={faXmark} className="mr-2 text-red-500" />}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {selected !== null && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
          isCorrect
            ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"
            : isDark ? "bg-red-500/10 text-red-400" : "bg-red-500/10 text-red-600"
        }`}>
          {isCorrect
            ? "To'g'ri!"
            : `Noto'g'ri — to'g'ri javob: ${currentWord.english}`
          }
        </div>
      )}

      {/* Skip */}
      <div className="text-center">
        <button
          onClick={handleSkip}
          className={`text-xs font-semibold transition ${
            isDark ? "text-white/25 hover:text-white/50" : "text-black/25 hover:text-black/50"
          }`}
        >
          Natijalar →
        </button>
      </div>
    </div>
  );
};

export default function VocabularyQuiz({ theme = "dark" }) {
  const isDark = theme === "dark";
  const [step, setStep] = useState("book"); // book | unit | quiz
  const [selectedBook, setSelectedBook] = useState(null);
  const [unitNumber, setUnitNumber] = useState(null);
  const [quizRunId, setQuizRunId] = useState(0);

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setStep("unit");
  };

  const handleStart = (unit) => {
    setUnitNumber(unit);
    setQuizRunId((r) => r + 1);
    setStep("quiz");
  };

  const handleRestart = () => {
    setQuizRunId((r) => r + 1);
    setStep("quiz");
  };

  const handleBack = () => {
    if (step === "quiz") setStep("unit");
    else if (step === "unit") { setStep("book"); setSelectedBook(null); }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-5">
        <h1 className={`flex items-center gap-3 text-2xl font-bold sm:text-3xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}>
          <span className="flex items-center justify-center rounded-xl bg-[var(--accent)] p-3 text-white shadow-lg">
            <FontAwesomeIcon icon={faBookOpen} size="lg" />
          </span>
          Vocabulary Quiz
        </h1>
        <p className={`mt-2 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
          Lug'atni o'rganing — 1,200+ so'z, {TIMER_SECONDS} soniya timeout
        </p>
      </div>

      {step === "book" && (
        <BookSelection onSelect={handleBookSelect} isDark={isDark} />
      )}
      {step === "unit" && (
        <UnitSelection
          selectedBook={selectedBook}
          onStart={handleStart}
          onBack={handleBack}
          isDark={isDark}
        />
      )}
      {step === "quiz" && unitNumber && (
        <Quiz
          key={`${selectedBook}-${unitNumber}-${quizRunId}`}
          unitNumber={unitNumber}
          selectedBook={selectedBook}
          onRestart={handleRestart}
          onBack={handleBack}
          isDark={isDark}
        />
      )}
    </div>
  );
}
