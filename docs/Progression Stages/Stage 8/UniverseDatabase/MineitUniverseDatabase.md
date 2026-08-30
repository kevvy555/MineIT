# MineIT Universe Database

Status: **Planning / proof-of-concept design**  
Implementation stage: **Standalone — no gameplay integration in this phase**

## Purpose

Build a persistent, authored **MineIT Universe Database** that becomes the canonical reference for the people, companies, locations, operations, facilities, ships and visual identity of the inhabited MineIT universe.

The Universe Database is developed alongside the existing Stage 8 Conglomerate Buyers Service. It must not replace or destabilise that completed gameplay feature while the universe content model and tooling are being proven.

The database also provides source material for future image generation. Any entity which can have an image should contain enough descriptive information to recreate it consistently without inventing the entity again.

---

# Core principles

## 1. One canonical source of truth

The long-term universe has one authoritative structured dataset.

The Universe Explorer, future gameplay integration and image-generation tooling ultimately consume that same data. Do not maintain independent generators containing duplicate names, companies, locations or lore.

## 2. Stable identity

Every persistent universe entity has a stable ID independent of its display name.

Examples:

- `system-solace`
- `planet-solace-ii`
- `station-solace-commercial-ring`
- `company-helix-industrial-group`
- `division-helix-propulsion`
- `department-helix-procurement`
- `facility-helix-solace-driveworks`
- `operation-helix-driveworks-propulsion`
- `person-talia-chen`
- `ship-csv-halcyon-reach`

IDs are references, not presentation labels.

## 3. Authored civilisation, procedural frontier

The Universe Database represents persistent inhabited/commercial civilisation.

It may contain authored:

- important star systems;
- relevant planets and moons;
- settlements, cities, ports and orbital stations;
- companies;
- divisions, subsidiaries, departments and teams;
- facilities and industrial operations;
- named people;
- named ships;
- commercial relationships and resource requirements;
- visual identities, descriptions, histories and lore.

Procedural frontier systems, player colonies and colony resource deposits remain separate concepts. Their eventual relationship to the authored universe is defined in `MineitUniverseDatabaseIntegration.md`.

## 4. People belong to organisations and places

A person should not exist as an isolated buyer row.

People can be associated with a company, organisation unit, work location, home location, facility, operation, ship, responsibilities and commercial authority.

A buyer is therefore a normal persistent person who happens to have procurement/commercial responsibilities.

## 5. Resource demand belongs to operations

A company should want a material for a believable reason.

Example:

`Helix Industrial Group -> Propulsion Systems Division -> Solace Driveworks -> Commercial Drive Assembly -> Magnetic Ore requirement -> Procurement Department -> Talia Chen`

The operation creates demand; the procurement person represents that demand commercially.

## 6. Descriptions are first-class data

Descriptions serve:

1. lore and directory presentation;
2. future gameplay context;
3. image-generation source material.

Image generation should be reproducible from authored facts rather than recreating a visual identity from scratch every time.

## 7. The universe is a graph, not one rigid hierarchy

Many relationships look hierarchical, but the overall universe is a graph.

For example:

- one company may operate on several planets;
- one person may belong to one department but be associated with several operations;
- one ship may serve several facilities;
- a facility belongs to an organisation while also existing in a geographical hierarchy.

The viewer therefore presents several useful hierarchy perspectives over the same records instead of forcing every entity into one permanent parent-child tree.

---

# Concept Mock 0 — navigation proof

Before building the real JSON-backed Phase 1 viewer, create a deliberately tiny **embedded-data concept mock** to answer one question:

> Is the proposed Universe Explorer navigation model easy to understand and use?

This is an explicit design-prototyping exception to the canonical JSON rule.

The concept mock:

- may contain its sample entities directly in the HTML/JavaScript;
- is not canonical universe content;
- is not used by gameplay;
- must be clearly labelled as a concept mock;
- should contain only the minimum entities needed to prove navigation;
- should not attempt schema validation, image generation or production data loading;
- must not evolve into the production Universe Explorer by gradually adding embedded content.

Recommended minimum sample:

- 1 star system;
- 1 planet;
- 1 settlement/station;
- 1 company;
- 1 division;
- 1 department;
- 1 facility;
- 1 operation;
- 2 people;
- 1 named ship.

The mock should prove:

1. left-side tree navigation;
2. right-side selected-entity detail;
3. switching between Geography, Organisations and Directory perspectives;
4. expanding/collapsing branches;
5. contextual breadcrumbs;
6. relationship links between entities that do not fit the current tree;
7. selection/highlighting;
8. a usable mobile explorer pattern.

If this navigation approach is approved, Phase 1 begins with canonical JSON and the real viewer is implemented against it. The embedded mock remains only a design reference.

---

# Phase 1 scope — real vertical slice

After Concept Mock 0 is approved, Phase 1 proves the actual content architecture.

Target approximately:

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

The objective is relationship completeness rather than row count.

No existing buyer gameplay depends on these records during Phase 1.

---

# Real Phase 1 delivery architecture

The real Phase 1 viewer uses the **canonical multi-file JSON structure**. It does not embed its authored data in the HTML.

Benefits:

- establishes the permanent source-of-truth pattern;
- proves cross-file references and stable IDs;
- proves manifest-driven loading;
- exposes schema weaknesses before large-scale authoring;
- allows validation against exactly what the viewer renders;
- lets the universe expand without rewriting the viewer;
- prevents a second shadow dataset.

The viewer loads `manifest.json` and then the collections declared by that manifest.

Because browser security normally prevents `fetch()` from working reliably from `file://`, the real viewer is expected to run through GitHub Pages or a simple static HTTP server.

A future self-contained distributable viewer may be generated from canonical JSON if ever required, but that generated output must never become independently authored universe data.

---

# Proposed repository structure

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
        MineitUniverseExplorerConceptMockup.html
        MineitUniverseDirectory.html
