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

Status captured 2026-08-27 while preparing Phase 4D.9.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `ef1fcdc5` — Phase 4D.8 Quick Trade Sell/Buy ownership + stale assertion alignment |
| Current checkpoint | Phase 4D.9 — externalize `survival-ui.js` immediate Colony Lost and Corporation Failed views |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified large-template debt | 9 |
| Expected after current checkpoint | 7 |
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
- `c21c0a29` — resource presentation extraction reached 15 in Node, but browser startup exposed top-level-awaited preload delaying `DOMContentLoaded` registration.
- `c27fc9d1` — fixed resource preload to eager non-blocking and guarded against awaited preload; debt 19 → 15. Push `33053336531`, PR `33053339742`, Pages `33053335423`; browser startup/interactions/coverage green.
- `4623e3cc` — UI-enhancement ownership; debt 15 → 11. Push `33054163574`, PR `33054167037`, Pages `33054162621`; browser startup/interactions/coverage green.
- `3cb24872` — Quick Trade Sell/Buy views externalized; architecture reached 9, but Test found a stale `global-expansion.test.js` source-location assertion for protected-reserve copy.
- `ef1fcdc5` — aligned that stale assertion to `views/quick-trade-sell.html`. Phase 4D.8 fully green; debt 11 → 9. Push Test `33054929802`, PR Test `33054933882`, browser startup/presentation interactions green, Pages `33054929350` green.

## Verified debt after Phase 4D.8

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

## Current Phase 4D.9 — Survival terminal-view ownership

`survival-ui.js` has two genuine large templates and they are both active terminal-state notifications:

1. `colonyLost()` — immediate notification when the active colony dies while other colonies may remain.
2. `gameOver()` — all colonies are lost and the corporation must restart.

The How to Play manual is already externally owned by `views/survival-manual.html` and is not part of this extraction.

During candidate review an existing `views/colony-lost.html` was found. It is already actively owned by `colony-tech-ui.js` for the **detailed dead-colony management panel** (death date, final industry, stocks, abandon action). Do not repurpose or overwrite it. The immediate survival notification gets its own semantic view instead.

### 4D.9 candidate contract

- Keep existing `views/colony-lost.html` completely unchanged for `colony-tech-ui.js` dead-colony management.
- Add `views/survival-colony-lost.html` with the immediate loss copy, dynamic colony name/status, and surviving-colonies action.
- Add `views/corporation-failed.html` with the existing all-colonies-lost copy and reset/colonies actions.
- `survival-ui.js` eagerly preloads the two new views without top-level `await`.
- `renderSurvivalView()` reads resolved cache synchronously; if a view is still loading, it retries only while the matching terminal condition is still true.
- A pending immediate colony-lost notification must not override a later corporation-game-over state.
- `gameOver()` retains authoritative mutation/save exactly at the command boundary: set `state.company.gameOver=true`, save, then call render-only `renderGameOver()`. Async retry must never repeat mutation/save.
- `colonyLost()` recomputes the number of surviving colonies when it finally renders; when none survive the surviving-colonies button is removed so final DOM/behaviour matches the existing implementation.
- Keep all Help/manual bindings unchanged.
- Add `tests/survival-view-ownership.test.js` to lock semantic path separation, the existing management view markers, non-blocking preload, terminal guards, one-time game-over mutation boundary and zero large templates in `survival-ui.js`.
- Exact architecture debt changes 9 → **7** and `survival-ui.js` must remain absent thereafter.
- Require Push Test, PR Test, browser interaction/coverage and Pages green before Phase 4D.10.

### Expected debt after Phase 4D.9

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
| 4 — HTML views | In progress | Baseline 50; green: 43 → 39 → 30 → 24 → 19 → 15 → 11 → 9; current target 7. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed compatibility wrappers. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Next queue after Phase 4D.9 is green

1. `adaptive-building-ui.js` — 2. Active dense unified-building presentation. Likely one shared external adaptive-building shell plus repeated card/requirement/operating-mode templates; preserve synchronous tile-decoration contract and extraction/domain commands.
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
