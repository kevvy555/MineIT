# Stage 8 — Conglomerate Buyers Service

Status: **Not Started**  
Design state: **Pending user review before implementation**

## Purpose

The Conglomerate Buyers Service solves the mid-game commercial bottleneck where a productive colony has more saleable output than the ordinary Corporate Ship can absorb.

The conglomerate already sells material onward through its own commercial network. As the player's reputation improves, the conglomerate makes additional buyer relationships available to the colony. These are still **conglomerate-brokered contracts** rather than independent player-owned commercial relationships.

This is intentionally narrower than the later Commercial Market Expansion stages:

- Stage 8: the conglomerate exposes selected outside buyers and still controls/brokers the relationship;
- later stages: the player develops broader/direct commercial relationships and eventually competes independently.

The intended Stage 8 pressure becomes:

**Production Rate → Corporate Export Capacity → Brokered Buyer Capacity / Reliability → later Player Freight Capacity**

The service must expand sell-through without making the ordinary Corporate Ship obsolete. Direct conglomerate sales remain the best unit price because those resources are consumed by the conglomerate's own production/development systems. Brokered buyer contracts pay less because the conglomerate takes a cut and its customers are commercially price-sensitive.

---

## Core player loop

1. Open **Conglomerate Buyers Service** for the current colony.
2. Browse all known buyer opportunities.
3. Sort/filter by resource, quality, shipment amount, unit price, collection interval and reputation requirement.
4. Inspect a buyer whose requirements fit the colony's production.
5. Press **CONTACT** when the corporation meets the reputation requirement.
6. Review the full buyer/company/contract details.
7. Press **ENTER CONTRACT** to establish the recurring supply contract for that colony.
8. Produce and hold enough stock of the correct resource and minimum quality before collection day.
9. The buyer sends its own collection ship.
10. When the ship arrives, the game pauses and the player gets an actionable arrival popup showing the requested resource, quantity, quality requirement and qualifying colony stock.
11. If sufficient qualifying stock exists, the player may transfer the shipment and receive payment.
12. Successful reliable deliveries improve the buyer relationship slowly; late/missed collections damage it.
13. Poor service can cause the buyer to terminate the contract and can also reduce the corporation's global reputation.

No automatic contract fulfilment is planned for the initial feature. The arrival is intentionally a visible player decision/event.

---

## Buyer catalogue

The service must expose **multiple buyers** rather than one fixed overflow purchaser.

Every buyer offer defines at minimum:

- buyer/contact name;
- company name;
- company business type;
- required resource;
- minimum accepted quality;
- exact quantity per shipment;
- fixed payment per unit;
- collection frequency / days between scheduled shipments;
- minimum global reputation required to enter the contract;
- collection ship name;
- stable buyer ID and offer ID.

All buyer offers are visible even when locked by reputation. A locked offer remains inspectable but does not show an actionable CONTACT control.

Higher-reputation opportunities should generally require:

- larger shipment quantities;
- more advanced or rarer resources;
- higher minimum quality;
- more dependable recurring service.

Prices vary between buyers. A higher reputation requirement does **not** guarantee the best price; the player should still compare opportunities.

### Price invariant

Brokered buyer unit prices must remain below the normal direct conglomerate selling rate for the equivalent qualifying material.

The reason to accept a buyer contract is additional independent collection capacity and predictable recurring demand, not a better base selling price.

The buyer ship's collection does **not** consume the ordinary Corporate Ship's export capacity.

Exact price multipliers are balance data and should remain tuneable.

---

## Resource quality

Buyer quality is a **minimum quality requirement**.

The implementation should use the game's existing canonical quality bands rather than create a second quality system.

A shipment is eligible when the colony contains at least the contract quantity across stock bands that meet or exceed the buyer's minimum quality.

Initial implementation should not support partial fulfilment. A shipment is either fully transferable or not transferable.

When fulfilling a contract, qualifying stock should be consumed from the **lowest acceptable quality first** so the game does not waste better-quality material unnecessarily.

The normal colony trade reserve protects stock from generic Corporate Ship exports, but it should not prevent an explicit player-confirmed buyer-contract transfer. The buyer popup must show the projected stock remaining after transfer so the choice is clear.

---

## Contract ownership and duration

Recommended minimal rule for Stage 8:

