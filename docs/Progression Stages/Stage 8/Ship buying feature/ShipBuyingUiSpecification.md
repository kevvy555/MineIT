# Stage 8 — Ship Buying UI Specification

Status: **Approved mock direction — production implementation not started**  
Date: **2026-08-31**  
Companion feature spec: `ShipBuyingFeatureSpec.md`  
Operational fleet spec: `ShipOperationalUseSpecification.md`  
Shared corporate language: `ConglomerateProcurementUiLanguage.md`  
Approved proof mock: `ShipBuyingMock.html` (V14 layout)

## 1. UI Goal

Ship acquisition is a major progression feature and must feel like access to Koplin Deep Reach's powerful internal procurement network, not a generic store or spreadsheet.

The player is buying a major capital asset through Deep Reach's manufacturer relationships and framework discount. The interface therefore combines:

- strong ship imagery;
- manufacturer identity;
- dense but readable technical data;
- visible corporate discount;
- long factory lead times;
- formal contract execution;
- an order/production queue.

The approved direction is **image-led, mobile-first and single-screen for the main market view**.

---

## 2. Corporate Fiction and Terminology

Primary title:

**DEEP REACH FLEET PROCUREMENT**

Preferred language:

- Approved Supplier / Approved Shipbuilder
- Shipyard / Manufacturer
- Fleet Procurement
- Framework Rate
- Negotiated Procurement
- Factory Lead
- Delivery Colony
- Capital Order
- Purchase Contract
- Production & Delivery Queue
- Fleet Asset

Avoid consumer-retail language such as cart, checkout, bargain or sale.

The screen must make clear:

- Deep Reach is the procurement channel;
- the manufacturer remains the canonical builder;
- the player company owns the purchased ship;
- the Deep Reach framework gives the player a substantial discount while under charter.

---

## 3. Approved Main-Screen Layout

The main Fleet Procurement screen should target **one phone screen with no vertical scrolling** at the reference mobile viewport wherever practical.

The approved hierarchy is:

1. Deep Reach header + `cc` operating cash.
2. Network / charter status strip.
3. Horizontally scrolling manufacturer selector.
4. Ship selector header with custom Role control.
5. Horizontally scrolling ship selector strip.
6. One selected-ship dossier/purchase panel.

Do not add a redundant second "selected shipyard" row: the selected manufacturer card and ship-selector heading already communicate the active shipyard.

---

## 4. Manufacturer Selector

Manufacturers are horizontally scrollable cards across the top of the market.

Each shows:

- manufacturer name;
- speciality;
- model count;
- manufacturer accent.

Canonical manufacturer identities:

- Asterion Shipworks — versatile specialist/frontier vessels;
- Kestrel Aerospace Systems — speed and rapid turnaround;
- Keystone Modular Fabrication — modular cargo/logistics;
- Longreach Engineering — range, efficiency and reliability;
- Crownline Heavy Works — extreme bulk freight.

Selecting a manufacturer updates the ship selector strip immediately.

---

## 5. Ship Selector Strip

Immediately below the manufacturer selector, show a compact horizontal strip of model cards.

The strip must feel useful with a large manufacturer catalogue, not like a decorative carousel.

Each selector card contains only what fits cleanly:

- image/thumbnail;
- model name;
- role/size;
- charter price.

Tapping a model replaces the selected-ship dossier below without opening another page/modal.

The selected card receives the manufacturer accent treatment.

### Role filter

The Role control lives in the ship-selector header.

It must use a **custom MineIT/Deep Reach popup**, not the generic browser `<select>` visual.

Initial role options:

- All roles
- Courier
- Freighter
- Survey
- Passenger
- Heavy Freight
- Utility

---

## 6. Selected Ship Panel

The selected ship remains the single primary dossier/purchase surface.

### Above-image header

Show compactly:

- manufacturer;
- vessel model;
- short role/positioning description;
- model count/index;
- technical chips such as manufacturer, size, role, factory-new state.

The **+ Compare** action sits on the **right immediately above the hero image**, sharing existing vertical space rather than creating another full-width action row.

### Hero image

The ship artwork is the dominant visual element.

Canonical class artwork should be used when generated. The proof mock may use a local reference image; the repository mock intentionally does not need to persist that review image as a separate asset.

### Technical summary

Use a compact grid for the minimum useful values:

- cargo;
- fuel tank;
- food;
- crew;
- passengers;
- transit weeks/LY;
- fuel/LY;
- lead time where useful in technical context.

Keep padding tight: this section must not consume enough space to force the main screen to scroll unnecessarily.

---

## 7. Negotiated Procurement

The approved layout places the key commercial data on **one compact line**:

```text
LIST | RATE | PRICE | LEAD | STATUS
```

Values:

- manufacturer list price;
- Deep Reach framework discount (`-35%` initial balance value);
- final player price;
- factory lead time;
- affordability/procurement status.

The visual priority is:

1. final player price;
2. corporate discount;
3. list price;
4. lead time/status.

A short trait line may sit below this compact commercial row.

---

## 8. Delivery Colony Picker

The delivery-colony control must be a **custom popup**, not a generic browser select.

The main panel shows the currently chosen colony and free-berth summary.

