# Stage 8 — Conglomerate Buyers Service

Status: **Not Started**  
Design state: **Core gameplay rules approved; UI mockups pending review**

## Purpose

The **Conglomerate Buyers Service** solves the mid-game commercial bottleneck where a productive colony has more saleable output than the ordinary Corporate Ship can absorb.

The conglomerate already deals with a large network of outside industrial customers. As the player's global reputation improves, the conglomerate exposes more of those customers to the colony and brokers recurring supply contracts on the player's behalf.

These remain **conglomerate-brokered contracts**:

- the conglomerate owns/brokers the commercial relationship;
- the outside buyer sends its own collection ship;
- buyer collection capacity is independent of ordinary Corporate Ship export capacity;
- the buyer pays less per unit than the conglomerate's own direct purchase rate because the conglomerate takes a margin and the outside buyer is price-sensitive;
- later progression can still introduce direct player-owned commercial relationships.

The Stage 8 pressure becomes:

**Production Rate → Corporate Export Capacity → Brokered Buyer Capacity / Reliability → Player Freight Capacity**

The system must create meaningful extra demand without simply increasing the Corporate Ship's cargo number.

---

## Core player loop

1. Open **CONGLOMERATE BUYERS SERVICE** from the current colony ship/colony-management panel.
2. Browse the complete buyer catalogue.
3. Sort and filter by buyer, company, resource, quality, shipment amount, unit price, frequency and reputation requirement.
4. Inspect opportunities that match the colony's production.
5. Reputation-eligible offers show **CONTACT**; locked offers remain visible but cannot be contacted.
6. CONTACT opens the full buyer/company/contract profile.
7. Press **ENTER CONTRACT** to establish the recurring contract for the current colony.
8. Produce and hold enough qualifying stock before the buyer's collection cycle.
9. The buyer sends its own named collection ship.
10. The ship must obtain a Spaceport berth before stock can be transferred.
11. When actionable, the game pauses and shows the buyer-ship collection popup.
12. Transfer a full or permitted partial shipment, or make the buyer wait for the next collection attempt.
13. Reliable service slowly improves the buyer relationship and global reputation; late, partial and missed deliveries damage them.
14. Poor service can terminate the contract.

The arrival remains a visible player event. Initial implementation does **not** auto-fulfil buyer contracts.

---

# Buyer identity and commercial world

The player should feel they are dealing with a real commercial organisation and a real contact, not a generic demand row.

## 1,000-buyer pool

The game will have a static content pool of **1,000 unique buyers**. Each buyer record has a stable ID and, at minimum:

- unique contact name;
- job title / commercial role;
- unique company name;
- company business type;
- company size tier;
- home system/region flavour text where useful;
- preferred/eligible resource families;
- reputation range appropriate to that buyer;
- a unique primary collection ship name;
- one of the 30 collection-ship classes below;
- portrait/image assignment key;
- stable buyer ID.

The 1,000 records should be generated once during development and committed as static game data. They must **not** reroll names or company identities on reload.

A new game uses the game/world seed to select and order opportunities from this pool. The same save therefore retains the same commercial world.

Company business types may repeat across the pool, but contact name + company name + primary ship name should be unique.

Suggested business-type families include mining supply, heavy engineering, shipbuilding, electronics, energy generation, fuel processing, construction, habitat fabrication, agriculture, food processing, medical manufacturing, precision instruments, jewellery/luxury goods, research laboratories, reactor engineering, advanced materials, aerospace, infrastructure and interstellar logistics.

## Buyer/company scale

Buyer size should broadly increase with reputation requirement:

- small/local buyers: smaller loads and smaller ships;
- regional buyers: moderate recurring loads;
- major industrial buyers: large recurring loads and stronger quality requirements;
- strategic/premier buyers: very large or highly specialised loads, advanced resources and high reliability expectations.

A high-reputation buyer does not automatically offer the best unit price. Quantity, cadence, quality requirement and price should still create meaningful comparison.

---

# Buyer portrait assets

Buyer portraits are presentation assets, not gameplay state.

Canonical image folder:

`assets/art/buyers/`

Preferred filename convention:

`buyer-0001.webp` through `buyer-1000.webp`

