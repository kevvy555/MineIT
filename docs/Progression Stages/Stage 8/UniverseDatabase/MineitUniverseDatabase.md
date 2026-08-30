# MineIT Universe Database

Status: **Planning / proof-of-concept design**  
Implementation stage: **Standalone — no gameplay integration in this phase**

## Purpose

Build a persistent, authored **MineIT Universe Database** that becomes the canonical reference for the people, companies, locations, operations, facilities, ships and visual identity of the inhabited MineIT universe.

The first implementation is deliberately standalone and sits alongside the existing Stage 8 Conglomerate Buyers Service. It must not replace, rewrite or destabilise the completed buyer feature while the universe content and tooling are being designed and populated.

The first goal is to prove the model with a small amount of high-quality content rather than immediately attempting to populate the full universe.

The database will also provide the source material for image generation. Any entity which can have an image should contain enough authored descriptive information to create a consistent image later without inventing the entity again from scratch.

---

# Core principles

## 1. One canonical source of truth

The universe must have one authoritative structured dataset.

The directory/viewer reads that dataset. Future gameplay integration reads that dataset. Image-generation tooling reads that dataset.

Do not maintain separate generators containing copies of names, company details, locations or descriptions.

## 2. Stable identity

Every persistent universe entity has a stable ID which does not change because display text, images or surrounding content are edited.

Examples:

- `system-solace`
- `planet-solace-ii`
- `company-helix-industrial-group`
- `division-helix-propulsion`
- `facility-helix-solace-driveworks`
- `operation-helix-driveworks-propulsion`
- `person-talia-chen`
- `ship-csv-halcyon-reach`

IDs are references, not presentation labels.

## 3. Authored civilisation, procedural frontier

The Universe Database represents the persistent inhabited/commercial civilisation of MineIT.

It should initially contain authored:

- important star systems;
- planets and moons relevant to civilisation;
- settlements and orbital stations;
- companies;
- company divisions and departments;
- facilities and industrial operations;
- named people;
- named company ships;
- commercial relationships and resource requirements;
- visual identities and lore.

Procedurally generated frontier systems, colony deposits and player-created colonies remain separate concepts. Integration with them is defined in `MineitUniverseDatabaseIntegration.md`.

## 4. People belong to organisations and places

A person should not exist as an isolated buyer row.

A person may be associated with:

- a company;
- division;
- department;
- operation;
- facility;
- work location;
- home location;
- one or more ships;
- responsibilities;
- commercial authority.

A buyer is therefore a person with a procurement/commercial role, not a special standalone species of record.

## 5. Resource demand belongs to operations

The reason a company wants a resource should be represented in the universe.

Example:

`Helix Industrial Group -> Propulsion Division -> Solace Driveworks -> Propulsion Manufacturing -> Magnetic Ore demand -> Procurement Department -> Talia Chen`

The person negotiates the contract because the operation actually consumes the material.

This is preferable to assigning arbitrary resource interests directly to a random buyer.

## 6. Descriptions are first-class data

Every meaningful entity must have human-readable descriptive fields.

Descriptions serve three purposes:

1. lore and directory presentation;
2. future gameplay context;
3. image-generation source material.

Image generation must be reproducible from authored facts rather than re-inventing style on every prompt.

## 7. The universe is a graph, not one rigid hierarchy

Many universe relationships are naturally hierarchical, but the complete universe is a graph.

Examples:

- a company may operate on several planets;
- a person belongs to one department but may manage several operations;
- a ship can serve multiple facilities;
- a facility belongs to a company but also exists at a geographical location.

The viewer therefore presents multiple useful hierarchy perspectives over the same canonical records instead of forcing every entity into one permanent parent-child tree.

---

# Phase 1 scope

Phase 1 proves the architecture only.

Create a small but complete vertical slice containing approximately:

- 2 star systems;
- 3–5 planets/moons;
- 2–3 settlements/stations;
- 2 example companies with meaningfully different identities;
- several divisions/departments;
- 3–5 facilities;
- 3–5 operations;
- roughly 10–20 people across different job levels;
- 3–6 named ships;
- several operation-level resource requirements;
- company branding and image-generation descriptions.

The proof should demonstrate relationships between all major entity types rather than maximise row count.

No existing buyer gameplay should depend on these records during Phase 1.

---

# Phase 1 mock delivery architecture

