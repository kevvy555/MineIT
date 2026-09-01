# MineIT Progression Stages Backlog

This document is the companion backlog to [PLAYER_PROGRESSION_STAGES.md](./PLAYER_PROGRESSION_STAGES.md). It organises proposed features and reported bugs by the earliest player-progression stage in which they become relevant.

The roadmap status describes whether a stage is implemented. The maturity headings in this backlog describe how ready an individual backlog item is for development:

- **Complete** — the intended outcome is sufficiently formed to move into implementation. This does not mean the work has already been implemented.
- **Discovery** — the direction is reasonably clear, but gameplay rules, balance, user experience or acceptance criteria still require investigation.
- **Idea** — an early concept or problem statement that needs a deeper design exercise before implementation can be planned.

For traceability, references beginning with **A** correspond to the first numbered source list and references beginning with **B** correspond to the second list, where numbering restarted.

---

## 1. Initial Survival

**Roadmap status:** Complete  
**Purpose:** Establish the immediate survival loop. The player must keep the starting population alive while shortages in Food, Fuel, Power, housing and workforce create urgent pressure.

### Complete

- **A05b — Construction progress presentation.** Display a tile-wide black construction mask or progress overlay that gradually reveals the completed building.

### Discovery

- **A03a — Colonist calorie requirement.** Establish one authoritative per-colonist calorie-consumption model shared by simulation, forecasting and the user interface.
- **A05a — Timed building construction.** Define construction duration, when a building becomes operational, interruption and cancellation rules, save/load behaviour, and whether workforce or materials affect build speed.

### Idea

- None currently identified.

---

## 2. Basic Self-Sufficiency

**Roadmap status:** Complete  
**Purpose:** Move the colony away from finite starting supplies by establishing dependable local production of the resources required for continued survival.

### Complete

- None currently identified.

### Discovery

- **A03b — Food nutritional model.** Give each food type and quality a calorie value so different foods have meaningful nutritional benefits.
- **A04 — Hydroponics Centre.** Define its technology unlock, Power and Water consumption, workforce, seeds or growing medium, production rate and suitability for hostile planets.
- **A20b and A21 — Renewable and depletable food sources.** Decide how natural food sites, conventional farms and hydroponics differ, including regeneration, declining yields and exhaustion.
- **A22a — Fuel compatibility.** Define which fuels can be consumed by each generator, machine and industrial process.
- **A25a — Food and fuel quality benefits.** Define how food quality affects nutrition and how fuel type and quality affect energy output or duration.
- **B04a — Resource model audit.** Review the current resource catalogue, remove inconsistencies and establish canonical raw-resource categories before expanding the economy.

### Idea

- None currently identified.

---

## 3. Contract Viability

**Roadmap status:** Complete  
**Purpose:** Turn the surviving colony into a commercially useful operation that fulfils the reason the conglomerate funded it.

### Complete

- None currently identified.

### Discovery

- **B05a — Core contract redesign.** Redefine contract objectives, success levels, monetary rewards, penalties and failure consequences so the original contract still fits the expanded game.

### Idea

- None currently identified.

---

## 4. Production Expansion

**Roadmap status:** Complete  
**Purpose:** Increase the scale and efficiency of extraction by overcoming workforce, Power, Industry, technology and infrastructure bottlenecks.

### Complete

- **A02 — Colonist food projection bug.** Food forecasting during colonist onboarding must use the same consumption and reserve calculation as the live simulation.
- **A24 — Upgrade targeting.** Only highlight tiles containing eligible, unblocked upgrades and remove the highlight immediately after an upgrade. Verify the existing implementation and close this item if regression coverage confirms the behaviour.

### Discovery

- **A01 — Conglomerate interaction terminal.** Replace the current colonist transport control with a dedicated Conglomerate Access terminal and decide which current and future conglomerate services belong there.
- **A16 — Upgraded housing Power.** Decide which accommodation levels consume Power and what happens to occupants during a Power deficit.
- **A18 — Multiple mine sites per world.** Decide limits, ownership, colony association, travel implications, infrastructure requirements and how deposits are selected.

### Idea

- **A17 — Housing adjacency bonuses.** Explore possible residential clustering bonuses without creating one mandatory optimal colony layout.
- **A20a — Mine depletion.** Explore resource reserves, declining output, closure, rehabilitation and whether improved technology can recover additional material.
- **A25b — Construction-material benefits.** Explore how different construction resources might affect cost, durability, construction time or building efficiency.

---

## 5. First Major Profit Growth

