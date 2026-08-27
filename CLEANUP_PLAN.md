# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. Refactoring is behaviour-preserving unless a gameplay change is separately approved. Update this file at every cohesive green checkpoint so work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head before moving the ref.
2. Preserve unrelated user asset work; connector commits touch only explicit paths.
3. Make one cohesive ownership change and update focused tests + the exact architecture debt map in the same checkpoint.
4. Prefer deleting proven shadowed presentation over externalizing dead markup.
5. Static markup belongs in `/views`; repeated controls use templates/fragments and bounded replacement.
6. Domain services own rules and authoritative state mutation; UI renders and dispatches.
7. Async view loading must reject stale state/hosts and must never block startup/`DOMContentLoaded`.
8. Do not advance until Push Test, PR Test, browser interaction/coverage and Pages are green.
9. On failure, read the exact workflow log before changing code; never weaken the guard to fit a failure.

## Current repository status

Status captured 2026-08-27 while preparing Phase 4D.11.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `270f9578` — adaptive-building presentation ownership |
| Current checkpoint | Phase 4D.11 — Contract Failed + Industry Capacity views |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified large-template debt | 5 |
| Expected after current checkpoint | 3 |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 4–7 remain |

## Green checkpoint history

- `a217a509` — ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` / `7153e30e` — corrected lexical template scanner; genuine baseline locked at 50.
- `227101c8` — Help/manual ownership; 50 → 43.
- `3d03bc53` — V55 operation cards; 43 → 39. Push `33047421531`, PR `33047425532`, Pages `33047420869`.
- `1c12a122` — technology presentation; 39 → 30. Push `33048664562`, PR `33048667800`, Pages `33048664150`.
- `9b8201fe` — land presentation; 30 → 24. Push `33050871178`, PR `33050873588`, Pages `33050870040`.
- `01051465` — colony-tech cleanup; 24 → 19. Push `33051923546`, PR `33051926517`, Pages `33051922844`.
- `c27fc9d1` — resource presentation + nonblocking preload correction; 19 → 15. Push `33053336531`, PR `33053339742`, Pages `33053335423`; browser green.
- `4623e3cc` — UI-enhancement ownership; 15 → 11. Push `33054163574`, PR `33054167037`, Pages `33054162621`; browser green.
- `ef1fcdc5` — Quick Trade Sell/Buy extraction + stale assertion alignment; 11 → 9. Push `33054929802`, PR `33054933882`, Pages `33054929350`; browser green.
- `334e6f17` — survival terminal/help ownership; 9 → 7. Push `33067085875`, PR `33067089205`, Pages `33067085509`; browser green.
- `270f9578` — adaptive-building shell + operating mode externalized; Harvest +/- routed through existing `ResourceService.adjustHarvestIntensity`; 7 → 5. Push `33067797422`, PR `33067803240`, Pages `33067796744`; browser green.

## Verified debt after Phase 4D.10

| File | Findings |
|---|---:|
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **5** |

## Current Phase 4D.11 — Contract and Industry presentation ownership

### Contract Failed

- Add `views/contract-failed.html`.
- Keep the `deadline("failed")` state transition synchronous: set `contract.ended`, set `status="liability"` and save exactly once at the original command boundary.
- Preload the external view without awaiting startup.
- `renderContractFailed()` only renders/binds; a delayed load may retry only while status is still `liability` and the contract remains ended.
- Existing acknowledge / all-colonies actions and corporation pause semantics remain unchanged.

### Industry Capacity

- Add `views/industry-capacity-card.html`.
- Preserve `IndustryUIMixin.prototype.colonyPanel` as an active owner because V55 explicitly calls it.
- Preload the card without awaiting startup.
- If the view is still loading, mount only into the captured connected modal body / `.need-grid`; never rerun the whole colony panel.
- Populate status, load/capacity, headroom, Build/Ore factor, export processing and guidance through DOM text/class APIs.
- Preserve insertion immediately before `.need-grid`.
- Update `industry-purpose.test.js` so presentation copy is asserted in the external view rather than the controller.

### Gate

- Add focused `tests/final-presentation-view-ownership.test.js`.
- Exact large-template debt changes 5 → **3**.
- `contract-ui.js` and `industry-ui.js` must remain absent from the measured debt map.
- Require Push/PR/browser/Pages green before the final three are touched.

## Expected debt after Phase 4D.11

| File | Findings |
|---|---:|
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **3** |

## Final Phase-4 checkpoint after 4D.11

Target all remaining debt in one reviewed checkpoint, **3 → 0**:

1. `map-first-ui.js` — move final v5.8 Help/control copy into `views/survival-manual.html` and remove the runtime `help()` replacement; align `how-to-play.test.js`.
2. `building-details-ui.js` — prove which developed-building paths are shadowed by `adaptive-building-ui.js`; delete proven dead markup/methods rather than externalizing compatibility UI.
3. `resource-development-ui.js` — externalize the active undeveloped-resource detail panel while preserving synchronous cached tile-panel behaviour and stale-tile protection.

Phase 4 exits only when the scanner reports zero genuine large application templates and all full gates are green.

## Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules and authoritative mutation.
- Domain modules never import UI code or render application HTML.
- No application state on `window`; no document-level app event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Static markup belongs in `/views`; repeated presentation uses templates/fragments/bounded replacement.
- Async views reject stale state/hosts; eager preloads never block startup.
- No version-suffixed production JS/CSS, import maps or internal version-query imports.
- Exact scanner debt changes only in reviewed extraction checkpoints.
- Preserve mobile/touch behaviour and gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Baseline 50; green progression 43 → 39 → 30 → 24 → 19 → 15 → 11 → 9 → 7 → 5; current target 3, then 0. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed wrappers. |
| 6 — CSS cleanup | Pending final pass | Audit canonical ownership, duplicates and obsolete rules. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each public method to one feature owner, remove shadowed compatibility renderers/wrappers, and decompose orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation while preserving domain/store boundaries.

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
