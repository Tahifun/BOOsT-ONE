// scripts/generate-secrets.js
const crypto = require('crypto');

console.log('\n🔐 Generating secure secrets for CLiP BOOsT\n');
console.log('='.repeat(50)); // FIXED: removed space

const jwtSecret = crypto.randomBytes(48).toString('hex');
const cookieSecret = crypto.randomBytes(48).toString('hex');
const sessionSecret = crypto.randomBytes(48).toString('hex');

console.log('\n# Add these to your backend/.env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`COOKIE_SECRET=${cookieSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);

console.log('\n' + '='.repeat(50));
console.log('\n⚠️  WICHTIG:');
console.log('1. Kopiere diese Secrets in deine .env Datei');
console.log('2. NIEMALS diese .env Datei committen!');
console.log('3. Nutze unterschiedliche Secrets für Prod & Dev');
console.log('\n✅ Secrets erfolgreich generiert!\n');