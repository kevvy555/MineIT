# Ship Buying / Fleet Procurement Recovery

Status: **Stage 8 factory-new ship procurement and minimum fleet operation implemented on `feature/ship-buying`.**  
Completed target version: **5.13.11**  
Date: **2026-08-31**

The detailed implementation record is:

`docs/Progression Stages/Stage 8/Ship buying feature/ShipBuyingImplementationStatus.md`

Use that file together with:

- `ShipBuyingFeatureSpec.md`
- `ShipBuyingUiSpecification.md`
- `ShipOperationalUseSpecification.md`
- `ConglomerateProcurementUiLanguage.md`
- `ShipBuyingMock.html`

## Canonical Owners

- `ExpansionService` — player fleet operation and travel.
- `ShipMarketService` — quote/order/cancellation/delivery economics.
- `UniverseShipCatalogue` — read-only canonical ship data and fallback.
- `SpaceportModel` — berth occupancy.
- `SimulationEngine` — daily fleet/order progression.
- `ship-preparation-ui.js` — active UI/controller surface only.

Do not create a second ship/fleet/procurement system.

## Canonical Universe Dependency

Universe repository: `kevvy555/MineIT-Universe`  
Branch: `feature/ship-procurement-catalogue`  
Commit: `90710802630354b2e05e68ed4921b01b0d80000e`  
Schema/content: **6 / 0.6.0**

MineIT has a bundled known-good snapshot from that canonical data and performs a non-blocking remote refresh when a compatible published Universe manifest is available.

## Important Preserved Rules

- fleet state is `state.company.expansion.ships[]` + `activeShipId`;
- procurement orders are company-global persisted state;
- 35% Deep Reach charter procurement discount is MineIT balance data;
- currency UI is lowercase `cc`;
- crew and colonist passengers are separate;
- class-specific capacity, speed and fuel use replace starter-only UI assumptions;
- full destination Spaceport => orbital holding;
- orbital holding consumes no transit food/interstellar fuel in this release;
- orbital ships auto-dock when a berth becomes free;
- travelling/orbiting ships may reroute when remaining route supplies are sufficient;
- individual ship loss is not automatic company game-over;
- purchased ships arrive empty of player-usable cargo/fuel/food and without assigned crew/passengers.

## Verification Checkpoint

Before the final documentation/version bump, full GitHub Actions was green at MineIT commit:

`5047a514d9245940436b1f077db41834b9949d2d`

Workflow run:

`33425943717`

Both the unit/regression/domain stage and browser startup/presentation interaction stage passed.

After any continuation, rerun the same complete workflow before declaring the branch complete.
