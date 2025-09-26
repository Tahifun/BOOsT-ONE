// src/components/games/MiniGamesPage.tsx

import React from "react";
import ProFeatureWrapper from "@/components/common/ProFeatureWrapper";
import GameTabNav from './GameTabNav';
import DuelGame from './DuelGame';
import SlotsGame from './SlotsGame';
import QuizGame from './QuizGame';
import RandomNumberGame from './RandomNumberGame';
import WheelGame from './WheelGame';
import RockPaperScissorsGame from './RockPaperScissorsGame';
import "../../styles/GamesPanel.css";

/**
 * MiniGamesPage  KOMPLETT hinter PRO-Gate.
 * Free-Nutzer sehen eine entsperrte Preview (grau) mit -Hinweis
 * über den ProFeatureWrapper (inkl. Upsell-CTA).
 */
const MiniGamesPage: React.FC = () => {
  return (
    <ProFeatureWrapper
      featureName="mini_games_page"
      showUpgradePrompt
      message="MiniGames sind Teil von PRO. Hol dir Abo oder Tageskarte (24h) für vollen Zugriff."
    >
      <div className="games-panel">
        <h2> MiniGames</h2>
        <GameTabNav
          DuelGame={DuelGame}
          SlotsGame={SlotsGame}
          QuizGame={QuizGame}
          RandomNumberGame={RandomNumberGame}
          WheelGame={WheelGame}
          RockPaperScissorsGame={RockPaperScissorsGame}
        />
      </div>
    </ProFeatureWrapper>
  );
};

export default MiniGamesPage;

