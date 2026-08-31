# Stage 8 — Ship Buying UI Specification

Status: **Working UI specification**  
Companion feature spec: `ShipBuyingFeatureSpec.md`  
Shared corporate language: `ConglomerateProcurementUiLanguage.md`  
Proof mock: `ShipBuyingMock.html`

## 1. UI Goal

Ship acquisition is a major progression feature and must feel like access to a powerful interstellar corporate procurement network, not an inventory table.

The player is not browsing a generic public shop. While operating under the charter, they are entering **Koplin Deep Reach Corporation's internal commercial network** and using Deep Reach's established shipbuilder relationships and fleet procurement agreements.

The UI must communicate four things immediately:

1. **Deep Reach is the channel.**
2. **The five shipbuilders are real separate manufacturers with distinct identities.**
3. **The charter gives the player's operation exceptional purchasing terms.**
4. **Ships are major capital assets with long production lead times, not instant consumables.**

The screen should feel desirable even when the player cannot afford a ship.

---

## 2. Relationship to Existing Conglomerate UI

The current Conglomerate Buyers Service already establishes useful ideas:

- full-screen mobile terminal presentation;
- network/status strip;
- compact information density;
- corporate/terminal labels;
- profile overlay for deeper detail;
- explicit broker wording.

The ship market should retain those strengths but push the visual language further toward the canonical Deep Reach identity from `MineIT-Universe`:

- palette: **black, amber, steel**;
- style: **practical corporate mining and logistics design**;
- tone: powerful industrial network, not consumer retail;
- secondary data/network accents may use restrained cyan/blue where useful.

The eventual goal is to bring the Corporate Ship UI, resource buying, buyer service and fleet procurement onto the same shared shell.

---

## 3. Screen Name and Fiction

Primary title:

**DEEP REACH FLEET PROCUREMENT**

System line examples:

```text
KDR CORPORATE NETWORK // FLEET ACQUISITION NODE
CHARTER PROCUREMENT ACCESS // ACTIVE
```

Useful terminology:

- Fleet Procurement
- Approved Shipbuilders
- Manufacturer Catalogue
- Charter Fleet Rate
- Corporate Framework Discount
- Factory Lead Time
- Delivery Assignment
- Capital Order
- Production Queue
- Fleet Asset

Avoid generic retail wording such as:

- shop;
- cart;
- checkout;
- sale;
- bargain.

`BUY` may appear on compact buttons where clarity matters, but primary formal actions should prefer **PLACE ORDER**, **REVIEW PROCUREMENT**, or **AUTHORISE CAPITAL ORDER**.

---

## 4. Mobile-First Information Architecture

The main screen uses a full-height mobile shell with three persistent areas:

### Header

Shows:

- Deep Reach procurement identity;
- current `cc` balance;
- charter discount status;
- close/back action.

### Main content

Changes between:

- Market;
- Compare;
- Orders.

### Bottom navigation / action area

A compact three-way navigation is preferred:

**MARKET | COMPARE | ORDERS**

When a ship detail panel is open, the bottom area can become the context-specific procurement action while retaining an obvious close/back path.

---

## 5. Market View

### 5.1 Corporate status strip

Directly under the header:

```text
NETWORK ONLINE • CHARTER FLEET RATE ACTIVE • 35% FRAMEWORK DISCOUNT
```

This communicates the charter benefit before the player sees a price.

### 5.2 Manufacturer gallery

Manufacturers are the first major browsing decision and should be represented by horizontally scrollable or compact selectable cards, not a dropdown.

Each manufacturer card shows:

- manufacturer name;
- speciality;
- short corporate positioning line;
- model count;
- manufacturer visual identity accent.

Canonical identities:

#### Asterion Shipworks

**Versatile specialist / frontier**  
Charcoal, copper and white. Practical modular specialist craft.

#### Kestrel Aerospace Systems

**Speed / rapid turnaround**  
Deep navy, silver and electric cyan. Engine-forward high-performance forms.

#### Keystone Modular Fabrication

