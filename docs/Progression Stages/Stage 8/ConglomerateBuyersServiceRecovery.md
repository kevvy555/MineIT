# Conglomerate Buyers Service — Recovery Plan

Branch: `feature/conglomerate-buyers-service`  
Base at branch creation: `develop` commit `eb0977dc0069bcd5cb1eba1d5a08c2183b066d2e`

Authoritative gameplay/UI design:

- `ConglomerateBuyersService.md`
- `ConglomerateBuyersServiceMockup.html`
- `BuyerCollectionShipMockup.html`
- `BuyerContentGeneration.md`
- `BuyerAndShipImageDirectory.html`
- `EngineeringShipAndSpaceport.md`
- `TechnologyModel.md`
- `docs/PLAYER_PROGRESSION_STAGES.md`
- `docs/SHIP_EXPANSION_GAMEPLAY_RECOVERY.md`

The two approved UI mockups added directly to this feature branch are authoritative together with `ConglomerateBuyersService.md`. Correct earlier domain work was retained and only genuine mismatches were changed.

---

## Current status

**Conglomerate Buyers Service subfeature: Complete and validated.**

Latest validated functional/browser head: `25e67df8f8cae9bebc632000605284fd88b2c173`  
Passing GitHub Actions workflow: `33304609012`  
Passing job: `99238803630`

That exact-head workflow passed both:

- full unit / regression / domain coverage suite; and
- browser startup / interaction suite, including the dedicated buyer catalogue/profile/collection probe at `360×640`, `375×667`, `390×844`, `412×915`, and `915×412`.

No PR or merge to `develop` is authorised yet.

---

## Milestone 1 — Buyer domain/state foundation

Status: **Complete**

Foundation commit: `6bbb1115213995322e3e2622011d95147c6874aa`

Implemented:

- fixed 1,000-buyer commercial identity catalogue derived from the approved directory seed `8302026`;
- stable contact/company/named-ship pairings and all 30 approved collection-ship classes/capacities;
- approved Early/Mid/Late shipment bands, tier cadence bands and broker price envelopes;
- deterministic per-corporation offer generation from persisted expansion/world seed;
- brokered buyer rates constrained below equivalent direct-conglomerate quality-adjusted selling rates;
- contract quantities constrained by both approved resource bands and assigned buyer-ship capacity;
- one canonical `BuyerService` for offer entry, relationships, recurring obligations, partial/lateness/miss scoring, cancellation and termination;
- canonical fractional global reputation model with the ten approved bands and `-100..100` clamping;
- lowest-acceptable-quality-first explicit buyer transfer through `InventoryService.removeWeighted()`;
- buyer collection ships integrated into canonical Spaceport berth accounting;
- runtime save schema v12 with buyer/reputation normalization and save-roundtrip coverage.

---

## Milestone 2 — Approved mockup alignment

Status: **Complete**

Mockup-alignment checkpoint: `13216c860795853f441b95cb08d2acc2c0d5f470`

Confirmed/implemented:

- full-screen portrait-first catalogue with eight compact filters/sort controls and eight compact columns;
- all 1,000 offers remain visible unless filtered, including reputation-locked offers;
- CONTACT / VIEW profile is a centred approximately half-height presentation with portrait, company, ship, contract terms, relationship details and history;
- collection is a non-dismissible full-screen paused event with large ship art, buyer identity, berth/orbit state, fulfilment bands, projected outcome and explicit wait/transfer/final-miss actions;
- production contains none of the mockups' scenario-test controls;
- missing buyer/ship art falls back safely and does not block the workflow.

Gameplay mismatch found by comparing the implementation to the approved collection mockup:

- the `+1` on-time buyer-happiness bonus applies only to a **full** on-time shipment;
- an on-time partial receives only its partial penalty.

Protected results:

- 100% on time: `+1`;
- 80% on time: `-1`;
- 60% on time: `-2`;
- 80% at +10 days: `-3`.

---

## Milestone 3 — Runtime/event integration and production UI

Status: **Complete**

Primary runtime/UI commit: `a31e08642f78719210d8e5609b784bae47690c17`

Implemented:

