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

Status captured 2026-08-27 after Phase 7.1 reconciliation completed and while preparing the final validation soak.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `213a859e` — Phase 7.1 `develop` reconciliation |
| Current checkpoint | Phase 7.2 — final validation / accelerated long-simulation soak |
| Package version | `5.11.3` |
| Active phase | Phase 7 — final validation |
| Verified large-template debt | **0** |
| Verified CSS orphan debt | **0** |
| Reconciliation | Complete; `develop` is an ancestor of `CleanUp` |
| PR mergeability | GitHub reports PR #39 mergeable; PR intentionally remains draft |
| Merge readiness | Pending final validation checkpoint and explicit user approval |

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
- `c27fc9d1` — resource presentation; 19 → 15. Push `33053336531`, PR `33053339742`, Pages `33053335423`; browser green.
- `4623e3cc` — UI-enhancement ownership; 15 → 11. Push `33054163574`, PR `33054167037`, Pages `33054162621`; browser green.
- `ef1fcdc5` — Quick Trade extraction; 11 → 9. Push `33054929802`, PR `33054933882`, Pages `33054929350`; browser green.
- `334e6f17` — survival terminal/help ownership; 9 → 7. Push `33067085875`, PR `33067089205`, Pages `33067085509`; browser green.
- `270f9578` — adaptive-building presentation; 7 → 5. Push `33067797422`, PR `33067803240`, Pages `33067796744`; browser green.
- `92701fd3` / `a93dc7dd` — Contract Failed and Industry Capacity; 5 → 3. Push `33069061527`, PR `33069065078`, Pages `33069060704`; browser green.
- `cb882c74` — **Phase 4 complete, 3 → 0**. Push `33070686760`, PR `33070691704`, Pages `33070686316`; Node/domain/browser green.

### Phase 5 — Complete

- `1733d862` — renewable harvest mutation boundary. Push `33071271807`, PR `33071276551`, Pages `33071270778`.
- `186c1112` / `5b31dc67` — removed shadowed technology presentation. Push `33072381015`, PR `33072385057`, Pages `33072380011`.
- `821f526c` / `751f9a44` / `2fb655ff` — removed building-details JS bridge and V55 technology debt. Push `33073342121`, PR `33073346310`, Pages `33073341375`.
- `b70a940c` — deleted redundant survival presentation adapter. Push `33078192785`, PR `33078198317`, Pages `33078191789`.
- `046ed701` — **Phase 5 complete.** Locked final controller owner map and intentional manual-super boundaries. Push `33078938572`, PR `33078945708`, Pages `33078937342`; Node/browser green.

### Phase 6 — Complete

- `bda4274a` / `34e43f59` / `01208f92` — removed obsolete `css/building-details.css`, removed its shell link, added CSS ownership guard and aligned stale tests. Final Push `33080968312`, PR `33080971789`, Pages `33080967168`; Node/browser green.
- `2df89fde` — **Phase 6 complete.** Exact 12-file linked stylesheet list equals complete on-disk `/css/*.css` set, proving zero orphan CSS files and stable cascade ownership. Push `33081571679`, PR `33081577146`, Pages `33081569786`; full Node and browser suites green.

### Phase 7

- `213a859e` — **7.1 reconciliation complete.** Two-parent merge with first parent `2df89fde` and second parent `develop` `01d56b2c`; first-parent content delta is only `CLEANUP_PLAN.md` plus exact `assets/art/levels/L1.png`–`L10.png`. `develop` compare reports `behind_by = 0`. Push `33082056002`, PR `33082062486`, Pages `33082054938`; full Node/browser green. PR #39 reports `mergeable: true` and remains draft.

## Final controller and presentation ownership

Modern semantic controller chain is test-locked:

`ship-preparation` → `ship-navigation` → `player-ship` → `expansion` → `adaptive-building` → `resource-development` → `trade-reserve` → `corporate-events` → `operational-controls` → `map-first` → `technology-presentation` → `cash-policy` → legacy composed `ui-controller`.

Deleted compatibility bridges stay absent:
- `js/ui/building-details-ui.js`
- `js/ui/survival-presentation-ui.js`

Remaining prototype-qualified `.call(this)` dispatches are intentional manual-super boundaries required by the legacy multiple-mixin composition and are locked by `tests/controller-owner-map.test.js`.

CSS ownership is test-locked. `index.html` loads exactly these 12 files, in cascade order, and `/css` contains no other stylesheet:
1. `app.css`
2. `world.css`
3. `panels.css`
4. `portfolio.css`
5. `trade-quality.css`
6. `trade-quick.css`
7. `ui-enhancements.css`
8. `land.css`
9. `map-first.css`
10. `resource-details.css`
11. `adaptive-building-details.css`
12. `ship-expansion.css`

