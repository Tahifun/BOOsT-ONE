// src/pages/Homepage.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import "./Homepage.css";
import logoImage from "../assets/images/logo.png";

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  return (
    <div className="homepage">
      {/* Cosmic Background */}
      <div className="cosmic-bg" />

      {/* Particles */}
      <div className="particles">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">CLiP BOOsT</div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><Link to="/subscribe">Pricing</Link></li>
            <li><a href="#about">About</a></li>
            <li>
              {token ? (
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="nav-logout"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="nav-login">
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">?? Die Zukunft des Streamings ist hier</div>

            <h1 className="hero-title">
              Stream wie ein
              <span className="gradient-text"> PRO </span>
              auf TikTok
            </h1>

            <p className="hero-description">
              Revolutioniere deine TikTok-Livestreams mit professionellen Tools,
              atemberaubenden Overlays und intelligenten Bot-Features. Alles in einer App.
            </p>

            <div className="cta-group">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/register")}
              >
                Jetzt starten - Kostenlos
              </button>

              <a href="#features" className="btn btn-secondary">
                Mehr erfahren
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="stream-preview">
              <div className="stream-header">
                <div className="live-badge">? LIVE</div>
                <div className="viewer-count">
                  <span>??</span>
                  <span>12,847 Zuschauer</span>
                </div>
              </div>

              <div className="stream-content">
                <div className="stream-animation">
                  <div className="orbit orbit-1"></div>
                  <div className="orbit orbit-2"></div>
                  <div className="orbit orbit-3"></div>
                  <div className="center-logo">
                    <img src={logoImage} alt="CLiP BOOsT" className="logo-image" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features" style={{ scrollMarginTop: "96px" }}>
        <div className="section-header">
          <h2 className="section-title">Alles was du brauchst</h2>
          <p className="section-subtitle">Professionelle Tools f�r deinen Erfolg</p>
        </div>

        <div className="features-grid">
          {[
            { icon: "??", title: "Custom Overlays", description: "Editor & Templates - in Minuten live." },
            { icon: "??", title: "Smart Bot", description: "Auto-Moderation, Commands, kleine Games." },
            { icon: "??", title: "Live Analytics", description: "Echtzeit-Zahlen: Viewer, Chat, Revenue." },
            { icon: "??", title: "Mini-Games", description: "Wheel, Quiz & Giveaways - mehr Interaktion." },
            { icon: "??", title: "Spotify", description: "Now Playing & Song-Requests im Stream." },
            { icon: "??", title: "Epic / PRO", description: "Alle Pro-Features. Volle Power." },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title" style={{ marginTop: 8 }}>{f.title}</h3>
              <p className="feature-description" style={{ marginTop: 6, opacity: 0.95, display: "block" }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about" style={{ scrollMarginTop: "96px" }}>
        <div className="section-header">
          <h2 className="section-title">�ber CLiP BOOsT</h2>
          <p className="section-subtitle">Warum noch mit Standard-Tools streamen?</p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <h3>Fokus: TikTok</h3>
            <p>
              Wir bauen speziell f�r TikTok-Livestreams: stabil, performant, mit Features,
              die wirklich tragen.
            </p>
          </div>
          <div className="about-card">
            <h3>Pro-Workflow</h3>
            <p>
              Overlays, Bot, Analytics - alles aus einem Guss. Weniger Reibung, mehr Output.
            </p>
          </div>
          <div className="about-card">
            <h3>Fair & flexibel</h3>
            <p>
              Free f�r Basics. PRO monatlich - oder Day-Pass f�r 24h volle Power.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Aktive Streamer</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">2M+</div>
            <div className="stat-label">Streams gestartet</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100M+</div>
            <div className="stat-label">Zuschauer erreicht</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4.9?</div>
            <div className="stat-label">App Bewertung</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-glow" />
          <h2 className="cta-title">Bereit durchzustarten?</h2>
          <p className="cta-text">
            Werde Teil der CLiP BOOsT Community und bringe deine Streams auf das n�chste Level.
          </p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate("/register")}
          >
            Kostenlos registrieren
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-column">
              <h4>Produkt</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><Link to="/subscribe">Pricing</Link></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Hilfe Center</a></li>
                <li><a href="#">Discord</a></li>
                <li><a href="#">Kontakt</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Rechtliches</h4>
              <ul>
                <li><a href="#">Datenschutz</a></li>
                <li><a href="#">AGB</a></li>
                <li><a href="#">Impressum</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Social</h4>
              <div className="social-links">
                <a href="#" className="social-link">??</a>
                <a href="#" className="social-link">??</a>
                <a href="#" className="social-link">??</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">
              � {new Date().getFullYear()} CLiP BOOsT. Alle Rechte vorbehalten. Made with ?? for Streamers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;