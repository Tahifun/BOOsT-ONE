import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email?: string;
      role?: "USER" | "ADMIN" | "SUPERUSER" | string;
      [key: string]: unknown;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};


