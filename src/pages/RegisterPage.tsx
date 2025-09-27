import React, { FormEvent, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginExperience from '../components/LoginExperience';
import './RegisterPage.css';

// ?? neu: zentraler API-Client (sendet Cookies immer mit)
import { postRegister, getSession } from '@/services/api';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: '', color: '#666' });
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

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

  // Password strength checker
  useEffect(() => {
    if (!pwd) {
      setPasswordStrength({ score: 0, label: '', color: '#666' });
      return;
    }
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    const strengthLevels = [
      { score: 0, label: 'Sehr schwach', color: '#ef4444' },
      { score: 1, label: 'Schwach', color: '#f97316' },
      { score: 2, label: 'Mittel', color: '#eab308' },
      { score: 3, label: 'Gut', color: '#84cc16' },
      { score: 4, label: 'Stark', color: '#22c55e' },
      { score: 5, label: 'Sehr stark', color: '#10b981' },
    ];
    setPasswordStrength(strengthLevels[score]);
  }, [pwd]);

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(() => {
      setUsernameAvailable(!['admin', 'test', 'user'].includes(username.toLowerCase()));
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (pwd !== pwdConfirm) {
      setError('Passw�rter stimmen nicht �berein!');
      return;
    }
    if (passwordStrength.score < 2) {
      setError('Bitte w�hle ein st�rkeres Passwort!');
      return;
    }
    if (!agreedToTerms) {
      setError('Bitte akzeptiere die Nutzungsbedingungen!');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // 1) Registrieren (setzt i. d. R. direkt eine Session - in unserem Mock auf jeden Fall)
      await postRegister({ email, password: pwd, name: username });

      // 2) Session pr�fen
      const s = await getSession();

      setSuccess('?? Willkommen bei CLiP BOOsT!');
      setStep(3);

      setTimeout(() => {
        // Dein fr�herer Flow leitete zur Login-Seite; du kannst auch direkt ins Dashboard.
        if (s?.authenticated) {
          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true, state: { fromRegister: true, email } });
        }
      }, 1500);
    } catch (err: unknown) {
      // Wenn dein Backend 409 f�r "E-Mail existiert" zur�ckgibt, kannst du das hier matchen:
      if (String(err?.message || '').includes('409')) {
        setError('E-Mail bereits registriert.');
      } else {
        setError(err?.message || 'Registrierung fehlgeschlagen');
      }
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: '??', text: 'Professionelle Overlays' },
    { icon: '??', text: 'Live Analytics' },
    { icon: '??', text: 'Smart Bot Integration' },
    { icon: '??', text: 'Spotify Connection' },
    { icon: '??', text: 'PRO Features' },
    { icon: '??', text: 'TikTok Optimiert' }
  ];

  return (
    <>
      <LoginExperience />

      {/* Background Effects */}
      <div className="register-bg">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
      </div>

      {/* Main Container */}
      <div className="register-container">
        <motion.div
          className="register-panel"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        >
          {/* Header */}
          <motion.div
            className="register-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="logo-section">
              <h1 className="logo">
                CLiP <span className="gradient-text">BOOsT</span>
              </h1>
              <p className="subtitle">Join the Next Generation of Streamers</p>
            </div>

            {/* Progress Indicator */}
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${step * 33.33}%` }} />
              <div className="progress-steps">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
                  >
                    {step > s ? <CheckIcon /> : s}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Form Steps */}
          <form onSubmit={onSubmit} className="register-form">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  className="form-step"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="step-title">
                    <span className="step-icon">??</span>
                    Erstelle deinen Account
                  </h2>

                  <div className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}>
                    <label htmlFor="email">E-Mail Adresse</label>
                    <div className="input-wrapper">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="deine@email.com"
                        required
                      />
                      <span className="input-icon">??</span>
                    </div>
                  </div>

                  <div className={`input-group ${focusedField === 'username' ? 'focused' : ''}`}>
                    <label htmlFor="username">
                      Username{' '}
                      {usernameAvailable !== null && (
                        <span className={`availability ${usernameAvailable ? 'available' : 'taken'}`}>
                          {usernameAvailable ? '? Verf�gbar' : '? Bereits vergeben'}
                        </span>
                      )}
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="StreamerName123"
                        required
                        minLength={3}
                      />
                      <span className="input-icon">@</span>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    className="next-button"
                    onClick={() => {
                      if (email && username && usernameAvailable !== false) {
                        setStep(2);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Weiter <span className="button-arrow">?</span>
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  className="form-step"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="step-title">
                    <span className="step-icon">??</span>
                    Sicherheit & Bedingungen
                  </h2>

                  <div className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}>
                    <label htmlFor="password">Passwort</label>
                    <div className="input-wrapper">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="........"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '??' : '??????'}
                      </button>
                    </div>

                    {pwd && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div
                            className="strength-fill"
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                              backgroundColor: passwordStrength.color
                            }}
                          />
                        </div>
                        <span className="strength-label" style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`input-group ${focusedField === 'confirm' ? 'focused' : ''}`}>
                    <label htmlFor="confirm">Passwort best�tigen</label>
                    <div className="input-wrapper">
                      <input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        value={pwdConfirm}
                        onChange={(e) => setPwdConfirm(e.target.value)}
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="........"
                        required
                      />
                      {pwdConfirm && (
                        <span className={`match-icon ${pwd === pwdConfirm ? 'match' : 'no-match'}`}>
                          {pwd === pwdConfirm ? '?' : '?'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="terms-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="terms-checkbox"
                      />
                      <span className="checkbox-custom">
                        {agreedToTerms && <CheckIcon />}
                      </span>
                      <span className="terms-text">
                        Ich akzeptiere die{' '}
                        <a href="#" onClick={(e) => e.preventDefault()}>Nutzungsbedingungen</a>{' '}
                        und{' '}
                        <a href="#" onClick={(e) => e.preventDefault()}>Datenschutzbestimmungen</a>
                      </span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className="message error-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="button-group">
                    <button type="button" className="back-button" onClick={() => setStep(1)}>
                      ? Zur�ck
                    </button>
                    <motion.button
                      type="submit"
                      className="submit-button"
                      disabled={loading || !agreedToTerms}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <>
                          <div className="spinner" />
                          Erstelle Account...
                        </>
                      ) : (
                        <>
                          Account erstellen <span className="button-icon">??</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  className="form-step success-step"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
                >
                  <motion.div
                    className="success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    ??
                  </motion.div>

                  <h2 className="success-title">Willkommen bei CLiP BOOsT!</h2>
                  <p className="success-message">{success}</p>

                  <motion.div
                    className="redirect-info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="redirect-spinner" />
                    <p>Weiterleitung...</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {step === 1 && (
            <motion.div
              className="features-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <h3 className="features-title">Was dich erwartet:</h3>
              <div className="features-grid">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="feature-item"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <span className="feature-icon">{feature.icon}</span>
                    <span className="feature-text">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step !== 3 && (
            <motion.div
              className="register-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p>
                Bereits ein Streamer?{' '}
                <Link to="/login" className="login-link">
                  Zum Login <span className="link-arrow">?</span>
                </Link>
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Animated Background Elements */}
        <div className="animated-elements">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`floating-badge badge-${i + 1}`}
              animate={{ y: [0, -30, 0], rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5
              }}
            >
              {i === 0 && '??'}
              {i === 1 && 'LIVE'}
              {i === 2 && '??'}
              {i === 3 && 'PRO'}
              {i === 4 && '??'}
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
