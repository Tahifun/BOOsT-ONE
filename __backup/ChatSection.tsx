// src/components/epic/ChatSection.tsx
import React, { useState, useEffect, useRef } from "react";

export type ChatRole = 'viewer' | 'subscriber' | 'moderator' | 'vip';

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  role?: ChatRole;
}

export interface ChatSectionProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: ChatMessage) => void;
  slowMode?: number;
}

const demoMessages = [
  { user: "🎮 GameMaster", message: "Diese Grafiken sind unreal! 🤯" },
  { user: "💎 DiamondUser", message: "Beste Stream-UI die ich je gesehen habe!" },
  { user: "⚡ LightningFast", message: "So smooth, so clean! 😍" },
  { user: "🔥 HotShot", message: "Wie kann sowas so geil aussehen?!" },
  { user: "🚀 RocketScience", message: "Das ist Kunst! Pure Kunst!" },
];

export function ChatSection({ messages: controlled, onSendMessage, slowMode = 0 }: ChatSectionProps) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    { id: Date.now().toString(), user: "👑 Anna", message: "Mega Stream! Das UI macht süchtig! 🔥🔥🔥", timestamp: Date.now() }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [lastSentAt, setLastSentAt] = useState<number>(0);

  const listRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const msgs = controlled ?? localMessages;

  const scrollToBottom = (smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (stickToBottom) scrollToBottom(true);
  }, [msgs, stickToBottom]);

  useEffect(() => {
    if (controlled) return;
    const interval = setInterval(() => {
      const randomMsg = demoMessages[Math.floor(Math.random() * demoMessages.length)];
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        user: randomMsg.user,
        message: randomMsg.message,
        timestamp: Date.now(),
        role: "viewer"
      };
      setLocalMessages(prev => [...prev.slice(-49), newMsg]);
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [controlled]);

  const canSend = () => {
    if (slowMode <= 0) return true;
    const now = Date.now();
    return (now - lastSentAt) / 1000 >= slowMode;
  };

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;
    if (!canSend()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      message: text,
      timestamp: Date.now(),
      role: "viewer"
    };

    if (onSendMessage) {
      onSendMessage(msg);
    } else {
      setLocalMessages(prev => [...prev.slice(-49), msg]);
    }
    setInputValue("");
    setLastSentAt(Date.now());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceFromBottom < 40);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">💬 Live-Chat</div>
        <div className="chat-count">{Math.max(1, Math.floor(msgs.length / 3))} online</div>
      </div>

      <div className="chat-messages" ref={listRef} onScroll={onListScroll}>
        {msgs.map((m) => (
          <div key={m.id} className="chat-message">
            <span className="chat-user">{m.user}:</span>
            <span className="chat-text">{(m as any).message ?? (m as any).text}</span>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder={slowMode > 0 ? `Slow mode ${slowMode}s…` : "Schreibe eine Nachricht..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={slowMode > 0 && !canSend()}
        />
        <button className="chat-send" onClick={sendMessage} disabled={slowMode > 0 && !canSend()}>
          🚀
        </button>
      </div>
    </div>
  );
}
