# RBE 2v2 · Fall 2026

Public tournament site: https://rbe2v2fall2026.ikefox21.chatgpt.site

BYU Royal Blue Esports tournament app with league standings, a nine-week schedule, individual player profiles, match recordings, a connected single-elimination bracket, and owner-only administration.

## Share on Discord

Post https://rbe2v2fall2026.ikefox21.chatgpt.site in your Discord channel and pin the message. Anyone with the link can view the tournament and player profiles without signing in. Admin editing stays password protected.

## Development

Use Node 22.13 or later. Install dependencies using the Sites dependency helper or `npm run install:ci`, then run `npm run dev`. The portable preview runs at `http://127.0.0.1:5173`.

The application stores tournament updates in the Cloudflare D1 `DB` binding. A server-verified password session restricts admin editing; the password hash and session key are configured as Sites secrets. See [OPERATIONS.md](OPERATIONS.md) for local database setup, authentication, data sources, and publication details. Never commit `.dev.vars` or credentials.

## Verification

- `npm run typecheck`
- `npm test`
- `python3 scripts/test-local-api.py` against the local preview with the test-only owner configured.

The checks verify 28 unique pairings, seven opponents per active team, score calculations, withdrawal exclusion, player mappings, custom seeding, bracket progression, and persistent admin editing.

## Upcoming matchup estimates

Estimates use saved player ranks (70%), series record (20%), and game record (10%). Rank points run from Bronze I = 1 through SSL = 22; a duo uses its two-player average. The rank share is `1 / (1 + 10 ** ((opponentAverage - ownAverage) / 6))`. Unknown ranks give a neutral rank share.

For series and games separately, the adjusted win rate is `(wins + 1) / (wins + losses + 2)`. A team's share is its adjusted rate divided by the sum of both teams' adjusted rates. The final estimate is `100 * (0.7 * rankShare + 0.2 * seriesShare + 0.1 * gameShare)`, limited to 1–99% and rounded only at the end to two decimals. Both sides sum to 100%. The schedule includes a brief calculation description. Saved admin edits recalculate them; completed matches show scores instead. These estimates do not change standings or seeds.

Example with Mommy Mag 3–0 / 9–2 and SSL 3–0 / 9–4: both average 21 rank points, both adjusted series rates are 4/5, and their adjusted game rates are 10/13 and 10/15. Mommy Mag receives `35 + 10 + 5.357142… = 50.357142…%`, displayed as **50.36%** versus **49.64%**. This example changes when the saved inputs change.

## Source and hosting

GitHub: https://github.com/ikefoxy/RBE2v2

Sites hosting identity is retained in `.openai/hosting.json`. Publish through the Sites workflow and push each completed fix to GitHub. The same source commit should back both destinations.