The portrait pool can grow gradually. The game must work with only a small subset present.

## Seeded assignment rules

- buyer identities are stable independently of images;
- at new-game buyer seeding, available portrait assets are assigned deterministically;
- the assignment should use portraits **without replacement first**, especially for low-reputation/early-game buyers, so the buyers the player sees first are as visually distinct as possible;
- when available portraits are exhausted, reuse is allowed;
- adding more portraits later may improve newly generated games but must not reshuffle portraits already persisted in an existing save;
- the buyer portrait is only required in CONTACT / VIEW / ship-event detail presentation, not in the dense catalogue table.

## Missing-image fallback

Until a buyer has a usable portrait, the portrait area shows a strong text fallback using the buyer's name/initials. A missing image must never prevent the popup from opening.

---

# Thirty collection-ship classes

Every buyer has an explicitly named primary collection ship, for example **CSV Halcyon Reach**, and that ship has one of these 30 classes.

The company/buyer scale should bias toward larger classes. Contract shipment quantity must never exceed the assigned ship's cargo capacity.

| # | Ship class | Cargo capacity |
|---:|---|---:|
| 1 | Dart Courier | 2,500 |
| 2 | Wren Shuttle | 4,000 |
| 3 | Kestrel Light Freighter | 6,000 |
| 4 | Skipper Packet | 8,000 |
| 5 | Nomad Utility Freighter | 12,000 |
| 6 | Ranger Cargo Cutter | 18,000 |
| 7 | Wayfarer Freighter | 25,000 |
| 8 | Merchant Lifter | 35,000 |
| 9 | Caravan Freighter | 50,000 |
| 10 | Atlas Hauler | 70,000 |
| 11 | Meridian Bulk Carrier | 90,000 |
| 12 | Vanguard Hauler | 120,000 |
| 13 | Longreach Freighter | 160,000 |
| 14 | Foundry Carrier | 210,000 |
| 15 | Reliant Bulkship | 270,000 |
| 16 | Leviathan Freighter | 350,000 |
| 17 | Mammoth Carrier | 450,000 |
| 18 | Colossus Bulkship | 575,000 |
| 19 | Goliath Heavy Freighter | 725,000 |
| 20 | Citadel Carrier | 900,000 |
| 21 | Bastion Superfreighter | 1,100,000 |
| 22 | Monolith Bulk Carrier | 1,350,000 |
| 23 | Horizon Superfreighter | 1,600,000 |
| 24 | Dominion Carrier | 1,900,000 |
| 25 | Titan Logistics Carrier | 2,200,000 |
| 26 | Continental Bulkship | 2,500,000 |
| 27 | Hyperion Supercarrier | 2,800,000 |
| 28 | Keystone Megafreighter | 3,200,000 |
| 29 | Panstellar Megacarrier | 3,600,000 |
| 30 | Worldline Mass Freighter | 4,000,000 |

The class is a logistics/capacity identity only for this feature; no player ship-design system is being added here.

---

# Buyer offer definition

Every buyer offer defines:

- buyer/contact ID;
- company ID/name/business type;
- offer ID;
- current colony eligibility;
- required resource;
- minimum accepted quality;
- target quantity per shipment;
- unit rate;
- total full-shipment value;
- collection interval in days;
- global reputation requirement;
- primary ship name and class;
- contract state;
- persisted relationship/happiness state.

All buyer offers remain visible. Reputation only controls whether CONTACT is actionable.

---

# Buyer pricing

## Price invariant

Brokered buyer unit rates must always remain **below the ordinary direct conglomerate selling rate for the equivalent quality material**.

The strategic value is extra demand/collection capacity, not a better base sale price.

Recommended generated buyer-rate envelope:

- early buyers: roughly **65–88%** of equivalent direct conglomerate rate;
- mid buyers: roughly **60–90%**;
- late/premier buyers: roughly **55–92%**.

The ranges deliberately overlap. A prestigious contract may pay worse than a smaller buyer if it compensates through volume or cadence.

Exact seeded offer values are balance data, but once an offer is generated and entered its price is locked for that contract.

---

# Contract cadence by market tier

Recommended generation bands:

