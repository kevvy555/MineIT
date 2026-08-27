# MineIT Cleanup Plan and Live Handoff

This document is the canonical progress record for the `CleanUp` branch. It must be sufficient to resume after a lost chat without relying on conversation history. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved.

## Checkpoint procedure

1. Verify branch/PR/divergence before editing and preserve unrelated user asset work.
2. Make one cohesive ownership change, with focused regression/architecture coverage.
3. Prefer fewer, larger-but-related checkpoints when the ownership boundary is clear. Do not weaken the exact architecture guard or full remote Test/browser/Pages gates.
4. Connector-authored work uses GitHub Push Test + PR Test + browser interaction/coverage + Pages as the executable authority because the local runtime cannot resolve `github.com`.
5. Update this plan at each successful green checkpoint and in the same functional checkpoint when practical. Transient stale-test correction commits do not require a separate plan-only commit; their cause/evidence is recorded in the next green checkpoint.
6. Do not advance a new checkpoint onto `CleanUp` until the prior checkpoint is green.

## Current repository status

Status captured 2026-08-27 while preparing Phase 4D.3.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last fully green checkpoint | `3d03bc53` — Phase 4D.2 V55 operation-card extraction + stale-test alignment |
| Current checkpoint | Phase 4D.3 — externalize all nine `technology-presentation-ui.js` large templates |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML views |
| Branch relationship | 329 commits ahead / 2 behind `develop` before 4D.3 |
| Merge readiness | Not ready; Phases 4–7 still have work |

## Green checkpoint history

