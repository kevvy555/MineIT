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
        MineitUniverseDirectory.html        # future Phase 1 viewer
```

The JSON under `data/universe/` is the canonical authored source.

The viewer must consume the JSON rather than containing its own duplicate data generator.

If browser/file-loading constraints require a generated aggregate for deployment, that aggregate must be built from the canonical JSON and treated as generated output, never as a second source of truth.

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
- list of data collections;
- optional validation/build metadata.

Example:

```json
{
  "schemaVersion": 1,
  "contentVersion": "0.1.0",
  "name": "MineIT Universe",
  "collections": [
    "star-systems",
    "planets",
    "settlements",
    "companies",
    "organisation-units",
    "facilities",
    "operations",
    "people",
    "ships"
  ]
}
```

## `star-systems.json`

Canonical inhabited/authored systems.

Suggested fields:

```json
{
  "id": "system-solace",
  "name": "Solace",
  "region": "Koplin Commercial Sphere",
  "coordinates": { "x": 4.2, "y": -1.8 },
  "starType": "G-type yellow",
  "description": "...",
  "history": "...",
  "economicProfile": "...",
  "visualDescription": "...",
  "image": {
    "key": "assets/art/universe/systems/system-solace.webp",
    "promptDescription": "..."
  }
}
```

## `planets.json`

Suggested fields:

```json
{
  "id": "planet-solace-ii",
  "systemId": "system-solace",
  "name": "Solace II",
  "type": "temperate industrial world",
  "environment": "...",
  "populationSummary": "...",
  "economicProfile": "...",
  "description": "...",
  "visualDescription": "...",
  "image": {
    "key": "assets/art/universe/planets/planet-solace-ii.webp",
    "promptDescription": "..."
  }
}
```

## `settlements.json`

Used for cities, colonies, ports, orbital stations and similar inhabited locations.

Suggested fields:

```json
{
  "id": "station-solace-commercial-ring",
  "name": "Solace Commercial Ring",
  "locationType": "orbital station",
  "planetId": "planet-solace-ii",
  "systemId": "system-solace",
  "populationSummary": "...",
  "purpose": "...",
  "description": "...",
  "visualDescription": "...",
  "image": {
    "key": "assets/art/universe/settlements/station-solace-commercial-ring.webp",
    "promptDescription": "..."
  }
}
```

## `companies.json`

Companies are independent entities. A single company can employ many people and operate many facilities across many locations.

Suggested fields:

```json
{
  "id": "company-helix-industrial-group",
  "name": "Helix Industrial Group",
  "legalName": "Helix Industrial Group PLC",
  "organisationType": "industrial conglomerate",
  "scale": "major",
  "headquartersLocationId": "station-solace-commercial-ring",
  "founded": "...",
  "industries": [
    "heavy-engineering",
    "aerospace",
    "advanced-materials"
  ],
  "description": "...",
  "history": "...",
  "culture": "...",
  "reputation": "...",
  "visualIdentity": {
    "primaryPalette": "graphite and bronze",
    "logoDescription": "...",
    "uniformDescription": "...",
    "architectureDescription": "...",
    "shipLiveryDescription": "..."
  },
  "logo": {
    "key": "assets/art/universe/companies/logos/company-helix-industrial-group.webp",
    "promptDescription": "..."
  }
}
```

## `organisation-units.json`

Represents divisions, subsidiaries, departments and teams without hardcoding a fixed hierarchy depth.

Suggested fields:

```json
{
  "id": "division-helix-propulsion",
  "companyId": "company-helix-industrial-group",
  "parentUnitId": null,
  "unitType": "division",
  "name": "Propulsion Systems Division",
  "locationId": "facility-helix-solace-driveworks",
  "purpose": "...",
  "description": "..."
}
```

A Procurement Department could reference the division as its `parentUnitId`.

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

Suggested fields:

```json
{
  "id": "facility-helix-solace-driveworks",
  "name": "Solace Driveworks",
  "companyId": "company-helix-industrial-group",
  "locationId": "planet-solace-ii",
  "facilityType": "propulsion manufacturing complex",
  "status": "operational",
  "description": "...",
  "visualDescription": "...",
  "image": {
    "key": "assets/art/universe/facilities/facility-helix-solace-driveworks.webp",
    "promptDescription": "..."
  }
}
```

## `operations.json`

An operation explains what a facility/company is doing and why it consumes or produces resources.

Suggested fields:

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
    },
    {
      "resourceType": "ore",
      "resourceId": "platinum",
      "importance": "important",
      "demandScale": "moderate",
      "qualityPreference": "excellent",
      "reason": "Used in high-temperature catalyst and control assemblies."
    }
  ]
}
```

