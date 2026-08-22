# MineIT

MineIT is a mobile-first contract-mining and colony strategy game based on the Koplin mining charter scenario.

## Core loop

**Survey → discover → unlock extraction → develop → collect → sustain the colony → trade → improve technology → expand → complete the contract.**

The player takes a ten-year mining claim and must reach Food Production, Industry and Population objectives while maximising profit. Completed contracts grow a persistent mining corporation through cash, reputation and permanent Power, Food Production and Mining technology.

## Colony economy

MineIT has four resource categories:

- **Food** — stored food is consumed by population every day. Consumption rises with population.
- **Build** — construction materials are spent to develop and upgrade collection sites, housing and industry.
- **Fuel** — consumed by colony power generation. Demand rises with population, industry and operating resource sites.
- **Ore** — consumed continuously by industry. The category includes common metals, advanced metals, precious metals and gemstones; valuable materials still command much higher corporate trade prices.

Collected material enters colony storage. The **Collect** screen shows resource, category, collection rate, current stock and remaining deposit/sustainable status.

A corporate ship arrives every 180 game days. It can buy colony stock or sell resources to the player. Deep-reach claims also require the docked ship to purchase technology licences.

## Technology

The corporation starts at Level 1 in three permanent technology trees. Each tree contains 10 sequential levels:

- **Power** — progresses from combustion generation through advanced reactor systems to extreme late-game power. Higher levels raise supported population and Industry limits and improve fuel efficiency.
- **Food Production** — improves use of natural food resources and progressively unlocks sealed/synthetic production for barren and hostile worlds.
- **Mining** — increases extraction output and unlocks resource-specific exploitation methods. For example, Quarrying unlocks Stone and Rotary Drilling unlocks Oil and Natural Gas.

A surveyed resource can be discovered before it is exploitable. Development remains locked until the required Mining technology is owned.

## Colony tiers

Claims now have environmental tiers. Temperate claims can operate with base technology; arid/frozen colonies need better systems; barren, volcanic and deep-vacuum claims require progressively stronger Power, Food and Mining technology plus environmental support such as powered heating, sealed domes or thermal shielding.

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
  art/terrain/
  art/development/
tests/
```

The **domain layer never calls the DOM or canvas**. Simulation state, resource rules, inventory, colony demand, technology, trade and rendering remain separate modules. UI rendering failures therefore cannot stop the simulation clock.

### Resource visuals

The resource map uses optimized WebP tile artwork with canvas overlays for state, quality and collection information.

### Building visuals

The land map uses optimized transparent WebP artwork for Housing, Industry, Quarry, Mine, Deep Mine, Rig, Farm, Ranch, Bio Harvester and Algae Facility. Each family is stored as a five-frame horizontal atlas representing development levels L1–L5. The canvas renderer selects the appropriate frame and retains the vector building renderer as a fallback if an image is unavailable.

## Run locally

Because MineIT uses ES modules, serve it over HTTP:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Tests

```bash
npm test
```
