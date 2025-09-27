import React, { useState } from 'react';
import Button from '../Button';

const symbolSets: Record<string, string[]> = {
  klassisch: [
    '\u{1F352}',
    '\u{1F34B}',
    '\u{1F514}',
    '\u2B50',
    '\u0037\uFE0F\u20E3',
    '\u{1F340}',
    '\u{1F48E}',
  ],
  modern: ['\u{1F347}', '\u{1F34A}', '\u{1F353}', '\u2B50', '\u{1F48E}', '\u0037\uFE0F\u20E3'],
};

type HistoryEntry = {
  combo: string[];
  result: string;
};

const evaluate = (combo: string[]): string => {
  const unique = new Set(combo);
  if (unique.size === 1) return 'JACKPOT! \u{1F389}';
  if (combo[0] === combo[1] || combo[1] === combo[2] || combo[0] === combo[2])
    return 'Fast! \u{1F642}';
  return 'Nix gewonnen \u{1F614}';
};

const SlotsGame: React.FC = () => {
  const [activeSet, setActiveSet] = useState<'klassisch' | 'modern'>('klassisch');
  const symbols = symbolSets[activeSet];
  const [reels, setReels] = useState<string[]>(['', '', '']);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const spin = () => {
    const newCombo = Array.from(
      { length: 3 },
      () => symbols[Math.floor(Math.random() * symbols.length)],
    );
    const res = evaluate(newCombo);
    setReels(newCombo);
    setResult(res);
    setHistory((prev) => [{ combo: newCombo, result: res }, ...prev].slice(0, 10)); // letzte 10
  };

  const resetHistory = () => {
    setHistory([]);
    setResult(null);
    setReels(['', '', '']);
  };

  return (
    <div className="game-card">
      <h3>Slots</h3>

      <div className="flex gap-2 mb-3">
        <Button
          variant={activeSet === 'klassisch' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveSet('klassisch')}
        >
          Klassisch
        </Button>
        <Button
          variant={activeSet === 'modern' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveSet('modern')}
        >
          Modern
        </Button>
        <Button size="sm" onClick={resetHistory}>
          ZurÃƒÂ¼cksetzen
        </Button>
      </div>

      <div style={{ fontSize: 38, margin: '10px 0' }}>
        {reels.map((symbol, i) => (
          <span key={i} style={{ margin: '0 6px' }}>
            {symbol || '\u2753'}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        <Button variant="primary" size="md" onClick={spin}>
          Drehen
        </Button>
      </div>

      {result && <div style={{ marginTop: 12, fontWeight: 600, color: '#1fffc3' }}>{result}</div>}

      {history.length > 0 && (
        <div className="mt-4 text-sm">
          <strong>Verlauf (neueste oben):</strong>
          {history.map((h, i) => (
            <div key={i} style={{ marginTop: 4 }}>
              {i + 1}. {h.combo.join(' ')} Ã¯Â¿Â½?" {h.result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlotsGame;