The two inert `classList.remove("building-detail-panel")` resets remain intentionally untouched. Nothing adds or styles that class; Phase 6 explicitly judged rewriting two large active controllers for a no-op token to add more risk than value.

## Phase 7.1 — Complete: `develop` reconciliation

Verified before/after facts:
- pre-merge `develop`: `01d56b2cc679a7293143a7e4fbef54c7f0ee2a20`;
- pre-merge Phase-6 `CleanUp`: `2df89fde5b2d759f21d2d1453bd9a78a1d69a145`;
- reconciliation merge: `213a859ec1c4fb66c17e471b2c1c9c90f1e322a3`;
- the two missing `develop` commits contained only ten level PNGs;
- first-parent compare shows exactly those ten PNGs plus this handoff file;
- `develop` → reconciliation compare reports `behind_by = 0`, so `develop` is an ancestor;
- PR #39 is mergeable and has no reconciliation conflict.

The ten binary level assets were copied byte-for-byte using their existing Git blob SHAs; no re-encoding or source conflict resolution occurred.

## Current Phase 7.2 — final validation checkpoint

### Validation already covered by the normal workflow

The existing Test workflow is already a broad final-validation matrix:

1. **Full Node regression + coverage** — `npm test` plus `tests/coverage-report.js`.
2. **Architecture** — versioned module/CSS/query/import-map/global/document-event/template debt guards.
3. **Save/load** — `tests/save-roundtrip.test.js` covers realistic multi-colony + player-ship round trip.
4. **Interstellar campaign/domain path** — `tests/ship-expansion.test.js` executes probe launch/arrival, ship loading, interstellar travel, post-arrival planet selection, expedition colony founding, corporate-service radius and sole-ship-loss campaign failure.
5. **Multi-colony browser path** — `tests/multi-colony-lifecycle-probe.html` executes first-contract completion/renewal, same-day corporate ship queue, second-colony creation, recovered background ship handling and bidirectional colony switching.
6. **Mobile/browser viewport matrix** — `360×640`, `375×667`, `390×844`, `412×915`, and `915×412` using the presentation interaction probe.
7. **UI lifecycle soak** — 20 cycles of Player Ship → Star Map, Cargo Bay, Corporation and Menu. The probe instruments and bounds active ResizeObservers, window/document listeners and live DOM node growth.
8. **Startup/runtime diagnostics** — browser startup probe rejects collapsed map canvas and visible `STARTUP ERROR`; lifecycle probes reject diagnostics/runtime errors.
9. **Pages deployment** — required green alongside Push/PR Test.

### Remaining gap and current action

The only uncovered plan item is an accelerated multi-year simulation soak. Add `tests/long-simulation-soak.test.js` and include it in `npm test`.

Soak contract:
- start from the canonical state/services;
- heavily provision food/fuel/ore/build and corporate cash so the test exercises stability rather than intentional scarcity death;
- run **9,000 daily simulation ticks / 25 game years**;
- update canonical year/day each tick;
- require no colony death and status remains `playing`;
- annually require key metrics/cash to remain finite and resource inventories non-negative;
- require population remains alive/stable and the sole player ship remains docked/stable;
- no production or gameplay change is part of this checkpoint.

Expected Phase 7.2 paths:
1. `CLEANUP_PLAN.md`
2. `package.json`
3. `tests/long-simulation-soak.test.js` added

After the checkpoint is pushed, require:
- Push Test green, including the new 25-year soak and existing Node coverage;
- PR Test green;
- all five viewport probes green;
- multi-colony lifecycle browser probe green;
- UI lifecycle soak green;
- Pages green;
- PR #39 still mergeable and `CleanUp` still not behind `develop`.

If all of those pass, Phase 7 validation is technically complete. Update this handoff with the final run IDs and mark the repository **ready for explicit user merge approval**. Do not merge automatically.

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
- CSS orphan debt must remain zero.
- Preserve mobile/touch behaviour and gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | Complete | Corrected baseline 50 → 0; final Push `33070686760`, PR `33070691704`, Pages `33070686316`. |
| 5 — Feature controllers | Complete | Final `046ed701`; Push `33078938572`, PR `33078945708`, Pages `33078937342`. |
| 6 — CSS cleanup | Complete | Final `2df89fde`; zero orphan CSS; Push `33081571679`, PR `33081577146`, Pages `33081569786`. |
| 7 — Final validation | **In progress** | 7.1 green at `213a859e`; 7.2 adds the final 25-year simulation soak and reruns the complete validation matrix. |

## Final merge gate

Do not merge draft PR #39 automatically. After Phase 7.2 is fully green:
1. record final Push/PR/Pages run IDs and long-soak result here;
2. re-check `develop` ancestry and PR mergeability;
3. mark Phase 7 complete / merge readiness approved technically;
4. report the evidence to the user and obtain explicit approval before merging PR #39 into `develop`.
