# Notes for Claude

Burkay is learning blackjack (basic strategy → Hi-Lo counting → table play). He writes in Turkish and prefers short, direct answers. The apps' UI text is English except the two drills (strategy test, Hi-Lo trainer), which are Turkish.

## Layout

- `apps/<name>/index.html` — one self-contained file per app: markup, CSS and JS inline, no build, no dependencies except Google Fonts.
- `tests/` — jsdom simulations (`npm test`), Chrome screenshots (`npm run screens`).

Keep each app a single file. After changing an app, run `npm test` (or `npm run test:quick`) and look at screenshots for layout changes.

## Publishing as Claude artifacts

Each app is also published as a claude.ai artifact (the version Burkay plays). Slugs:

| App | Slug | URL |
|---|---|---|
| Table Simulator | 6d00d4ca-689d-4731-bbce-8523248e4ac9 | https://claude.ai/artifact/ETh4jv1MLrbsj7JMeusPP6 |
| Fast Blackjack | 948335c8-a05c-402a-89e0-73d609fd9a39 | https://claude.ai/artifact/KLfGTarZvwdqjt4M7cqStx |
| Strategy test | 9a985e49-f747-4c95-8530-e71209927679 | https://claude.ai/artifact/L6E1KWosCZtRE7SNTECLZ6 |
| Hi-Lo trainer | e5701640-b481-4572-9647-434524e4352c | https://claude.ai/artifact/VLFit8wmMasgiSFozyb8Aw |

All four declare `db` + `user` with rules `progress` (read admin, write owner) and `progress/{self}` (read/write interact). Progress lives in localStorage and in the doc `progress/<userId>`; the newer `ts` wins on load. Republishing keeps the declaration.

## Table Simulator internals worth knowing

- Storage key `bj-masa-v1`. `S` is saved state, `G` is in-memory game state.
- `S.bots` is the **number** of other players (0–2). Their stats live in `S.botst` (`{0:{net,hands}, 2:{net,hands,bet,run}}`); seat 2 is "Player 1" (reverse martingale), seat 0 is "Player 2". Play order is seat 2 → you (seat 1) → seat 0.
- Strategy: `decide()` between `/*LOGIC*/` and `/*END*/`; S17 tweaks and the Illustrious 18 + Fab 4 deviations live there. Fast Blackjack has its own copy; `tests/strategy-parity.test.js` keeps them in sync.
- "You vs the rule": `cfSnap()` snapshots the round at the first off-chart move, `cfRun()` replays it in real card order (other players and the dealer replay too), `seatNet()` settles your seat. Burkay chose real card order explicitly — do not switch to a fixed dealer hand.
- Hand history: `S.hlog`, newest first, capped at 1000. Rule-breaking totals: `S.cf`. Per-hand text: `cfText()`.
- Deck colour alternates blue/red on every `newShoe()` (`G.deckCol`, `:root[data-deck]`).
- Card faces and the card back are drawn in SVG here (classic casino look). Do not copy real brand designs (Bicycle Rider Back, Bee, etc.).

## Open ideas Burkay has seen

Expected-value cost of each off-chart move next to the actual result; a "you vs the chart" bankroll chart; a weak-spot heat map from the history; decision timing; selectable strategies for the other players; session summaries; a shortcut overlay (`?`); colour-blind friendly result marks; rule-set presets.
