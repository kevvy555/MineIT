# Stage 8 — Conglomerate Buyers Service

Status: **Complete**  
Design state: **Implemented and validated against the approved gameplay specification and both approved mobile UI mockups**

Validated functional/browser checkpoint: `25e67df8f8cae9bebc632000605284fd88b2c173` — GitHub Actions workflow `33304609012`, job `99238803630`.

## Purpose

The **Conglomerate Buyers Service** solves the mid-game commercial bottleneck where a productive colony has more saleable output than the ordinary Corporate Ship can absorb.

The conglomerate exposes selected customers from its own commercial network and brokers recurring supply contracts on the player's behalf. These remain conglomerate-controlled relationships rather than independent player-owned customers.

Key distinction:

- direct conglomerate sales remain the best equivalent unit price because the conglomerate consumes those materials itself;
- brokered buyers pay less because the conglomerate takes a cut and outside customers are price-sensitive;
- buyer collection ships provide **separate physical collection capacity** and do not consume ordinary Corporate Ship export capacity;
- later stages can still introduce broader/direct commercial relationships and player freight.

The intended Stage 8 pressure is:

**Production Rate → Corporate Export Capacity → Brokered Buyer Capacity / Reliability → Player Freight Capacity**

---

# Core player loop

1. Open **CONGLOMERATE BUYERS SERVICE** from the current colony ship/colony-management panel.
2. Browse the complete seeded buyer catalogue.
3. Use compact dropdown filters and sorting to identify a suitable opportunity.
4. Reputation-eligible offers show **CONTACT**; locked offers remain visible as **REP LOCKED**.
5. CONTACT opens the buyer/company/contract profile.
6. Press **ENTER CONTRACT** to establish the recurring contract for the current colony.
7. Produce and hold enough qualifying stock before the collection cycle.
8. The buyer sends its own explicitly named collection ship.
9. The ship must obtain a Spaceport berth before transfer can occur.
10. The game pauses for the collection event.
11. Transfer a full or permitted partial shipment, or make the ship wait until the next attempt.
12. Reliable service slowly improves the relationship; late, partial and missed deliveries damage buyer happiness and global reputation.
13. Persistent poor service can terminate the contract.

Initial implementation does **not** auto-fulfil contracts.

---

# Buyer identity and commercial world

The player should feel they are dealing with a real organisation and a real person rather than a generic demand row.

## 1,000-buyer pool

The game will use a static content pool of **1,000 unique buyers**. Each buyer has a stable identity containing at minimum:

- buyer/contact ID;
- unique contact name;
- job title / commercial role;
- unique company name;
- company business type;
- company size tier;
- optional home-system/region flavour text;
- preferred/eligible resource families;
- reputation range appropriate to that buyer;
- unique primary collection ship name;
- one of the 30 collection-ship classes below;
- portrait assignment key.

The 1,000 records are generated once during development and committed as static game data. Names, companies and ship identities must not reroll on reload.

A new game uses the game/world seed to select/order opportunities from this pool. The same save therefore retains the same commercial world.

Company business types may repeat, but **contact name + company name + primary ship name** should be unique across the pool.

Suggested business families include heavy engineering, shipbuilding, electronics, energy generation, fuel processing, construction, habitat fabrication, agriculture, food processing, medical manufacturing, precision instruments, jewellery/luxury goods, research laboratories, reactor engineering, advanced materials, aerospace, infrastructure and interstellar logistics.

## Buyer scale

Buyer scale broadly increases with reputation requirement:

- small/local buyers: smaller loads and small collection vessels;
- regional buyers: moderate recurring loads;
- major industrial buyers: large loads and stronger quality expectations;
- strategic/premier buyers: very large or highly specialised requirements and high service expectations.

Higher reputation does not automatically mean higher unit price. Quantity, cadence, quality and price should remain meaningful trade-offs.

---

# Buyer portraits

Canonical folder:

`assets/art/buyers/`

Preferred filenames:

`buyer-0001.webp` through `buyer-1000.webp`

Rules:

