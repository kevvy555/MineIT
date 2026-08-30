# MineIT Universe Database Integration

Status: **Planning only — future integration after standalone universe proof-of-concept**  
Depends on: `MineitUniverseDatabase.md`

## Purpose

Define how the standalone MineIT Universe Database can later become part of the main game without destabilising the completed Conglomerate Buyers Service or procedural colony/expansion systems.

The integration goal is not to make the game UI more complicated. The player can continue to see a simple commercial buyer flow while the data behind that flow becomes substantially richer and more internally consistent.

The intended future chain is:

```text
Canonical Universe
  -> Company
    -> Facility
      -> Operation
        -> Resource Requirement
          -> Procurement responsibility
            -> Person
              -> Commercial opportunity
                -> Per-save market terms
                  -> Existing buyer contract lifecycle
```

This replaces the current shallow identity-to-random-offer relationship with a believable universe-backed reason for each opportunity.

---

# Integration principles

## 1. Preserve the working buyer lifecycle

The current Stage 8 buyer gameplay already owns useful behaviour:

- reputation locks;
- recurring contract cadence;
- minimum quality;
- shipment quantities;
- buyer happiness;
- collection ships;
- berth requirements;
- partial fulfilment;
- late shipments;
- missed deliveries;
- termination/cooldown;
- global reputation coupling.

The Universe Database should primarily change **where buyer identity and demand come from**, not unnecessarily rewrite those mechanics.

## 2. Separate canonical facts from per-save market state

Canonical Universe Database examples:

- Talia Chen works for Helix Industrial Group;
- Talia is in strategic procurement;
- Helix operates Solace Driveworks;
- Solace Driveworks manufactures propulsion systems;
- the operation requires Magnetic Ore and Platinum;
- CSV Halcyon Reach belongs to Helix;
- Helix has graphite/bronze branding.

Per-save/generated state examples:

- whether Helix is currently available to this player;
- exact requested quantity;
- exact price;
- exact contract cadence;
- current buyer happiness;
- current cooldown;
- collection event timing;
- whether a contract is active/terminated;
- market scarcity modifiers;
- which colony is supplying the contract.

Canonical content should never contain mutable save-game state.

## 3. Do not fork the universe per playthrough unnecessarily

Major inhabited civilisation should remain recognisable between games.

The same company should remain the same company. The same named employee should retain their identity. Major headquarters, known populated worlds and major facilities should remain where authored.

Replay variation should come from:

- frontier generation;
- colony locations;
- discovered deposits;
- resource quality/scale;
- player reputation;
- market variation;
- which opportunities become relevant;
- what the player chooses to develop and supply.

## 4. Integrate incrementally

The migration should be staged so that a partly populated Universe Database cannot break a playable game.

No cutover should occur until the relevant universe data and validation are sufficiently complete.

---

# Current systems to integrate

## Current buyer identity content

Today the buyer feature has a static deterministic pool of 1,000 buyer identities in `js/data/buyer-content.js`.

Those records currently combine several concepts:

- person identity;
- company identity;
- business type;
- home flavour text;
- resource interests;
- collection ship identity;
- ship class;
- portrait/ship image keys.

The future universe model separates these concepts into linked entities.

## Current buyer offer generation

`BuyerService` currently generates one offer per buyer using the game/expansion seed and the buyer's business/resource profile.

Future offer generation should instead derive candidate demand from operations/resource requirements and then apply market/gameplay variation.

## Current galaxy/planet generation

`ExpansionService` currently generates a deterministic local galaxy for the save, including star systems and planets.

Those generated systems are gameplay exploration space.

The Universe Database introduces persistent inhabited/core locations. Integration must explicitly define how authored and procedural space coexist rather than silently replacing one with the other.

## Current planetary resources

`WorldService` creates colony/resource truth from procedural seeds, terrain, contract and resource definitions.

This remains appropriate for frontier deposits and should not be replaced by the Universe Database.

The Universe Database describes civilisation and known operations; it does not pre-author every mineable tile in every colony.

---

# Proposed universe/game boundary

Use a hybrid model.

## Canonical inhabited universe

Authored in the Universe Database:

- important inhabited systems;
- major planets/moons;
- core stations and settlements;
- established corporations;
- notable facilities;
- major industrial operations;
- persistent people;
- corporate fleets/named ships;
- persistent commercial relationships;
- known economic specialisations.

## Procedural frontier

Generated per game:

- unexplored frontier systems where appropriate;
- new colony opportunities;
- exact resource deposits;
- deposit sizes and quality;
- local terrain;
- some minor frontier locations;
- player-created colonies;
- newly founded player infrastructure.

