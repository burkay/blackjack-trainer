# Blackjack Trainer

Four browser apps for learning blackjack: basic strategy first, then Hi-Lo card counting, then playing it all at a real-feeling table. Each app is a single self-contained HTML file with no build step.

| App | File | What it is |
|---|---|---|
| **Blackjack Table Simulator** | `apps/table-simulator/index.html` | Live-casino style table: real 8-deck shoe with a cut card, two other players, training and exam modes, coach, bet check, count checks, hand history, and a "you vs the rule" replay for every hand you play off the chart. |
| **Fast Blackjack** | `apps/fast-blackjack/index.html` | Stake-style original: infinite deck, provably fair (HMAC-SHA256 seeds), side bets, autobet, live stats. |
| **Basic strategy test** (Turkish) | `apps/strategy-test/index.html` | Question-and-answer drill on the Blackjack Apprenticeship chart, the 30 phrases, and a heat map of weak spots. |
| **Hi-Lo trainer** (Turkish) | `apps/hilo-trainer/index.html` | Card values, running count, deck countdown (25 s target), true count, Illustrious 18 + Fab 4 deviations, bet spread. |

Open any file straight in a browser to play, or play online on GitHub Pages:
[Table Simulator](https://burkay.github.io/blackjack-trainer/apps/table-simulator/) ·
[Fast Blackjack](https://burkay.github.io/blackjack-trainer/apps/fast-blackjack/) ·
[Strategy test](https://burkay.github.io/blackjack-trainer/apps/strategy-test/) ·
[Hi-Lo trainer](https://burkay.github.io/blackjack-trainer/apps/hilo-trainer/)

## Table rules (Table Simulator)

Pick a preset in the menu, or change any rule (that makes it Custom):

| | Online live | US casino |
|---|---|---|
| Decks | 8 | 6 |
| Dealer's second card | after the players (no hole card) | face down, checked for blackjack under an ace and a ten |
| Dealer blackjack | takes every bet, doubles and splits included | ends the hand at once: only the first bet |
| Splits | once | up to 4 hands |
| Surrender | no | late |
| Chart | against a ten or an ace: hit 11, do not split 8,8; against an ace do not split A,A; 11 vs 10 doubled only from true count +3 | the standard chart (as in the strategy test) |

Always: blackjack pays 3:2, dealer stands on soft 17 (H17 optional), double on any two cards and after a split, split aces get one card, insurance 2:1 on an ace. Custom also allows a hole card checked under an ace only (a blackjack under a ten then shows at the end and takes every bet).

- Side bets (can be switched off): Perfect Pairs 25:1 perfect, 12:1 coloured, 6:1 mixed; 21+3 100:1 suited trips, 40:1 straight flush, 30:1 three of a kind, 10:1 straight, 5:1 flush. Settled right after the first three cards.
- RTP: the stats show the game's long-run return for the rules in force next to what your bets, the other players' bets and the house have made so far. Side bets: 95.90% Perfect Pairs and 96.30% 21+3 with 8 decks.
- The shoe is shuffled once (crypto-random Fisher–Yates) and played to a cut card in the middle (45–55% left) or deep (20–25% left). Shoes alternate blue and red backs.
- Player 1 bets reverse martingale (€10, double after a win, back to €10 after a loss); Player 2 bets flat €10. Both play basic strategy for the rules in force.

## "You vs the rule"

When you play against the chart, the hand is replayed from that moment as if you had followed it, in **real card order**: your hand follows the chart, and every card you would not have taken goes on to the next player and the dealer, who play the rest of the round from the same shoe. Only your result is recorded. The difference in profit is the effect of breaking the rule; it shows after the hand, in the top bar ("Rule breaking"), and in the hand history.

## Tests

```bash
npm install
npm test                      # every simulation, 300 hands each
npm run test:quick            # 60 hands each
npm test -- --hands=2000      # deeper run
npm test -- history           # only files whose path contains "history"
npm run screens               # screenshots in tests/visual/out (finds Chrome; or set CHROME)
```

The simulations load each app in jsdom, play through its own UI and check the numbers: money adds up on every hand, the rule replay reproduces real results exactly, the reverse martingale follows its rule, the history matches the stats, both games agree on basic strategy for every hand, and Fast Blackjack's provably-fair cards match Node's crypto.
