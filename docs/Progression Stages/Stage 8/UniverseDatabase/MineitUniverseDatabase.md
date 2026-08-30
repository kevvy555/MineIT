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

It may contain authored star systems, planets/moons, settlements/stations, companies, organisation units, facilities, operations, people, ships, commercial relationships, resource requirements, visual identities, histories and lore.

Procedural frontier systems, player colonies and colony deposits remain separate concepts. Their eventual relationship to the authored universe is defined in `MineitUniverseDatabaseIntegration.md`.

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

For example, one company may operate on several planets, one person may belong to one department but support several operations, a ship may serve several facilities, and a facility simultaneously belongs to an organisation and a geographical location.

The viewer therefore presents several useful hierarchy perspectives over the same records instead of forcing every entity into one permanent parent-child tree.

---

# Concept Mock 0 — navigation proof

Before building the real JSON-backed Phase 1 viewer, maintain a deliberately small **embedded-data concept mock** whose purpose is to prove the navigation and information architecture.

This is an explicit design-prototyping exception to the canonical JSON rule.

The concept mock:

- may contain its sample entities directly in HTML/JavaScript;
- is not canonical universe content;
- is not used by gameplay;
- is clearly labelled as a concept mock;
- contains only enough entities to expose navigation strengths/weaknesses;
- does not become the production viewer by gradually accumulating embedded canon;
- is frozen as a design reference once the interaction model is approved.

The current mock should contain enough data to prove multiple systems/companies, scrolling, cross-branch navigation and several entity types.

## Concept Mock 0 interaction requirements

The mock must prove:

1. Geography, Organisations and Directory perspectives;
2. expandable/collapsible tree branches;
3. selected entity highlighting;
4. global search;
5. a permanently visible hierarchy while reading details;
6. independently scrollable detail and tree regions;
7. a draggable divider between detail and tree;
8. direct navigation through linked fields in the detail view;
9. automatic reveal/highlight of the selected entity in the active tree where possible;
10. useful entity-specific detail rather than a generic relationship dump.

---

# Approved mobile-first navigation model

The viewer uses a **vertical split** rather than side-by-side panels.

The selected entity occupies the **top panel** and the Universe Explorer tree occupies the **bottom panel**.

Both remain visible at the same time because retaining hierarchy context is a core purpose of the tool.

```text
+---------------------------------------------------+
| SELECTED ENTITY                                   |
| breadcrumbs / type / name / image                 |
| description                                       |
|                                                    |
| Company: Helix Industrial Group ->                |
| Facility: Solace Driveworks ->                    |
| Operation: Commercial Drive Assembly ->           |
| Work location: Solace Commercial Ring ->          |
| ...                                               |
|                                                    |
| independently scrollable                          |
+================ DRAGGABLE DIVIDER =================+
| UNIVERSE EXPLORER                                 |
| [Geography] [Organisations] [Directory]            |
| Search universe...                                |
|                                                    |
| expandable hierarchy tree                         |
| current entity highlighted                        |
| independently scrollable                          |
+---------------------------------------------------+
```

## Draggable divider

The horizontal divider is touch-friendly and draggable.

Recommended behaviour:

- default approximately 60% detail / 40% explorer;
- user may expand either region;
- enforce sensible minimum sizes, approximately 25% each;
- remember the split for the current browser/session where practical.

This supports two natural modes:

- **Browsing:** larger tree, smaller detail area.
- **Reading/world-building:** larger detail area while the tree remains visible.

## Independent scrolling

The detail and tree panels scroll independently.

A long biography or company history must not scroll the hierarchy off screen. Likewise, navigating a large tree must not move the current detail content.

## Context-aware expansion

The tree should not require the entire universe to remain expanded.

When an entity is selected:

- its relevant branch should expand automatically where possible;
- the selected row should be highlighted;
- the tree should scroll the selected row into view where practical;
- unrelated branches may remain collapsed.

This preserves context without turning a large universe into an unreadable wall of rows.

---

# Explorer perspectives

The same canonical entities are projected into three useful navigation structures.

## Geography

Answers: **What exists here?**

Example:

```text
MineIT Universe
  Solace System
    Solace II
      Solace Commercial Ring
        Companies
          Helix Industrial Group
        People
        Ships
      Surface Facilities
        Solace Driveworks
```

