# MineIT Cleanup Plan and Live Handoff

This document is the canonical progress record for the `CleanUp` branch. It must be sufficient to resume after a lost chat without relying on conversation history. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved.

## Mandatory checkpoint procedure

Every completed checkpoint must update this plan in the same commit as code/tests.

1. Verify branch, remote head, PR and branch divergence before editing.
2. Preserve unrelated worktree/user asset changes.
3. Make one bounded change.
4. Add or update focused regression/architecture tests.
5. Run the full suite locally when a checkout is available; connector-authored changes use GitHub PR/Push Test as the executable gate.
6. Record exact measurements, failures, risks and next step here.
7. Commit and push code/tests/plan together.
8. Do not advance until PR Test, Push Test and Pages are green.

## Current repository status

Status captured 2026-08-27 during the first Phase 4D extraction checkpoint.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last fully green checkpoint | `7153e30e` — Phase 4C corrected detector baseline |
| Current checkpoint | Phase 4D.1 — external help-manual ownership |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML views |
| Merge readiness | Not ready; Phases 4–7 still have work |

### Phase 4C — complete and green

The corrected lexical template scanner is now authoritative. Commit `48c23b5` fixed the false positive but initially failed because the old plan assumed 29 findings. GitHub CI proved the accurate baseline is 50 genuine large HTML templates. Corrective commit `7153e30e` locks both the exact total and per-file distribution; PR Test, Push Test, browser interaction/coverage and Pages are green.

Verified Phase 4C debt baseline:

| File | Findings |
|---|---:|
| `js/ui/v55-ui.js` | 11 |
| `js/ui/technology-presentation-ui.js` | 9 |
| `js/ui/land-ui.js` | 6 |
| `js/ui/colony-tech-ui.js` | 5 |
| `js/ui/resource-ui.js` | 4 |
| `js/ui/ui-enhancements.js` | 4 |
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/quick-trade-ui.js` | 2 |
| `js/ui/survival-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **50** |

## Current Phase 4D.1 checkpoint — external help manual ownership

Problem found during inspection:

- `views/survival-manual.html` already owns the field manual shell.
- `SurvivalUIMixin.help()` renders it.
- `IndustryUIMixin.help()` then appends additional Industry HTML.
- `V55UIMixin.help()` finally replaces nine sections with embedded template literals.
- Therefore the actual player-visible final text was not owned by the external view, and seven of the 11 `v55-ui.js` debt findings were those final help-section strings.

Behaviour-preserving implementation:

1. `views/survival-manual.html` now contains the exact final text that V55 previously displayed for Industry, Controls, Quality, Deposits, Sites, Technology, Trade, Portfolio and Saving/Game Log sections.
2. Dynamic values previously interpolated in V55 are explicit view placeholders populated by `SurvivalUIMixin.help()`:
   - workforce percentage;
   - site-output progression;
   - Industry processing bonus;
   - trade interval/export capacity/passenger capacity;
   - dedicated transport days;
   - game-log telemetry interval.
3. `V55UIMixin.help()` is removed; it no longer replaces externally owned sections after rendering.
4. `IndustryUIMixin.help()` and its now-unused Survival import are removed; Industry no longer appends markup after the external view renders.
5. The base `SurvivalUIMixin.help()` remains the single manual renderer and still owns template loading/caching, resource catalogue injection and help-index click behaviour.
6. No domain/service state or gameplay calculation changes.
7. `tests/how-to-play.test.js` now asserts the final visible V55 manual wording lives in `views/survival-manual.html`, dynamic bindings remain present, and V55/Industry no longer own post-render help markup.
8. Architecture debt is expected to fall from 50 to 43. `v55-ui.js` falls from 11 to 4; every other measured file remains unchanged.
9. Do not start 4D.2 until PR Test, Push Test and Pages for this checkpoint are green.

Expected debt after this checkpoint:

| File | Findings |
|---|---:|
| `js/ui/technology-presentation-ui.js` | 9 |
| `js/ui/land-ui.js` | 6 |
| `js/ui/colony-tech-ui.js` | 5 |
| `js/ui/resource-ui.js` | 4 |
| `js/ui/ui-enhancements.js` | 4 |
| `js/ui/v55-ui.js` | 4 |
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/quick-trade-ui.js` | 2 |
| `js/ui/survival-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **43** |

