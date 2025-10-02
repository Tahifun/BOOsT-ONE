import React, { useState, useEffect } from "react";
import Button from '../Button';

const getRandomDamage = () => Math.floor(Math.random() * 20) + 5;

const DuelGame: React.FC = () => {
  const [players, setPlayers] = useState(["Spieler 1", "Spieler 2"]);
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  const handleChange = (i: number, value: string) => {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? value : p)));
  };

  const resetDuel = () => {
    setPlayerHP(100);
    setEnemyHP(100);
    setLog([]);
    setWinner(null);
  };

  const attack = () => {
    if (winner) return; // kein Angriff mehr, wenn schon ein Gewinner
    const playerDamage = getRandomDamage();
    const enemyDamage = getRandomDamage();

    setEnemyHP((prev) => Math.max(prev - playerDamage, 0));
    setPlayerHP((prev) => Math.max(prev - enemyDamage, 0));
    setLog((prev) => [
      `Du triffst ${players[0]} mit ${playerDamage} Schaden, ${players[1]} trifft mit ${enemyDamage}.`,
      ...prev,
    ]);
  };

  const startQuickDuel = () => {
    if (!players[0] || !players[1]) return;
    const win = players[Math.floor(Math.random() * 2)];
    setWinner(win);
  };

  // Gewinner ermitteln, wenn HP auf 0 fllt
  useEffect(() => {
    if (playerHP <= 0 && enemyHP <= 0) {
      setWinner("Unentschieden");
    } else if (playerHP <= 0) {
      setWinner(players[1]);
    } else if (enemyHP <= 0) {
      setWinner(players[0]);
    }
  }, [playerHP, enemyHP, players]);

  return (
    <div className="game-card">
      <h3>Duell: Wer gewinnt?</h3>

      <div className="flex flex-col gap-2 mb-4">
        <div>
          <input
            placeholder="Spieler 1"
            value={players[0]}
            onChange={(e) => handleChange(0, e.target.value)}
            className="overlay-upload-input mr-2"
          />
          <input
            placeholder="Spieler 2"
            value={players[1]}
            onChange={(e) => handleChange(1, e.target.value)}
            className="overlay-upload-input"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Button variant="primary" size="md" onClick={startQuickDuel} disabled={!!winner}>
          Schnelles Duell (zufllig)
        </Button>
        <Button variant="secondary" size="md" onClick={attack} disabled={!!winner || playerHP <= 0 || enemyHP <= 0}>
          Angreifen
        </Button>
        <Button size="md" onClick={resetDuel}>
          Zurcksetzen
        </Button>
      </div>

      <div className="mb-2">
        <p>
          <strong>{players[0]}</strong> HP: {playerHP}
        </p>
        <p>
          <strong>{players[1]}</strong> HP: {enemyHP}
        </p>
      </div>

      {winner && (
        <div style={{ marginTop: 14, color: "#18ffe6", fontWeight: 700 }}>
          Gewinner: {winner} {winner === "Unentschieden" ? "" : ""}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-300">
        {log.length === 0 && <p>Keine Aktionen bisher.</p>}
        {log.map((entry, i) => (
          <p key={i}>{entry}</p>
        ))}
      </div>
    </div>
  );
};

export default DuelGame;