At Phase 1, demand can be descriptive/relative rather than a fully simulated economy.

## `people.json`

A person is a persistent named character.

Suggested fields:

```json
{
  "id": "person-talia-chen",
  "name": "Talia Chen",
  "age": 42,
  "gender": "woman",
  "companyId": "company-helix-industrial-group",
  "organisationUnitId": "department-helix-driveworks-procurement",
  "role": "Strategic Metals Buyer",
  "workLocationId": "facility-helix-solace-driveworks",
  "homeLocationId": "station-solace-commercial-ring",
  "responsibilities": [
    "Strategic metals procurement",
    "Supplier qualification",
    "Long-term supply agreements"
  ],
  "biography": "...",
  "personality": "...",
  "appearance": "...",
  "visualDescription": "...",
  "portrait": {
    "key": "assets/art/universe/people/person-talia-chen.webp",
    "promptDescription": "..."
  }
}
```

The schema must allow people who are not buyers.

## `ships.json`

Ships are persistent named universe assets rather than being inseparable from buyer rows.

Suggested fields:

```json
{
  "id": "ship-csv-halcyon-reach",
  "name": "CSV Halcyon Reach",
  "companyId": "company-helix-industrial-group",
  "shipClassId": "ship-class-dart-courier",
  "homePortLocationId": "station-solace-commercial-ring",
  "assignedOperationId": "operation-helix-driveworks-propulsion",
  "role": "priority materials courier",
  "description": "...",
  "visualDescription": "...",
  "liveryDescription": "...",
  "image": {
    "key": "assets/art/universe/ships/ship-csv-halcyon-reach.webp",
    "promptDescription": "..."
  }
}
```

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

Avoid storing only:

```json
"Copper Ore"
```

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

The standalone viewer should be a development/world-building tool first.

Proposed tabs:

```text
OVERVIEW
SYSTEMS
PLANETS
LOCATIONS
COMPANIES
OPERATIONS
FACILITIES
PEOPLE
SHIPS
```

## Global viewer behaviour

- load canonical JSON;
- searchable from all major tabs;
- filter by relevant entity type/company/location;
- click references to navigate between linked entities;
- show missing/broken references clearly;
- show image if available;
- show image-generation information if artwork is missing;
- provide **COPY IMAGE PROMPT** for image-bearing entities;
- provide raw IDs/references in a development-details section;
- mobile usable, while allowing richer desktop inspection.

## Company view

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

## Person view

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

## Operation view

Should answer:

- what is being done;
- where;
- by which company/division;
- at which facility;
- which resources are required;
- why those resources are required;
- which people are responsible for procurement/management.

## Location view

Should show entities located there:

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

1. Every entity ID is globally unique within its collection and follows naming conventions.
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
2. Create canonical JSON skeleton and manifest.
3. Author the two example companies and their linked universe content.
4. Add validation for IDs, references, resources and asset paths.
5. Build the standalone `MineitUniverseDirectory.html` viewer.
6. Add cross-navigation between all implemented entity types.
7. Add image placeholders and prompt-generation/copy support.
8. Review the sample universe for clarity, usefulness and image-generation quality.
9. Refine schema before bulk content is authored.
10. Only after the schema proves stable, begin expanding the universe at scale.

---

# Definition of Phase 1 success

Phase 1 is successful when we can open one standalone viewer and navigate a coherent chain such as:

```text
Star System
  -> Planet
    -> Facility
      -> Operation
        -> Resource Requirement
          -> Company
            -> Department
              -> Person
                -> Named Ship
```

and every page is driven from the same canonical JSON dataset.

We should also be able to select a person, ship, company, facility or location and obtain an image-generation-ready description that is consistent with all linked universe facts.

At that point the universe model is proven and can be populated gradually without touching the existing gameplay feature until the separate integration design is approved.