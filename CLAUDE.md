# Notes for Claude

Burkay is learning blackjack (basic strategy → Hi-Lo counting → table play). He writes in Turkish and prefers short, direct answers. The apps' UI text is English except the two drills (strategy test, Hi-Lo trainer), which are Turkish.

## Layout

- `apps/<name>/index.html` — one self-contained file per app: markup, CSS and JS inline, no build, no dependencies except Google Fonts.
- `tests/` — jsdom simulations (`npm test`), Chrome screenshots (`npm run screens`).

- Every app ends its CSS with phone blocks: portrait `max-width:600px` and landscape `orientation:landscape and max-height:520px`, plus safe-area padding and home-screen meta tags. Keyboard-only text is marked `.kh` (inline) or `.kb` (hint line) and `kbd`; all hidden on `pointer:coarse`.

Keep each app a single file. After changing an app, run `npm test` (or `npm run test:quick`) and look at screenshots for layout changes.

## Publishing as Claude artifacts

- Slugs, URLs and the `db`/`user` declaration live in `CLAUDE.local.md` (gitignored). Never commit artifact URLs or slugs: the repo is public.
- Links between apps are relative (`../<app>/index.html`) so they work on GitHub Pages and from disk.

## GitHub Pages

- Repo is public; Pages deploys `main` / root automatically on every push.
- Apps: `https://burkay.github.io/blackjack-trainer/apps/<name>/`. No `window.claude` there, so progress stays in localStorage only (the code already guards for it).
- Commits use the GitHub noreply email; GitHub blocks pushes that expose the real one.

## Game data in Supabase

- Each app has a `CLOUD` module at the top of its script: anonymous Supabase sign-in (shared by all four apps through localStorage `bj-cloud-v1`), events queued in `bj-cloud-q-<app>` and posted in batches to `events`. Failures are silent; logging is off on `file://`, localhost and wherever `fetch` is missing (so jsdom tests and screenshots never send anything).
- Only game data: hands, exams, count checks, drill answers. Burkay chose explicitly: the apps send no visitor data (IP, location, device), no nickname, no cross-device sync. Supabase Auth itself still stores the IP and user agent of each sign-in (`auth.sessions`), so do not claim that nothing of the kind is kept.
- Schema and Row Level Security: `supabase/schema.sql` (run by hand in the SQL Editor). Players can read/write only their own rows; the dashboard sees all.
- The client key in the apps is the publishable key (public by design). Never put the secret/service_role key in the repo.
- `tests/cloud.test.js` checks the flow against a fake server.

## Table Simulator internals worth knowing

- Storage key `bj-masa-v1`. `S` is saved state, `G` is in-memory game state.
- `S.bots` is the **number** of other players (0–2). Their stats live in `S.botst` (`{0:{net,hands}, 2:{net,hands,bet,run}}`); seat 2 is "Player 1" (reverse martingale), seat 0 is "Player 2". Play order is seat 2 → you (seat 1) → seat 0.
- House rules (Burkay, 2026-11-22): no hole card (dealer blackjack under a ten or an ace takes **every** bet), double any two cards and after split, split once, split aces one card, dealer stands on all 17s, insurance 2:1 on an ace, blackjack 3:2. Surrender is not in the list: off by default, still in the menu. `S.hr` marks that saved games were switched over.
- `dealerNeeds()` decides whether the dealer draws no card, one card or plays out; `settle()`, `seatNet()` and `cfRun()` must stay in step (`rule-replay.test.js`).
- `decide()` gets `enhc:true` in this game: 11 vs 10 hits (double from TC +3), 10/11 vs A and 10 vs 10 never double, 8,8 vs 10/A and A,A vs A are not split. All computed by expected value; A,A vs 10 still splits. Fast Blackjack peeks, so it has none of this; the strategy test and Hi-Lo trainer still teach the standard chart.
- Strategy: `decide()` between `/*LOGIC*/` and `/*END*/`; S17 tweaks and the Illustrious 18 + Fab 4 deviations live there. Fast Blackjack has its own copy; `tests/strategy-parity.test.js` keeps them in sync.
- "You vs the rule": `cfSnap()` snapshots the round at the first off-chart move, `cfRun()` replays it in real card order (other players and the dealer replay too), `seatNet()` settles your seat. Burkay chose real card order explicitly — do not switch to a fixed dealer hand.
- Side bets: `SIDE` between `/*SIDE*/` and `/*ENDSIDE*/`, bets in `G.sb`/`G.lastSb`, results in `G.sbR`, saved as `rec.s` in the history; option `S.sbo`. They are separate from the hand result (streak, rule replay) but count in the bankroll, session/overall profit and exam net.
- RTP: `RTP` holds the game figures as percent of all money bet (main game simulated with 800M hands per rule set and this chart, side bets exact); rerun the simulation if the rules or the chart change. Your own figures are `S.rt` (`[bet, paid back]` for `m`, `pp`, `t3`), the other players' `S.botst[i].b/.w`, the house's `S.hs` (all bets at the table, same shape as `S.rt`; resets do not touch it; `S.hs0` is what the other players had lost before it existed). Purpose, in Burkay's words: what the real profit and loss of everybody, the house included, would have been. Small RTP text sits in `.rtx` next to the streak, the house in `#house` on the chip rack.
- Wins in a row: `S.str` (you) and `S.botst[i].str`, shown in `.stk` under the name (flame from 2; a push keeps it). Profit: `S.ses` (session, ends after 30 min without a hand) and `S.tot` (overall, seeded from `S.hlog`); both are sums of hand results, so a bankroll reset does not touch them.
- Hand history: `S.hlog`, newest first, capped at 1000. Rule-breaking totals: `S.cf`. Per-hand text: `cfText()`.
- Deck colour alternates blue/red on every `newShoe()` (`G.deckCol`, `:root[data-deck]`).
- Phone layout lives at the end of the CSS. Portrait (`max-width:600px`): bankroll bar, table (`--R`, what is left of `--vh` after the bar, coach and controls), one-line coach strip `#coachP` (tap to expand; messages with buttons never collapse), one slim row of five actions. Burkay wants big cards, small buttons, and the stats out of the way: `placeStats()` moves the stat boxes and the mode switch into `#mstat` under the controls (scroll to see them).
- `setVh()` sets `--vh` from `innerHeight` only at the top of the page: Safari's bars make `svh` about 130px too small, and `dvh` would resize the table while scrolling.
- Landscape (`orientation:landscape and max-height:520px`): table left, dock right, dock scrolls. Safe areas via `env(safe-area-inset-*)`; keyboard hints use `.kh`/`kbd`, hidden on `pointer:coarse`.
- Check phone sizes with puppeteer at 440×862 and 440×728 (Pro Max, Safari bars hidden / shown), 390×664, 375×553, 932×380 and 844×330 landscape.
- Card faces and the card back are drawn in SVG here (classic casino look). Do not copy real brand designs (Bicycle Rider Back, Bee, etc.).

## Open ideas Burkay has seen

Expected-value cost of each off-chart move next to the actual result; a "you vs the chart" bankroll chart; a weak-spot heat map from the history; decision timing; selectable strategies for the other players; session summaries; a shortcut overlay (`?`); colour-blind friendly result marks; rule-set presets.
