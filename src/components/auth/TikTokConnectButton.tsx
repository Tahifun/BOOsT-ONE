import Button from "../Button"; // Pfad ggf. anpassen

export default function TikTokConnectButton() {
  // Vercel: unterstützt beide Varianten (mit Underscore oder Bindestrich)
  const API =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env["VITE-API-BASE-URL"] ??
    "";

  const handleClick = () => {
    if (!API) {
      console.error("VITE_API_BASE_URL fehlt");
      return;
    }
    window.location.href = `${API}/oauth/tiktok/auth`;
  };

  return (
    <Button variant="primary" size="md" onClick={handleClick}>
      Mit TikTok verbinden
    </Button>
  );
}
