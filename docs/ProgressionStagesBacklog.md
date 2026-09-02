# MineIT Progression Stages Backlog

This document is the master backlog index for [PLAYER_PROGRESSION_STAGES.md](./PLAYER_PROGRESSION_STAGES.md). It organises features and bugs by the earliest player-progression stage in which they become relevant.

Detailed specifications live in the matching docs/Progression Stages/Stage N/ folder. Each item begins as **Not Started** and moves through discovery, final review, approval, implementation and completion. The full workflow is defined in [AGENTS.md](../AGENTS.md).

Item statuses are:

- **Not Started** — captured but not yet fully defined.
- **In Discovery** — currently being analysed and clarified.
- **Ready for Review** — fully defined and awaiting the user’s final review.
- **Approved** — reviewed and authorised as development-ready.
- **In Progress** — implementation has begun.
- **Complete** — implemented and verified against the definition of done.

The roadmap status shown for each stage describes implementation of the overall progression stage; it is separate from individual backlog-item status.

For traceability, references beginning with **A** correspond to the first numbered source list and references beginning with **B** correspond to the second list, where numbering restarted. References beginning with **N** are new independent items discovered while refining an existing source item.

---

## 1. Initial Survival

**Roadmap status:** Complete  
**Purpose:** Establish the immediate survival loop. The player must keep the starting population alive while shortages in Food, Fuel, Power, housing and workforce create urgent pressure.

### Ready for Review

- None currently identified.

### Not Started

- **A05b — Construction progress presentation.** Display a tile-wide black construction mask or progress overlay that gradually reveals the completed building.
- **A03a — Colonist calorie requirement.** Establish one authoritative per-colonist calorie-consumption model shared by simulation, forecasting and the user interface.
- **A05a — Timed building construction.** Define construction duration, when a building becomes operational, interruption and cancellation rules, save/load behaviour, and whether workforce or materials affect build speed.

---

## 2. Basic Self-Sufficiency

**Roadmap status:** Complete  
**Purpose:** Move the colony away from finite starting supplies by establishing dependable local production of the resources required for continued survival.

### Ready for Review

- None currently identified.

### Not Started

- **A03b — Food nutritional model.** Give each food type and quality a calorie value so different foods have meaningful nutritional benefits.
- **A04 — Hydroponics Centre.** Define its technology unlock, Power and Water consumption, workforce, seeds or growing medium, production rate and suitability for hostile planets.
- **A20b and A21 — Renewable and depletable food sources.** Decide how natural food sites, conventional farms and hydroponics differ, including regeneration, declining yields and exhaustion.
- **A22a — Fuel compatibility.** Define which fuels can be consumed by each generator, machine and industrial process.
- **A25a — Food and fuel quality benefits.** Define how food quality affects nutrition and how fuel type and quality affect energy output or duration.
- **B04a — Resource model audit.** Review the current resource catalogue, remove inconsistencies and establish canonical raw-resource categories before expanding the economy.

---

## 3. Contract Viability

**Roadmap status:** Complete  
**Purpose:** Turn the surviving colony into a commercially useful operation that fulfils the reason the conglomerate funded it.

### Ready for Review

- None currently identified.

### Not Started

- **B05a — Core contract redesign.** Redefine contract objectives, success levels, monetary rewards, penalties and failure consequences so the original contract still fits the expanded game.

---

## 4. Production Expansion

**Roadmap status:** Complete  
**Purpose:** Increase the scale and efficiency of extraction by overcoming workforce, Power, Industry, technology and infrastructure bottlenecks.

### Complete

- **A02 — Colonist Food projection bug.** Make the pre-transfer forecast and live simulation use the same authoritative calculation, including post-transfer consumption, operational production, net balance and days remaining. **Status: Complete.** [Detailed specification](./Progression%20Stages/Stage%204/A02-Colonist-Food-Projection.md)

### Ready for Review

- None currently identified.

### Not Started

