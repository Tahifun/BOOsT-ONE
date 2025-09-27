import React from "react";
import { useEffect, useState } from "react";
import { getSpotifyProfile, type SpotifyProfile } from '../services/spotifyService';
import "../styles/spotify.css";

const SpotifyProfileCard: React.FC = () => {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getSpotifyProfile(); // null, wenn nicht verknüpft
        if (!mounted) return;
        setProfile(p);
      } catch (e: unknown) {
        if (!mounted) return;
        setErr(e?.message || "Spotify-Profil konnte nicht geladen werden.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={`spotify-profile-card${loading ? " is-loading" : ""}`} aria-live="polite">
      <div className="sp-header">
        <div className="sp-badge" aria-hidden title="Spotify">�T�</div>
        <h3 style={{ margin: 0, fontWeight: 600 }}>Spotify-Profil</h3>
      </div>

      {loading && (
        <div className="sp-row" aria-hidden>
          <div className="sp-skeleton" style={{ width: 56, height: 56, borderRadius: "50%" }} />
          <div style={{ flex: 1 }}>
            <div className="sp-skeleton" style={{ height: 14, width: "70%", borderRadius: 6 }} />
            <div className="sp-skeleton" style={{ height: 12, width: "40%", marginTop: 8, borderRadius: 6 }} />
          </div>
        </div>
      )}

      {!loading && err && (
        <div className="sp-error" role="alert">
          {err}
        </div>
      )}

      {!loading && !err && !profile && (
        <div className="sp-muted">
          Kein Spotify-Konto verbunden.
          <br />
          <span style={{ fontSize: 12 }}>Verbinde dich über den Button in der Seitenleiste.</span>
        </div>
      )}

      {!loading && !err && profile && (
        <div className="sp-row">
          <img
            src={
              profile.imageUrl ||
              "data:image/svg+xml;utf8," +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
                     <rect width='100%' height='100%' fill='#0f1620'/>
                     <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='#7fd' font-size='12' font-family='Arial'>No Image</text>
                   </svg>`
                )
            }
            alt="Spotify Profilbild"
            className="sp-avatar"
          />
          <div style={{ minWidth: 0 }}>
            <div className="sp-name">{profile.displayName || profile.id}</div>
            <div className="sp-sub">
              {typeof profile.followers === "number"
                ? `${profile.followers.toLocaleString()} Follower`
                : "Follower �?" n/a"}
            </div>
            {profile.url && (
              <a href={profile.url} target="_blank" rel="noreferrer" className="sp-link">
                Profil öffnen �?-
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyProfileCard;



