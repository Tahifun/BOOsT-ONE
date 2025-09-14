// src/components/media/OverlayTemplateManager.adapter.tsx
import React from "react";
import OverlayTemplateManagerReal, {
  type Props as OverlayProps,
} from "./OverlayTemplateManager";

type PartialOverlayProps = Partial<OverlayProps>;

const defaults: OverlayProps = {
  templates: [],
  currentTemplate: null, // falls hier kein null erlaubt ist, sag mir den Typ
  onSaveTemplate: () => {},
  onLoadTemplate: () => {},
  onDeleteTemplate: () => {},
  onDuplicateTemplate: () => {},
  onSetCurrent: () => {},
};

const OverlayTemplateManagerAdapter: React.FC<PartialOverlayProps> = (props) => {
  return <OverlayTemplateManagerReal {...{ ...defaults, ...props }} />;
};

export default OverlayTemplateManagerAdapter;
