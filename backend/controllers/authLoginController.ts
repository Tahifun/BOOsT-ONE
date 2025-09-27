// backend/controllers/authLoginController.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function issueJwt(userId: string) {
  const secret = process.env.JWT_SECRET!;
  const issuer = process.env.JWT_ISSUER || "clipboost";
  const audience = process.env.JWT_AUDIENCE || "clipboost-app";
  return jwt.sign({ sub: userId }, secret, { issuer, audience, expiresIn: "30m" });
}

export default async function authLogin(req: Request, res: Response) {
  try {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) return res.status(422).json({ ok: false, message: "E-Mail und Passwort sind erforderlich." });
    if (!process.env.JWT_SECRET) return res.status(500).json({ ok: false, message: "Server JWT-Config fehlt." });

    const db = mongoose.connection.db;
    if (!db) return res.status(503).json({ error: "db_unavailable" });
    const users = db.collection("users");

    const user = await users.findOne({ email: email.toLowerCase() }, { projection: { _id: 1, email: 1, passwordHash: 1 } });
    if (!user || !user.passwordHash) return res.status(401).json({ ok: false, message: "Ung�ltige Zugangsdaten." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, message: "Ung�ltige Zugangsdaten." });

    const token = issueJwt(user._id.toString());
    return res.json({ ok: true, token, user: { _id: user._id.toString(), email: user.email } });
  } catch (err: unknown) {
    console.error("[auth/login]", err?.message || err);
    return res.status(500).json({ ok: false, message: "Login fehlgeschlagen." });
  }
}


