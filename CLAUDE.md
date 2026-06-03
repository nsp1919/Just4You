# BirthdayGlow — Development & CLI Reference

This guide outlines standard development workflows, commands, and code-style policies for the **BirthdayGlow** monorepo.

---

## 🚀 Core CLI Commands

### 1. Local Development
Start the Turborepo development servers (Main app on port `3000`, templates app on port `3001`):
```bash
npm run dev
```

### 2. Production Build
Compile and optimize both Next.js applications and the shared package:
```bash
npm run build
```

### 3. Linting
Verify static analysis and type checks across all packages:
```bash
npm run lint
```

---

## 📂 Project Architecture

```
birthdayglow/
├── apps/
│   ├── web/          ← Next.js 15 (App Router) — main platform (dashboard, checkout, admin)
│   └── birthday/     ← Next.js 16 (App Router) — dynamic birthday templates
├── packages/
│   └── shared/       ← shared configurations, presets, types, and constants
└── package.json      ← monorepo root settings
```

---

## 🎨 Code Style & Technical Policies

### 1. TypeScript & Types
* Always specify explicit type annotations where possible.
* Avoid blocking compile steps on minor formatting warnings; rules for unescaped characters or unused variables are bypassed during static compilation but should be kept tidy.
* Defer Firebase Admin initialization to lazy proxies/getters (`apps/web/lib/firebase-admin.ts`) to prevent server-side Project ID issues during prerendering.

### 2. React Components & SSR Safety
* Components accessing browser-specific Web Storage APIs (`localStorage`/`sessionStorage`) must be declared with `"use client"` and wrapped inside `useEffect` mounts.
* Server-side `localStorage` and `sessionStorage` fallback mocks are configured inside `lib/firebase.ts` to support rendering on Node.js v22/v25.

### 3. Direct Image Uploads
* Ensure direct uploads use Cloudinary's unsigned upload preset `birthdayglow_unsigned` to allow secure uploads directly from client browsers without exposing API keys.
