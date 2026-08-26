# MineIT Cleanup Plan

This branch exists to simplify MineIT without changing game behaviour.

## Non-negotiable order

1. Strengthen automated coverage before production refactoring.
2. Keep the full regression + browser suite green at every checkpoint.
3. Flatten versioned implementation chains into one canonical file per module.
4. Remove import-map compatibility routing and internal version-query imports.
5. Establish explicit state ownership and event/lifecycle boundaries.
6. Extract application views into HTML templates/fragments.
7. Split the monolithic UI/controller responsibilities by feature.
8. Consolidate versioned CSS into canonical feature styles.
9. Run final behavioural, save/load, lifecycle and long-running soak tests.

## Architecture rules

- `GameStore` owns mutable game state. Domain services own rules, not hidden mutable state.
- UI never calculates authoritative resource/population/economy values and never mutates game state directly.
- Controllers dispatch commands and render view models/selectors.
- Domain modules never import UI modules.
- Cross-feature communication uses an injected local event bus, not `window`/`document` globals.
- No application state is attached to `window`.
- Every transient listener, observer, timer and animation-frame has an explicit disposal owner.
- No versioned production module names (`*-v123.js`) once a subsystem is flattened.
- No internal JavaScript import query strings for cache/version routing.
- No import map is used to hide the implementation actually executing.
- Static application markup belongs in `/views` HTML templates rather than large controller template strings.
- Git history is the backup; legacy source files are deleted from the project rather than moved to an in-repo backup folder.

## Phase 0 — test baseline

- Inventory existing behavioural coverage.
- Add behaviour tests for critical full game flows and mutation boundaries.
- Add save/load round-trip coverage using realistic multi-colony/ship state.
- Add architecture guards for forbidden globals, direction of imports and version-splintering.
- Add DOM/listener/observer lifecycle soak coverage.
- Add code coverage reporting for domain/core modules and CI reporting.

Exit condition: all baseline tests pass before production refactoring starts.

## Phase 1 — canonical modules

Flatten active domain service chains one subsystem at a time, then UI support modules, then WorldView/UIController. Each canonical file must contain the behaviour that is currently active in the browser. Delete obsolete versions after tests pass.

Exit condition: one source-of-truth file per production module and no behaviour regression.

## Phase 2 — startup/import cleanup

Remove the import map, legacy query-routing, and internal `?v=` module imports. `app.js` must directly import the file that actually runs.

## Phase 3 — state and events

Introduce an application-owned `GameStore` and injected `EventBus`. Remove global state leakage and document/window application event plumbing. Add explicit lifecycle/disposal helpers.

## Phase 4 — HTML views

Add a cached `TemplateRegistry` and persistent `ViewHost`. Extract static panel markup into `/views/*.html` templates. Repeating rows use cloned templates; controllers set `textContent`, attributes and classes rather than generating large HTML strings.

## Phase 5 — feature controllers

Replace the inherited/mixin UI-controller chain with focused controllers (ship, star map, cargo, building, technology, trade, colony/corporation). Keep domain calculations in domain/selectors.

## Phase 6 — CSS cleanup

Consolidate versioned styles into canonical feature CSS files and remove version suffixes.

## Phase 7 — final validation

- Full Node regression suite.
- Full supported mobile viewport browser matrix.
- Full multi-colony + interstellar expansion flow.
- Save/load compatibility round trip.
- Repeated panel/navigation lifecycle soak.
- Accelerated long-running simulation soak.
- Verify stable DOM/listener/observer counts and no startup/runtime diagnostics.

Only after Phase 7 is green should `CleanUp` be considered ready to merge to `develop`.
