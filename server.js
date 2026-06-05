// Entry point for the main Just4You web app (apps/web)
// Uses the standalone Next.js output built by `npm run build`
process.env.PORT = process.env.PORT || 3000;
process.env.HOSTNAME = '0.0.0.0';

require('./apps/web/.next/standalone/server.js');
