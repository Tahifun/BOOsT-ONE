import React, { useState } from 'react';
import Button from '../Button';

const choices = [
  { emoji: '\u{1F44A}', name: 'Stein' },
  { emoji: '\u2702\uFE0F', name: 'Schere' },
  { emoji: '\u270B', name: 'Papier' },
];

const getResult = (user: number, comp: number) => {
  if (user === comp) return 'Unentschieden!';
  if ((user === 0 && comp === 1) || (user === 1 && comp === 2) || (user === 2 && comp === 0))
    return 'Du gewinnst! ÃƒÂ¯Ã‚Â¿Ã‚Â½YZ?';
  return 'Der Computer gewinnt!';
};

interface Round {
  user: number;
  comp: number;
  result: string;
}

const RockPaperScissorsGame: React.FC = () => {
  const [comp, setComp] = useState(0);
  const [user, setUser] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [score, setScore] = useState({ user: 0, comp: 0, ties: 0 });

  const play = (choice: number) => {
    const compChoice = Math.floor(Math.random() * 3);
    const res = getResult(choice, compChoice);
    setComp(compChoice);
    setUser(choice);
    setResult(res);
    setHistory((prev) => [{ user: choice, comp: compChoice, result: res }, ...prev]);

    setScore((prev) => {
      if (res === 'Du gewinnst! ÃƒÂ¯Ã‚Â¿Ã‚Â½YZ?') return { ...prev, user: prev.user + 1 };
      if (res === 'Unentschieden!') return { ...prev, ties: prev.ties + 1 };
      return { ...prev, comp: prev.comp + 1 };
    });
  };

  const reset = () => {
    setComp(0);
    setUser(null);
    setResult(null);
    setHistory([]);
    setScore({ user: 0, comp: 0, ties: 0 });
  };

  return (
    <div className="game-card">
      <h3>Stein, Schere, Papier</h3>

      <div className="flex gap-2 mb-2">
        {choices.map((c, i) => (
          <Button
            key={i}
            onClick={() => play(i)}
            variant="secondary"
            size="md"
            style={{
              fontSize: '2em',
              padding: 12,
              background: '#181c23',
              borderRadius: 12,
              border: '2px solid #18ffe6',
              marginRight: 7,
              minWidth: 60,
            }}
            aria-label={c.name}
          >
            {c.emoji}
          </Button>
        ))}
        <Button size="md" onClick={reset}>
          ZurÃƒÆ’Ã‚Â¼cksetzen
        </Button>
      </div>

      {user !== null && (
        <div style={{ marginTop: 12, fontWeight: 700, color: '#1fffc3' }}>
          Du: {choices[user].emoji} &nbsp; | &nbsp; Computer: {choices[comp].emoji}
          <br />
          {result}
        </div>
      )}

      <div className="mt-4">
        <div>
          <strong>Score:</strong>{' '}
          <span>
            Du {score.user} : {score.comp} Computer{' '}
            {score.ties > 0 && `(Unentschieden: ${score.ties})`}
          </span>
        </div>

        {history.length > 0 && (
          <div className="mt-2 text-sm">
            <strong>Verlauf:</strong>
            {history.map((h, i) => (
              <div key={i}>
                {i + 1}. {choices[h.user].emoji} vs {choices[h.comp].emoji} ÃƒÂ¯Ã‚Â¿Ã‚Â½?"{' '}
                {h.result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RockPaperScissorsGame;
