// src/components/shared/Sidebar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  User as UserIcon,
  UploadCloud,            // <- Upload-Icon (sichtbar)
  Radio as StreamIcon,
  Rocket as ProIcon,
  Gamepad2 as GamesIcon,
  LayoutDashboard as OverlayIcon,
  LayoutDashboard as DashboardIcon,
  BarChart3 as AnalyticsIcon,
  FolderOpen as MediaIcon,
  Music2 as SpotifyIcon,
  Video as TikTokIcon,
  ShieldCheck,
  Home as HomeIcon,
  Clock,
} from "lucide-react";

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import "../../styles/shared/Sidebar.css";
import "@/styles/TierUI.css";

const FUNCTION_PAGES = [
  { to: "/", label: "Home", icon: <HomeIcon size={18} /> },
  { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon size={18} /> },
  { to: "/overlay", label: "Overlay & Widgets", icon: <OverlayIcon size={18} /> },
  { to: "/bot-games", label: "Bot & Games", icon: <GamesIcon size={18} /> },
  { to: "/media", label: "Media", icon: <MediaIcon size={18} /> },
  { to: "/analytics", label: "Analytics", icon: <AnalyticsIcon size={18} /> },
] as const;

const SPOTIFY_LOGIN_URL = "/api/spotify/login";
const TIKTOK_LOGIN_URL  = "/api/oauth/tiktok";
const UPGRADE_ROUTE = "/subscribe";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme, themeClass } = useTheme();
  const { token, currentUser } = useAuth();
  const { isPro, isDayPass, msRemaining } = useSubscription();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const primaryLabel = useMemo(
    () => currentUser?.displayName || currentUser?.email?.split("@")[0] || "Benutzer",
    [currentUser]
  );
  const secondaryLabel = currentUser?.email ?? undefined;
  const avatarInitial = primaryLabel?.charAt(0)?.toUpperCase?.() || "U";

  useEffect(() => setTheme("epic"), [setTheme]);

  function formatHMS(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  const goToLivestream = () => navigate("/epiclivestream");

  const onPickAvatar = () => fileInputRef.current?.click();
  const onChangeAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const isLivestreamActive =
    location.pathname.startsWith("/epiclivestream") || location.pathname === "/live";

  return (
    <aside className={`epic-sidebar ${themeClass}`}>
      {/* Profil */}
      <section className="sb-panel profile-panel">
        <div className="panel-title"><UserIcon size={16} /> Profil</div>

        {token ? (
          <div className="profile-card">
            {/* Avatar: nur Bild sichtbar, kleines Upload-Icon behalten */}
            <button
              className="avatar-wrap"
              onClick={onPickAvatar}
              title="Profilbild �ndern"
              type="button"
            >
              {avatarUrl ? (
                <img className="avatar-img" src={avatarUrl} alt="Avatar" loading="lazy" />
              ) : (
                <div className="avatar-fallback">{avatarInitial}</div>
              )}

              {/* kleines Upload-Icon unten rechts */}
              <span className="avatar-upload" aria-hidden="true">
                <UploadCloud size={16} />
              </span>

              {/* File-Input komplett unsichtbar/offscreen */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only-file"
                onChange={onChangeAvatar}
              />
            </button>

            <div className="user-lines">
              <div className="user-primary" title={primaryLabel}>{primaryLabel}</div>
              {secondaryLabel && (
                <div className="user-secondary" title={secondaryLabel}>{secondaryLabel}</div>
              )}
              {isPro ? (
                <div className="pro-badge-inline" title="PRO aktiv">
                  <ShieldCheck size={14} /> PRO
                </div>
              ) : (
                <div className="pro-badge-inline muted">Free</div>
              )}
            </div>
          </div>
        ) : (
          <div className="profile-guest">Nicht angemeldet</div>
        )}
      </section>

      {/* Verbindungen */}
      <section className="sb-panel connect-panel">
        <div className="panel-title">Verbindungen</div>
        <div className="connect-grid">
          <a href={TIKTOK_LOGIN_URL} className="connect-btn tiktok" rel="noopener">
            <TikTokIcon size={18} />
            <span>Verbinden mit TikTok</span>
          </a>
          <a href={SPOTIFY_LOGIN_URL} className="connect-btn spotify" rel="noopener">
            <SpotifyIcon size={18} />
            <span>Verbinden mit Spotify</span>
          </a>
        </div>
      </section>

      {/* Funktionen */}
      <section className="sb-panel functions-panel">
        <div className="panel-title">Funktionen</div>
        <button
          className={`func-btn ${isLivestreamActive ? "active" : ""}`}
          onClick={goToLivestream}
          title="Gehe zu Epic Livestream"
        >
          <StreamIcon size={18} />
          <span>Livestream</span>
          <small className="mode-tag">EPIC</small>
        </button>
        {FUNCTION_PAGES.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `func-btn ${isActive ? "active" : ""}`}
            end={item.to === "/"}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </section>

      {/* EINZIGER Day-Pass Bereich */}
      {!isPro && (
        <section className="sb-panel daypass-panel">
          {!isDayPass ? (
            <NavLink className="btn-daypass" to="/daypass">
              <Clock size={18} />
              <span>Day-Pass (24h)</span>
            </NavLink>
          ) : (
            <div className="daypass-info">
              <Clock size={14} />
              <span>
                Day-Pass aktiv
                {typeof msRemaining === "number" ? `  ${formatHMS(msRemaining)} �brig` : ""}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Upgrade */}
      {!isPro && (
        <section className="sb-panel pro-panel">
          <div className="panel-title"><ProIcon size={16} /> Upgrade</div>
          <div className="pro-copy">
            Schalte alle Features frei und hol dir maximale Performance &amp; Tools.
          </div>
          <NavLink className="btn-upgrade" to={UPGRADE_ROUTE}>
            <ProIcon size={18} />
            <span>Jetzt Pro abonnieren</span>
          </NavLink>
        </section>
      )}
    </aside>
  );
}

