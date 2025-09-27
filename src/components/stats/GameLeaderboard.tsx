import React, { useMemo } from "react";
import type { GameLeaderboardItem } from './GameStatsService';

type Props = {
  leaderboard: GameLeaderboardItem[];
};

const GameLeaderboard: React.FC<Props> = ({ leaderboard }) => {
  // Sicher sortieren & rangieren
  const ranked = useMemo(() => {
    const sorted = [...(leaderboard || [])].sort((a, b) => b.points - a.points);
    let currentRank = 0;
    let lastPoints: number | null = null;

    return sorted.map((item, idx) => {
      if (lastPoints === null || item.points !== lastPoints) {
        currentRank = idx + 1;
        lastPoints = item.points;
      }
      return { ...item, rank: currentRank };
    });
  }, [leaderboard]);

  if (!ranked.length) {
    return (
      <div className="game-leaderboard p-2">
        <h3 className="text-lg font-semibold mb-2">�Y�? Game Leaderboard</h3>
        <p className="text-sm opacity-70">Keine Einträge vorhanden.</p>
      </div>
    );
  }

  const nf = new Intl.NumberFormat("de-DE");

  return (
    <div className="game-leaderboard p-2">
      <h3 className="text-lg font-semibold mb-2">�Y�? Game Leaderboard</h3>
      <ul className="space-y-1">
        {ranked.map((user, i) => (
          <li
            key={`${user.name}-${user.points}-${i}`}
            className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 text-center font-bold">{user.rank}.</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <span className="font-mono">{nf.format(user.points)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameLeaderboard;

