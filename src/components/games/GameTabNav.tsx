// src/components/games/GameTabNav.tsx

import React, { useState } from "react";

// Die eigentlichen Spiele werden als Props �bergeben!
interface GameTabNavProps {
  DuelGame: React.FC;
  SlotsGame: React.FC;
  QuizGame: React.FC;
  RandomNumberGame: React.FC;
  WheelGame: React.FC;
  RockPaperScissorsGame: React.FC;
}

const tabs = [
  { key: "duel", label: "Duell", comp: "DuelGame" },
  { key: "slots", label: "Slots", comp: "SlotsGame" },
  { key: "quiz", label: "Quiz", comp: "QuizGame" },
  { key: "random", label: "Zahlenraten", comp: "RandomNumberGame" },
  { key: "wheel", label: "Gl�cksrad", comp: "WheelGame" },
  { key: "rps", label: "Stein/Schere/Papier", comp: "RockPaperScissorsGame" },
];

const GameTabNav: React.FC<GameTabNavProps> = (props) => {
  const [active, setActive] = useState(tabs[0].key);

  return (
    <div>
      <div className="games-tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`games-tab-btn${active === tab.key ? " active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="games-tab-content" style={{ marginTop: 22 }}>
        {tabs.map(tab => (
          <div key={tab.key} style={{ display: active === tab.key ? "block" : "none" }}>
            {React.createElement(props[tab.comp as keyof typeof props])}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameTabNav;