- buyer identity exists independently of portrait availability;
- new games assign available portraits deterministically;
- assign without replacement first, especially for low-reputation/early buyers, so early contacts are visually distinct;
- duplicates are allowed after the available portrait pool is exhausted;
- adding more portraits later must not reshuffle assignments already persisted in an existing save;
- portraits are required only in CONTACT / VIEW / collection-event detail presentation, not the dense catalogue table;
- missing portraits fall back to buyer name/initials and never block the UI.

---

# Thirty buyer collection-ship classes

Every buyer has an explicitly named primary collection vessel, for example **CSV Halcyon Reach**. The named vessel belongs to one of 30 classes.

The ship-class description is **flavour and identity only** in this feature. Gameplay differences are intentionally limited to cargo capacity; no extra speed, fuel, armour or ship-design system is introduced here.

Buyer/company scale biases toward larger ship classes. A generated contract quantity must never exceed the assigned ship's cargo capacity.

| # | Ship class | Capacity | Description |
|---:|---|---:|---|
| 1 | Dart Courier | 2,500 | Compact, fast courier built for small high-value consignments and specialist cargo. |
| 2 | Wren Shuttle | 4,000 | Short-range commercial shuttle used by small buyers for frequent light collections. |
| 3 | Kestrel Light Freighter | 6,000 | Nimble light freighter with modest modular holds for mixed industrial cargo. |
| 4 | Skipper Packet | 8,000 | Scheduled packet freighter designed around reliable recurring merchant runs. |
| 5 | Nomad Utility Freighter | 12,000 | Rugged frontier utility ship able to handle varied cargo at remote colonies. |
| 6 | Ranger Cargo Cutter | 18,000 | Compact medium freighter balancing useful capacity with easy Spaceport handling. |
| 7 | Wayfarer Freighter | 25,000 | Common long-haul merchant vessel used by established regional companies. |
| 8 | Merchant Lifter | 35,000 | Reinforced commercial lifter for heavier contract lots and containerised materials. |
| 9 | Caravan Freighter | 50,000 | Modular multi-hold ship used for sustained regional commodity movement. |
| 10 | Atlas Hauler | 70,000 | Heavy-frame hauler designed to move substantial industrial loads reliably. |
| 11 | Meridian Bulk Carrier | 90,000 | Dedicated bulk-material carrier optimised for regular commodity collections. |
| 12 | Vanguard Hauler | 120,000 | High-reliability heavy industrial hauler favoured by major manufacturers. |
| 13 | Longreach Freighter | 160,000 | Endurance-oriented heavy freighter for large recurring intersystem contracts. |
| 14 | Foundry Carrier | 210,000 | Industrial carrier built around dense raw-material and foundry-feedstock loads. |
| 15 | Reliant Bulkship | 270,000 | Redundant commercial bulkship intended for dependable high-volume schedules. |
| 16 | Leviathan Freighter | 350,000 | Very large freight platform for corporations moving serious commodity tonnage. |
| 17 | Mammoth Carrier | 450,000 | Slow, enormous carrier whose huge holds suit sustained bulk purchasing. |
| 18 | Colossus Bulkship | 575,000 | Major bulk transport vessel for large industrial groups and infrastructure firms. |
| 19 | Goliath Heavy Freighter | 725,000 | Massive heavy freighter used when contract volume becomes a strategic supply-chain concern. |
| 20 | Citadel Carrier | 900,000 | Robust strategic carrier with multiple segregated holds for major corporate contracts. |
| 21 | Bastion Superfreighter | 1,100,000 | Self-contained superfreighter supporting very large recurring buyer operations. |
| 22 | Monolith Bulk Carrier | 1,350,000 | Deep-hold megacarrier focused on enormous single-resource commodity loads. |
| 23 | Horizon Superfreighter | 1,600,000 | Long-range superfreighter used by intersystem commercial networks. |
| 24 | Dominion Carrier | 1,900,000 | Fleet-grade strategic carrier owned by major multi-system corporations. |
| 25 | Titan Logistics Carrier | 2,200,000 | Integrated logistics carrier for buyers operating at industrial-network scale. |
| 26 | Continental Bulkship | 2,500,000 | Planetary-scale bulk mover able to absorb output from mature mining colonies. |
| 27 | Hyperion Supercarrier | 2,800,000 | Premium megacarrier with multiple enormous cargo sections for demanding strategic buyers. |
| 28 | Keystone Megafreighter | 3,200,000 | Backbone vessel for corporations whose supply chains depend on continuous massive inflow. |
| 29 | Panstellar Megacarrier | 3,600,000 | Interstellar megacarrier serving the largest commercial organisations in the network. |
| 30 | Worldline Mass Freighter | 4,000,000 | The largest buyer vessel in this service, reserved for exceptional late-game bulk contracts. |

