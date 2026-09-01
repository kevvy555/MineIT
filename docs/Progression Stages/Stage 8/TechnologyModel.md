# Stage 8 — Corporate Capability and Technology Model

## Purpose

This document captures the current MineIT technology tree and the functions it performs, then defines the proposed technology model required for Stage 8 and the wider corporation progression.

The design is based on two agreed changes:

1. **Mining and Scanning become separate capability paths.** Mining represents the equipment and extraction methods needed to exploit resources; Scanning represents the equipment and specialist capability needed to detect increasingly difficult resources and improve planetary surveying.
2. **Technology upgrades are physical Corporate Capability Packages.** The conglomerate already owns the technology and intellectual property. The player is paying for specialist equipment, tooling, commissioning support and personnel required to deploy the next capability level, so upgrades must physically arrive on a Corporate Ship before becoming active.

This is a design specification only. It describes the intended replacement for the current technology behaviour; implementation must still follow the repository architecture and regression rules.

---

# 1. Current Technology Model

## Current ownership

Technology is currently stored corporation-wide in `state.company.tech` and is owned by `TechnologyService`.

Current default capability state:

- Housing L1
- Power L1
- Food L1
- Industry L1
- Mining L1

The technology screen currently presents five paths:

- Housing
- Power
- Food Production
- Industry
- Mining / Extraction

Purchasing the next level currently deducts cash and activates the new level immediately.

## Current costs

### Housing / Power / Food / Industry

| Level | Current Cost |
| --- | ---: |
| L1 | £0 |
| L2 | £25,000 |
| L3 | £90,000 |
| L4 | £300,000 |
| L5 | £1,000,000 |

### Mining

| Level | Current Cost |
| --- | ---: |
| L1 | £0 |
| L2 | £25,000 |
| L3 | £90,000 |
| L4 | £300,000 |
| L5 | £1,000,000 |
| L6 | £3,500,000 |
| L7 | £12,000,000 |
| L8 | £40,000,000 |
| L9 | £130,000,000 |
| L10 | £400,000,000 |

---

# 2. Current Technology Tree Text and Functions

## Housing

| Level | Name | Current Description | Current Gameplay Function |
| --- | --- | --- | --- |
| L1 | Basic Habitats | Simple modular accommodation for a new surface colony. | Allows Housing buildings up to L1; L1 building provides 160 housing. |
| L2 | Modular Habitats | Larger linked residential modules with improved life-support integration. | Allows Housing buildings up to L2; L2 building provides 360 housing. |
| L3 | Dense Residential Blocks | Multi-level sealed housing designed for growing settlements. | Allows Housing buildings up to L3; L3 building provides 650 housing. |
| L4 | Arcology Housing | High-density residential complexes with integrated colony services. | Allows Housing buildings up to L4; L4 building provides 1,050 housing. |
| L5 | Integrated Habitat Complexes | Maximum-density self-contained residential districts. | Allows Housing buildings up to L5; L5 building provides 1,600 housing. |

## Power

| Level | Name | Current Description | Current Gameplay Function |
| --- | --- | --- | --- |
| L1 | Combustion Generator | Basic fuel-burning generators for small settlements. | Allows Power buildings up to L1; L1 provides 30 Power; fuel intensity 0.100×. |
| L2 | Steam Turbine Plant | Larger thermal generation and district power distribution. | Allows Power buildings up to L2; L2 provides 75 Power; fuel intensity 0.085×. |
| L3 | Gas Turbine Grid | High-output generation with improved fuel efficiency. | Allows Power buildings up to L3; L3 provides 160 Power; fuel intensity 0.070×. |
| L4 | Fission Reactor | Compact reactor systems for major colonies and harsh worlds. | Allows Power buildings up to L4; L4 provides 330 Power; fuel intensity 0.050×. |
| L5 | Fusion Reactor | Very high-density generation for advanced industrial settlements. | Allows Power buildings up to L5; L5 provides 650 Power; fuel intensity 0.035×. |

## Food Production

