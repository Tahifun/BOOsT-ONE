/// <reference types="vite/client" />

// Hier definieren wir alle Frontend-relevanten Variablen,
// die ber Vite verfgbar sein sollen.
// Wichtig: Nur Variablen mit Prfix "VITE_" sind fr das Frontend sichtbar.

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;       // z. B. "http://localhost:4001"
  readonly VITE_CLIENT_ORIGIN?: string;  // optional, falls im Frontend bentigt
  readonly VITE_STRIPE_PUB_KEY?: string; // Stripe Publishable Key (pk_test_...)
  // weitere VITE_ Variablen hier hinzufgen wenn du sie brauchst
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
