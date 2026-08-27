# MineIT Cleanup Plan and Live Handoff

This document is the canonical progress record for the `CleanUp` branch. It must be sufficient to resume after a lost chat without relying on conversation history. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved.

## Checkpoint procedure

1. Verify branch/PR/divergence before editing and preserve unrelated user asset work.
2. Make one cohesive ownership change with focused regression/architecture coverage.
3. Prefer fewer, larger-but-related checkpoints when an ownership boundary is clear. Do not weaken the exact architecture guard or full remote Test/browser/Pages gates.
4. Connector-authored work uses GitHub Push Test + PR Test + browser interaction/coverage + Pages as executable authority because the local runtime cannot resolve `github.com`.
5. Update this plan at each successful green checkpoint and in the same functional checkpoint when practical. Transient stale-test corrections do not require a separate plan-only commit; their cause/evidence is recorded in the next green checkpoint.
6. Do not advance a new checkpoint onto `CleanUp` until the prior checkpoint is green.
7. For asynchronous external views, reject delayed writes when the modal body/visibility/active-colony snapshot has changed.

## Current repository status

Status captured 2026-08-27 while preparing Phase 4D.5.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last fully green checkpoint | `9b8201fe` — Phase 4D.4 land presentation extraction |
| Current checkpoint | Phase 4D.5 — remove/externalize all five `colony-tech-ui.js` large-template findings |
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
- `1c12a122` — Phase 4D.3 externalized all nine `technology-presentation-ui.js` large templates into semantic views and moved the v5.7 manual sections into `views/survival-manual.html`. Push Test `33048664562`, PR Test `33048667800`, browser interactions and Pages `33048664150` all passed. Debt 39 → 30.
- `9b8201fe` — Phase 4D.4 removed the two shadowed base land renderers and externalized active landing selection, surveyed-resource details and the colony-land panel to `views/landing-site-selection.html`, `views/land-resource-details.html` and `views/colony-land-panel.html`. Pending transport rows now clone an external template into a `DocumentFragment`; async land views use modal/visibility/active-colony snapshots; `technology-presentation-ui.js` awaits the base land render before augmenting it. Push Test `33050871178`, PR Test `33050873588`, browser interaction/coverage and Pages `33050870040` all passed. Debt 30 → 24.

## Verified debt after Phase 4D.4

| File | Findings |
|---|---:|
| `js/ui/colony-tech-ui.js` | 5 |
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
| **Total** | **24** |

## Current Phase 4D.5 — colony-tech ownership

The corrected scanner reports five large templates in `js/ui/colony-tech-ui.js`. Inspection of the active controller chain shows this file now contains a mix of active and shadowed presentation:

- the lost-colony panel is still active through the dead-colony chain `technology-presentation → cash-policy/base mixins → V55 → Industry → ColonyTech`;
- the Contract Goals screen is still active through the base UI `#goalsBtn` binding;
- the normal non-dead colony panel is shadowed by the modern land-first `technology-presentation-ui.js::colonyPanel()`, which routes live colonies to `landColonyPanel()`;
- the legacy technology screen is shadowed first by the later UI-enhancement/V55 composition and again by `technology-presentation-ui.js`;
- the legacy `techEffect()` implementation is likewise shadowed by V55 and the modern technology presentation layer.

### 4D.5 implementation contract

1. Delete the shadowed non-dead colony renderer from `ColonyTechUIMixin`. Do not externalize dead presentation that the active land-first controller never calls.
2. Delete the shadowed legacy `tech()` renderer and `techEffect()` from `ColonyTechUIMixin`. Active technology ownership remains `technology-presentation-ui.js` + `views/corporate-technology.html`.
3. Externalize the still-active lost-colony screen to `views/colony-lost.html`.
   - Preserve death date, zero population, final Industry level, stored Food/Fuel, reputation/operating-cost copy, All Colonies action and conditional Abandon Dead Colony action.
   - Preserve the synchronous `colonyPanel()` public contract used by legacy wrapper layers. It launches an internal async lost-colony render and immediately returns because all wrapper layers already stop on `status === "dead"`.
   - Guard the delayed render with modal body/visibility/active-colony/status snapshot checks.
4. Externalize Contract Goals to `views/contract-goals.html`.
   - Preserve colony tier/environment/hazard, Food/Industry/Population objectives, contract profit/revenue/costs and Bronze/Silver/Gold/Platinum performance-band copy.
   - Guard delayed view loading with the same lifecycle snapshot.
5. Keep `supplyDaysLabel()` and `supplyRiskClass()` temporarily for API compatibility even though the old normal-colony renderer is removed; Phase 5 can prove/remove unused helper ownership separately.
6. Add `tests/colony-tech-view-ownership.test.js` to lock:
   - both semantic external paths and required markers;
   - lifecycle snapshot/load markers;
   - zero large HTML templates in `colony-tech-ui.js`;
   - removal of legacy `tech()` / `techEffect()` and old non-dead colony/technology presentation markers;
   - current non-dead colony ownership remains `landColonyPanel()` and current technology ownership remains `views/corporate-technology.html`.
7. Update `tests/tech-visibility.test.js` so its active technology roadmap assertions read `technology-presentation-ui.js`, not the now-cleaned legacy colony-tech source.
8. Add the focused ownership test to `npm test`.
9. Change the exact architecture map from 24 to **19** and require `js/ui/colony-tech-ui.js` to remain absent from large-template debt.
10. Require Push Test, PR Test, browser interaction/coverage and Pages green before Phase 4D.6.

### Expected debt after 4D.5

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

## Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

Connector-authored checkpoints write only explicit repository paths and do not touch these local files.

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules and authoritative game-state mutation; UI renders derived values and dispatches commands.
- Domain modules never import UI modules or render application HTML.
- No application state on `window`; no document-level application event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Repeated UI uses external templates, cloned fragments and bounded host replacement; no `innerHTML` row loops.
- Static application markup belongs in `/views`.
- Async views must not write into stale/disconnected/replaced presentation hosts.
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
| 4 — HTML views | In progress | Corrected baseline 50; 4D.1 green 43; 4D.2 green 39; 4D.3 green 30; 4D.4 green 24; 4D.5 targets 19. |
| 5 — Feature controllers | Pending formal pass | Inherited/mixin ownership decomposition remains. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Branch reconciliation, mobile/browser matrix, campaign/save/load/lifecycle/soak sign-off. |

## Next queue after Phase 4D.5 is green

Continue the faster-but-safe cadence: one cohesive owner at a time, with larger batches only when ownership/lifecycle is demonstrably shared.

1. `resource-ui.js` — 4 findings.
2. `ui-enhancements.js` — 4 findings. This file already contains known shadowed legacy technology rendering; inspect before externalizing.
3. Inspect whether the small two-finding families can share a safe ownership checkpoint; do not combine merely to reduce CI count:
   - `adaptive-building-ui.js` — 2;
   - `quick-trade-ui.js` — 2;
   - `survival-ui.js` — 2.
4. Single-finding families:
   - `building-details-ui.js`;
   - `contract-ui.js`;
   - `industry-ui.js`;
   - `map-first-ui.js`;
   - `resource-development-ui.js`.

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
