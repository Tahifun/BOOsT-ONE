import React, { useState } from "react";
import Button from '../Button';

interface GuessEntry {
  guess: number;
  feedback: string;
}

const RandomNumberGame: React.FC = () => {
  const [target, setTarget] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<GuessEntry[]>([]);
  const [revealed, setRevealed] = useState(false);

  const generateNumber = () => {
    const num = Math.floor(Math.random() * 100) + 1;
    setTarget(num);
    setGuess("");
    setResult(null);
    setHistory([]);
    setRevealed(false);
  };

  const checkGuess = () => {
    if (target === null) return;
    const g = Number(guess);
    if (isNaN(g) || g < 1 || g > 100) {
      setResult("Bitte eine Zahl zwischen 1 und 100 eingeben.");
      return;
    }
    let feedback: string;
    if (g === target) {
      feedback = "Korrekt! ";
      setResult("Korrekt! ");
    } else if (g < target) {
      feedback = "Zu niedrig!";
      setResult("Zu niedrig!");
    } else {
      feedback = "Zu hoch!";
      setResult("Zu hoch!");
    }

    setHistory((prev) => [{ guess: g, feedback }, ...prev]);
  };

  const revealAnswer = () => {
    if (target !== null) {
      setRevealed(true);
      setResult(`Die Zahl war: ${target}`);
    }
  };

  return (
    <div className="game-card">
      <h3>Zahlenraten &amp; Zufallszahl</h3>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Zahl (1-100) raten"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="overlay-upload-input flex-1"
            disabled={target === null || !!result?.includes("Korrekt")}
          />
          <Button
            variant="primary"
            size="md"
            onClick={checkGuess}
            disabled={target === null || !!result?.includes("Korrekt")}
          >
            Pr�fen
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateNumber}>Neue Zahl generieren</Button>
          <Button onClick={revealAnswer} disabled={target === null || revealed}>
            Antwort anzeigen
          </Button>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 8, color: "#1fffc3", fontWeight: 600 }}>
          {result}
        </div>
      )}

      {target !== null && (
        <div className="mt-3 text-sm">
          <p>Versuche: {history.length}</p>
          {history.length > 0 && (
            <div className="mt-1">
              <strong>Verlauf:</strong>
              {history.map((h, i) => (
                <p key={i}>
                  {i + 1}. {h.guess}  {h.feedback}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RandomNumberGame;

