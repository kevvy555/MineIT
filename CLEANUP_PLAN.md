# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved. Update this file at each cohesive checkpoint so work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head/PR/divergence before moving a ref.
2. Preserve unrelated user asset work; connector-authored commits touch only explicit repository paths.
3. Make one cohesive ownership change, update focused tests and the exact architecture-debt map in the same checkpoint.
4. Prefer deletion of proven shadowed presentation over externalizing dead markup. Keep compatibility bridges functional until Phase 5 removes their wrapper chains.
5. Static application markup belongs in `/views`; repeated rows/cards use `<template>`, `DocumentFragment` and bounded replacement.
6. Domain services own game rules/state mutation. UI renders derived values and dispatches commands.
7. Async/delayed views must reject stale state. Preloads must never delay application module evaluation or `DOMContentLoaded` registration.
8. Do not advance until Push Test, PR Test, browser interaction/coverage and Pages are green.
9. On failure, inspect exact workflow logs before changing code; never weaken guards blindly.

## Current repository status

Status captured 2026-08-27 while correcting Phase 4D.9.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `ef1fcdc5` — Phase 4D.8 Quick Trade Sell/Buy ownership + stale assertion alignment |
| Current branch checkpoint | `09414475` — first Phase 4D.9 survival extraction candidate; Node guard reported 8 templates because Help resource catalogue still contained one genuine large template |
| Current correction | externalize the Help resource catalogue with category/row templates so `survival-ui.js` reaches zero measured large templates |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified pre-4D.9 debt | 9 |
| Expected after corrected 4D.9 | 7 |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 4–7 remain |

## Green checkpoint history

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` / `7153e30e` — corrected lexical template scanner and exact genuine baseline 50; green.
- `227101c8` — external help/manual ownership; debt 50 → 43; green.
- `3d03bc53` — V55 operation cards; debt 43 → 39. Push `33047421531`, PR `33047425532`, Pages `33047420869`.
- `1c12a122` — technology presentation; debt 39 → 30. Push `33048664562`, PR `33048667800`, Pages `33048664150`.
- `9b8201fe` — land presentation; debt 30 → 24. Push `33050871178`, PR `33050873588`, Pages `33050870040`.
- `01051465` — colony-tech cleanup; debt 24 → 19. Push `33051923546`, PR `33051926517`, Pages `33051922844`.
- `c21c0a29` — resource extraction reached 15 in Node, but browser startup exposed top-level-awaited preload delaying `DOMContentLoaded` registration.
- `c27fc9d1` — non-blocking resource preload fix; debt 19 → 15. Push `33053336531`, PR `33053339742`, Pages `33053335423`; browser startup/interactions/coverage green.
- `4623e3cc` — UI-enhancement ownership; debt 15 → 11. Push `33054163574`, PR `33054167037`, Pages `33054162621`; browser green.
- `3cb24872` — Quick Trade Sell/Buy extraction reached 9; Test found one stale source-location assertion.
- `ef1fcdc5` — stale Quick Trade assertion aligned to external view. Phase 4D.8 fully green; debt 11 → 9. Push `33054929802`, PR `33054933882`, Pages `33054929350`; browser green.

## Phase 4D.9 failure/correction record

`09414475` externalized the immediate Colony Lost and Corporation Failed modal markup and preserved the existing detailed dead-colony management view. Push Test `33066818902` stopped in the Node architecture guard before browser execution. Exact scanner output was:

- `adaptive-building-ui.js`: 2
- `building-details-ui.js`: 1
- `contract-ui.js`: 1
- `industry-ui.js`: 1
- `map-first-ui.js`: 1
- `resource-development-ui.js`: 1
- `survival-ui.js`: 1
- total: **8**

The remaining survival finding was the dynamically string-built Help resource catalogue, not the already-externalized terminal modal. Do not weaken the guard to 8. The corrected checkpoint externalizes that catalogue too.

## Corrected Phase 4D.9 contract

- Keep existing `views/colony-lost.html` unchanged. `colony-tech-ui.js` owns it as the detailed dead-colony management panel (death date, final Industry, stocks, abandon action).
- `views/survival-colony-lost.html` owns the immediate colony-death notification from `SurvivalUIMixin.colonyLost()`.
- `views/corporation-failed.html` owns the all-colonies-lost/game-over notification and actions.
- `survival-ui.js` eagerly preloads only terminal views without top-level `await`; delayed terminal render retries only while the matching terminal state remains current.
- `gameOver()` remains the authoritative state mutation/save boundary and delegates retryable presentation to render-only `renderGameOver()`.
- The How to Play manual remains owned by `views/survival-manual.html`.
- Add `views/survival-resource-catalog.html`, containing the resource-catalog host plus category and row `<template>` elements.
- Help loads the manual and resource-catalog external sources together only when Help is requested. The external resource fragment is injected into the manual's existing `{{RESOURCES}}` slot.
- After opening the manual, `populateHelpResourceCatalog()` clones category/row templates into `DocumentFragment`, fills values with `textContent`, and uses bounded `replaceChildren()`; no row/card HTML loop remains in JavaScript.
- Keep all resource data, price calculations, Mining requirements and manual copy unchanged.
- `tests/survival-view-ownership.test.js` locks semantic path separation, detailed dead-colony view preservation, non-blocking terminal preload, one-time game-over mutation boundary, resource category/row template ownership, fragment population, and zero large templates in `survival-ui.js`.
- Architecture debt must be exactly **7** and `survival-ui.js` must be absent from the measured map before 4D.10 begins.

### Expected debt after corrected Phase 4D.9

| File | Findings |
|---|---:|
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **7** |

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
- Async view loads reject stale state/hosts; eager preloads never block application startup.
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
| 4 — HTML views | In progress | Baseline 50; green: 43 → 39 → 30 → 24 → 19 → 15 → 11 → 9; corrected current target 7. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed compatibility wrappers. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Next queue after Phase 4D.9 is fully green

1. `adaptive-building-ui.js` — 2 measured findings: the unified adaptive-building shell and extraction operating-mode control. Externalize those while preserving the synchronous tile-decoration contract. Also replace its direct `tile.harvestIntensity` assignment with the existing `ResourceService.adjustHarvestIntensity()` domain command; this is behaviour-preserving architecture cleanup using the same 25–200% clamp/rule already established elsewhere.
2. Single-finding families, inspect active-vs-shadowed ownership before changing:
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