| Level | Name | Current Description | Current Gameplay Function |
| --- | --- | --- | --- |
| L1 | Field Agriculture | Basic farms, ranches and local biological harvesting. | Allows Food facilities up to L1; production multiplier 1.00×. |
| L2 | Controlled Greenhouses | Protected agriculture and improved renewable-resource handling. | Allows Food facilities up to L2; production multiplier 1.12×. |
| L3 | Sealed Hydroponics | Closed food systems for difficult planetary environments. | Allows Food facilities up to L3; production multiplier 1.28×; synthetic Food 15/day. |
| L4 | Aeroponics | High-density controlled agriculture with strong labour efficiency. | Allows Food facilities up to L4; production multiplier 1.48×; synthetic Food 30/day. |
| L5 | Synthetic Protein | Advanced biological and synthetic food production. | Allows Food facilities up to L5; production multiplier 1.72×; synthetic Food 55/day. |

## Industry

| Level | Name | Current Description | Current Gameplay Function |
| --- | --- | --- | --- |
| L1 | Basic Workshops | General fabrication, repair and low-volume colony manufacturing. | Allows Industry buildings up to L1; L1 provides 100 Industry; Ore efficiency 1.00×; processing 1.00×. |
| L2 | Mechanised Fabrication | Powered machine shops and repeatable component production. | Allows Industry buildings up to L2; L2 provides 230 Industry; Ore efficiency 0.96×; processing 1.05×. |
| L3 | Automated Manufacturing | Automated production lines and improved material utilisation. | Allows Industry buildings up to L3; L3 provides 420 Industry; Ore efficiency 0.90×; processing 1.10×. |
| L4 | Heavy Industrial Complexes | Large-scale fabrication, processing and equipment production. | Allows Industry buildings up to L4; L4 provides 700 Industry; Ore efficiency 0.83×; processing 1.18×. |
| L5 | Integrated Production Systems | Highly automated colony-wide industrial manufacturing. | Allows Industry buildings up to L5; L5 provides 1,100 Industry; Ore efficiency 0.75×; processing 1.28×. |

## Mining — Current Combined Path

| Level | Name | Current Description | Current Gameplay Function |
| --- | --- | --- | --- |
| L1 | Surface Recovery | Hand tools and light machinery for exposed and renewable resources. | Unlocks L1 resources; mining workforce efficiency 1.00×; also controls basic scanning. |
| L2 | Quarrying | Bulk excavation unlocks stone, clay, silica and shallow beds. | Unlocks L2 resources; mining workforce efficiency 0.96×; also improves scanning. |
| L3 | Shaft Mining | Underground mines unlock iron, copper, coal and structural minerals. | Unlocks L3 resources; mining workforce efficiency 0.92×; also improves scanning. |
| L4 | Deep Mining | Deep workings unlock advanced metals, precious ores and gemstones. | Unlocks L4 resources; mining workforce efficiency 0.88×; also improves scanning. |
| L5 | Rotary Drilling | Drilling rigs unlock oil and natural gas extraction. | Unlocks L5 resources; mining workforce efficiency 0.84×; also improves scanning. |
| L6 | Precision Extraction | High-control mining unlocks fissile, magnetic and platinum-group resources. | Unlocks L6 resources; mining workforce efficiency 0.80×; also improves scanning. |
| L7 | Pressure & Brine Drilling | Extreme-pressure wells unlock deep brines and diamond-bearing deposits. | Unlocks L7 resources; mining workforce efficiency 0.76×; also improves scanning. |
| L8 | Deep-Core Extraction | High-temperature deep-core systems unlock exotic minerals. | Unlocks L8 resources; mining workforce efficiency 0.72×; also improves scanning. |
| L9 | Exotic Matter Separation | Advanced separation unlocks exotic fuel crystals and crystals. | Unlocks L9 resources; mining workforce efficiency 0.68×; also improves scanning. |
| L10 | Quantum Bore Systems | Top-tier extraction unlocks the most extreme element deposits. | Unlocks L10 resources; mining workforce efficiency 0.65×; also provides maximum scanning capability. |

### Scanning functions currently hidden inside Mining

`TechnologyService.recompute()` currently derives planetary scanning capability from Mining level:

- **Survey slots:** `1 + floor((MiningLevel - 1) / 2)`, capped at 5.
- **Survey duration multiplier:** `1 - ((MiningLevel - 1) × 0.025)`, with a current minimum of 0.72.
- **Scanner hint quality:** `floor((MiningLevel - 1) / 3)`, capped at 3.

These values drive `SurveyService` and `WorldService.hint()`.

