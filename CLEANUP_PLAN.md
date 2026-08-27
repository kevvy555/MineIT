# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. Refactoring is behaviour-preserving unless a gameplay change is separately approved. Keep this file detailed enough that work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head before moving the ref.
2. Preserve unrelated user asset work; connector commits touch only explicit paths.
3. Make one cohesive ownership change and update focused tests/architecture guards with it.
4. Prefer deleting proven-shadowed compatibility code over preserving dead wrappers.
5. Static markup belongs in `/views`; repeated controls use templates/fragments and bounded replacement.
6. Domain services own rules and authoritative state mutation; UI renders and dispatches.
7. Async view loading must reject stale state/hosts and must never block startup/`DOMContentLoaded`.
8. Do not weaken a guard to make CI pass. Read the exact failure first and align only genuinely stale source-location assertions.
9. Require Push Test, PR Test, browser interaction/coverage and Pages green at every cohesive production checkpoint.
10. For speed, assemble immutable candidate blobs/tree/commit and compare before moving the branch. Fold handoff updates into cohesive checkpoints rather than creating plan-only CI runs.

## Current repository status

Status captured 2026-08-27 after Phase 5.4 completed and while preparing the Phase 5 exit checkpoint.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `b70a940c` — Phase 5.4 redundant Survival presentation adapter removal |
| Current checkpoint | Phase 5.5 — final controller-owner map + dead intermediate Help overrides |
| Package version | `5.11.3` |
| Active phase | Phase 5 — feature controllers |
| Verified large-template debt | **0** |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 6–7 remain after Phase 5.5 is green |

## Green checkpoint history

### Phases 0–4

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
- `270f9578` — adaptive-building shell + operating mode externalized; 7 → 5. Push `33067797422`, PR `33067803240`, Pages `33067796744`; browser green.
- `92701fd3` / `a93dc7dd` — Contract Failed and Industry Capacity externalized + assertion alignment; 5 → 3. Push `33069061527`, PR `33069065078`, Pages `33069060704`; browser green.
- `cb882c74` — **Phase 4 complete, 3 → 0**. Final map-first Help controls and undeveloped-resource detail moved to external views and old developed-building presentation deleted. Push `33070686760`, PR `33070691704`, Pages `33070686316`; Node/domain/browser green.
- `adf94a92` — Phase-4 completion handoff only. Push `33070932722`, PR `33070936650`, Pages `33070931886`.

### Phase 5

- `1733d862` — **5.1 mutation boundary.** `operational-controls-ui.js::adjustHarvest()` now dispatches through `ResourceService.adjustHarvestIntensity()` instead of assigning `tile.harvestIntensity` directly. Added focused boundary guard. Push `33071271807`, PR `33071276551`, Pages `33071270778`; browser green.
- `186c1112` / `5b31dc67` — **5.2 technology ownership.** Removed shadowed UI-enhancement/V55 technology renderer/state, deleted `views/legacy-technology.html`, and locked `technology-presentation-ui.js` as player-facing owner. Test-only stale visibility alignment at `5b31dc67`. Push `33072381015`, PR `33072385057`, Pages `33072380011`; browser green.
- `821f526c` / `751f9a44` / `2fb655ff` — **5.3 shadowed bridges.** Deleted `building-details-ui.js`, retargeted `resource-development-ui.js` directly to `trade-reserve-ui.js`, and removed shadowed V55 `techEffect()`. Two stale chain tests were aligned without production changes. Final Push `33073342121`, PR `33073346310`, Pages `33073341375`; Node/regression/domain coverage and both browser suites green.
- `b70a940c` — **5.4 redundant Survival adapter.** Deleted `survival-presentation-ui.js` and retargeted `technology-presentation-ui.js` directly to `cash-policy-ui.js`. The composed legacy controller already owns `SurvivalUIMixin.help()` and the canonical menu already binds `this.help()`, so the adapter had no unique behavior. Push `33078192785`, PR `33078198317`, Pages `33078191789`; Node and both browser suites green with no corrective commit.

## Phase 4 completion evidence

