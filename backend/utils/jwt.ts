// backend/utils/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_ISSUER = process.env.JWT_ISSUER || "appmastervip";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "appmastervip-clients";

export type JwtClaims = {
  sub: string;            // userId
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
};

export function verifyToken(token: string): JwtClaims {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as JwtClaims;
  return decoded;
}


