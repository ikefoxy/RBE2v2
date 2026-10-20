# Royal Blue Esports 2v2

The public tournament is hosted through Sites. `/.openai/hosting.json` retains the Site identity. Server data uses the `DB` Cloudflare D1 binding; the `ADMIN_EMAIL` runtime secret restricts writes to the owner's verified ChatGPT sign-in. Do not commit secrets or `.dev.vars`.

## Local development

Install using the Sites dependency helper, then `npm run dev`. Apply `drizzle/0000_windy_hannibal_king.sql` to the local database as described in the starter README. For local admin tests only, set `ADMIN_EMAIL=seedy@sites.test` in an ignored `.dev.vars`, then use local Sign in with ChatGPT. Remove that file before production builds. Hosted owner configuration lives in Sites environment settings.

Run `npm test` and `npm run typecheck`. The tournament test compiles only tournament logic into a disposable temporary directory and checks imports, corrected standings, video mappings, scoring, forecasts, and bracket propagation. `../tools/test-local-api.py` checks local owner writes and concurrency; it is hardcoded to loopback and restores the original score.

## Tournament model

- Eight teams, seven opponents per team, 28 unique league series.
- All matches involving Defying Gravity are absent from competitive data. Their recordings remain accessible, and their organizing contribution is acknowledged.
- Dates come from Round Schedule, score values from RBE League Play. The one active-team conflict is Light Work vs The Moldy Potatoes: League Play records 3–0; Round Schedule records the reverse. The UI documents this discrepancy. Week 5 Light Work vs Pink Goats is completed 0–3 in League Play despite blank Round Schedule scores.
- Rankings follow the workbook's series differential, then game differential. Alphabetical ordering resolves remaining ties provisionally; an organizer should resolve a true final-seed tie before playoffs.
- Matchup estimates equally blend smoothed series and game win rates, then normalize between opponents. They are historical estimates, not calibrated odds. Completed matches show scores instead.
- All 16 original YouTube URLs retain their supplied timestamps. Week 1 shared broadcast is mapped to SSL, Hex Girls, Mommy Mag, and Cliip That. Week 4 videos retain their original mislabelled Week 3 titles but are grouped under Week 4 as requested.
- The eight-team bracket adapts the workbook's upper/lower structure. It seeds 1–8, 4–5, 2–7, 3–6, with BO3 early rounds and configurable BO5 upper/championship finals. The workbook's BO5 is tentative. A lower-bracket grand-final win activates a reset series.
- Seeds move with league standings until the first playoff result locks them. Reset playoffs and reseed clears all playoff results. Editing an earlier playoff winner invalidates results in affected downstream matches.
- Admin updates use a revision check to prevent overwriting another session's edits. Scores, rosters, video mappings, dates, and recent activity persist in D1. Viewers refresh every 30 seconds.
- All seven original workbook tabs remain readable in the archive and the unchanged original file remains downloadable. The hidden Schedule tab is legacy content, never this season's data. Individual goals/assists/saves/shots were not in the workbook and are not fabricated.
- Only images 1–9 exist in public/assets. Images 10–17 are excluded.

## Publishing

Use the Sites source helper to push source and package the matching build. Deploy the saved version to the existing public Site; preserve its project ID and audience. Never publish `.dev.vars`, local database state, dependency folders, or credentials.
