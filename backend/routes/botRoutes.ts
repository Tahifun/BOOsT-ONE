// routes/botRoutes.ts
import { Router } from "express";
import { runCommand, getStatus } from "../controllers/botController.js";

const router = Router();

router.post("/command", runCommand);
router.get("/status", getStatus);

export default router;