Geography is the default perspective.

## Organisations

Answers: **How is this organisation structured?**

Example:

```text
Companies
  Helix Industrial Group
    Propulsion Systems Division
      Strategic Materials Procurement
        Talia Chen
      Operations Management
        Marcus Vale
      Facilities
        Solace Driveworks
      Operations
        Commercial Drive Assembly Programme
    Ships
      CSV Halcyon Reach
```

## Directory

Answers: **Find a particular entity regardless of hierarchy.**

Directory groups searchable records by type, for example systems, planets, locations, companies, organisation units, facilities, operations, people and ships.

Compact lists are appropriate here because lookup rather than hierarchy comprehension is the goal.

---

# Detail navigation model

The detail panel does **not** use a generic `Related Entities` section as its primary linking mechanism.

Instead, the entity shows its actual fields and any field whose value references another universe entity is itself clickable.

Example person detail:

```text
TALIA CHEN
Strategic Metals Buyer

Company
Helix Industrial Group ->

Division
Propulsion Systems Division ->

Department
Strategic Materials Procurement ->

Works At
Solace Commercial Ring ->

Supports Operation
Commercial Drive Assembly Programme ->

Assigned Ship
CSV Halcyon Reach ->

Responsibilities
- Strategic metals procurement
- Supplier qualification
- Long-term supply agreements
```

Example operation detail:

```text
COMMERCIAL DRIVE ASSEMBLY PROGRAMME

Company
Helix Industrial Group ->

Division
Propulsion Systems Division ->

Facility
Solace Driveworks ->

Operations Director
Marcus Vale ->

Procurement Contact
Talia Chen ->

RESOURCE REQUIREMENTS
Magnetic Ore — critical / high demand / excellent quality
Copper Ore — high demand / good quality
Platinum — moderate demand / excellent quality
```

This makes the database relationships visible as part of the entity itself rather than through an artificial generic link list.

## Breadcrumbs

Breadcrumbs show the current useful context/path rather than pretending every entity has one universal parent chain.

Examples:

`Solace System -> Solace II -> Solace Commercial Ring -> Helix Industrial Group`

`Helix Industrial Group -> Propulsion Systems Division -> Strategic Materials Procurement -> Talia Chen`

## Cross-navigation behaviour

Selecting any linked field should:

1. change the selected entity in the top detail panel;
2. preserve the current explorer perspective unless there is a strong reason to change it;
3. expand the relevant branch in that perspective where the entity exists;
4. highlight the selected entity;
5. scroll it into view in the tree where practical.

---

# Entity detail expectations

## Star system

Show system type, region, key worlds/locations, economy, description, visual description and image information. Planet/location references are navigable.

## Planet / moon

Show parent system, environment, population/economy, settlements, facilities and relevant companies/operations. Entity references are navigable.

## Settlement / station

Show parent planet/system, location type, purpose, population, companies, facilities, people and home-ported ships.

## Company

Show logo, organisation type/scale, description/history/culture, headquarters, industries, visual identity, organisation units, employees, facilities, operations, ships, locations and aggregated resource requirements.

## Organisation unit

Show company, parent unit, purpose, primary location, child units, people, facilities/operations where relevant.

## Facility

Show company/owner, physical location, type/status, responsible people, operations, description and visual/image data.

## Operation

Show company/division, facility, responsible people, resource requirements, reasons for requirements, status and description.

## Person

Show portrait, role, company/unit, work/home location, responsibilities, biography/personality, linked operations/ships and visual/image-generation information.

## Ship

Show owner/company, ship class, home port, role, assigned operation(s), responsible/associated people, description, livery and image information.

---

# Phase 1 scope — real vertical slice

After the navigation concept is approved, Phase 1 proves the actual content architecture with approximately:

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

The real Phase 1 viewer uses the **canonical multi-file JSON structure**. It does not embed authored universe data in the HTML.

The viewer loads `manifest.json` and then the collections declared by that manifest.

Benefits include stable source-of-truth ownership, cross-file reference validation, manifest-driven loading, schema testing before bulk authoring, and the ability to grow the universe without rewriting the viewer.

Because browser security normally prevents `fetch()` from working reliably from `file://`, the real viewer is expected to run through GitHub Pages or a simple static HTTP server.

