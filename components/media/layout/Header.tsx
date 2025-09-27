import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import './Header.css';

interface HeaderProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useSubscription();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dynamische Glow-Animation basierend auf Tageszeit
  const [glowIntensity, setGlowIntensity] = useState(1);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setGlowIntensity(1.2);
    else if (hour >= 18 || hour < 6) setGlowIntensity(0.8);
    else setGlowIntensity(1);
  }, []);

  // Debounced Search + Demo-Vorschl�ge
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        setSearchSuggestions([
          `${searchQuery}  Videos`,
          `${searchQuery}  Clips`,
          `${searchQuery}  Screenshots`,
          `${searchQuery}  Sounds`,
        ]);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    const q = query.trim();
    setSearchQuery(q);
    setShowSuggestions(false);

    if (onSearch) {
      onSearch(q);
    } else {
      // Fallback: navigiert zur Media-Seite und �bergibt die Suche als Query
      const url = q ? `/media?query=${encodeURIComponent(q)}&tab=gallery` : '/media';
      navigate(url);
    }
  };

  const handleQuickAction = (action: 'upload' | 'gallery' | 'stats') => {
    // Fallback: solange Unterrouten noch nicht existieren, auf /media mit Tab-Param
    const target =
      action === 'upload'
        ? '/media?tab=upload'
        : action === 'gallery'
        ? '/media?tab=gallery'
        : '/media?tab=stats';
    navigate(target);
  };

  // Tastatur-Shortcuts (Ctrl+U, Ctrl+G)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const key = e.key.toLowerCase();
      if (key === 'u') {
        e.preventDefault();
        handleQuickAction('upload');
      } else if (key === 'g') {
        e.preventDefault();
        handleQuickAction('gallery');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // CSS Custom Property typsicher setzen
  const glowStyle = { ['--glow-intensity' as any]: String(glowIntensity) } as React.CSSProperties;

  return (
    <header className={`media-header ${className}`} role="banner">
      {/* Animated Background Layer */}
      <div className="header-background">
        <div className="header-glow" style={glowStyle} />
        <div className="header-particles" />
      </div>

      <div className="header-content">
        {/* Logo & Title Section */}
        <div className="header-brand">
          <h1 className="header-title">
            <span className="title-text">MEDIA CENTER</span>
            <span className="title-glow" aria-hidden="true">MEDIA CENTER</span>
          </h1>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <span>Home</span>
            <span className="breadcrumb-separator"></span>
            <span>Media</span>
          </nav>
        </div>

        {/* Global Search */}
        <div className={`header-search ${isSearchFocused ? 'focused' : ''}`}>
          <div className="search-container">
            <span className="search-icon" aria-hidden="true"></span>
            <input
              type="search"
              className="search-input"
              placeholder="Suche nach Videos, Clips, Screenshots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(searchQuery);
              }}
              aria-label="Globale Suche"
              aria-describedby="search-hint"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
            />
            <span id="search-hint" className="sr-only">
              Dr�cke Enter zum Suchen oder nutze die Vorschl�ge.
            </span>

            {showSuggestions && (
              <div className="search-suggestions" role="listbox" aria-live="polite">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSearch(suggestion)}
                    role="option"
                    aria-selected={false}
                    type="button"
                  >
                    <span className="suggestion-icon"></span>
                    <span className="suggestion-text">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User & Actions Section */}
        <div className="header-actions">
          {/* Quick Actions */}
          <div className="quick-actions" aria-label="Schnellaktionen">
            <button
              className="quick-action-btn"
              onClick={() => handleQuickAction('upload')}
              aria-label="Upload starten"
              title="Upload starten (Ctrl+U)"
              type="button"
            >
              <span className="action-icon">?</span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => handleQuickAction('gallery')}
              aria-label="Zur Galerie"
              title="Zur Galerie (Ctrl+G)"
              type="button"
            >
              <span className="action-icon"></span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => handleQuickAction('stats')}
              aria-label="Statistiken"
              title="Statistiken anzeigen"
              type="button"
            >
              <span className="action-icon"></span>
            </button>
          </div>

          {/* User Badge */}
          <div className="user-badge">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name ?? 'Avatar'} />
              ) : (
                <span className="avatar-placeholder" aria-hidden="true"></span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Creator'}</span>
              {tier === 'PRO' ? (
                <span className="pro-badge" aria-label="PRO-Status">
                  <span className="pro-star" aria-hidden="true"></span>
                  <span className="pro-text">PRO</span>
                </span>
              ) : (
                <span className="free-badge" aria-label="FREE-Status">FREE</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skip Links for Accessibility */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">Zum Hauptinhalt springen</a>
        <a href="#navigation" className="skip-link">Zur Navigation springen</a>
      </div>
    </header>
  );
};