| Buyer tier | Typical global rep | Typical collection interval | Typical ship classes |
|---|---:|---:|---:|
| Local / Entry | 0–9.99 | 45–90 days | 1–8 |
| Regional | 10–24.99 | 35–75 days | 4–12 |
| Major | 25–49.99 | 25–60 days | 8–18 |
| Strategic | 50–74.99 | 20–45 days | 13–24 |
| Premier | 75–100 | 15–40 days | 18–30 |

Larger/reputation-gated customers therefore tend to demand more regular and larger shipments without every buyer becoming identical.

---

# Contract shipment amount ranges by resource

These are the **design generation ranges per shipment**. Individual buyers seed a fixed quantity inside the appropriate band and retain it for the contract.

Market phases:

- **Early:** global reputation 0–19.99;
- **Mid:** 20–59.99;
- **Late:** 60–100.

`—` means that resource should normally not generate buyer contracts in that phase.

## Food

| Resource | Early | Mid | Late |
|---|---:|---:|---:|
| Fungal Shelf | 1,000–8,000 | 8,000–40,000 | 40,000–180,000 |
| Edible Flora | 1,000–8,000 | 8,000–40,000 | 40,000–180,000 |
| Grazing Herd | 750–6,000 | 6,000–30,000 | 30,000–130,000 |
| Nutrient Crop | 1,000–7,000 | 7,000–35,000 | 35,000–150,000 |
| Protein Bloom | 500–4,000 | 4,000–22,000 | 22,000–90,000 |
| Thermal Algae | 300–2,500 | 2,500–15,000 | 15,000–70,000 |
| Synthetic Nutrient | 500–4,000 | 4,000–25,000 | 25,000–120,000 |

## Build materials

| Resource | Early | Mid | Late |
|---|---:|---:|---:|
| Construction Fibre | 2,000–15,000 | 15,000–80,000 | 80,000–500,000 |
| Stone | 3,000–25,000 | 25,000–150,000 | 150,000–1,250,000 |
| Clay | 2,000–18,000 | 18,000–100,000 | 100,000–650,000 |
| Silica | 1,500–15,000 | 15,000–90,000 | 90,000–500,000 |
| Limestone | 2,000–18,000 | 18,000–100,000 | 100,000–650,000 |
| Structural Mineral | 800–7,500 | 7,500–50,000 | 50,000–250,000 |
| Advanced Ceramic Feedstock | — | 1,000–10,000 | 10,000–80,000 |

## Fuel

| Resource | Early | Mid | Late |
|---|---:|---:|---:|
| Biomass | 1,500–12,000 | 12,000–60,000 | 60,000–300,000 |
| Peat Bed | 2,000–15,000 | 15,000–75,000 | 75,000–400,000 |
| Coal Seam | 3,000–25,000 | 25,000–150,000 | 150,000–800,000 |
| Crude Oil | — | 8,000–60,000 | 60,000–350,000 |
| Natural Gas | — | 8,000–60,000 | 60,000–350,000 |
| Fissile Mineral | — | 500–5,000 | 5,000–40,000 |
| Hydrogen-rich Brine | — | 1,000–10,000 | 10,000–70,000 |
| Exotic Fuel Crystal | — | — | 250–5,000 |

## Ore / valuables

| Resource | Early | Mid | Late |
|---|---:|---:|---:|
| Surface Iron Nodules | 3,000–30,000 | 30,000–200,000 | 200,000–1,500,000 |
| Iron Ore | 3,000–30,000 | 30,000–220,000 | 220,000–1,750,000 |
| Copper Ore | 2,000–20,000 | 20,000–140,000 | 140,000–900,000 |
| Reactive Metal Ore | 1,000–10,000 | 10,000–80,000 | 80,000–450,000 |
| Conductive Ore | 750–8,000 | 8,000–60,000 | 60,000–350,000 |
| Silver | 300–4,000 | 4,000–30,000 | 30,000–150,000 |
| Gold | 150–2,000 | 2,000–15,000 | 15,000–80,000 |
| Gemstone Deposit | 100–1,500 | 1,500–12,000 | 12,000–60,000 |
| Magnetic Ore | — | 2,000–20,000 | 20,000–120,000 |
| Platinum | — | 500–6,000 | 6,000–35,000 |
| Palladium | — | 400–5,000 | 5,000–30,000 |
| Sapphire | — | 250–3,000 | 3,000–18,000 |
| Ruby | — | 250–2,500 | 2,500–15,000 |
| Emerald | — | 250–2,500 | 2,500–15,000 |
| Diamond | — | 100–1,200 | 1,200–8,000 |
| Exotic Industrial Mineral | — | — | 250–3,000 |
| Exotic Crystal | — | — | 100–1,500 |
| Advanced Element Deposit | — | — | 50–500 |

