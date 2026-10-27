# Royal Blue Esports 2v2

Public site: https://rbe2v2fall2026.ikefox21.chatgpt.site

Sites identity is retained in `.openai/hosting.json`. Tournament state persists in the Cloudflare D1 `DB` binding. Viewer pages and all player profiles are public. Admin writes require the password session, checked on the server for every update.

## Admin authentication

Sites stores `ADMIN_PASSWORD_HASH`, `ADMIN_PASSWORD_SALT`, and `ADMIN_SESSION_SECRET` as runtime secrets. Passwords use PBKDF2-SHA256 with 100,000 iterations and a random salt. The password itself is never stored or sent to the client. Login issues a signed, 12-hour HttpOnly, SameSite=Strict cookie (Secure in production). Origin checks and a persistent eight-attempt/ten-minute rate limit protect login; writes also require a current tournament revision. Sign out removes the browser session. Rotate the session secret to invalidate all existing sessions. Email verification is no longer used.

Never commit credentials or `.dev.vars`. Configure new production secrets through Sites, then deploy a saved version to apply them.

## Local development and verification

Use Node 22.13 or newer. Install through the Sites dependency helper or `npm run install:ci`, then `npm run dev`. The preview is `http://127.0.0.1:5173`. Apply both SQL migrations in `drizzle/` in order using local Wrangler and `dist/server/wrangler.json` after the first build. Do not reapply a migration to an initialized database.

For API tests, configure the ignored `.dev.vars` with a freshly generated PBKDF2 hash/salt for the disposable password `local-test-password` and a random local session secret. This password is only a local test fixture. Restart the preview after configuration changes. Remove `.dev.vars` before production builds.

Run `npm run typecheck`, `npm test`, and `python3 scripts/test-local-api.py`. API checks are hardcoded to loopback, restore edited scores/seeds/ranks, remove their disposable recording, and exercise login, logout, authorization, rate limits, concurrency, persistence, and recording synchronization. They intentionally finish by rate-limiting the local test client for ten minutes; clear the local `admin_login_attempts` table when continuing manual testing.

## Tournament model

- Eight active teams, seven different opponents each, 28 league series. Defying Gravity withdrawals live separately, look like normal schedule cards labeled Default, and never affect wins, games, forecasts, or seeds. All supplied broadcasts remain available.
- Match dates use Round Schedule, including the supplied Week 6–9 correction screenshot. All active fixtures have dates. A withdrawn fixture without a source date displays Date TBA rather than an invented date.
- Scores use RBE League Play. Light Work vs The Moldy Potatoes uses its 3–0 league result despite the reversed Round Schedule score; Week 5 Light Work vs Pink Goats is 0–3 despite blank schedule scores. The source conflict is retained in data for provenance.
- Standings use series differential, then game differential. Alphabetical order resolves remaining ties provisionally; the organizer can set final seeding.
- Upcoming win estimates weight player ranks at 70%, series records at 20%, and game records at 10%. Completed fixtures display the result instead. Up next uses the earliest uncompleted fixture in the current Monday–Sunday tournament week in Mountain Time. It never falls back to an older unfinished week. If the current week is complete, Overview says so. Schedule and admin Results default to the current week.
- The 16 original YouTube links and timestamps are preserved as 17 matchup entries. The shared Week 1 broadcast has separate SSL/Hex Girls and Mommy Mag/Cliip That titles. New recordings link to a selected fixture, both teams, and all four stable player IDs. Watch, schedule links, team profiles, and player profiles derive from this shared data.
- Playoffs are single elimination: four BO3 quarterfinals (1–8, 4–5, 2–7, 3–6), two BO5 semifinals, one BO5 final. Winners advance automatically. Seeds follow standings until locked by the organizer or first playoff result. Seed dropdowns swap positions to preserve eight unique teams. Changing a winner clears affected downstream scores. Resetting playoffs clears scores and restores live seeding.
- Content version 3 upgrades saved data without replacing league scores or valid admin dates. Obsolete lower/reset results and changed-format results are retained as legacy playoff data. Roster IDs remain stable across display-name edits.
- All 16 players have organizer-supplied ranks. SSL is white/purple; Grand Plat is cyan. Public player entry points display rank badges and the supplied Rocket League icon. Individual goals/assists/saves/shots were not supplied and are not fabricated.
- Public pages poll every 15 seconds and refresh on focus. Monotonic revisions prevent older network responses from overwriting newly saved state.
- Overview features Defying Gravity's organizer acknowledgment at the top right. League format, LAN details, schedule/result notes, promotional slogans, and workbook archive UI are excluded. Workbook data stays in `data/` for provenance. The hidden legacy Schedule tab is not the current-season schedule.
- Team logos preserve alpha. SVG display bounds trim empty space. Images 10–17 are excluded from public assets. Rank assets and the Rocket League icon have transparent backgrounds.