- **A24 — Upgrade targeting.** Only highlight tiles containing eligible, unblocked upgrades and remove the highlight immediately after an upgrade. Verify the existing implementation and close this item if regression coverage confirms the behaviour.
- **A01 — Conglomerate interaction terminal.** Replace the current colonist transport control with a dedicated Conglomerate Access terminal and decide which current and future conglomerate services belong there.
- **A16 — Upgraded housing Power.** Decide which accommodation levels consume Power and what happens to occupants during a Power deficit.
- **A18 — Multiple mine sites per world.** Decide limits, ownership, colony association, travel implications, infrastructure requirements and how deposits are selected.
- **A17 — Housing adjacency bonuses.** Explore possible residential clustering bonuses without creating one mandatory optimal colony layout.
- **A20a — Mine depletion.** Explore resource reserves, declining output, closure, rehabilitation and whether improved technology can recover additional material.
- **A25b — Construction-material benefits.** Explore how different construction resources might affect cost, durability, construction time or building efficiency.

---

## 5. First Major Profit Growth

**Roadmap status:** Complete  
**Purpose:** Move from basic commercial viability to meaningful surplus cash while balancing reinvestment against short-term profit.

### Ready for Review

- None currently identified.

### Not Started

- **A12a — Colony stock valuation.** Provide a current-colony inventory view showing quantity, unit price, total value and whether each resource can currently be sold.
- **A11 — Food profitability balance.** Review high-quality farm yields, labour, operating costs and sale prices so food does not become an effortless dominant source of income.
- **B01 — Bank interest.** Explore whether positive credit balances earn interest, which balances qualify, the rate calculation and appropriate unlock conditions. Consider introducing it later if early passive interest makes profit growth snowball too quickly.

---

## 6. Second Colony Establishment

**Roadmap status:** Complete  
**Purpose:** Prepare and execute the first colony expedition, establish a viable settlement and leave it capable of operating after the colony ship departs.

### Complete

- **A06 — Emergency use of landed colony-ship Food.** Prevent phantom production, consume colony Food first and require explicit approval before a colony can consume Food held by a landed player ship. **Status: Complete.** [Detailed specification](./Progression%20Stages/Stage%206/A06-Emergency-Colony-Ship-Food.md)
- **A07 — Ship and colony accommodation allocation.** Use ship-class capacity and provide fully manual movement between ship accommodation and colony housing, including warned launch into homelessness. **Status: Complete.** [Detailed specification](./Progression%20Stages/Stage%206/A07-Ship-Accommodation-Allocation.md)

### In Discovery

- **A08a — Operational Headquarters departure gate.** Prevent a colony ship from leaving a colony until a dedicated Headquarters is fully constructed and staffed to its defined minimum; ships provide no colony Power, ship residents use ship support, and unpowered planetary facilities cannot operate. **Status: In Discovery.** [Detailed specification](./Progression%20Stages/Stage%206/A08a-Operational-Headquarters-Departure-Gate.md)

### Ready for Review

- **A08b — Headquarters outage and recovery.** Apply conglomerate-network restrictions, progressive colony-efficiency loss and ten-day recovery after an established Headquarters becomes non-operational. This item was split from A08 and retains its previously agreed decisions. **Status: Ready for Review.** [Detailed specification](./Progression%20Stages/Stage%206/A08b-Headquarters-Outage-And-Recovery.md)
- **A09 and B06a — System map and planetary navigation.** Support planet selection, rerouting, time-and-Fuel-consuming in-system travel, colonisation and temporary landings from a shared system map. **Status: Ready for Review.** [Detailed specification](./Progression%20Stages/Stage%206/A09-B06a-System-Navigation.md)
- **B03a — Global ship management.** Provide a persistent global ship list and state-aware controls for navigation, journey preview, crew and accommodation. **Status: Ready for Review.** [Detailed specification](./Progression%20Stages/Stage%206/B03a-Global-Ship-Management.md)
- **A22b — Spacecraft Fuel system.** Introduce separate Propellant and Fusion Fuel tanks, compatible drives, averaged distance consumption, spaceport refuelling, warned under-fuelled journeys, stranding and rescue. **Status: Ready for Review.** [Detailed specification](./Progression%20Stages/Stage%206/A22b-Spacecraft-Fuel-System.md)
- **N01 — Veyrite lattice wear, failure and servicing.** Apply engagement and distance wear, approved risk curves, recoverable failures, collapse and external rescue to Vector Exchange Drives. This item was split from A22b. **Status: Ready for Review.** [Detailed specification](./Progression%20Stages/Stage%206/N01-Veyrite-Lattice-Wear-And-Failure.md)

