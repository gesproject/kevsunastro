# Sölbo — Astro / Cloudflare migration

## Getting Started

Use the pinned Node version in `.nvmrc`, install deterministic dependencies, then run the Astro development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) with your browser to see the Astro foundation.

Run `npm run check` and `npm run build` before submitting a migration task.

The public site is Astro-first and must not introduce a public React island without measured, explicit approval. The current Next.js + Supabase + Vercel production path remains untouched until the later cutover checkpoint.
