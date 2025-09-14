// scripts/mintDevToken.mjs
import "dotenv/config";
import jwt from "jsonwebtoken";

const argv = new Map(process.argv.slice(2).map(a => {
  const [k, v] = a.split("=");
  return [k.replace(/^--/, ""), v ?? true];
}));

const email = argv.get("email") || "app.master.vip@gmail.com";
const role = argv.get("role") || "ADMIN";      // fÃ¼r Superuser-Override
const sub  = argv.get("sub")  || "dev-user-1"; // deine User-ID (string)
const exp  = argv.get("exp")  || "2h";         // Ablaufzeit

const secret   = process.env.JWT_SECRET;
const issuer   = process.env.JWT_ISSUER || "appmastervip";
const audience = process.env.JWT_AUDIENCE || "appmastervip-clients";

if (!secret) {
  console.error("Fehlendes JWT_SECRET in .env");
  process.exit(1);
}

const payload = { sub, email, role };
const token = jwt.sign(payload, secret, { issuer, audience, expiresIn: exp });

console.log(token);