### Not Started

- **B05b — New-colony contract approval.** Define the proposal, conglomerate approval, contract generation, success targets, rewards and penalties associated with founding another colony.

---

## 7. Multi-Colony Management

**Roadmap status:** Complete  
**Purpose:** Keep several separated colonies stable while coordinating their different shortages, strengths, infrastructure and investment needs.

### Ready for Review

- None currently identified.

### Not Started

- **A12b — Corporation-wide stock view.** Aggregate resource quantity and value across all colonies while retaining colony-level drill-down.
- **A10 — Automated export policy.** Define per-colony sale rules, reserves, priorities, price limits and behaviour when a corporate collection ship arrives.
- **A13 — Selling without the colony ship.** Decide whether exports use buyer collection, contracted freight, player ships or another corporate service.
- **B02 — Asset register and net worth.** Track buildings, ships, colony infrastructure and other assets, including valuation, ownership and any depreciation rules.
- **B09 — Automated corporate purchases.** Define minimum stock thresholds, spending limits, resource priorities and safeguards for automatic Food and Fuel purchasing.
- **A23 — Global and colony analytics.** Determine which management decisions analytics should support before choosing metrics, reports and charts.

---

## 8. Logistics Bottleneck

**Roadmap status:** In Progress  
**Purpose:** Give the player practical freight capacity when mining output grows beyond what the colony establishment ship and corporate collection services can transport.

### Ready for Review

- None currently identified.

### Not Started

- **A15 — Dedicated transport pricing.** Compare contracted transport with corporate purchases and rebalance fixed fees, distance, capacity, urgency and commodity costs.
- **A19 — Export quota and stockpile pressure.** Decide whether excess production should drive player freight, additional storage, discounted buyers, quota upgrades or temporary production reduction.
- **B03b — Fleet manager.** Define a corporation-wide ship list containing location, state, cargo, orders, availability and appropriate command controls.
- **B07a — Point-to-point colony transfers.** Create the first manual import/export route screen, assign a ship and define cargo, source, destination and dispatch behaviour.

---

## 9. Refining Economics

**Roadmap status:** Not Started  
**Purpose:** Introduce the choice between exporting bulky raw ore and investing Power, Industry and capital to create more valuable, transport-efficient refined materials.

### Ready for Review

- None currently identified.

### Not Started

- **A25c — Ore and quality effects in refining.** Define how ore type and quality affect refined yield, value, waste and freight efficiency.
- **B04b — Refining resource chain.** Establish raw-to-refined recipes, facilities, Power and Industry requirements, throughput, storage and economic balance.

---

## 10. Logistics Network Development

**Roadmap status:** Not Started  
**Purpose:** Expand individual freight journeys into a reusable interstellar network supported by longer-range ships, recurring routes, storage and transfer locations.

### Ready for Review

- **N02 — Gas-giant harvesting and orbital colonies.** Establish independent orbital colonies, persistent atmospheric sectors, skimmers, processing, reactor survival and long-term Fusion Fuel manufacture. This item was discovered through A22b. **Status: Ready for Review.** [Detailed specification](./Progression%20Stages/Stage%2010/N02-Gas-Giant-Orbital-Colonies.md)

### Not Started

- **A26 — Long-range ship progression.** Define larger ship classes, construction or purchase requirements, range, Fuel, crew and technology needed to reach outer systems.
- **B06b — Inter-system ship transfers.** Define interstellar orders, route selection, arrival state, diversions, Fuel validation and access through the star and system maps.
- **B07b — Automated logistics routes.** Expand manual transfers into recurring routes with loading rules, minimum reserves, delivery thresholds, priorities and disruption handling.
- **B07c — Warehouse and logistics-hub colonies.** Explore transfer hubs, bulk storage, load consolidation, refuelling and hub-and-spoke freight networks.

---

## 11. Commercial Market Expansion

**Roadmap status:** Not Started  
**Purpose:** Broaden commercial options beyond the conglomerate's basic buying service by introducing more demanding buyers and access to external supply.

### Ready for Review

- None currently identified.

### Not Started

- **B08 — Seller marketplace.** Create the inverse of the buyer system, including availability, quantity, quality, delivery method, reputation access and pricing.
- **A14 — Variable market prices.** Explore price movement, regional markets, supply and demand, volatility, forecasting and anti-exploit protections.