Current effective values are:

| Mining Level | Survey Slots | Survey Time Factor | Hint Tier |
| --- | ---: | ---: | ---: |
| L1 | 1 | 1.000 | 0 |
| L2 | 1 | 0.975 | 0 |
| L3 | 2 | 0.950 | 0 |
| L4 | 2 | 0.925 | 1 |
| L5 | 3 | 0.900 | 1 |
| L6 | 3 | 0.875 | 1 |
| L7 | 4 | 0.850 | 2 |
| L8 | 4 | 0.825 | 2 |
| L9 | 5 | 0.800 | 2 |
| L10 | 5 | 0.775 | 3 |

At present a survey can reveal a resource even if Mining is too low to exploit it. The revealed tile then carries a `requiredMiningLevel` and Mining prevents development until the extraction capability exists.

---

# 3. New Technology Concept

The system should no longer imply that the player is purchasing ownership of research or technology invented by the corporation.

The conglomerate already owns the underlying technology, intellectual property, designs and specialist knowledge.

The player pays to deploy that capability into their operating company through a **Corporate Capability Package** containing some combination of:

- specialist machinery;
- calibration equipment;
- advanced control systems;
- fabrication tooling;
- proprietary software and configuration;
- replacement specialist components;
- commissioning engineers;
- specialist operators/trainers;
- certification and operational support.

L1 capability is included in the initial conglomerate support package. L2+ requires the player to order progressively more advanced capability packages.

The player is therefore paying for **deployment**, not ownership of the conglomerate's intellectual property.

---

# 4. New Mining / Scanning Split

## Mining Capability

Mining becomes purely the corporation's ability to **physically exploit resources once they have been found**.

Mining controls:

- extraction equipment;
- excavation/drilling method availability;
- which deposits can be developed;
- specialist extraction systems;
- mining workforce efficiency.

Mining no longer controls:

- planetary scan speed;
- number of simultaneous surveys;
- scanner hints;
- ability to detect harder-to-find resources.

The existing Mining L1–L10 names and extraction unlock progression should be retained because they already describe increasingly advanced physical extraction methods well.

### Proposed Mining path

| Level | Capability Package | Extraction Function | Workforce Efficiency | Proposed Package Cost |
| --- | --- | --- | ---: | ---: |
| L1 | Surface Recovery | Exposed and basic renewable resources | 1.00× | Included |
| L2 | Quarrying | Stone, clay, silica, limestone, shallow deposits | 0.96× | £15,000 |
| L3 | Shaft Mining | Iron, copper, coal, structural minerals | 0.92× | £60,000 |
| L4 | Deep Mining | Advanced metals, precious ores and gemstones | 0.88× | £200,000 |
| L5 | Rotary Drilling | Oil and natural gas | 0.84× | £650,000 |
| L6 | Precision Extraction | Fissile, magnetic and platinum-group resources | 0.80× | £2,300,000 |
| L7 | Pressure & Brine Drilling | Deep brines and diamond-bearing deposits | 0.76× | £8,000,000 |
| L8 | Deep-Core Extraction | Exotic deep-core minerals | 0.72× | £26,000,000 |
| L9 | Exotic Matter Separation | Exotic fuel crystals and exotic crystals | 0.68× | £85,000,000 |
| L10 | Quantum Bore Systems | Extreme advanced-element deposits | 0.65× | £260,000,000 |

## Scanning Capability

Scanning becomes the corporation's ability to **detect, classify and survey increasingly difficult resources**.

### Proposed Scanning path

| Level | Capability Package | Detection Capability | Survey Slots | Time Factor | Hint Tier | Proposed Package Cost |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| L1 | Surface Survey Suite | Obvious surface resources and strong signatures | 1 | 1.000 | 0 | Included |
| L2 | Shallow Geophysical Survey | Shallow beds and weaker near-surface signatures | 1 | 0.975 | 0 | £10,000 |
| L3 | Subsurface Tomography | Common subsurface mineral and fuel deposits | 2 | 0.950 | 0 | £30,000 |
| L4 | Deep Spectral Survey | Deep metals, precious ores and gemstone signatures | 2 | 0.925 | 1 | £100,000 |
| L5 | Seismic Prospecting Array | Deep fluid reservoirs including oil and gas | 3 | 0.900 | 1 | £350,000 |
| L6 | Precision Mineral Spectrometry | Weak high-value, fissile and specialist mineral signatures | 3 | 0.875 | 1 | £1,200,000 |
| L7 | High-Pressure Geochemistry | Extreme-pressure deposits, deep brines and diamonds | 4 | 0.850 | 2 | £4,000,000 |
| L8 | Deep-Core Imaging | High-temperature deep-core exotic deposits | 4 | 0.825 | 2 | £14,000,000 |
| L9 | Exotic Matter Detection | Exotic crystal and unusual matter signatures | 5 | 0.800 | 2 | £45,000,000 |
| L10 | Quantum Resonance Survey | The weakest and most extreme advanced-element signatures | 5 | 0.775 | 3 | £140,000,000 |