**Modular cargo / logistics**  
Steel grey, white and signal orange. Visible modular blocks and standard interfaces.

#### Longreach Engineering

**Range / efficiency / reliability**  
Dark green, cream and gunmetal. Long protected frontier forms.

#### Crownline Heavy Works

**Extreme bulk capacity**  
Black alloy, industrial yellow and oxide red. Massive exposed industrial structures.

Selection should visibly recolour/accent the manufacturer card and update the model gallery.

An **ALL BUILDERS** selection remains useful.

---

## 6. Filters

Filters should be useful but secondary to visual browsing.

Initial compact filters:

- Role
- Size / capacity class
- Max charter price
- Cargo minimum
- Vector Exchange: Any / Interstellar / In-system
- Sort

Useful sort options:

- Charter price low/high
- Cargo high
- Speed high
- Efficiency high
- Reliability high
- Lead time short

Avoid starting with a dense spreadsheet-like filter bar.

---

## 7. Model Gallery

Ship models appear as strong visual cards.

Each card should contain:

- large ship image / canonical image fallback;
- manufacturer line;
- model name;
- role;
- compact key statistics;
- manufacturer list price;
- Deep Reach charter price;
- factory lead time;
- affordability state;
- compare toggle;
- details action.

### 7.1 Price treatment

The discount should be visually unmistakable.

Example:

```text
LIST            cc 12.5m
DEEP REACH      -35%
YOUR RATE        cc 8.1m
```

The list price should not be visually dominant over the final rate, but it must remain readable.

### 7.2 Lead time treatment

Lead time should be treated as a major purchasing statistic alongside price.

Examples:

```text
FACTORY LEAD TIME  7 MONTHS
FACTORY LEAD TIME  1.8 YEARS
FACTORY LEAD TIME  4.2 YEARS
```

The longest ships should feel materially different from small craft.

### 7.3 Affordability

All ships remain visible.

Affordable:

```text
ORDER AVAILABLE
```

Unaffordable:

```text
INSUFFICIENT FUNDS
Need cc 2.4m more
```

Do not blur/hide the specs of unaffordable ships.

---

## 8. Ship Detail View

Opening a ship should feel closer to reviewing an asset dossier than opening a product row.

### Hero area

- large canonical class artwork;
- manufacturer;
- ship line;
- class/model;
- role;
- specialisation/traits.

### Performance summary

Prominent tiles:

- Cargo
- Fuel
- Food
- Crew min/max
- Passenger capacity
- Transit weeks / LY
- Fuel / LY
- Speed rating
- Efficiency rating
- Reliability rating

Secondary/reference fields:

- atmospheric capability;
- berth class;
- range class;
- Vector Exchange capability.

Berth and atmospheric restrictions are informational only in this release.

### Procurement summary

The lower fixed section displays:

```text
Manufacturer list price
Deep Reach framework discount
Your charter price
Factory lead time
Delivery colony
```

The player must select/confirm a delivery colony before the order action becomes available.

### Ownership wording

Use:

```text
ASSET OWNERSHIP
Your Operating Company

PROCUREMENT CHANNEL
Koplin Deep Reach Corporation
```

This makes it clear the corporation brokers the transaction but does not own the purchased asset.

---

## 9. Comparison Experience

Comparison is a first-class interaction because ships trade price, capacity, speed, efficiency, reliability and lead time against each other.

Support **up to three ships**.

The compare tray should remain visible when one or more ships are selected.

Comparison view should visually highlight winners for useful fields:

- lowest charter price;
- shortest lead time;
- highest cargo;
- largest fuel tank;
- largest passenger capacity;
- fastest transit;
- best efficiency;
- best reliability.

Do not reduce comparison to a large 30-column table. Use 2–3 vertical ship columns/cards and a concise shared metric stack.

---

## 10. Delivery Colony Selection

Every order must name its destination colony.

The detail/order panel contains a highly visible selector:

```text
DELIVERY ASSIGNMENT
Koplin Frontier I — Colony 01
```