## Bridge between them

Procedural colonies interact economically with the canonical civilisation.

A new frontier colony can discover a resource that causes the game to surface relevant companies/operations/people from the authored universe.

The player therefore explores a changing frontier while trading into a persistent civilisation.

---

# Location integration options

The implementation should choose one explicit model before coding.

## Recommended model — canonical core + procedural frontier

Keep a set of authored core/institutional systems in the star map, then generate frontier systems around/alongside them.

Examples:

```text
Canonical:
  Koplin Corporate Home
  Solace
  Meridian
  Helix Prime
  major trade/industrial systems

Procedural:
  frontier-xxxx
  prospect systems
  colony candidate systems
```

Benefits:

- named companies have real permanent homes;
- people can reference real locations;
- major trade geography can matter;
- exploration remains replayable;
- current procedural colony mechanics remain useful.

The star map can visually distinguish:

- known/canonical civilisation;
- surveyed frontier;
- unknown frontier;
- player colonies.

## Alternative — fully canonical galaxy

Possible later, but not recommended as the first integration because it would require replacing more of `ExpansionService` and would reduce procedural variation.

---

# Stable location references

Current buyer `home` flavour strings should eventually be retired from gameplay identity data.

Future people should reference actual entity IDs:

```json
{
  "homeLocationId": "station-solace-commercial-ring",
  "workLocationId": "facility-helix-solace-driveworks"
}
```

The UI resolves display names from the Universe Database.

This allows the game to show meaningful information such as:

> Talia Chen  
> Strategic Metals Buyer — Helix Industrial Group  
> Solace Driveworks, Solace II

and every part of that text is connected to real universe records.

---

# Future commercial discovery logic

The current game exposes the buyer catalogue from the full static pool.

The future system should derive candidates from what the player's colonies can actually supply.

## Candidate selection pipeline

For each colony/game state:

1. Determine discovered and commercially producible resources.
2. Determine quality bands and sustainable/expected production capability where useful.
3. Query Universe Database operations requiring those resources.
4. Resolve organisations responsible for those operations.
5. Resolve procurement/commercial departments.
6. Resolve people with authority/responsibility for those requirements.
7. Apply geographical/commercial reach rules.
8. Apply global reputation and relationship rules.
9. Apply per-save market variation.
10. Produce player-facing buyer opportunities.

This creates causality:

```text
Player discovers Palladium
  -> operations which use Palladium become relevant
  -> companies running those operations become candidates
  -> their procurement contacts surface
  -> BuyerService produces current commercial terms
```

The player does not need to see all ten steps.

---

# Resource requirement model

Canonical operations define **why** they need resources.

Example:

```json
{
  "resourceType": "ore",
  "resourceId": "magnetic",
  "importance": "critical",
  "demandScale": "high",
  "qualityPreference": "excellent",
  "reason": "Required for high-density drive field assemblies."
}
```

The future game service can translate those authored traits into numerical offer envelopes.

For example:

- `demandScale` influences typical shipment quantity;
- `importance` influences willingness to pay/cadence;
- `qualityPreference` influences minimum quality;
- company scale influences maximum volume and logistics capability;
- operation status influences whether demand exists;
- geographical distance may influence collection cadence/cost;
- reputation determines access/negotiation range.

Do not author exact per-contract numbers into universe JSON unless they are genuine immutable lore facts.

---

# Buyer/person conversion

The current `buyer-0001` to `buyer-1000` identities represent valuable content and image naming work.

The future migration should preserve them rather than discard them.

Recommended conversion:

```text
buyer-0001  -> person-0001
buyer-0002  -> person-0002
...
buyer-1000  -> person-1000
```

or preserve the current IDs if changing them creates unnecessary asset/migration cost.

The critical requirement is stable mapping between:

- existing portrait asset;
- persistent person;
- future universe identity.

Not every migrated person needs to remain a buyer.

The 1,000 people can be distributed across roles such as:

- CEO;
- managing director;
- divisional director;
- plant manager;
- procurement director;
- buyer;
- logistics controller;
- fleet manager;
- materials scientist;
- research lead;
- engineering manager;
- project manager;
- account manager;
- commodity analyst;
- site manager;
- commercial representative.

This makes the portrait library useful across the wider game.

---

# Company conversion

The current model effectively pairs each buyer with a unique company.

Do not preserve that relationship as a permanent universe rule.

Instead:

1. author a smaller set of real companies;
2. assign many people to each company where appropriate;
3. create subsidiaries/divisions/departments where useful;
4. assign operations/facilities to those organisations;
5. retain small independent companies where they make sense.

