# RBE tournament maintenance

- Complete requested changes, run relevant checks, publish to the existing public Site, and push the same completed source to `github` remote `main` (`https://github.com/ikefoxy/RBE2v2.git`). Never force-push. Include the literal website link in every completion response: https://rbe2v2fall2026.ikefox21.chatgpt.site
- Preserve Sites identity in `.openai/hosting.json`, public viewer access, and owner-only server authorization. Use Sites helpers and native publishing tools. Credentials, `.dev.vars`, and local database state must stay untracked.
- Keep exactly eight active teams and 28 unique active-team pairings, seven opponents per team. Defying Gravity notices are separate from competitive results; they contribute no wins, losses, games, forecasts, or seeds. Retain all 16 supplied broadcast URLs and the organizer acknowledgment.
- The shared Week 1 URL has two matchup entries: `Mommy Mag vs Cliip That` for Mommy Mag/Cliip That, and `SONper SONic Legends vs The Hex Girls` for SSL/Hex Girls. Both URLs and timestamps stay identical. New recordings must sync with their selected matchup, teams and players.
- Playoffs are single elimination: four quarterfinals BO3, two semifinals BO5, one final BO5. No lower bracket or reset. Preserve connected rounds, seed swapping, and downstream result invalidation.
- Use plain labels; no promotional slogans or workbook archive page. Do not display league format, LAN details, or schedule/result note sections on Overview. The top-right organizer acknowledgment features Defying Gravity.
- Player IDs are stable team/slot IDs. Schmtty is GC2; Schmtt (formerly 4ldnn/4dln) is GC3. Kylee is displayed as Walnutty (GC1); Andrew H as Intrinsic (Champion 1). Other supplied rank mappings live in tournament data. Do not fabricate unprovided ranks or individual match statistics.
- Team logos preserve source artwork and alpha; SVG display bounds remove empty margins. Do not add images 10–17 to public assets. Rank badges use transparent alpha.

- Hexaract is Champion 2; Slayer13 is GC1. Guzaboo and Whowen are GC1. SSL uses the white/purple badge; Grand Plat uses the cyan badge. Player entry points use the supplied Rocket League logo and show rank icons before opening a profile. Public profiles require no sign-in.
- Owner-created recordings appear in Watch, match links, team profiles and player profiles. Next on deck uses only unscored fixtures in the current Monday–Sunday tournament week in Mountain Time and refreshes after score/date changes; never fall back to an older week. Schedule and admin Results default to that week.

- Admin access uses a server-verified password session, not email verification. Store only salted password hashes and session keys as Sites runtime secrets; never commit a password. Keep public viewing open.

- The top-right header shows the transparent BYU logo and “Created by Zeek.” Keep Owner/Viewer identity labels out of this header; admin access remains in the sidebar.

- At mobile widths, league standings use vertical cards with the full team name/logo above separate score statistics; keep long names clear of scores and preserve roomy spacing. Desktop standings remain a table.

- Refresh results must fetch fresh saved D1 data without caching, show loading and a timestamped confirmation, preserve newer revisions, and provide retry feedback on failure. Do not imply it imports new scores from the workbook or YouTube.

- skeak_ (mp-0) is Plat 2; zyber210 (mp-1) is Plat 3. Rank labels/assets, admin options, and API validation share lib/ranks.ts. New rank assets have alpha transparency; keep all player entry points and duo links consistent.

- Upcoming matchup estimates use 70% rank strength, 20% series record, 10% game record. Rank points follow Bronze I (1) to SSL (22); unknown/Unranked ranks are neutral. Round only the final estimate to two decimals, keep complementary sides totaling 100%, and keep the public calculation description simple; no calculator or per-match calculation panel. Keep actual standings and seed rules independent of this estimate.
- Watch search combines team/player/title terms with team and week filters, and defaults to newest week/date first. Preserve both shared-stream entries and all original links.

- Team-owned numbers (upcoming probabilities, scores, records, seed positions and win rates) share the `TeamNumber` gradient using the current team color. Keep labels and tournament-wide totals neutral; retain two-decimal upcoming estimates and accessible forced-color fallback.

- The Hex Girls use red (`#ff5b5b`) for team accents and numeric gradients; retain their original logo artwork. Saved data upgrades this identity with content version 7.

- Cliip That use deeper logo-matched blue (`#3f79e8`) for team accents and numeric gradients; saved data upgrades this identity with content version 8.

- Standings use equal widths for all statistical columns, compact 11px vertical cell padding, and consistent two-line headers. Full standings switch to two-column cards on tablets and one-column cards on phones; keep labels above values with compact spacing and Weekly Results in a separate footer row.

- Render initial public results from the same saved D1 read as the API, with dynamic rendering. Never show workbook seed values before fetching an existing saved snapshot. On read failure, show loading/retry without resetting results; keep revision guards.
- Mobile Admin access stays fixed in the top navigation, independent of its horizontal scroll, and uses the same authenticated controls/API as desktop. Keep phone form fields touch-sized and within the viewport.

- Team and player Season matchups represent all nine weeks: seven active-team matches, one Defying Gravity default, and one derived BYE per team. Schedule shows explicit BYE cards and existing defaults. Weekly Results uses nine chronological W/L/D/B/upcoming markers. Defaults and BYEs never create scores or affect records, forecasts or seeding; do not invent their dates.
- Omit the standings ranking note and oversized explanatory footer panels. Keep the user-preferred Seed labels on team cards and profiles; manually locked playoff seed order remains separate.
