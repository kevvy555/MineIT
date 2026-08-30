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

The two approved UI mockups were added to this feature branch after Milestone 1 began and are authoritative together with the gameplay specification. Existing correct domain work is retained; implementation is adjusted only where the mockups expose a genuine mismatch.

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

Implementation commit: `13216c860795853f441b95cb08d2acc2c0d5f470`

Complete:

- feature branch synced through the two user-added approved mockups (`ff25222`, `9ccb8c1`);
- confirmed the mockups preserve the written gameplay model rather than redesigning it;
- confirmed catalogue UI target: portrait full-screen service, eight compact columns, compact filter/sort controls, no horizontal scrolling;
- confirmed buyer profile target: centred approximately half-height modal with portrait/action left and scrollable identity/ship/contract/relationship details right;
- confirmed collection target: non-dismissible full-screen paused event, large ship hero art, buyer identity, berth/orbit state, fulfilment bands, projected payment/happiness/global reputation/remaining stock and explicit wait/transfer actions;
- corrected the one gameplay mismatch exposed by the collection mockup: the +1 on-time happiness bonus applies to a **full** on-time shipment only; an on-time partial receives only its -1 or -2 partial penalty;
- added regression assertions for full on-time, 80% on-time, 60% on-time and 80% at +10 days.

---

## Milestone 2 — Runtime, event queue and production UI

Status: **Implementation complete; validation in progress**

Implementation commit: `a31e08642f78719210d8e5609b784bae47690c17`

Complete:

- `BuyerService` is instantiated in the canonical `MineITApp` composition root and persisted buyer state is ensured on startup/reset;
- Due / Due+5 / Due+10 / Due+15 buyer collection attempts are processed for active and background colonies;
- buyer collections use the existing corporation-wide pending-event pause, colony-switch and recovery model;
- recovered saves restore unresolved buyer collection obligations rather than escaping them;
- buyer collection ships continue to use the canonical Spaceport berth model, including orbital holding and transfer blocking when no berth is free;
- Player Colony Ship now exposes **BUYERS SERVICE** alongside Spaceport, Technology, Star Map, cargo and colony-management actions;
- production catalogue is full-screen portrait-first with the approved eight compact filters and eight columns, while all 1,000 offers remain visible unless filtered;
- CONTACT / VIEW uses the approved centred approximately half-height profile with portrait fallback, buyer/company/ship identity, locked terms, relationship statistics, delivery history and cancellation;
- production collection event is full-screen and non-dismissible, uses buyer/ship art with fallbacks, shows berth/orbit state, fulfilment bands and projected payment/happiness/reputation/stock, and exposes wait/transfer/final-miss decisions;
- no mockup-only scenario controls are included in production;
- Corporate Ship export reputation is +0.01 maximum per visit even when sales are split across rows/bands;
- successful 10-year colony completion now awards the canonical +0.10 rather than legacy Bronze/Silver/Gold/Platinum integer reputation awards;
- colony-loss reputation uses the canonical fractional/clamped reputation owner and can fall below zero;
- closing/relocating a colony is blocked while its buyer ship is actively waiting; otherwise its buyer contracts are ended through normal player-cancellation semantics rather than orphaned;
- v12 buyer save regression covers persisted offers, fractional reputation, active obligation, retry/orbital state, history, portrait/ship assignment and pending buyer attention;
- domain regression covers deterministic offers, pricing/capacity, quality removal, fulfilment, lateness, misses, Red termination, cancellation/cooldown, berth blocking and Corporate Ship export independence;
- presentation ownership/CSS/lifecycle guards were extended for the new buyer controller/views.

Still remaining:

- run/fix the full unit/regression/domain suite at the exact feature head;
- add and run real Chrome mobile-browser probes for 360×640, 375×667, 390×844, 412×915 and landscape coverage of catalogue/profile/collection presentation;
- confirm coarse-pointer 44px decision controls and zero horizontal catalogue overflow in browser layout;
- update `docs/PLAYER_PROGRESSION_STAGES.md` and `docs/SHIP_EXPANSION_GAMEPLAY_RECOVERY.md` with the validated Stage 8 buyer-service state;
- final recovery checkpoint with passing workflow run/job IDs and exact next step.

Exact next step:

**Run the branch CI against `a31e086`, repair any unit/architecture failures, then add the dedicated buyer mobile-browser probe and workflow coverage before final documentation.**

No PR or merge to `develop` is authorised yet.
