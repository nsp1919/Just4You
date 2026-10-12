This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Scroll-driven celebration templates

Galaxy, Floral, Neon, Minimal, Retro, Magical, and Wedding Invitation use
pinned scenes. Native scrolling drives photo perspective, gift unboxing, text
reveals, and envelope opening; scrolling backward reverses these effects.
Hero sections are intentionally static and visible immediately, including the
wedding hero (the scroll-opening doors are currently disabled). Memory galleries
use one pinned stack: each photo slides up over the previous photo while the
caption changes in the same position. Reduced-motion galleries show a normal list.
The existing celebration `message` supplies the letter, including weddings.
No saved celebrations need a data migration.

The shared primitives live in
[`ScrollScenes.tsx`](../../packages/shared/src/components/ScrollScenes.tsx).
Keep scene ancestors free of `overflow: hidden/auto` (except the actual scroll
container), because that breaks sticky positioning. Content taller than the
viewport gets additional scroll distance and moves through the pinned stage.
Reduced-motion users get readable, unpinned content.

The creator's modal preview supplies its own scroll container through
`ScrollContainerProvider`. Keep this provider when adding other nested previews.
Music, sharing, proposal responses, wedding ceremony interactions, and RSVP
remain explicit user actions; they are not submitted or played by scrolling.

From the monorepo root:

```bash
npx playwright install chromium
npm run test:scroll
```

The tests exercise both applications, all six celebration themes, weddings,
reversibility, reduced motion, mobile layouts, long letters, empty galleries,
and modal scrolling. The runner temporarily creates a local preview fixture
route and removes it afterward; do not deploy while a test run is in progress.
Run with development servers on ports 3000/3001, or with those ports free so
Playwright can start them. Do not reuse a `next start` server for the main app:
the temporary preview fixture requires the development server.
Tests use demo data and do not submit RSVP or payment requests.

Template demos run at `http://localhost:3001/demo/galaxy` (substitute the theme
name) and `http://localhost:3001/invite/demo`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
