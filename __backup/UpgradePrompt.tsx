// src/components/common/UpgradePrompt.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FeatureName } from "@/hooks/useFeature";
import "@/styles/common/UpgradePrompt.css";

interface UpgradePromptProps {
  featureName: FeatureName;
  message?: string;
  variant?: "modal" | "banner" | "inline";
  onClose?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  featureName,
  message,
  variant = "inline",
  onClose
}) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleUpgrade = () => {
    // Route zu deiner Stripe-/Checkout-Seite anpassen
    navigate("/billing/subscribe");
  };

  const displayMessage = message || `Dieses Feature (${featureName}) ist in CLiP BOOsT PRO enthalten.`;

  if (!open) return null;

  if (variant === "banner") {
    return (
      <div className="upgrade-banner">
        <div className="upgrade-banner-text">
          <strong>PRO Feature</strong> — {displayMessage}
        </div>
        <div className="upgrade-banner-actions">
          <button className="btn" onClick={handleUpgrade}>Jetzt upgraden</button>
          <button className="btn ghost" onClick={() => { setOpen(false); onClose?.(); }}>Später</button>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="upgrade-modal-backdrop" onClick={() => { setOpen(false); onClose?.(); }}>
        <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
          <h3>PRO erforderlich</h3>
          <p>{displayMessage}</p>
          <div className="modal-actions">
            <button className="btn" onClick={handleUpgrade}>Upgrade</button>
            <button className="btn ghost" onClick={() => { setOpen(false); onClose?.(); }}>Schließen</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-inline">
      <span className="upgrade-inline-icon">🔒</span>
      <span className="upgrade-inline-text">{displayMessage}</span>
      <button className="upgrade-inline-btn" onClick={handleUpgrade}>
        Upgraden
      </button>
    </div>
  );
};

export default UpgradePrompt;
