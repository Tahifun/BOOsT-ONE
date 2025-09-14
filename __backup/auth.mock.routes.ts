// backend/routes/auth.mock.routes.ts
import { Router, Request, Response, NextFunction } from "express";

const router = Router();

type User = { id: string; email: string; name?: string };

// Helfer
function setUserSession(req: Request, user: User, cb: (err?: unknown) => void) {
  req.session.regenerate((err) => {
    if (err) return cb(err);
    (req.session as any).user = user;
    req.session.save(cb);
  });
}

// --- Register (Mock) ---
router.post("/auth/register", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email_and_password_required" });
    }
    const user: User = { id: "mock-" + Date.now(), email, name: name || "User" };
    setUserSession(req, user, (err) => {
      if (err) return next(err);
      res.json({ success: true, user });
    });
  } catch (e) {
    next(e);
  }
});

// --- Login (Mock) ---
router.post("/auth/login", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email_and_password_required" });
    }
    const user: User = { id: "mock-logged", email, name: "User" };
    setUserSession(req, user, (err) => {
      if (err) return next(err);
      res.json({ success: true, user });
    });
  } catch (e) {
    next(e);
  }
});

// --- Logout ---
router.post("/auth/mock-logout", (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

// --- Bestehender Mock-Login (behalten, praktisch für Tests) ---
router.post("/auth/mock-login", (req: Request, res: Response, next: NextFunction) => {
  const { email = "you@clipboost.dev", name = "Rene" } = req.body || {};
  const user: User = { id: "mock-1", email, name };
  setUserSession(req, user, (err) => {
    if (err) return next(err);
    res.json({ success: true, user });
  });
});

// --- Status ---
router.get("/auth/me", (req: Request, res: Response) => {
  const user = (req as any).session?.user || null;
  res.json({ success: true, authenticated: !!user, user });
});

export default router;