---

# Buyer offer definition

Every seeded offer defines:

- buyer/contact ID;
- company ID/name/business type;
- offer ID;
- required resource;
- minimum accepted quality;
- target quantity per shipment;
- unit rate;
- full-shipment value;
- collection interval;
- minimum global reputation;
- named collection ship and class;
- persisted offer/contract state;
- persisted buyer relationship state.

All offers remain visible. Reputation controls whether CONTACT is actionable.

---

# Buyer pricing

Brokered buyer unit rates must always remain **below the ordinary direct conglomerate selling rate for equivalent qualifying material**.

Recommended generation envelope:

- early buyers: roughly **65–88%** of equivalent direct conglomerate rate;
- mid buyers: roughly **60–90%**;
- late/premier buyers: roughly **55–92%**.

The ranges overlap intentionally. A prestigious contract may have a worse unit rate but compensate through volume or cadence.

Once a contract is entered, its seeded price is locked.

---

# Contract cadence by market tier

| Buyer tier | Typical global rep | Collection interval | Typical ship classes |
|---|---:|---:|---:|
| Local / Entry | 0–9.99 | 45–90 days | 1–8 |
| Regional | 10–24.99 | 35–75 days | 4–12 |
| Major | 25–49.99 | 25–60 days | 8–18 |
| Strategic | 50–74.99 | 20–45 days | 13–24 |
| Premier | 75–100 | 15–40 days | 18–30 |

---

# Contract shipment ranges by resource

Individual buyer offers seed one fixed shipment amount inside the applicable band. `—` means that resource normally does not generate buyer contracts in that phase.

Market phases:

- **Early:** global reputation 0–19.99;
- **Mid:** 20–59.99;
- **Late:** 60–100.

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

## Build

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

These ranges are intentionally broad. Common bulk materials create very large logistics contracts; rare/high-value materials create much smaller high-value loads. Offer generation must also respect the assigned collection ship's capacity.

---

# Resource quality and partial fulfilment

Buyer quality is a **minimum quality requirement** and reuses the existing inventory quality bands.

Qualifying stock is consumed from the **lowest acceptable quality first**.

## Fulfilment bands

| Delivered proportion | Result | Additional buyer-happiness effect |
|---|---|---:|
| 100% | Full shipment | 0 partial penalty |
| 75–99.99% | Minor partial | -1 |
| 50–74.99% | Major partial | -2 |
| Below 50% | Not accepted | unresolved / eventually missed |

Rules:

- partial penalties stack on top of lateness;
- payment is only for actual units transferred;
- an accepted partial shipment resolves that shipment cycle and the ship leaves;
- the missing remainder does **not** carry forward;
- the next cycle still requires the full contracted amount;
- below 50%, TRANSFER is unavailable;
- accepted partials are recorded distinctly in history;
- colony trade reserve protects generic Corporate Ship exports but does not block an explicit player-confirmed buyer transfer;
- the collection popup shows projected remaining stock before confirmation.

---

# Contract ownership and duration

- contract belongs to the colony that enters it;
- a specific buyer offer can have only one active contract across the player's corporation;
- contracts are recurring/open-ended until player cancellation or buyer termination;
- no second fixed-duration contract system is introduced;
- resource, minimum quality, quantity, price and cadence are locked on entry.

---

# Conglomerate Buyers Service UI

The service is persistently accessible from the current colony ship/colony-management panel. The ordinary Corporate Trade Ship does **not** need to be docked.

The catalogue itself is a full-screen **portrait-mobile-first** workflow.

## Portrait-width catalogue

