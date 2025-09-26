// backend/types/auth.ts
import { Request } from "express";

export type Tier = "FREE" | "PRO" | "ENTERPRISE";

export type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPERUSER";

export interface JwtUserPayload {
  id: string;
  role?: Role;
  tier?: Tier;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}


