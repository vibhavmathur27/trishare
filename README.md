# Tri-Read — hosted version

Same dashboard as the local version (Compare / Emails / Calls / Applications),
but deployed on Vercel like Stackr — one URL, always on, no re-downloading
or running anything locally.

## What changed from the local version

- Data now lives in **Neon Postgres** instead of local JSON files.
- Resume files upload to **Vercel Blob** instead of local disk.
- The whole site sits behind a **single shared password** (you'll set this).
- Your AI provider keys live in **Vercel's encrypted environment variables**
  instead of a local `.env` file.

Nothing about how you *use* it changes — same four tabs, same behavior.

## 1. Create a new Neon project

1. Go to neon.tech and create a **new project** (separate from your Stackr
   project, as you asked).
2. Once it's created, open the **SQL Editor** for this project.
3. Paste in the contents of `prisma/init.sql` (included in this project) and
   run it. This creates the four tables the app needs — don't use
   `prisma migrate`, same rule as Stackr.
4. Go to the project's **Connection Details** and copy two connection
   strings: the **pooled** one (for `DATABASE_URL`) and the **direct** one
   (for `DIRECT_URL`). Both are needed — Prisma uses the direct one only for
   introspection/schema tasks.

## 2. Push this project to GitHub

```bash
cd trishare
git init
git add .
git commit -m "Initial commit"
```
Create a new repo on GitHub, then:
```bash
git remote add origin https://github.com/<your-username>/trishare.git
git branch -M main
git push -u origin main
```

## 3. Create the Vercel project

1. Go to vercel.com → **Add New → Project** → import the `trishare` repo
   you just pushed.
2. Before deploying, open **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | pooled Neon connection string |
   | `DIRECT_URL` | direct Neon connection string |
   | `SITE_PASSWORD` | a password you choose — this locks the whole site |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com |
   | `OPENAI_API_KEY` | from platform.openai.com |
   | `GEMINI_API_KEY` | from aistudio.google.com/apikey |

   (`BLOB_READ_WRITE_TOKEN` gets added automatically in the next step.)

3. Click **Deploy**. First deploy will actually fail at the Blob step below —
   that's expected, continue to step 4 and redeploy.

## 4. Add Vercel Blob storage

1. In your new Vercel project, go to **Storage → Create Database → Blob**.
2. Create it and **connect it to this project** — Vercel automatically adds
   `BLOB_READ_WRITE_TOKEN` to your environment variables for you.
3. Go to **Deployments** and **redeploy** (or just push any commit) so the
   new env var takes effect.

## 5. Done

Visit your Vercel URL (e.g. `trishare.vercel.app`). You'll hit the password
screen first — enter the `SITE_PASSWORD` you set, and you're in.

Bookmark it. No more downloading, no more `npm install`/`npm start` — updates
happen automatically whenever you `git push` a change, same as Stackr.

## Notes

- **Free/Hobby plan limits**: each Compare run makes 4 calls total (3 parallel
  provider calls + 1 synthesis), split across separate serverless functions
  so none of them individually risk hitting Vercel's 10-second Hobby timeout.
  If a provider is slow and a request does time out, you'll see an error in
  that provider's card — just retry.
- **Model names**: if a provider renames/retires a model, set `CLAUDE_MODEL`,
  `OPENAI_MODEL`, or `GEMINI_MODEL` as an extra environment variable in
  Vercel to override the default.
- **Backups**: your data lives in Neon now, not a local file. Neon takes its
  own backups, but if you want your own copy periodically, you can export via
  the Neon dashboard or `pg_dump`.
- **Password**: this is a simple shared-password gate, not multi-user auth —
  fine for personal use, but don't treat it as bank-grade security. Don't
  reuse a password you use elsewhere.
