# MineIT Cleanup Plan and Live Handoff

This document is the canonical progress record for the `CleanUp` branch. It must be sufficient to resume after a lost chat without relying on conversation history. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved.

## Checkpoint procedure

1. Verify branch/PR/divergence before editing and preserve unrelated user asset work.
2. Make one cohesive ownership change with focused regression/architecture coverage.
3. Prefer fewer, larger-but-related checkpoints when an ownership boundary is clear. Do not weaken the exact architecture guard or full remote Test/browser/Pages gates.
4. Connector-authored work uses GitHub Push Test + PR Test + browser interaction/coverage + Pages as executable authority because the local runtime cannot resolve `github.com`.
5. Update this plan at each successful green checkpoint and in the same functional checkpoint when practical. Transient stale-test corrections do not require a separate plan-only commit; their cause/evidence is recorded in the next green checkpoint.
6. Do not advance a new checkpoint onto `CleanUp` until the prior checkpoint is green.
7. For asynchronous external views, reject delayed writes when the owning modal/panel/active-colony snapshot has changed.
8. Where later controllers synchronously decorate a base view, prefer preloaded external templates with a synchronous cached read over cascading async method changes.

## Current repository status

Status captured 2026-08-27 while preparing Phase 4D.6.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last fully green checkpoint | `01051465` — Phase 4D.5 colony-tech ownership + stale survival-test alignment |
| Current checkpoint | Phase 4D.6 — externalize/remove all four `resource-ui.js` large-template findings |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML views |
| Branch relationship | Diverged from `develop`; branch reconciliation remains Phase 7 |
| Merge readiness | Not ready; Phases 4–7 still have work |

