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

Status captured 2026-08-27 after Phase 6.1 completed and while preparing the Phase 6 exit audit.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `01208f92` — Phase 6.1 obsolete building-detail CSS removal + stale test alignment |
| Current checkpoint | Phase 6.2 — canonical stylesheet inventory / Phase 6 exit gate |
| Package version | `5.11.3` |
| Active phase | Phase 6 — CSS cleanup |
| Verified large-template debt | **0** |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phase 6 exit gate and Phase 7 validation remain |

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

### Phase 5 — Complete

- `1733d862` — 5.1 renewable-harvest UI mutation routed through `ResourceService.adjustHarvestIntensity`. Push `33071271807`, PR `33071276551`, Pages `33071270778`; browser green.
- `186c1112` / `5b31dc67` — 5.2 removed shadowed technology compatibility presentation and legacy technology view. Push `33072381015`, PR `33072385057`, Pages `33072380011`; browser green.
- `821f526c` / `751f9a44` / `2fb655ff` — 5.3 deleted `building-details-ui.js`, retargeted resource-development directly to trade-reserve, removed shadowed V55 `techEffect()`, and aligned stale source-location tests. Push `33073342121`, PR `33073346310`, Pages `33073341375`; browser green.
- `b70a940c` — 5.4 deleted redundant `survival-presentation-ui.js`; technology presentation now inherits directly from `cash-policy-ui.js`. Push `33078192785`, PR `33078198317`, Pages `33078191789`; browser green.
- `046ed701` — **5.5 / Phase 5 complete.** Removed unreachable intermediate Help-intro wrappers and added `tests/controller-owner-map.test.js` to lock modern parent ownership plus the intentional legacy manual-super chain. Push `33078938572`, PR `33078945708`, Pages `33078937342`; full Node suite and both browser suites green.

### Phase 6

- `bda4274a` / `34e43f59` / `01208f92` — **6.1 obsolete building-detail CSS ownership removed.** Deleted `css/building-details.css`, removed its shell `<link>`, added `tests/css-ownership.test.js`, and aligned stale architecture/startup tests that still expected the deleted stylesheet. The first failure was a too-broad substring guard that matched `adaptive-building-details.css`; the second was the stale startup mandatory-CSS list. No production CSS was restored. Final Push `33080968312`, PR `33080971789`, Pages `33080967168`; full Node and browser suites green.

## Phase 5 final owner decisions

Modern semantic controller chain is executable-test locked:

`ship-preparation` → `ship-navigation` → `player-ship` → `expansion` → `adaptive-building` → `resource-development` → `trade-reserve` → `corporate-events` → `operational-controls` → `map-first` → `technology-presentation` → `cash-policy` → legacy composed `ui-controller`.

Deleted compatibility bridges stay absent:
- `js/ui/building-details-ui.js`
- `js/ui/survival-presentation-ui.js`

Remaining prototype-qualified `.call(this)` dispatches are intentional manual-super boundaries required by the legacy multiple-mixin composition, not independent cleanup debt. `tests/controller-owner-map.test.js` locks the exact required calls and legacy composition order. Do not rewrite the inheritance/mixin model during Phase 6.

## Phase 6.1 result — obsolete building-detail CSS ownership

Active presentation is now split cleanly:

- developed local/extraction buildings: `views/adaptive-building.html` + `css/adaptive-building-details.css`;
- undeveloped surveyed resources: `views/undeveloped-resource.html` + `css/resource-details.css`.

The superseded `building-detail-*`, `building-art-frame`, `building-stat-*`, `building-upgrade-strip` and `.tile-panel.building-detail-panel` stylesheet family is gone. The application shell no longer loads it, and tests require the file/link to stay absent.

Two active controllers still defensively remove the old `building-detail-panel` class while switching tile-panel modes. Nothing adds that class and no CSS owns it. Audit decision: retain those inert removals rather than rewrite two large, heavily used controllers for zero cascade or gameplay benefit. They are harmless state-reset compatibility, not active CSS ownership.

## Current Phase 6.2 — canonical stylesheet inventory / exit gate

Goal: prove there is no remaining orphan CSS file or unowned stylesheet before declaring Phase 6 complete.

Checkpoint action:

1. Expand `tests/css-ownership.test.js` with the exact canonical stylesheet list, in the exact `index.html` cascade order.
2. Enumerate `/css/*.css` on disk and require that set to equal the canonical linked list exactly.
3. Therefore fail if either:
   - an unlinked/orphan stylesheet remains on disk; or
   - `index.html` loads an unexpected stylesheet; or
   - a canonical stylesheet disappears from the shell.
4. Retain the existing adaptive/resource ownership assertions and legacy building-detail absence checks.
5. No production source, CSS, view, state, gameplay, save or asset change belongs in this checkpoint.

Expected Phase 6.2 paths:
1. `CLEANUP_PLAN.md`
2. `tests/css-ownership.test.js`

If this checkpoint is fully green, Phase 6 is complete. The first Phase 7 reconciliation checkpoint should update this plan with the Phase 6.2 run IDs and mark Phase 6 complete.

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
| 4 — HTML views | Complete | Corrected baseline 50 → 0; final Push `33070686760`, PR `33070691704`, Pages `33070686316`. |
| 5 — Feature controllers | **Complete** | Final `046ed701`; Push `33078938572`, PR `33078945708`, Pages `33078937342`; browser green. |
| 6 — CSS cleanup | **In progress — exit gate** | 6.1 green at `01208f92`; 6.2 proves exact linked/on-disk CSS ownership. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Phase 7 — final validation and merge gate

1. Reconcile `develop`; previously identified missing content is the ten level images `assets/art/levels/L1.png`–`L10.png`.
2. Re-run full Node regression/coverage after reconciliation.
3. Run supported mobile/browser viewport matrix.
4. Exercise full multi-colony/interstellar campaign.
5. Run representative save/load round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long-simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only then merge draft PR #39 into `develop`.