Initial target for a mature first universe could be roughly 80–150 companies, but this is not a hard requirement and should be driven by content quality.

Company scale should range from:

- specialist local businesses;
- regional suppliers;
- established multi-planet firms;
- major corporations;
- conglomerates;
- strategic interstellar organisations.

---

# Ship integration

Current buyer collection ships combine a unique ship name with one of 30 shared classes.

The future model should retain the useful distinction:

## Ship class

Static technical definition:

- class name;
- capacity;
- description;
- general hull identity.

## Named ship

Universe entity:

- stable ship ID;
- unique name;
- owner company;
- ship class;
- home port;
- current organisational assignment;
- role;
- livery;
- image;
- lore/description.

A buyer contract can select an appropriate ship owned/chartered by the relevant company instead of assuming every person permanently owns exactly one collection vessel.

For early integration, the existing one-person-to-one-ship mapping may be retained temporarily if needed, then relaxed after the universe-backed ship model is proven.

---

# Company visual identity integration

The Universe Database should allow image and UI consistency across related entities.

A company owns visual identity such as:

- palette;
- logo;
- uniforms;
- signage;
- architectural style;
- industrial design language;
- ship livery.

A person's image prompt can inherit company visual facts.

A ship's prompt can inherit company livery.

A facility's prompt can inherit company architecture/signage.

The game UI can later use company logos in:

- buyer profiles;
- contract screens;
- ship arrival events;
- universe directory;
- news/events;
- company relationship screens.

This should remain presentation data, not gameplay authority.

---

# Proposed game-side architecture

Exact module names should be confirmed against the repository at implementation time, but responsibilities should remain clear.

## Static data owner

Canonical JSON contains universe definitions.

A generated/imported game-facing data module may provide efficient synchronous access if required by the current vanilla-JS architecture.

## Universe catalogue/domain reader

A small read-only service/index should answer queries such as:

```text
person(id)
company(id)
operation(id)
facility(id)
location(id)
ship(id)
peopleForCompany(companyId)
operationsForResource(resourceType, resourceId)
procurementContactsForOperation(operationId)
shipsForCompany(companyId)
```

It must not own mutable game state.

## BuyerService

Remains authoritative for buyer contract gameplay.

Future responsibilities:

- ask the universe catalogue for valid commercial candidates;
- generate per-save offer terms;
- persist relationships/contracts;
- control fulfilment/collection lifecycle.

It should not become the owner of company lore or location definitions.

## ExpansionService

Remains authoritative for procedural exploration/travel state.

Future responsibilities may include combining canonical map nodes with generated frontier nodes, but canonical definitions must not be duplicated into mutable state unnecessarily.

## GameStore/state

Stores mutable facts only:

- discovered/known universe entities if knowledge gating is introduced;
- active contracts;
- relationships;
- market state;
- ship event state;
- player colonies;
- frontier generation.

Do not copy entire canonical company/person records into save state.

Persist stable IDs and resolve current canonical content through the universe catalogue.

---

# Save-state strategy

Prefer references over snapshots.

Example contract state:

```json
{
  "id": "buyer-contract-42",
  "personId": "person-talia-chen",
  "companyId": "company-helix-industrial-group",
  "operationId": "operation-helix-driveworks-propulsion",
  "resourceType": "ore",
  "resourceId": "magnetic",
  "quantity": 24000,
  "unitRate": 1.03,
  "intervalDays": 38,
  "collectionShipId": "ship-csv-halcyon-reach",
  "status": "active"
}
```

Canonical fields such as Talia's biography or Helix's logo are not copied into the save.

## Content evolution

Stable IDs allow descriptions/images to improve without invalidating saves.

Breaking deletion/renaming of canonical IDs should be treated as a migration problem and avoided unless necessary.

---

# Offer generation — proposed future model

Offer generation should remain deterministic for a given save where appropriate.

Potential inputs:

```text
save/world seed
+ colony ID
+ operation ID
+ person ID
+ resource requirement
+ player reputation
+ company scale
+ market phase
```

Potential outputs:

- quantity;
- minimum quality;
- unit price;
- collection interval;
- collection ship;
- offer ordering/visibility;
- optional urgency.

Existing buyer-market balancing can initially remain the numerical authority while the source of candidate resources changes from `business.resources` to `operation.resourceRequirements`.

This allows a low-risk first integration.

---

# Market variation versus universe truth

The database should support a believable economy without requiring a full economy simulation.

Use three layers:

