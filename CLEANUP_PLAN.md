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

Status captured 2026-08-27 during the Phase 4C corrective checkpoint.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` into `develop` |
| Last fully green checkpoint | `2b2040ad` — Phase 4B sortable planet-table extraction |
| Current checkpoint | Phase 4C corrective baseline after detector fix |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML views |
| Merge readiness | Not ready; Phases 4–7 still have work |

### Phase 4C failure and correction

Commit `48c23b5` replaced the old crude backtick regex with a real template-literal scanner. The scanner regression fixtures passed and `js/domain/expansion-service.js` correctly disappeared from HTML debt, proving the original false positive was fixed.

CI then failed because the plan/test assumed the corrected total would be 29. The accurate scan instead found **50 genuine large HTML templates**. This was not a game/runtime regression; it exposed previously hidden presentation debt.

The verified Phase 4C distribution from GitHub CI is now the source of truth:

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

The architecture guard now locks both the exact total and exact per-file distribution. Each future HTML extraction checkpoint must deliberately reduce/update this map in the same commit. This prevents a weaker detector from silently making the debt count fall.

### Branch relationship with `develop`

Immediately before this corrective checkpoint, `CleanUp` is 323 commits ahead of and 2 commits behind `develop`. The two later `develop` commits are `15abe0d` (`Added levels`) and merge commit `01d56b2`. The effective missing content remains ten level images (`assets/art/levels/L1.png` through `L10.png`). Reconcile these in a controlled Phase 7 checkpoint; do not mix that work into Phase 4.

### Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules; UI never owns authoritative game state or economy/resource calculations.
- Controllers render view-model/service output and dispatch user actions.
- Domain modules never import UI modules or render application HTML.
- Cross-feature communication uses explicit callbacks/local event boundaries, not application globals/document events.
- No mutable application state on `window`.
- Every listener/observer/timer/RAF has a clear owner/disposal path.
- Repeated UI uses stable hosts, `DocumentFragment`, cloned templates and `replaceChildren`; no `innerHTML` row loops.
- No version-suffixed production modules or CSS.
- No internal import query strings or import-map compatibility routing.
- Static application markup belongs in `/views`.
- Keep functions small and single-purpose; add brief JSDoc for non-obvious contracts.

## Phase tracker

| Phase | State | Evidence / remaining exit condition |
|---|---|---|
| 0 — Test baseline | Complete | Regression, architecture, save/load, lifecycle and coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JavaScript. |
| 2 — Startup/import cleanup | Complete | Zero import maps and internal version-query imports. |
| 3 — State/events/lifecycle | Complete | `GameStore`, explicit boundaries/disposal, zero app globals/document events. |
| 4 — HTML views | In progress | 24 external views. Accurate baseline is 50 genuine embedded large HTML templates. Phase 4C correction must go green, then Phase 4D begins. |
| 5 — Feature controllers | Pending formal pass | Inherited/mixin controller ownership still requires decomposition. |
| 6 — CSS cleanup | Partially complete early | Versioned CSS already zero; ownership/duplicate audit follows Phase 5. |
| 7 — Final validation | Pending | Branch reconciliation, full mobile/browser matrix, campaign, save/load and soak sign-off remain. |

## Current architecture measurements

| Guard / metric | Current verified target |
|---|---:|
| Versioned production JavaScript files | 0 |
| Versioned production CSS files | 0 |
| Internal query-string imports | 0 |
| Import maps | 0 |
| Application global assignments | 0 |
| Application `document` events | 0 |
| External files in `/views` | 24 |
| Genuine large embedded HTML templates | 50 |

## Completed Phase 4 checkpoints

### 4A — active ship cargo/fuel rows — complete and green

- `views/player-ship-prep.html` owns fuel/cargo stable hosts, fragments, empty states and action structure.
- `ship-preparation-ui.js` renders with cloned fragments and one host replacement per list.
- One delegated click owner covers preparation actions and is explicitly released.
- `ExpansionService` remains the only mutation path.
- Async stale-render protection remains via `shipPrepRevision`.
- Debt under the old detector fell from 32 to 31 and all checks were green on `a217a509`.

### 4B — sortable planet table — complete and green

- `views/planet-table.html` owns table shell, sort headers, rows, colony and dock/found action fragments.
- Sorting keeps exact `▲`, `▼`, `↕` indicators.
- Founding/docking logic remains sourced from existing domain/state services.
- Exact labels `COLONY EXISTS`, `NO COLONISTS`, `TECH LOCKED`, `FOUND COLONY` remain unchanged.
- DOM-fragment rendering and explicit sort-listener release are enforced by regression tests.
- `starMapRevision` protects the new async view boundary.
- PR Test, Push Test, browser interaction tests, coverage and Pages are green on `2b2040ad`.

### 4C — template detector correction — current checkpoint

Implemented in `48c23b5`:

1. `tests/template-literal-scanner.js` lexically scans real JS template literals.
2. It handles escapes, nested `${...}`, nested templates, quoted strings and comments.
3. `tests/template-detector.test.js` proves false-pairing is excluded while genuine HTML remains detectable.
4. `expansion-service.js` no longer appears as HTML debt.

Failure discovered by CI:

- scanner fixture passed;
- architecture scan reported 50 genuine templates;
- old assumed ceiling 29 failed intentionally;
- browser stage was skipped because the architecture stage stopped the run.

Corrective checkpoint requirements:

1. Lock exact total at 50 and exact per-file debt map listed above.
2. Keep production code untouched.
3. Update this plan in the same commit.
4. Push and require PR Test, Push Test and Pages green.
5. Only then mark 4C complete and begin 4D.

## Phase 4D execution queue after 4C is green

Work one bounded presentation family per checkpoint. Because the corrected detector found more debt than the old scanner, the queue is expanded to cover every verified file.

1. `v55-ui.js` — 11 findings. Start with colony/help/general static panels; inspect existing `/views` first to avoid duplicate ownership.
2. `technology-presentation-ui.js` — 9 findings.
3. `land-ui.js` — 6 findings.
4. `colony-tech-ui.js` — 5 findings.
5. `resource-ui.js` — 4 findings.
6. `ui-enhancements.js` — 4 findings.
7. `adaptive-building-ui.js` — 2 findings.
8. `quick-trade-ui.js` — 2 findings.
9. `survival-ui.js` — 2 findings.
10. Single-finding families: `building-details-ui.js`, `contract-ui.js`, `industry-ui.js`, `map-first-ui.js`, `resource-development-ui.js`.

For every checkpoint:

- inspect callers/overrides first so there is one canonical path;
- externalize static markup only;
- keep all domain calculations/state ownership where they currently belong;
- use reusable fragments for repeating structures;
- preserve existing labels, actions, mobile classes and stale-render guards;
- update focused behaviour/ownership tests;
- update the exact architecture debt map and total only after reviewed extraction;
- update this plan, push, and wait for green CI before the next family.

Phase 4 exit condition: all genuine large-template findings are removed, application static markup is externally owned, remaining controller strings are small/dynamic and justified, lifecycle behaviour is stable, and CI/browser tests are green.

## Phase 5 — feature controllers

After Phase 4, inventory the surviving inherited/mixin chain and map every UI method to one feature owner. Decompose by ship/star map/cargo/buildings/technology/trade/colony/corporation as justified. Move presentation orchestration only, preserve domain/service/store boundaries, remove shadowed methods, and checkpoint each feature independently.

Phase 5 exit condition: no inherited/mixin UI-controller chain remains and every UI responsibility has a single named owner.

## Phase 6 — CSS completion

After controller ownership stabilizes:

1. map styles to canonical feature/view owners;
2. remove duplicate/obsolete/unreachable rules;
3. verify cascade/order and supported mobile breakpoints;
4. confirm zero versioned production CSS;
5. run visual/browser regression and full suite.

## Phase 7 — final validation and merge gate

Before PR #39 can leave draft/merge:

1. Reconcile the ten level images from `develop` and confirm no unexpected code divergence.
2. Run full Node regression/coverage suite.
3. Run supported mobile viewport/browser matrix.
4. Exercise a full multi-colony/interstellar campaign flow.
5. Run representative save/load compatibility round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only then should draft PR #39 be considered ready to merge into `develop`.
