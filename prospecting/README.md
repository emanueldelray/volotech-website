# Prospect research

Internal tooling for finding which CRM prospects need external CNC / sheet-metal capacity right now, and which of them pay reliably. Not part of the website build (Vite does not pick up this folder).

**No prospect data lives in this repo.** Research results contain names and contact details of real people, so they are stored only in the private dashboard's database:

- Dashboard: https://claude.ai/artifact/VKwPFiqxihn9PMXXpHTxmr (private, owner only)
- Source list: `Volotech_CRM.xlsx` in Google Drive (Pipeline sheet, newest copy)

## Files

- `screen-brief.md`: stage 1, a quick screen of many companies (still operating? own CNC? part need?), verdict deep / maybe / drop.
- `research-brief.md`: stage 2, the full research each agent runs on companies that passed the screen (signals, fit, part profile, payment risk, contacts, email draft).
- `fetch.py`: reads a web page as plain text through curl. WebFetch cannot resolve hostnames in the cloud environment, so agents use this via Bash. Copy it to the session scratchpad and point the briefs at it.
- `dashboard.html`: source of the dashboard artifact. It reads three collections from the artifact database:
  - `prospects/<id>`: one research result per company (`id` = `p` + CRM row number, e.g. `p05`)
  - `status/<id>`: your status and notes per company, written from the dashboard
  - `screening/<id>`: stage-1 screen result per company (shown under "Screened, not researched")
  - `runs/<batch>`: one entry per research batch

## Running a batch

Ask Claude in a Claude Code session: "Run the next prospect research batch: CRM rows 11–20". Claude then:

1. Reads the CRM rows from Google Drive and skips rows marked as not qualified or already researched.
2. Stage 1: screens 10–15 companies with `screen-brief.md` (a few agents, each handling several companies) and writes `screening/<id>`.
3. Stage 2: runs one agent per "deep" company with `research-brief.md` and writes `prospects/<id>` plus a `runs/<batch>` entry. Status and notes you set in the dashboard are never overwritten.

Web searches are capped at about 200 per turn across all agents, so a batch reads pages with `fetch.py` wherever it can and keeps searches to a minimum. northdata.de rate-limits (HTTP 429); the Bundesanzeiger shows documents only behind a CAPTCHA.

The cloud environment needs **Full** network access (set in a browser at claude.ai/code, environment settings). With the default Limited policy agents only see search snippets.

## Priority scale

- **A**: contact now, there is a fit and a current reason
- **B**: good fit, no current trigger; nurture and follow up
- **C**: weak fit (own CNC, wrong part spectrum); only a narrow angle
- **X**: do not contact (insolvent, closed, competitor)

## Standalone copy (outside claude.ai)

`build_standalone.py` turns `dashboard.html` plus a read-back of the artifact database into one self-contained HTML file with the research data embedded:

```
python3 prospecting/build_standalone.py <export_dir> volotech-prospect-radar.html
```

`<export_dir>` holds one folder per collection (`prospects/`, `screening/`, `runs/`, `status/`) with `<doc_id>.json` files. Claude produces it with an `ArtifactData` list per collection (`out_dir`). In the standalone file, status and notes are saved in the browser (localStorage); **Export notes / Import notes** moves them between devices.

The file contains names, emails and phone numbers of real people. It is gitignored (`prospect-radar*.html`). Open it locally, or host it only behind a login (e.g. Vercel project with password protection or a basic-auth middleware, Cloudflare Access, a NAS on your network). Never put it in `public/` of the website.
