// routes/overlayTemplates.routes.ts
import { Router } from "express";
import { attachUserFromHeaders, requireAuth, requireTier } from "../middleware/auth.js";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  setDefaultTemplate,
  importTemplates,
} from "../controllers/overlayTemplatesController.js";

const router = Router();

// req.user verfgbar machen (optional, tolerant)
router.use(attachUserFromHeaders as any);

router.get("/templates", requireAuth, listTemplates);
router.post("/templates", requireAuth, createTemplate);
router.put("/templates/:id", requireAuth, updateTemplate);
router.delete("/templates/:id", requireAuth, deleteTemplate);
router.post("/templates/:id/duplicate", requireAuth, duplicateTemplate);
router.post("/templates/:id/default", requireAuth, setDefaultTemplate);

// PRO-pflichtig
router.post("/templates/import", requireAuth, requireTier("PRO"), importTemplates);

export default router;
