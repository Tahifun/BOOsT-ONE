// src/pages/SpotifyCallback.tsx (FINALE VERSION)
import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || 
  `${window.location.protocol}//${window.location.hostname}:4001`;

export default function SpotifyCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const ok = params.get("ok");
  const error = params.get("error");
  const name = params.get("name");

  // Store Spotify link status
  useEffect(() => {
    if (ok === "1") {
      localStorage.setItem("spotifyLinked", "1");
      localStorage.setItem("spotifyUserName", name || "");
    }
  }, [ok, name]);

  // Auto-redirect nach Erfolg
  useEffect(() => {
    if (ok === "1") {
      // Navigate to dashboard with spotify focus
      const timer = setTimeout(() => {
        navigate("/dashboard?spotify=1", { replace: true });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [ok, navigate]);

  const headline = useMemo(
    () => (ok === "1" ? "Spotify Anmeldung l�uft..." : "Spotify Anmeldung"),
    [ok]
  );

  return (
    <div style={{ 
      padding: "2rem",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "12px",
        padding: "3rem",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>{headline}</h1>

        {ok === "1" && (
          <>
            <div style={{ 
              fontSize: "48px", 
              textAlign: "center", 
              marginBottom: "1rem",
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              ?
            </div>
            <p style={{ 
              color: "#10b981", 
              textAlign: "center",
              fontSize: "1.1rem" 
            }}>
              Willkommen{name ? `, ${name}` : ""}! 
              <br />
              Deine Spotify-Verkn�pfung ist aktiv.
            </p>
            <p style={{ 
              color: "#6b7280", 
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.9rem"
            }}>
              Du wirst gleich weitergeleitet...
            </p>
          </>
        )}

        {error && (
          <>
            <div style={{ 
              fontSize: "48px", 
              textAlign: "center", 
              marginBottom: "1rem" 
            }}>
              ?
            </div>
            <p style={{ 
              color: "#ef4444", 
              textAlign: "center" 
            }}>
              Fehler bei der Anmeldung: {error}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                marginTop: "1.5rem",
                width: "100%",
                padding: "0.75rem",
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Zur�ck zum Dashboard
            </button>
          </>
        )}

        {!ok && !error && (
          <>
            <div style={{ 
              textAlign: "center",
              marginBottom: "1rem"
            }}>
              <div className="spinner" style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #1db954",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }} />
            </div>
            <p style={{ 
              color: "#6b7280", 
              textAlign: "center" 
            }}>
              Warte auf Antwort von Spotify...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}