# Ship Expansion Gameplay — Recovery Plan

Branch: `feature/ship-expansion-gameplay`
Base: `develop`

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
- [x] Positive renewable-harvest changes can be blocked when no free workforce exists.
- [x] 30-day zero-Food mortality grace and zero-Food workforce shutdown.
- [x] Natural population growth removed.
- [x] Colony-wide stock reserve with legacy per-resource reserve migration.
- [x] Corporate Ship category sell-all quote/actions in TradeService.
- [x] Food-safe colonist transfer helper calculations while retaining manual override.
- [x] Sole-colony unaffordable contract extension transitions to corporation failure state.

## Completed UI work

- [x] Corporate Ship Sell All Food / Build / Fuel / Ore controls with values.
- [x] Corporate Ship colonist MAX SAFE control and projected Food surplus.
- [x] Housing / Industry / Power map focus controls added.
- [x] Ship gameplay/failure/warning CSS layer added.

## In progress / next

- [ ] Player ship preparation: dedicated Food/Fuel/general-hold meters and Food loader.
- [ ] Player ship preparation: decrement controls for cargo, Fuel and colonists.
- [ ] Star Map: ship click opens player-ship panel while travelling/arrived.
- [ ] Star Map: destination button while travelling/arrived; reroute through domain service.
- [ ] Footer: persistent Star Map button next to Corporate Ship.
- [ ] Building details: Stop Production / Start Production button.
- [ ] Renewable harvest UI: surface workforce-block reason.
- [ ] Colony Summary: colony-wide stock reserve editor; remove per-resource reserve entry point.
- [ ] Critical Food/Fuel <=10 day popup with red warning treatment.
- [ ] Full-screen colony/corporation failed report for unaffordable sole-colony contract failure.
- [ ] Tighten Housing / Industry / Power focus to show only matching buildings.
- [ ] Regression tests for every gameplay rule and migration above.
- [ ] Browser startup + mobile interaction probes.
- [ ] Full branch CI green before PR/merge.

## Test status

- Corrected initial ship-domain slice passed branch CI on commit `ec510f46a726761ff731691b4b0171c32bc126b0`.
- Current branch CI is expected to fail unit/regression tests until old assertions for shared ship capacity, per-resource reserves and natural population growth are migrated to the agreed rules.

## Recovery note

If work resumes in another chat/session, start from this file and the head of `feature/ship-expansion-gameplay`. Do not rebase onto another gameplay branch without first comparing it with `develop`. Keep gameplay rules in domain services and add regression coverage before considering the feature complete.
