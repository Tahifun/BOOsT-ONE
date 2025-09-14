// routes/quantumRoutes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { RateLimits } from "../middleware/rateLimiting.js";
// Controller kann Klassen/Methoden oder freie Funktionen exportieren.
// Wir rufen defensiv auf und liefern 501, falls nicht vorhanden.
import * as quantumController from "../controllers/quantumController.js";

const router = Router();
const writeRate = (RateLimits as any).general;
const execRate = (RateLimits as any).general;

function call(name: string) {
  return (req: unknown, res: unknown) => {
    const fn = (quantumController as any)[name];
    if (typeof fn === "function") {
      return fn(req, res);
    }
    return res.status(501).json({ error: "not_implemented", method: name });
  };
}

router.post("/flows", requireAuth, writeRate, call("createQuantumFlow"));
router.put("/flows/:flowId", requireAuth, writeRate, call("updateQuantumFlow"));
router.post("/flows/:flowId/toggle", requireAuth, writeRate, call("toggleQuantumFlow"));
router.post("/flows/execute", requireAuth, execRate, call("executeQuantumFlow"));

export default router;
