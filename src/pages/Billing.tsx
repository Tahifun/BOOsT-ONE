// src/pages/Billing.tsx
import React from "react";
import CheckoutButtons from '../components/billing/CheckoutButtons';

// TODO: token kÃ¼nftig weglassen, wenn HttpOnly-Cookies aktiv sind
const getToken = () => localStorage.getItem("access_token") || undefined;

export default function BillingPage() {
  const token = getToken();
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>CLiP BOOsT â€“ Billing</h1>
      <p style={{ opacity: 0.85, marginBottom: 16 }}>
        WÃ¤hle dein Upgrade oder verwalte dein Abo. Der Checkout Ã¶ffnet sich in einem neuen Fenster.
      </p>
      <CheckoutButtons token={token} />
    </main>
  );
}

