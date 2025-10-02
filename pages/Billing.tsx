// src/pages/Billing.tsx
import React from "react";
import CheckoutButtons from '../components/billing/CheckoutButtons';

// TODO: token knftig weglassen, wenn HttpOnly-Cookies aktiv sind
const getToken = () => localStorage.getItem("access_token") || undefined;

export default function BillingPage() {
  const token = getToken();
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>CLiP BOOsT  Billing</h1>
      <p style={{ opacity: 0.85, marginBottom: 16 }}>
        Whle dein Upgrade oder verwalte dein Abo. Der Checkout ffnet sich in einem neuen Fenster.
      </p>
      <CheckoutButtons token={token} />
    </main>
  );
}

