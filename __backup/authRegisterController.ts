// backend/controllers/authRegisterController.ts
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

export default async function authRegister(req: Request, res: Response) {
  try {
    const { email, password, accept } = (req.body ?? {}) as { email?: string; password?: string; accept?: boolean };
    if (!email || !password) return res.status(422).json({ ok: false, message: "E-Mail und Passwort sind erforderlich." });
    if (!accept) return res.status(412).json({ ok: false, message: "AGB/Datenschutz mÃ¼ssen akzeptiert werden." });
    if (!process.env.JWT_SECRET) return res.status(500).json({ ok: false, message: "Server JWT-Config fehlt." });

    const db = mongoose.connection.db;
    if (!db) return res.status(503).json({ error: "db_unavailable" });
    const users = db.collection("users");


    const existing = await users.findOne({ email: email.toLowerCase() }, { projection: { _id: 1 } });
    if (existing) return res.status(409).json({ ok: false, message: "E-Mail bereits registriert." });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const result = await users.insertOne({ email: email.toLowerCase(), passwordHash, createdAt: now, updatedAt: now });

    const userId = result.insertedId.toString();
    const token = issueJwt(userId);
    return res.status(201).json({ ok: true, token, user: { _id: userId, email } });
  } catch (err: unknown) {
    console.error("[auth/register]", err?.message || err);
    return res.status(500).json({ ok: false, message: "Registrierung fehlgeschlagen." });
  }
}