- a buyer contract is bound to the **colony that entered it**;
- a specific buyer offer can have only one active contract across the player's corporation at a time;
- contracts are recurring and open-ended until the player cancels them or the buyer terminates them;
- no separate fixed contract-duration system is introduced in this feature.

This keeps the system focused on recurring reliability and prevents the same buyer offer from being multiplied across every colony.

---

## Conglomerate Buyers Service UI

The service is launched from the colony/ship management area using an action named:

**CONGLOMERATE BUYERS SERVICE**

Because the table is information-dense and mobile is the primary platform, the buyer service should open as a full-screen workflow rather than be constrained to a small card.

### Buyer table

The same table is used for available and established contracts.

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

The table must support sorting on the meaningful comparable columns.

Filters should sit directly above the relevant columns where practical:

- Buyer/company: text search
- Resource: dropdown
- Quality: dropdown
- Shipment amount: minimum/maximum or compact numeric filter
- Price: minimum or compact numeric filter
- Frequency: maximum interval or compact numeric filter
- Reputation: maximum requirement / eligible-only option

A top-level status filter switches between at least:

- **AVAILABLE**
- **CURRENT CONTRACTS**
- **ALL**

Locked-by-reputation buyers remain visible in ALL/AVAILABLE but have no CONTACT action.

### Available contract action

If reputation is sufficient:

**CONTACT**

CONTACT opens a contract detail popup containing:

- buyer/contact name;
- company name;
- company business type;
- required resource;
- minimum quality;
- quantity per shipment;
- unit rate;
- total value per successful shipment;
- collection frequency;
- reputation requirement;
- first scheduled collection date once entered;
- short explanation that the conglomerate is brokering the relationship and taking its margin.

Primary action:

**ENTER CONTRACT**

### Established contract action

Once established, CONTACT becomes:

**VIEW**

The contract detail view additionally shows:

- current buyer happiness score;
- colour status: green / amber / red;
- next collection date;
- next required shipment;
- current qualifying stock;
- successful deliveries;
- late deliveries;
- missed collections;
- delivery history;
- total money earned from this contract;
- contract start date;
- **CANCEL CONTRACT** action.

---

## Buyer happiness / relationship score

Each established buyer relationship uses a score from **1 to 100**.

Starting score:

**75**

Continuous colour bands:

- **1–33: Red**
- **34–66: Amber**
- **67–100: Green**

The score is clamped to 1–100.

### Successful and late deliveries

Recommended unambiguous shipment scoring:

- delivered on the scheduled date: **+1 happiness**;
- delivered 5 days late: **-1 happiness**;
- delivered 10 days late: **-2 happiness**;
- delivered 15 days late: **-3 happiness**.

A late shipment receives the lateness result above instead of also receiving the +1 on-time bonus. This avoids double-counting.

### Missed shipment escalation

If the final 15-day collection opportunity is not fulfilled, the buyer ship leaves without cargo.

Missed shipment consequences:

- first missed shipment: **-10 happiness**;
- second missed shipment: **-20 happiness**;
- third missed shipment: **buyer immediately terminates the contract**.

Recommended final clarification before implementation: the third missed shipment should also apply **-30 happiness** before termination so the most severe service failure has a corresponding global-reputation consequence.

Miss counts are lifetime misses for that active contract, not only consecutive misses.

### Red-state cancellation

If the buyer relationship finishes **two consecutive resolved delivery cycles in Red**, the buyer cancels the contract.

Returning to Amber/Green resets the consecutive-red counter.

---

## Collection ship lifecycle

A buyer sends its own collection vessel for each scheduled shipment.

The ship is independent of normal Corporate Ship import/export capacity.

Recommended integration with existing physical logistics:

- buyer collection ships use the existing canonical Spaceport berth model;
- a docked buyer ship consumes one berth while waiting;
- if no berth is available, it enters Orbital Holding using the same general physical rule as other arriving ships;
- the contractual due-date/lateness clock continues while the ship is waiting for the colony's logistics capacity;
- when the ship becomes actionable, the game pauses through the existing cross-colony pending-event flow.

This makes Spaceport capacity matter without creating a second landing-capacity system.

### Arrival / retry sequence

For one shipment cycle:

