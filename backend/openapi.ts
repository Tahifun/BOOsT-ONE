// backend/openapi.ts
// OpenAPI 3.0 Spec als Plain-Object (keine Abhängigkeit zu swagger-jsdoc nötig)
import "dotenv/config";

type AnyObj = Record<string, any>;

const toUrl = (v?: string | null) => (v ?? "").trim();
const PORT = Number(process.env.PORT || 4001);
const BACKEND_URL =
  toUrl(process.env.BACKEND_URL) ||
  `http://localhost:${PORT}`;

export function buildOpenApiSpec(): AnyObj {
  const spec: AnyObj = {
    openapi: "3.0.3",
    info: {
      title: "CLiP_ALffA API",
      version: "1.0.0",
      description:
        "REST API für Auth, Abos (PRO/DayPass), Checkout (EU-Consent), Billing-Portal und Overlays.",
      contact: { name: "CLiP_ALffA" }
    },
    servers: [
      { url: BACKEND_URL, description: "Local/Dev" }
    ],
    tags: [
      { name: "health", description: "Health & Session" },
      { name: "subscription", description: "Subscription Status & Handshake" },
      { name: "checkout", description: "Checkout (EU-Consent) & Webhook" },
      { name: "billing", description: "Stripe Billing Portal" },
      { name: "dev", description: "Dev-Utilities (nur in Entwicklung)" },
      { name: "misc", description: "Feature Flags etc." }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT im Authorization-Header senden: `Authorization: Bearer <token>`"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: false },
            error: { type: "string" },
            message: { type: "string" },
            hint: { type: "string" }
          }
        },
        DayPass: {
          type: "object",
          properties: {
            active: { type: "boolean" },
            validUntil: { type: "string", format: "date-time", nullable: true },
            remainingSeconds: { type: "integer", minimum: 0 }
          },
          example: {
            active: true,
            validUntil: "2025-09-02T12:34:56.000Z",
            remainingSeconds: 82345
          }
        },
        StripeInfo: {
          type: "object",
          properties: {
            status: { type: "string", nullable: true, example: "active" },
            customerId: { type: "string", nullable: true },
            subscriptionId: { type: "string", nullable: true },
            priceId: { type: "string", nullable: true }
          }
        },
        SubscriptionStatus: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: true },
            tier: { type: "string", enum: ["FREE", "PRO"] },
            active: { type: "boolean" },
            source: { type: "string", enum: ["NONE", "DAYPASS", "SUBSCRIPTION"] },
            dayPass: { $ref: "#/components/schemas/DayPass" },
            stripe: { $ref: "#/components/schemas/StripeInfo" },
            updatedAt: { type: "string", format: "date-time" },
            now: { type: "string", format: "date-time" }
          },
          example: {
            ok: true,
            tier: "PRO",
            active: true,
            source: "DAYPASS",
            dayPass: {
              active: true,
              validUntil: "2025-09-02T12:34:56.000Z",
              remainingSeconds: 82345
            },
            stripe: {
              status: "active",
              customerId: "cus_123",
              subscriptionId: "sub_123",
              priceId: "price_ABC"
            },
            updatedAt: "2025-09-01T10:00:00.000Z",
            now: "2025-09-01T09:59:00.000Z"
          }
        },
        CheckoutRequest: {
          type: "object",
          required: ["mode", "product", "consent", "consentText", "consentVersion"],
          properties: {
            mode: { type: "string", enum: ["subscription", "payment"] },
            product: { type: "string", enum: ["pro_monthly", "day_pass"] },
            consent: { type: "boolean", enum: [true] },
            consentText: { type: "string", minLength: 10 },
            consentVersion: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            successUrl: { type: "string", description: "Optional override" },
            cancelUrl: { type: "string", description: "Optional override" }
          },
          example: {
            mode: "payment",
            product: "day_pass",
            consent: true,
            consentText:
              "Ich stimme zu, dass der digitale Inhalt sofort verfügbar ist und ich mein Widerrufsrecht verliere.",
            consentVersion: "2025-09-01"
          }
        },
        CheckoutResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: true },
            id: { type: "string", example: "cs_test_123" },
            url: { type: "string", example: "https://checkout.stripe.com/c/pay/cs_test_123" }
          }
        },
        PortalResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: true },
            url: { type: "string", example: "https://billing.stripe.com/p/session/abc" }
          }
        }
      }
    },
    paths: {
      "/health": {
        get: {
          tags: ["health"],
          summary: "Health (204)",
          responses: {
            "204": { description: "No Content" }
          }
        }
      },
      "/api/health": {
        get: {
          tags: ["health"],
          summary: "Health (204, API-Pfad)",
          responses: {
            "204": { description: "No Content" }
          }
        }
      },
      "/api/session": {
        get: {
          tags: ["health"],
          summary: "Demo-Session",
          responses: {
            "200": {
              description: "Immer JSON, nie 500",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean", example: true },
                      user: { type: "object", nullable: true }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // --- SUBSCRIPTION ---
      "/api/subscription/handshake": {
        get: {
          tags: ["subscription"],
          summary: "Handshake",
          responses: {
            "200": {
              description: "Dienst erreichbar",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      service: { type: "string" },
                      apiVersion: { type: "string" },
                      ts: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/subscription/status": {
        get: {
          tags: ["subscription"],
          summary: "Abo-Status (FREE/PRO, Quelle, DayPass)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SubscriptionStatus" }
                }
              }
            },
            "401": {
              description: "Nicht eingeloggt",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
              }
            }
          }
        }
      },

      // --- CHECKOUT ---
      "/api/subscription/checkout": {
        post: {
          tags: ["checkout"],
          summary: "Checkout starten (EU-Consent erforderlich)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CheckoutRequest" } }
            }
          },
          responses: {
            "200": {
              description: "Stripe Checkout Session erstellt",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/CheckoutResponse" } }
              }
            },
            "400": {
              description: "Validation failed / falscher Mode/Produkt",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
              }
            },
            "401": {
              description: "Nicht eingeloggt",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
              }
            },
            "500": {
              description: "Checkout konnte nicht gestartet werden",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
              }
            }
          }
        }
      },
      "/api/subscription/webhook": {
        post: {
          tags: ["checkout"],
          summary: "Stripe Webhook (RAW body, keine Auth)",
          description:
            "️ Der Body **muss** unverändert (RAW) sein. Signatur-Verifikation via `STRIPE_WEBHOOK_SECRET`.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { type: "object", additionalProperties: true } }
            }
          },
          responses: {
            "200": { description: "ok (oder duplicate ignored)" },
            "400": { description: "Signatur ungültig / Missing header" },
            "500": { description: "Fehler in Verarbeitung" }
          }
        }
      },

      // --- BILLING PORTAL ---
      "/api/billing/create-portal-session": {
        post: {
          tags: ["billing"],
          summary: "Stripe Billing-Portal-Link erstellen",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/PortalResponse" } }
              }
            },
            "401": {
              description: "Nicht eingeloggt",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
              }
            },
            "500": {
              description: "Portal konnte nicht erstellt werden",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
              }
            }
          }
        }
      },

      // --- FEATURE FLAGS ---
      "/api/feature-flags": {
        get: {
          tags: ["misc"],
          summary: "Feature-Flags lesen (Stub)",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { ok: { type: "boolean" }, flags: { type: "object" } } }
                }
              }
            }
          }
        },
        post: {
          tags: ["misc"],
          summary: "Feature-Flags setzen (Stub)",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { ok: { type: "boolean" }, flags: { type: "object" } } }
                }
              }
            }
          }
        }
      },

      // --- DEV (nur in Entwicklung sichtbar, aber dokumentiert) ---
      "/api/dev/mint-token": {
        post: {
          tags: ["dev"],
          summary: "JWT erzeugen (nur Entwicklung)",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sub: { type: "string", description: "User-ID (optional)" },
                    email: { type: "string", description: "E-Mail (optional)" },
                    tier: { type: "string", enum: ["free", "pro", "enterprise"], default: "free" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      token: { type: "string" },
                      payload: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/dev/whoami": {
        get: {
          tags: ["dev"],
          summary: "User-Info aus dem JWT (nur Entwicklung)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "OK",
              content: { "application/json": { schema: { type: "object" } } }
            },
            "401": {
              description: "Nicht eingeloggt",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
            }
          }
        }
      }
    }
  };

  return spec;
}

export default { buildOpenApiSpec };