The main buyer list should fit within the phone width without requiring horizontal scrolling at the target portrait viewport.

### Column order

Action is always the leftmost column:

1. **Action** — CONTACT / VIEW / REP LOCKED
2. **Buyer / Company** — buyer name on first line, company name beneath it
3. **Resource**
4. **Q** — minimum quality
5. **Load**
6. **£/u**
7. **Every**
8. **Rep**

There is no separate Status column because Action already communicates AVAILABLE / CURRENT / LOCKED state.

Column widths should be only as wide as their content requires. Buyer / Company gets the remaining width and may wrap to two short lines. Numeric values should use compact number formatting where needed.

### Filters

Do **not** use buyer/company text filters in the compact catalogue.

Use compact dropdown filters above the table:

- Status: All / Available / Current / Locked;
- Resource;
- Minimum Quality;
- Load band;
- Price band;
- Collection frequency band;
- Reputation / Eligible only.

Filters may wrap into two compact rows on narrow portrait screens.

### Sorting

Buyer/company does not need sorting.

Use one compact **SORT** dropdown rather than wide interactive table headers. Useful choices:

- Load low/high;
- Price low/high;
- Frequency shortest/longest;
- Reputation low/high;
- Quality low/high;
- Resource.

All buyers remain visible when reputation-locked unless excluded by the chosen Status filter.

## CONTACT / VIEW popup

The buyer/contract profile is **not full-screen**.

On portrait mobile it appears as a centred modal occupying roughly **50% of the viewport height**, with the catalogue dimmed behind it.

Layout:

### Left side

- large buyer portrait, using the seeded buyer image or name/initial fallback;
- portrait should be the dominant visual element in the popup;
- **ENTER CONTRACT** directly underneath the portrait for an available offer;
- for an established contract, the corresponding primary left-side action becomes VIEW-state information rather than another entry action.

### Right side

A compact scrollable information area containing:

- buyer full name;
- job title;
- company name;
- company business type;
- company scale;
- named collection ship;
- ship class;
- ship-class description;
- cargo capacity;
- required resource;
- minimum quality;
- quantity per shipment;
- unit rate;
- full-shipment value;
- collection frequency;
- reputation requirement;
- first collection date if entered;
- conglomerate-broker explanation.

### Established VIEW state

The same 50%-height profile additionally exposes:

- buyer happiness 1–100 and Green/Amber/Red state;
- next collection date;
- current qualifying stock;
- full / partial / late / missed delivery counts;
- delivery history;
- total units delivered;
- total money earned;
- contract start date;
- current collection ship;
- **CANCEL CONTRACT**.

The right side may scroll internally if necessary; the modal itself remains centred rather than becoming a full-screen page.

---

# Buyer happiness

Buyer relationship score is persistent from **1 to 100**.

Starting value for the first relationship with that buyer:

**75**

Bands:

- **1–33 Red**
- **34–66 Amber**
- **67–100 Green**

Relationship belongs to the buyer rather than one disposable contract instance.

## Timing result

- on due date: **+1**;
- Due +5: **-1**;
- Due +10: **-2**;
- Due +15: **-3**.

Timing stacks with partial penalties.

Examples:

- 100% on time = +1;
- 80% on time = -1;
- 80% at +10 = -2 lateness + -1 partial = **-3**;
- 60% at +15 = -3 lateness + -2 partial = **-5**.

## Miss escalation

If the +15 opportunity ends without at least 50% being transferred:

- first miss: **-10**;
- second miss: **-20**;
- third miss: **-30 and immediate buyer termination**.

Miss penalty replaces the normal +15 lateness result rather than stacking with it.

## Red cancellation

Two consecutive resolved shipment cycles finishing in Red cause immediate buyer cancellation. Returning to Amber/Green resets the consecutive-Red counter.

Buyer-terminated offers remain visible in history and cannot be immediately re-entered.

---

# Player cancellation

- blocked while that buyer's ship is actively waiting;
- otherwise immediately ends the contract;
- applies **-5 buyer happiness**;
- therefore applies **-0.5 global reputation** through normal coupling;
- offer is unavailable for one normal collection interval;
- buyer happiness persists when the offer later becomes available again.

