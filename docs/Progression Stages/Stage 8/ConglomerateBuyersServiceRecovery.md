# Conglomerate Buyers Service — Recovery Plan

Branch: `feature/conglomerate-buyers-service`  
Base: latest `develop` at branch creation: `eb0977dc0069bcd5cb1eba1d5a08c2183b066d2e`

Authoritative gameplay design:

- `ConglomerateBuyersService.md`
- `BuyerContentGeneration.md`
- `BuyerAndShipImageDirectory.html`
- `EngineeringShipAndSpaceport.md`
- `TechnologyModel.md`
- `docs/PLAYER_PROGRESSION_STAGES.md`
- `docs/SHIP_EXPANSION_GAMEPLAY_RECOVERY.md`

The two approved mockup filenames named for this implementation were not present on the latest `develop` tree when work began:

- `ConglomerateBuyersServiceMockup.html`
- `BuyerCollectionShipMockup.html`

This is not blocking domain/state implementation. UI work must preserve the approved written mobile layout contract and must not redesign gameplay.

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

Still remaining:

- instantiate/process `BuyerService` in the live app/runtime;
- extend the corporation-wide pending-event queue with buyer collection events and recovery;
- process Due / Due+5 / Due+10 / Due+15 across active and background colonies;
- route Corporate Ship export-visit reputation, 10-year colony success reputation and existing reputation penalties through the canonical fractional owner;
- save/reload regression for active buyer obligations and fractional reputation;
- buyer catalogue/profile/collection mobile UI and colony/ship-panel entry point;
- browser/coarse-pointer/mobile viewport probes;
- progression/recovery final documentation and full regression validation.

Exact next step:

**Wire `BuyerService` into `MineITApp` and `CorporateEventService`, then migrate all existing `company.rep` award/penalty paths to the canonical fractional reputation service before adding the buyer UI.**

No PR or merge to `develop` is authorised yet.
