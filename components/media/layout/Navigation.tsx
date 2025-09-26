import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import '../../styles/layout/Navigation.css';

interface NavigationTab {
  id: string;
  title: string;
  icon: string;
  path: string;
  requiresPro?: boolean;
  badge?: string;
  description?: string;
}

interface NavigationProps {
  onTabSelect?: (tabId: string) => void;
  className?: string;
}

const navigationTabs: NavigationTab[] = [
  { id: 'dashboard',  title: 'Dashboard',     icon: '', path: '/media/dashboard',   description: 'bersicht und Statistiken' },
  { id: 'upload',     title: 'Upload',        icon: '️', path: '/media/upload',      description: 'Dateien hochladen' },
  { id: 'gallery',    title: 'Galerie',       icon: '', path: '/media/gallery',     description: 'Alle Medien durchsuchen' },
  { id: 'clips',      title: 'Clips',         icon: '️', path: '/media/clips',       description: 'Videos schneiden', requiresPro: true },
  { id: 'screenshots',title: 'Screenshots',   icon: '', path: '/media/screenshots', description: 'Frames extrahieren' },
  { id: 'soundboard', title: 'Soundboard',    icon: '', path: '/media/soundboard',  description: 'Audio-Bibliothek', requiresPro: true },
  { id: 'overlays',   title: 'Overlays',      icon: '', path: '/media/overlays',    description: 'Templates verwalten', requiresPro: true },
  { id: 'export',     title: 'Export',        icon: '', path: '/media/export',      description: 'Medien exportieren' },
  { id: 'stats',      title: 'Impact Stats',  icon: '', path: '/media/stats',       description: 'Performance analysieren', requiresPro: true },
  { id: 'ai',         title: 'AI Assistant',  icon: '', path: '/media/ai',          description: 'KI-gestützte Features', requiresPro: true, badge: 'NEU' },
];

export const Navigation: React.FC<NavigationProps> = ({ onTabSelect, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tier } = useSubscription();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Aus URL den aktiven Tab bestimmen: zuerst ?tab=..., sonst Pfad-Match
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromQuery = params.get('tab');
    if (tabFromQuery && navigationTabs.some(t => t.id === tabFromQuery)) {
      setActiveTab(tabFromQuery);
      return;
    }
    const byPath = navigationTabs.find(tab => location.pathname.startsWith(tab.path));
    if (byPath) setActiveTab(byPath.id);
  }, [location]);

  const handleTabClick = (tab: NavigationTab) => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (tab.requiresPro && tier !== 'PRO') {
      // Nur Hinweis  tatsächlicher Upgrade-Dialog wird auerhalb gehandhabt
      logger.debug('PRO feature - showing upgrade prompt');
    }

    setActiveTab(tab.id);
    onTabSelect?.(tab.id);
    // Fallback-kompatibel: solange Unterrouten evtl. fehlen, über Query navigieren
    navigate(`/media?tab=${encodeURIComponent(tab.id)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tab: NavigationTab) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(tab);
    }
  };

  // Globale Tastenkürzel: Alt+1..9 springt zu den ersten Tabs
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (index < navigationTabs.length) handleTabClick(navigationTabs[index]);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <nav
      className={`media-navigation ${className} ${isAnimating ? 'animating' : ''}`}
      role="navigation"
      aria-label="Media Center Navigation"
      id="navigation"
    >
      <div className="nav-tabs-container" role="tablist" aria-orientation="horizontal">
        {navigationTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isLocked = tab.requiresPro && tier !== 'PRO';
          const isHovered = hoveredTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isHovered ? 'hovered' : ''}`}
              onClick={() => handleTabClick(tab)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              onKeyDown={(e) => handleKeyDown(e, tab)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              aria-describedby={isLocked ? `lock-${tab.id}` : undefined}
              tabIndex={0}
              style={{ animationDelay: `${index * 0.05}s` }}
              type="button"
            >
              {/* Hintergrund-Effekte */}
              <div className="tab-background">
                <div className="tab-glow" />
                <div className="tab-hover-effect" />
              </div>

              {/* Inhalt */}
              <div className="tab-content">
                <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                <span className="tab-title">{tab.title}</span>

                {tab.badge && <span className="tab-badge">{tab.badge}</span>}

                {isLocked && (
                  <span className="tab-lock" id={`lock-${tab.id}`}>
                    <span className="lock-icon"></span>
                    <span className="sr-only">PRO Feature</span>
                  </span>
                )}
              </div>

              {/* Tooltip */}
              {isHovered && (
                <div className="tab-tooltip" role="tooltip">
                  <div className="tooltip-content">
                    <strong>{tab.title}</strong>
                    <p>{tab.description}</p>
                    {isLocked && <p className="tooltip-pro">⭐ PRO Feature</p>}
                    <span className="tooltip-shortcut">Alt + {index + 1}</span>
                  </div>
                  <div className="tooltip-arrow" />
                </div>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div className="tab-active-indicator" aria-hidden="true">
                  <div className="indicator-line" />
                  <div className="indicator-glow" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Hinweis */}
      <div className="nav-scroll-indicator" aria-hidden="true">
        <span className="scroll-hint"> Wischen </span>
      </div>
    </nav>
  );
};

