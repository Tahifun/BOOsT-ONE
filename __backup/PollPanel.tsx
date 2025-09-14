// ==================== POLL PANEL COMPONENT ====================
// src/components/epic/PollPanel.tsx
import React, { useState } from "react";

export function PollPanel() {
  const [votes, setVotes] = useState({ A: 65, B: 35 });

  const vote = (option: 'A' | 'B') => {
    setVotes(prev => ({
      A: option === 'A' ? prev.A + 1 : prev.A,
      B: option === 'B' ? prev.B + 1 : prev.B
    }));
  };

  const total = votes.A + votes.B;

  return (
    <div className="epic-panel poll-panel">
      <h3 className="panel-title">📊 Community-Abstimmung</h3>
      
      <div className="poll-widget">
        <div className="poll-question">Was soll als nächstes passieren?</div>
        <div className="poll-options">
          <div className="poll-option" onClick={() => vote('A')}>
            <div 
              className="poll-progress" 
              style={{ width: `${(votes.A / total) * 100}%` }}
            ></div>
            <div className="poll-text">
              🎮 Gaming Session ({Math.round((votes.A / total) * 100)}%)
            </div>
          </div>
          <div className="poll-option" onClick={() => vote('B')}>
            <div 
              className="poll-progress" 
              style={{ width: `${(votes.B / total) * 100}%` }}
            ></div>
            <div className="poll-text">
              💬 Just Chatting ({Math.round((votes.B / total) * 100)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
