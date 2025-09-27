import React from "react";
import { useState } from "react";

const options = ["Win 10", "Niete", "Win 50", "Lose", "Win 100", "Extra Try"];

const WheelGame: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    const i = Math.floor(Math.random() * options.length);
    setResult(options[i]);
  };

  return (
    <div className="game-card">
      <h3>Gl�cksrad</h3>
      <button onClick={spin}>Drehen</button>
      {result && <div style={{ marginTop: 18, color: "#18ffe6", fontWeight: 700, fontSize: "1.2em" }}>{result}</div>}
    </div>
  );
};

export default WheelGame;


