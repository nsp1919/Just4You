const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(src, dest, { recursive: true });
      console.log(`Successfully copied ${src} to ${dest}`);
    } else {
      console.log(`Source directory ${src} does not exist, skipping.`);
    }
  } catch (err) {
    console.error(`Error copying ${src} to ${dest}:`, err);
  }
}

// Copy apps/web static files
copyDir(
  path.join(__dirname, 'apps/web/public'),
  path.join(__dirname, 'apps/web/.next/standalone/apps/web/public')
);
copyDir(
  path.join(__dirname, 'apps/web/.next/static'),
  path.join(__dirname, 'apps/web/.next/standalone/apps/web/.next/static')
);

// Copy apps/birthday static files
copyDir(
  path.join(__dirname, 'apps/birthday/public'),
  path.join(__dirname, 'apps/birthday/.next/standalone/apps/birthday/public')
);
copyDir(
  path.join(__dirname, 'apps/birthday/.next/static'),
  path.join(__dirname, 'apps/birthday/.next/standalone/apps/birthday/.next/static')
);
