﻿// src/contexts/MediaContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { MediaItem } from '../types/mediaTypes';
import {
  fetchMedia,
  uploadMediaFile,
  deleteMedia,
  MediaUploadMeta,
} from '../services/mediaService';
import { MediaType } from '../types/mediaTypes';

/** Typen fÃ¼r Upload-Parameter: erlaubt entweder schon validierten MediaType oder beliebigen string mit Laufzeit-Check */
interface FileUploadParams {
  file: File;
  meta: {
    type: MediaType; // korrekt typisiert
    name: string;
    description?: string;
    duration?: number;
    tags?: string;
  };
}

interface FileUploadParamsRaw {
  file: File;
  meta: {
    type: string; // roher String, wird validiert
    name: string;
    description?: string;
    duration?: number;
    tags?: string;
  };
}

/** Guard fÃ¼r MediaType */
function isMediaType(v: string): v is MediaType {
  return ["clip", "screenshot", "sound", "overlay"].includes(v);
}

interface MediaContextType {
  mediaItems: MediaItem[];
  reloadMedia: () => Promise<void>;
  addMedia: (params: FileUploadParams | FileUploadParamsRaw) => Promise<void>;
  removeMedia: (id: string) => Promise<void>;
}

export const MediaContext = createContext<MediaContextType>({
  mediaItems: [],
  reloadMedia: async () => {},
  addMedia: async () => {},
  removeMedia: async () => {},
});

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const reloadMedia = async () => {
    try {
      const list = await fetchMedia();
      setMediaItems(list);
    } catch (e) {
      console.error("Fehler beim Laden der Media-Liste:", e);
    }
  };

  const addMedia = async (params: FileUploadParams | FileUploadParamsRaw) => {
    const { file, meta } = params as any;

    // Typ prÃ¼fen / konvertieren
    let mediaMeta: MediaUploadMeta;
    if (isMediaType(meta.type)) {
      mediaMeta = {
        type: meta.type,
        name: meta.name,
        description: meta.description,
      };
    } else {
      throw new Error(`UngÃ¼ltiger media type: ${meta.type}`);
    }

    await uploadMediaFile(file, mediaMeta);
    await reloadMedia();
  };

  const removeMedia = async (id: string) => {
    await deleteMedia(id);
    await reloadMedia();
  };

  useEffect(() => {
    reloadMedia();
  }, []);

  return (
    <MediaContext.Provider value={{ mediaItems, reloadMedia, addMedia, removeMedia }}>
      {children}
    </MediaContext.Provider>
  );
};

