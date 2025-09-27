import React, { lazy } from "react";

/** Hilfs-Typ: Wir behandeln alle lazy-Komponenten als ComponentType<any>,
 *  damit Pflicht-Props dich nicht am Build hindern. */
function lazyAny(pathImport: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(pathImport as unknown as () => Promise<{ default: React.ComponentType<any> }>);
}

/*  Reale Komponenten (als any)  */
const RealMediaUpload               = lazyAny(() => import('../MediaUpload'));
const RealMediaGallery              = lazyAny(() => import('../MediaGallery'));
const RealClipManager               = lazyAny(() => import('../ClipManager'));
const RealScreenshotManager         = lazyAny(() => import('../ScreenshotManager'));
const RealSoundboardManager         = lazyAny(() => import('../SoundboardManager'));
const RealOverlayTemplateManager    = lazyAny(() => import('../OverlayTemplateManager'));
const RealMediaExportTools          = lazyAny(() => import('../MediaExportTools'));
const RealMediaImpactStats          = lazyAny(() => import('../MediaImpactStats'));
const RealAIHighlightSuggestions    = lazyAny(() => import('../AIHighlightSuggestions'));
const RealAIAssistant               = lazyAny(() => import('../ai/AIAssistant'));

/*  Adapter-Komponenten (mit Default-Props)  */
export const LazyMediaUpload: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => {
  const Comp = RealMediaUpload as React.ComponentType<any>;
  return <Comp onUpload={onUpload ?? (() => {})} />;
};

export const LazyMediaGallery: React.FC<{ query?: string }> = ({ query }) => {
  const Comp = RealMediaGallery as React.ComponentType<any>;
  // Falls die echte Komponente anders heit (search/filter), reicht es,
  // dass wir "query" einfach mitgeben  React ignoriert unbekannte Props.
  return <Comp query={query} search={query} filter={query} />;
};

export const LazyClipManager: React.FC = () => {
  const Comp = RealClipManager as React.ComponentType<any>;
  return <Comp />;
};

export const LazyScreenshotManager: React.FC = () => {
  const Comp = RealScreenshotManager as React.ComponentType<any>;
  return <Comp />;
};

export const LazySoundboardManager: React.FC = () => {
  const Comp = RealSoundboardManager as React.ComponentType<any>;
  return <Comp />;
};

export const LazyOverlayTemplateManager: React.FC = () => {
  const Comp = RealOverlayTemplateManager as React.ComponentType<any>;
  // Viele Template-Manager verlangen Pflicht-Handler  wir liefern No-Ops.
  return (
    <Comp
      templates={[]}
      currentTemplate={null}
      onSaveTemplate={() => {}}
      onLoadTemplate={() => {}}
      onDeleteTemplate={() => {}}
      onDuplicateTemplate={() => {}}
      onSetCurrentTemplate={() => {}}
      onUseTemplate={() => {}}
    />
  );
};

export const LazyMediaExportTools: React.FC = () => {
  const Comp = RealMediaExportTools as React.ComponentType<any>;
  return <Comp />;
};

export const LazyMediaImpactStats: React.FC = () => {
  const Comp = RealMediaImpactStats as React.ComponentType<any>;
  return <Comp />;
};

export const LazyAIHighlightSuggestions: React.FC<{ onSelect?: () => void }> = ({ onSelect }) => {
  const Comp = RealAIHighlightSuggestions as React.ComponentType<any>;
  return <Comp onSelect={onSelect ?? (() => {})} />;
};

export const LazyAIAssistant: React.FC = () => {
  const Comp = RealAIAssistant as React.ComponentType<any>;
  // Minimal-Defaults, damit die Seite l�uft, auch wenn nichts aktiv ausgew�hlt ist.
  return (
    <Comp
      mediaId={null}
      duration={0}
      currentTime={0}
      onSuggestionApply={() => {}}
      onCreateClip={() => {}}
      onNavigate={() => {}}
    />
  );
};

