# ניהול פרויקטים – משרד אדריכלות

Hebrew (RTL) project dashboard app — React (Vite) + Node/Express + MongoDB.

- Each user registers / logs in and sees only their own projects.
- A project has: שם הפרויקט (multi-select: תכנון / שטחים / בתי חולים), סוג הפרויקט (פנים / חוץ), מטרת הפרויקט, איזו תוכנה, רמת פירוט — all editable.
- A to-do list is generated from the project type + level of detailing (רמת פירוט 1–3, plus level 0 which is always included).
  Changing the level/type updates the list; completed tasks and manually added tasks are kept.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API runs on port 4000.

With no `MONGO_URI` set, the server starts a local MongoDB automatically and keeps the data in `server/.local-db`.
To use a real database (e.g. MongoDB Atlas), copy `server/.env.example` to `server/.env` and fill in `MONGO_URI` and `JWT_SECRET`.

## Deploy to Vercel

1. Create a free MongoDB Atlas cluster (https://www.mongodb.com/cloud/atlas). Under *Network Access* allow `0.0.0.0/0`
   (Vercel has no fixed IP), create a database user, and copy the connection string.
2. Import this GitHub repo in Vercel (https://vercel.com/new). The settings come from `vercel.json` - leave them as is.
3. In the Vercel project add these *Environment Variables*:
   - `MONGO_URI` - the Atlas connection string (add the database name, e.g. `...mongodb.net/archi-dashboard?retryWrites=true&w=majority`)
   - `JWT_SECRET` - a long random string
4. Deploy. To use your own domain: Vercel project → *Settings → Domains*.

On Vercel the React app is served as static files and the API runs as a serverless function (`api/index.js`).

## Self-hosting (any Node server)

```bash
npm run build
npm start
```

The server serves the built React app and the API from one port (`PORT`, default 4000). `MONGO_URI` and `JWT_SECRET` are required.

## Customising the task lists

Default tasks per type, project name and level are in [server/src/taskTemplates.js](server/src/taskTemplates.js) — edit them to match the office's workflow.
Keep each task's position within its list stable, since existing projects match template tasks by position.