The first viewer mock must use the **real canonical JSON structure**, not embedded sample objects inside the HTML.

This means the mock is also the first working implementation of the future content architecture rather than a disposable visual prototype.

Benefits:

- establishes the final source-of-truth pattern immediately;
- proves cross-file references and stable IDs;
- proves manifest-driven loading;
- exposes schema weaknesses before large-scale authoring begins;
- allows validation to operate against the same data the viewer renders;
- allows the sample universe to grow without rewriting the viewer;
- prevents the mock from becoming a second shadow dataset.

The viewer should load `manifest.json`, then load the collections declared by that manifest.

The mock should therefore be delivered as a small static site/folder containing the HTML viewer plus its JSON files and any available assets.

Because normal browsers restrict `fetch()` from local `file://` pages, the canonical mock is expected to run through GitHub Pages or a simple local static HTTP server. We should not solve this by embedding a duplicate copy of the universe data in the HTML.

If a self-contained distributable viewer is ever needed later, it may be created as generated output from the canonical JSON. It must never become an independently authored source of truth.

---

# Proposed repository structure

The exact physical paths can be refined before implementation, but the intended ownership is:

```text
data/
  universe/
    manifest.json
    star-systems.json
    planets.json
    settlements.json
    companies.json
    organisation-units.json
    facilities.json
    operations.json
    people.json
    ships.json

assets/
  art/
    universe/
      people/
      ships/
      companies/
        logos/
      systems/
      planets/
      settlements/
      facilities/

docs/
  Progression Stages/
    Stage 8/
      UniverseDatabase/
        MineitUniverseDatabase.md
        MineitUniverseDatabaseIntegration.md
        MineitUniverseDirectory.html
```

The JSON under `data/universe/` is the canonical authored source.

The viewer must consume the JSON rather than containing its own duplicate data generator.

---

# Asset structure

All universe artwork should use stable entity-derived filenames.

Examples:

```text
assets/art/universe/people/person-talia-chen.webp
assets/art/universe/ships/ship-csv-halcyon-reach.webp
assets/art/universe/companies/logos/company-helix-industrial-group.webp
assets/art/universe/planets/planet-solace-ii.webp
assets/art/universe/facilities/facility-helix-solace-driveworks.webp
```

The data record owns the asset key/path.

Missing artwork must not invalidate the universe record. The viewer should show a clear placeholder and expose the image-generation description/prompt so the asset can be produced later.

The system must support gradual art population over a long period.

---

# Data files and responsibilities

## `manifest.json`

Purpose:

- schema/content version;
- universe name;
- content release metadata;
- list of data collections and their file paths;
- optional validation/build metadata.

Example:

```json
{
  "schemaVersion": 1,
  "contentVersion": "0.1.0",
  "name": "MineIT Universe",
  "collections": {
    "starSystems": "star-systems.json",
    "planets": "planets.json",
    "settlements": "settlements.json",
    "companies": "companies.json",
    "organisationUnits": "organisation-units.json",
    "facilities": "facilities.json",
    "operations": "operations.json",
    "people": "people.json",
    "ships": "ships.json"
  }
}
```

## `star-systems.json`

Canonical inhabited/authored systems.

Suggested fields include:

- stable ID;
- name;
- region;
- coordinates;
- star type;
- description;
- history;
- economic profile;
- visual description;
- image asset and prompt information.

## `planets.json`

Suggested fields include:

- stable ID;
- parent system ID;
- name;
- type;
- environment;
- population summary;
- economic profile;
- description;
- visual description;
- image information.

## `settlements.json`

Used for cities, colonies, ports, orbital stations and similar inhabited locations.

Suggested fields include:

- stable ID;
- name;
- location type;
- planet/system reference;
- optional parent location reference;
- population summary;
- purpose;
- description;
- visual description;
- image information.

## `companies.json`

Companies are independent entities. A single company can employ many people and operate many facilities across many locations.

Suggested fields include:

- stable ID;
- display/legal name;
- organisation type and scale;
- headquarters location;
- founding/history information;
- industries;
- description;
- culture and reputation;
- visual identity;
- logo information.

Company visual identity may define:

- primary palette;
- logo design;
- uniform design;
- architecture;
- ship livery;
- signage/container style.

## `organisation-units.json`

Represents divisions, subsidiaries, departments and teams without hardcoding a fixed hierarchy depth.