**Roadmap status:** Complete  
**Purpose:** Move from basic commercial viability to meaningful surplus cash while balancing reinvestment against short-term profit.

### Complete

- **A12a — Colony stock valuation.** Provide a current-colony inventory view showing quantity, unit price, total value and whether each resource can currently be sold.

### Discovery

- **A11 — Food profitability balance.** Review high-quality farm yields, labour, operating costs and sale prices so food does not become an effortless dominant source of income.

### Idea

- **B01 — Bank interest.** Explore whether positive credit balances earn interest, which balances qualify, the rate calculation and appropriate unlock conditions. Consider introducing it later if early passive interest makes profit growth snowball too quickly.

---

## 6. Second Colony Establishment

**Roadmap status:** Complete  
**Purpose:** Prepare and execute the first colony expedition, establish a viable settlement and leave it capable of operating after the colony ship departs.

### Complete

- **A06 — Phantom food production bug.** A new colony without food production must consume ship food first and then colony food without generating additional food.
- **A07 — Ship accommodation.** Replace the fixed 180-person assumption with the ship class's actual accommodation capacity and separately track colonists living aboard and in colony housing.
- **A08 — Operational Headquarters gate.** Prevent the colony ship from leaving until an operational headquarters has taken over the colony's command function.
- **A09 and B06a — System map and planetary navigation.** Provide a system map accessible from the star map and colony, allow selection of any planet in the current system, and support both landing and colonisation.
- **B03a — Dedicated ship control.** Move launch and navigation out of the cargo bay into a ship-control surface accessible from anywhere.
- **A22b — Spacecraft fuel restriction.** Allow ships to consume only compatible propulsion fuels; biomass must not function as spacecraft fuel.

### Discovery

- **B05b — New-colony contract approval.** Define the proposal, conglomerate approval, contract generation, success targets, rewards and penalties associated with founding another colony.

### Idea

- None currently identified.

---

## 7. Multi-Colony Management

**Roadmap status:** Complete  
**Purpose:** Keep several separated colonies stable while coordinating their different shortages, strengths, infrastructure and investment needs.

### Complete

- **A12b — Corporation-wide stock view.** Aggregate resource quantity and value across all colonies while retaining colony-level drill-down.

### Discovery

- **A10 — Automated export policy.** Define per-colony sale rules, reserves, priorities, price limits and behaviour when a corporate collection ship arrives.
- **A13 — Selling without the colony ship.** Decide whether exports use buyer collection, contracted freight, player ships or another corporate service.
- **B02 — Asset register and net worth.** Track buildings, ships, colony infrastructure and other assets, including valuation, ownership and any depreciation rules.
- **B09 — Automated corporate purchases.** Define minimum stock thresholds, spending limits, resource priorities and safeguards for automatic Food and Fuel purchasing.

### Idea

- **A23 — Global and colony analytics.** Determine which management decisions analytics should support before choosing metrics, reports and charts.

---

## 8. Logistics Bottleneck

**Roadmap status:** In Progress  
**Purpose:** Give the player practical freight capacity when mining output grows beyond what the colony establishment ship and corporate collection services can transport.

### Complete

- None currently identified.

### Discovery

- **A15 — Dedicated transport pricing.** Compare contracted transport with corporate purchases and rebalance fixed fees, distance, capacity, urgency and commodity costs.
- **A19 — Export quota and stockpile pressure.** Decide whether excess production should drive player freight, additional storage, discounted buyers, quota upgrades or temporary production reduction.
- **B03b — Fleet manager.** Define a corporation-wide ship list containing location, state, cargo, orders, availability and appropriate command controls.
- **B07a — Point-to-point colony transfers.** Create the first manual import/export route screen, assign a ship and define cargo, source, destination and dispatch behaviour.

### Idea

- None currently identified.

---

## 9. Refining Economics

**Roadmap status:** Not Started  
**Purpose:** Introduce the choice between exporting bulky raw ore and investing Power, Industry and capital to create more valuable, transport-efficient refined materials.

### Complete

- None currently identified.

### Discovery

- **A25c — Ore and quality effects in refining.** Define how ore type and quality affect refined yield, value, waste and freight efficiency.
- **B04b — Refining resource chain.** Establish raw-to-refined recipes, facilities, Power and Industry requirements, throughput, storage and economic balance.

### Idea

- None currently identified.

---

## 10. Logistics Network Development

**Roadmap status:** Not Started  
**Purpose:** Expand individual freight journeys into a reusable interstellar network supported by longer-range ships, recurring routes, storage and transfer locations.

### Complete

- None currently identified.

