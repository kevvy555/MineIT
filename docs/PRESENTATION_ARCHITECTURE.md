# MineIT Presentation Architecture

## Purpose

This document defines ownership rules for the mobile page shell, map presentation and shared footer controls. These rules exist to prevent layout, canvas and event-handler regressions from crossing component boundaries.

## Page shell

`#app` owns only the three major vertical regions:

1. application header
2. remaining main area
3. application footer

The middle row is always `minmax(0, 1fr)`. The outer shell must not impose a hard minimum map height.

`#worldShell` owns the map area and has exactly two layout rows:

1. fixed-height map toolbar
2. remaining canvas viewport

Opening filters must never add a grid row or change the map viewport height.

## CSS owns physical layout

CSS is authoritative for page and canvas geometry.

JavaScript may observe `#worldViewport` using `getBoundingClientRect()` / `ResizeObserver`, but must not calculate available page height from header/footer sizes and must not assign CSS width/height to the canvas.

The canvas element remains CSS-contained with `inset: 0; width: 100%; height: 100%`. JavaScript only changes its internal drawing buffer (`canvas.width` / `canvas.height`) for DPR-aware rendering.

## Map responsibilities

### Legacy canvas renderer

`world-view.js` remains the proven rendering/input implementation. It owns:

- canvas drawing
- tile hit testing
- pointer/drag/long-press input
- tile filtering rules
- redraw scheduling

### v5.6 presentation composition

`world-view-v56.js` is the application-facing map composition. It adapts the canvas renderer to the v5.6 presentation layer and delegates controls to `MapControls`.

It must not inject CSS or mutate prototypes.

### MapControls

`map-controls.js` exclusively owns:

- Land / Resources buttons
- Filters button
- filter category drill-down
- ALL / CLEAR and individual filter buttons
- toolbar/filter presentation state

Filter definitions live in `map-filter-definitions.js` so renderer/filter logic and controls share neutral data instead of duplicating ownership.

## Overlay ownership

Application overlays are siblings of the canvas viewport under `#overlayRoot`, not children of the canvas viewport.

`#overlayRoot` owns:

- modal
- tile panel
- toast
- error badge

The overlay root itself does not accept pointer events. Interactive overlay children opt back in. This prevents an invisible overlay/container from blocking the map or footer.

## Footer input ownership

`ui-controller-v56.js` is the application-level owner of footer navigation and speed input.

Feature UIs may render button state (for example disabled/active trade state), but they must not become the final owner of shared footer click behavior.

The v5.6 trade adapter removes legacy direct speed-button handlers after legacy TradeUI construction so shared speed input remains owned by the presentation controller.

New feature modules must not assign new `onclick` handlers to `[data-speed]`.

## Version composition

The v5.6 presentation layer is selected explicitly in `index.html` using an import map. The stable v5.5 domain/simulation graph remains unchanged.

This is intentional: presentation architecture can evolve without forcing a broad domain rewrite or cache-version churn across unrelated game services.

## Required regression coverage

Any change to page shell, map controls, overlays, canvas sizing or footer interaction must keep these checks green:

- unit/regression suite
- static presentation ownership test
- map view/filter tests
- browser startup smoke test
- interaction probe at 360×640
- interaction probe at 375×667
- interaction probe at 390×844
- interaction probe at 412×915
- interaction probe at 915×412 landscape

The browser probe must verify:

- map remains visible in Land and Resources views
- opening filters does not change map height
- canvas never escapes `#worldViewport`
- overlays are outside the canvas viewport
- footer controls remain hit-testable
- major footer actions open their expected modal
- legacy speed-button `onclick` handlers are absent

## Explicitly prohibited patterns

Do not reintroduce:

- runtime `<style>` injection for core layout
- `WorldView.prototype` monkey patches
- a separate filter grid row that changes canvas height
- inline CSS width/height assignment on `#world`
- header/footer subtraction logic inside map resize code
- general application modals inside `#worldViewport`
- competing final owners for shared footer inputs
