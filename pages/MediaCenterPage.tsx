import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import "../styles/media-center.css";

/** 
 *  Tabs
 *   */
type TabKey =
  | "dashboard"
  | "upload"
  | "gallery"
  | "clips"
  | "screenshots"
  | "soundboard"
  | "overlays"
  | "export"
  | "stats"
  | "ai";

const TABS: { key: TabKey; icon: string; title: string }[] = [
  { key: "dashboard", icon: "", title: "Dashboard" },
  { key: "upload", icon: "?", title: "Upload" },
  { key: "gallery", icon: "", title: "Galerie" },
  { key: "clips", icon: "?", title: "Clips" },
  { key: "screenshots", icon: "", title: "Screenshots" },
  { key: "soundboard", icon: "", title: "Soundboard" },
  { key: "overlays", icon: "", title: "Overlays" },
  { key: "export", icon: "", title: "Export" },
  { key: "stats", icon: "", title: "Impact Stats" },
  { key: "ai", icon: "", title: "AI Assistant" },
];

/** 
 *  Lazy geladene Container-Komponenten aus deinem Projekt
 *  (Pfad: src/components/media/**)
 *   */
const MediaUpload = lazy(() => import('../components/media/MediaUpload'));
const MediaGallery = lazy(() => import('../components/media/MediaGallery'));
const ClipManager = lazy(() => import('../components/media/ClipManager'));
const ScreenshotManager = lazy(() => import('../components/media/ScreenshotManager'));
const SoundboardManager = lazy(() => import('../components/media/SoundboardManager'));
const OverlayTemplateManager = lazy(() => import('../components/media/OverlayTemplateManager'));
const MediaExportTools = lazy(() => import('../components/media/MediaExportTools'));
const MediaImpactStats = lazy(() => import('../components/media/MediaImpactStats'));
const AIHighlightSuggestions = lazy(() => import('../components/media/AIHighlightSuggestions'));
// dedizierte AI-Hub-Ansicht
const AIAssistant = lazy(() => import('../components/media/ai/AIAssistant'));

type NoticeType = "success" | "error";

/** 
 *  Seite
 *   */
const MediaCenterPage: React.FC = () => {
  const [active, setActive] = useState<TabKey>("dashboard");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ show: boolean; msg: string; type: NoticeType }>({
    show: false,
    msg: "",
    type: "success",
  });

  // Partikel fr Hintergrund (rein visuell)
  const particles = useMemo(
    () =>
      Array.from({ length: 50 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 15 + Math.random() * 10,
      })),
    []
  );

  // Sanfte Tageszeit-Anpassung (Lokaler Scope)
  useEffect(() => {
    const hour = new Date().getHours();
    const root = document.querySelector<HTMLElement>(".mc-root");
    if (!root) return;
    if (hour >= 6 && hour < 12) root.style.setProperty("--primary", "#818cf8");
    if (hour >= 18 || hour < 6) root.style.setProperty("--darker", "#000000");
  }, []);

  // Shortcuts (/Ctrl+U = Upload, /Ctrl+G = Galerie, ESC = Hinweis ausblenden)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setActive("upload");
      }
      if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setActive("gallery");
      }
      if (e.key === "Escape") {
        setNotice((n) => ({ ...n, show: false }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showNotification = (msg: string, type: NoticeType = "success") => {
    setNotice({ show: true, msg, type });
    window.setTimeout(() => setNotice((n) => ({ ...n, show: false })), 3000);
  };

  // simple Spinner fr Suspense
  const Spinner = () => <div className="mc-spinner" aria-hidden />;

  return (
    <div className="mc-root" aria-live="polite">
      {/* Hintergrund */}
      <div className="mc-bg" />
      <div className="mc-particles" aria-hidden>
        {particles.map((p, i) => (
          <div
            key={i}
            className="mc-particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Container */}
      <div className="mc-container">
        {/* Header */}
        <header className="mc-header">
          <div className="mc-header__row">
            <h1 className="mc-title">MEDIA CENTER</h1>
            <div className="mc-user">
              <span> Creator</span>
              <span className="mc-pro"> PRO</span>
            </div>
          </div>
        </header>

        {/* Suche */}
        <div className="mc-search" role="search">
          <span aria-hidden></span>
          <input
            className="mc-search__input"
            placeholder="Suche nach Videos, Clips, Screenshots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="mc-btn mc-btn--glass" onClick={() => showNotification(" Filter geffnet")}>
            Filter
          </button>
        </div>

        {/* Tabs */}
        <nav className="mc-tabs" aria-label="Navigation">
          {TABS.map(({ key, icon, title }) => (
            <button
              key={key}
              className={`mc-tab ${active === key ? "is-active" : ""}`}
              onClick={() => setActive(key)}
              aria-pressed={active === key}
            >
              <span className="mc-tab__icon" aria-hidden>
                {icon}
              </span>
              <span className="mc-tab__label">{title}</span>
            </button>
          ))}
        </nav>

        {/* Inhalte */}
        <div className="mc-content">
          {/* Dashboard */}
          {active === "dashboard" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <MediaImpactStats />
              </Suspense>

              <div className="mc-ai-suggestions">
                <span className="mc-ai-badge"> AI Empfohlen</span>
                <Suspense fallback={<Spinner />}>
                  <AIHighlightSuggestions onSelect={() => setActive("clips")} />
                </Suspense>
              </div>
            </section>
          )}

          {/* Upload */}
          {active === "upload" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <MediaUpload onUpload={() => showNotification(" Upload erfolgreich!")} />
              </Suspense>
            </section>
          )}

          {/* Galerie */}
          {active === "gallery" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <MediaGallery query={search} />
              </Suspense>
            </section>
          )}

          {/* Clips */}
          {active === "clips" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <ClipManager />
              </Suspense>
            </section>
          )}

          {/* Screenshots */}
          {active === "screenshots" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <ScreenshotManager />
              </Suspense>
            </section>
          )}

          {/* Soundboard */}
          {active === "soundboard" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <SoundboardManager />
              </Suspense>
            </section>
          )}

          {/* Overlays */}
          {active === "overlays" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <OverlayTemplateManager />
              </Suspense>
            </section>
          )}

          {/* Export */}
          {active === "export" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <MediaExportTools />
              </Suspense>
            </section>
          )}

          {/* Stats */}
          {active === "stats" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <MediaImpactStats />
              </Suspense>
            </section>
          )}

          {/* AI Hub */}
          {active === "ai" && (
            <section className="mc-panel">
              <Suspense fallback={<Spinner />}>
                <AIAssistant />
              </Suspense>
            </section>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="mc-fab" onClick={() => setNotice({ show: true, msg: " Quick Action Menu geffnet", type: "success" })} aria-label="Schnellaktion">
        +
      </button>

      {/* Notification */}
      <div className={`mc-notice mc-notice--${notice.type} ${notice.show ? "is-shown" : ""}`} role="status" aria-live="polite">
        <h4 className="mc-notice__title">{notice.type === "success" ? " Erfolg!" : "? Hinweis"}</h4>
        <p className="mc-notice__text">{notice.msg}</p>
      </div>
    </div>
  );
};

export default MediaCenterPage;

