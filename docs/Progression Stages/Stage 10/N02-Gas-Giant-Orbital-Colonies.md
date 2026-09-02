# N02 — Gas-Giant Harvesting and Orbital Colonies

**Progression stage:** 10 — Logistics Network Development  
**Type:** New feature discovered through A22b Fuel production  
**Status:** Ready for Review

## Source

This item was created while defining long-term sources for Hydrogen, Deuterium and Helium-3. It is not required for the initial spacecraft-Fuel release because Fuel can first be purchased from the conglomerate.

## Purpose

Turn gas giants into strategically valuable, non-surface colony locations that harvest atmospheric resources and can eventually manufacture and export spacecraft Fuel.

## Canonical world requirements

- Gas giants are represented as non-landable planetary bodies on the system map.
- Every gas giant has its own atmospheric composition, yields and hazards.
- Atmospheric resources are unknown until surveyed.
- The canonical Universe data model must add gas-giant records and atmospheric composition/harvesting fields before game records are authored.

## Colony identity

- A gas-giant operation is an independent colony, not an attachment to a moon or planetary colony.
- It appears alongside planetary colonies in corporation management.
- It has its own population, workforce, accommodation, Food, Power, inventory, economy, contracts, analytics and operational state.
- It uses dedicated orbital buildings and artwork. Surface-building variants cannot be placed there.

## Deployment and grid

- The first orbital gas station is deployed by a conglomerate Engineering Ship.
- A player-owned Engineering Ship can perform deployment later.
- The colony uses the normal grid and scanning interaction model with gas-giant restrictions.
- Each grid tile represents a persistent atmospheric harvesting sector.
- The initial central station occupies a fixed central tile in the same conceptual manner as a newly landed colony ship.
- The station remains visible on the grid as the permanent operational centre.
- Scanning reveals each sector’s composition, yield and hazards.

## Central station

The central station initially supplies:

- colony Headquarters and conglomerate-network access;
- the only supported Power reactor;
- initial accommodation;
- Food and Fusion Fuel storage;
- limited atmospheric separation;
- skimmer control;
- docking and cargo transfer.

Reactor capacity is expanded by upgrading the central station reactor rather than placing separate Power generators.

All additional orbital modules must connect through contiguous station modules or corridors and draw Power from the central reactor.

## Skimmer operation

- Reusable skimmers are deployed and assigned to an atmospheric sector.
- An assigned skimmer harvests continuously while operational.
- Skimmers return Mixed Atmospheric Gas Feedstock to the central station.
- Atmospheric sectors do not permanently deplete at game scale.
- Output is constrained by sector yield, fleet capacity, Power, processing, storage, workforce and maintenance.
- Random gas-giant storms are simple colony-wide events.
- During a storm all skimmers stop collection and wait until the storm ends.

## Separation and export

- The central station provides limited initial separation capacity.
- Larger separation and refining facilities are separate connected orbital modules.
- Processed outputs can include Hydrogen, Deuterium and Helium-3.
- Raw Mixed Atmospheric Gas Feedstock may be exported.
- Raw feedstock requires dedicated cryogenic or gas-tanker holds.
- A receiving colony needs compatible unloading, storage and processing buildings.

## Population and Food

- Orbital colonies require a colony-like workforce.
- Colonists need orbital accommodation and Food.
- Food is imported initially.
- Dedicated orbital hydroponics becomes available later.

## Power and emergency reserve

- The central station’s built-in Fusion reactor is the only Power source supported by the initial orbital colony design.
- Reactor output is increased through central-station reactor upgrades.
- The colony protects seven days of emergency Power for critical survival and command functions when normal Fusion Fuel runs out.
- If the reserve is exhausted, the colony enters a recoverable full outage:
  - life support and Headquarters functions shut down;
  - colonist health deteriorates rapidly;
  - the colony remains recoverable if Fusion Fuel arrives before the population is lost.
- Restoring Fusion Fuel restarts the station through the normal recovery process.

## Fusion Fuel manufacturing

- A separate connected tile module manufactures Fusion Fuel.
- It consumes the required separated Deuterium and Helium-3 feedstocks plus Power.
- The module can make the orbital colony self-sufficient.
- Additional capacity can turn the colony into a long-term Fusion Fuel manufacturing and export centre.
- The emergency reserve cannot be treated as ordinary production stock.

## Acceptance criteria

1. Gas giants cannot receive surface landings or surface buildings.
2. Orbital operations appear as independent colonies in corporation management.
3. The central station occupies the fixed initial tile and supplies the approved core services.
4. Only connected orbital modules can operate.
5. Surveying reveals variable atmospheric resources.
6. Skimmers continuously deliver mixed feedstock from assigned sectors.
7. A storm stops every skimmer without permanently depleting sectors.
8. Separation modules produce the correct refined gases.
9. Raw-feedstock transport enforces specialist holds and receiving facilities.
10. Reactor upgrades expand Power capacity.
11. The seven-day reserve and recoverable-outage sequence work as approved.
12. A separate module can manufacture and export Fusion Fuel.
13. Save/load preserves sector assignments, storms, inventories, station modules, reserve state and outages.

## Balancing and sequencing

Station cost, skimmer capacity, sector yields, storm frequency, processing recipes, reactor output, reserve quantity and Fuel-manufacturing throughput remain balance data.

This feature is sequenced after the initial A22b purchased-Fuel system and does not block it.