---

# Collection ship lifecycle and Spaceport integration

Buyer ships are real arrivals and reuse the canonical Spaceport berth model.

Rules:

- buyer collection capacity is independent of Corporate Ship export capacity;
- docked buyer ship consumes one Spaceport berth;
- no berth → **Orbital Holding**;
- contractual lateness continues while waiting for a berth;
- buyer events use the existing cross-colony pause/attention model;
- no cargo transfer is possible until the vessel is docked.

## Collection attempts

- Due;
- Due +5;
- Due +10;
- Due +15 final attempt.

## Collection popup presentation

The collection popup includes a **large image of the named buyer collection ship** as a visual header/hero image. If a class-specific ship image is not yet available, use the best matching generic buyer-freighter asset or a text/class fallback; missing art must not block the event.

The popup also shows:

- buyer portrait/fallback;
- buyer/company;
- ship name;
- ship class, description and capacity;
- docked or orbital state;
- resource;
- minimum quality;
- contracted amount;
- qualifying stock;
- maximum transferable amount;
- 100% / 75% / 50% fulfilment band;
- projected payment;
- projected buyer-happiness change including lateness + partial penalties;
- projected global reputation change;
- projected stock remaining;
- days late;
- current buyer happiness.

### No berth

Even if enough stock is ready, the popup explicitly shows:

**WAITING IN ORBIT — NO SPACEPORT BERTH AVAILABLE**

TRANSFER is disabled until the ship docks. The lateness clock continues.

### Actions

- **TRANSFER STOCK** when at least 50% can be supplied and the ship is docked;
- **NOT READY / CONTINUE WAITING** before the final opportunity;
- at +15, either transfer an accepted amount or resolve the missed shipment and departure.

Closing/dismissing the popup must not bypass the required decision.

---

# Canonical global reputation

One corporation-wide scale is used.

Stored range:

- starts at **0.00**;
- minimum **-100.00**;
- maximum **100.00**;
- retain at least two decimal places of practical precision.

## Ten named levels

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

Negative names are deliberately visible so repeated commercial failure feels damaging.

## Positive gains

- successful buyer shipment transaction: **+0.01**;
- successful Corporate Ship trading visit with at least one export: **+0.01 maximum per visit**;
- successful 10-year colony contract: **+0.10**.

Bronze/Silver/Gold/Platinum ratings must no longer award the old integer +1/+2/+4/+7 reputation values when this system is implemented.

## Negative buyer coupling

Every negative buyer-happiness change damages global reputation by **10% of the buyer loss**.

Examples:

- -1 buyer → -0.10 global;
- -2 → -0.20;
- -5 → -0.50;
- -10 → -1.00;
- -20 → -2.00;
- -30 → -3.00.

Positive buyer happiness does not feed 10% upward; a successful paid shipment simply receives the normal +0.01 transaction gain.

Example: 80% supplied at +10 = -3 buyer happiness → -0.30 global, plus +0.01 successful transaction = **-0.29 net global reputation**.

Existing uses of `company.rep`, Corporate Ship capacity scaling and existing penalties must be reviewed against this slower fractional scale during implementation.

---

# Determinism and persistence

Save/load must preserve exactly:

- buyer identities/companies;
- portrait assignment key;
- named ship and ship class;
- generated resource/quality/quantity/price/cadence/rep requirement;
- active colony owner;
- buyer happiness;
- next due date;
- orbiting/docked/waiting ship state;
- retry/lateness stage;
- miss count;
- consecutive Red cycles;
- cancellation cooldown;
- terminated/lost offers;
- delivery history;
- full/partial quantities;
- total contract revenue;
- fractional global reputation.

Reloading must never reroll an offer or escape a failing obligation.

---

# Critical invariants

