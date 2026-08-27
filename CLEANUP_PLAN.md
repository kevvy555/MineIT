# MineIT Cleanup Plan and Final Handoff

This is the canonical recovery record for the `CleanUp` branch. The cleanup/refactor is behaviour-preserving unless a gameplay change was separately approved. Do not rely on chat history to determine merge readiness; use this file and GitHub status.

## Final repository status

Status captured 2026-08-27 after Phase 7 technical validation completed.

| Item | Final state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green technical checkpoint | `e633bf1f` — final 25-year simulation validation |
| Package version | `5.11.3` |
| Cleanup phases | **0–7 complete** |
| Large embedded HTML-template debt | **0** |
| Versioned production JS/CSS debt | **0** |
| Internal query-import debt | **0** |
| Import-map debt | **0** |
| Application globals/document app-event debt | **0** |
| CSS orphan debt | **0** |
| Branch reconciliation | **Complete** — `develop` is an ancestor of `CleanUp` |
| Current compare to `develop` | **359 ahead / 0 behind** at `e633bf1f` |
| PR mergeability | **mergeable: true** |
| PR state | Open and draft; intentionally not merged |
| Technical merge readiness | **READY** |
| Remaining action | Obtain explicit user approval, then mark PR ready and merge PR #39 into `develop` |

## Final validation evidence

### Phase 7.1 — `develop` reconciliation

Checkpoint: `213a859ec1c4fb66c17e471b2c1c9c90f1e322a3`

- two-parent merge with first parent Phase-6 head `2df89fde5b2d759f21d2d1453bd9a78a1d69a145` and second parent `develop` `01d56b2cc679a7293143a7e4fbef54c7f0ee2a20`;
- first-parent content delta was only `CLEANUP_PLAN.md` plus exact `assets/art/levels/L1.png`–`L10.png`;
- ten level images reused their existing Git blobs byte-for-byte; no re-encoding;
- `develop` compare returned `behind_by = 0`;
- Push Test `33082056002` — success;
- PR Test `33082062486` — success;
- Pages `33082054938` — success;
- full Node and browser suites green.

### Phase 7.2 — final validation

Checkpoint: `e633bf1f04c6336ab9037573a436b61faf64af4a`

Final runs:
- Push Test `33087964519` — **success**;
- PR Test `33087970503` — **success**;
- Pages `33087964360` — **success**.

The normal workflow at this checkpoint proves all of the following:

1. **Full Node regression/domain suite and V8 coverage** passed.
2. **Architecture guards** passed with:
   - versioned JS = 0;
   - versioned CSS = 0;
   - query imports = 0;
   - import map = false;
   - global assignments = 0;
   - document application events = 0;
   - large HTML templates = 0.
3. **CSS ownership guard** passed with exactly 12 linked stylesheets and zero orphan CSS files.
4. **Realistic multi-colony + player-ship save round trip** passed.
5. **ShipExpansion campaign/domain path** passed, including:
   - probe gating/launch/arrival;
   - physical passenger/resource loading;
   - interstellar ship travel;
   - post-arrival planet selection;
   - expedition colony founding from the ship manifest;
   - corporate service radius;
   - sole player ship loss causing campaign failure.
6. **Accelerated long-simulation soak** passed:
   - **9,000 daily ticks / 25 game years**;
   - no colony death or state transition away from `playing`;
   - final population **180**;
   - finite cash/metrics throughout annual checks;
   - food/fuel/ore/build inventories remained non-negative;
   - sole player ship remained docked/stable;
   - no game-over state.
7. **Domain/Core function coverage** reported **83.5% (450/539 functions)**.
8. **Browser startup probe** passed with positive map-canvas size and no visible startup error.
9. **Mobile/browser presentation matrix** passed at:
   - 360×640;
   - 375×667;
   - 390×844;
   - 412×915;
   - 915×412 landscape.
10. **Multi-colony browser lifecycle** passed:
    - first contract completion and five-year renewal;
    - same-day contract/ship event ordering;
    - second-colony creation;
    - background/orphan ship recovery;
    - colony switching in both directions;
    - Corporation panel flow.
