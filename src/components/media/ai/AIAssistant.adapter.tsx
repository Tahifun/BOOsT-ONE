// src/components/media/ai/AIAssistant.adapter.tsx
import React from "react";
import AIAssistantReal, { type AIAssistantProps } from "./AIAssistant";

type PartialProps = Partial<AIAssistantProps>;

const defaults: AIAssistantProps = {
  mediaId: "demo",
  duration: 0,
  currentTime: 0,
  onSuggestionApply: () => {},
  onJumpTo: () => {},
  onClose: () => {},
};

const AIAssistantAdapter: React.FC<PartialProps> = (props) => {
  return <AIAssistantReal {...{ ...defaults, ...props }} />;
};

export default AIAssistantAdapter;