Important fields:

- stable ID;
- company ID;
- optional parent unit ID;
- unit type;
- name;
- optional primary location;
- purpose;
- description.

A Procurement Department can therefore reference a Division, while a small business can use a much flatter structure.

## `facilities.json`

Represents physical places owned, leased or operated by organisations.

Examples:

- shipyard;
- refinery;
- mine;
- factory;
- research laboratory;
- distribution hub;
- office tower;
- agricultural complex;
- orbital dock.

Suggested fields include owner/company, physical location, facility type, status, description, visual description and image information.

## `operations.json`

An operation explains what a facility/company is doing and why it consumes or produces resources.

Example:

```json
{
  "id": "operation-helix-driveworks-propulsion",
  "name": "Commercial Drive Assembly Programme",
  "companyId": "company-helix-industrial-group",
  "organisationUnitId": "division-helix-propulsion",
  "facilityId": "facility-helix-solace-driveworks",
  "operationType": "propulsion-manufacturing",
  "status": "active",
  "description": "...",
  "resourceRequirements": [
    {
      "resourceType": "ore",
      "resourceId": "magnetic",
      "importance": "critical",
      "demandScale": "high",
      "qualityPreference": "excellent",
      "reason": "Used in high-density field assemblies."
    }
  ]
}
```

At Phase 1, demand can be descriptive/relative rather than a fully simulated economy.

## `people.json`

A person is a persistent named character.

Suggested fields include:

- stable ID;
- name;
- age/gender where relevant;
- company;
- organisation unit;
- role;
- work/home locations;
- responsibilities;
- biography;
- personality;
- appearance;
- visual description;
- portrait information.

The schema must allow people who are not buyers.

## `ships.json`

Ships are persistent named universe assets rather than being inseparable from buyer rows.

Suggested fields include:

- stable ID;
- name;
- owner/company;
- ship class;
- home port;
- assigned operation(s) where relevant;
- role;
- description;
- visual description;
- livery description;
- image information.

Ship classes may remain shared definitions where appropriate; named ships are universe entities.

---

# Resource references

Universe records must reference the canonical game resource identifiers rather than display names.

Preferred form:

```json
{
  "resourceType": "ore",
  "resourceId": "copper"
}
```

Avoid storing only a presentation string such as `Copper Ore`.

This keeps universe content stable if a presentation name changes and enables future validation against `js/data/resources.js`.

---

# Image-generation data contract

Every image-bearing entity should distinguish between general lore and visual-generation facts.

Recommended fields:

- `description` — what the entity is;
- `visualDescription` — persistent visual facts;
- `image.key` — canonical asset path;
- `image.promptDescription` — image-generation-ready description;
- optional `image.status` — `missing`, `draft`, `approved`;
- optional `image.notes` — composition/cropping constraints.

The prompt description should be descriptive rather than tied to a particular image model.

Company visual identity should cascade conceptually into associated assets:

- employee uniforms/badges;
- office interiors;
- factories;
- station areas;
- ship liveries;
- company logos;
- containers/signage.

The viewer may assemble a final copyable prompt from:

```text
Universe visual direction
+ entity visualDescription
+ company visual identity
+ location visual identity
+ entity promptDescription
+ required composition/aspect ratio
```

This avoids manually repeating the same corporate style in hundreds of records while preserving a complete generated prompt.

---

# MineIT Universe Directory viewer

The standalone viewer is primarily a **Universe Explorer** and development/world-building tool.

The primary interaction model is **hierarchical tree navigation on the left + selected entity detail on the right** rather than a collection of disconnected database tables.

## Desktop layout

```text
+-----------------------------+-------------------------------------------+
| UNIVERSE EXPLORER           | SELECTED ENTITY                           |
|                             |                                           |
| Search...                   | Name / image / summary                    |
|                             |                                           |
| [Geography] [Organisation]  | Description                               |
| [Directory]                 | Relationships                             |
|                             | Operations / people / ships / resources   |
| expandable tree             | Image-generation information              |
|                             | Development details                       |
+-----------------------------+-------------------------------------------+
```

Selecting an item in the tree updates the right-hand panel without losing the wider hierarchy context.

## Mobile layout

On mobile the tree should not permanently consume half the display.

Use a full-screen or slide-over Universe Explorer which closes after a selection, leaving the detail panel full-width. A clear control reopens the explorer at the currently selected entity.

