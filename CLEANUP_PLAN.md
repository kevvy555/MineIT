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

Status captured 2026-08-27 while preparing Phase 4D.2.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last fully green checkpoint | `227101c8` — Phase 4D.1 external help-manual ownership |
| Current checkpoint | Phase 4D.2 — externalize remaining V55 workforce/transport/renewable cards |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML views |
| Merge readiness | Not ready; Phases 4–7 still have work |

## Green checkpoint history relevant to current work

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` — lexical template detector introduced; scanner itself correct, checkpoint failed because the old plan assumed only 29 findings.
- `7153e30e` — corrected detector baseline locked at 50 genuine large templates; all gates green.
- `80bee13b` — help-manual production ownership change reached the expected 43-template map but exposed a stale Quality wording assertion.
- `b0d3123d` — aligned Quality assertion; then exposed the analogous stale Deposits assertion.
- `227101c8` — final help regression alignment; PR Test, Push Test, browser interaction/coverage and Pages all green. Phase 4D.1 is complete with 43 genuine templates.

The two 4D.1 corrective commits changed tests/plan only after the original production extraction. They did not mask runtime failures: the architecture map was 43 throughout, and the final green run exercised the full Node and browser suites.

## Phase 4D.1 — complete and green: external help manual ownership

The player-visible field-manual text is now owned by `views/survival-manual.html` rather than a Survival → Industry → V55 chain of post-render HTML replacements.

- `SurvivalUIMixin.help()` is the single manual renderer.
- `IndustryUIMixin.help()` and `V55UIMixin.help()` were removed.
- Final V55 wording for Industry, Controls, Quality, Deposits, Sites, Technology, Trade, Portfolio and Game Log/Save is in the external view.
- Dynamic values remain supplied by existing CONFIG/services.
- No gameplay/domain rules changed.
- Accurate template debt fell from 50 to 43; `v55-ui.js` fell from 11 to 4.

## Current Phase 4D.2 checkpoint — remaining V55 operation cards

Target: the final four measured large templates in `js/ui/v55-ui.js`.

### Implementation

1. Add three semantic external views:
   - `views/operational-workforce.html`;
   - `views/dedicated-colony-transport.html`;
   - `views/renewable-harvest.html`.
2. `V55UIMixin` loads those views through the existing cached `loadViewTemplate()` boundary.
3. The operational-workforce card keeps the same Available/Required/Free/Contract Age values, shortfall marker and workforce-priority explanation.
4. The dedicated-transport card keeps the same supported capacity, pending population, ETA/cost rows, blocked state, quick quantities, MAX and custom request controls.
5. Pending transport rows use the external `<template data-transport-order-template>`, cloned into a `DocumentFragment`, followed by one `replaceChildren()` on the row host. The old `map(...).join("")` row loop is removed.
6. Transport clicks are delegated to the inserted transport-card root. The listener dies with that subtree when the colony panel is replaced; it is not attached to `document`/`window` or a persistent global host.
7. Colony-card async rendering checks both a revision and `body.isConnected`/current modal body before inserting, preventing a slow first fetch from writing into a later panel.
8. Renewable-harvest rendering checks its revision plus `anchor.isConnected` before inserting into a tile panel.
9. Renewable buttons remain owned by the inserted renewable-card subtree and rerender the tile after a successful action.
10. The direct UI assignment `tile.harvestIntensity = ...` is removed. `ResourceService.adjustHarvestIntensity(tile, deltaPercent)` now owns normalization/clamping/assignment and returns `{ok,before,after,sustainableRate}`. This is behaviour-preserving but restores the required domain source-of-truth boundary.
11. `requestTransport()` remains the UI command wrapper around `TransportService.request()`; no transport rules move into UI.
12. Existing Housing/Industry/Emergency and Develop/Upgrade audit logging is preserved, split into small named helpers while touching the surrounding methods.
13. `tests/operation-card-views.test.js` locks external ownership, reusable transport-row fragments, bounded listener/lifecycle markers, domain-owned harvest mutation and executable 25%/clamp behaviour.
14. `package.json` runs the new focused test.
15. Architecture debt is expected to fall from 43 to **39**, removing `js/ui/v55-ui.js` from the debt map entirely.
16. External `/views` inventory rises from 24 to **27**.
17. Do not start the technology-presentation checkpoint until PR Test, Push Test and Pages are green on this commit.

## Expected verified debt after Phase 4D.2

| File | Findings |
|---|---:|
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
| **Total** | **39** |

`js/ui/v55-ui.js` must be absent from the measured debt map after this checkpoint.

## Branch relationship with `develop`

Immediately before Phase 4D.2, `CleanUp` is **327 commits ahead of and 2 commits behind** `develop`. The two later `develop` commits remain `15abe0d` (`Added levels`) and merge commit `01d56b2`. Effective missing content is still only the ten level images `assets/art/levels/L1.png` through `L10.png`.

Do not mix that reconciliation into Phase 4. Reconcile it in the controlled Phase 7 checkpoint and rerun the complete suite/browser matrix.

### Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

Connector-authored checkpoints write only explicit repository paths and do not touch these local changes.

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own game rules and state mutation. UI renders derived/service values and dispatches commands only.
- Domain modules never import UI modules or render application HTML.
- No application state on `window`; no document-level application event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Repeated UI uses cloned templates/`DocumentFragment` and bounded host replacement; no `innerHTML` row loops.
- Static application markup belongs in `/views`.
- No version-suffixed production JS/CSS, import-map routing or internal version-query imports.
- The exact per-file large-template map is an architecture guard and changes only in a reviewed extraction checkpoint.
- Keep new/refactored functions small and single-purpose; add brief JSDoc to non-obvious contracts during the cleanup/refactor pass.

## Phase tracker

| Phase | State | Evidence / remaining exit condition |
|---|---|---|
| 0 — Test baseline | Complete | Regression, architecture, save/load, lifecycle and coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JavaScript. |
| 2 — Startup/import cleanup | Complete | Zero import maps and internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Baseline corrected to 50; 4D.1 green at 43; 4D.2 targets 39 and zero V55 large-template debt. |
| 5 — Feature controllers | Pending formal pass | Inherited/mixin ownership decomposition remains. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS already zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Branch reconciliation, browser/mobile matrix, campaign/save/load/lifecycle/long-soak sign-off remain. |

## Exact next step after Phase 4D.2 is green

### Phase 4D.3 — `technology-presentation-ui.js` (9 findings)

Before editing:

1. inspect all `technology-presentation-ui.js` methods and overrides/callers so only active presentation paths are extracted;
2. inventory the nine actual templates under the corrected scanner, not the older regex assumptions;
3. reuse existing technology/manual views where ownership is clear; otherwise add semantic external views/fragments;
4. preserve TechnologyService as the source of truth for levels, unlocks, costs and purchase rules;
5. preserve existing mobile classes, buttons and any stale-render/lifecycle boundaries;
6. add focused ownership/behaviour tests;
7. update the exact debt map and this plan in the same commit;
8. require all remote gates green before moving to `land-ui.js`.

## Remaining Phase 4 queue after technology presentation

1. `land-ui.js` — 6.
2. `colony-tech-ui.js` — 5.
3. `resource-ui.js` — 4.
4. `ui-enhancements.js` — 4.
5. `adaptive-building-ui.js` — 2.
6. `quick-trade-ui.js` — 2.
7. `survival-ui.js` — 2.
8. Single-finding families: `building-details-ui.js`, `contract-ui.js`, `industry-ui.js`, `map-first-ui.js`, `resource-development-ui.js`.

Phase 4 exits only when genuine large-template debt reaches zero, static application markup has clear external ownership, remaining controller strings are small/dynamic and justified, and full Node/browser CI remains green.

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each method to one feature owner, and decompose presentation orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation. Preserve store/domain/service boundaries and remove shadowed methods per green checkpoint.

Phase 5 exits when the inherited/mixin controller chain is gone and every UI responsibility has one named owner.

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, keep versioned CSS at zero, and run visual/browser regression.

## Phase 7 — final validation and merge gate

1. Reconcile the ten level images from `develop`; verify no unexpected code divergence.
2. Run full Node regression/coverage suite.
3. Run supported mobile/browser viewport matrix.
4. Exercise full multi-colony/interstellar campaign flow.
5. Run representative save/load compatibility round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only then should draft PR #39 be merged into `develop`.
