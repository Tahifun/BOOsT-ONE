// middleware/validateRequest.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";

type Part = "body" | "query" | "params";

export function validateRequest(schema: Partial<Record<Part, ZodSchema<any>>>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const part of ["body", "query", "params"] as Part[]) {
        const sch = (schema as any)[part] as ZodSchema<any> | undefined;
        if (!sch) continue;
        const parsed = sch.safeParse((req as any)[part]);
        if (!parsed.success) {
          return res.status(422).json({
            error: "validation_error",
            part,
            issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          });
        }
        (req as any)[part] = parsed.data;
      }
      return next();
    } catch (e: unknown) {
      return res.status(400).json({ error: "bad_request", message: e?.message ?? String(e) });
    }
  };
}

export default validateRequest;
