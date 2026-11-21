# Blackjack Trainer

Four browser apps for learning blackjack: basic strategy first, then Hi-Lo card counting, then playing it all at a real-feeling table. Each app is a single self-contained HTML file with no build step.

| App | File | What it is |
|---|---|---|
| **Blackjack Table Simulator** | `apps/table-simulator/index.html` | Live-casino style table: real 8-deck shoe with a cut card, two other players, training and exam modes, coach, bet check, count checks, hand history, and a "you vs the rule" replay for every hand you play off the chart. |
| **Fast Blackjack** | `apps/fast-blackjack/index.html` | Stake-style original: infinite deck, provably fair (HMAC-SHA256 seeds), side bets, autobet, live stats. |
| **Basic strategy test** (Turkish) | `apps/strategy-test/index.html` | Question-and-answer drill on the Blackjack Apprenticeship chart, the 30 phrases, and a heat map of weak spots. |
| **Hi-Lo trainer** (Turkish) | `apps/hilo-trainer/index.html` | Card values, running count, deck countdown (25 s target), true count, Illustrious 18 + Fab 4 deviations, bet spread. |

Open any file straight in a browser to play. The published versions also run as Claude artifacts, where progress syncs to the signed-in account:
[Table Simulator](https://claude.ai/artifact/ETh4jv1MLrbsj7JMeusPP6) ·
[Fast Blackjack](https://claude.ai/artifact/KLfGTarZvwdqjt4M7cqStx) ·
[Strategy test](https://claude.ai/artifact/L6E1KWosCZtRE7SNTECLZ6) ·
[Hi-Lo trainer](https://claude.ai/artifact/VLFit8wmMasgiSFozyb8Aw)

## Table rules (Table Simulator)

- 8 decks (6 optional), dealer stands on soft 17 (H17 optional), blackjack pays 3:2.
- The dealer peeks only with an ace up, after offering insurance. With a ten up there is no peek: a dealer blackjack shows at the end and takes only the original bet.
- Double on any two cards, double after split, split up to 4 hands, one card to split aces, late surrender (optional).
- The shoe is shuffled once (crypto-random Fisher–Yates) and played to a cut card in the middle (45–55% left) or deep (20–25% left). Shoes alternate blue and red backs.
- Player 1 bets reverse martingale (€10, double after a win, back to €10 after a loss); Player 2 bets flat €10. Both play basic strategy.

## "You vs the rule"

When you play against the chart, the hand is replayed from that moment as if you had followed it, in **real card order**: your hand follows the chart, and every card you would not have taken goes on to the next player and the dealer, who play the rest of the round from the same shoe. Only your result is recorded. The difference in profit is the effect of breaking the rule; it shows after the hand, in the top bar ("Rule breaking"), and in the hand history.

## Tests

```bash
npm install
npm test             # every simulation, 300 hands each
npm run test:quick   # 60 hands each
HANDS=2000 npm test  # deeper run
npm test -- history  # only files whose path contains "history"
CHROME=/path/to/chrome npm run screens   # screenshots in tests/visual/out
```

The simulations load each app in jsdom, play through its own UI and check the numbers: money adds up on every hand, the rule replay reproduces real results exactly, the reverse martingale follows its rule, the history matches the stats, both games agree on basic strategy for every hand, and Fast Blackjack's provably-fair cards match Node's crypto.
