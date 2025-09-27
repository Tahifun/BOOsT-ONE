import React, { useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { Background } from './Background';
import { ParticleSystem } from './ParticleSystem';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  showBackground?: boolean;
  showParticles?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showHeader = true,
  showNavigation = true,
  showBackground = true,
  showParticles = true,
  className = '',
  onSearch
}) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { tier } = useSubscription();
  const skipLinkTargetRef = useRef<HTMLDivElement>(null);

  // Focus management on route change
  useEffect(() => {
    const pageTitle = document.title || 'Seite';
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = `Navigiert zu ${pageTitle}`;
    document.body.appendChild(announcer);

    // Reset focus to main content
    skipLinkTargetRef.current?.focus();

    // Cleanup announcement
    const t = setTimeout(() => {
      if (announcer.parentElement) announcer.parentElement.removeChild(announcer);
    }, 1000);

    // Scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    return () => clearTimeout(t);
  }, [location]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input') as HTMLInputElement | null;
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('layout:escape'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic theme based on subscription
  const theme = tier === 'PRO' ? 'pro' : 'dark';

  // Performance optimization - reduce particles on low-end devices
  const particleCount = (() => {
    const navAny = navigator as any;
    const mem = navAny && typeof navAny.deviceMemory === 'number' ? navAny.deviceMemory : 8;
    if (mem <= 4) return 20;
    if (mem <= 8) return 35;
    return 50;
  })();

  return (
    <div className={`media-layout ${className}`} data-theme={theme}>
      {/* Background Layers */}
      {showBackground && (
        <>
          <Background theme={theme as any} intensity={1} />
          {showParticles && (
            <ParticleSystem
              config={{ count: particleCount, speed: 1, interactive: true, glow: true }}
            />
          )}
        </>
      )}

      {/* Layout Container */}
      <div className="layout-container">
        {/* Header */}
        {showHeader && <Header onSearch={onSearch} />}

        {/* Navigation */}
        {showNavigation && <Navigation />}

        {/* Main Content Area */}
        <main
          ref={mainRef}
          className="layout-main"
          id="main-content"
          role="main"
          aria-label="Hauptinhalt"
        >
          {/* Skip Link Target (focusable, not aria-hidden) */}
          <div
            ref={skipLinkTargetRef}
            tabIndex={-1}
            className="skip-link-target"
          />

          {/* Content Container */}
          <div className="content-container">
            {/* Loading State */}
            <div className="content-loading" aria-hidden="true">
              <div className="loading-spinner" />
            </div>

            {/* Main Content */}
            <div className="content-wrapper">
              {children}
            </div>
          </div>
        </main>

        {/* Footer (optional) */}
        <footer className="layout-footer">
          <div className="footer-content">
            <div className="footer-info">
              <span className="footer-version">Media Center v2.0</span>
              <span className="footer-separator"></span>
              <span className="footer-status">
                Status: <span className="status-indicator">Online</span>
              </span>
            </div>
            <div className="footer-actions">
              <button className="footer-link" aria-label="Hilfe"><span> Hilfe</span></button>
              <button className="footer-link" aria-label="Feedback"><span> Feedback</span></button>
              <button className="footer-link" aria-label="Einstellungen"><span>? Einstellungen</span></button>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Action Button Container */}
      <div className="fab-container" id="fab-container" />

      {/* Notification Container */}
      <div className="notification-container" id="notification-container" />

      {/* Modal Container */}
      <div className="modal-container" id="modal-container" />
    </div>
  );
};
