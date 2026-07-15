This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy `.env.example` to `.env` and fill in the values (see below), then:

```bash
npm install
npm run dev
```

### Database (local Prisma Postgres)

This project uses Prisma with PostgreSQL and Auth.js (NextAuth) for email/password login.

1. Start a local Postgres server (no Docker/account needed):
   ```bash
   npx prisma dev
   ```
   It prints a `DATABASE_URL` and `SHADOW_DATABASE_URL` — copy the **direct `postgres://...`** ones (not the `prisma+postgres://` one) into `.env`.
2. Generate an `AUTH_SECRET`: `openssl rand -base64 33`
3. Apply the schema: `npm run db:push` (uses `prisma db push`; `prisma migrate dev` currently fails against the local `prisma dev` server's shadow-database step)
4. Start the app: `npm run dev`, then visit `/register` to create an account.

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
