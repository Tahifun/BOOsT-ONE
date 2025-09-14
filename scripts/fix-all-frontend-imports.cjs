const fs = require("fs");
const path = require("path");

let globSync;
try {
  // glob v10+
  ({ globSync } = require("glob"));
  if (typeof globSync !== "function") throw new Error();
} catch {
  // Fallback für glob v7.x
  const g = require("glob");
  globSync = g.sync;
}

const FRONTEND_DIR = path.join(process.cwd(), "src");

const RULES = [
  { // from './x.js' -> from './x'
    regex: /(from\s+['"])([.\/][^'"]+?)\.js(['"];?)/g,
    replace: (m, p1, p2, p3) => {
      if (/\.(css|json|png|svg|jpg|jpeg|gif)$/.test(p2)) return m;
      if (p2.endsWith("server.mjs") || p2.endsWith("openapi.mjs")) return m;
      return `${p1}${p2}${p3}`;
    }
  },
  { // import('./x.js') -> import('./x')
    regex: /(import\s*\(\s*['"])([.\/][^'"]+?)\.js(['"]\s*\))/g,
    replace: (m, p1, p2, p3) => (/\.(css|json)$/.test(p2) ? m : `${p1}${p2}${p3}`)
  },
  { // export ... from './x.js' -> export ... from './x'
    regex: /(export\s+.*?\s+from\s+['"])([.\/][^'"]+?)\.js(['"];?)/g,
    replace: (m, p1, p2, p3) => `${p1}${p2}${p3}`
  }
];

function fixFile(file) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  let total = 0;
  for (const r of RULES) {
    content = content.replace(r.regex, (...args) => {
      const out = r.replace(...args);
      if (out !== args[0]) total++;
      return out;
    });
  }
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ ${path.relative(process.cwd(), file)}  (${total} fixes)`);
  }
}

(function main() {
  if (!fs.existsSync(FRONTEND_DIR)) {
    console.log("No src/ folder found. Skipping.");
    return;
  }
  const files = globSync("**/*.{ts,tsx,js,jsx}", {
    cwd: FRONTEND_DIR,
    ignore: ["**/node_modules/**","**/dist/**","**/build/**","**/__mocks__/**","**/*.test.*","**/*.spec.*"]
  }).map(f => path.join(FRONTEND_DIR, f));

  for (const f of files) fixFile(f);
  console.log("Frontend import fixes complete.");
})();