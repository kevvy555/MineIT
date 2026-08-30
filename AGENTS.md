# MineIT AI Development Contract

This file is the authoritative repository-level development guidance for AI coding agents working on MineIT.

## Before writing code

1. Read this `AGENTS.md` file in full before making any code change.
2. Read the relevant existing implementation, tests, and architecture/recovery documentation before deciding where a change belongs.
3. Identify the canonical owner of the behaviour before creating or modifying production code.
4. For substantial new features or architectural changes, briefly explain the intended design first. If the user has already approved the approach or explicitly says `proceed`, continue without asking for another approval.

## Project context

MineIT is a mobile-first game built with vanilla HTML, CSS, and modular JavaScript.

Primary code areas:

- `js/core/` — generic infrastructure and low-level utilities.
- `js/data/` — static definitions/configuration/data.
- `js/domain/` — gameplay rules, authoritative mutation, services, and state-related domain behaviour.
- `js/ui/` — presentation/controllers that render state and dispatch user intent.
- `views/` — static and reusable HTML templates/fragments.
- `tests/` — architecture, unit, regression, simulation, and browser probes.

`GameStore` owns the mutable root application state. Domain services own gameplay rules and authoritative mutation. UI code renders and dispatches; it must not become the source of truth for gameplay.

## Non-negotiable architecture rules

### 1. No version splintering

Never create version-suffixed, replacement, duplicate, `new`, `old`, `copy`, temporary, hotfix, or compatibility production files as a development strategy.

Bad examples include:

- `world-view-v2.js`
- `ui-controller-v570.js`
- `resource-service-new.js`
- `map-controls-fixed.js`
- `app-copy.js`

Modify the canonical implementation in place. If an implementation is replaced, remove the superseded implementation in the same coherent change.

Do not introduce JavaScript/CSS import maps or version-query module imports such as `module.js?v=12` to keep multiple production implementations alive. Existing image/asset cache-busting conventions are separate from module ownership and should not be broadened into JS/CSS versioning.

### 2. Canonical ownership

Before creating a production module, determine whether a canonical owner already exists for that responsibility. Extend or refactor that owner rather than creating a parallel implementation.

A feature should have one clear semantic owner. Do not preserve shadow implementations, dead wrappers, compatibility bridges, or duplicate rendering paths without a demonstrated live requirement.

### 3. Domain is the gameplay source of truth

Mutable game state and gameplay rules belong to the domain layer. Static definitions/configuration may live in `js/data/`.

UI modules may:

- render state;
- format presentation data;
- manage local transient view state;
- dispatch user actions to the appropriate service/controller.

UI modules must not become authoritative owners of gameplay state, economy rules, simulation rules, pricing, progression, inventory truth, or other domain decisions.

### 4. State ownership

`GameStore` owns the mutable root state. Do not place application state on `window`, `document`, DOM nodes, or other global objects.

Preserve stable root-state ownership. Route authoritative mutations through the appropriate domain service instead of directly mutating state from UI code.

### 5. Keep dependencies directional and explicit

Avoid circular dependencies and hidden coupling. Prefer constructor injection, explicit callbacks, service APIs, and `GameStore` subscriptions.

Do not introduce a document-level/global application event bus. Do not use global `CustomEvent` or `EventTarget` plumbing as a substitute for clear ownership. Local event mechanisms are acceptable only when they have an explicit owner and lifecycle.

### 6. View ownership

Static and repeated UI markup belongs in external `views/` templates/fragments rather than large JavaScript HTML strings.

Use bounded DOM replacement and reusable templates for repeated rows/cards. Keep JavaScript responsible for behaviour and data binding rather than owning large static layouts.

### 7. Lifecycle ownership

Every event listener, observer, timer, interval, animation-frame callback, subscription, and other long-lived browser resource must have clear ownership and cleanup/disposal where applicable.

Do not add listeners repeatedly during render/open cycles without removing or reusing them.

### 8. Async UI safety

Async external views must reject stale writes. Before applying async UI results, verify the current modal/panel/tile/active-object context still matches the request that initiated the work.

Preloading should be non-blocking. Do not use module-scope `await` for eager view loading if it can delay application startup or `DOMContentLoaded` behaviour.

## Development principles

### SOLID, applied pragmatically

Use SOLID principles as design guidance, not as a reason to create unnecessary abstractions:

- **Single Responsibility:** a module/function/class should have one clear reason to change.
- **Open/Closed:** prefer extending behaviour through the existing semantic owner and stable interfaces rather than copying implementations.
- **Liskov Substitution:** subclasses/mixins/implementations must preserve the behavioural expectations of their parent/interface contracts.
- **Interface Segregation:** pass the smallest useful dependency/API rather than giving modules broad access they do not need.
- **Dependency Inversion:** depend on explicit service/controller abstractions and injected collaborators rather than hidden globals.

### KISS

Choose the simplest design that cleanly satisfies the requirement. Avoid clever indirection when an explicit solution is easier to understand and test.

### DRY without premature abstraction

Do not duplicate meaningful business logic or presentation behaviour. Extract genuine repetition, but do not create generic frameworks for code that only happens once or may never need reuse.

