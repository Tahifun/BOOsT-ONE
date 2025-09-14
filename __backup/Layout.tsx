import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Optional: Header */}
      <header className="border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-semibold">TikTok Livestream Companion</Link>
          {/* Platz für Nav / User-Menü */}
        </div>
      </header>

      {/* Seiteninhalt */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4">
          <Outlet />
        </div>
      </main>

      {/* Footer mit rechtlichen Links – klein, aber klar erkennbar */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto p-4 text-xs sm:text-sm flex flex-wrap items-center justify-center gap-4">
          <Link to="/imprint" className="underline underline-offset-2 hover:no-underline">
            Impressum
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/terms" className="underline underline-offset-2 hover:no-underline">
            AGB
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/privacy" className="underline underline-offset-2 hover:no-underline">
            Datenschutz
          </Link>
        </div>
      </footer>
    </div>
  );
}