## Layer 1 — canonical structural demand

Example:

Helix Driveworks always has a legitimate need for magnetic/conductive/advanced materials because of what it manufactures.

## Layer 2 — seeded market variation

A particular save determines which requirements are commercially attractive/active and the exact contract terms.

## Layer 3 — future dynamic events

Optional later systems may temporarily modify demand:

- expansion project;
- supplier failure;
- war/disaster without combat simulation requirements;
- new factory opening;
- major shipbuilding contract;
- research programme;
- infrastructure boom;
- commodity shortage.

Layer 3 is explicitly future scope and should not be required for initial integration.

---

# Discovery and visibility

Not every universe entity needs to be visible from the first minute of the game.

Possible future knowledge states:

- globally known;
- known through conglomerate network;
- discovered after reaching a system;
- introduced through a contract;
- discovered through company/person interaction.

For the first integration, keep this simple:

- the Conglomerate Buyers Service can expose universe-backed contacts when eligible;
- selecting a contact may reveal the relevant company/location in the in-game directory;
- canonical universe browsing can expand later.

Avoid building a complicated fog-of-war system until required.

---

# Player-facing buyer experience after integration

The dense catalogue should remain quick to use.

A row can still show concise information:

```text
Talia Chen
Helix Industrial Group
Magnetic Ore
24,000
Excellent+
38 days
£...
CONTACT
```

The detail view can now show deeper context:

```text
TALIA CHEN
Strategic Metals Buyer
Helix Industrial Group
Propulsion Systems Division
Solace Driveworks — Solace II

Requirement
Magnetic Ore is used by the Commercial Drive Assembly Programme
for high-density field assemblies.

Collection
CSV Halcyon Reach
Dart Courier class
```

The extra universe depth should enrich the detail view without slowing routine contract management.

---

# In-game Universe Directory

After the standalone viewer is proven, a read-only player-facing directory can be added to MineIT.

The game version does not need every development field.

Possible sections:

```text
KNOWN PEOPLE
COMPANIES
LOCATIONS
SHIPS
```

It can reuse the same canonical universe catalogue while displaying only information appropriate to the player's knowledge/state.

The development HTML viewer remains a richer authoring/debug tool.

---

# Migration strategy for the current buyer feature

Do not perform a big-bang replacement.

## Integration Stage A — universe catalogue available to game

- load/access universe data;
- add validation/indexing;
- no buyer behaviour changes;
- existing buyer feature remains authoritative.

## Integration Stage B — map existing buyers to people

- connect a controlled subset of existing buyer IDs to universe people/companies;
- buyer UI may resolve richer identity from universe records;
- offer generation still uses existing mechanics.

## Integration Stage C — operation-backed resource demand

- candidate resource comes from operation requirements;
- existing quantity/price/cadence balance remains initially;
- regression-test seeded determinism and balance boundaries.

## Integration Stage D — company/ship ownership

- collection ships resolve through universe ship/company records;
- company logos/locations/operation descriptions appear in buyer detail.

## Integration Stage E — broader catalogue migration

- convert remaining existing people/companies progressively;
- remove obsolete identity generation only when no live behaviour depends on it;
- preserve stable art mappings.

## Integration Stage F — universe-aware expansion/map

- integrate canonical systems/locations with procedural frontier star map;
- add travel/distance rules only where gameplay requires them.

Each stage should be independently testable and releasable.

---

# Compatibility with existing artwork

Existing assets must be preserved where possible.

Current buyer portrait naming:

```text
assets/art/buyers/buyer-0001.webp
...
```

Current buyer ship naming:

```text
assets/art/buyer-ships/buyer-ship-0001.webp
...
```

During migration there are two sensible options:

1. keep existing paths as the canonical art keys for migrated records; or
2. move/rename assets into the new universe structure in one controlled migration with references updated atomically.

Do not duplicate thousands of assets permanently just to support both naming schemes.

The decision should be made when real art volume is known.

---

# Tests required for integration

## Universe data integrity

- unique IDs;
- valid references;
- valid resource IDs;
- valid location hierarchy;
- valid company/organisation ownership;
- valid image keys/format conventions.

## Buyer regression

Existing Stage 8 behaviour must remain covered:

- exactly reproducible offer generation for the same seed where intended;
- reputation locking;
- quantity does not exceed collection ship capacity;
- buyer price remains below direct equivalent where that rule remains;
- happiness changes;
- partial shipment thresholds;
- late/missed logic;
- berth behaviour;
- cancellation/cooldown;
- contract persistence.

## New universe-backed tests