These ranges are intentionally broad. Common bulk materials create large logistics contracts while rare/high-value materials create much smaller but valuable loads.

Offer generation must also respect the buyer ship's physical capacity.

---

# Resource quality and partial fulfilment

Buyer quality is a **minimum quality requirement** and reuses the game's existing canonical inventory quality bands.

Qualifying stock is consumed from the **lowest acceptable quality first**.

## Fulfilment bands

A buyer will accept a simple partial shipment only when at least **50%** of the contracted quantity can be supplied.

| Delivered proportion | Result | Additional buyer-happiness effect |
|---|---|---:|
| 100% or more available | Full shipment | 0 partial penalty |
| 75%–99.99% | Minor partial | -1 |
| 50%–74.99% | Major partial | -2 |
| Below 50% | Not accepted | shipment remains unresolved / eventually missed |

Rules:

- partial penalty is applied **on top of any lateness penalty**;
- payment is only for units actually transferred;
- an accepted partial transfer resolves that shipment cycle and the ship leaves;
- the undelivered remainder does **not** carry into the next cycle;
- the next cycle still requires the original contracted quantity;
- below 50%, TRANSFER is unavailable and the player can only continue waiting before the final attempt;
- a partial accepted shipment is recorded distinctly in delivery history.

The colony stock reserve protects generic Corporate Ship exports but does not block an explicit player-confirmed buyer transfer. The popup must show projected remaining stock.

---

# Contract ownership and duration

Approved Stage 8 rules:

- a buyer contract belongs to the **colony that enters it**;
- a specific buyer offer may have only one active contract across the player's corporation;
- contracts are recurring/open-ended until player cancellation or buyer termination;
- no second fixed-duration contract system is added;
- resource, minimum quality, target quantity, unit price and cadence are locked when the player enters the contract.

---

# Conglomerate Buyers Service UI

The service is launched from the current colony ship/colony-management panel using:

**CONGLOMERATE BUYERS SERVICE**

It is persistently accessible; the ordinary Corporate Trade Ship does **not** need to be docked.

The Buyers Service should be a full-screen mobile workflow.

## Catalogue / contract table

The same screen handles available and established buyer relationships.

Core columns:

- Buyer
- Company
- Resource
- Min Quality
- Shipment Amount
- Price / Unit
- Frequency
- Reputation Required
- Status
- Action

Top-level filter:

- **ALL**
- **AVAILABLE**
- **CURRENT CONTRACTS**

Appropriate sortable columns:

- buyer/company;
- resource;
- minimum quality;
- shipment amount;
- price/unit;
- frequency;
- reputation requirement;
- status.

Per-column filters above the relevant columns:

- Buyer/company: text search;
- Resource: dropdown;
- Quality: dropdown;
- Shipment amount: compact min/max;
- Price: minimum;
- Frequency: maximum interval;
- Reputation: maximum requirement / eligible-only.

All buyers remain visible when reputation-locked. Locked rows show their requirement but no actionable CONTACT.

## CONTACT — available offer

CONTACT opens a detailed buyer profile with:

- buyer portrait or name fallback;
- buyer/contact full name;
- job title;
- company name;
- company business type;
- company scale;
- primary collection ship name;
- collection ship class and capacity;
- required resource;
- minimum quality;
- quantity per shipment;
- unit rate;
- full-shipment value;
- collection frequency;
- reputation requirement;
- first scheduled collection date if entered;
- explanation that the conglomerate brokers the relationship and keeps a margin.

Primary action:

**ENTER CONTRACT**

## VIEW — established contract

Once established, CONTACT becomes **VIEW**.

The same profile additionally shows:

- current buyer happiness 1–100;
- green / amber / red relationship state;
- global reputation impact guidance;
- next collection date;
- next required shipment;
- current qualifying stock;
- successful full deliveries;
- accepted partial deliveries;
- late deliveries;
- missed shipments;
- delivery history;
- total units delivered;
- total money earned;
- contract start date;
- current assigned collection ship;
- **CANCEL CONTRACT**.

---

# Buyer relationship / happiness

Each buyer has a persistent relationship score from **1 to 100**.

First-ever relationship with a buyer starts at:

**75**

Relationship state:

- **1–33: Red**
- **34–66: Amber**
- **67–100: Green**

Relationship belongs to the buyer, not merely one contract instance. If the player cancels and later re-enters an allowed offer from the same buyer, the relationship does not magically reset to 75.

## Delivery timing

One shipment cycle gets one timing result:

- on scheduled due date: **+1 happiness**;
- fulfilled at Due +5: **-1 happiness**;
- fulfilled at Due +10: **-2 happiness**;
- fulfilled at Due +15: **-3 happiness**.

The timing result then stacks with any partial-fulfilment penalty.

Examples:

- 100% on time: +1;
- 80% on time: -1 partial, no lateness;
- 80% at +10: -2 lateness and -1 partial = **-3**;
- 60% at +15: -3 lateness and -2 partial = **-5**.

An accepted late shipment does not also receive the +1 on-time reward.

## Missed shipment escalation

If the +15 opportunity finishes without at least 50% qualifying stock being transferred, the ship leaves and the shipment is missed.

Lifetime missed shipments during the active buyer relationship:

- first miss: **-10 happiness**;
- second miss: **-20 happiness**;
- third miss: **-30 happiness and immediate buyer termination**.

The missed penalty replaces the normal +15 lateness result; it is not double-counted with -3.

## Red-state cancellation

If **two consecutive resolved shipment cycles finish in Red**, the buyer immediately cancels the contract.

Returning to Amber/Green resets the consecutive-Red counter.

Buyer-terminated offers are considered lost for the current game. They remain visible in history but cannot simply be re-entered to reset the relationship.

---

# Player cancellation

Approved rule:

- cancellation is blocked while that buyer's ship is actively waiting for the shipment;
- otherwise player cancellation ends the contract immediately;
- cancellation applies **-5 buyer happiness**;
- the normal global-reputation coupling therefore applies **-0.5 global reputation**;
- the offer cannot be re-entered until one normal contract collection interval has passed;
- buyer happiness persists when the offer later becomes available again.

This prevents consequence-free cancellation just before a known failure.

---

# Collection ship lifecycle and Spaceport integration

Buyer ships are real physical arrivals and reuse the canonical Spaceport berth system.

Rules:

- buyer collection capacity is completely independent of ordinary Corporate Ship export capacity;
- a docked buyer collection ship consumes one Spaceport berth;
- if no berth is free, the ship enters **Orbital Holding**;
- contractual timing continues while the ship waits for a berth;
- buyer events use the existing cross-colony pending-event / pause model;
- a buyer ship cannot receive stock until docked.

## Arrival sequence

For a scheduled shipment:

- **Due:** first collection event;
- **Due +5:** second collection event if unresolved;
- **Due +10:** third collection event;
- **Due +15:** final collection event.

## No-berth presentation

The popup must still appear when the ship reaches the colony but cannot dock.

It explicitly shows:

- **WAITING IN ORBIT — NO SPACEPORT BERTH AVAILABLE**;
- buyer and ship identity;
- required cargo;
- current qualifying colony stock;
- whether enough stock exists;
- current lateness stage;
- the fact that TRANSFER is unavailable until a berth is free.

This is important: even if the colony has perfect stock ready, the player can fail the contract through inadequate docking capacity.

## Docked collection popup

When docked, show:

- buyer portrait/fallback;
- buyer/company;
- ship name;
- ship class/capacity;
- resource;
- minimum quality;
- contracted quantity;
- qualifying stock;
- maximum transferable quantity;
- full/75%/50% fulfilment band;
- projected payment;
- projected buyer-happiness change, including lateness + partial penalties;
- projected stock remaining;
- days late;
- current buyer happiness.

Actions:

- **TRANSFER STOCK** when at least 50% of the requirement can be supplied;
- **NOT READY / CONTINUE WAITING** before the final opportunity;
- at +15, either transfer an accepted amount or resolve a missed shipment and departure.

Closing the popup must not bypass the decision.

---

# Canonical global reputation system

This feature adopts one global reputation scale for the whole corporation rather than adding a second buyer-only reputation currency.

## Stored scale

- starts at **0.00**;
- stored with at least two decimal places of practical precision;
- minimum **-100.00**;
- maximum **100.00**;
- buyer requirements use the raw numeric score;
- the UI also shows a named reputation level.

## Ten reputation levels

| Level | Name | Global reputation |
|---:|---|---:|
| 1 | Disgraced | -100 to -25.00 |
| 2 | Distrusted | -24.99 to -10.00 |
| 3 | Questionable | -9.99 to -0.01 |
| 4 | Unknown | 0.00–4.99 |
| 5 | Emerging | 5.00–14.99 |
| 6 | Recognised | 15.00–29.99 |
| 7 | Established | 30.00–49.99 |
| 8 | Trusted | 50.00–69.99 |
| 9 | Preferred | 70.00–89.99 |
| 10 | Elite | 90.00–100.00 |

The negative names are deliberately visible. A corporation that repeatedly fails buyers should feel commercially damaged rather than merely “below zero”.

## Positive reputation gains

Reputation grows slowly:

- successful buyer shipment transaction: **+0.01 global reputation**;
- successful ordinary Corporate Ship trading visit with at least one export: **+0.01**, awarded at most once per Corporate Ship visit so the player cannot farm reputation by splitting one sale into many button presses;
- successful completion of a 10-year colony contract: **+0.10 global reputation**.

Contract medal/rating can remain separate from this slow reputation gain. Bronze/Silver/Gold/Platinum must no longer award the old integer-scale +1/+2/+4/+7 reputation values when this system is implemented.

## Negative buyer relationship coupling

Every **negative** buyer-happiness change damages global reputation by **10% of the happiness loss**.

Examples:

- -1 buyer happiness → **-0.10 global**;
- -2 → **-0.20 global**;
- -5 → **-0.50 global**;
- -10 → **-1.00 global**;
- -20 → **-2.00 global**;
- -30 → **-3.00 global**.

Positive buyer happiness does **not** feed 10% back into global reputation; accepted shipment transactions use the normal +0.01 gain. This keeps reputation slow to build but easy to damage through unreliability.

Partial and lateness penalties stack before calculating the global loss.

Example: an 80% shipment delivered at +10 causes -3 buyer happiness and therefore **-0.30 global reputation**. Because a paid shipment transaction still occurred, it also earns +0.01 transaction reputation, giving net **-0.29** for that event.

## Existing reputation migration

Current code uses a different integer-scale reputation model. Implementation of this feature must migrate to this canonical -100..100 fractional model rather than maintain parallel reputation values.

Existing systems that read `company.rep` must be reviewed so buyer gating, Corporate Ship capacity and existing penalties still make sense on the new scale.

The existing severe colony-loss penalty may remain a direct global reputation loss, but its value must be reviewed against this new slow scale during implementation rather than silently preserving an incompatible integer-era assumption.

---

# Determinism and persistence

The following must survive save/load exactly:

- selected buyer identities and companies;
- buyer portrait assignment key;
- buyer ship name/class;
- offer resource/quality/quantity/price/cadence/rep requirement;
- active colony contract owner;
- buyer relationship score;
- next due date;
- waiting/orbiting/docked ship state;
- current retry/lateness stage;
- lifetime miss count;
- consecutive Red-cycle count;
- player cancellation cooldown;
- terminated/lost offers;
- delivery history;
- full/partial quantities delivered;
- total revenue;
- global reputation to fractional precision.

Reloading must never reroll an offer to escape an obligation or change a buyer's price.

---

# Critical invariants

