import React from "react";
import { useState } from "react";
import Button from '../Button';

const questions = [
  {
    q: "Was ist die Hauptstadt von Frankreich?",
    a: ["Berlin", "Madrid", "Paris", "Rom"],
    correct: 2
  },
  {
    q: "Wie viele Planeten hat unser Sonnensystem?",
    a: ["7", "8", "9", "10"],
    correct: 1
  },
  {
    q: "Wer hat den Computer erfunden?",
    a: ["Steve Jobs", "Konrad Zuse", "Elon Musk", "Bill Gates"],
    correct: 1
  }
];

const QuizGame: React.FC = () => {
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);

  const handleAnswer = (idx: number) => {
    if (idx === questions[step].correct) setCorrect(c => c + 1);
    setStep(s => s + 1);
  };

  if (step >= questions.length) {
    return (
      <div className="game-card">
        <h3>Quiz beendet!</h3>
        <div>Dein Ergebnis: {correct} von {questions.length} richtig! �YZ?</div>
        <Button variant="secondary" size="md" onClick={() => { setStep(0); setCorrect(0); }}>Neu starten</Button>
      </div>
    );
  }

  return (
    <div className="game-card">
      <h3>Quiz</h3>
      <div style={{ margin: "8px 0 12px 0" }}>{questions[step].q}</div>
      {questions[step].a.map((a, idx) =>
        <button
          key={idx}
          style={{ margin: "6px 0", display: "block", width: "100%" }}
          onClick={() => handleAnswer(idx)}
        >
          {a}
        </button>
      )}
    </div>
  );
};

export default QuizGame;