1. Direct conglomerate selling always pays a better equivalent unit rate.
2. Buyer ships do not consume Corporate Ship export capacity.
3. Buyers/offers are deterministic and persisted.
4. The 1,000 buyer identities are stable static content.
5. Every buyer has a real contact, company, business type, named ship and ship class.
6. Buyer portrait art is optional; text fallback is mandatory.
7. Ship descriptions are presentation identity only; capacity is the only ship-class gameplay difference in this feature.
8. A contract belongs to one colony.
9. One offer cannot be active at multiple colonies.
10. Contract resource/quality/quantity/price/cadence lock on entry.
11. Minimum quality reuses canonical inventory quality bands.
12. Lowest qualifying quality is consumed first.
13. 75%+ and 50%+ are the only accepted partial bands.
14. Below 50% is not accepted.
15. Lateness and partial penalties stack.
16. Miss penalties replace +15 lateness.
17. Happiness persists per buyer and clamps 1–100.
18. Negative buyer changes feed 10% into global reputation.
19. Positive reputation is deliberately slow and cannot be farmed through transaction splitting.
20. Buyer ships use the canonical Spaceport berth model.
21. No berth means no transfer even with perfect stock.
22. Buyer events participate in the corporation-wide pause/attention flow.
23. Save/load preserves all active obligations.
24. Catalogue presentation is portrait-width without buyer/company text filters.
25. CONTACT / VIEW uses a centred ~50%-viewport-height modal rather than a full-screen profile.
26. Collection event includes the buyer ship image where available.

---

# Implemented ownership

Production ownership is now:

- `js/data/buyer-content.js` and `js/data/buyer-market-balance.js`: static buyer/company/ship identities and offer-generation balance data;
- `js/domain/buyer-service.js`: canonical buyer offer generation, contract lifecycle, due dates, happiness, partial/lateness/miss scoring, reputation coupling and termination;
- existing `InventoryService`: quality qualification and transfer;
- existing `spaceport-model.js`: berth/orbital holding;
- existing `CorporateEventService` plus `MineITApp`: corporation-wide pause, cross-colony attention, scheduling and save recovery;
- external `views/`: full-screen portrait catalogue, centred buyer profile and full-screen collection event;
- `BuyerUI`: rendering, local filter/sort view state and dispatch only;
- `GameStore`: persistent mutable root state.

Runtime save schema is v12 and includes buyer/reputation normalization plus save-roundtrip coverage.

---

# Required regression coverage

The implemented feature is protected by regression/browser coverage proving at minimum:

1. reputation starts at 0 and clamps -100..100;
2. all 10 named reputation bands resolve correctly;
3. +0.01 / +0.10 positive increments are correct;
4. one Corporate Ship visit cannot farm reputation with split sales;
5. locked buyers remain visible but cannot CONTACT;
6. seeded buyers/offers/ship names are deterministic;
7. portrait assignment persists and fallback works;
8. one offer cannot be active at two colonies;
9. contract terms lock on entry;
10. buyer prices remain below direct conglomerate rates;
11. buyer collection does not consume Corporate Ship export capacity;
12. quality qualification consumes lowest acceptable bands first;
13. all fulfilment bands resolve correctly;
14. accepted partial payment is proportional;
15. due/+5/+10/+15 timing is correct;
16. lateness + partial penalties stack once;
17. first/second/third misses apply -10/-20/-30 and third terminates;
18. two consecutive Red cycles terminate;
19. buyer losses feed 10% into global reputation;
20. cancellation applies -5 buyer / -0.5 global and cooldown;
21. cancellation is blocked while the ship is waiting;
22. buyer ship consumes a berth when docked;
23. no berth causes orbital holding and prevents transfer;
24. lateness continues while orbiting;
25. no-berth popup reports ready stock while disabling transfer;
26. pending events pause/redirect correctly across colonies;
27. save/load preserves active obligations, history and fractional reputation;
28. filters/sorting never mutate buyer/contract state;
29. portrait catalogue fits supported phone portrait widths without horizontal scrolling;
30. centred half-height buyer profile remains usable on supported mobile viewports;
31. collection popup remains usable with ship artwork present.

The dedicated production browser probe runs the real buyer service/UI/templates across `360×640`, `375×667`, `390×844`, `412×915`, and `915×412` landscape.

---

# Explicit non-goals

Do **not** expand this Stage 8 feature into:

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
- a second quality system;
- a second reputation system.

This feature remains the contained **conglomerate-brokered recurring buyer contract + named collection ship + reliability/reputation** loop.