1. Direct conglomerate selling always pays a better equivalent unit rate.
2. Buyer collection ships do not consume Corporate Ship export capacity.
3. Buyers and offers are deterministic/persisted.
4. The 1,000 buyer identities are stable static content.
5. Every buyer has a real contact, company, business type, named ship and ship class.
6. Buyer portrait assets are optional presentation; text fallback is mandatory.
7. A contract belongs to one colony.
8. One buyer offer cannot be active at multiple colonies.
9. Contract resource/quality/quantity/price/cadence are locked on entry.
10. Minimum quality reuses canonical inventory quality bands.
11. Lowest qualifying quality is consumed first.
12. 75%+ and 50%+ partial fulfilment rules are the only partial bands.
13. Below 50% is not accepted as a shipment.
14. Lateness and accepted-partial penalties stack.
15. Miss penalties replace, rather than stack with, +15 lateness.
16. Buyer happiness is persistent per buyer and clamped 1–100.
17. Negative buyer changes feed 10% into canonical global reputation.
18. Positive global reputation is deliberately slow and cannot be farmed by splitting transactions.
19. Buyer ships use the existing canonical Spaceport berth model.
20. No berth means no transfer, even when qualifying stock is ready.
21. Buyer events participate in the existing corporation-wide pause/attention flow.
22. Save/load preserves every active obligation and relationship state.

---

# Intended implementation ownership

No production gameplay implementation exists yet.

Likely canonical ownership when implementation starts:

- `js/data/`: static 1,000-buyer pool, business types, 30 ship-class definitions and offer-generation balance data;
- one canonical `js/domain/` buyer-contract service: offer generation, contract lifecycle, due dates, happiness, partial/lateness/miss scoring, reputation coupling and termination;
- existing `InventoryService`: quality qualification and stock transfer;
- existing `spaceport-model.js`: berth/orbital-holding rules;
- existing pending-event/corporate-event flow: pause and cross-colony attention;
- external `views/`: full-screen Buyers Service table, buyer profile/contract view and ship collection popup;
- UI code: render/dispatch only;
- `GameStore`: persistent root state.

A save-schema bump is expected when implementation begins.

---

# Required regression coverage when implemented

At minimum tests must prove:

1. global reputation starts at 0 and clamps -100..100;
2. all 10 named reputation bands resolve correctly, including negative bands;
3. normal positive reputation increments use +0.01 / +0.10 as specified;
4. one Corporate Ship visit cannot farm reputation through repeated sale clicks;
5. locked buyers remain visible but cannot CONTACT;
6. seeded buyers/offers/ship names are deterministic across reload;
7. portrait assignment persists and missing portrait uses fallback;
8. one buyer offer cannot be active at two colonies;
9. contract terms are locked on entry;
10. buyer prices remain below direct conglomerate equivalent rates;
11. buyer collection does not consume Corporate Ship export capacity;
12. qualifying stock uses existing quality bands and lowest qualifying quality first;
13. 100%, 75–99.99%, 50–74.99% and <50% fulfilment bands resolve correctly;
14. accepted partial payment is proportional to units transferred;
15. due / +5 / +10 / +15 timing effects are correct;
16. lateness + partial penalties stack exactly once;
17. first/second/third misses apply -10/-20/-30 and third miss terminates;
18. two consecutive resolved Red cycles terminate;
19. buyer-happiness losses feed 10% into global reputation;
20. player cancellation applies -5 buyer / -0.5 global and cooldown;
21. player cannot cancel while the buyer ship is waiting;
22. buyer ship consumes a Spaceport berth when docked;
23. no berth causes orbital holding and prevents transfer;
24. contractual lateness continues while waiting for a berth;
25. the no-berth popup accurately reports ready stock but disables transfer;
26. pending buyer events pause/redirect correctly across colonies;
27. save/load preserves active contracts, waiting ships, retry stage, relationship, history and fractional reputation;
28. buyer table sorting/filtering never mutates contract data;
29. mobile full-screen catalogue/profile/arrival flows remain usable at supported viewport sizes.

---

# Explicit non-goals for this Stage 8 feature

Do **not** expand this feature into:

- player-negotiated price bargaining;
- counter-offers;
- direct independent buyers;
- player-owned freight routes;
- buyer-owned refineries;
- contract insurance;
- commodity-market simulation;
- dynamic competitor bidding;
- automatic contract fulfilment;
- new ship design mechanics;
- separate quality or reputation systems.

Those are later systems if ever required. This feature is intentionally the contained **conglomerate-brokered recurring buyer contract + collection ship + reliability/reputation** loop.