```

`data/universe/` is the canonical authored source once Phase 1 implementation begins.

---

# Data files and responsibilities

## `manifest.json`

Contains:

- schema version;
- content version;
- universe name;
- release metadata;
- collection names and file paths;
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

Persistent authored systems. Suggested information: stable ID, name, region, coordinates, star type, history, economic profile, description, visual description and image data.

## `planets.json`

Suggested information: stable ID, parent system, type, environment, population summary, economy, description, visual description and image data.

## `settlements.json`

Cities, colonies, ports, orbital stations and similar inhabited locations. Supports parent location where useful.

## `companies.json`

Independent organisations capable of employing many people and operating across many locations.

Suggested information:

- stable ID and names;
- organisation type/scale;
- headquarters;
- industries;
- description/history;
- culture/reputation;
- visual identity;
- logo information.

Company visual identity can define palette, logo style, uniforms, architecture, ship livery and signage/container style.

## `organisation-units.json`

Flexible hierarchy for subsidiaries, divisions, departments and teams.

Important fields include company ID, optional parent unit ID, unit type, primary location, purpose and description.

This allows both deep corporate hierarchies and flat small-company structures.

## `facilities.json`

Physical places owned, leased or operated by organisations, including shipyards, refineries, mines, factories, laboratories, hubs, offices, agricultural complexes and orbital docks.

## `operations.json`

Explains what a company/facility is actually doing and why it consumes or produces resources.

Example requirement:

```json
{
  "resourceType": "ore",
  "resourceId": "magnetic",
  "importance": "critical",
  "demandScale": "high",
  "qualityPreference": "excellent",
  "reason": "Used in high-density field assemblies."
}
```

At Phase 1, demand can remain descriptive/relative rather than simulating the full economy.

## `people.json`

Persistent named characters. Suggested information includes organisation membership, role, work/home locations, responsibilities, biography, personality, appearance, visual description and portrait information.

People are not required to be buyers.

## `ships.json`

Persistent named ships independent of buyer rows. Suggested information includes owner, ship class, home port, assigned operation(s), role, description, visual description, livery and image data.

Shared ship classes may remain reusable definitions.

---

# Resource references

Universe data references canonical MineIT resource IDs rather than display-name strings.

Preferred:

```json
{
  "resourceType": "ore",
  "resourceId": "copper"
}
```

This enables validation against the game's canonical resource definitions and remains stable if display names change.

---

# Asset and image-generation structure

Universe art uses stable entity-derived filenames, for example:

```text
assets/art/universe/people/person-talia-chen.webp
assets/art/universe/ships/ship-csv-halcyon-reach.webp
assets/art/universe/companies/logos/company-helix-industrial-group.webp
assets/art/universe/planets/planet-solace-ii.webp
assets/art/universe/facilities/facility-helix-solace-driveworks.webp
```

Missing artwork does not invalidate an entity. The viewer shows a placeholder and exposes enough image-generation information to create the asset later.

Image-bearing entities should distinguish:

- `description` — what the entity is;
- `visualDescription` — persistent visual facts;
- `image.key` — canonical asset path;
- `image.promptDescription` — image-specific generation description;
- optional `image.status` — `missing`, `draft`, `approved`;
- optional `image.notes` — framing/composition requirements.

Prompt descriptions should be model-independent.

A final copyable prompt may be assembled from:

```text
MineIT universe visual direction
+ entity visual description
+ company visual identity
+ location visual identity
+ entity prompt description
+ composition / aspect ratio
```

This allows company style to cascade into uniforms, interiors, factories, ships, logos, containers and signage without duplicating the same text across every record.

---

# MineIT Universe Explorer navigation

The primary viewer is **not a set of disconnected tables**. It is a hierarchy explorer on the left with the selected entity on the right.

## Desktop

```text
+-----------------------------+-------------------------------------------+
| UNIVERSE EXPLORER           | SELECTED ENTITY                           |
| Search...                   | Breadcrumbs                               |
|                             | Name / type / image                       |
| [Geography] [Organisation]  | Description                               |
| [Directory]                 | Relationships                             |
|                             | Operations / people / ships / resources   |
| expandable tree             | Image-generation information              |
|                             | Development details                       |
+-----------------------------+-------------------------------------------+
```

Selecting a tree item updates the right panel while preserving wider context.

## Mobile

The tree becomes a full-screen or slide-over explorer. Selecting an entity closes the explorer and gives the detail view the full screen. A clear control reopens the explorer at the current selection.

## Perspective 1 — Geography

Answers **What exists here?**

```text
Universe
  Solace System
    Solace II
      Solace Commercial Ring
        Companies
          Helix Industrial Group
        Facilities
        Ships
```

Geography is the default perspective.

## Perspective 2 — Organisations

Answers **How is this organisation structured?**

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
    Ships
```

## Perspective 3 — Directory

Answers **Find a particular thing regardless of hierarchy.**

Directory categories may include people, companies, ships, facilities, operations, planets, systems and settlements/stations. Compact lists/tables are appropriate here because lookup is the goal.

## Search

Global **Search universe...** searches major collections.

Selecting a result should open it, reveal/highlight it in an appropriate tree where practical and preserve context.

## Breadcrumbs

Breadcrumbs represent the current navigation context, not a fake universal parent chain.

Examples:

`Solace System -> Solace II -> Solace Commercial Ring -> Helix Industrial Group`

`Helix Industrial Group -> Propulsion Systems Division -> Procurement Department -> Talia Chen`

Breadcrumb nodes are clickable.

## Relationship links

The detail panel exposes relationships that do not naturally fit the active tree, for example a person's company, department, workplace, home, operations, resources and ships.

All related entities are clickable.

## Mini hierarchy context

Detail pages may show compact organisation/location chains to reinforce context without requiring a graph visualisation.

---

# Entity details

## Company

At minimum: logo, description/history/culture, headquarters, industries, visual identity, organisation hierarchy, employees, facilities, operations, ships, locations and aggregated resource requirements.

## Person

At minimum: portrait, name/role, company/unit, work/home location, responsibilities, biography/personality, related operations/ships, visual description and copyable portrait prompt.

## Operation

At minimum: what is being done, where, company/division, facility, resource requirements, reasons for those requirements and responsible management/procurement people.