- `a217a509` — active ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` — lexical template detector introduced; scanner correct, but old expected count was wrong.
- `7153e30e` — corrected lexical-scanner baseline locked at 50 genuine templates; green.
- `227101c8` — Phase 4D.1 external help-manual ownership; 50 → 43; green.
- `7bccaca7` — Phase 4D.2 production extraction removed the final four V55 large templates and produced the expected 39-template architecture map. Its first Push Test stopped on a stale `global-expansion.test.js` assertion that still expected `DEDICATED COLONY TRANSPORT` / `RENEWABLE HARVEST` literals inside `v55-ui.js`; focused operation-card ownership and the 39-template guard had already passed.
- `3d03bc53` — aligned that legacy regression assertion with the external views. Full Push Test `33047421531`, PR Test `33047425532`, browser interaction/coverage and Pages `33047420869` all passed. Phase 4D.2 is complete.

## Phase 4D.2 — complete and green

Phase 4D.2 externalized:

- operational workforce card → `views/operational-workforce.html`;
- dedicated colony transport card and repeated pending-order rows → `views/dedicated-colony-transport.html`;
- renewable harvest card → `views/renewable-harvest.html`.

Important architecture outcomes:

- pending transport rows are cloned from an external `<template>` into a `DocumentFragment` and replaced in one bounded host operation;
- card listeners are owned by their inserted subtrees rather than `document`/`window`;
- delayed external-view loads check current/connected hosts before insertion;
- V55 no longer directly assigns `tile.harvestIntensity`; `ResourceService.adjustHarvestIntensity()` owns that clamp/assignment path;
- `v55-ui.js` is absent from the corrected large-template debt map.

Verified debt after 4D.2:

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

## Current Phase 4D.3 — technology presentation ownership

The corrected scanner shows exactly nine large templates in `js/ui/technology-presentation-ui.js`:

1. build-choice screen shell/options/locked requirements;
2. local-building detail panel;
3. local-infrastructure colony card;
4. technology-path wrapper;
5. technology roadmap card;
6. technology screen shell;
7. Industry/Power/local-capacity manual section;
8. Buildings/extraction/overdrive manual section;
9. Corporation-technology manual section.

### 4D.3 implementation contract

1. Add semantic external views:
   - `views/build-choice.html`;
   - `views/local-building-panel.html`;
   - `views/local-infrastructure-card.html`;
   - `views/corporate-technology.html`.
2. Populate repeated construction options, locked-requirement rows, technology paths and technology cards by cloning external `<template>` elements into `DocumentFragment`s, followed by bounded `replaceChildren()` calls.
3. Preserve all existing DevelopmentService / TechnologyService / building-model calculations and action paths. UI continues to render/dispatch only.
4. Preserve build-over-resource confirmation behavior, local building upgrade/demolish behavior, future-tech toggle, purchase access/cost disabling, ownership/current/next/future states and technology effects.
5. Local-infrastructure insertion must verify that the modal body is still connected/current after asynchronous view loading before it writes.
6. Replace small company metric `innerHTML` construction with explicit DOM nodes while touching the same ownership area.
7. Move the three v5.7 help sections into `views/survival-manual.html` and remove `technology-presentation-ui.js` post-render help replacement entirely. Later map-first/corporate/trade help layers were inspected: they replace the intro and/or controls only, not these Industry/Sites/Technology sections, so this preserves final player-visible content.
8. `tests/technology-view-ownership.test.js` must lock external path ownership, template-cloning/bounded DOM markers, no `innerHTML` rebuilding of extracted screens, and no technology help override.
9. Update `tests/how-to-play.test.js` so retained v5.7 rules are asserted in `views/survival-manual.html`, not the old controller source.
10. Update exact architecture debt from 39 to **30** and require `technology-presentation-ui.js` to be absent from the measured map.
11. Add the focused test to `npm test`.
12. Require Push Test, PR Test, browser interaction/coverage and Pages green before advancing.

Expected debt after 4D.3:

| File | Findings |
|---|---:|
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
| **Total** | **30** |

## Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

Connector-authored checkpoints write only explicit repository paths and do not touch these local files.

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules and authoritative game-state mutation; UI renders derived values and dispatches commands.
- Domain modules never import UI modules or render application HTML.
- No application state on `window`; no document-level application event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Repeated UI uses external templates, cloned fragments and bounded host replacement; no `innerHTML` row loops.
- Static application markup belongs in `/views`.
- No version-suffixed production JS/CSS, import-map routing or internal version-query imports.
- The exact corrected lexical-scanner debt map changes only in a reviewed extraction checkpoint.
- Keep refactored functions small/single-purpose and preserve mobile interaction behavior.

## Phase tracker

| Phase | State | Evidence / exit condition |
|---|---|---|
| 0 — Test baseline | Complete | Regression, architecture, save/load, lifecycle and coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JavaScript. |
| 2 — Startup/import cleanup | Complete | Zero import maps and internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Corrected baseline 50; 4D.1 green 43; 4D.2 green 39; 4D.3 targets 30. |
| 5 — Feature controllers | Pending formal pass | Inherited/mixin ownership decomposition remains. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Branch reconciliation, mobile/browser matrix, campaign/save/load/lifecycle/soak sign-off. |

## Next queue after Phase 4D.3 is green

To keep the faster-but-safe cadence, prefer cohesive ownership batches rather than one template per commit, but do not combine unrelated controllers merely to reduce CI count.

1. `land-ui.js` — 6 findings. This is the next high-impact owner and should be one coherent land-presentation checkpoint if its six templates share the same panel/view boundary.
2. `colony-tech-ui.js` — 5.
3. `resource-ui.js` — 4.
4. `ui-enhancements.js` — 4.
5. Consider one combined small-family checkpoint only after inspection proves common ownership/lifecycle behavior: `adaptive-building-ui.js` 2, `quick-trade-ui.js` 2, `survival-ui.js` 2.
6. Single-finding families: `building-details-ui.js`, `contract-ui.js`, `industry-ui.js`, `map-first-ui.js`, `resource-development-ui.js`.

Phase 4 exits only when genuine large-template debt reaches zero, static markup has clear external ownership, and full Node/browser CI remains green.

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each method to one feature owner, and decompose presentation orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation. Preserve store/domain/service boundaries and remove shadowed methods per green checkpoint.

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, keep versioned CSS at zero, and run visual/browser regression.

## Phase 7 — final validation and merge gate

1. Reconcile the two `develop` commits; effective missing content is still the ten level images `assets/art/levels/L1.png`–`L10.png`.
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
