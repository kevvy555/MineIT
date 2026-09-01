# Stage 8 — Conglomerate Procurement UI Language

Status: **Shared design language proposal**  
Applies initially to Ship Buying and should later guide the Corporate Ship, resource purchasing, buyer services and other Koplin Deep Reach interfaces.

## 1. Purpose

Create one recognisable interface language for every system the player accesses **through Koplin Deep Reach Corporation**.

The player should be able to recognise immediately that they have left normal colony operations and entered the conglomerate's commercial/logistics network.

The shared language must be immersive without becoming difficult to use on a phone.

---

## 2. Canonical Identity

`MineIT-Universe` describes **Koplin Deep Reach Corporation** as a major mining, logistics and industrial conglomerate operating across extraction, processing, logistics, industrial infrastructure and frontier services.

Canonical visual identity:

- **palette:** black, amber, steel;
- **style:** practical corporate mining and logistics design.

That identity should become the primary visual basis of conglomerate-facing UI.

---

## 3. Shared Corporate Network Fiction

All Deep Reach screens can be treated as specialised nodes within one corporate network.

Suggested root identity:

**KDR CORPORATE NETWORK**

Functional node examples:

- `FLEET PROCUREMENT NODE`
- `EXTERNAL BUYER NETWORK`
- `CORPORATE SUPPLY NODE`
- `ENGINEERING DEPLOYMENT NODE`
- `CHARTER OPERATIONS NODE`
- `CORPORATE SHIP LINK`

The exact node code can differ, but the shell should feel shared.

Example header hierarchy:

```text
KDR CORPORATE NETWORK // FLEET PROCUREMENT NODE
DEEP REACH FLEET PROCUREMENT
```

Existing wording such as `KOPLIN COMMERCIAL OS` can be evolved toward this shared Deep Reach identity rather than each corporate feature inventing its own unrelated system brand.

---

## 4. Visual Hierarchy

### Level 1 — Network identity

Small technical label:

```text
KDR CORPORATE NETWORK // <NODE>
```

### Level 2 — Feature title

Large readable title:

```text
DEEP REACH FLEET PROCUREMENT
CONGLOMERATE BUYERS
CORPORATE SUPPLY
```

### Level 3 — live status strip

Examples:

```text
● NETWORK ONLINE
CHARTER ACCESS ACTIVE
FRAMEWORK RATE ACTIVE
SECURE PROCUREMENT LINK
```

### Level 4 — content sections

Examples:

```text
APPROVED SHIPBUILDERS
CAPITAL ORDER
DELIVERY ASSIGNMENT
CONTRACT PROFILE
```

This hierarchy should remain consistent across future Deep Reach screens.

---

## 5. Colour Roles

### Deep Reach amber

Use for:

- corporate identity;
- charter benefits;
- procurement/actions;
- selected Deep Reach navigation;
- important transactional values.

### Steel / graphite

Use for:

- surfaces;
- borders;
- data frames;
- secondary structural UI.

### Cool cyan / blue

Use sparingly for:

- network/data state;
- informational telemetry;
- manufacturer-neutral technical information.

This preserves some of the existing Buyers Service terminal feel while moving the parent identity toward canonical Deep Reach amber/steel.

### Green

Use only for:

- network online;
- affordable/available;
- completed/accepted;
- healthy state.

### Red

Use only for:

- failures;
- missed contracts;
- insufficient/blocked critical actions;
- severe warnings.

Avoid making every button a bright accent colour.

---

## 6. Shared Component Family

Production should eventually provide reusable variants of the following.

### CorporateHeader

Contains:

- node label;
- feature title;
- contextual account value such as cash/reputation;
- close/back.

### CorporateStatusStrip

Compact horizontal telemetry:

- online state;
- charter access;
- current relationship tier;
- active commercial benefit.

### CorporateSectionHeader

A small command-path style label plus readable section title.

### CorporateEntityCard

Used for:

- manufacturers;
- buyers;
- suppliers;
- departments;
- future service providers.

### CorporateProfilePanel

Used for deeper entity detail.

### CorporateTransactionSummary

Standard place for:

- base/list value;
- Deep Reach benefit/fee;
- final player amount;
- destination/assignment;
- final action.

### CorporateStatusChip

Examples:

