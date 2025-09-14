import React from "react";
import type { BotStat } from './BotStatsService';

type Props = {
  stats: BotStat[];
};

const BotStatsPanel: React.FC<Props> = ({ stats }) => {
  if (!stats || stats.length === 0) {
    return (
      <div className="bot-stats-panel p-2">
        <h3 className="text-lg font-semibold mb-2">ðŸ¤– Bot-Stats</h3>
        <p className="text-sm opacity-70">Keine Daten vorhanden.</p>
      </div>
    );
  }

  const nf = new Intl.NumberFormat("de-DE");

  return (
    <div className="bot-stats-panel p-2">
      <h3 className="text-lg font-semibold mb-2">ðŸ¤– Bot-Stats</h3>
      <ul className="space-y-1">
        {stats.map((s) => (
          <li
            key={s.label}
            className="flex justify-between rounded-md bg-white/5 px-3 py-2"
          >
            <span>{s.label}</span>
            <span className="font-mono">{nf.format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BotStatsPanel;

