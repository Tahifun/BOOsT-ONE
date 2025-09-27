// Node 18+
// npm i fast-glob
import {promises as fs} from "fs";
import fg from "fast-glob";

const GLOBS = ["**/*.{ts,tsx,js,jsx,css,html,md,svg,txt,json,yml,yaml}"];
const MARKER = /Ã|Â|â€”|â€“|â€œ|â€\?|â€˜|â€™|â€¦|ð|âš¡/;

function latin1toUtf8(s){ return Buffer.from(s, "latin1").toString("utf8"); }

const files = await fg(GLOBS, {ignore:["**/node_modules/**","**/dist/**",".git/**"]});
let changed = 0;
for (const f of files) {
  const buf = await fs.readFile(f);
  let text = buf.toString("utf8");
  if (!MARKER.test(text)) continue;
  const fixed = latin1toUtf8(text);
  if (fixed !== text) {
    await fs.writeFile(f, fixed, "utf8");
    changed++;
  }
}
console.log("changed files:", changed);
