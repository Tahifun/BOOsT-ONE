// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// kleine, eingebettete Ressourcen - reicht f�r jetzt
const resources = {
  de: {
    translation: {
      // Livestream
      "livestream.epic_title": "Epic Livestream",
      "livestream.hide_chat": "Chat ausblenden",
      "livestream.show_chat": "Chat einblenden",

      // (Optional) weitere Keys kannst du hier erg�nzen:
      "moderation.title": "Moderation Center",
    },
  },
  en: {
    translation: {
      "livestream.epic_title": "Epic Livestream",
      "livestream.hide_chat": "Hide chat",
      "livestream.show_chat": "Show chat",
      "moderation.title": "Moderation Center",
    },
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "de",              // Startsprache
    fallbackLng: "en",      // Fallback
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: "v4",
  });

export default i18n;