### Discovery

- **A26 — Long-range ship progression.** Define larger ship classes, construction or purchase requirements, range, Fuel, crew and technology needed to reach outer systems.
- **B06b — Inter-system ship transfers.** Define interstellar orders, route selection, arrival state, diversions, Fuel validation and access through the star and system maps.
- **B07b — Automated logistics routes.** Expand manual transfers into recurring routes with loading rules, minimum reserves, delivery thresholds, priorities and disruption handling.

### Idea

- **B07c — Warehouse and logistics-hub colonies.** Explore transfer hubs, bulk storage, load consolidation, refuelling and hub-and-spoke freight networks.

---

## 11. Commercial Market Expansion

**Roadmap status:** Not Started  
**Purpose:** Broaden commercial options beyond the conglomerate's basic buying service by introducing more demanding buyers and access to external supply.

### Complete

- None currently identified.

### Discovery

- **B08 — Seller marketplace.** Create the inverse of the buyer system, including availability, quantity, quality, delivery method, reputation access and pricing.

### Idea

- **A14 — Variable market prices.** Explore price movement, regional markets, supply and demand, volatility, forecasting and anti-exploit protections.

---

## 12. Contract Portfolio Management

**Roadmap status:** Not Started  
**Purpose:** Make the player allocate finite production, refining and freight capacity across multiple simultaneous commercial commitments.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 13. Reputation Building

**Roadmap status:** Not Started  
**Purpose:** Reward dependable contract performance with commercial credibility and access to more valuable opportunities.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 14. Buyer Relationship Development

**Roadmap status:** Not Started  
**Purpose:** Turn repeated dealings with named contacts into trusted relationships that can later support direct independent trade.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 15. Independence Preparation

**Roadmap status:** Not Started  
**Purpose:** Accumulate the capital, independently owned assets, mining rights, reputation and buyer commitments needed to operate without conglomerate support.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 16. First Independent Operation

**Roadmap status:** Not Started  
**Purpose:** Establish the first genuinely player-owned mining operation without conglomerate-funded startup assets or supplies.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 17. Commercial Separation

**Roadmap status:** Not Started  
**Purpose:** Transition from selling through the conglomerate to negotiating and fulfilling direct agreements with buyers.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 18. Independent Expansion

**Roadmap status:** Not Started  
**Purpose:** Reinvest independent profit into a growing network of player-owned colonies, ships, refineries, hubs and supporting infrastructure.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- **B04c — Full manufacturing economy.** Explore production chains capable of turning raw resources into components, habitats and player-manufactured ships. This is a long-term manufacturing extension rather than a prerequisite for purchasing factory-new Stage 8 freight ships.

---

## 19. Direct Competition

**Roadmap status:** Not Started  
**Purpose:** Compete with the original conglomerate and other major corporations for buyers, contracts, resources and strategic locations.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 20. Interstellar Mining Corporation

**Roadmap status:** Not Started  
**Purpose:** Coordinate production, refining, finance, logistics and commercial relationships across a large multi-system business.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 21. Outgrowing the Conglomerate

**Roadmap status:** Not Started  
**Purpose:** Surpass the original sponsor in revenue, profit, assets, production, freight capacity, relationships and major contracts.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## 22. Late-Game Economic Dominance

**Roadmap status:** Not Started  
**Purpose:** Sustain open-ended growth by repeatedly identifying and removing the corporation's most important economic or operational bottleneck.

### Complete

- None currently identified.

### Discovery

- None currently identified.

### Idea

- None currently identified.

---

## Cross-stage dependencies

The backlog contains several connected groups that should be designed and implemented in dependency order:

1. **Food economy:** A03 before A02, A04, A06, A11, the food portion of A20/A21 and B09.
2. **Resource economy:** B04a before A22, A25, refining, seller markets and variable pricing.
3. **Navigation and logistics:** A09/B06a and B03a before the fleet manager, freight routes, recurring logistics and warehouse hubs.
4. **Corporation reporting:** A12 before B02 and A23.
5. **Contract expansion:** B05a before new-colony contracts and the later contract-portfolio stages.

## Roadmap review notes

- Stage 6 should be reviewed for a possible temporary return to **In Progress** because several items affect the end-to-end second-colony loop.
- Stage 7 should be reviewed if a colony without the colony ship currently lacks a valid export route.
- Stage 8 is based on purchasing and operating factory-new freight ships. Player-designed and player-built ships belong to later progression.
- The present backlog is concentrated in Stages 1–11. Stages 12–17 and 19–22 remain available for future discovery work.