## Why the Mining / Scanning costs are split this way

The current Mining path performs both jobs and therefore carries one combined price curve.

If the new Mining and Scanning paths both reused the full current cost curve, the player would have to pay twice as much merely to recover the gameplay capability they already receive today.

The proposed costs split each current Mining tier approximately 65% Mining / 35% Scanning, rounded to useful values while preserving the **exact combined cost of the current Mining tier**:

| Level | Current Combined Mining Cost | New Mining | New Scanning | Combined New Cost |
| --- | ---: | ---: | ---: | ---: |
| L1 | £0 | £0 | £0 | £0 |
| L2 | £25,000 | £15,000 | £10,000 | £25,000 |
| L3 | £90,000 | £60,000 | £30,000 | £90,000 |
| L4 | £300,000 | £200,000 | £100,000 | £300,000 |
| L5 | £1,000,000 | £650,000 | £350,000 | £1,000,000 |
| L6 | £3,500,000 | £2,300,000 | £1,200,000 | £3,500,000 |
| L7 | £12,000,000 | £8,000,000 | £4,000,000 | £12,000,000 |
| L8 | £40,000,000 | £26,000,000 | £14,000,000 | £40,000,000 |
| L9 | £130,000,000 | £85,000,000 | £45,000,000 | £130,000,000 |
| L10 | £400,000,000 | £260,000,000 | £140,000,000 | £400,000,000 |

This preserves the current early/mid-game economic pressure if the player advances both paths together, while allowing strategic divergence between prospecting and extraction.

---

# 5. Resource Detection vs Extraction

Each natural resource should eventually have two separate requirements:

- `requiredScanningLevel` — equipment required to reliably detect/classify the deposit;
- `requiredMiningLevel` — equipment required to physically exploit the deposit.

For the first implementation, `requiredScanningLevel` should default to the resource's current `requiredMiningLevel`. This preserves the current resource progression and balancing while establishing the new separation cleanly.

The two values can later diverge where design requires it.

Examples:

- A deposit may be **easy to detect but difficult to mine**.
- A deposit may be **difficult to detect but straightforward to extract once located**.

This creates useful strategic states:

### Scanning ahead of Mining

The player discovers high-value deposits they cannot yet exploit, creating a visible target for future investment.

### Mining ahead of Scanning

The company owns advanced extraction equipment but still needs better prospecting capability to find deposits that justify it.

Neither path is automatically the correct first investment.

## Insufficient scanner capability

A lower-level scan must not permanently classify a tile as clear when a higher-tier hidden resource actually exists.

If a scan cannot resolve a hidden resource because Scanning capability is insufficient, the result should be an **unresolved subsurface anomaly / inconclusive scan**, not a false empty result.

After the relevant Scanning capability arrives, that location becomes eligible for another survey.

This is important so technology progression does not invalidate deterministic world generation or permanently hide resources because they were scanned too early.

---

# 6. Corporate Capability Package Delivery

## Current behaviour

`TechnologyService.buy()` currently:

1. checks the next level;
2. checks technology-store access;
3. checks corporation cash;
4. deducts the cash;
5. immediately increments `state.company.tech[category]`;
6. immediately recomputes all resulting effects.

This makes sense for an abstract licence purchase but not for physical equipment and specialists.

## New lifecycle

A capability upgrade should follow this lifecycle:

**AVAILABLE → ORDERED → AWAITING CORPORATE SHIP → DELIVERED / COMMISSIONED → ACTIVE**

### 1. Available

The next sequential capability level is available to order through the conglomerate.