- `BuyerService` instantiated in the canonical `MineITApp` composition root;
- Due / Due+5 / Due+10 / Due+15 collection attempts processed for active and background colonies;
- buyer collections use the existing corporation-wide pending-event pause, colony-switch and save-recovery model;
- unresolved buyer collection obligations recover after reload instead of escaping the event queue;
- buyer vessels use canonical Spaceport berth/orbital-holding rules and cannot transfer while waiting in orbit;
- Player Colony Ship exposes **BUYERS SERVICE** alongside existing ship/colony actions;
- UI uses external production `views/` and a dedicated presentation controller while authoritative mutation remains in `BuyerService`;
- cancellation is blocked while the buyer ship is actively waiting;
- otherwise colony closure/relocation resolves buyer contracts through normal cancellation semantics instead of orphaning them;
- Corporate Ship exports award at most `+0.01` global reputation per visit even when sales are split;
- successful 10-year colony completion awards canonical `+0.10` global reputation;
- buyer penalties and colony-loss reputation changes use the fractional/clamped reputation owner;
- save v12 preserves offers, fractional reputation, active obligations, retry/orbit state, history and stable buyer/ship identity.

---

## Validation regression discovered and fixed

The full regression suite exposed a real interaction between the new fractional reputation award and the existing Corporate Ship capacity formula.

### Failure

The first export during a Corporate Ship visit correctly awarded `+0.01` reputation. However, import/export capacity was being recalculated directly from live reputation on every query, so the already-docked ship could gain extra capacity during the same visit. A nominal `100,000` export-capacity visit became `100,100` after its first sale.

### Canonical fix

`TradeService` now snapshots Corporate Ship import and export capacity when that ship arrives. Reputation changes during the visit affect **future visits**, never the physical capacity of the ship already docked.

Fix commit: `d38b1c6acf8dcc16587c007cbf96adfc5084bcbc`

The existing global-expansion behavioural regression was intentionally retained rather than weakened; it now protects this invariant.

---

## Save-v12 migration cleanup

The buyer state/reputation work intentionally moved runtime saves from v11 to v12. Several legacy regressions correctly exercised migration but still asserted the old final schema number. Those assertions were updated only where the underlying behaviour remained unchanged:

- Technology migration assertion: `18df8e649acf09e3c0e4a871430b56974df6bb1f`
- Survival migration assertion: `275f62d896a929b98c9e58a2d99a3becefcb7067`
- Industry migration assertion was already present at later branch head `31ea65be2b9213db12614404d10b0c885025ac03`
- Global expansion migration assertion: `3b531b30b17ed4adb5b77a08054c1a7b51685b27`
- ShipExpansion save assertion: `f75f1d455dc3b9084c5b872b77ffbdbdf1619b3a`

No gameplay/architecture guard was weakened to obtain a green run.

---

## Browser/mobile validation

Dedicated production browser probe:

`tests/buyer-mobile-layout-probe.html`

Probe commit: `c11ee7e033226f8b8107ab4aaf3deb4902b077be`  
Workflow integration commit: `25e67df8f8cae9bebc632000605284fd88b2c173`

The probe uses the real `BuyerUI`, `BuyerService`, production templates and production CSS. It verifies:

- catalogue opens and renders the 1,000-buyer commercial network;
- eight compact catalogue filter/sort controls remain present;
- catalogue stays within the supported viewport with no horizontal overflow;
- an eligible CONTACT action opens the approved profile;
- profile identity, company, ship and contract details are populated;
- ENTER CONTRACT creates the real buyer obligation through `BuyerService`;
- current relationship state appears after entry;
- 80% qualifying stock is seeded and a real docked collection state is opened;
- collection screen remains inside the viewport and contains buyer/ship presentation plus contract metrics;
- 80% qualifying stock enables an accepted transfer;
- the collection decision screen cannot be dismissed without resolving the event.

Validated viewport matrix:

- `360×640`
- `375×667`
- `390×844`
- `412×915`
- `915×412` landscape

Existing ownership tests also retain the coarse-pointer `44px` buyer decision/action rules.

---

## Progression impact

This completes the **Conglomerate Buyers Service** subfeature within Progression Stage 8 and adds a meaningful intermediate solution to the logistics bottleneck:

**Production Rate → Corporate Export Capacity → Brokered Buyer Collection Capacity / Reliability → future Player Freight Capacity**

Progression Stage 8 itself remains **In Progress**. The buyer service deliberately does not implement player-designed freight ships, scalable player-owned ore transport, freight routing or the wider logistics network required to finish that stage.

The brokered buyers also remain conglomerate-controlled commercial relationships. They do not prematurely implement later independent/direct-buyer progression.

---

## Exact next step

The Conglomerate Buyers Service implementation is ready for review/PR when explicitly authorised.

Until then:

- keep `feature/conglomerate-buyers-service` separate from `develop`;
- do not create or merge a PR without user authorisation;
- any further Stage 8 work should build on the validated buyer/Spaceport/reputation owners rather than creating parallel systems.
