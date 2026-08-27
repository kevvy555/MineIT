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
10. For speed, immutable candidate blobs/tree/commit may be assembled and compared before the branch moves; fold handoff updates into the next cohesive checkpoint rather than creating unnecessary CI-only commits.

## Current repository status

Status captured 2026-08-27 while preparing Phase 5.3.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `5b31dc67` — Phase 5.2 legacy technology ownership removal + stale visibility-test alignment |
| Current checkpoint | Phase 5.3 — remove two further shadowed controller layers |
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

- `1733d862` — **Phase 5.1: mutation boundary.** `operational-controls-ui.js::adjustHarvest()` now dispatches through canonical `ResourceService.adjustHarvestIntensity()` instead of assigning `tile.harvestIntensity` directly. Exact logging/recalculate/save/toast/render behavior retained. Added `tests/controller-mutation-boundaries.test.js`. Push `33071271807`, PR `33071276551`, Pages `33071270778`; both browser suites green.
- `186c1112` / `5b31dc67` — **Phase 5.2: technology ownership.** Removed shadowed `UIEnhancementsMixin.tech()` helpers/state, removed shadowed V55 technology wrapper, deleted `views/legacy-technology.html`, and locked `technology-presentation-ui.js` as the player-facing technology owner. Initial production Node failure was only a stale `tech-visibility.test.js` source-location expectation; corrected at `5b31dc67` without restoring legacy code. Final Push `33072381015`, PR `33072385057`, Pages `33072380011`; both browser suites green.

## Phase 4 completion evidence

Phase 4 began with **50 genuine large application HTML templates in JavaScript** after the corrected lexical scanner was introduced and ended at **0**. `tests/architecture-baseline.test.js` now requires an empty verified debt map and rejects any new large application template under `js/`.

Final ownership from Phase 4 remains:

- static application markup in `/views`;
- repeated UI rows/cards cloned through templates/fragments and bounded replacement;
- nonblocking view preload with stale host/tile/modal rejection;
- developed building details owned by `adaptive-building-ui.js`;
- undeveloped resources owned by `resource-development-ui.js` + `views/undeveloped-resource.html`;
- corporate technology owned by `technology-presentation-ui.js` + `views/corporate-technology.html`.

## Current Phase 5.3 — shadowed controller bridges

### A. Remove V55 `techEffect()`

Proof:

- Final active technology presentation is `technology-presentation-ui.js`, reached above the legacy mixin stack through `map-first-ui.js`.
- The modern controller defines its own `techEffect(category, tech)` and its own `async tech()` and does not call the V55 technology renderer.
- No explicit `V55UIMixin.prototype.techEffect` caller was found.
- Phase 5.2 already removed the V55 `tech()` wrapper and legacy technology view.

Checkpoint action:

- Delete `V55UIMixin.techEffect()` only.
- Keep V55 `clamp` import because the contract time-bar render still uses it.
- Move technology-effect test expectations to `technology-presentation-ui.js` and assert V55 cannot regain `techEffect()`.

### B. Remove `building-details-ui.js` compatibility bridge

Current bridge only removes obsolete `building-detail-modal` styling then delegates to its base. It no longer owns any developed-building rendering.

Proof before deletion:

- `adaptive-building-ui.js` does not add `building-detail-modal`.
- `resource-development-ui.js` does not add it.
- the resource base does not add it.
- current repository search found no runtime `classList.add("building-detail-modal")` call.
- the remaining `.building-detail-modal` selector is CSS debt in `css/building-details.css`, not an active JS requirement.
- `building-details-ui.js` currently extends `trade-reserve-ui.js`, so preserving the controller chain requires `resource-development-ui.js` to inherit **directly from `trade-reserve-ui.js`** after bridge deletion. Do not skip to `resource-ui.js`.

Checkpoint action:

- Delete `js/ui/building-details-ui.js`.
- Change only the base import in `resource-development-ui.js` from `building-details-ui.js` to `trade-reserve-ui.js`.
- Update building/final ownership tests to require the bridge file to remain absent and the direct trade-reserve inheritance to remain in place.
- **Do not delete `css/building-details.css` in Phase 5.3.** Old building-detail selectors are deferred to Phase 6 so CSS/cascade removal is validated independently.

### Phase 5.3 gate

Expected paths:

1. `CLEANUP_PLAN.md`
2. `js/ui/building-details-ui.js` deleted
3. `js/ui/resource-development-ui.js`
4. `js/ui/v55-ui.js`
5. `tests/building-art.test.js`
6. `tests/final-presentation-view-ownership.test.js`
7. `tests/tech-visibility.test.js`

No gameplay/domain/save/CSS/asset change belongs in this checkpoint. Require full Push/PR/browser/Pages green before moving to the next ownership seam.

## Remaining Phase-5 ownership queue

After Phase 5.3 is green:

1. Inventory remaining prototype-qualified dispatches and classify each as necessary compatibility boundary vs removable bypass:
   - `IndustryUIMixin.prototype.colonyPanel.call(this)`
   - `UIEnhancementsMixin.prototype.currentCollection.call(this)`
   - `ContractUIMixin.prototype.detailsCard.call(this)`
   - V55 direct calls into `ContractUIMixin`, `IndustryUIMixin`, and `UIEnhancementsMixin`
   - V55 contract-log direct calls into V55/Contract methods.
2. Review `survival-presentation-ui.js` and other small wrappers for methods completely shadowed by later controllers.
3. Simplify intro-only `help()` wrappers only after mapping the intended final visible intro; do not alter Help text behavior accidentally.
4. Produce/maintain a canonical public-method owner map for the surviving controller API.
5. Audit remaining direct UI mutation and route authoritative state changes through existing domain commands where available.
6. Keep changes in small related batches rather than replacing the inheritance stack in one high-risk rewrite.

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
| 5 — Feature controllers | **In progress** | 5.1 and 5.2 fully green; 5.3 removes further proven-shadowed bridges. |
| 6 — CSS cleanup | Pending | Audit canonical ownership, duplicates and obsolete/unreachable rules; specifically revisit legacy building-detail CSS after the JS bridge is gone. |
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
