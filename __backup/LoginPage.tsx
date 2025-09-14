import React, { FormEvent, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginExperience from '../components/LoginExperience';
import './LoginPage.css';

// 👉 neu: zentraler API-Client (sendet Cookies immer mit)
import { postLogin, getSession } from '@/services/api';

// (Optional) Wenn dein globaler Auth-Context noch ein Token erwartet,
// kannst du ihn weiter nutzen – wir setzen hier ein Dummy-Token nach erfolgreichem Session-Check.
// Wenn es keinen Context gibt, kannst du die nächste Zeile löschen.
import { useAuth } from '../contexts/AuthContext';

// Icons als SVG Components
const LiveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <path d="M12 2v6m0 12v-6m10-2h-6m-12 0h6"/>
  </svg>
);
const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.663 17l-4.673 4.25c-.391.355-1.002.114-1.076-.426l-.416-3.042-2.998-.416c-.54-.074-.781-.685-.426-1.076L4.324 11.617M9.663 17l5.378-5.378M9.663 17l-2.315-2.315M21 7.5c0 2.485-4.448 8.017-6 9.5l-2.5-2.5c1.483-1.552 7.015-6 9.5-6zm-3.5 3.5l-2-2"/>
  </svg>
);
const StreamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Optionaler Auth-Context (s. Kommentar oben)
  const auth = (() => {
    try { return useAuth(); } catch { return null as any; }
  })();

  const navigate = useNavigate();
  const location = useLocation();

  // Ziel ermitteln
  const params = new URLSearchParams(location.search);
  const redirectParam = params.get('redirect');
  const fromState = (location.state as any)?.from;
  const from = redirectParam || fromState?.pathname || '/dashboard';

  // Wenn bereits eingeloggt und wir von einer geschützten Seite kamen → weiter
  useEffect(() => {
    // Kein automatischer Redirect ohne echten Session-Check
    // (Viele Setups hatten hier nur einen Token im LocalStorage – das reicht nicht.)
  }, []);

  // Hinweis nach E-Mail-Verifizierung
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('verified') === 'true') {
      setSuccess('🎉 E-Mail bestätigt! Du kannst dich jetzt einloggen!');
      setError(null);
    }
  }, [location.search]);

  // Sidebar auf Login verstecken
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar-container') as HTMLElement | null;
    const mainView = document.querySelector('.main-view') as HTMLElement | null;
    const appLayout = document.querySelector('.app-layout') as HTMLElement | null;

    if (sidebar) sidebar.style.display = 'none';
    if (mainView) {
      mainView.style.padding = '0';
      mainView.style.width = '100vw';
    }
    if (appLayout) appLayout.style.display = 'block';

    return () => {
      if (sidebar) sidebar.style.display = '';
      if (mainView) {
        mainView.style.padding = '';
        mainView.style.width = '';
      }
      if (appLayout) appLayout.style.display = '';
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // 1) Login beim Backend (setzt httpOnly-Cookie)
      await postLogin({ email, password: pwd });

      // 2) Session sofort prüfen (geht mit Cookie)
      const s = await getSession();

      if (s?.authenticated) {
        setSuccess('🚀 Willkommen zurück! Einen Moment...');
        // (Optional) alten LocalStorage-Token „füllen“, falls andere Teile der App ihn erwarten
        try { localStorage.setItem('token', 'session'); } catch {}

        // (Optional) globalen Auth-Context informieren
        if (auth?.login) {
          try { auth.login('session'); } catch {}
        }

        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } else {
        setError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.');
        const form = document.querySelector('.login-form');
        form?.classList.add('shake');
        setTimeout(() => form?.classList.remove('shake'), 600);
      }
    } catch (err: unknown) {
      setError(err?.message || 'Anmeldung fehlgeschlagen');
      const form = document.querySelector('.login-form');
      form?.classList.add('shake');
      setTimeout(() => form?.classList.remove('shake'), 600);
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setError(null);
    setSuccess(null);
    try {
      // Wenn du den Endpoint noch nicht hast, kann dieser Button erstmal versteckt werden.
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess('📧 Bestätigungs-E-Mail wurde erneut gesendet!');
    } catch (err: unknown) {
      setError(err?.message || 'Fehler beim erneuten Senden');
    }
  }

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const }
    }
  };

  return (
    <>
      <LoginExperience />

      {/* Background Gradient Orbs */}
      <div className="login-bg-gradient">
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        <div className="gradient-orb gradient-orb-3" />
      </div>

      {/* Main Login Container */}
      <div className="login-container">
        <motion.div
          className="login-panel"
          initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: [0.6, -0.05, 0.01, 0.99], delay: 0.5 }}
        >
          {/* Logo Section */}
          <motion.div
            className="login-logo-section"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="logo-wrapper">
              <motion.div
                className="logo-icon"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <LiveIcon />
              </motion.div>
              <h1 className="logo-text">
                CLiP <span className="gradient-text">BOOsT</span>
              </h1>
            </div>

            {/* Animated Tagline */}
            <motion.div
              className="tagline-container"
              variants={floatingVariants}
              initial="initial"
              animate="animate"
            >
              <p className="tagline">
                <span className="tag-icon"><StreamIcon /></span>
                Your Next Level Streaming Experience
                <span className="tag-icon"><RocketIcon /></span>
              </p>
            </motion.div>
          </motion.div>

          {/* Form Section */}
          <form onSubmit={onSubmit} className="login-form">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  className="loading-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="loading-spinner" />
                  <p>Bereite deinen Stream vor...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="message error-message"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <span className="message-icon">⚠️</span>
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  className="message success-message"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div
              className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <label htmlFor="email" className="input-label">
                <span className="label-icon">📧</span>
                E-Mail Adresse
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="streamer@clipboost.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                />
                <div className="input-glow" />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <label htmlFor="password" className="input-label">
                <span className="label-icon">🔐</span>
                Passwort
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '🫥‍🛡️'}
                </button>
                <div className="input-glow" />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              className={`submit-button ${isHovering ? 'hovering' : ''}`}
              type="submit"
              disabled={loading}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="button-content">
                {loading ? (
                  <>
                    <div className="mini-spinner" />
                    Verbinde...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    Go Live!
                    <span className="button-arrow">→</span>
                  </>
                )}
              </span>
              <div className="button-glow" />
            </motion.button>

            {/* Resend Verification */}
            {error?.toLowerCase().includes('bestätige') && (
              <motion.div
                className="resend-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  type="button"
                  className="resend-button"
                  onClick={resendVerification}
                >
                  📮 Bestätigungs-E-Mail erneut senden
                </button>
              </motion.div>
            )}
          </form>

          {/* Footer Links */}
          <motion.div
            className="login-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <div className="footer-divider">
              <span>Neu bei CLiP BOOsT?</span>
            </div>

            <Link to="/register" className="register-link">
              <span>Jetzt Account erstellen</span>
              <span className="link-arrow">→</span>
            </Link>

            <div className="social-login-hint">
              <p>Bald verfügbar:</p>
              <div className="social-icons">
                <span className="social-icon tiktok">TikTok</span>
                <span className="social-icon spotify">Spotify</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <motion.div
            className="float-element float-1"
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            LIVE
          </motion.div>
          <motion.div
            className="float-element float-2"
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            PRO
          </motion.div>
          <motion.div
            className="float-element float-3"
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            🎬
          </motion.div>
        </div>
      </div>
    </>
  );
}
