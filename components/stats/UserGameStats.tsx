// src/components/stats/UserGameStats.tsx

import React from "react";
import type { UserGameStat } from './GameStatsService';

interface UserGameStatsProps {
  stats: UserGameStat[];
}

const UserGameStats: React.FC<UserGameStatsProps> = ({ stats }) => {
  if (!stats?.length) {
    return (
      <div className="user-game-stats p-2">
        <h3 className="font-semibold mb-2"> Deine GameStatistiken</h3>
        <p>Keine Daten vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="user-game-stats p-2">
      <h3 className="font-semibold mb-2"> Deine GameStatistiken</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 pr-3">Game</th>
            <th className="text-left py-1 pr-3">Siege</th>
            <th className="text-left py-1 pr-3">Gespielt</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((g) => (
            <tr key={g.game} className="border-b last:border-b-0">
              <td className="py-1 pr-3">{g.game}</td>
              <td className="py-1 pr-3">{g.wins}</td>
              <td className="py-1 pr-3">{g.played}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserGameStats;

