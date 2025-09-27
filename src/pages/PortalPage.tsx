import React from "react";
import { useEffect, useState } from "react";
import { createPortalSession, mapSubscriptionError } from '../services/subscriptionService';

const PortalPage: React.FC = () => {
  const [msg, setMsg] = useState<string>("�-ffne Kundenportal�?�");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { url } = await createPortalSession();
        if (!mounted) return;
        if (url) {
          window.location.href = url;
          return;
        }
        setErr("Unerwartete Antwort (keine URL).");
      } catch (e) {
        const m = mapSubscriptionError(e);
        setErr(m);
        if ((e as any)?.status === 404 || (e as any)?.status === 501) {
          setMsg("Weiterleitung zur Upgrade-Seite�?�");
          window.location.replace("/upgrade");
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Kundenportal</h1>
      {err ? <p className="text-red-600 mt-2">{err}</p> : <p className="opacity-70 mt-2">{msg}</p>}
    </div>
  );
};

export default PortalPage;




