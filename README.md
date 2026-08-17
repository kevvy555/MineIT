# MineIT

MineIT is a mobile-first contract-mining strategy game based on the Koplin mining charter scenario.

## Core loop

**Survey → discover → develop → earn → upgrade → license technology → expand → complete the contract.**

The player takes a ten-year mining contract and must reach Food, Industry and Population objectives while maximising profit. Completed contracts grow a persistent mining corporation through cash, reputation and permanent technology licences.

## Architecture

MineIT uses vanilla HTML/CSS/JavaScript and browser-native ES modules. There is no framework and no build step.

```text
index.html
css/
  app.css
  world.css
  panels.css
js/
  app.js
  core/
  data/
  domain/
  persistence/
  ui/
assets/
  art/resources/
tests/
```

### Dependency rule

The **domain layer never calls the DOM or canvas**.

The simulation changes state. UI code observes that state and renders it. A broken visual component can therefore log an error without stopping the simulation clock.

### Resource visuals

The map uses lightweight sci-fi vector glyphs rendered directly with Canvas `Path2D`.

It deliberately does **not** use:

- `new Image()` for SVGs
- SVG `data:` URLs
- `drawImage()` for resource icons

This avoids the Android `content://downloads/...` SVG image failure found in the single-file prototype.

The folder `assets/art/resources/` is reserved for richer generated artwork used on larger discovery cards/codex views. Those assets are intentionally separate from the tiny gameplay icons.

## Run locally

Because MineIT uses ES modules, serve it over HTTP:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Tests

```bash
npm test
```

The smoke test checks:

- slow survey-slot progression
- FIFO queued surveying
- all three resource families
- deterministic world/resource generation
- site development
- long-running simulation values

## Save data

The modular rebuild starts with a new save namespace:

```text
mineit.save.v1
```

The hard-reset command also removes old `koplin` prototype keys so stale prototype saves cannot contaminate the rebuild.

## GitHub Pages

The repository root can be published directly from the `main` branch with GitHub Pages. No compilation step is required.
