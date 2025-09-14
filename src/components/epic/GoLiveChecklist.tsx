import React, { useState, useEffect } from "react";

interface GoLiveChecklistProps {
  /** Optional – wenn nicht gesetzt, schließt das Modal nur lokal */
  onComplete?: () => void;
  /** Optional: initial geöffnet? default: true */
  initialOpen?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  emoji: string;
  description: string;
  completed: boolean;
}

const GoLiveChecklist: React.FC<GoLiveChecklistProps> = ({ onComplete, initialOpen = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: "camera",      label: "Camera Test",      emoji: "📸", description: "Check camera quality and positioning", completed: false },
    { id: "microphone",  label: "Microphone Test",  emoji: "🎤", description: "Test audio levels and quality",        completed: false },
    { id: "internet",    label: "Internet Connection", emoji: "🌐", description: "Verify stable internet speed",    completed: false },
    { id: "overlay",     label: "Overlay Settings", emoji: "🎨", description: "Configure stream overlays and scenes", completed: false },
    { id: "moderation",  label: "Chat Moderation",  emoji: "🛡️", description: "Set up chat moderators and filters",  completed: false },
    { id: "title",       label: "Stream Title",     emoji: "📝", description: "Set engaging stream title and tags",   completed: false },
    { id: "thumbnail",   label: "Thumbnail",        emoji: "🖼️", description: "Upload attractive stream thumbnail",   completed: false },
    { id: "backup",      label: "Backup Plan",      emoji: "🆘", description: "Prepare contingency plans",             completed: false },
  ]);

  const [completedCount, setCompletedCount] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Erst nach Mount sichtbar (für Animation)
  useEffect(() => {
    if (initialOpen) setIsVisible(true);
  }, [initialOpen]);

  // Fortschritt berechnen
  useEffect(() => {
    const completed = checklistItems.filter((i) => i.completed).length;
    setCompletedCount(completed);
    setProgressPercentage((completed / checklistItems.length) * 100);
    const all = completed === checklistItems.length;
    setIsAllComplete(all);
    if (all && !showCelebration) {
      setShowCelebration(true);
      createCelebrationEffect();
    }
  }, [checklistItems, showCelebration]);

  const toggleItem = (id: string) => {
    setChecklistItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)));
  };

  // Konfetti-Emojis
  const createCelebrationEffect = () => {
    const emojis = ["🎉", "🎊", "✨", "🌟", "🎆", "🎈", "🥳"];
    const container = document.querySelector<HTMLElement>(".checklist-modal");
    if (!container) return;
    for (let i = 0; i < 20; i++) {
      const el = document.createElement("div");
      el.className = "celebration-emoji";
      el.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = `
        position:absolute;font-size:2rem;pointer-events:none;
        top:${Math.random() * 100}%;left:${Math.random() * 100}%;
        animation:celebrationFloat 3s ease-out forwards;z-index:1001;
      `;
      container.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  };

  const handleReadyToGo = () => {
    setIsVisible(false);
    setTimeout(() => onComplete?.(), 300);
  };

  if (!initialOpen) return null;

  return (
    <>
      <style>{`
        @keyframes modalSlideIn { 0%{opacity:0;transform:scale(.8) translateY(50px)}100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes checkmarkSlide { 0%{opacity:0;transform:scale(0) rotate(-45deg)}50%{opacity:1;transform:scale(1.2) rotate(-45deg)}100%{opacity:1;transform:scale(1) rotate(-45deg)} }
        @keyframes celebrationFloat { 0%{opacity:1;transform:translateY(0) scale(0) rotate(0)}20%{opacity:1;transform:translateY(-20px) scale(1) rotate(90deg)}100%{opacity:0;transform:translateY(-100px) scale(.5) rotate(360deg)} }
        @keyframes readyButtonPulse { 0%,100%{box-shadow:0 0 20px rgba(67,233,123,.6)} 50%{box-shadow:0 0 40px rgba(67,233,123,1)} }
        @keyframes completedGlow { 0%,100%{box-shadow:0 0 15px rgba(67,233,123,.4)} 50%{box-shadow:0 0 25px rgba(67,233,123,.8)} }
        .celebration-emoji{position:absolute;pointer-events:none;user-select:none}
      `}</style>

      <div
        className={`checklist-backdrop ${isVisible ? "visible" : ""}`}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.8)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          opacity: isVisible ? 1 : 0,
          transition: "opacity .3s ease",
        }}
      >
        <div
          className="checklist-modal"
          role="dialog"
          aria-modal="true"
          style={{
            background: "rgba(17,25,40,.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 24,
            padding: "2rem",
            maxWidth: 600,
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            animation: isVisible ? "modalSlideIn .6s cubic-bezier(.175,.885,.32,1.275)" : "none",
            boxShadow: "0 20px 60px rgba(0,0,0,.4)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: "0 0 1rem 0",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              🚀 Pre-Stream Checklist
            </h2>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: "1.1rem", margin: 0 }}>
              Complete all items before going live
            </p>
          </div>

          {/* Progress */}
          <ProgressBar completed={completedCount} total={checklistItems.length} percent={progressPercentage} all={isAllComplete} />

          {/* Items */}
          <div style={{ marginBottom: "2rem" }}>
            {checklistItems.map((item) => (
              <ChecklistRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "grid", gap: 8 }}>
            <button
              onClick={handleReadyToGo}
              disabled={!isAllComplete}
              style={{
                width: "100%",
                padding: "1.5rem 2rem",
                fontSize: "1.5rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
                border: "none",
                borderRadius: 16,
                cursor: isAllComplete ? "pointer" : "not-allowed",
                background: isAllComplete
                  ? "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)"
                  : "rgba(255,255,255,.1)",
                color: isAllComplete ? "#fff" : "rgba(255,255,255,.5)",
                transition: "all .3s cubic-bezier(.175,.885,.32,1.275)",
                opacity: isAllComplete ? 1 : 0.5,
                transform: isAllComplete ? "scale(1)" : "scale(.95)",
                animation: isAllComplete ? "readyButtonPulse 2s ease-in-out infinite" : "none",
              }}
            >
              {isAllComplete ? "🚀 READY TO GO LIVE!" : `${completedCount}/${checklistItems.length} Complete`}
            </button>

            {/* Optional: Überspringen */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onComplete?.(), 200);
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,.25)",
                color: "#fff",
                borderRadius: 12,
                padding: "0.75rem 1rem",
                cursor: "pointer",
              }}
            >
              Später erledigen
            </button>
          </div>

          {showCelebration && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(67,233,123,.1)",
                padding: "2rem",
                borderRadius: 16,
                border: "2px solid rgba(67,233,123,.3)",
                textAlign: "center",
                animation: "modalSlideIn .5s ease-out",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#43e97b", marginBottom: ".5rem" }}>
                All Set!
              </div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: "1rem" }}>You're ready to go live!</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

