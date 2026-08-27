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

Status captured 2026-08-27 after Phase 6 completed and while preparing Phase 7.1 reconciliation.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `2df89fde` — Phase 6 CSS ownership exit gate |
| Current checkpoint | Phase 7.1 — reconcile the two `develop` commits without replaying old source |
| Package version | `5.11.3` |
| Active phase | Phase 7 — final validation |
| Verified large-template debt | **0** |
| Verified CSS orphan debt | **0** |
| Merge readiness | Not ready; reconciliation and final validation remain |

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
- `2df89fde` — **Phase 6 complete.** `tests/css-ownership.test.js` now requires the exact 12-file linked stylesheet list to equal the complete on-disk `/css/*.css` set, proving zero orphan CSS files and stable cascade ownership. Push `33081571679`, PR `33081577146`, Pages `33081569786`; full Node and browser suites green.

## Final controller and presentation ownership

Modern semantic controller chain is test-locked:

`ship-preparation` → `ship-navigation` → `player-ship` → `expansion` → `adaptive-building` → `resource-development` → `trade-reserve` → `corporate-events` → `operational-controls` → `map-first` → `technology-presentation` → `cash-policy` → legacy composed `ui-controller`.

Deleted compatibility bridges stay absent:
- `js/ui/building-details-ui.js`
- `js/ui/survival-presentation-ui.js`

Remaining prototype-qualified `.call(this)` dispatches are intentional manual-super boundaries required by the legacy multiple-mixin composition and are locked by `tests/controller-owner-map.test.js`.

CSS ownership is also test-locked. `index.html` loads exactly these 12 files, in this cascade order, and `/css` contains no other stylesheet:
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

The two inert `classList.remove("building-detail-panel")` resets remain intentionally untouched: nothing adds or styles that class, and rewriting large active controllers solely to remove the defensive token would add risk without changing cascade or gameplay.

## Current Phase 7.1 — reconcile `develop`

### Verified divergence

Current `develop` head: `01d56b2cc679a7293143a7e4fbef54c7f0ee2a20`.
Current Phase-6 `CleanUp` head before this checkpoint: `2df89fde5b2d759f21d2d1453bd9a78a1d69a145`.
Merge base: `4f26c7dd14414d33270b0d2c65b75b5d5ab80dcc`.

`CleanUp` is 357 cleanup commits ahead and exactly 2 commits behind `develop`. A direct compare from the merge base to current `develop` proves those two commits change **only** these ten binary files:

- `assets/art/levels/L1.png`
- `assets/art/levels/L2.png`
- `assets/art/levels/L3.png`
- `assets/art/levels/L4.png`
- `assets/art/levels/L5.png`
- `assets/art/levels/L6.png`
- `assets/art/levels/L7.png`
- `assets/art/levels/L8.png`
- `assets/art/levels/L9.png`
- `assets/art/levels/L10.png`

No source, CSS, tests, views, config, save or gameplay files exist in the two-commit `develop` delta.

### Reconciliation strategy

Do **not** merge the old `develop` tree conventionally and resolve hundreds of apparent refactor conflicts. Build a reviewed merge commit whose:

- first parent is current `CleanUp`;
- second parent is current `develop` (`01d56b2c`);
- tree is the current cleaned tree plus the ten exact existing PNG blob SHAs from `develop`;
- only additional text change is this handoff file.

This records the `develop` ancestry properly, removes the 2-commit graph divergence, preserves every cleanup change, and copies the level images byte-for-byte without re-encoding them.

Exact `develop` PNG blob SHAs:

| File | Blob SHA |
|---|---|
| L1.png | `cccca4745adde6ff97de15cd7af53a5fe8ace51f` |
| L2.png | `65c642039c94827542f1d2e67945972206b0f475` |
| L3.png | `0b20189e6df0cbf8a0ad4c57cfba5b2f644f8e2f` |
| L4.png | `2ec2f324ab6591ff4b79ee7c87a3e45e930b0b01` |
| L5.png | `b1e9c27d228df805c5b62c0338a3f334b70c4d6b` |
| L6.png | `f246b0c82cd1e37f8db9c176e47e6bee9831b995` |
| L7.png | `67e2019d45b73bda79ed6264937e95c51ee4547b` |
| L8.png | `8bb47a398c6bedf6780d7974c77d45efcda2aac5` |
| L9.png | `eab447d1431d5bbbc22ae745cf22b608a4e915b9` |
| L10.png | `c00bbbf2057d4fb6df9a30b74e85f8185bcb5ee5` |

### Phase 7.1 gate

Expected first-parent diff:
1. `CLEANUP_PLAN.md`
2. `assets/art/levels/L1.png`
3. `assets/art/levels/L2.png`
4. `assets/art/levels/L3.png`
5. `assets/art/levels/L4.png`
6. `assets/art/levels/L5.png`
7. `assets/art/levels/L6.png`
8. `assets/art/levels/L7.png`
9. `assets/art/levels/L8.png`
10. `assets/art/levels/L9.png`
11. `assets/art/levels/L10.png`

Before moving `CleanUp`:
- compare first parent → candidate and require exactly those 11 paths;
- compare `develop` → candidate and require `behind_by = 0` / `develop` ancestor;
- re-fetch both branch heads to reject races.

After branch movement require full Push/PR/browser/Pages green.

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
| 6 — CSS cleanup | **Complete** | Final `2df89fde`; 12 canonical loaded/on-disk stylesheets, zero orphan CSS; Push `33081571679`, PR `33081577146`, Pages `33081569786`. |
| 7 — Final validation | **In progress** | 7.1 reconciles `develop`, then full mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Phase 7 remaining validation and merge gate

After Phase 7.1 is fully green:

1. Confirm `CleanUp` is no longer behind `develop` and PR #39 has no reconciliation conflict.
2. Run/review full Node regression and coverage after reconciliation.
3. Run supported mobile/browser viewport matrix.
4. Exercise representative full multi-colony/interstellar campaign paths.
5. Run representative save/load round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long-simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit user approval before merging PR #39 into `develop`.

Do not merge the draft PR until that final approval.
