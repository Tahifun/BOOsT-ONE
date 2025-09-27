/// <reference types="vite/client" />

// Hier definieren wir alle Frontend-relevanten Variablen,
// die �ber Vite verf�gbar sein sollen.
// Wichtig: Nur Variablen mit Pr�fix "VITE_" sind f�r das Frontend sichtbar.

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;       // z. B. "http://localhost:4001"
  readonly VITE_CLIENT_ORIGIN?: string;  // optional, falls im Frontend ben�tigt
  readonly VITE_STRIPE_PUB_KEY?: string; // Stripe Publishable Key (pk_test_...)
  // weitere VITE_ Variablen hier hinzuf�gen wenn du sie brauchst
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
