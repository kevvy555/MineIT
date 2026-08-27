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

Status captured 2026-08-27 after Phase 5.3 completed and while preparing Phase 5.4.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `2fb655ff` — Phase 5.3 shadowed controller bridge removal + stale chain-test alignment |
| Current checkpoint | Phase 5.4 — remove redundant survival presentation adapter |
| Package version | `5.11.3` |
| Active phase | Phase 5 — feature controllers |
| Verified large-template debt | **0** |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 5–7 remain |

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
- `821f526c` / `751f9a44` / `2fb655ff` — **5.3 shadowed bridges.** Deleted `building-details-ui.js`, retargeted `resource-development-ui.js` directly to `trade-reserve-ui.js`, and removed shadowed V55 `techEffect()`. Two tests still read the deleted bridge only to describe controller order; aligned them without production changes. Final Push `33073342121`, PR `33073346310`, Pages `33073341375`; Node/regression/domain coverage and both browser suites green.

## Phase 4 completion evidence

Phase 4 began with **50 genuine large application HTML templates in JavaScript** after the corrected lexical scanner and ended at **0**. `tests/architecture-baseline.test.js` requires an empty verified debt map and rejects new large application templates under `js/`.

Final Phase-4 ownership remains:
- static application markup in `/views`;
- repeated UI rows/cards cloned through templates/fragments and bounded replacement;
- nonblocking view preload with stale host/tile/modal rejection;
- developed building details owned by `adaptive-building-ui.js`;
- undeveloped resources owned by `resource-development-ui.js` + `views/undeveloped-resource.html`;
- corporate technology owned by `technology-presentation-ui.js` + `views/corporate-technology.html`.

## Current Phase 5.4 — survival presentation adapter

Target: `js/ui/survival-presentation-ui.js`.

Current adapter contains only two methods:
1. `menu()` calls `super.menu()` and rebinds `[data-help]` to `()=>this.help()`.
2. `help()` explicitly dispatches `SurvivalUIMixin.prototype.help.call(this)`.

### Redundancy proof

- `cash-policy-ui.js` already extends the composed legacy `ui-controller.js`.
- `ui-controller.js` composes `SurvivalUIMixin`, so the existing inherited `this.help()` already resolves to `SurvivalUIMixin.help()`.
- Later legacy mixins (`IndustryUIMixin`, `V55UIMixin`, `V55ContractLogUIMixin`, `LandUIMixin`) do not define another `help()` method.
- `UIEnhancementsMixin.menu()` already binds `[data-help]` dynamically to `()=>this.help()`.
- V55 menu ownership delegates to `UIEnhancementsMixin.menu()`, so the adapter's second Help binding is behaviorally identical.
- No gameplay, survival rule, Help markup or state mutation is owned by this adapter.

### Phase 5.4 action

- Delete `js/ui/survival-presentation-ui.js`.
- Change only the parent import in `technology-presentation-ui.js` from `survival-presentation-ui.js` to `cash-policy-ui.js`.
- Update `tests/technology-view-ownership.test.js` to require the direct `cash-policy-ui.js` parent and reject the removed adapter.
- Update `tests/how-to-play.test.js` to require adapter absence and assert `SurvivalUIMixin.help()` remains the inherited Help owner through `survival-ui.js`.
- No CSS, domain, save, asset, Help-view or gameplay change belongs in this checkpoint.

Expected Phase 5.4 paths:
1. `CLEANUP_PLAN.md`
2. `js/ui/survival-presentation-ui.js` deleted
3. `js/ui/technology-presentation-ui.js`
4. `tests/how-to-play.test.js`
5. `tests/technology-view-ownership.test.js`

Require full Push/PR/browser/Pages green before proceeding.

## Remaining Phase-5 ownership queue

After Phase 5.4 is green:

1. Inventory remaining explicit prototype-qualified dispatches and classify necessary compatibility boundaries vs removable bypasses:
   - `IndustryUIMixin.prototype.colonyPanel.call(this)`
   - `UIEnhancementsMixin.prototype.currentCollection.call(this)`
   - `ResourceUIMixin.prototype.tile.call(this)`
   - V55 direct calls into `IndustryUIMixin`, `UIEnhancementsMixin` and `ContractUIMixin`
   - V55 contract-log direct calls into V55/Contract methods
   - any remaining `ContractUIMixin.prototype.*` compatibility calls.
2. Simplify only strongly related dispatch groups; do not replace the inheritance stack wholesale.
3. Maintain a canonical public-method owner map for surviving controller API paths.
4. Continue auditing direct UI state mutation and route authoritative changes through existing domain commands where available.
5. Do not alter Help copy or visible behavior while simplifying intro/help wrappers.

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
| 5 — Feature controllers | **In progress** | 5.1–5.3 fully green; 5.4 removes redundant survival presentation dispatch adapter. |
| 6 — CSS cleanup | Pending | Audit canonical ownership, duplicates and obsolete/unreachable rules; revisit legacy `building-details.css`. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, and keep versioned CSS at zero. Do not mix speculative CSS removal into controller-ownership checkpoints.

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
