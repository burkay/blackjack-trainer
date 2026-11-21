# Notes for Claude

Burkay is learning blackjack (basic strategy → Hi-Lo counting → table play). He writes in Turkish and prefers short, direct answers. The apps' UI text is English except the two drills (strategy test, Hi-Lo trainer), which are Turkish.

## Layout

- `apps/<name>/index.html` — one self-contained file per app: markup, CSS and JS inline, no build, no dependencies except Google Fonts.
- `tests/` — jsdom simulations (`npm test`), Chrome screenshots (`npm run screens`).

Keep each app a single file. After changing an app, run `npm test` (or `npm run test:quick`) and look at screenshots for layout changes.

## Publishing as Claude artifacts

- Slugs, URLs and the `db`/`user` declaration live in `CLAUDE.local.md` (gitignored). Never commit artifact URLs or slugs: the repo is public.
- Links between apps are relative (`../<app>/index.html`) so they work on GitHub Pages and from disk.

## GitHub Pages

- Repo is public; Pages deploys `main` / root automatically on every push.
- Apps: `https://burkay.github.io/blackjack-trainer/apps/<name>/`. No `window.claude` there, so progress stays in localStorage only (the code already guards for it).
- Commits use the GitHub noreply email; GitHub blocks pushes that expose the real one.

## Table Simulator internals worth knowing

- Storage key `bj-masa-v1`. `S` is saved state, `G` is in-memory game state.
- `S.bots` is the **number** of other players (0–2). Their stats live in `S.botst` (`{0:{net,hands}, 2:{net,hands,bet,run}}`); seat 2 is "Player 1" (reverse martingale), seat 0 is "Player 2". Play order is seat 2 → you (seat 1) → seat 0.
- Strategy: `decide()` between `/*LOGIC*/` and `/*END*/`; S17 tweaks and the Illustrious 18 + Fab 4 deviations live there. Fast Blackjack has its own copy; `tests/strategy-parity.test.js` keeps them in sync.
- "You vs the rule": `cfSnap()` snapshots the round at the first off-chart move, `cfRun()` replays it in real card order (other players and the dealer replay too), `seatNet()` settles your seat. Burkay chose real card order explicitly — do not switch to a fixed dealer hand.
- Hand history: `S.hlog`, newest first, capped at 1000. Rule-breaking totals: `S.cf`. Per-hand text: `cfText()`.
- Deck colour alternates blue/red on every `newShoe()` (`G.deckCol`, `:root[data-deck]`).
- Phone layout lives at the end of the CSS: `max-width:600px` (portrait: rail height from `100svh`, one-line coach strip `#coachP` above the controls, tap to expand; messages with buttons never collapse) and `orientation:landscape and max-height:520px` (table left, dock right, dock scrolls). Safe areas via `env(safe-area-inset-*)`; keyboard hints use `.kh`/`kbd`, hidden on `pointer:coarse`.
- Check phone sizes with puppeteer at 430×739 (Pro Max Safari), 390×664, 932×380 and 844×330 landscape.
- Card faces and the card back are drawn in SVG here (classic casino look). Do not copy real brand designs (Bicycle Rider Back, Bee, etc.).

## Open ideas Burkay has seen

Expected-value cost of each off-chart move next to the actual result; a "you vs the chart" bankroll chart; a weak-spot heat map from the history; decision timing; selectable strategies for the other players; session summaries; a shortcut overlay (`?`); colour-blind friendly result marks; rule-set presets.