### 2. Ordered

The player pays the package cost.

Cash is deducted when the order is placed because the conglomerate is procuring and preparing the equipment and specialists.

The capability level does **not** increase yet.

### 3. Awaiting Corporate Ship

The order is stored as a pending corporate capability delivery.

The technology screen should show the ordered package and that it is awaiting delivery.

### 4. Delivered / Commissioned

The next eligible Corporate Ship arrival delivers the equipment and specialists.

For the initial implementation, delivery and commissioning can occur immediately when the ship arrives; a later design could add commissioning time if it provides useful pressure.

### 5. Active

The corporation's capability level increases and the relevant gameplay effects become available.

---

# 7. Company-Wide Capability Ownership

The current technology state is corporation-wide (`state.company.tech`), and this should remain true for the first implementation of Corporate Capability Packages.

An ordered package may therefore be delivered at **any conglomerate-served operating colony receiving a Corporate Ship visit**. Once commissioned, it becomes available across the operating company.

This is important for two reasons:

1. It preserves the existing multi-colony technology progression and avoids forcing the player to repurchase the same capability separately for every colony.
2. It prevents a colony outside the Corporate Ship service radius from becoming permanently locked out of technology advancement simply because the Corporate Ship cannot reach that colony.

The package represents the corporation receiving the specialist equipment, support systems, trained personnel and deployment capability needed to use that tier throughout its conglomerate-backed operations.

A future independent-company technology system may treat ownership and deployment differently, but that belongs to the later independence progression rather than this first Stage 8 foundation.

---

# 8. Corporate Ship Rules for Technology Deliveries

Recommended initial rules:

- L1 capability is included in the initial corporate startup package and does not require delivery.
- L2+ packages must be ordered.
- Cash is paid immediately on order.
- Only one next-level order per capability path may be pending at a time.
- A later level cannot be ordered until the preceding level has been delivered and activated.
- The next eligible Corporate Ship visit delivers all outstanding capability packages.
- Capability packages should **not initially consume the normal resource import/export cargo allowance**.
- The intended pressure is waiting for the Corporate Ship and planning purchases around its schedule, not competing with ordinary cargo capacity.
- Deliveries should be surfaced prominently when the Corporate Ship arrives.
- The player should be able to see how many days remain until the next possible delivery.

The existing Corporate Ship schedule therefore becomes materially important to technology progression instead of being only a trading event.

---

# 9. Revised Meaning of Every Technology Path

## Housing Capability

**Conglomerate provides:** certified habitat systems, specialist life-support hardware, construction tooling and commissioning expertise.

**Player still provides:** locally mined Build/Ore and the physical colony construction.

**Gameplay function remains:** maximum Housing building level and resulting housing capacity.

## Power Capability

**Conglomerate provides:** generation equipment packages, specialist components, reactor/turbine systems, control hardware and commissioning specialists.

**Player still provides:** local construction materials and infrastructure.

**Gameplay function remains:** maximum Power building level, output and fuel efficiency.

## Food Production Capability

**Conglomerate provides:** controlled-environment systems, specialist agricultural equipment, biological systems and synthetic-production equipment.

**Player still provides:** local construction materials, workforce and operating resources.

**Gameplay function remains:** Food facility level, production multiplier, workforce improvements and synthetic Food capability.

## Industry Capability

**Conglomerate provides:** advanced fabrication tooling, automation equipment, industrial controls and specialist manufacturing systems.

**Player still provides:** local factory buildings and physical production resources.

**Gameplay function remains:** Industry building level, capacity, workforce efficiency, Ore efficiency and processing efficiency.

## Mining Capability

**Conglomerate provides:** extraction machinery, specialist drilling/excavation systems, safety systems and extraction specialists.

**Player still provides:** local mine construction, Build/Ore, Power and workforce.

**Gameplay function becomes exclusively:** extraction-method/resource unlocks and mining workforce efficiency.

## Scanning Capability

**Conglomerate provides:** progressively more advanced scanners, geophysical instruments, sensor arrays, calibration equipment, analysis software and specialist survey personnel.

**Player still provides:** the time and operational decision to survey land.

**Gameplay function becomes:** resource detection depth/difficulty, survey slots, survey speed and pre-survey hint quality.

---

# 10. Technology Screen Changes

