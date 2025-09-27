// backend/controllers/overlayTemplatesController.ts
import { Response } from "express";
import logger from "../utils/logger.js";
import OverlayTemplate from "../models/OverlayTemplate.js";
import { getTemplatesMaxForUser } from "../config/limits.js";

/**
 * GET /api/overlay/templates
 */
export async function listTemplates(req: unknown, res: Response) {
  try {
    const user = req.user;
    const userId = user!.id;
    const items = await OverlayTemplate.find({ userId }).sort({ updatedAt: -1 }).lean();
    return res.json({ items });
  } catch (e) {
    logger.error("[overlayTemplates] list", e);
    return res.status(500).json({ message: "Konnte Vorlagen nicht laden." });
  }
}

/**
 * POST /api/overlay/templates
 */
export async function createTemplate(req: unknown, res: Response) {
  try {
    const user = req.user;
    const userId = user!.id;
    const max = getTemplatesMaxForUser(user);

    const current = await OverlayTemplate.countDocuments({ userId });
    if (current >= max) {
      return res.status(402).json({ message: "Vorlagen-Limit erreicht (PRO erforderlich)." });
    }

    const name = typeof req.body?.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : `Vorlage ${current + 1}`;

    const widgets = (req.body?.widgets && typeof req.body.widgets === "object") ? req.body.widgets : {};

    const doc = await OverlayTemplate.create({ userId, name, widgets });
    return res.status(201).json({ item: doc });
  } catch (e) {
    logger.error("[overlayTemplates] create", e);
    return res.status(500).json({ message: "Vorlage konnte nicht erstellt werden." });
  }
}

/**
 * PUT /api/overlay/templates/:id
 */
export async function updateTemplate(req: unknown, res: Response) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const payload: unknown = {};
    if (typeof req.body?.name === "string" && req.body.name.trim()) {
      payload.name = req.body.name.trim();
    }
    if (req.body?.widgets && typeof req.body.widgets === "object") {
      payload.widgets = req.body.widgets;
    }
    payload.updatedAt = new Date();

    const doc = await OverlayTemplate.findOneAndUpdate(
      { _id: id, userId },
      { $set: payload },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Vorlage nicht gefunden." });
    return res.json({ item: doc });
  } catch (e) {
    logger.error("[overlayTemplates] update", e);
    return res.status(500).json({ message: "Vorlage konnte nicht ge�ndert werden." });
  }
}

/**
 * DELETE /api/overlay/templates/:id
 */
export async function deleteTemplate(req: unknown, res: Response) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const doc = await OverlayTemplate.findOneAndDelete({ _id: id, userId });
    if (!doc) return res.status(404).json({ message: "Vorlage nicht gefunden." });
    return res.json({ ok: true });
  } catch (e) {
    logger.error("[overlayTemplates] delete", e);
    return res.status(500).json({ message: "Vorlage konnte nicht gel�scht werden." });
  }
}

/**
 * POST /api/overlay/templates/:id/duplicate
 */
export async function duplicateTemplate(req: unknown, res: Response) {
  try {
    const user = req.user;
    const userId = user!.id;
    const id = req.params.id;

    const max = getTemplatesMaxForUser(user);
    const current = await OverlayTemplate.countDocuments({ userId });
    if (current >= max) {
      return res.status(402).json({ message: "Vorlagen-Limit erreicht (PRO erforderlich)." });
    }

    const src = await OverlayTemplate.findOne({ _id: id, userId });
    if (!src) return res.status(404).json({ message: "Vorlage nicht gefunden." });

    const copy = await OverlayTemplate.create({
      userId,
      name: `${src.name} (Kopie)`,
      widgets: src.widgets || {},
      isDefault: false,
    });

    return res.status(201).json({ item: copy });
  } catch (e) {
    logger.error("[overlayTemplates] duplicate", e);
    return res.status(500).json({ message: "Vorlage konnte nicht dupliziert werden." });
  }
}

/**
 * POST /api/overlay/templates/:id/default
 */
export async function setDefaultTemplate(req: unknown, res: Response) {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const owns = await OverlayTemplate.findOne({ _id: id, userId });
    if (!owns) return res.status(404).json({ message: "Vorlage nicht gefunden." });

    await OverlayTemplate.updateMany({ userId }, { $set: { isDefault: false } });
    const updated = await OverlayTemplate.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isDefault: true, updatedAt: new Date() } },
      { new: true }
    );

    return res.json({ item: updated });
  } catch (e) {
    logger.error("[overlayTemplates] set default", e);
    return res.status(500).json({ message: "Standard konnte nicht gesetzt werden." });
  }
}

/**
 * POST /api/overlay/templates/import
 */
export async function importTemplates(req: unknown, res: Response) {
  try {
    const user = req.user;
    const userId = user!.id;

    const max = getTemplatesMaxForUser(user);
    const current = await OverlayTemplate.countDocuments({ userId });

    const payload = req.body;
    const arr = Array.isArray(payload) ? payload : [payload];

    const remaining = Math.max(0, max - current);
    if (arr.length > remaining) {
      return res.status(402).json({
        message: `Vorlagen-Limit erreicht. Frei: ${remaining}, Import: ${arr.length}`,
      });
    }

    const toInsert = arr.map((t: unknown) => ({ userId, ...t, isDefault: false }));
    const docs = await OverlayTemplate.insertMany(toInsert);
    return res.status(201).json({ items: docs });
  } catch (e) {
    logger.error("[overlayTemplates] import", e);
    return res.status(500).json({ message: "Vorlagen konnten nicht importiert werden." });
  }
}