## Publishing

Use the Sites source helper to build, push, and package the exact source commit. Save and deploy to the existing public Site. Push the same source commit to `github/main` at https://github.com/ikefoxy/RBE2v2 without force-pushing. Include the live URL after each completed fix. Never publish local database state or secrets.

## Refresh verification

The refresh button makes a new uncached API request and updates the same state used by every view. It shows progress, a Mountain Time confirmation, and an actionable error if the request fails or times out. Automatic polling cannot overlap an active request; a manual refresh supersedes an earlier request. Revision checks still prevent stale reads from undoing an admin save. Refresh reads the latest saved tournament data; it does not import a spreadsheet or infer YouTube scores.

For browser regression checks, change a disposable local match result in D1, click Refresh results, and confirm the series total, standings, and Up next change together. Restore the original local result afterward. Stop the local preview, click refresh, and confirm there is an error with Retry and no success confirmation. Restart and retry to verify recovery. Never alter production scores for this check.

## Player rank configuration

`lib/ranks.ts` defines the supported rank keys, display labels, asset paths, admin options and validation. Platinum II (`Plat 2`) uses `public/assets/ranks/plat2.png`; Platinum III (`Plat 3`) uses `public/assets/ranks/plat3.png`. `data/tournament.json` maps skeak_ (`mp-0`) to Plat 2 and zyber210 (`mp-1`) to Plat 3. Content version 4 applies those two corrections to older saved state while preserving scores, rosters, recordings and seeds; subsequent admin edits remain editable. Shared RankIcon/RankBadge components update Teams, Players, team dialogs, player dialogs and duo-partner links together.

Content version 5 corrects Light Work player `lw-1` to **Intrinsic** and removes misspelled aliases from public display. Stable player IDs preserve duo links, recordings and match statistics.

Content version 6 applies the rank corrections: Hexaract (`hg-0`) is Champion 2, Slayer13 (`hg-1`) is GC1, and Intrinsic (`lw-1`) is Champion 1. Shared rank configuration includes both Champion levels for public badges, admin selectors and API validation. The one-time correction preserves scores, dates, names, seeds, recordings and subsequent admin edits.

## Matchup estimates and replay discovery

`lib/ranks.ts` assigns ordinal points from Bronze I (1) through Supersonic Legend (22). `teamRankPoints` averages the duo's two supplied top ranks; if either rank is absent, Unranked or the legacy Grand Plat, the matchup rank component is neutral. The rank-only chance uses `1 / (1 + 10 ** ((opponentPoints - ownPoints) / 6))`: a six-step average-rank gap is 10:1. `forecastWeights` blends that with normalized, Laplace-smoothed series (20%) and game (10%) rates. Displayed opponents sum to 100%, and rank edits recalculate forecasts without changing standings or playoff seeding. These custom estimates are not empirically calibrated; completed fixtures show actual scores.

Admin supports the complete rank ladder. Existing supplied badges are preserved. Ranks without supplied artwork use the Rocket League icon and their actual label instead of a fabricated rank badge. No saved player ranks or results are migrated by this change.

Watch search matches replay titles, team names/abbreviations, roster names and player aliases. Search, team and week filters intersect. Results sort by week descending, then known fixture date descending, then addition order for ties/unknown dates. The UI says newest week first; upload dates are not supplied. Added or edited recordings flow through the same search. Retained Defying Gravity broadcasts remain searchable.

## Saved initial results and mobile administration

`lib/tournament-store.ts` supplies both the dynamic home page and the tournament API from the same saved D1 snapshot. The first HTML response includes saved totals and results, so hydration never starts with the workbook seed and then jumps to admin-edited scores. Only an empty database uses the seed. If the saved snapshot cannot be read, the page shows a loading/retry state instead of imported scores. Revision guards still preserve newer admin saves during polling.

Mobile has a fixed Admin button in the top navigation, independent of its horizontal scroll. It opens the same password-protected editor and server API as desktop. Score/date controls, roster/rank inputs, bracket controls and recording forms fit phone widths. No editing access is granted by the visibility of this button.

## Complete weekly season histories

`seasonEntries` derives every team's full nine-week history from saved active fixtures and withdrawal notices. Weeks with neither receive BYE entries. Each team has seven competitive matches, one Defying Gravity default and one BYE. Team profiles, player profiles, Schedule and chronological Weekly Results markers share this model. W/L indicate completed competitive matches, D indicates a withdrawal default, B indicates a BYE and a dash indicates an upcoming match. Default and BYE entries do not affect scores, totals, forecasts or seeds. Unknown default dates remain Date TBA; BYEs carry no invented date.

The user-preferred Seed labels remain on team cards and profiles; manually assigned playoff seed order remains separate. The explanatory ranking footer has been removed from Overview and Standings; ranking calculations remain unchanged.