11. **Repeated UI lifecycle soak** passed over 20 cycles of Star Map, Cargo Bay, Corporation and Menu navigation, with bounds on:
    - active ResizeObservers;
    - window/document listener growth;
    - live DOM node growth.
12. **Pages deployment** passed.
13. Final `develop` → `CleanUp` comparison at `e633bf1f` is **359 ahead / 0 behind**.
14. PR #39 at `e633bf1f` reports **mergeable: true**, remains **open** and **draft**.

## Phase completion summary

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | Complete | Corrected inline-template baseline **50 → 0**; final `cb882c74`, Push `33070686760`, PR `33070691704`, Pages `33070686316`. |
| 5 — Feature controllers | Complete | Final `046ed701`, Push `33078938572`, PR `33078945708`, Pages `33078937342`. |
| 6 — CSS cleanup | Complete | Final `2df89fde`; zero orphan CSS; Push `33081571679`, PR `33081577146`, Pages `33081569786`. |
| 7 — Final validation | **Complete** | Final technical head `e633bf1f`; Push `33087964519`, PR `33087970503`, Pages `33087964360`; 25-year soak + browser matrix green. |

## Important architecture decisions to preserve

### Controller ownership

Modern semantic controller chain is test-locked:

`ship-preparation` → `ship-navigation` → `player-ship` → `expansion` → `adaptive-building` → `resource-development` → `trade-reserve` → `corporate-events` → `operational-controls` → `map-first` → `technology-presentation` → `cash-policy` → legacy composed `ui-controller`.

Deleted compatibility bridges must stay absent:
- `js/ui/building-details-ui.js`
- `js/ui/survival-presentation-ui.js`

Remaining prototype-qualified `.call(this)` dispatches are intentional manual-super boundaries required by the legacy multiple-mixin composition. `tests/controller-owner-map.test.js` locks them. Do not rewrite the inheritance/mixin system casually.

### Presentation ownership

- static application markup belongs in `/views`;
- repeated rows/controls use templates/fragments and bounded replacement;
- large embedded application HTML template debt must remain zero;
- async views must reject stale state/hosts and must not delay `DOMContentLoaded` registration;
- production UI should render/dispatch, not own gameplay rules.

### CSS ownership

`index.html` loads exactly these 12 CSS files, in cascade order, and `/css` contains no other stylesheet:

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

`css/building-details.css` is intentionally deleted. Two inert `classList.remove("building-detail-panel")` calls remain in active controllers; nothing adds or styles that class. Phase 6 explicitly chose not to rewrite large stable controllers merely to remove those harmless no-op tokens.

### State/domain/lifecycle rules

- `GameStore` owns mutable root state.
- Domain services own gameplay rules and authoritative mutation.
- Domain modules never import UI code or render application HTML.
- No application state on `window`.
- No document-level application event bus.
- Every listener/observer/timer/RAF needs a clear owner/disposal lifetime.
- No version-suffixed production JS/CSS, import maps or internal version-query imports.
- Preserve mobile/touch behaviour and gameplay semantics.

## Protected unrelated work

Do not overwrite, revert, reformat or replace these unrelated user asset changes:
- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Merge procedure — requires explicit user approval

The cleanup is technically validated and ready to merge, but **do not merge automatically**.

After the user explicitly approves merging PR #39:

1. Re-read `CleanUp`, `develop`, and PR #39 immediately before mutation.
2. Require PR head to still be the validated final handoff head (or a later documentation-only fully green head).
3. Require `develop` to remain an ancestor / comparison `behind_by = 0`.
4. Require PR #39 to remain mergeable and checks green.
5. Mark PR #39 ready for review if GitHub requires draft removal before merge.
6. Merge PR #39 into `develop` using the repository’s normal merge strategy; do not force-push or bypass failed checks.
7. Verify the resulting `develop` head and its post-merge workflow/Pages state.
8. Only after that consider the `CleanUp` work complete/archivable.

No further cleanup/refactor changes should be added to `CleanUp` before the merge unless a newly discovered validation failure requires a targeted fix.
