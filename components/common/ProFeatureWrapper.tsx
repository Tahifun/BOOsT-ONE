// src/components/common/ProFeatureWrapper.tsx
import React, { PropsWithChildren } from "react";
import { FeatureName, useIsProFeatureEnabled } from "@/hooks/useFeature";
import UpgradePrompt from './UpgradePrompt';
import "@/styles/common/ProFeatureWrapper.css";

interface ProFeatureWrapperProps extends PropsWithChildren {
  featureName: FeatureName;
  message?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const ProFeatureWrapper: React.FC<ProFeatureWrapperProps> = ({
  featureName,
  message,
  fallback,
  showUpgradePrompt = true,
  children
}) => {
  const enabled = useIsProFeatureEnabled(featureName);

  if (enabled) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  if (showUpgradePrompt) {
    return (
      <div className="pro-feature-wrapper">
        {children}
        <div className="pro-feature-overlay">
          <UpgradePrompt featureName={featureName} message={message} variant="inline" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="pro-feature-wrapper"
      data-feature-name={featureName}
      style={{ filter: "grayscale(0.3)", opacity: 0.7, pointerEvents: "none" }}
    >
      {children}
    </div>
  );
};

export default ProFeatureWrapper;

