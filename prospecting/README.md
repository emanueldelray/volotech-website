# Prospect research

Internal tooling for finding which CRM prospects need external CNC / sheet-metal capacity right now, and which of them pay reliably. Not part of the website build (Vite does not pick up this folder).

**No prospect data lives in this repo.** Research results contain names and contact details of real people, so they are stored only in the private dashboard's database:

- Dashboard: https://claude.ai/artifact/VKwPFiqxihn9PMXXpHTxmr (private, owner only)
- Source list: `Volotech_CRM.xlsx` in Google Drive (Pipeline sheet, newest copy)

## Files

- `research-brief.md`: the instructions each research agent follows (what to look for, how to rate fit, timing and payment risk, the JSON output shape).
- `dashboard.html`: source of the dashboard artifact. It reads three collections from the artifact database:
  - `prospects/<id>`: one research result per company (`id` = `p` + CRM row number, e.g. `p05`)
  - `status/<id>`: your status and notes per company, written from the dashboard
  - `runs/<batch>`: one entry per research batch

## Running a batch

Ask Claude in a Claude Code session: "Run the next prospect research batch: CRM rows 11–20". Claude then:

1. Reads the CRM rows from Google Drive and skips rows marked as not qualified or already researched.
2. Runs one research agent per company with `research-brief.md`.
3. Writes each result to `prospects/<id>` and a `runs/<batch>` entry. Status and notes you set in the dashboard are never overwritten.

Research quality depends on the cloud environment's network access: with the default limited policy, agents can only see search snippets, not company websites, Northdata or the Bundesanzeiger.

## Priority scale

- **A**: contact now, there is a fit and a current reason
- **B**: good fit, no current trigger; nurture and follow up
- **C**: weak fit (own CNC, wrong part spectrum); only a narrow angle
- **X**: do not contact (insolvent, closed, competitor)
