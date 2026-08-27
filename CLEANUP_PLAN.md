# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved. Update this file at each cohesive checkpoint so work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head/PR/divergence before moving a ref.
2. Preserve unrelated user asset work; connector-authored commits touch only explicit repository paths.
3. Make one cohesive ownership change, update focused tests and the exact architecture-debt map in the same checkpoint.
4. Prefer deletion of proven shadowed presentation over externalizing dead markup. Keep compatibility bridges functional until the owning wrapper chain is removed in Phase 5.
5. Static application markup belongs in `/views`; repeated rows/cards use `<template>`, `DocumentFragment` and bounded replacement.
6. Domain services own game rules/state mutation. UI renders derived values and dispatches commands.
7. Async/delayed views must not write into stale presentation hosts. Preloads must never delay application module evaluation or `DOMContentLoaded` registration.
8. Do not advance to the next checkpoint until Push Test, PR Test, browser interaction/coverage and Pages are green.
9. On failure, inspect exact workflow logs before changing code; do not weaken architecture guards blindly.

## Current repository status

Status captured 2026-08-27 while preparing Phase 4D.8.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `4623e3cc` — Phase 4D.7 UI-enhancement view ownership |
| Current checkpoint | Phase 4D.8 — externalize both `quick-trade-ui.js` large Sell/Buy views |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified large-template debt | 11 |
| Expected after current checkpoint | 9 |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 4–7 remain |

## Green checkpoint history

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` / `7153e30e` — corrected lexical template scanner and exact genuine baseline 50; green.
- `227101c8` — external help/manual ownership; debt 50 → 43; green.
- `3d03bc53` — V55 operation cards; debt 43 → 39. Push `33047421531`, PR `33047425532`, Pages `33047420869`.
- `1c12a122` — all nine technology-presentation findings externalized; debt 39 → 30. Push `33048664562`, PR `33048667800`, Pages `33048664150`.
- `9b8201fe` — land presentation ownership; debt 30 → 24. Push `33050871178`, PR `33050873588`, Pages `33050870040`.
- `01051465` — colony-tech cleanup fully green; debt 24 → 19. Push `33051923546`, PR `33051926517`, Pages `33051922844`.
- `c21c0a29` — resource presentation extraction reached 15 in Node, but browser startup exposed a top-level-await preload regression.
- `c27fc9d1` — fixed resource preload to eager non-blocking and guarded against awaited preload; debt 19 → 15. Push `33053336531`, PR `33053339742`, Pages `33053335423`; browser startup/interactions/coverage green.
- `4623e3cc` — Phase 4D.7 externalized active Current Collection and Game Menu, externalized the still-referenced legacy technology compatibility view, and removed shadowed UI-enhancement help ownership. `ui-enhancements.js` now has zero measured large templates; debt 15 → 11. Push Test `33054163574`, PR Test `33054167037`, browser startup/interactions/coverage and Pages `33054162621` all passed.

## Verified debt after Phase 4D.7

| File | Findings |
|---|---:|
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/quick-trade-ui.js` | 2 |
| `js/ui/survival-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **11** |

## Current Phase 4D.8 — Quick Trade Sell/Buy ownership

`quick-trade-ui.js` has two genuine large templates: the Sell panel and Buy panel. The surrounding quick-trade architecture is already suitable for a focused extraction:

- `views/quick-trade-shell.html` already owns summary/tabs/departure;
- `views/quick-trade-amount.html` already owns quantity controls;
- `views/quick-trade-colonists.html` already owns colonist transfer;
- `sellView()` and `buyView()` are already asynchronous, so no synchronous wrapper chain must change.

### 4D.8 candidate contract

1. Add `views/quick-trade-sell.html`.
   - Preserve Sell heading/copy, total sale value, amount-control host, empty state, Sell All action and paging.
   - Add `data-sell-row-template`; populate sellable rows through cloned fragments rather than `rows.map(...).join("")`.
   - Preserve stock, protected reserve, sellable amount, quote quantity and revenue display.
2. Add `views/quick-trade-buy.html`.
   - Preserve Buy heading/copy, cargo remaining, amount-control host, category selector, reserve-shortfall action and paging.
   - Add category and resource-row templates; populate through `DocumentFragment` and `replaceChildren`.
   - Preserve stock/reserve/shortfall, unit price, quote quantity and cost.
3. Change `views/quick-trade-shell.html` from a `{{TRADE_VIEW}}` HTML string slot to `[data-trade-view-host]`.
4. `quick-trade-ui.js` loads the selected external view, returns a `DocumentFragment`, opens the external shell, then mounts the fragment with bounded `replaceChildren`.
5. Preserve `quickRenderRevision` stale-render protection, all trade-domain commands and every selector used by `bindQuick()`.
6. Remove the old string-building `pager()` helper; configure fixed external pager controls instead.
7. Keep `amountControl()` and colonist view external ownership unchanged.
8. Update stale quality/reserve tests so Sell/Buy headings and `data-buy-reserve` are asserted in the new views, while quote/reserve/domain behaviour remains tested against services/controller.
9. Add `tests/quick-trade-view-ownership.test.js` to lock semantic view paths, shell mount ownership, row/category templates, fragment population, zero large templates and continued quote/reserve behaviour.
10. Exact architecture debt changes 11 → **9** and `js/ui/quick-trade-ui.js` must remain absent thereafter.
11. Require Push Test, PR Test, browser interaction/coverage and Pages green before moving to Phase 4D.9.

### Expected debt after Phase 4D.8

| File | Findings |
|---|---:|
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/survival-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **9** |

## Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules and authoritative game-state mutation.
- Domain modules never import UI modules or render application HTML.
- No application state on `window`; no document-level application event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Static application markup belongs in `/views`.
- Repeated presentation uses external templates + fragments + bounded replacement, not string-built row/card loops.
- Async view loads reject stale hosts; eager preloads never block application startup.
- No version-suffixed production JS/CSS, import maps or internal version-query imports.
- Exact lexical-scanner debt changes only in reviewed extraction checkpoints.
- Preserve mobile/touch interaction behaviour and gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Baseline 50; green checkpoints: 43 → 39 → 30 → 24 → 19 → 15 → 11; current target 9. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed compatibility wrappers. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Next queue after Phase 4D.8 is green

1. Inspect the remaining two-finding families separately and take the cleaner owner first:
   - `survival-ui.js` — 2; known active `colonyLost()` / `gameOver()` presentation plus external manual ownership.
   - `adaptive-building-ui.js` — 2; active dense unified building presentation, likely one shared external adaptive-building shell with repeated card/requirement/mode templates.
2. Single-finding families:
   - `building-details-ui.js`
   - `contract-ui.js`
   - `industry-ui.js`
   - `map-first-ui.js`
   - `resource-development-ui.js`

Phase 4 exits only when genuine large-template debt reaches zero and full Node/browser/Pages gates remain green.

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each public method to one feature owner, remove shadowed compatibility renderers/wrappers (including the V55/UI-enhancement legacy technology path), and decompose presentation orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation while preserving domain/store boundaries.

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, and keep versioned CSS at zero.

## Phase 7 — final validation and merge gate

1. Reconcile the two `develop` commits; effective missing content remains `assets/art/levels/L1.png`–`L10.png`.
2. Run full Node regression/coverage.
3. Run supported mobile/browser viewport matrix.
4. Exercise full multi-colony/interstellar campaign.
5. Run representative save/load round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long-simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only then merge draft PR #39 into `develop`.