---

## 12. Contract Portfolio Management

**Roadmap status:** Not Started  
**Purpose:** Make the player allocate finite production, refining and freight capacity across multiple simultaneous commercial commitments.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 13. Reputation Building

**Roadmap status:** Not Started  
**Purpose:** Reward dependable contract performance with commercial credibility and access to more valuable opportunities.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 14. Buyer Relationship Development

**Roadmap status:** Not Started  
**Purpose:** Turn repeated dealings with named contacts into trusted relationships that can later support direct independent trade.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 15. Independence Preparation

**Roadmap status:** Not Started  
**Purpose:** Accumulate the capital, independently owned assets, mining rights, reputation and buyer commitments needed to operate without conglomerate support.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 16. First Independent Operation

**Roadmap status:** Not Started  
**Purpose:** Establish the first genuinely player-owned mining operation without conglomerate-funded startup assets or supplies.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 17. Commercial Separation

**Roadmap status:** Not Started  
**Purpose:** Transition from selling through the conglomerate to negotiating and fulfilling direct agreements with buyers.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 18. Independent Expansion

**Roadmap status:** Not Started  
**Purpose:** Reinvest independent profit into a growing network of player-owned colonies, ships, refineries, hubs and supporting infrastructure.

### Ready for Review

- None currently identified.

### Not Started

- **B04c — Full manufacturing economy.** Explore production chains capable of turning raw resources into components, habitats and player-manufactured ships. This is a long-term manufacturing extension rather than a prerequisite for purchasing factory-new Stage 8 freight ships.

---

## 19. Direct Competition

**Roadmap status:** Not Started  
**Purpose:** Compete with the original conglomerate and other major corporations for buyers, contracts, resources and strategic locations.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 20. Interstellar Mining Corporation

**Roadmap status:** Not Started  
**Purpose:** Coordinate production, refining, finance, logistics and commercial relationships across a large multi-system business.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 21. Outgrowing the Conglomerate

**Roadmap status:** Not Started  
**Purpose:** Surpass the original sponsor in revenue, profit, assets, production, freight capacity, relationships and major contracts.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## 22. Late-Game Economic Dominance

**Roadmap status:** Not Started  
**Purpose:** Sustain open-ended growth by repeatedly identifying and removing the corporation's most important economic or operational bottleneck.

### Ready for Review

- None currently identified.

### Not Started

- None currently identified.

---

## Cross-stage dependencies

1. **Food behaviour:** A06 defines the authoritative colony-versus-ship Food source rules. A02 must read the same domain Food calculation used by the live simulation.
2. **Ship capability data:** A07 and A22b require canonical ship-class accommodation, drive, tank-capacity and consumption-rate fields.
3. **Navigation and ship control:** A09/B06a and B03a must share route, ship-state and Fuel-preview services before later fleet automation and recurring logistics.
4. **Headquarters state:** A08a requires authoritative construction and staffing eligibility for colony-ship departure, removes ship-provided colony Power, and aligns ship-resident/planetary operational ownership during establishment. The existing 50 Industry baseline remains under discovery. A08b separately owns network-service restrictions, Headquarters outage degradation and recovery state with save/load support.
5. **Veyrite condition:** N01 extends A22b but remains a separate maintained-drive system rather than another Fuel.
6. **Gas-giant production:** N02 provides a later source of atmospheric feedstock and manufactured Fusion Fuel. It does not block the first A22b release because Fuel can be purchased from the conglomerate.
7. **Corporation reporting:** A12 should precede B02 and A23.
8. **Contract expansion:** B05a should precede new-colony contracts and the later contract-portfolio stages.

## Roadmap review notes

- Stage 6 should be reviewed for a possible temporary return to **In Progress** because several ready-for-review items affect the end-to-end second-colony loop.
- Stage 7 should be reviewed if a colony without the colony ship currently lacks a valid export route.
- Stage 8 is based on purchasing and operating factory-new freight ships. Player-designed and player-built ships belong to later progression.
- Gas-giant orbital colonies are placed in Stage 10 as later logistics and Fuel-production infrastructure, not as a prerequisite for Stage 6 travel.
- The present backlog is concentrated in Stages 1–11. Stages 12–17 and 19–22 remain available for future discovery work.