- **Due date:** first collection popup;
- **Due +5 days:** second popup if still unfulfilled;
- **Due +10 days:** third popup if still unfulfilled;
- **Due +15 days:** final popup.

At every popup the UI shows:

- ship name;
- buyer/company;
- contract resource;
- required minimum quality;
- required quantity;
- qualifying stock available now;
- whether the shipment can currently be fulfilled;
- amount of money paid if transferred;
- days late;
- current buyer happiness;
- consequence of declining/not fulfilling at this stage.

Actions:

- **TRANSFER STOCK** when the full qualifying shipment is available;
- **NOT READY / CONTINUE WAITING** before the final opportunity;
- final opportunity resolves either with transfer or missed-shipment departure.

Closing/dismissing the popup must not bypass the required decision.

If fulfilled, the ship departs immediately and the next collection date is scheduled from the contract cadence.

If unfulfilled at +15 days, the ship departs and the missed-shipment escalation applies.

---

## Reputation

### Global reputation

Global reputation:

- starts at **0**;
- can go below 0;
- has an upper bound of **100**;
- grows deliberately slowly.

The requested progression pace is:

- successful normal transaction: **+0.01 global reputation**;
- successful 10-year colony contract: **+0.1 global reputation**.

Buyer-contract successes should use the normal successful-transaction increment rather than award large reputation gains.

### Buyer losses feed global reputation

Negative buyer relationship changes affect global reputation at **10% of the buyer loss**.

Examples:

- buyer happiness -1 → global reputation -0.1;
- buyer happiness -10 → global reputation -1.0;
- buyer happiness -20 → global reputation -2.0.

Recommended rule: this 10% coupling applies to **negative buyer changes only**. Positive buyer happiness still gives the normal +0.01 successful-transaction global gain. This preserves slow reputation growth while making failures commercially meaningful.

### Proposed 10-level reputation scale

A 10-level player-facing scale that supports negative reputation and gives useful early progression despite the slow increments:

| Level | Name | Global Reputation |
|---|---|---:|
| 1 | Tarnished | below 0 |
| 2 | Unknown | 0–4.99 |
| 3 | Emerging | 5–9.99 |
| 4 | Recognised | 10–19.99 |
| 5 | Established | 20–34.99 |
| 6 | Reliable | 35–49.99 |
| 7 | Trusted | 50–64.99 |
| 8 | Preferred | 65–79.99 |
| 9 | Premier | 80–89.99 |
| 10 | Elite | 90–100 |

Buyer offers should use the raw numeric minimum reputation for precise gating while the named level gives the player an understandable overall standing.

### Existing implementation mismatch to resolve

The current repository's `ContractService.awardCompletion()` awards integer reputation values by rating (Bronze 1, Silver 2, Gold 4, Platinum 7). That does not match the requested slow 0–100 reputation model above.

Before implementing this feature, the reputation system needs one canonical scale. The recommended Stage 8 direction is to migrate/normalize the existing award behaviour to the new slow-scale model rather than introduce a second reputation number.

---

## Player cancellation

The UI requires **CANCEL CONTRACT**, but cancellation consequences were not defined in the initial design.

A consequence is necessary or the player could cancel immediately before a known missed delivery and avoid all reliability risk.

Recommended minimal rule:

- cancellation is blocked while a buyer ship is currently waiting for that contract;
- otherwise player cancellation immediately ends the contract;
- cancellation applies **-5 buyer happiness** and therefore **-0.5 global reputation** through the normal 10% negative-coupling rule;
- the cancelled offer returns to the catalogue only after one normal collection interval has passed.

This is deliberately smaller than the penalty for a completely missed collection while preventing consequence-free contract cycling.

---

## Buyer progression by reputation

Buyer availability should be data-driven, but the progression should follow a simple pattern:

- low reputation: visible/basic resources, smaller shipments, lenient quality, easier reliability requirements;
- early-mid reputation: common ores and larger recurring quantities;
- mid reputation: advanced metals, precious resources and higher quality thresholds;
- high reputation: specialist/fissile/rare gemstone contracts with substantial loads;
- very high reputation: exotic/deep-tier resources, very large loads and demanding quality/regularity.

The exact buyer list, quantities, cadence and prices are balance content, not new mechanics.

There must be multiple economically different offers so sorting/filtering and contract choice are meaningful.

---

## Critical invariants