A future self-contained distributable viewer may be generated from canonical JSON if required, but generated output must never become independently authored universe data.

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

Contains schema/content version, universe metadata and collection file paths.

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

Persistent authored systems: ID, name, region, coordinates, star type, history, economic profile, description, visual description and image information.

## `planets.json`

Persistent worlds: ID, system, type, environment, population/economic profile, description, visual description and image information.

## `settlements.json`

Cities, colonies, ports, orbital stations and similar inhabited locations, including optional parent-location relationships.

## `companies.json`

Independent organisations capable of employing many people and operating across many locations. Includes headquarters, industries, description/history, culture/reputation, visual identity and logo information.

## `organisation-units.json`

Flexible hierarchy for subsidiaries, divisions, departments and teams using company ID plus optional parent-unit ID.

## `facilities.json`

Physical places owned, leased or operated by organisations, including shipyards, refineries, mines, factories, laboratories, hubs, offices, agricultural complexes and orbital docks.

## `operations.json`

Explains what a company/facility is doing and why it consumes/produces resources.

Example resource requirement:

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

At Phase 1, demand remains descriptive/relative rather than simulating the entire economy.

## `people.json`

Persistent named characters with organisation membership, role, work/home locations, responsibilities, biography, personality, appearance, visual description and portrait information.

## `ships.json`

Persistent named ships independent of buyer rows, including owner, class, home port, assigned operation(s), role, description, livery and image data.

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

This remains stable if presentation names change and enables validation against the game's resource definitions.

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

Missing artwork does not invalidate an entity. The viewer shows a placeholder and exposes image-generation information so the asset can be created later.

Image-bearing entities distinguish:

- `description` — what the entity is;
- `visualDescription` — persistent visual facts;
- `image.key` — canonical asset path;
- `image.promptDescription` — image-specific generation description;
- optional `image.status` — `missing`, `draft`, `approved`;
- optional `image.notes` — framing/composition requirements.

A final prompt may combine MineIT visual direction, entity description, company visual identity, location identity, entity prompt description and composition/aspect ratio.

---

# Proof-of-concept Phase 1 companies

## Helix Industrial Group

Large engineering/aerospace organisation suitable for proving multiple divisions, procurement, facilities, resource requirements, ships, visual branding and several employees.

Possible operations include propulsion manufacturing, advanced alloy fabrication and commercial ship component production.

## Verdant Horizon Biotech

Smaller specialist life-science/agricultural organisation to ensure the model is not biased toward heavy industry.

Possible operations include closed-habitat food research, medical biochemistry and protein culture processing.

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

Validation becomes part of repository tests/CI once the real implementation begins.

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

1. Maintain the embedded-data concept mock as the disposable navigation prototype.
2. Prove the vertical top-detail/bottom-tree layout.
3. Prove independently scrollable panels and draggable divider.
4. Prove Geography / Organisations / Directory perspectives.
5. Prove direct field-link navigation and automatic tree reveal/highlight.
6. Add only enough sample data to expose realistic scrolling and cross-branch navigation.
7. Refine the navigation design only.
8. Freeze the concept mock as a design reference once approved.

## Real Phase 1

1. Finalise entity model and naming conventions.
2. Create canonical JSON folder, manifest and collection skeletons.
3. Author the two example companies and linked content in JSON.
4. Add validation for loading, IDs, references, resources and assets.
5. Build `MineitUniverseDirectory.html` against canonical JSON.
6. Implement the approved vertical explorer and three perspectives.
7. Implement entity-specific linked fields, breadcrumbs, search and automatic tree reveal.
8. Add image placeholders and prompt-generation/copy support.
9. Review hierarchy clarity, information usefulness and image-generation quality.
10. Refine schema before bulk authoring.
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

The selected entity remains visible above the explorer tree; real entity-reference fields are clickable; the selected record is revealed/highlighted in the active hierarchy where possible; and both regions remain independently scrollable.

Every real viewer detail comes from the same canonical JSON dataset, and image-bearing entities can provide an image-generation-ready description consistent with linked universe facts.

At that point the universe data model, navigation model and authoring workflow are proven and can be expanded gradually before the separate gameplay integration plan is implemented.
