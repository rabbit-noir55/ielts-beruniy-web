import { Suspense, lazy } from "react";
import { Navigate, useParams } from "react-router-dom";
import { gameMeta } from "../games/registry";

const COMPONENTS = {
  "word-shooter": lazy(() => import("../games/WordShooter")),
  "falling-words": lazy(() => import("../games/FallingWords")),
  "word-snake": lazy(() => import("../games/WordSnake")),
  "bubble-pop": lazy(() => import("../games/BubblePop")),
  "memory-match": lazy(() => import("../games/MemoryMatch")),
  "spell-rush": lazy(() => import("../games/SpellRush")),
  "word-scramble": lazy(() => import("../games/WordScramble")),
  "quiz-rush": lazy(() => import("../games/QuizRush")),
  "word-chain": lazy(() => import("../games/WordChain")),
  hangman: lazy(() => import("../games/Hangman")),
  "missing-letter": lazy(() => import("../games/MissingLetter")),
  "typing-race": lazy(() => import("../games/TypingRace")),
  "word-ladder": lazy(() => import("../games/WordLadder")),
  "word-search": lazy(() => import("../games/WordSearch")),
};

export default function BuiltinGame({ theme }) {
  const { key } = useParams();
  const meta = gameMeta(key);
  const Component = COMPONENTS[key];

  if (!meta || !Component) return <Navigate to="/games" replace />;

  return (
    <Suspense
      fallback={
        <div
          className={`flex min-h-screen items-center justify-center text-sm ${
            theme === "dark" ? "bg-[#08080A] text-white/50" : "bg-[#F6F5F2] text-black/50"
          }`}
        >
          O'yin yuklanmoqda…
        </div>
      }
    >
      <Component theme={theme} />
    </Suspense>
  );
}
