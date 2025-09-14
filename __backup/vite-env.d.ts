/// <reference types="vite/client" />

// Hier definieren wir alle Frontend-relevanten Variablen,
// die über Vite verfügbar sein sollen.
// Wichtig: Nur Variablen mit Präfix "VITE_" sind für das Frontend sichtbar.

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;       // z. B. "http://localhost:4001"
  readonly VITE_CLIENT_ORIGIN?: string;  // optional, falls im Frontend benötigt
  readonly VITE_STRIPE_PUB_KEY?: string; // Stripe Publishable Key (pk_test_...)
  // weitere VITE_ Variablen hier hinzufügen wenn du sie brauchst
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
