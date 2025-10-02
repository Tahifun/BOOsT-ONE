// backend/controllers/authController.ts
import dotenv from "dotenv";
dotenv.config();

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import type { Model } from "mongoose";
import User, { IUser } from "../models/User.js";
import VerificationToken from "../models/VerificationToken.js";
import { Role } from "../types/auth.js";
import Subscription from "../models/Subscription.js";
import logger from "../utils/logger.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_ISSUER = process.env.JWT_ISSUER || "appmastervip";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "appmastervip-clients";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* -------------------------------------------------------------------------- */
/*  WICHTIG: Models einmal hart auf Model<T> casten  behebt TS-Overload-Irrsinn */
/* -------------------------------------------------------------------------- */
const UserModel = User as unknown as Model<IUser>;
const VerificationTokenModel = VerificationToken as unknown as Model<any>;
const SubscriptionModel = Subscription as unknown as Model<any>;

/* ------------------------------ Mail Versand ------------------------------ */
async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${CLIENT_ORIGIN.replace(/\/$/, "")}/verify/${token}`;
  const msg = {
    to,
    from: process.env.SENDGRID_FROM || "no-reply@yourapp.local",
    subject: "Bitte besttige deine E-Mail",
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
        <h2>E-Mail besttigen</h2>
        <p>Danke fr deine Registrierung. Bitte besttige deine E-Mail-Adresse:</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#111;color:#fff;text-decoration:none">E-Mail besttigen</a></p>
        <p>Oder ffne diesen Link: <br/><code>${verifyUrl}</code></p>
      </div>
    `,
  };
  await sgMail.send(msg as any);
}

/* -------------------------- Entitlements/Abos ----------------------------- */
async function resolveEntitlements(user: IUser) {
  try {
    const sub: unknown = await SubscriptionModel.findOne({ userId: (user as any)._id }).exec();
    const now = Date.now();

    if (sub) {
      const tier = sub.tier || "FREE";
      const validUntilTs = sub.validUntil ? new Date(sub.validUntil).getTime() : null;
      const active = tier !== "FREE" && (validUntilTs === null || validUntilTs > now);
      const isDayPass = Boolean(
        tier !== "FREE" &&
          !sub.stripeSubscriptionId &&
          validUntilTs !== null &&
          validUntilTs > now
      );

      return {
        tier: active ? (tier as "FREE" | "PRO" | "ENTERPRISE") : "FREE",
        active,
        validUntil: validUntilTs ? new Date(validUntilTs).toISOString() : null,
        isDayPass,
      };
    }

    const fallbackTier = (user as any)?.isPro ? "PRO" : "FREE";
    return { tier: fallbackTier, active: (user as any)?.isPro, validUntil: null, isDayPass: false };
  } catch (err) {
    logger?.error?.("resolveEntitlements() Fehler:", err);
    const fallbackTier = (user as any)?.isPro ? "PRO" : "FREE";
    return { tier: fallbackTier, active: (user as any)?.isPro, validUntil: null, isDayPass: false };
  }
}

/* ----------------------------- JWT Signieren ------------------------------ */
function signJwt(
  user: IUser,
  ent: { tier: string; active: boolean; validUntil: string | null; isDayPass: boolean }
) {
  const payload = {
    id: (user as any)._id.toString(),
    email: (user as any).email,
    role: ((user as any).role as Role) || "USER",
    tier: ent.tier,
    active: ent.active,
    validUntil: ent.validUntil,
    isDayPass: ent.isDayPass,
  };

  // issuer/audience mitgeben  deine middleware/auth prft das
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  return { token, payload };
}

/* -------------------------------- Controller ------------------------------ */

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  try {
    const { email, password, username } = req.body as {
      email: string;
      password: string;
      username?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "E-Mail und Passwort erforderlich." });
    }

    const existing = await UserModel.findOne({ email }).exec();
    if (existing) {
      return res.status(409).json({ error: "E-Mail bereits registriert." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email,
      password: hashed,
      username,
      isPro: false,
      isVerified: false,
      role: "USER",
    } as any);

    await VerificationTokenModel.deleteMany({ userId: (user as any)._id }).exec();
    const token = crypto.randomBytes(32).toString("hex");
    await VerificationTokenModel.create({ userId: (user as any)._id, token });
    await sendVerificationEmail(email, token);

    return res.json({ message: "Verifizierungs-Mail versandt. Bitte prfe dein Postfach." });
  } catch (err: unknown) {
    logger?.error?.("? Fehler in /api/auth/register:", err);
    return res.status(500).json({ error: "Interner Serverfehler bei der Registrierung." });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      return res.status(400).json({ error: "E-Mail und Passwort erforderlich." });
    }

    const user = (await UserModel.findOne({ email }).exec()) as any as IUser | null;
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden." });

    const ok = await bcrypt.compare(password, (user as any).password);
    if (!ok) return res.status(401).json({ error: "Ungltige Zugangsdaten." });

    if (!(user as any).isVerified) {
      return res.status(403).json({ error: "Bitte besttige zuerst deine E-Mail-Adresse." });
    }

    const ent = await resolveEntitlements(user);
    const { token, payload } = signJwt(user, ent);

    return res.json({
      token,
      user: {
        id: (user as any)._id,
        email: (user as any).email,
        username: (user as any).username,
        role: ((user as any).role as Role) || "USER",
        tier: payload.tier,
        active: payload.active,
        validUntil: payload.validUntil,
        isDayPass: payload.isDayPass,
      },
    });
  } catch (err) {
    logger?.error?.("? Fehler in /api/auth/login:", err);
    return res.status(500).json({ error: "Interner Serverfehler beim Login." });
  }
}

// GET /api/auth/verify/:token
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.params as { token: string };
    if (!token) return res.status(400).json({ error: "Token fehlt." });

    const rec = await VerificationTokenModel.findOne({ token }).exec();
    if (!rec) return res.status(400).json({ error: "Ungltiger oder abgelaufener Token." });

    const user = (await UserModel.findById((rec as any).userId).exec()) as any as IUser | null;
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden." });

    (user as any).isVerified = true;
    await (user as any).save();
    await VerificationTokenModel.deleteMany({ userId: (user as any)._id }).exec();

    return res.json({ message: "E-Mail erfolgreich besttigt." });
  } catch (err) {
    logger?.error?.("? Fehler in /api/auth/verify:", err);
    return res.status(500).json({ error: "Interner Serverfehler bei der Besttigung." });
  }
}

// POST /api/auth/resend-verification
export async function resendVerification(req: Request, res: Response) {
  try {
    const user = (await UserModel.findOne({ email: req.body.email }).exec()) as any as IUser | null;
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden." });
    if ((user as any).isVerified) return res.status(400).json({ error: "E-Mail bereits besttigt." });

    await VerificationTokenModel.deleteMany({ userId: (user as any)._id }).exec();
    const token = crypto.randomBytes(32).toString("hex");
    await VerificationTokenModel.create({ userId: (user as any)._id, token });
    await sendVerificationEmail((user as any).email, token);

    return res.json({ message: "Verifizierungs-Mail erneut versandt. Bitte prfe dein Postfach." });
  } catch (err) {
    logger?.error?.("? Fehler in /api/auth/resend-verification:", err);
    return res.status(500).json({ error: "Interner Serverfehler beim erneuten Senden." });
  }
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
  const u = (req as any).user;
  if (!u) return res.status(401).json({ error: "Nicht authentifiziert" });
  return res.json({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    isVerified: u.isVerified,
  });
}


