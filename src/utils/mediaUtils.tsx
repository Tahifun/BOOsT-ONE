// src/utils/mediaUtils.ts

import React from "react";
import { MediaType } from '../types/mediaTypes';
import { FaVideo, FaImage, FaVolumeUp, FaShapes } from "react-icons/fa";

export function getMediaIcon(type: MediaType) {
  switch (type) {
    case "clip":
      return <FaVideo />;
    case "screenshot":
      return <FaImage />;
    case "sound":
      return <FaVolumeUp />;
    case "overlay":
      return <FaShapes />;
    default:
      return null;
  }
}

