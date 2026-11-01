import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faPlay,
  faPause,
  faRotateLeft,
  faStop,
  faClock,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const IconBtn = ({
  icon,
  onClick,
  title,
  active,
  tone = "default",
  disabled,
}) => {
  const toneClasses = {
    default: "text-white/50 hover:text-white hover:bg-white/10",
    green: "text-green-400 hover:bg-green-500/15",
    amber: "text-amber-400 hover:bg-amber-500/15",
    red: "text-red-400 hover:bg-red-500/15",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`qz-icon-btn w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? "bg-white/15 text-white" : toneClasses[tone]
      }`}
    >
      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
    </button>
  );
};

const WritingControlPanel = ({
  position,
  dragHandleRef,
  onDragStart,
  isDragging,
  mockMode,
  timerSeconds,
  timerIsLow,
  timerRunning,
  onStart,
  onPause,
  onRestart,
  onStartMock,
  onExitMock,
}) => {
  const [expanded, setExpanded] = useState(true);
  const collapseTimer = useRef(null);

  const scheduleCollapse = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 2500);
  };

  useEffect(() => {
    scheduleCollapse();
    return () => clearTimeout(collapseTimer.current);
  }, []);

  useEffect(() => {
    if (isDragging) {
      setExpanded(true);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    } else {
      scheduleCollapse();
    }
  }, [isDragging]);

  const handleEnter = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    setExpanded(true);
  };
  const handleLeave = () => scheduleCollapse();

  return (
    <div
      className="fixed z-[999] bg-[#0A0A0B]/95 text-white rounded-full shadow-xl qz-anim-scale-in flex items-center gap-1 px-1.5 py-1.5 backdrop-blur-sm"
      style={{ left: position.x, top: position.y }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => !expanded && setExpanded(true)}
    >
      <div
        ref={dragHandleRef}
        className="qz-icon-btn cursor-grab active:cursor-grabbing text-white/30 hover:text-white/50 w-5 h-7 flex items-center justify-center shrink-0"
        onMouseDown={onDragStart}
        title={"Drag to move"}
      >
        <FontAwesomeIcon icon={faGripVertical} className="w-3.5 h-3.5" />
      </div>

      <div
        className={`flex items-center gap-1.5 px-2 h-7 rounded-full font-mono text-xs font-semibold shrink-0 ${
          timerIsLow
            ? "bg-red-500/20 text-red-300"
            : "bg-white/10 text-white/90"
        }`}
        title={
          mockMode ? "Mock: 60-min timer" : "Practice timer"
        }
      >
        <FontAwesomeIcon icon={faClock} className={`w-4 h-4 ${mockMode ? "text-yellow-400" : ""}`} />
        {formatClock(timerSeconds)}
      </div>

      {expanded && (
        <div className="flex items-center gap-1 qz-anim-fade-in">
          <div className="w-px h-5 bg-white/15 mx-0.5" />

          {!mockMode && (
            <>
              {!timerRunning ? (
                <IconBtn
                  icon={faPlay}
                  onClick={onStart}
                  title={"Start timer"}
                  tone="green"
                />
              ) : (
                <IconBtn
                  icon={faPause}
                  onClick={onPause}
                  title={"Stop timer"}
                  tone="amber"
                />
              )}
              <IconBtn
                icon={faRotateLeft}
                onClick={onRestart}
                title={"Reset timer"}
              />
              <div className="w-px h-5 bg-white/15 mx-0.5" />
            </>
          )}

          {!mockMode ? (
            <IconBtn
              icon={faGraduationCap}
              onClick={onStartMock}
              title={"Start Mock Test (60 min, Task 1+2)"}
            />
          ) : (
            <IconBtn
              icon={faStop}
              onClick={onExitMock}
              title={"Exit Mock Test"}
              tone="red"
              active
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WritingControlPanel;