The active colony may be preselected but must never be silently assumed.

If multiple colonies exist, the selector displays:

- colony name;
- system name;
- current Spaceport free/used berth summary where helpful.

For this release, berth type does not block selection.

---

## 11. Order Confirmation

The final order review should feel consequential.

Show:

- model;
- manufacturer;
- selected colony;
- list price;
- Deep Reach discount amount and percentage;
- final paid price;
- current company balance;
- balance after purchase;
- factory lead time;
- estimated arrival date;
- ownership statement.

Primary action:

**AUTHORISE CAPITAL ORDER**

The mock may use **PLACE ORDER** for compactness, but production UI should use the more immersive action where space allows.

Successful result:

```text
CAPITAL ORDER ACCEPTED
Manufacturer allocation confirmed through Deep Reach Fleet Procurement.
Estimated arrival: Y8 D114
```

---

## 12. Orders View

The market needs an integrated production/delivery queue because lead times can range from months to years.

Each active order card shows:

- ship model;
- generated vessel name if assigned yet;
- manufacturer;
- destination colony;
- paid charter price;
- order date;
- estimated arrival;
- time remaining;
- state.

Initial states:

- ORDER ACCEPTED
- FACTORY QUEUE
- IN PRODUCTION
- DELIVERY TRANSIT
- ARRIVED

A visual horizontal progress rail is useful but should not imply false manufacturing precision. It can represent time progress between order and expected arrival.

---

## 13. Shared Conglomerate Shell

The ship screen should prove reusable components for later corporate interfaces:

- Corporate network header
- Network status strip
- Account / relationship benefit badge
- Section label / command-path typography
- Profile/detail overlay
- Transaction summary
- Corporate broker/benefit note
- Confirmation panel
- Status chips
- Full-screen mobile layout

These should eventually be extracted into shared production CSS/view patterns rather than copied between Buyer, Corporate Ship and Procurement screens.

The proof mock may remain self-contained; production implementation must obey normal view ownership and canonical CSS rules.

---

## 14. Visual Style

### Primary Deep Reach colours

- near-black / graphite background;
- steel-grey structures;
- amber/gold operational accent;
- muted copper for pricing/procurement emphasis;
- restrained cool cyan for data/network status where useful;
- green only for positive/online/affordable confirmation;
- red only for genuine risk/error.

### Surface treatment

- industrial panel borders;
- subtle grid/scan texture;
- compact technical labels;
- large clean ship artwork;
- minimal glow;
- strong contrast;
- no excessive neon arcade styling.

### Typography

Use the existing compact monospace/technical language for small labels, while ship names and major headings can use a stronger normal UI font for readability.

The experience should feel like a sophisticated corporate logistics terminal, not a retro DOS simulation.

---

## 15. Interaction Requirements

The proof mock should demonstrate:

1. changing manufacturer;
2. model browsing;
3. simple filtering/sorting;
4. selecting up to three ships for comparison;
5. opening a ship dossier;
6. displaying list price vs 35% charter price;
7. displaying different lead times;
8. selecting a delivery colony;
9. placing a mock order;
10. seeing that order in the Orders view.

The mock does not need save persistence or production services.

---

## 16. Accessibility and Mobile Rules

- usable from approximately 360px phone width upward;
- primary buttons at least normal touch-target size;
- no hover-only essential interaction;
- horizontal manufacturer/model scrolling must remain touch friendly;
- text remains readable without relying purely on colour;
- selected comparison state has text/icon indication as well as colour;
- detail/order surface must have obvious close/back action;
- long ship names must wrap rather than overflow.

---

## 17. Production Separation of Concerns

The eventual production UI:

- loads static/repeated markup from view templates;
- renders read-only market/catalogue data;
- holds only transient UI state such as selected filters and comparison IDs;
- dispatches purchase intent to `ShipMarketService`;
- never owns cash, discount rules, order truth or ship-instance creation;
- rejects stale async view writes when the user changes/ closes context.

The proof HTML is deliberately self-contained and is **not** a production architecture template.
