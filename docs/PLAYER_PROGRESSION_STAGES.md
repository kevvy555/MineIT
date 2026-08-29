# MineIT Player Progression Stages

This document defines the intended end-to-end player progression from early survival through late-game economic dominance.

The status on each stage tracks **development implementation**, not an individual player's in-game progress.

## Status values

- **Not Started** — the stage is defined conceptually but its required gameplay systems are not yet implemented.
- **In Progress** — some supporting systems exist or active implementation/design work is underway, but the stage is not yet complete as an end-to-end gameplay experience.
- **Complete** — the required gameplay systems for the stage are implemented and form a playable part of the current progression.

---

## 1. Initial Survival

**Status:** Complete  
**Description:** The player begins with a small conglomerate-funded colony and limited starting supplies.  
**Pressure:** Food, Fuel, Power, housing and workforce shortages can quickly destabilise or destroy the colony.  
**Solution:** Stabilise the colony and keep the population alive long enough to establish dependable local production.

## 2. Basic Self-Sufficiency

**Status:** Complete  
**Description:** The colony must transition away from relying on the equipment and supplies provided at the start of the contract.  
**Pressure:** Starting reserves continually fall while the colony remains dependent on resources it cannot yet reliably replace.  
**Solution:** Develop enough Food, Fuel, Power and supporting infrastructure for the colony to sustain itself.

## 3. Contract Viability

**Status:** Complete  
**Description:** Once survival is secured, the colony must begin fulfilling the commercial purpose for which it was established.  
**Pressure:** The conglomerate expects the operation to generate saleable resources and ultimately become profitable.  
**Solution:** Establish reliable extraction and begin producing enough valuable resources to satisfy the original mining contract.

## 4. Production Expansion

**Status:** Complete  
**Description:** The player begins deliberately increasing the scale and efficiency of the mining operation.  
**Pressure:** Workforce, Power, Industry, technology and extraction capacity become bottlenecks as production grows.  
**Solution:** Identify and remove whichever production bottleneck is currently preventing higher output.

## 5. First Major Profit Growth

**Status:** Complete  
**Description:** The colony moves from being commercially viable to generating meaningful surplus cash.  
**Pressure:** Money spent improving production delays cash accumulation, while under-investment limits future profitability.  
**Solution:** Balance reinvestment and profit-taking until enough capital and technology exist to support expansion.

## 6. Second Colony Establishment

**Status:** Complete  
**Description:** The player uses the colony ship to establish another conglomerate-backed operation in a new location.  
**Pressure:** Colonists, Food, Fuel, equipment and cargo must all be prepared while the journey itself carries significant risk.  
**Solution:** Assemble a viable expedition, choose a suitable destination and successfully establish a second colony.

## 7. Multi-Colony Management

**Status:** Complete  
**Description:** The corporation now operates several geographically separated colonies rather than one isolated settlement.  
**Pressure:** Each colony develops different resource shortages, workforce requirements, production strengths and infrastructure needs.  
**Solution:** Keep multiple colonies stable while directing investment toward the locations that provide the greatest strategic value.

## 8. Logistics Bottleneck

**Status:** In Progress  
**Description:** Mining production begins growing beyond what the colony establishment ship or corporate collection system can realistically transport.  
**Pressure:** Valuable resources accumulate in storage because freight throughput cannot keep pace with production.  
**Solution:** Design, build and operate specialised freight ships with the right capacity, range, speed and efficiency for the required routes.  
**Implementation progress:** The physical-support foundation for this stage is implemented: colony-specific capability deployment through conglomerate Engineering Ships, fixed Engineering Ship transport plus individual package pricing, same-day batching, five-day preparation, Spaceport berths, orbital holding, and separate Mining/Scanning capability. Scanning now records the equipment level used, hides resources that cannot yet be detected, makes all older scans eligible for 50%-time resurvey when better Scanning is commissioned, and marks those opportunities with a yellow `?` on the normal colony map. Housing, Industry and Power can be rescanned while operating; resources discovered beneath them remain known but blocked until normal demolition, and known resources can deliberately be built over. Resource detection requirements now use an explicit L1–L10 physical-detectability ladder, and save-v11 preserves/migrates scan history without leaking legacy hidden anomalies. Local buildings and extraction still consume only capabilities physically commissioned at that colony. The stage remains **In Progress** because player-designed freight ships, scalable ore transport and the broader logistics network are not yet implemented.

## 9. Refining Economics

**Status:** Not Started  
**Description:** The player gains the ability to process raw ores into more valuable and more transport-efficient materials.  
**Pressure:** Raw ore is bulky and comparatively low value, while refining consumes Power, Industry, infrastructure and capital.  
**Solution:** Decide which resources should be exported raw and which should be refined to maximise profit per unit of production and freight capacity.

## 10. Logistics Network Development

**Status:** Not Started  
**Description:** Individual point-to-point freight journeys develop into a wider interstellar transport network.  
**Pressure:** Increasing distances create problems with Fuel range, storage capacity, ship utilisation and journey time.  
**Solution:** Establish strategically positioned planets, moons and stations that provide refuelling, warehousing and freight-transfer capabilities.

