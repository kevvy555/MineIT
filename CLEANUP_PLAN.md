# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. Refactoring is behaviour-preserving unless a gameplay change is separately approved. Update this file at every cohesive green checkpoint so work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head before moving the ref.
2. Preserve unrelated user asset work; connector commits touch only explicit paths.
3. Make one cohesive ownership change and update focused tests + exact architecture guards in the same checkpoint.
4. Prefer deleting proven shadowed presentation/compatibility code over preserving dead wrappers.
5. Static markup belongs in `/views`; repeated controls use templates/fragments and bounded replacement.
6. Domain services own rules and authoritative state mutation; UI renders and dispatches.
7. Async view loading must reject stale state/hosts and must never block startup/`DOMContentLoaded`.
8. Do not advance until Push Test, PR Test, browser interaction/coverage and Pages are green.
9. On failure, read the exact workflow log before changing code; never weaken a guard to fit a failure.

## Current repository status

Status captured 2026-08-27 immediately after Phase 4 completed.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green production checkpoint | `cb882c74` — Phase 4D.12, final HTML ownership |
| Current checkpoint | Phase 5.0 — feature-controller ownership inventory and mutation-boundary audit |
| Package version | `5.11.3` |
| Active phase | Phase 5 — feature controllers |
| Verified large-template debt | **0** |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 5–7 remain |

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
- `92701fd3` / `a93dc7dd` — Contract Failed and Industry Capacity externalized, then Industry presentation assertions aligned; 5 → 3. Push `33069061527`, PR `33069065078`, Pages `33069060704`; browser green.
- `cb882c74` — **Phase 4 complete**. Final 3 → 0: externalized map-first Help controls, externalized the undeveloped-resource detail panel, and deleted the shadowed developed-building renderer from `building-details-ui.js`. Push `33070686760`, PR `33070691704`, Pages `33070686316`; Node/regression/domain coverage and browser startup/presentation interactions all green. The architecture guard now requires an empty large-template debt map.

## Phase 4 completion evidence

Phase 4 began with **50 genuine large application HTML templates in JavaScript** after the corrected lexical scanner was introduced. The final `cb882c74` checkpoint reduced this to **0** without weakening the detector or moving gameplay rules into presentation code.

Final ownership decisions:

- `building-details-ui.js`: old developed-building renderer was proven shadowed by `adaptive-building-ui.js` and deleted; only the small modal-style compatibility bridge remains.
- `map-first-ui.js`: final large map-controls Help copy moved to `views/map-first-help-controls.html` with nonblocking cache loading and current-modal ownership checks.
- `resource-development-ui.js`: active undeveloped-resource screen moved to `views/undeveloped-resource.html`; requirement rows use external `<template>` cloning, `DocumentFragment`, and bounded `replaceChildren()`; stale tile loads are rejected.
- `tests/architecture-baseline.test.js`: verified HTML debt map is empty and any newly introduced large application HTML template under `js/` fails CI.

Phase 4 is therefore **Complete**.

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
- Large application HTML template debt must remain zero.
- Preserve mobile/touch behaviour and gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | **Complete** | Corrected baseline 50 → **0**; final Push `33070686760`, PR `33070691704`, Pages `33070686316`, browser green. |
| 5 — Feature controllers | **In progress** | Canonicalize method ownership, remove shadowed wrappers/prototype bypasses, restore remaining domain mutation boundaries. |
| 6 — CSS cleanup | Pending final pass | Audit canonical ownership, duplicates and obsolete rules. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Current Phase 5.0 — ownership inventory

The active controller chain constructed by `js/app.js` ends at `ship-preparation-ui.js` and currently layers:

`ship-preparation-ui` → `ship-navigation-ui` → `player-ship-ui` → `expansion-ui` → `adaptive-building-ui` → `resource-development-ui` → `building-details-ui` → `trade-reserve-ui` → `corporate-events-ui` → `operational-controls-ui` → `map-first-ui` → `technology-presentation-ui` → `survival-presentation-ui` → `cash-policy-ui` → legacy `ui-controller.js` mixin composition.

The legacy `ui-controller.js` composition still copies these mixins in order:

`ResourceUIMixin` → `ColonyTechUIMixin` → `ContractUIMixin` → `PortfolioUIMixin` → `UIEnhancementsMixin` → `SurvivalUIMixin` → `IndustryUIMixin` → `V55UIMixin` → `V55ContractLogUIMixin` → `LandUIMixin`.

### Known Phase-5 targets

1. **Remaining direct UI state mutation:** `operational-controls-ui.js::adjustHarvest()` still assigns `tile.harvestIntensity` directly even though `ResourceService.adjustHarvestIntensity()` is already the canonical command used by adaptive/V55 controllers. First low-risk checkpoint should route this through the domain service and lock it with a focused regression assertion.
2. **Prototype-qualified ownership bypasses:** examples include `IndustryUIMixin.prototype.colonyPanel.call(this)`, V55 direct calls into `IndustryUIMixin` and `UIEnhancementsMixin`, and other explicit prototype dispatch. Inventory each one and distinguish intentional compatibility boundaries from shadowed/obsolete bypasses.
3. **Shadowed technology compatibility:** V55/UI-enhancement technology paths remain below the modern `technology-presentation-ui.js` owner and should be candidates for deletion once all explicit direct callers are accounted for.
4. **Small compatibility bridges:** `building-details-ui.js` now contains only a modal-style bridge; determine whether it can be folded into a canonical owner and removed from the chain without CSS/modal regressions.
5. **Help wrappers:** map-first/operational/corporate-event/trade-reserve still layer intro-only Help overrides through `super.help()`. Map the intended final visible intro and simplify only if behaviour stays identical.
6. **Canonical owner map:** before broad deletion, produce a method-owner inventory for the surviving public controller API so each command/render path has one authoritative feature owner.

### Phase 5 checkpoint procedure

- Prefer small groups of strongly related ownership changes rather than one giant inheritance rewrite.
- Pre-audit source-location tests before each removal.
- Do not alter gameplay results while changing dispatch ownership.
- Keep the zero-template guard and all existing architecture/domain/browser tests active.
- Require Push/PR/browser/Pages green after each cohesive checkpoint.
- Update this handoff after each green checkpoint with exact owner decisions and next target.

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