- AVAILABLE
- LOCKED
- IN PRODUCTION
- DOCKED
- ORBITAL HOLDING
- CONTRACT ACTIVE

### CorporateBenefitPanel

Explains why the player is getting a special rate/service under the charter.

Example:

```text
DEEP REACH FRAMEWORK RATE
35% below manufacturer list through Group fleet purchasing agreements.
This rate is available while your operation remains under the Deep Reach charter.
```

---

## 7. Transaction Language

Deep Reach screens should make the conglomerate's role explicit.

### Procurement transaction

```text
MANUFACTURER LIST
DEEP REACH FRAMEWORK DISCOUNT
YOUR CHARTER RATE
```

### Resource purchase

Potential future equivalent:

```text
MARKET / SUPPLIER RATE
DEEP REACH SUPPLY TERMS
YOUR CHARTER COST
```

### Buyer contract

Potential future equivalent:

```text
BUYER GROSS RATE
DEEP REACH COMMERCIAL MARGIN
YOUR CONTRACT RATE
```

This does not require every system to use the same commercial rule. It creates a consistent way to explain Deep Reach's involvement.

---

## 8. Tone of Voice

Deep Reach UI should be concise, competent and operational.

Good:

- `Framework allocation confirmed.`
- `Manufacturer production slot reserved.`
- `Delivery assignment required.`
- `Charter fleet rate active.`
- `Collection vessel holding for berth.`

Avoid:

- jokey shop language;
- marketing hype;
- excessively militaristic wording;
- long lore paragraphs inside transactional flows.

Lore should appear as short, useful context around entities and services.

---

## 9. Manufacturer Identity Inside Deep Reach UI

The shared Deep Reach shell should not erase external company identities.

Inside Fleet Procurement:

- the header remains Deep Reach black/amber/steel;
- each shipbuilder receives its own accent/palette within manufacturer cards and ship dossiers;
- Deep Reach transactional areas return to the shared amber/steel style.

This creates a clear hierarchy:

**Deep Reach owns the procurement experience; the manufacturer owns the product identity.**

The same pattern can later apply to third-party suppliers and buyers.

---

## 10. Relationship to Colony UI

Normal colony UI represents the player's local operation.

Deep Reach UI represents an external corporate system.

The transition should feel noticeable:

### Colony

- practical operational controls;
- local map/resources/buildings;
- player-company activity.

### Deep Reach

- full-screen corporate shell;
- network status;
- contract/procurement/service framing;
- external organisations and logistics.

This contrast is intentional and helps the world feel larger than the colony screen.

---

## 11. Existing Buyer UI Migration Direction

The current Buyers Service already has strong elements worth preserving:

- compact full-screen terminal;
- network-online strip;
- entity profile overlay;
- information-dense mobile layout;
- explicit conglomerate broker note.

Future alignment should:

1. replace generic/independent system identity with the shared KDR Corporate Network shell;
2. introduce canonical Deep Reach amber/steel as the parent identity;
3. retain cool data colours where useful;
4. use the shared transaction/benefit language;
5. preserve existing BuyerService domain ownership and behaviour.

This UI consolidation should happen deliberately rather than being bundled as unrelated refactoring into the first ship-market production change.

---

## 12. Corporate Ship UI Direction

The Corporate Ship should eventually use the same shell when the player interacts with Deep Reach services aboard/through that vessel.

Possible navigation sections:

- SUPPLY
- COLONISTS
- CHARTER SERVICES
- FLEET PROCUREMENT
- ENGINEERING / DEPLOYMENTS

The physical ship may have its own hero art and docked-status context, but its service panels should feel like connected nodes in the same corporate system.

---

## 13. Resource Buying Direction

Corporate resource buying should eventually move away from a generic shop/trade form and use the same transaction summary:

- supplier/list cost;
- Deep Reach terms;
- final charter cost;
- cargo capacity / delivery constraint;
- authorise purchase.

This will make ship acquisition feel like the first mature part of a wider corporate procurement ecosystem rather than a unique one-off screen.

---

## 14. Implementation Rule

The design language is shared; gameplay services remain separate.

Do not create one giant `CorporateService` domain object simply because several screens share visual components.

Shared production work should focus on:

- view components/templates;
- CSS tokens/classes;
- formatting/presentation helpers;
- navigation shell patterns.

Each gameplay system must continue to use its own canonical domain owner.