## 11. Commercial Market Expansion

**Status:** Not Started  
**Description:** The player begins gaining access to buyers beyond the conglomerate's basic commodity purchasing operation.  
**Pressure:** Better buyers demand specific resources, refinement levels, qualities, quantities and delivery terms.  
**Solution:** Match production and logistics capabilities to increasingly valuable buyer opportunities offered through the conglomerate's commercial network.

## 12. Contract Portfolio Management

**Status:** Not Started  
**Description:** Multiple buyers begin competing indirectly for the corporation's finite production, refining and freight capacity.  
**Pressure:** Accepting one lucrative contract may consume resources or ships required to fulfil another.  
**Solution:** Build a portfolio of contracts that maximises sustainable profit without committing more capacity than the corporation can reliably deliver.

## 13. Reputation Building

**Status:** Not Started  
**Description:** The corporation becomes known within the wider commercial network through repeated contract performance.  
**Pressure:** High-value buyers prefer suppliers with proven reliability and may avoid companies that miss deliveries or fail contracts.  
**Solution:** Build strong operational and commercial reputation by consistently delivering the right materials at the agreed quality, quantity and time.

## 14. Buyer Relationship Development

**Status:** Not Started  
**Description:** The player increasingly interacts directly with named commercial contacts while contracts are still formally controlled by the conglomerate.  
**Pressure:** Buyers may trust the player's operation but remain legally or commercially tied to existing conglomerate agreements.  
**Solution:** Build personal commercial relationships that may eventually become direct buyer relationships once contractual restrictions allow it.

## 15. Independence Preparation

**Status:** Not Started  
**Description:** The player begins preparing to operate a mining company whose assets and colonies are no longer owned by the original conglomerate.  
**Pressure:** Existing colonies, buildings and much of the original infrastructure belong to the conglomerate, while independent operations require substantial capital and commercial credibility.  
**Solution:** Accumulate cash, independent ships, infrastructure, mining rights, reputation and potential buyer commitments sufficient to operate without conglomerate support.

## 16. First Independent Operation

**Status:** Not Started  
**Description:** The player establishes the first mining operation genuinely owned by their own corporation.  
**Pressure:** Equipment, ships, colonists, supplies, land or mining rights and infrastructure must now be funded without the conglomerate subsidising the startup.  
**Solution:** Successfully finance and establish an independently owned colony that can survive and become commercially viable.

## 17. Commercial Separation

**Status:** Not Started  
**Description:** The player's company begins transitioning from selling through the conglomerate to contracting directly with buyers.  
**Pressure:** Existing buyer contracts, exclusivity agreements and the player's own obligations to the conglomerate restrict who can legally trade directly.  
**Solution:** Secure direct buyers as contracts expire, persuade trusted contacts not to renew with the conglomerate and negotiate independent supply agreements.

## 18. Independent Expansion

**Status:** Not Started  
**Description:** The player's corporation begins building a network of assets whose value genuinely belongs to the player.  
**Pressure:** Every new colony, ship, refinery and logistics facility must be funded from the corporation's own capital while existing contracts still need servicing.  
**Solution:** Reinvest independent profits into a growing player-owned network of colonies, refineries, hubs and freight fleets.

## 19. Direct Competition

**Status:** Not Started  
**Description:** The player's company becomes large enough to compete commercially with the original conglomerate and other major corporations.  
**Pressure:** Competitors pursue the same buyers, contracts, resources and strategically valuable locations.  
**Solution:** Win business through better prices, reliability, material quality, production scale and logistics efficiency.

## 20. Interstellar Mining Corporation

**Status:** Not Started  
**Description:** The company has evolved from a contract operator into a substantial independent interstellar mining business.  
**Pressure:** Production, refining, logistics, finance and commercial relationships become increasingly complex across many systems.  
**Solution:** Build organisational and infrastructure capacity capable of coordinating a large commercial empire without allowing one subsystem to constrain the others.

## 21. Outgrowing the Conglomerate

**Status:** Not Started  
**Description:** The original conglomerate changes from sponsor and commercial gateway into one of the player's principal competitors.  
**Pressure:** The conglomerate still possesses enormous assets, established buyers, logistics infrastructure, reputation and market influence.  
**Solution:** Surpass the conglomerate in measures such as revenue, profit, owned assets, production, freight capacity, buyer relationships and major contracts.

## 22. Late-Game Economic Dominance

**Status:** Not Started  
**Description:** The player's corporation becomes one of the dominant economic forces in the interstellar resource economy.  
**Pressure:** Growth continually creates new bottlenecks across production, processing, logistics, buyer demand and capital allocation rather than reaching a fixed numerical ceiling.  
**Solution:** Continuously identify and eliminate the corporation's current limiting factor so revenue, profit, assets and influence can theoretically continue growing without limit.

---

## Development tracking rule

Update the `Status` field whenever development materially changes one of these stages. A stage should only move to **Complete** when the required gameplay loop is implemented end-to-end and has appropriate regression/browser coverage; partial supporting systems should remain **In Progress**.
