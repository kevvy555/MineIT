# Conglomerate Buyers Service — Recovery Plan

Branch: `feature/conglomerate-buyers-service`  
Base: latest `develop` at branch creation: `eb0977dc0069bcd5cb1eba1d5a08c2183b066d2e`

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

The two approved UI mockups were added to this feature branch after Milestone 1 began and are now authoritative together with the gameplay specification. Existing correct domain work is retained; implementation is adjusted only where the mockups expose a genuine mismatch.

---

## Milestone 1 — Buyer domain/state foundation

Status: **Complete**

Implementation commit: `6bbb1115213995322e3e2622011d95147c6874aa`

Complete:

- fixed 1,000-buyer commercial identity catalogue derived only from the approved directory seed `8302026`;
- stable contact/company/named-ship pairings and all 30 approved collection-ship classes/capacities;
- approved per-resource Early/Mid/Late shipment bands, tier cadence bands and broker price envelopes;
- deterministic per-corporation offer generation from the persisted expansion/world seed;
- buyer rates constrained below the equivalent direct conglomerate quality-adjusted selling rate;
- contract quantities constrained by both the approved resource band and assigned ship capacity;
- one canonical `BuyerService` for offer entry, buyer relationship state, recurring collection obligations, partial/lateness/miss scoring, cancellation and termination;
- canonical fractional reputation service with the ten approved named bands and -100..100 clamping;
- `InventoryService.removeWeighted()` for lowest-acceptable-quality-first explicit buyer transfer;
- buyer collection ships participate in canonical Spaceport berth occupancy;
- runtime save schema bumped to v12 with buyer/reputation normalization entry point;
- initial buyer regression added to the normal `npm test` chain covering catalogue size/uniqueness, deterministic offers, price/range/capacity invariants, reputation bands/clamping, eligibility/one-active-offer rules and quality-band removal.

---

## Approved mockup alignment checkpoint

Status: **Complete**

Current implementation commit: `13216c860795853f441b95cb08d2acc2c0d5f470`

Complete:

- feature branch synced through the two user-added approved mockups (`ff25222`, `9ccb8c1`);
- confirmed the mockups preserve the written gameplay model rather than redesigning it;
- confirmed catalogue UI target: portrait full-screen service, eight compact columns, compact filter/sort controls, no horizontal scrolling;
- confirmed buyer profile target: centred approximately half-height modal with portrait/action left and scrollable identity/ship/contract/relationship details right;
- confirmed collection target: non-dismissible full-screen paused event, large ship hero art, buyer identity, berth/orbit state, fulfilment bands, projected payment/happiness/global reputation/remaining stock and explicit wait/transfer actions;
- corrected the one gameplay mismatch exposed by the collection mockup: the +1 on-time happiness bonus applies to a **full** on-time shipment only; an on-time partial receives only its -1 or -2 partial penalty;
- added regression assertions for full on-time, 80% on-time, 60% on-time and 80% at +10 days.

Still remaining:

- instantiate/process `BuyerService` in the live app/runtime;
- extend the corporation-wide pending-event queue with buyer collection events and recovery;
- process Due / Due+5 / Due+10 / Due+15 across active and background colonies;
- route Corporate Ship export-visit reputation, 10-year colony success reputation and existing reputation penalties through the canonical fractional owner;
- save/reload regression for active buyer obligations and fractional reputation;
- buyer catalogue/profile/collection production UI and colony/ship-panel entry point matching the approved mockups;
- browser/coarse-pointer/mobile viewport probes;
- progression/recovery final documentation and full regression validation.

Exact next step:

**Wire `BuyerService` into `MineITApp` and `CorporateEventService`, migrate existing `company.rep` award/penalty paths to the canonical fractional reputation service, then add resolvable buyer collection events before exposing the production buyer UI.**

No PR or merge to `develop` is authorised yet.
