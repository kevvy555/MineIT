# MineIT Cleanup Plan and Live Handoff

This document is the canonical progress record for the `CleanUp` branch. It is intended to be sufficient to resume work after a lost chat or interrupted session without relying on conversation history.

The refactor simplifies MineIT without intentionally changing game behaviour. `CleanUp` is not ready to merge into `develop` until Phase 7 is complete.

## Mandatory checkpoint procedure

Every completed refactor checkpoint must update this document in the same commit as its code and tests. Do not leave progress or the next action only in chat.

For each checkpoint:

1. Verify the current branch, remote head, pull request, and worktree before editing.
2. Identify and preserve unrelated worktree changes.
3. Make one bounded, behaviour-preserving change.
4. Run the most relevant targeted tests.
5. Run the full offline suite with `npm --offline test` when a local worktree is available.
6. Update this plan with:
   - the phase and subtask completed;
   - test and architecture evidence;
   - current measurements;
   - known risks and protected files;
   - the exact next logical step.
7. Commit and push code, tests, and this plan together.
8. Verify the new GitHub Actions runs. PR checks are the authoritative remote result.

If a checkpoint is not green, record the failure and do not advance the phase marker. When operating through the GitHub connector without a local checkout, do not claim a local test run; use syntax/static checks before commit and the PR/Push Test workflows as the executable checkpoint gate.

## Current repository status

Status captured on 2026-08-27 while preparing the Phase 4B sortable planet-table checkpoint. Phase 4A head `a217a509` has green PR Test, Push Test, and Pages runs. Phase 4B must receive the same three green remote results before Phase 4C begins.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last green implementation checkpoint | `a217a509` — Phase 4A, externalize active ship cargo/fuel rows |
| Current implementation checkpoint | Phase 4B — externalize sortable planet table; commit containing this handoff |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML views |
| Local regression suite | Phase 4A green. Phase 4B is being committed from a connector-only environment; touched JavaScript receives syntax checks and GitHub PR/Push Test are the executable gate. |
| Remote checks | Phase 4A green: PR Test, Push Test, and Pages. Verify all three on the Phase 4B commit before 4C. |
| Domain/core coverage gate | 80% minimum function coverage in CI |
| Merge readiness | Not ready; Phases 4–7 still have work |

### Branch relationship with `develop`

Immediately before the Phase 4B commit, `CleanUp` is 321 commits ahead of and 2 commits behind `develop`. The two later `develop` commits are `15abe0d` (`Added levels`) and merge commit `01d56b2`. The effective content missing from `CleanUp` remains limited to ten level images:

- `assets/art/levels/L1.png` through `assets/art/levels/L10.png`

This does not block Phase 4 view extraction. Reconcile `develop` into `CleanUp` in a controlled checkpoint before final Phase 7 validation, then rerun the complete suite and browser matrix.

### Protected unrelated worktree changes

These files were already modified outside the cleanup checkpoint and must not be staged, overwritten, reverted, or reformatted by cleanup commits:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

The current GitHub-connector checkpoint writes only explicit repository paths and does not touch those local worktree files. Recheck this list at the start of every checkpoint because the user may add more worktree changes.

## Non-negotiable order

1. Strengthen automated coverage before production refactoring.
2. Keep the full regression and browser suite green at every checkpoint.
3. Flatten versioned implementation chains into one canonical file per module.
4. Remove import-map compatibility routing and internal version-query imports.
5. Establish explicit state ownership and event/lifecycle boundaries.
6. Extract application views into HTML templates/fragments.
7. Split the monolithic UI/controller responsibilities by feature.
8. Consolidate versioned CSS into canonical feature styles.
9. Run final behavioural, save/load, lifecycle, and long-running soak tests.

Some later-phase mechanical cleanup was safely completed early, but the active phase advances only when its exit condition is met.

## Architecture rules

