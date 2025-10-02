// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OverlayConfigProvider } from "@/contexts/OverlayConfigContext";
import { ModerationProvider } from "@/hooks/useModerationSettings";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

/**
 * DEV-Only: Logge Nicht-JSON-Antworten der /api/*-Requests,
 * damit "JSON.parse: unexpected character..." nicht im Dunkeln passiert.
 */
if (import.meta.env.DEV && typeof window !== "undefined") {
  const originalFetch = window.fetch.bind(window);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.fetch = (async (...args: unknown[]) => {
    const res: Response = await originalFetch(...args);
    try {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0] instanceof Request
          ? args[0].url
          : "";

      const ct = (res.headers.get("content-type") || "").toLowerCase();

      // Nur fr unsere Backend-Calls interessant
      if (url.startsWith("/api/") && !ct.includes("application/json")) {
        const preview = await res.clone().text().catch(() => "");
        // Zeig kurz an, was kam (Status/CT/Anfang vom Body)
        // eslint-disable-next-line no-console
        console.warn(
          "[fetch] Non-JSON response",
          { url, status: res.status, contentType: ct, preview: preview.slice(0, 200) }
        );
      }
    } catch {
      // defensiv: niemals den Flow brechen
    }
    return res;
  }) as typeof window.fetch;
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    {/* Auth mglichst frh, Router nur einmal */}
    <AuthProvider>
      <ThemeProvider>
        <OverlayConfigProvider>
          <ModerationProvider>
            <SubscriptionProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </SubscriptionProvider>
          </ModerationProvider>
        </OverlayConfigProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);