The current **Corporate Technology** screen should evolve toward **Corporate Capability Packages**.

Recommended path labels:

- Housing
- Power
- Food Production
- Industry
- Mining / Extraction
- Scanning / Prospecting

Recommended card states:

- **DEPLOYED** — earlier capability level already incorporated.
- **ACTIVE** — current operating capability.
- **AVAILABLE TO ORDER** — next package can be purchased.
- **ORDERED — AWAITING SHIP** — paid for but not yet delivered.
- **LOCKED** — preceding level has not yet been activated.

Recommended action label:

`ORDER • £X`

Recommended order confirmation:

> `<Package Name> ordered. Delivery scheduled with the next Corporate Ship.`

Recommended arrival message:

> `Corporate Capability Delivery: <Package Name> has arrived and is now active.`

The existing wording such as **“licensed permanently”** should be removed because it conflicts with the new ownership model.

---

# 11. Proposed Domain Function Changes

The final implementation should preserve canonical domain ownership rather than putting delivery rules in UI code.

## `TECH_TREES`

Add a new `scanning` path.

Split the current Mining price curve into separate Mining and Scanning package cost curves while preserving the combined tier cost.

## `TechnologyService.ensure()`

Add `scanning: 1` to the default company capability state.

Ensure pending capability orders are normalised into a company-owned queue/state structure.

## `TechnologyService.level()` / `current()` / `next()`

Remain the canonical capability-level queries and should work for Scanning like every other path.

## Replace `TechnologyService.buy()`

The immediate-purchase mutation should be replaced by an order transaction such as:

`orderUpgrade(state, category)`

It should:

1. validate the requested next level;
2. reject duplicate/premature orders;
3. verify cash;
4. deduct the package cost;
5. create the pending delivery;
6. **not** increment active capability.

## Add delivery transaction

Add a canonical operation such as:

`deliverPendingUpgrades(state)`

It should activate eligible ordered packages when the Corporate Ship arrives and then call `recompute()`.

The application/domain orchestration for Corporate Ship arrival should explicitly invoke this service. Avoid creating a circular dependency between `TechnologyService` and `TradeService`.

## `TechnologyService.canExploit()`

Remain Mining-based only.

## `TechnologyService.recompute()`

Separate Mining and Scanning:

- Mining level continues to drive mining workforce efficiency.
- Scanning level drives survey slots.
- Scanning level drives survey duration multiplier.
- Scanning level drives scanner hint quality.
- expose an explicit Scanning metric rather than treating the existing `sl` field as Mining.

## `SurveyService`

Continue to consume canonical scan metrics, but support an unresolved/inconclusive result becoming surveyable again after Scanning improves.

## `WorldService`

Resource detection must become Scanning-aware.

A scan should only fully classify a resource when `ScanningLevel >= requiredScanningLevel`.

Insufficient capability must preserve deterministic hidden-resource truth and return an unresolved anomaly rather than falsely clearing the tile.

## Resource definitions

Add `scanningLevel` / `requiredScanningLevel` alongside the current `miningLevel`.

For the first migration, initialise Scanning requirements from the existing Mining requirements to preserve current progression.

## Contract requirements

Contracts currently specify Power, Food and Mining requirements. Add Scanning to these requirements.

For initial balancing, Scanning requirement should match the contract's current Mining requirement unless later playtesting indicates a reason to separate them.

## UI

Add the Scanning path to the capability screen and corporation summary.

Keep Mining resource requirements visually separate from Scanning detection requirements.

---

# 12. Save Migration

This design changes persistent company capability state and therefore requires explicit migration coverage.

For every existing save:

`new scanning level = existing mining level`

This preserves all planetary scanning capability the player possessed before the split.

Do **not** reset existing players to Scanning L1.

Pending capability-order state should default to an empty queue for old saves.

Required regression coverage should include:

- old save with Mining L1 → Mining L1 / Scanning L1;
- old save with Mining L5 → Mining L5 / Scanning L5;
- old save with Mining L10 → Mining L10 / Scanning L10;
- save/load round trip with pending capability deliveries;
- ordered package does not activate immediately;
- Corporate Ship arrival activates ordered package;
- Mining upgrade does not improve scanning;
- Scanning upgrade does not unlock extraction equipment;
- unresolved high-tier resource can be rescanned after Scanning upgrade;
- a previously earned scanning capability is not lost during migration.