- a resource maps only to operations that declare that requirement;
- operation resolves to valid company/facility;
- procurement contact belongs to the correct organisation chain;
- buyer detail resolves the correct company/location/operation;
- missing optional artwork does not block buyer use;
- canonical records are not copied/mutated by BuyerService;
- save/load preserves IDs and mutable contract state;
- content ordering changes do not silently remap persisted entities.

## Star-map integration tests

When canonical systems are introduced to the map:

- stable IDs cannot collide with generated frontier IDs;
- distance/travel calculations work between canonical and procedural nodes;
- existing colony locations remain resolvable;
- old saves have a migration strategy if required.

---

# Performance considerations

The mature universe may contain thousands of records.

Avoid repeatedly scanning complete arrays during hot UI/simulation loops.

At load/build time create read-only indexes such as:

```text
peopleById
companiesById
operationsById
facilitiesById
shipsById
operationsByResource
peopleByCompany
facilitiesByLocation
```

These are derived indexes, not duplicate sources of truth.

The universe catalogue should be mostly static and cheap to query.

Do not insert the full universe object into every colony state/save.

---

# Content scale roadmap

Do not jump from proof-of-concept directly to thousands of fully authored entities.

Suggested growth:

## Proof

- 2 companies;
- 10–20 people;
- a few systems/locations/operations/ships.

## Foundation

- 10–20 companies;
- enough different industries to cover all main MineIT resource families;
- 50–100 people;
- initial corporate visual language library.

## Commercial universe

- 50+ companies;
- hundreds of people;
- broad resource-demand coverage;
- meaningful geographic distribution;
- larger named fleet.

## Mature universe

- potentially 80–150+ companies;
- existing 1,000-character pool fully incorporated where useful;
- deeper facilities/operations;
- many generated/approved images;
- additional non-commercial characters.

Quality and connectedness are more important than hitting exact counts.

---

# Future possibilities enabled by the integration

These are intentionally not commitments for initial implementation, but the data model should not unnecessarily block them.

- company reputation separate from individual buyer happiness;
- company-wide preferred supplier status;
- introductions between contacts;
- competing companies;
- multiple contacts within one company;
- promotions/personnel moves;
- company news;
- operation expansion/contraction;
- temporary resource shortages;
- construction megaprojects;
- strategic contracts;
- player-owned freight servicing companies;
- direct company relationships after conglomerate brokerage;
- visits to known corporate worlds/facilities;
- company-specific UI branding;
- named recurring NPCs across multiple colonies;
- universe events which make existing entities feel persistent.

These should be implemented only when they provide clear gameplay value.

---

# Explicit non-goals for the first integration

Do not require:

- full economic simulation of every company;
- daily simulation of every operation;
- NPC schedules;
- individual population simulation;
- real-time fleet movement for all canonical ships;
- procedural biographies at runtime;
- every company buying every compatible resource;
- every universe record becoming interactive gameplay;
- replacing the existing resource/deposit generation system.

The database is a persistent world model first, not an excuse to simulate everything.

---

# Key architectural decisions to refine before implementation

The following should be resolved during plan refinement:

1. Final physical location of canonical JSON and build/generated game-facing representation, if any.
2. Whether current `buyer-*` stable IDs remain unchanged or map to new `person-*` IDs.
3. Exact strategy for retaining/moving existing buyer portrait and ship assets.
4. Initial relationship between canonical systems and `ExpansionService` generated systems.
5. Whether collection ships are company-owned, operation-assigned or selected from a broader logistics pool in the first integration.
6. Whether canonical operation demand uses qualitative scales only or also includes baseline numerical demand ranges.
7. How much universe information is visible to the player before first contact.
8. Whether company-wide relationship state is introduced immediately or kept per-person initially.

None of these decisions block building the standalone proof-of-concept described in `MineitUniverseDatabase.md`.

---

# Definition of integration success

The integration is successful when the player can discover a resource on a colony and receive a buyer opportunity whose entire identity is explainable by the persistent universe:

```text
Why this resource?
  Because a real operation needs it.

Why this company?
  Because that company owns/runs the operation.

Why this person?
  Because their role includes procurement for that operation.

Why this ship?
  Because it belongs to or services that organisation.

Where are they from?
  A real canonical location visible in the MineIT universe.

Why these exact contract terms?
  Per-save market/gameplay generation layered on top of the canonical requirement.
```

The player-facing flow should remain as quick and usable as the existing Conglomerate Buyers Service, while repeat playthroughs expose different slices of the same connected MineIT civilisation based on what the player discovers, produces and chooses to pursue.