- `GameStore` owns mutable game state. Domain services own rules, not hidden mutable state.
- UI never calculates authoritative resource, population, or economy values and never mutates game state directly.
- Controllers dispatch commands and render view models/selectors.
- Domain modules never import UI modules or render application HTML.
- Cross-feature communication uses an injected local event bus, not `window`/`document` application events.
- No application state is attached to `window`.
- Every transient listener, observer, timer, and animation frame has an explicit disposal owner.
- Prefer stable hosts and event delegation for repeated content. If direct listeners are unavoidable, their owner must dispose them or the owning DOM subtree must be replaced as a unit.
- Repeating rows use cloned templates or `DocumentFragment`; populate with `textContent`, attributes, and classes, then perform one host replacement rather than an `innerHTML` loop.
- No versioned production module names such as `*-v123.js` once a subsystem is flattened.
- No internal JavaScript import query strings for cache/version routing.
- No import map hides the implementation that actually executes.
- Static application markup belongs in `/views` HTML templates rather than large controller template strings.
- Keep functions small, single-purpose, and named for their role. Add brief JSDoc where public or non-obvious contracts benefit.
- Git history is the backup; obsolete source files are deleted rather than moved to an in-repository backup folder.

## Phase tracker

| Phase | State | Evidence / remaining exit condition |
|---|---|---|
| 0 — Test baseline | Complete | Behaviour, save/load, architecture, lifecycle soak, and coverage-gate tests exist and are green. |
| 1 — Canonical modules | Complete | No versioned production JavaScript remains. |
| 2 — Startup/import cleanup | Complete | No import map or internal version-query imports remain. |
| 3 — State and events | Complete | `GameStore`, direct callbacks/event boundaries, disposal ownership, and zero application globals/document events are enforced. |
| 4 — HTML views | In progress | Phase 4A is green. Phase 4B externalizes the final measured `ship-preparation-ui.js` table debt into the 24th view; remote verification is required before 4C. |
| 5 — Feature controllers | Pending formal pass | Several semantic UI modules already exist, but the inherited/mixin controller chain still needs ownership-driven decomposition. |
| 6 — CSS cleanup | Partially complete early | Versioned production CSS is already zero. Final ownership and duplicate-rule audit follows Phase 5. |
| 7 — Final validation | Pending | Supported mobile matrix, full campaign flow, compatibility, lifecycle, long soak, and controlled `develop` reconciliation remain. |

## Current architecture measurements

Phase 4A verified measurements are the last fully green figures. Phase 4B is expected to change only the two rows marked below; the architecture workflow must confirm them before 4C.

| Guard / metric | Phase 4A verified | Phase 4B expected |
|---|---:|---:|
| Versioned production JavaScript files | 0 | 0 |
| Versioned production CSS files | 0 | 0 |
| Internal query-string imports | 0 | 0 |
| Import maps | 0 | 0 |
| Application global assignments | 0 | 0 |
| Application `document` events | 0 | 0 |
| External files in `/views` | 23 | 24 |
| Large HTML-template findings | 31 | 30 |

After Phase 4B, the expected real per-file findings are:

| File | Findings | Notes |
|---|---:|---|
| `js/ui/v55-ui.js` | 10 | Colony/help and general controller presentation debt |
| `js/ui/technology-presentation-ui.js` | 5 | Technology presentation panels |
| `js/ui/colony-tech-ui.js` | 4 | Colony technology panels |
| `js/ui/land-ui.js` | 4 | Land presentation and repeating rows |
| `js/ui/resource-development-ui.js` | 2 | Resource development presentation |
| `js/ui/resource-ui.js` | 2 | Resource summary presentation |
| `js/domain/expansion-service.js` | 1 | Known false positive: crude matching spans unrelated template literals beginning near a probe ID; domain code is not rendering HTML |
| `js/ui/industry-ui.js` | 1 | Industry presentation |
| `js/ui/ui-enhancements.js` | 1 | Enhanced technology toolbar |

`js/ui/ship-preparation-ui.js` should be absent from the debt list after this checkpoint. Do not weaken the ceiling to make it pass. Correct the known detector false positive separately in 4C.

## Completed phase evidence

### Phase 0 — test baseline

- Critical game-flow and mutation-boundary regression coverage is established.
- Save/load round-trip tests cover realistic multi-colony and ship state.
- Architecture guards cover forbidden globals, import direction, version splintering, external view ownership, and template debt.
- Lifecycle soak coverage checks listener, observer, and DOM stability.
- `.github/workflows/test.yml` records V8 coverage and runs `tests/coverage-report.js`.
- Domain/core function coverage has an 80% minimum CI gate.

### Phase 1 — canonical modules

- Active domain, UI support, world-view, and controller chains use canonical filenames.
- Obsolete versioned production JavaScript was removed instead of archived inside the repository.
- Architecture measurement: zero versioned production JavaScript files.

### Phase 2 — startup/import cleanup