## Green checkpoint history

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` — lexical template detector introduced; scanner was correct but the old expected debt count was wrong.
- `7153e30e` — corrected lexical-scanner baseline locked at 50 genuine large HTML templates; green.
- `227101c8` — Phase 4D.1 external help-manual ownership; debt 50 → 43; green.
- `3d03bc53` — Phase 4D.2 V55 operation-card ownership complete. Push Test `33047421531`, PR Test `33047425532`, browser interaction/coverage and Pages `33047420869` all passed. Debt 43 → 39.
- `1c12a122` — Phase 4D.3 externalized all nine `technology-presentation-ui.js` large templates and moved v5.7 manual sections into `views/survival-manual.html`. Push Test `33048664562`, PR Test `33048667800`, browser interactions and Pages `33048664150` all passed. Debt 39 → 30.
- `9b8201fe` — Phase 4D.4 removed two shadowed base land renderers and externalized active landing selection, surveyed-resource details and the colony-land panel. Pending transport rows clone an external template into a `DocumentFragment`; async land views use modal/visibility/active-colony snapshots; `technology-presentation-ui.js` awaits the base land render before augmenting it. Push Test `33050871178`, PR Test `33050873588`, browser interaction/coverage and Pages `33050870040` all passed. Debt 30 → 24.
- `7610d8ef` — Phase 4D.5 production checkpoint deleted shadowed normal-colony/legacy-technology renderers from `colony-tech-ui.js` and externalized the still-active lost-colony and Contract Goals screens. The new ownership test and exact 19-template architecture map passed; the first Test run stopped later on a stale `survival-rebalance.test.js` assertion that still expected Emergency Mode / Industry staffing presentation inside `colony-tech-ui.js`.
- `01051465` — aligned that stale survival regression assertion with its active `land-ui.js` + `views/colony-land-panel.html` owner. Full Push Test `33051923546`, PR Test `33051926517`, browser interaction/coverage and Pages `33051922844` all passed. Phase 4D.5 is complete. Debt 24 → 19.

## Phase 4D.5 — complete and green

Important outcomes:

- `js/ui/colony-tech-ui.js` now contains no large embedded HTML templates.
- Shadowed normal live-colony presentation was removed instead of externalized; active live-colony ownership remains the land-first controller.
- Shadowed legacy `tech()` and `techEffect()` were removed; active technology ownership remains `technology-presentation-ui.js` + `views/corporate-technology.html`.
- Still-active lost-colony presentation is owned by `views/colony-lost.html`.
- Still-active Contract Goals presentation is owned by `views/contract-goals.html`.
- Lost-colony / goals delayed loads use modal body, visibility, active-colony and status snapshots before writing.
- The public dead-colony `colonyPanel()` contract remains synchronous for existing wrapper layers.

## Verified debt after Phase 4D.5

| File | Findings |
|---|---:|
| `js/ui/resource-ui.js` | 4 |
| `js/ui/ui-enhancements.js` | 4 |
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/quick-trade-ui.js` | 2 |
| `js/ui/survival-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **19** |

## Current Phase 4D.6 — resource presentation ownership

The corrected scanner reports four large templates in `js/ui/resource-ui.js`. Inspection of the active controller chain shows:

1. unsurveyed-sector tile detail is active base presentation;
2. surveyed/developed resource tile detail is active base presentation and is synchronously decorated by later technology/building/resource controllers;
3. extraction overdrive presentation is active and appended to the synchronous tile panel;
4. base corporation summary is active and synchronously augmented by later company/cash/technology layers;
5. the base `currentCollection()` renderer is shadowed by later collection owners and should be deleted rather than externalized.

Turning the base `tile()` method asynchronous would force coordinated changes through several downstream decorators. Phase 4D.6 therefore keeps the public presentation contracts synchronous by preloading external view source at module evaluation and exposing only resolved source through a synchronous cache getter.

### 4D.6 implementation contract

1. Extend `js/core/view-template.js` from a promise-only cache to a resolved-source cache entry `{source,pending}` while preserving existing async callers.
2. Add `getLoadedViewTemplate(path)` for synchronous reads of already-resolved source.
3. Add `preloadViewTemplates(paths)` using `Promise.allSettled` over de-duplicated paths.
   - Preload failures must not reject module startup.
   - Failed entries must be removed from the cache so on-demand retry can succeed later.
4. `resource-ui.js` owns and preloads exactly four semantic views at module evaluation:
   - `views/resource-unsurveyed-panel.html`;
   - `views/resource-site-panel.html`;
   - `views/resource-overdrive-card.html`;
   - `views/corporation-summary.html`.
5. Keep `ResourceUIMixin.tile(tile)` synchronous. Later building/resource/technology decorators must continue to see a fully populated tile panel immediately after `super.tile(tile)`.
6. Preserve all existing resource calculations and actions:
   - survey hint/time/slots and survey enqueue state;
   - category/rarity/quality, collection rate, stock, remaining/deposit/renewable capacity, life estimate and site level;
   - mining requirements and locked state;
   - Emergency Mode pause messaging and dead/ended extraction messaging;
   - develop/upgrade requirements, actions, recalculation/save/toast paths;
   - overdrive shutdown/accident state, Normal/Pushed/Hard profile values, risk exposure, last accident and operating-mode actions;
   - corporation cash/earnings/wins/reputation/colony counts/operating cost/technology/current-colony metrics and All Colonies action.
7. Build overdrive mode buttons by cloning `data-site-mode-template` into a `DocumentFragment`, then one bounded `replaceChildren()`.
8. Do not use `innerHTML` to rebuild the extracted resource views. External source is parsed with a bounded contextual fragment and inserted into the owned tile/modal host.
9. Delete the shadowed base `currentCollection()` renderer. Active collection ownership remains in the later V55/UI-enhancement chain.
10. If a preloaded resource view is unexpectedly unavailable, `resourceViewSource()` must retry the async loader and rerender the same view when it resolves; the failure is diagnosed and must not crash startup.
11. Expand `tests/view-template.test.js` to lock:
    - resolved synchronous reads;
    - preload de-duplication;
    - `allSettled` failure isolation;
    - removal/retry of failed cache entries.
12. Add `tests/resource-view-ownership.test.js` to lock:
    - all four semantic view paths and markers;
    - synchronous preload/getter ownership;
    - fragment/template-cloning/bounded replacement markers;
    - zero large templates in `resource-ui.js`;
    - no base `currentCollection()` and retention of the active later owner;
    - no `resource-ui.js` `innerHTML` rebuilding;
    - synchronous `tile(tile)` contract remains non-async.
13. Add the focused ownership test to `npm test`.
14. Change the exact architecture debt map from 19 to **15** and require `resource-ui.js` to remain absent from measured large-template debt.
15. Require Push Test, PR Test, Node/regression/coverage, browser interaction tests and Pages green before Phase 4D.7.

### Expected debt after 4D.6

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

## Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

Connector-authored checkpoints write only explicit repository paths and do not touch these local files.

## Repository hygiene note

Two accidental temporary branches, `__noop__` and `__noop2__`, were created earlier while switching connector schemas. Both point to the already-green `9b8201fe` commit and do not affect `CleanUp`, PR #39 or workflows. The currently exposed connector actions do not provide a safe delete-ref operation, so leave them untouched and do not create further temporary branches. All further checkpoint preparation uses immutable Git blobs/trees/commits plus a final non-force `CleanUp` ref update.

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules and authoritative game-state mutation; UI renders derived values and dispatches commands.
- Domain modules never import UI modules or render application HTML.
- No application state on `window`; no document-level application event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Repeated UI uses external templates, cloned fragments and bounded host replacement; no `innerHTML` row loops.
- Static application markup belongs in `/views`.
- Async views must not write into stale/disconnected/replaced presentation hosts.
- Synchronously decorated base views may use explicit preloading + synchronous resolved-source reads; failed preloads must be isolated/retryable rather than blocking startup.
- No version-suffixed production JS/CSS, import-map routing or internal version-query imports.
- The exact corrected lexical-scanner debt map changes only in a reviewed extraction checkpoint.
- Keep refactored functions small/single-purpose and preserve mobile interaction behavior.

## Phase tracker

| Phase | State | Evidence / exit condition |
|---|---|---|
| 0 — Test baseline | Complete | Regression, architecture, save/load, lifecycle and coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JavaScript. |
| 2 — Startup/import cleanup | Complete | Zero import maps and internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Corrected baseline 50; 4D.1 green 43; 4D.2 green 39; 4D.3 green 30; 4D.4 green 24; 4D.5 green 19; 4D.6 targets 15. |
| 5 — Feature controllers | Pending formal pass | Inherited/mixin ownership decomposition remains. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Branch reconciliation, mobile/browser matrix, campaign/save/load/lifecycle/soak sign-off. |

## Next queue after Phase 4D.6 is green

Continue the faster-but-safe cadence. Delete shadowed presentation instead of externalizing it where active ownership is already proven elsewhere.

1. `ui-enhancements.js` — 4 findings. This file contains known inherited/shadowed technology and collection presentation; inspect active ownership before externalizing.
2. Inspect the resource/building family together now that synchronous preloaded views are available, but only combine a checkpoint when lifecycle/ownership really aligns:
   - `adaptive-building-ui.js` — 2;
   - `building-details-ui.js` — 1;
   - `resource-development-ui.js` — 1.
3. `quick-trade-ui.js` — 2 findings.
4. `survival-ui.js` — 2 findings.
5. Single remaining families: `contract-ui.js`, `industry-ui.js`, `map-first-ui.js`.

Phase 4 exits only when genuine large-template debt reaches zero, static markup has clear external ownership and full Node/browser CI remains green.

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each method to one feature owner, and decompose presentation orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation. Preserve store/domain/service boundaries and remove shadowed methods per green checkpoint.

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, keep versioned CSS at zero, and run visual/browser regression.

## Phase 7 — final validation and merge gate

1. Reconcile the two `develop` commits; effective missing content remains the ten level images `assets/art/levels/L1.png`–`L10.png`.
2. Run full Node regression/coverage suite.
3. Run supported mobile/browser viewport matrix.
4. Exercise full multi-colony/interstellar campaign flow.
5. Run representative save/load compatibility round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only then should draft PR #39 be merged into `develop`.