### YAGNI

Do not build speculative compatibility layers, unused extension points, premature feature flags, or future-facing abstractions without a current requirement.

### Separation of concerns

Keep simulation/domain rules, state ownership, presentation, persistence, and infrastructure concerns separate. Do not fix a UI problem by moving gameplay rules into the UI, or fix a domain problem with DOM-specific logic.

### Small coherent changes

Prefer the smallest coherent change that fully fixes or implements the requested behaviour. Do not mix unrelated refactors, formatting sweeps, renames, or architecture changes into a feature/bug-fix commit.

When touching an area, leave the touched code clean, but report unrelated technical debt separately rather than expanding scope automatically.

### Readable code

Use descriptive names and cohesive functions. Extract a function when responsibilities differ or the extraction improves comprehension/testability; do not fragment code merely to satisfy an arbitrary line-count limit.

Avoid magic values when a named constant or existing configuration expresses the intent better. Add brief comments/JSDoc only where they explain non-obvious intent, invariants, contracts, or trade-offs; do not narrate obvious code.

### Explicit error handling

Do not silently swallow failures. Validate important boundary inputs and surface actionable diagnostics for unexpected states.

Use defensive checks where external/async DOM ownership can legitimately change, but do not hide programming errors behind broad `try/catch` blocks or optional chaining everywhere.

### Security and safe browser code

Do not introduce `eval`, dynamic code execution, unsafe script injection, or unescaped user-controlled HTML. Prefer DOM APIs/text content for user-controlled values.

### Mobile-first accessibility and interaction

MineIT is primarily used on touch devices. Maintain responsive layouts, usable touch targets, and correct pointer/touch behaviour.

Use semantic controls such as `<button>` for actions where possible. Normal activation should use browser-standard `click`, which supports touch, mouse, and keyboard. Reserve pointer events for actual gestures such as drag, pan, long-press, or multi-select.

Do not solve touch issues with global click suppression or device-specific hacks when a consistent input model can solve the underlying problem.

### Mobile performance

Minimise unnecessary DOM work, layout thrashing, repeated queries, and allocations in hot/render loops. Avoid replacing large DOM regions when a bounded update is enough.

Keep canvas/render work controlled and avoid unnecessary redraws. Preserve existing performance guards and asset constraints.

### App version

`package.json` owns the canonical user-visible MineIT game version. Every completed development change must increment that version; use a patch increment by default unless a minor or major increment is deliberately appropriate.

The `MINEIT` header in `index.html` must display the same version immediately after the brand text. Keep regression coverage that fails if the visible header version and `package.json` version diverge.

## Testing rules — tests are required

Tests are part of the implementation, not optional follow-up work.

1. **Every gameplay/domain behaviour change must have unit or domain regression coverage.**
2. **Every bug fix must add or strengthen a regression test that reproduces the reported failure whenever practical.**
3. **UI interaction changes must include appropriate browser/integration coverage when a static/unit test cannot prove the behaviour.**
4. **Mobile-specific bugs should be exercised with the relevant mobile/touch interaction probe or viewport coverage.**
5. **Save/state changes require save/load or migration coverage as appropriate.**
6. **Long-running simulation behaviour must preserve the existing soak/regression coverage.**
7. Prefer behavioural tests over brittle tests that merely search source strings when behaviour can be executed directly.

When fixing a bug, first understand why existing tests missed it. Strengthen the test boundary so the same class of regression is less likely to recur.

Run the relevant focused tests during development and the repository's full required test suite before declaring work complete.

## Architecture and regression guards are authoritative

Never weaken, delete, bypass, skip, or rewrite an architecture/regression test merely to make CI pass unless the user explicitly approves changing the architectural or behavioural rule that test represents.

If a test fails after an intentional architecture change:

1. determine whether production behaviour is wrong or the test is asserting obsolete behaviour;
2. fix production code if production is wrong;
3. update a stale test only when the old behaviour is intentionally removed;
4. strengthen the replacement assertion so it protects the new architecture/behaviour;
5. never restore dead code solely to satisfy a stale test.

The architecture baseline must continue to reject versioned production JS/CSS, version-query JS imports, import maps, application globals, document-level app events, and large embedded HTML template debt.

## Definition of done

A change is not complete until all applicable items are true:

- the requested behaviour is implemented in the canonical owner;
- no parallel/versioned/replacement production implementation was created;
- domain/UI/state boundaries remain correct;
- relevant tests were added or updated;
- existing architecture guards were not weakened;
- focused tests pass;
- the full required CI/browser suite passes for significant changes;
- no new runtime errors/unhandled rejections are introduced;
- listener/observer/timer/RAF ownership remains bounded;
- touched code is understandable and free of obvious dead code;
- documentation/recovery notes are updated when the work materially changes project state.

## Working style

When the user says `proceed`, continue autonomously within the approved design and these rules. Do not repeatedly ask for confirmation that has already been given.

When a failure occurs, report the exact failure and fix the real cause. Do not use workarounds that violate this contract to obtain a green test run.
