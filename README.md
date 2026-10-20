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

## Source and hosting

GitHub: https://github.com/ikefoxy/RBE2v2

Sites hosting identity is retained in `.openai/hosting.json`. Publish through the Sites workflow and push each completed fix to GitHub. The same source commit should back both destinations.
