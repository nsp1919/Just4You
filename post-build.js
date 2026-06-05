const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(src, dest, { recursive: true });
      console.log(`✅ Copied ${src} → ${dest}`);
    } else {
      console.log(`⚠️  Source ${src} does not exist, skipping.`);
    }
  } catch (err) {
    console.error(`❌ Error copying ${src} to ${dest}:`, err);
  }
}

// --- apps/web standalone setup ---
const webStandalone = path.join(__dirname, 'apps/web/.next/standalone');

copyDir(
  path.join(__dirname, 'apps/web/public'),
  path.join(webStandalone, 'apps/web/public')
);
copyDir(
  path.join(__dirname, 'apps/web/.next/static'),
  path.join(webStandalone, 'apps/web/.next/static')
);

// --- apps/birthday standalone setup ---
const birthdayStandalone = path.join(__dirname, 'apps/birthday/.next/standalone');

copyDir(
  path.join(__dirname, 'apps/birthday/public'),
  path.join(birthdayStandalone, 'apps/birthday/public')
);
copyDir(
  path.join(__dirname, 'apps/birthday/.next/static'),
  path.join(birthdayStandalone, 'apps/birthday/.next/static')
);

// Log the standalone server entry points for debugging
const webServer = path.join(webStandalone, 'server.js');
const birthdayServer = path.join(birthdayStandalone, 'server.js');

console.log('\n📦 Standalone build summary:');
console.log(`  Web app server:     ${webServer} — ${fs.existsSync(webServer) ? '✅ exists' : '❌ MISSING'}`);
console.log(`  Birthday server:    ${birthdayServer} — ${fs.existsSync(birthdayServer) ? '✅ exists' : '❌ MISSING'}`);
