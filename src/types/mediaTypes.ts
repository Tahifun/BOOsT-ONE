// Zentrale Typen & Konstanten f�r Medien

/** Frontend-weit erlaubte Medientypen */
export type MediaType = "clip" | "screenshot" | "sound" | "overlay";

/** Maximalgr��en je Typ (in MB) - UI- und Server-Validierung k�nnen sich darauf beziehen */
export const MEDIA_MAX_MB: Readonly<Record<MediaType, number>> = {
  screenshot: 25,
  sound: 40,
  clip: 250,
  overlay: 200,
} as const;

/** Accept-Strings je Typ (f�r <input type="file">, Drag&Drop-Hinweise etc.) */
export const MEDIA_TYPE_ACCEPT: Readonly<Record<MediaType, string>> = {
  clip: "video/*",
  screenshot: "image/*",
  sound: "audio/*",
  overlay: "image/*,video/*,audio/*",
} as const;

/** Hilfsfunktionen */
export const getAcceptForType = (t: MediaType) => MEDIA_TYPE_ACCEPT[t];
export const getMaxBytesForType = (t: MediaType) => MEDIA_MAX_MB[t] * 1024 * 1024;
export const isMediaType = (v: unknown): v is MediaType =>
  v === "clip" || v === "screenshot" || v === "sound" || v === "overlay";

/** Upload-Payload (Client -> Server) */
export interface MediaUploadMeta {
  type: MediaType;
  name: string;
  description?: string;
}

/** Item, wie es im UI/Service verwendet werden kann */
export interface MediaItem {
  id?: string;                 // optional, falls aus DB
  type: MediaType;
  name: string;
  description?: string;
  url: string;                 // z. B. /uploads/media/clip/foo-123.webm
  size: number;                // Bytes
  mimetype: string;
  createdAt?: string;          // ISO
  updatedAt?: string;          // ISO
}

/** Standard-API-Antwort f�r Upload */
export interface MediaUploadResponse {
  ok: true;
  item: MediaItem;
}

/** (Optional) Paginierte Liste */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** (Optional) Filtermodell f�r Abfragen */
export interface MediaFilter {
  type?: MediaType;
  q?: string;
}
