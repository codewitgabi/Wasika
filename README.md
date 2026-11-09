# Postcard from Minna

Upload a selfie, pick a Niger State landmark, and get a shareable postcard of yourself there: a real landmark photo, your cut-out selfie, a stamp and a short English and Hausa caption.

Built for the Cloudinary November Mini-Hack, "Celebrate Where You're From".

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript) and Tailwind CSS v4
- [Cloudinary](https://cloudinary.com): `cloudinary` (server SDK) and `next-cloudinary`
- Postgres on [Neon](https://neon.tech), using [Prisma](https://www.prisma.io) 7 with the Neon driver adapter
- pnpm

## Getting started

Requirements: Node.js 20.19 or newer (Prisma 7's minimum), and pnpm.

```bash
pnpm install                 # also generates the Prisma client
cp .env.example .env.local   # then fill in the values
pnpm db:migrate              # apply migrations to your database
pnpm dev                     # http://localhost:3000
```

### Environment variables

| Variable | Used by | Value |
|---|---|---|
| `DATABASE_URL` | the app | Neon **pooled** connection string |
| `DATABASE_URL_UNPOOLED` | Prisma migrations | Neon **direct** connection string. Migrations need it because the pooler breaks the locks `prisma migrate` takes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | browser and server | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | browser and server | Cloudinary API key. Public: the upload widget needs it to send signed uploads |
| `CLOUDINARY_API_SECRET` | server only | Cloudinary API secret. Used to sign uploads; never expose it to the browser |

Cloudinary values are under **Console > Settings > API Keys**.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Create and apply a migration after a schema change (development) |
| `pnpm db:deploy` | Apply existing migrations (production) |
| `pnpm db:generate` | Regenerate the Prisma client (also runs on `pnpm install`) |
| `pnpm db:studio` | Browse the database in Prisma Studio |

## Project layout

```
app/                 Next.js routes
lib/db.ts            Shared Prisma client (Neon adapter)
lib/landmarks.ts     The five landmarks and their stories (static config)
prisma/schema.prisma Database schema
prisma/migrations/   Migration history (committed)
prisma.config.ts     Prisma CLI config: env loading and connection URL
generated/prisma/    Generated Prisma client (gitignored)
```
