# KNX partner leads

Lead pipeline (electricians around Augsburg, München, Ingolstadt, Ulm) plus an installable
Progressive Web App to work through the list on the phone or desktop.

Collected data (`data/`) and all build outputs (`output/`) are gitignored: they contain owner
names and contact details and this repository is public.

## Pipeline

```
python3 s01_areas.py          # municipalities per region (once)
./loop.sh                     # collection rounds until two rounds add < 2 % new businesses
python3 s07_enrich.py         # KNX status, priority, contact advice, opener
python3 s08_export.py         # CSV, XLSX, PWA, single-file dashboard, claude.ai page
```

`s08_export.py` writes:

| Output | What it is |
| --- | --- |
| `output/pwa/` | the installable app (`index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.json`, `icons/`) plus `leads.json` |
| `output/dashboard.html` | the same app as one file with the data embedded, opens straight from disk |
| `output/knx-partner-leads.html` | the claude.ai page variant |
| `output/electricians.csv`, `.xlsx` | full dataset |

App sources live in `pwa/`. Edit those, then re-run `s08_export.py`.

## Where the app keeps data

- Lead data: `leads.json` next to the app, cached by the service worker and copied into
  IndexedDB, so the app works offline. If the server has no `leads.json`, the app asks for the
  file once ("Load leads file") and keeps it in IndexedDB.
- Status and notes: IndexedDB on each device (database `knx-leads`, store `status`); the app
  asks the browser for persistent storage on the first change. Falls back to localStorage where
  IndexedDB is unavailable. Nothing is sent anywhere.
- Devices do not sync. Move progress with **Backup** (downloads a JSON file) and **Restore**.

## Run locally

```
python3 -m http.server 8080 -d output/pwa
```

Open http://localhost:8080 in Chrome or Edge. `localhost` counts as a secure origin, so the
service worker runs and the app can be installed (install icon in the address bar, or the
**Install app** button).

## Deploy

Installing on Android needs HTTPS. Two ways that keep the lead data private:

1. **Public app, private data (simplest).** Upload `output/pwa/` *without* `leads.json` to any
   static host (Netlify Drop, Cloudflare Pages, GitHub Pages). On each device open the URL,
   install, then tap **Load leads file** and pick `leads.json` once.
2. **Whole folder behind a login.** Deploy all of `output/pwa/` to Cloudflare Pages
   (`npx wrangler pages deploy output/pwa --project-name knx-leads`) and put a Cloudflare
   Access policy (free tier, one-time PIN to your email) in front of the site. New data then
   arrives with each redeploy; the app shows "Update available – reload".

Do not deploy it into the volotech.de site or this public repository.