---

# 13. Resource Progression Mapping

For the first implementation, both Mining and Scanning use the current resource progression level as their starting requirement.

| Level | Representative Resources / Deposits |
| --- | --- |
| L1 | Fungal Shelf, Edible Flora, Grazing Herd, Nutrient Crop, Construction Fibre, Biomass, Surface Iron Nodules |
| L2 | Protein Bloom, Stone, Clay, Silica, Limestone, Peat Bed |
| L3 | Thermal Algae, Structural Mineral, Coal Seam, Iron Ore, Copper Ore |
| L4 | Reactive Metal Ore, Conductive Ore, Silver, Gold, Gemstone Deposit |
| L5 | Crude Oil, Natural Gas |
| L6 | Advanced Ceramic Feedstock, Fissile Mineral, Platinum, Palladium, Sapphire, Ruby, Emerald, Magnetic Ore |
| L7 | Hydrogen-rich Brine, Diamond |
| L8 | Exotic Industrial Mineral |
| L9 | Exotic Fuel Crystal, Exotic Crystal |
| L10 | Advanced Element Deposit |

This mapping gives us a stable baseline. Later balancing can make individual resources easier to detect than exploit or harder to detect than exploit without changing the underlying system.

---

# 14. Star-System Survey Probes

The existing star-system survey probe is currently unlocked by **Industry L3**, not Mining.

That should remain unchanged for this technology split unless separately redesigned.

The new Scanning path described here is primarily the corporation's **planetary prospecting/scanning capability**. Star-system probes are separate exploration hardware and should not be moved into Scanning automatically without an explicit gameplay decision.

---

# 15. Gameplay Pressure Created by the New Model

The redesign preserves the existing early-game technology cost pressure while adding meaningful planning pressure.

The player now chooses between:

- **Housing** — support more population;
- **Power** — support larger industrial loads;
- **Food** — sustain and feed a larger colony;
- **Industry** — fabricate/process more efficiently;
- **Mining** — physically exploit more advanced deposits;
- **Scanning** — discover more difficult and valuable deposits faster.

Money alone is no longer enough.

The player must also consider **when the next Corporate Ship arrives**.

A player may have £300,000 available for an upgrade but still need to decide whether to order now and wait for the next delivery, or commit that cash elsewhere while the colony continues operating with its current capability.

This gives Corporate Ship visits a second strategic purpose alongside trade and population transport.

---

# 16. Link to Future Independence

Corporate Capability Packages belong to the conglomerate-supported operating model.

The player is paying to deploy the conglomerate's equipment, systems and specialist capability into conglomerate-backed operations; this does not imply that the player independently owns the underlying technology/IP.

This creates a clean future distinction:

### Conglomerate-backed company

- accesses the conglomerate technology library;
- orders corporate capability packages;
- waits for Corporate Ship delivery;
- benefits from established corporate engineering/support infrastructure.

### Independent company — future progression

Must eventually replace that support through some combination of:

- owned technology licences;
- purchased patents;
- independent equipment suppliers;
- internal engineering teams;
- research and development;
- independently trained specialists;
- its own logistics network for specialist equipment.

That later independence system can eventually allow the player's company to develop capabilities beyond those available from the original conglomerate.

---

# Recommended Foundation Decision

Proceed with the following model when this work is implemented:

1. Keep technology/capability **company-wide** initially.
2. Add **Scanning L1–L10** as a separate path.
3. Keep current Mining names/resource unlocks/workforce effects, but remove all scanning effects from Mining.
4. Move survey slots, speed and hint quality to Scanning.
5. Add Scanning difficulty to resource detection, initially mapped 1:1 from current Mining requirements.
6. Split the existing Mining cost curve between Mining and Scanning so combined progression cost is preserved.
7. Replace instant technology purchases with **Corporate Capability Package orders**.
8. Deduct cash on order, but activate the level only on an eligible Corporate Ship arrival.
9. Do not consume normal Corporate Ship trade cargo capacity for capability packages initially.
10. Migrate old saves by setting `Scanning = previous Mining`.
11. Leave star-system survey probes Industry-gated until separately redesigned.
12. Treat the resulting system as conglomerate-supported deployment, leaving true technology ownership/R&D for the later independent-company progression.