## Location

At minimum: related companies, facilities, operations, people, ships/home ports and child locations where appropriate.

---

# Proof-of-concept Phase 1 companies

## Helix Industrial Group

Large engineering/aerospace organisation suitable for proving multiple divisions, procurement, large facilities, resource requirements, ships, visual branding and several employees.

Possible operations include propulsion manufacturing, advanced alloy fabrication and commercial ship component production.

Likely demands include Iron Ore, Copper Ore, Reactive Metal Ore, Conductive Ore, Magnetic Ore and Platinum.

## Verdant Horizon Biotech

Smaller specialist life-science/agricultural organisation to ensure the model is not biased toward heavy industry.

Possible operations include closed-habitat food research, medical biochemistry and protein culture processing.

Likely demands include Protein Bloom, Thermal Algae, Synthetic Nutrient and Hydrogen-rich Brine.

These names/details remain working examples until reviewed.

---

# Validation requirements

Before significant content growth, automated validation should check:

1. stable IDs follow conventions and are unique;
2. referenced companies exist;
3. organisation parent relationships are valid;
4. system/planet/location references are valid;
5. facility company/location relationships are valid;
6. operation company/facility/unit relationships are valid;
7. people references are valid;
8. ship owner/class/location references are valid;
9. resource requirements reference canonical MineIT resources;
10. asset keys follow the universe asset structure;
11. every manifest collection exists and contains valid JSON;
12. viewer code does not silently invent missing authoritative content;
13. broken references fail validation rather than disappearing silently.

Validation should become part of repository tests/CI once the real implementation begins.

---

# Authoring rules

## Do

- use stable IDs;
- write useful descriptions rather than filler;
- explain why operations exist;
- make people fit their organisation and responsibilities;
- make visuals consistent with company/location identity;
- reuse references rather than duplicate entity data;
- support many people in one company;
- allow multiple legitimate relationships where required.

## Do not

- create one company per person by default;
- duplicate company descriptions into every employee;
- use display names as foreign keys;
- put mutable gameplay state into universe content;
- bake per-save prices/quantities into canonical universe data;
- duplicate the current buyer generator;
- embed canonical Phase 1 data in the production viewer;
- require artwork before an entity can exist.

---

# Outside Phase 1

Not part of the standalone database/viewer proof:

- replacing the current 1,000 buyers;
- changing BuyerService offer generation;
- changing save-game state;
- changing procedural star-system generation;
- full interstellar economy simulation;
- real-time supply-chain simulation;
- dynamic company leadership;
- gameplay interactions with every person;
- generating hundreds/thousands of images immediately.

Those topics belong in `MineitUniverseDatabaseIntegration.md`.

---

# Implementation sequence

## Concept Mock 0

1. Create the minimal embedded-data Universe Explorer mock.
2. Review Geography / Organisations / Directory navigation.
3. Review desktop and mobile interaction.
4. Refine the navigation design only.
5. Freeze the concept mock as a design reference once approved.

## Real Phase 1

1. Finalise entity model and naming conventions.
2. Create canonical JSON folder, manifest and collection skeletons.
3. Author the two example companies and linked content in JSON.
4. Add validation for loading, IDs, references, resources and assets.
5. Build `MineitUniverseDirectory.html` against canonical JSON.
6. Implement the approved explorer perspectives and tree/detail interaction.
7. Add breadcrumbs, cross-navigation and global search.
8. Add image placeholders and prompt-generation/copy support.
9. Review hierarchy clarity, relationship visibility and image-generation quality.
10. Refine the schema before bulk authoring.
11. Expand the universe only after the structure proves stable.

---

# Definition of Phase 1 success

We can navigate the same canonical entities through useful contexts such as:

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

Cross-links connect facilities, operations, resources, ships and locations that do not belong naturally in the active hierarchy.

Every real viewer detail comes from the same canonical JSON dataset, and image-bearing entities can provide an image-generation-ready description consistent with linked universe facts.

At that point the universe data model, navigation model and authoring workflow are proven and can be expanded gradually before the separate gameplay integration plan is implemented.
