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

Status captured 2026-08-27 while preparing Phase 4D.7.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `c27fc9d1` — Phase 4D.6 resource presentation + startup preload correction |
| Current checkpoint | Phase 4D.7 — remove/externalize all four `ui-enhancements.js` findings |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified large-template debt | 15 |
| Expected after current checkpoint | 11 |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 4–7 remain |

## Green checkpoint history

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` — corrected lexical large-template scanner + regression fixtures introduced.
- `7153e30e` — genuine large-template baseline locked at 50; green.
- `227101c8` — external help/manual ownership; debt 50 → 43; green.
- `3d03bc53` — V55 operation cards externalized; debt 43 → 39. Push `33047421531`, PR `33047425532`, Pages `33047420869`.
- `1c12a122` — all nine `technology-presentation-ui.js` findings externalized; debt 39 → 30. Push `33048664562`, PR `33048667800`, Pages `33048664150`.
- `9b8201fe` — land presentation ownership: removed two shadowed base renderers and externalized landing selection, surveyed-resource details and colony-land panel; debt 30 → 24. Push `33050871178`, PR `33050873588`, Pages `33050870040`.
- `7610d8ef` — Phase 4D.5 production extraction removed shadowed normal-colony/legacy-tech renderers from `colony-tech-ui.js` and externalized lost-colony + Contract Goals views; architecture reached 19. First run stopped later on stale survival source-location assertions.
- `01051465` — aligned the stale survival regression with active land ownership. Phase 4D.5 fully green; debt 24 → 19. Push `33051923546`, PR `33051926517`, Pages `33051922844`.
- `c21c0a29` — Phase 4D.6 resource extraction externalized unsurveyed resource detail, developed resource detail, overdrive and corporation summary; removed shadowed base `currentCollection()`, extended the view cache with resolved synchronous reads/retry-safe preloads, and locked architecture at 15. Node/regression/coverage passed, but browser startup failed because `resource-ui.js` used module-scope `await preloadViewTemplates(...)`; that delayed the module graph until after `DOMContentLoaded`, so `app.js` registered its startup listener too late and never constructed the app.
- `c27fc9d1` — replaced the top-level awaited resource preload with eager non-blocking preload and added a regression guard forbidding `await preloadViewTemplates(...)` there. Phase 4D.6 fully green; debt 19 → 15. Push `33053336531`, PR `33053339742`, browser startup/interactions/coverage all green, Pages `33053335423` green.

## Verified debt after Phase 4D.6

| File | Findings |
|---|---:|
| `js/ui/ui-enhancements.js` | 4 |
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/quick-trade-ui.js` | 2 |
| `js/ui/survival-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **15** |

## Phase 4D.6 implementation notes

Resource presentation now uses:

- `views/resource-unsurveyed-panel.html`
- `views/resource-site-panel.html`
- `views/resource-overdrive-card.html`
- `views/corporation-summary.html`

`js/core/view-template.js` supports `loadViewTemplate`, `preloadViewTemplates`, `getLoadedViewTemplate`, retry-safe failed-fetch eviction and `Promise.allSettled` preload. `resource-ui.js` starts preload without awaiting it; synchronous tile/company decorators read resolved cache when available and retry the final action when a view is still loading. No top-level await may be reintroduced.

## Current Phase 4D.7 — UI enhancement ownership

The scanner reports four large templates in `js/ui/ui-enhancements.js`. Active-chain inspection established four distinct ownership cases:

1. **Current Collection is active.** `IndustryUIMixin.currentCollection()` explicitly calls `UIEnhancementsMixin.prototype.currentCollection()`, and V55 then adds workforce warnings. It must remain a functional synchronous-compatible base owner.
2. **Game Menu is active.** V55 explicitly calls `UIEnhancementsMixin.prototype.menu()` then injects the Game Log button before Hard Reset. The base menu must remain functional.
3. **Legacy technology presentation is shadowed in the final app** by `technology-presentation-ui.js`, but V55 still explicitly calls `UIEnhancementsMixin.prototype.tech()` in its own intermediate compatibility wrapper. Do not leave that wrapper broken. Keep the legacy method functional while moving its HTML external; Phase 5 can remove the whole shadowed V55/legacy technology chain once method ownership is decomposed.
4. **UIEnhancements help is fully shadowed.** `SurvivalUIMixin.help()` is the active field-manual owner and uses `views/survival-manual.html`; there is no explicit later prototype call to the old UI-enhancement help method. Delete the shadowed help renderer rather than externalizing it.

### 4D.7 candidate design

External views:

- `views/current-collection.html`
  - empty-state card;
  - collection table host;
  - header `<template>`;
  - row `<template>`.
- `views/game-menu.html`
  - Save, Diagnostics, How to Play, Centre on ship, All colonies and Hard Reset static menu controls.
- `views/legacy-technology.html`
  - compatibility toolbar with Future/Old filters;
  - technology-path `<template>`;
  - technology-card `<template>`.

Controller changes:

- `ui-enhancements.js` preloads the three views eagerly but **without top-level await**.
- View source comes from `getLoadedViewTemplate`; if not resolved, `loadViewTemplate` retries the final action after loading.
- Current Collection sorting remains `name/category/rate/stock/remaining`, including renewable Remaining sorting as infinity and stable name fallback.
- Collection headers and rows clone external templates into `DocumentFragment` and use `replaceChildren`; no HTML row loops remain.
- Collection sort action is owned by the rendered modal body and rerenders through `this.currentCollection()` so Industry/V55 wrappers remain authoritative.
- Legacy technology retains Future and Old filters, access/cash gating, purchase behavior, `this.techEffect()` and existing V55 audit compatibility, but its presentation is template-driven.
- Game Menu retains all actions and V55 can still insert GAME LOG into `.grid2` before `[data-reset]`.
- Delete the old UI-enhancement `help()` implementation and its now-unused category/manual rendering constants/imports.
- Do not change domain/gameplay code.

Focused coverage:

- add `tests/enhancement-view-ownership.test.js` to lock semantic view paths/markers, fragment ownership, non-blocking preload, zero large templates, active collection/menu wrapper calls, modern technology ownership and Survival manual ownership;
- update `tests/ui-enhancements.test.js` so technology assertions follow `technology-presentation-ui.js` + `views/corporate-technology.html`, help assertions follow `survival-ui.js` + `views/survival-manual.html`, and collection assertions follow the new external collection view;
- add focused test to `npm test`;
- exact architecture debt changes 15 → **11** and `js/ui/ui-enhancements.js` must remain absent from the debt map.

### Expected debt after Phase 4D.7

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
- Preserve mobile/touch interaction behavior and existing gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Baseline 50; green checkpoints: 43 → 39 → 30 → 24 → 19 → 15; current target 11. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed compatibility wrappers. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Next queue after Phase 4D.7 is green

Inspect before grouping; combine only where ownership/lifecycle is genuinely shared:

1. Two-finding families:
   - `adaptive-building-ui.js` — 2
   - `quick-trade-ui.js` — 2
   - `survival-ui.js` — 2
2. Single-finding families:
   - `building-details-ui.js`
   - `contract-ui.js`
   - `industry-ui.js`
   - `map-first-ui.js`
   - `resource-development-ui.js`

Phase 4 exits only when genuine large-template debt is zero and full Node/browser/Pages gates remain green.

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