1. Direct Conglomerate selling remains the better unit rate.
2. Buyer ships provide separate collection capacity and do not consume Corporate Ship export capacity.
3. An active buyer contract belongs to one colony.
4. One buyer offer cannot be active at multiple colonies simultaneously.
5. Shipment resource, minimum quality, exact quantity, price and cadence are locked when the contract is entered.
6. No partial deliveries in the first implementation.
7. The game never consumes below-minimum-quality stock for a buyer shipment.
8. Qualifying stock is consumed lowest acceptable quality first.
9. Buyer happiness is one canonical 1–100 relationship score.
10. Negative buyer relationship changes feed 10% into global reputation.
11. Buyer arrivals are real ship events and must reuse the canonical Spaceport berth model.
12. Buyer collection events must participate in the existing cross-colony pause/attention flow.
13. Save/load must preserve active contracts, buyer relationships, next due dates, waiting ships, missed counts, red streaks, delivery history and total revenue.
14. The catalogue and contract state must be deterministic/persisted enough that reloads cannot reroll prices or escape a failing obligation.

---

## Implementation ownership — intended

No production code has been implemented yet.

Likely canonical ownership when implementation begins:

- static buyer/offer definitions: `js/data/`;
- buyer contract lifecycle, scoring and due-date rules: a single domain service in `js/domain/`;
- inventory qualification/transfer should use existing `InventoryService` quality-band ownership rather than duplicate stock logic;
- arrivals should integrate with the existing pending-event flow;
- physical arrival/berth occupancy must extend `spaceport-model.js` rather than create parallel berth rules;
- UI should be a full-screen external-view workflow under `views/` with UI code only rendering/dispatching;
- state remains in `GameStore`/canonical company+colony state, never DOM-owned.

A save-schema version bump will likely be required because active buyer contracts and relationships are persistent gameplay state.

---

## Required regression coverage when implemented

At minimum tests must prove:

1. reputation gates CONTACT without hiding locked buyers;
2. all buyer-table sorting/filtering works without changing buyer state;
3. entering a contract locks resource/quality/quantity/price/cadence to the current colony;
4. the same offer cannot be active at two colonies;
5. buyer collection does not consume Corporate Ship export capacity;
6. buyer unit price remains below the equivalent direct conglomerate rate;
7. quality qualification uses existing inventory bands correctly;
8. transfer consumes lowest qualifying quality first;
9. insufficient quantity prevents partial delivery;
10. on-time / +5 / +10 / +15 outcomes adjust happiness correctly;
11. first/second/third missed shipments follow escalation and cancellation;
12. two consecutive resolved Red cycles cancel the contract;
13. successful shipments add the intended small global reputation increment;
14. negative buyer happiness affects global reputation at 10%;
15. buyer ship uses Spaceport berth/orbital holding correctly;
16. pending buyer events pause the corporation and work across colonies;
17. cancel cannot bypass a currently waiting shipment;
18. save/load preserves every active timing/relationship/history value without reroll;
19. mobile browser coverage proves the full-screen table, filters, CONTACT/VIEW flow and arrival popup remain usable on supported phone viewports.

---

## Deliberately out of scope

To keep this feature contained, the first implementation should **not** add:

- direct player-to-buyer negotiation over price/quantity/terms;
- auction markets;
- dynamic market price simulation;
- buyer competition/bidding;
- partial shipments;
- player-delivered freight to these buyers;
- contract insurance;
- automated fulfilment;
- relationship dialogue trees;
- contract-specific refining requirements;
- independent player-owned buyer relationships.

Those belong to later progression if needed.

---

## Open decisions requiring user review

These are the only material gaps remaining before implementation:

1. **Third missed shipment:** recommended -30 happiness then immediate cancellation.
2. **Player cancellation:** recommended -5 happiness / -0.5 global reputation and one-interval re-contact delay.
3. **Reputation normalization:** current code awards 1/2/4/7 for completed colony contracts; recommended change is to move that existing system onto the requested slow 0–100 scale rather than maintain two incompatible scales.
4. **Navigation wording:** confirm whether “colony ship panel” means the persistent colony/ship management area; the Buyers Service itself should be full-screen and accessible between Corporate Ship visits.

Everything else above is defined sufficiently to begin implementation once these points are approved.