## Explorer perspectives

The same canonical records should be viewable through several hierarchy perspectives.

### Geography

Answers: **What exists here?**

Example:

```text
Universe
  Solace System
    Solace II
      Solace Commercial Ring
        Companies
          Helix Industrial Group
          Meridian Logistics
        Facilities
        Ships
```

Geography is the default perspective.

### Organisations

Answers: **How is this organisation structured?**

Example:

```text
Companies
  Helix Industrial Group
    Propulsion Systems Division
      Procurement Department
        Talia Chen
        Marcus Vale
      Solace Driveworks
      Operations
        Commercial Drive Assembly Programme
    Advanced Materials Division
    Ships
```

This perspective is particularly useful while authoring companies.

### Directory

Answers: **Find a particular entity regardless of hierarchy.**

Directory categories may include:

- people;
- companies;
- ships;
- facilities;
- operations;
- planets;
- systems;
- settlements/stations.

Directory mode can use compact searchable/filterable lists or tables because lookup, rather than understanding hierarchy, is its purpose.

## Search

A global **Search universe...** control should search across major entity collections.

Selecting a search result should:

1. open the entity in the right-hand detail panel;
2. switch to an appropriate explorer perspective where useful;
3. expand the relevant tree branch;
4. highlight the selected entity.

## Breadcrumbs

Every detail page should expose a contextual breadcrumb/path where a useful hierarchy exists.

Example geography path:

`Solace System -> Solace II -> Solace Commercial Ring -> Helix Industrial Group`

Example organisation path:

`Helix Industrial Group -> Propulsion Systems Division -> Procurement Department -> Talia Chen`

Breadcrumb nodes are clickable.

Because an entity may have several valid contexts, breadcrumbs represent the current navigation path rather than pretending the universe has one universal parent chain.

## Relationship navigation

The right panel should expose explicit related entities because not every relationship naturally fits the currently selected tree.

For a person, this may include:

- company;
- organisation unit;
- work location;
- home location;
- associated operations;
- managed/procured resources;
- associated ships.

All relationships are clickable and navigate to the corresponding entity.

## Mini hierarchy context

Where useful, detail pages should show compact hierarchy chains such as:

```text
ORGANISATION
Helix Industrial Group
  -> Propulsion Systems Division
    -> Procurement Department
      -> Talia Chen
```

or:

```text
LOCATION
Solace System
  -> Solace II
    -> Driveworks Industrial Zone
      -> Solace Driveworks
```

This reinforces context without requiring a graph visualisation.

## Global viewer behaviour

The viewer should:

- load the canonical manifest and JSON collections;
- support tree expansion/collapse;
- support global search;
- support relevant directory filters;
- cross-navigate between linked entities;
- reveal the current entity in the appropriate tree;
- show missing/broken references clearly;
- show artwork when available;
- show image-generation information when artwork is missing;
- provide **COPY IMAGE PROMPT** for image-bearing entities;
- provide raw IDs/references in a development-details section;
- remain mobile usable while allowing richer desktop inspection.

## Company detail

Should show at minimum:

- company identity and logo;
- description/history/culture;
- headquarters;
- industries;
- visual identity;
- organisational hierarchy;
- employees;
- facilities;
- operations;
- ships;
- locations;
- resources required by its operations.

## Person detail

Should show:

- portrait;
- name and role;
- company;
- organisation unit;
- work/home location;
- responsibilities;
- biography/personality;
- associated operations/ships;
- visual description;
- copyable portrait prompt.

## Operation detail

Should answer:

- what is being done;
- where;
- by which company/division;
- at which facility;
- which resources are required;
- why those resources are required;
- which people are responsible for procurement/management.

## Location detail

Should show relevant entities located there:

- companies;
- facilities;
- operations;
- people;
- ships/home ports;
- child locations where appropriate.

---

# Proof-of-concept example companies

Phase 1 should use deliberately different organisations to test the model.

## Example A — Helix Industrial Group

Large engineering/aerospace organisation.

Useful for proving:

- multiple divisions;
- large facility;
- procurement department;
- multiple resource requirements;
- corporate ships;
- strong corporate visual identity;
- several people in one organisation.

Possible operations:

- propulsion manufacturing;
- advanced alloy fabrication;
- commercial ship component production.

Likely resource demand:

- Iron Ore;
- Copper Ore;
- Reactive Metal Ore;
- Conductive Ore;
- Magnetic Ore;
- Platinum.

## Example B — Verdant Horizon Biotech

Smaller specialist life-science/agricultural organisation.

Useful for proving that the model is not biased toward heavy industry.

Possible operations:

- closed-habitat food research;
- medical biochemistry;
- protein culture processing.

Likely resource demand:

- Protein Bloom;
- Thermal Algae;
- Synthetic Nutrient;
- Hydrogen-rich Brine.

These are working examples, not locked canon until the proof content is reviewed.

---

# Validation requirements

Before the database grows beyond proof-of-concept size, add automated validation.

Minimum checks:

1. Every entity ID is unique within its collection and follows naming conventions.
2. Every referenced company exists.
3. Every parent organisation unit exists and belongs to the expected company.
4. Every referenced system/planet/location exists.
5. Every facility references a valid company and location.
6. Every operation references valid company/facility/organisation entities.
7. Every person references valid organisational/location entities where supplied.
8. Every ship references valid owner/class/location entities where supplied.
9. Every resource requirement references a canonical MineIT resource ID.
10. Every declared asset key follows the canonical asset structure.
11. No viewer-side data generator silently invents missing authoritative fields.
12. Broken references are validation errors rather than silently ignored content.
13. Every collection declared by the manifest exists and contains valid JSON.

Validation should run in normal repository tests/CI once implementation begins.

---

# Authoring rules

## Do

- use stable IDs;
- write useful descriptions rather than filler;
- explain why operations exist;
- make people fit their organisation and responsibilities;
- make visual descriptions consistent with company/location identity;
- reuse real entities through references rather than duplicating their data;
- allow one company to contain many people;
- allow one person to have multiple relevant relationships where the model requires it.

## Do not

- create one company per person by default;
- duplicate company descriptions into every employee;
- use generated display names as foreign keys;
- place gameplay-mutating state in the universe JSON;
- bake per-save buyer prices/quantities into canonical universe data;
- duplicate the existing buyer generator inside the new viewer;
- embed a second authored copy of Phase 1 data inside the viewer HTML;
- require artwork to exist before content can exist.

---

# What remains outside Phase 1

The following are explicitly not part of the standalone proof-of-concept:

- replacing the current 1,000-buyer catalogue;
- changing BuyerService offer generation;
- changing save-game state;
- changing procedural star-system generation;
- simulating a full interstellar economy;
- real-time supply-chain simulation;
- dynamically changing company leadership;
- player interaction with every person in the database;
- generating hundreds/thousands of images immediately.

Those integration topics belong in `MineitUniverseDatabaseIntegration.md`.

---

# Phase 1 implementation sequence

1. Finalise entity model and naming conventions.
2. Create the canonical JSON folder, manifest and collection skeletons.
3. Author the two example companies and their linked universe content directly in the canonical JSON.
4. Add validation for JSON loading, IDs, references, resources and asset paths.
5. Build the standalone `MineitUniverseDirectory.html` viewer against those real JSON files.
6. Implement Geography, Organisations and Directory explorer perspectives.
7. Add expandable tree navigation, right-hand entity details, breadcrumbs and relationship links.
8. Add global search which reveals selected entities in the appropriate tree.
9. Add image placeholders and prompt-generation/copy support.
10. Review the sample universe for hierarchy clarity, relationship visibility, usefulness and image-generation quality.
11. Refine schema before bulk content is authored.
12. Only after the schema proves stable, begin expanding the universe at scale.

---

# Definition of Phase 1 success

Phase 1 is successful when the mock uses the same canonical multi-file JSON structure intended for the long-term universe and we can open the Universe Explorer and navigate coherent chains such as:

```text
GEOGRAPHY
Star System
  -> Planet
    -> Settlement / Station
      -> Company / Facility
        -> Operation
```

and:

```text
ORGANISATION
Company
  -> Division
    -> Department
      -> Person
```

while cross-links connect related operations, facilities, resources, ships and locations that do not fit the current tree perspective.

Every detail page must be driven from the same canonical JSON dataset.

We should also be able to select a person, ship, company, facility or location and obtain an image-generation-ready description that is consistent with all linked universe facts.

At that point the universe model, navigation model and authoring workflow are proven and can be populated gradually without touching the existing gameplay feature until the separate integration design is approved.