Phase 4 began with **50 genuine large application HTML templates in JavaScript** after the corrected lexical scanner and ended at **0**. `tests/architecture-baseline.test.js` requires an empty verified debt map and rejects new large application templates under `js/`.

Final Phase-4 ownership remains:
- static application markup in `/views`;
- repeated UI rows/cards cloned through templates/fragments and bounded replacement;
- nonblocking view preload with stale host/tile/modal rejection;
- developed building details owned by `adaptive-building-ui.js`;
- undeveloped resources owned by `resource-development-ui.js` + `views/undeveloped-resource.html`;
- corporate technology owned by `technology-presentation-ui.js` + `views/corporate-technology.html`.

## Current Phase 5.5 — controller-owner exit contract

### Dead Help overrides

`operational-controls-ui.js::help()` and `corporate-events-ui.js::help()` each called `super.help()` and replaced only the same Help intro text. The higher active `trade-reserve-ui.js::help()` always runs afterwards and replaces that intro again, so the two intermediate intro rewrites are unreachable in the active application.

The substantive rules are already owned by the external field manual:
- global corporation time and cross-colony ship pausing;
- renewable harvest range and degradation/recovery;
- NORMAL/PUSHED/HARD extraction overdrive and risk;
- trade/transport rules.

Checkpoint action:
- remove `operational-controls-ui.js::help()`;
- remove `corporate-events-ui.js::help()`;
- retain `map-first-ui.js::help()` because it mounts real map-first Help controls rather than only replacing intro text;
- retain `trade-reserve-ui.js::help()` as the final active intro owner;
- move Help assertions to the external manual/final active owner.

### Intentional legacy manual-super chain

The remaining prototype-qualified `.call(this)` dispatches are not independently removable wrappers. They emulate required `super` behavior inside the legacy multiple-mixin composition:

- `IndustryUIMixin`: `colonyPanel → ColonyTech`, `currentCollection → UIEnhancements`, `tile → Resource`.
- `V55UIMixin`: `render → Contract`, `colonyPanel/currentCollection/tile → Industry`, `menu → UIEnhancements`.
- `V55ContractLogUIMixin`: `colonyPanel → V55`, `completionActions/deadline → Contract`.

Deleting any one of these without replacing the whole composition model would skip a required presentation layer. Replacing the entire mixin stack with a new inheritance architecture is a materially higher-risk rewrite and is not justified for this behavior-preserving cleanup.

`tests/controller-owner-map.test.js` is added in this checkpoint to:
- lock the modern semantic controller parent chain;
- require deleted bridges to remain absent;
- lock the legacy mixin composition order;
- lock the exact intentional prototype-qualified manual-super calls;
- require intermediate intro-only Help overrides to stay absent.

### Phase 5 exit condition

If Phase 5.5 is green across Push, PR, browser and Pages:
- direct mutable renewable-harvest UI ownership is corrected;
- shadowed technology and compatibility renderers are removed;
- redundant presentation adapters are removed;
- unreachable Help wrappers are removed;
- remaining legacy prototype dispatches are explicitly classified and guarded as necessary compatibility boundaries;
- active controller ownership is documented by executable tests.

At that point **Phase 5 is Complete** and the next work is Phase 6 CSS cleanup. Do not perform an inheritance rewrite as part of Phase 6.

Expected Phase 5.5 paths:
1. `CLEANUP_PLAN.md`
2. `js/ui/operational-controls-ui.js`
3. `js/ui/corporate-events-ui.js`
4. `tests/how-to-play.test.js`
5. `tests/controller-owner-map.test.js` added
6. `package.json`

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
- Preserve mobile/touch behavior and gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | **Complete** | Corrected baseline 50 → **0**; final Push `33070686760`, PR `33070691704`, Pages `33070686316`, browser green. |
| 5 — Feature controllers | **In progress — exit checkpoint** | 5.1–5.4 green; 5.5 locks final owner map and removes unreachable Help wrappers. |
| 6 — CSS cleanup | Pending | Audit canonical ownership, duplicates and obsolete/unreachable rules; first target includes legacy `building-details.css`. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, and keep versioned CSS at zero. Start with CSS made obsolete by deleted JS presentation layers (especially `building-details.css`), but validate selectors against active markup before deletion.

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
