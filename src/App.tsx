import { logger } from '@/lib/logger';
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Sidebar from './components/shared/Sidebar';

// Pages (PUBLIC / PROTECTED)
import Homepage from './pages/Homepage';
import DashboardPage from './pages/DashboardPage';
import EpicLivestream from './pages/EpicLivestream';
import MediaPage from './pages/MediaPage';

// Overlay-Hub
import OverlayEditorPage from './pages/OverlayEditorPage';
import OverlayPage from './pages/OverlayPage';
import OverlayUploadPage from './pages/OverlayUploadPage';
import OverlayGalleryPage from './pages/OverlayGalleryPage';
import DreamMode from './pages/DreamMode';

// Hooks / Routes
import { useTheme } from './hooks/useTheme';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Auth / Billing
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscribePage from './pages/SubscribePage';
import BillingSuccess from './pages/BillingSuccess';
import BillingPage from './pages/Billing';

// Bots / Games / Stats
import BotManagerPage from './components/bot/BotManagerPage';
import MiniGamesPage from './components/games/MiniGamesPage';
import StatsDashboard from './components/stats/StatsDashboard';
import QuantumCommandBuilder from './components/bot/QuantumCommandBuilder';

// Analytics & Integrationen
import AnalyticsPage from './pages/AnalyticsPage';
import SpotifyCallback from './pages/SpotifyCallback';
import TikTokCallback from './pages/TikTokCallback';

// Portal, Day-Pass, Webhook, Admin
import PortalPage from './pages/PortalPage';
import DayPassPage from './pages/DayPassPage';
import WebhookHandshake from './pages/WebhookHandshake';
import AdminOpsPage from './pages/AdminOpsPage';

// Footer + Rechtstexte
import Footer from './components/shared/Footer';
import Imprint from './pages/legal/Imprint';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Withdrawal from './pages/legal/Withdrawal';
import CommunityGuidelines from './pages/legal/CommunityGuidelines';
import Licenses from './pages/legal/Licenses';

import './styles/global/global.css';

/* ---------------- Dev-Probe: pingt Backend nur in development --------------- */
function DevProbe() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      fetch(`/api/session`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => logger.debug('[DevProbe] /session ?', d))
        .catch((e) => console.error('[DevProbe] /session error:', e));
    }
  }, []);
  return null;
}

/* =========================
   LAYOUTS
   ========================= */

const MainLayout: React.FC = () => {
  const { themeClass } = useTheme();
  return (
    <div className={`app-layout ${themeClass}`}>
      <aside className="sidebar-container">
        <Sidebar />
      </aside>
      <main className="main-view">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const AuthLayout: React.FC = () => (
  <div
    className="app-layout"
    style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
  >
    <div style={{ flex: 1 }}>
      <Outlet />
    </div>
    <Footer />
  </div>
);

/* =========================
   APP SHELL (ROUTING)
   ========================= */

const AppShell: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <DevProbe />
      <Routes>
        {/* ï¿½ffentliche Seiten (ohne Sidebar) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
        </Route>

        {/* ï¿½ffentlich (bzw. gemischt) & mit Sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Homepage />} />

          {/* Rechtliches - EN */}
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/withdrawal" element={<Withdrawal />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />
          <Route path="/licenses" element={<Licenses />} />

          {/* Rechtliches - DE Aliasse */}
          <Route path="/impressum" element={<Imprint />} />
          <Route path="/agb" element={<Terms />} />
          <Route path="/datenschutz" element={<Privacy />} />
          <Route path="/widerruf" element={<Withdrawal />} />
          <Route path="/richtlinien" element={<CommunityGuidelines />} />
          <Route path="/lizenzen" element={<Licenses />} />

          {/* OAuth / Callbacks / Sonstiges */}
          <Route path="/auth/tiktok" element={<TikTokCallback />} />
          <Route path="/auth/spotify" element={<SpotifyCallback />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/daypass" element={<DayPassPage />} />
          <Route path="/webhook-handshake" element={<WebhookHandshake />} />

          {/* Billing */}
          <Route path="/billing" element={<BillingPage />} />

          {/* Geschï¿½tzt */}
          <Route
            path="/subscribe"
            element={
              <ProtectedRoute>
                <SubscribePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/epiclivestream"
            element={
              <ProtectedRoute>
                <EpicLivestream />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <EpicLivestream />
              </ProtectedRoute>
            }
          />
          <Route path="/livestream" element={<Navigate to="/epiclivestream" replace />} />
          <Route path="/stream" element={<Navigate to="/epiclivestream" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Overlay-Hub */}
          <Route
            path="/overlay"
            element={
              <ProtectedRoute>
                <OverlayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overlay/editor"
            element={
              <ProtectedRoute>
                <OverlayEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overlay/upload"
            element={
              <ProtectedRoute>
                <OverlayUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overlay/gallery"
            element={
              <ProtectedRoute>
                <OverlayGalleryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dreammode"
            element={
              <ProtectedRoute>
                <DreamMode />
              </ProtectedRoute>
            }
          />

          {/* Media Center */}
          <Route
            path="/media"
            element={
              <ProtectedRoute>
                <MediaPage />
              </ProtectedRoute>
            }
          />

          {/* Bots, Games, Analytics, Stats */}
          <Route
            path="/bot-games"
            element={
              <ProtectedRoute>
                <MiniGamesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bot-manager"
            element={
              <ProtectedRoute>
                <BotManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bot/quantum-builder"
            element={
              <ProtectedRoute>
                <QuantumCommandBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <StatsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminOpsPage />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppShell;
