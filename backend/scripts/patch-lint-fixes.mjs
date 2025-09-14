// scripts/patch-lint-fixes.mjs
import fs from 'node:fs';

const paths = [
  'backend/index.ts',
  'backend/middleware/errorHandler.ts',
  'backend/routes/quantumRoutes.ts',
  'backend/routes/spotify.routes.ts',
  'backend/routes/statsRoutes.ts',
].filter((p) => fs.existsSync(p));

for (const p of paths) {
  let t = fs.readFileSync(p, 'utf8');

  // 1) mark unused Express 'next' param as used (z. B. im Error-Handler)
  t = t.replace(
    /(app\.use\(\(err:[\s\S]*?,\s*_req:[\s\S]*?,\s*res:[\s\S]*?,\s*_next:[\s\S]*?\)\s*=>\s*\{)/,
    '$1\n  void _next;',
  );
  t = t.replace(
    /(function\s+[A-Za-z0-9_]*\s*\([\s\S]*?_next:\s*[A-Za-z0-9_.]+[\s\S]*?\)\s*\{)/,
    '$1\n  void _next;',
  );

  // 2) quantumRoutes: ungebundene Methoden → in Arrow-Wrapper packen
  t = t.replace(
    /(router\.(?:get|post|put|patch|delete)\(\s*(['"][^'"]+['"])\s*,\s*)([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*(\))/g,
    '$1(req,res,next)=>$3.$4(req,res,next)$5',
  );

  // 3) @ts-ignore → @ts-expect-error
  t = t.replace(/@ts-ignore/g, '@ts-expect-error');

  // 4) spotify.routes: NextFunction-Import & -Param entfernen
  t = t.replace(/,\s*NextFunction\s*} from 'express';/g, "} from 'express';");
  t = t.replace(
    /\(\s*req:\s*Request\s*,\s*res:\s*Response\s*,\s*_?next:\s*[A-Za-z0-9_.]+\s*\)/g,
    '(req: Request, res: Response)',
  );

  // 5) Überflüssiges await vor res.json / res.send / res.end entfernen
  t = t.replace(/\bawait\s+(res\.(?:json|send|end)\s*\()/g, '$1');

  // 6) trailing spaces säubern
  t = t.replace(/[ \t]+$/gm, '');

  fs.writeFileSync(p, t);
  console.log('patched', p);
}
