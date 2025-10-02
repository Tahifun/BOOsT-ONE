const fs = require("fs");

let globSync;
try { ({ globSync } = require("glob")); if (typeof globSync !== "function") throw 0; }
catch { globSync = require("glob").sync; }

const FIX = {
  "ÃƒÂ¼":"Ã¼","ÃƒÂ¤":"Ã¤","ÃƒÂ¶":"Ã¶","ÃƒÅ¸":"ÃŸ","ÃƒÅ“":"Ãœ","Ãƒâ€ž":"Ã„","Ãƒâ€“":"Ã–",
  "Ã¢â‚¬â„¢":"'","Ã¢â‚¬Ëœ":"'","Ã¢â‚¬Å“":"\"","Ã¢â‚¬\u009D":"\"","Ã¢â‚¬":"\"",
  "Ã¢â‚¬â€œ":"â€“","Ã¢â‚¬â€":"â€”","Ã¢â‚¬Â¦":"â€¦","Ãƒâ€”":"Ã—","ÃƒÂ·":"Ã·",
  "Ã¢Å“â€¦":"âœ…","Ã¢Ëœâ€¦":"â˜…","Ã¢â€”":"â—","Ã¢Å“â€œ":"âœ“","Ã¢Å“â€“":"âœ–",
  "Ã°Å¸Å¡â‚¬":"ðŸš€","Ã°Å¸Å½Â¨":"ðŸŽ¨","Ã°Å¸Â¤â€“":"ðŸ¤–","Ã°Å¸Å½Â®":"ðŸŽ®","Ã°Å¸Å½Âµ":"ðŸŽµ"
};

const apply = s => Object.entries(FIX).reduce((acc,[bad,good]) => acc.includes(bad) ? acc.split(bad).join(good) : acc, s);

const patterns = [
  "src/**/*.{ts,tsx,js,jsx,css,html}",
  "backend/**/*.{ts,js,mjs}",
  "*.{json,md,yml,yaml}"
];

(function main(){
  let files = [];
  for (const p of patterns) files = files.concat(globSync(p, { ignore: ["**/node_modules/**","**/dist/**","**/build/**"] }));
  for (const f of files) {
    const before = fs.readFileSync(f, "utf8");
    const after  = apply(before);
    if (after !== before) {
      fs.writeFileSync(f, after, "utf8");
      console.log("âœ“ fixed:", f);
    }
  }
  console.log("Encoding fixes complete.");
})();
