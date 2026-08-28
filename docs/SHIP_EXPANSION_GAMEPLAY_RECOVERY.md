# Ship Expansion Gameplay — Recovery Plan

Branch: `feature/ship-expansion-gameplay`
Base: `develop`

## Status

**Implementation complete and branch CI green.**

Latest gameplay-validation commit: `a13cedd75cb8b352f6f7699c4a5b39bda388cfc0`
Passing GitHub Actions run: `33161638300`

That run passed both:

- full unit / regression / domain coverage suite;
- browser startup and presentation interaction probes.

No merge to `develop` has been performed from this recovery work.

## Agreed rules

- Player ship total physical capacity: 12,000 units.
- General hold: 8,000 units.
- Dedicated transit Food store: 2,000 units.
- Dedicated Fuel tank: 2,000 units.
- Food in the general hold can also be consumed during transit after dedicated Food is exhausted.
- Minimum launch crew: 10 colonists.
- A travelling/arrived ship may be rerouted from its live position when remaining Fuel/Food can support the new route.
- Colony stock reserve is one numeric amount per colony and applies to every resource.
- Zero Food immediately removes workforce. Food starvation does not cause mortality until 30 complete days without Food. Power mortality is unchanged.
- Natural population growth is removed; new colonists must come from explicit transfer/expansion mechanics.
- Corporate Ship colonist MAX SAFE is a convenience based on sustainable Food surplus and may be manually overridden up to hard housing/power/passenger limits.
- Galaxy generation guarantees at least two frontier systems inside Corporate supply range.

## Completed domain work

- [x] Separate player-ship cargo/Food/Fuel capacities and save migration (`EXPANSION_VERSION=2`).
- [x] Minimum 10-colonist launch rule.
- [x] Live-position rerouting with remaining route supply validation.
- [x] Transit Food consumption from dedicated store then general-hold Food.
- [x] Two guaranteed nearby generated frontier systems.
- [x] Stop/start production domain state for extraction, Power and Industry.
- [x] Stopped extraction removed from collection/workforce/power load.
- [x] Stopped Power/Industry removed from operational capacity totals.
- [x] Positive renewable-harvest changes blocked when no free workforce exists.
- [x] 30-day zero-Food mortality grace and zero-Food workforce shutdown.
- [x] Natural population growth removed.
- [x] Colony-wide stock reserve with legacy per-resource reserve migration.
- [x] Corporate Ship category sell-all quote/actions in `TradeService`.
- [x] Food-safe colonist transfer helper calculations while retaining manual override.
- [x] Sole-colony unaffordable contract extension transitions to corporation failure state.
- [x] New-colony founding transfers all remaining general cargo, dedicated Food, dedicated Fuel and passengers from the player ship into the colony transaction.

## Completed UI work

- [x] Corporate Ship Sell All Food / Build / Fuel / Ore controls with values.
- [x] Corporate Ship colonist MAX SAFE control and projected Food surplus.
- [x] Housing / Industry / Power map focus controls added and restricted to matching developed buildings.
- [x] Player ship preparation shows separate general hold, transit Food and Fuel capacities plus route requirements.
- [x] Player ship preparation supports increment/decrement controls for cargo, Fuel, Food and colonists.
- [x] Star Map allows the travelling/arrived player ship to be selected and inspected.
- [x] Star Map supports live-position rerouting through `ExpansionService`.
- [x] Persistent `STAR MAP` footer action added alongside Corporate Ship and menu controls with mobile-fit layout.
- [x] Building details expose Stop Production / Start Production through the canonical production-state service path.
- [x] Renewable harvest UI surfaces workforce-blocked adjustments rather than allowing invalid increases.
- [x] Colony Summary owns the single colony-wide stock-reserve editor; the old per-resource reserve entry point is removed.
- [x] Critical Food/Fuel warning presentation added for <=10 days of supply.
- [x] Full-screen corporation-failed report added for unaffordable final-colony contract failure.
- [x] Corporate Home / frontier logistics and player-ship routing continue through the existing canonical controller chain.
- [x] Temporary parallel `ship-gameplay-extension.js` implementation removed.

## Completed validation

- [x] Architecture ownership guards pass.
- [x] Controller mutation-boundary guards pass.
- [x] CSS ownership / orphan checks pass.
- [x] Save round-trip including player ship and multi-colony state passes.
- [x] Legacy reserve/save migration regression passes.
- [x] Ship capacity / Food / Fuel / minimum-crew regression passes.
- [x] Live rerouting regression passes.
- [x] New-colony manifest transfer regression passes.
- [x] Zero-Food workforce and 30-day starvation grace regression passes.
- [x] Natural-population-growth removal regression passes.
- [x] Corporate trade / reserve / category sell-all regression passes.
- [x] Building filter and production-control ownership regression passes.
- [x] Contract-failure and sole-player-ship-loss paths covered.
- [x] Long simulation soak test passes.
- [x] Browser startup probe passes.
- [x] Presentation interaction / mobile interaction probes pass.
- [x] Full branch CI green before PR/merge.

## Test history

- Initial corrected ship-domain slice passed branch CI on `ec510f46a726761ff731691b4b0171c32bc126b0`.
- During completion, stale assertions for shared ship capacity, per-resource reserves, old Help copy and the pre-Star-Map footer were migrated to the agreed gameplay rules.
- The final ShipExpansion fixture was corrected to address explicit stocked resource lots rather than whichever starter lot happened to appear first in inventory.
- GitHub Actions run `33161638300` on `a13cedd75cb8b352f6f7699c4a5b39bda388cfc0` completed successfully, including browser/presentation probes.

## Recovery / handoff note

If work resumes in another chat/session, start from this file and the head of `feature/ship-expansion-gameplay`. The implementation checklist is complete. The next lifecycle action is review/PR handling against `develop`; do not merge automatically without the requested review/merge decision. Keep gameplay rules in domain services and preserve the current canonical controller chain.