### Branch relationship with `develop`

Before this 4D.1 checkpoint, `CleanUp` is 324 commits ahead of and 2 commits behind `develop`. The effective missing content remains the ten level images (`assets/art/levels/L1.png`–`L10.png`). Reconcile them only in the controlled Phase 7 checkpoint.

### Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules; UI never owns authoritative game state or economy/resource calculations.
- Controllers render service/view-model output and dispatch actions.
- Domain modules never import UI modules or render application HTML.
- No application state on `window`; no document-level application event bus.
- Every listener/observer/timer/RAF has an explicit owner/disposal path.
- Repeated UI uses stable hosts, cloned templates/`DocumentFragment` and bounded host replacement; no `innerHTML` row loops.
- No version-suffixed production JS/CSS, import-map routing or internal version-query imports.
- Static application markup belongs in `/views`.
- The exact per-file HTML debt map is an architecture guard and must only change with a reviewed extraction checkpoint.

## Phase tracker

| Phase | State | Evidence / remaining exit condition |
|---|---|---|
| 0 — Test baseline | Complete | Regression, architecture, save/load, lifecycle and coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JavaScript. |
| 2 — Startup/import cleanup | Complete | Zero import maps and internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Accurate baseline 50. 4D.1 targets external help ownership and expected debt 43. |
| 5 — Feature controllers | Pending formal pass | Inherited/mixin ownership decomposition remains. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS already zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Branch reconciliation, browser/mobile matrix, campaign/save/load/lifecycle/long-soak sign-off remain. |

## Completed Phase 4 checkpoints

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` — lexical template detector introduced; scanner correct but checkpoint failed on obsolete 29-count assumption.
- `7153e30e` — exact 50-template corrected baseline locked; all remote checks green.

## Exact next step after 4D.1 is green

### 4D.2 — finish remaining `v55-ui.js` large presentation templates

The four expected remaining findings are the operational-workforce card, dedicated-transport card/action block (including its large nested action template), and renewable-harvest card.

Implementation contract:

1. Inspect existing colony/tile view ownership before editing.
2. Externalize the three static card families into reusable view fragments/hosts rather than creating new controller HTML strings.
3. Preserve all current workforce, supported-capacity, transport-blocking, harvest-intensity and ecological-condition values as data supplied by existing services/state.
4. Keep `requestTransport()` and existing renewable-harvest mutation paths authoritative; UI only renders and dispatches actions.
5. Prefer one delegated action owner or explicit listener release so panel rerenders cannot accumulate listeners.
6. Add focused ownership/behaviour tests and update the exact architecture map.
7. Expected goal: remove `v55-ui.js` from large-template debt entirely before moving to `technology-presentation-ui.js`.
8. Update this plan and require all remote gates green.

## Remaining Phase 4D queue

After `v55-ui.js` reaches zero:

1. `technology-presentation-ui.js` — 9.
2. `land-ui.js` — 6.
3. `colony-tech-ui.js` — 5.
4. `resource-ui.js` — 4.
5. `ui-enhancements.js` — 4.
6. `adaptive-building-ui.js` — 2.
7. `quick-trade-ui.js` — 2.
8. `survival-ui.js` — 2.
9. Single-finding families: `building-details-ui.js`, `contract-ui.js`, `industry-ui.js`, `map-first-ui.js`, `resource-development-ui.js`.

Phase 4 exits only when genuine large-template debt reaches zero and the full suite/browser checks remain green.

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each method to one feature owner, then decompose presentation orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation. Preserve store/domain/service boundaries and remove shadowed methods per green checkpoint.

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete rules, verify cascade/mobile breakpoints, keep versioned CSS at zero, and run visual/browser regression.

## Phase 7 — final validation and merge gate

1. Reconcile ten level images from `develop`; verify no unexpected code divergence.
2. Full Node regression/coverage suite.
3. Supported mobile/browser viewport matrix.
4. Full multi-colony/interstellar campaign flow.
5. Representative save/load compatibility round trips.
6. Repeated navigation/panel lifecycle soak.
7. Accelerated long simulation soak.
8. Stable DOM/listener/observer/timer/RAF counts.
9. No startup/runtime diagnostics; all PR checks green.
10. Final plan evidence and explicit merge approval.

Only then should draft PR #39 be merged into `develop`.
