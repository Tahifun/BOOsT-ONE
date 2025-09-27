// src/components/stats/StatsDashboard.tsx
import React, { useEffect, useState } from "react";
import GameLeaderboard from './GameLeaderboard';
import BotStatsPanel from './BotStatsPanel';
import UserGameStats from './UserGameStats';
import { useAuth } from "@/contexts/AuthContext";

import { getBotStats, type BotStat } from './BotStatsService';
import {
  getGameLeaderboard,
  getUserGameStats,
  type GameLeaderboardItem,
  type UserGameStat,
} from './GameStatsService';

interface StatsDashboardProps {
  userId?: string;
}

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? "";

const StatsDashboard: React.FC<StatsDashboardProps> = ({ userId }) => {
  const { token, currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [botStats, setBotStats] = useState<BotStat[]>([]);
  const [leaderboard, setLeaderboard] = useState<GameLeaderboardItem[]>([]);
  const [userStats, setUserStats] = useState<UserGameStat[]>([]);

  // Falls keine userId �bergeben wurde, versuche sie aus dem eingeloggten User zu nehmen
  const effectiveUserId =
    userId || (currentUser as any)?.id || (currentUser as any)?._id || "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [bots, lb, usr] = await Promise.all([
          getBotStats(API_BASE, token),
          getGameLeaderboard(API_BASE, token),
          effectiveUserId ? getUserGameStats(effectiveUserId, API_BASE, token) : Promise.resolve([]),
        ]);

        if (!cancelled) {
          setBotStats(bots);
          setLeaderboard(lb);
          setUserStats(usr);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e?.message ?? "Fehler beim Laden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, token]);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold"> Statistiken</h2>
        <p>? L�dt</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold"> Statistiken</h2>
        <p className="text-red-500">Fehler: {error}</p>
      </div>
    );
  }

  const empty = !botStats.length && !leaderboard.length && !userStats.length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold"> Statistiken &amp; Leaderboards</h2>
        <a
          className="btn btn-secondary"
          href={`${API_BASE}/api/stats/export`}
          target="_blank"
          rel="noopener noreferrer"
        >
          ? CSV Export
        </a>
      </div>

      {empty ? (
        <p>Keine Daten vorhanden.</p>
      ) : (
        <>
          <GameLeaderboard leaderboard={leaderboard} />
          <BotStatsPanel stats={botStats} />
          {!!effectiveUserId && <UserGameStats stats={userStats} />}
        </>
      )}
    </div>
  );
};

export default StatsDashboard;