function ProgressBar({
  completed,
  total,
  percent,
  all,
}: {
  completed: number;
  total: number;
  percent: number;
  all: boolean;
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
        <span style={{ color: "rgba(255,255,255,.9)", fontSize: "1rem", fontWeight: 600 }}>
          Progress: {completed}/{total}
        </span>
        <span
          style={{
            color: all ? "#43e97b" : "rgba(255,255,255,.7)",
            fontSize: "1.2rem",
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          {Math.round(percent)}%
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 12,
          background: "rgba(255,255,255,.1)",
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            background: all
              ? "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)"
              : "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
            borderRadius: 6,
            width: `${percent}%`,
            transition: "all .5s cubic-bezier(.175,.885,.32,1.275)",
            boxShadow: all ? "0 0 20px rgba(67,233,123,.6)" : "0 0 15px rgba(79,172,254,.4)",
          }}
        />
      </div>
    </div>
  );
}

function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem",
        marginBottom: ".75rem",
        background: item.completed ? "rgba(67,233,123,.1)" : "rgba(255,255,255,.05)",
        border: item.completed ? "1px solid rgba(67,233,123,.3)" : "1px solid rgba(255,255,255,.1)",
        borderRadius: 12,
        cursor: "pointer",
        transition: "all .3s cubic-bezier(.175,.885,.32,1.275)",
        transform: item.completed ? "scale(1.02)" : "scale(1)",
        animation: item.completed ? "completedGlow 2s ease-in-out infinite" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
        e.currentTarget.style.background = item.completed ? "rgba(67,233,123,.15)" : "rgba(255,255,255,.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = item.completed ? "scale(1.02)" : "scale(1)";
        e.currentTarget.style.background = item.completed ? "rgba(67,233,123,.1)" : "rgba(255,255,255,.05)";
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: item.completed ? "2px solid #43e97b" : "2px solid rgba(255,255,255,.3)",
          borderRadius: 8,
          background: item.completed ? "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all .3s ease",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {item.completed && (
          <div
            style={{
              width: 12,
              height: 6,
              border: "2px solid #fff",
              borderTop: "none",
              borderRight: "none",
              transform: "rotate(-45deg)",
              animation: "checkmarkSlide .4s cubic-bezier(.175,.885,.32,1.275)",
            }}
          />
        )}
      </div>

      <div style={{ fontSize: "1.5rem", flexShrink: 0, filter: item.completed ? "none" : "grayscale(.5)", transition: "filter .3s" }}>
        {item.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: item.completed ? "#43e97b" : "#fff",
            marginBottom: ".25rem",
            transition: "color .3s",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.label}
        </div>
        <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,.7)", lineHeight: 1.4 }}>{item.description}</div>
      </div>

      <div style={{ fontSize: "1.2rem", opacity: item.completed ? 1 : 0.3, transition: "opacity .3s" }}>
        {item.completed ? "✅" : "⭕"}
      </div>
    </div>
  );
}

export default GoLiveChecklist;