- `app.js` imports canonical modules directly.
- Import-map compatibility routing was removed.
- Internal `?v=` and equivalent query-routed imports were removed.
- Architecture measurements: zero import maps and zero internal query-string imports.

### Phase 3 — state, events, and lifecycle

- Mutable game state has an application-owned `GameStore` boundary.
- Application communication no longer depends on global state assignments or `document` application events.
- Transient UI lifecycle resources have explicit disposal paths and soak coverage.
- Architecture measurements: zero application global assignments and zero application `document` events.

### Phase 4 — HTML views completed so far

The Phase 4B checkpoint raises the external view inventory from 23 to 24 files. Recent extraction work includes:

- demolition presentation view and debt checkpoint;
- corporation star-map screen view;
- star-map screen external rendering and debt checkpoint;
- canonical active-planet table checkpoint and removal of shadowed/overridden navigation rendering;
- player ship route view;
- removal of shadowed expansion presentation paths;
- player ship passenger view;
- active ship cargo/fuel rows, empty states, and action structure in `views/player-ship-prep.html`;
- sortable surveyed-planet table shell and reusable row/action fragments in `views/planet-table.html`.

Recent green checkpoint sequence, newest verified first:

| Commit | Checkpoint |
|---|---|
| `a217a509` | Extract active ship cargo/fuel row views and delegate preparation actions |
| `d211dd0` | Extract player ship passenger view |
| `4583fe0` | Remove shadowed expansion presentation paths |
| `167c7aa` | Extract player ship route view |
| `e83ac81` | Lock active planet table checkpoint |
| `5b3fb7e` | Follow active planet table override |
| `98a3964` | Remove overridden ship navigation planet table |
| `07ac25a` | Lock star map view debt checkpoint |
| `a3b8135` | Render star map screen from external view |
| `daf6ffc` | Extract corporation star map screen view |
| `02ae27c` | Lock demolition view debt checkpoint |

Phase 4A evidence: focused architecture, How to Play, map-first, and ShipExpansion tests passed; `npm --offline test` passed; the large-template ceiling dropped from 32 to 31; PR Test, Push Test, and Pages are green on `a217a509`.

## Exact Phase 4 execution queue

### 4A — complete and green: active ship cargo/fuel rows

Completed implementation:

1. `views/player-ship-prep.html` owns the fuel section, stable fuel/cargo hosts, reusable load-row fragment, reusable empty-state fragment, buttons, labels, and progress-bar structure.
2. `ship-preparation-ui.js` obtains cargo/fuel data from existing state and `ExpansionService`, clones external fragments, assigns values with DOM APIs, builds a `DocumentFragment`, and calls `replaceChildren` once per list.
3. One delegated click handler on the stable modal owns category, paging, cargo, fuel, passenger, back, and launch actions. `open()` and `dispose()` explicitly remove the handler.
4. Existing `ExpansionService` mutation methods remain the only cargo, fuel, passenger, and launch write paths.
5. Route/passenger templates still load in parallel and `shipPrepRevision` rejects stale asynchronous renders.
6. Ownership/regression tests require external hosts/fragments, DOM population, delegated listener ownership, and absence of embedded cargo/fuel row markup.
7. Local focused/full tests and all remote checks are green.
8. The measured ceiling fell from 32 to 31. The remaining `ship-preparation-ui.js` finding was the sortable planet table assigned to 4B.

### 4B — implementation complete; remote verification required: sortable planet table

Checkpoint implementation:

1. `views/planet-table.html` owns `.exp-planet-table-wrap`, the table/header/body shell, and reusable sort-header, row, colony-name, dock-action, and found-action fragments.
2. `planetSortValue()` and `sortedPlanets()` remain presentation-only sorting helpers. `planetSortIndicator()` preserves `▲`, `▼`, and `↕` exactly.
3. The controller clones external fragments, assigns safe text/datasets/classes, builds `DocumentFragment`s, and uses one `replaceChildren` call per header/body/action/colony host. No `innerHTML` row loop was introduced.
4. Existing technology checks, ship passenger state, colony occupancy, and living-colony data remain inputs from the existing services/state. The view preserves `COLONY EXISTS`, `NO COLONISTS`, `TECH LOCKED`, and `FOUND COLONY` exactly.
5. Dock and found buttons retain the existing canonical action path in `bindStarMapDetailActions()`; only sort clicks use a stable delegated listener.
6. `planetClickHandler` is explicitly removed by `open()`, `dispose()`, and rebinding so sort rerenders cannot accumulate listeners.
7. `starSystemDetailMarkup()` now awaits the external planet-table shell, and `starMap()` checks `starMapRevision` after that asynchronous step before loading the screen template. Existing stale-render protection therefore covers the new fetch boundary.
8. Mobile horizontal scrolling remains owned by `.exp-planet-table-wrap` and existing `ship-expansion.css`; no layout CSS changes are required.
9. `tests/planet-table-view.test.js` locks external fragment ownership, sorting/indicator markers, living-colony docking, founding labels/gates, DOM-fragment rendering, delegated listener disposal, stale-render guards, and the mobile table host class.
10. The architecture ceiling is lowered from 31 to 30. CI must verify that `ship-preparation-ui.js` disappears from the per-file debt list.
11. Touched JavaScript was syntax-checked before commit. This checkpoint is being created through the GitHub connector without a local checkout, so the PR/Push Test workflows are the executable full-suite gate rather than a falsely claimed local run.
12. Do not begin 4C until PR Test, Push Test, and Pages for this checkpoint are all green.

### 4C — next after 4B is green: correct the template detector false positive

Refine the large-template architecture detector so it counts actual HTML-bearing UI templates without matching unrelated domain template literals across statement boundaries. Keep or strengthen all real UI detections. Add a regression fixture proving:

- the `expansion-service.js` false positive is excluded;
- known UI template debt is still detected;
- the architecture ceiling cannot increase silently.

Expected result if only the known false positive is removed: total measured findings drop from 30 to 29 without changing production domain code.

### 4D — remaining view extraction order

Continue one bounded controller/view family per green checkpoint:

1. `v55-ui.js` colony/help presentation.
2. Technology panels in `technology-presentation-ui.js` and `colony-tech-ui.js`.
3. `land-ui.js` presentation and repeating rows.
4. `resource-development-ui.js` and `resource-ui.js`.
5. `industry-ui.js` and the enhanced technology toolbar in `ui-enhancements.js`.

For every item, externalize static markup, use cloned fragments for repeated rows, preserve revision/lifecycle guards, add ownership and behaviour tests, lower the measured ceiling only after verification, and update this plan in the same green commit.

Phase 4 exit condition: static application views are externally owned, remaining controller strings are small/dynamic and explicitly justified, all real large-template findings are removed, lifecycle behaviour is stable, and the full suite/CI are green.

## Phase 5 — feature controllers

After Phase 4, inventory the surviving inherited/mixin chain and map each method to a single feature owner. Build focused controllers for ship, star map, cargo, building, technology, trade, colony, and corporation flows as justified by the inventory.

Rules:

- move presentation orchestration, not domain calculations;
- preserve `GameStore`, selector, service, event, and disposal boundaries;
- remove shadowed methods as each owner becomes canonical;
- keep startup composition explicit and acyclic;
- checkpoint one feature at a time with focused tests, full-suite proof, plan update, push, and CI verification.

Phase 5 exit condition: no inherited/mixin UI-controller chain remains, every UI responsibility has one named owner, and the architecture/import/lifecycle suites are green.

## Phase 6 — CSS completion

Versioned CSS filenames are already eliminated. After controller ownership stabilizes:

1. map styles to their canonical feature/view owners;
2. remove duplicate, obsolete, and unreachable rules;
3. verify cascade/order and supported mobile breakpoints;
4. confirm there are still zero versioned production CSS files;
5. run visual/browser regression checks and the full suite.

Phase 6 exit condition: canonical feature styles have clear ownership, no compatibility/version layer remains, and supported layouts are unchanged.

## Phase 7 — final validation and merge gate

Before declaring `CleanUp` ready:

1. Reconcile the ten level images from `develop` in a controlled checkpoint and confirm no unexpected code divergence.
2. Run the full Node regression suite.
3. Run the full supported mobile viewport browser matrix.
4. Exercise a full multi-colony and interstellar expansion campaign flow.
5. Run save/load compatibility round trips using representative existing and current saves.
6. Run repeated panel/navigation lifecycle soak tests.
7. Run an accelerated long-running simulation soak.
8. Verify stable DOM, listener, observer, timer, and animation-frame counts.
9. Verify there are no startup/runtime diagnostics and all PR checks are green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only after every Phase 7 item is green should draft PR #39 be considered ready to merge into `develop`.