Opening the picker displays each owned operational colony with at minimum:

- colony name;
- free Spaceport berths;
- short location/status note where useful.

Example:

```text
Haven Ridge
2 free berths
Frontier surface docking available
```

Berth type/size does not block selection in this release.

The selected colony must remain visibly confirmed before contract review.

---

## 9. Main Bottom Actions

The bottom action row is fixed conceptually to:

**COMPARE | REVIEW PURCHASE CONTRACT | ORDERS**

Width proportions:

```text
25% | 50% | 25%
```

- Compare opens the dedicated comparison screen.
- Review Purchase Contract opens the formal contract sheet.
- Orders opens the production/delivery queue.

The separate `+ Compare` button above the image only adds/removes the currently selected vessel from the comparison set.

---

## 10. Comparison Screen

Comparison is a **dedicated full-page view below the common Deep Reach header**.

It is a real side-by-side comparison, not vertically stacked cards.

Mobile behaviour:

- two ship columns should be comfortably readable at once where possible;
- additional selected ships can extend horizontally;
- the metric label column stays readable;
- horizontal scrolling is acceptable inside the comparison table;
- the comparison page itself remains a full-screen functional view.

Useful rows:

- supplier;
- role/size;
- charter price;
- lead time;
- cargo;
- fuel;
- food;
- crew;
- passengers;
- transit;
- fuel use;
- traits/notes.

Support a small comparison set initially (2–3 ideal; implementation may allow a few more if the horizontal table remains usable).

---

## 11. Purchase Contract

The final purchase confirmation is intentionally immersive.

It should look like a **single-page white commercial/legal document**, not another dark game panel.

Requirements:

- white background throughout;
- no black data boxes;
- one-page presentation is essential;
- text-led purchase detail;
- no unnecessary ship technical specification table;
- formal but concise wording;
- cancellation terms;
- actual signature pad;
- Sign & Place Order action.

The document should include:

- purchaser;
- supplier/manufacturer;
- selected vessel;
- delivery colony;
- manufacturer list price;
- Deep Reach discount;
- final contract value;
- estimated factory lead time;
- ownership on delivery;
- payment source;
- concise purchase statement;
- key cancellation/production terms.

### Signature

The player must physically draw/sign in the signature area before the mock allows order execution.

For the first production implementation the signature **does not need to be persisted**.

The architecture should leave room for future persistence/audit history without making it a requirement now.

---

## 12. Orders Screen

The Orders screen is a **dedicated full-page functional view below the common header**.

It does not need the visual theatre of the market screen; clarity matters more.

Each order shows:

- order/reference ID;
- vessel model;
- manufacturer;
- delivery colony;
- contract value;
- factory lead / estimated arrival;
- current state;
- time/progress indicator.

Initial states may include:

- ORDER ACCEPTED
- FACTORY QUEUE
- IN PRODUCTION
- DELIVERY TRANSIT
- ARRIVED / COMMISSIONED

The progress rail represents elapsed order time and must not imply unavailable real-time manufacturer telemetry.

---

## 13. Shared Conglomerate UI Direction

This procurement UI should push the existing buyer/corporate visual language into a reusable Deep Reach corporate system.

Reusable concepts:

- Deep Reach corporate header;
- network status strip;
- black/graphite/steel base;
- amber/copper procurement accents;
- restrained cyan data accent;
- green only for success/available;
- compact technical labels;
- custom popup selectors rather than browser-default controls;
- full-page functional subviews;
- strong difference between immersive transaction surfaces and operational list screens.

Future Conglomerate resource procurement and Corporate Ship surfaces should converge toward this language rather than each inventing a new shell.

---

## 14. Interaction Requirements

The approved proof mock demonstrates or establishes the required interaction direction for:

1. changing manufacturer;
2. horizontal model browsing;
3. custom role filtering;
4. selected-ship dossier on the same market screen;
5. add/remove comparison selection;
6. full-page side-by-side comparison;
7. one-line negotiated procurement summary;
8. custom delivery-colony picker with free berth information;
9. white single-page purchase contract;
10. drawable signature requirement;
11. placing a mock order;
12. full-page order queue.

The proof mock does not need save persistence or production services.

---

## 15. Production Separation of Concerns

The production UI:

- loads repeated/static markup from view templates where appropriate;
- renders read-only Universe catalogue data;
- owns only transient filter/selection/comparison UI state;
- dispatches quote/order intent to `ShipMarketService`;
- uses `ExpansionService`/fleet domain for operational ship state after delivery;
- never mutates cash, order truth, ship capacity or fleet state directly;
- uses bounded listener ownership/cleanup;
- rejects stale async writes when manufacturer/model context changes.

The proof HTML remains self-contained and is **not** a production architecture template.

---

## 16. Mobile Acceptance Targets

- approximately 360px phone width and upward;
- main Market page should target one-screen/no-vertical-scroll at the reference phone viewport;
- horizontal manufacturer and ship strips remain touch-friendly;
- custom popups are finger-friendly and readable;
- no browser-default select styling for key immersive controls;
- long names wrap/truncate safely without page-width overflow;
- no selector/hero overlap;
- bottom action row remains 25/50/25;
- contract remains a single white page;
- compare and order views use the full available screen below the shared header.
