// Entry point for the birthday wish viewer app (apps/birthday)
// Uses the standalone Next.js output built by `npm run build`
process.env.PORT = process.env.PORT || 3001;
process.env.HOSTNAME = '0.0.0.0';

require('./apps/birthday/.next/standalone/server.js');
