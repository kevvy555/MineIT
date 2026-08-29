# Stage 8 — Engineering Ship and Spaceport Support Model

## Purpose

This document defines how conglomerate technology upgrades are physically delivered to colonies and establishes the first shared Spaceport model required by future freight, cargo and support ships.

This design is an addendum to `TechnologyModel.md` and **supersedes the parts of that document that describe technology upgrades arriving on the ordinary Corporate Ship**.

The ordinary Corporate Ship remains a trade/support vessel. Technology upgrades are instead delivered by dedicated conglomerate-owned Engineering Ships.

---

# 1. Core Decision

Technology upgrades represent real specialist equipment, tooling and commissioning support owned/provided by the conglomerate.

When the player orders one or more capability upgrades, the conglomerate dispatches a **dedicated Engineering Ship** to the target colony.

The Engineering Ship:

- is owned and controlled by the conglomerate;
- is separate from the normal Corporate Ship;
- carries all specialist equipment required for the ordered upgrades;
- carries the engineering and technical specialists required to commission them;
- can travel to colonies outside the normal Corporate Ship service radius;
- lands at the colony Spaceport;
- remains at the colony while the ordered upgrades are commissioned;
- departs automatically after commissioning is complete.

The player does not manually route, crew or load Engineering Ships.

---

# 2. Technology Upgrade Lifecycle

The revised lifecycle is:

**AVAILABLE → ORDERED / SAME-DAY BATCH → ENGINEERING SHIP DISPATCHED → IN TRANSIT → ORBITAL HOLDING OR LANDED → COMMISSIONING → ACTIVE → ENGINEERING SHIP DEPARTS**

## Available

The next sequential capability level is available to order.

## Ordered / same-day batch

The player orders an upgrade and pays its package cost.

Any additional technology upgrades ordered for the **same colony during the same game day** are added to the same Engineering Deployment Order.

The order remains cancellable until launch.

## Dispatch

At the end of the game day, the order is closed and the conglomerate dispatches one Engineering Ship carrying every upgrade in that day's batch.

Once the ship has launched, the order can no longer be cancelled.

## Transit

The Engineering Ship travels physically to the colony.

Distance affects arrival time. Engineering Ships are not limited by the ordinary Corporate Ship service radius.

## Arrival

If a Spaceport berth is available, the Engineering Ship lands.

If no berth is available, the ship enters **Orbital Holding** and waits until a berth becomes free.

The ship must never fail, disappear or return home solely because the Spaceport is full.

## Commissioning

Once landed, the specialists commission every upgrade included in the Engineering Deployment Order.

The specialists remain based aboard the Engineering Ship while working. They therefore consume:

- no colony housing;
- no colony passenger capacity;
- no permanent colony population slots.

Commissioning duration can be balanced during implementation. The important rule is that the upgrade is not active merely because the player paid for it or because the ship reached orbit; the required Engineering Ship must be landed and commissioning must complete.

## Active

When commissioning completes, all upgrades in the deployment become active together and the Engineering Ship automatically departs.

---

# 3. Same-Day Upgrade Batching

Technology purchasing should reward planning without making the player micromanage dispatches.

Rules:

- the first upgrade ordered on a game day creates an Engineering Deployment Order for that colony;
- further upgrades ordered for the same colony before the end of that game day join that order;
- only one Engineering Ship is dispatched for the batch;
- all upgrades in the batch arrive together;
- all upgrades in the batch are commissioned during the same visit;
- the batch launches automatically at the end of the game day;
- the player does not need a separate Dispatch button.

## Multi-upgrade discount

A same-day batch receives a discount because only one Engineering Ship mobilisation, crew deployment and transport operation is required.

The discount represents reduced **deployment/logistics cost**, not cheaper technology or intellectual property.

Exact discount values are intentionally deferred to balancing.

The UI should make the saving visible, for example:

- Upgrade package subtotal
- Engineering deployment cost
- Multi-upgrade deployment saving
- Final order total

This should create a useful decision: order an upgrade immediately, or combine several upgrades on the same day to reduce deployment cost.

---

# 4. Cancellation

Cancellation is deliberately simple.

## Before launch

The player may cancel an Engineering Deployment Order while it is still preparing during the order day.

The cancellation cost/refund rules can be balanced during implementation, but this is the **only cancellation window**.

## After launch

Once the Engineering Ship has dispatched:

- the order cannot be cancelled;
- the ship continues to its assigned colony;
- the upgrades remain committed.

No mid-flight cancellation system is required.

---

# 5. Spaceport Foundation

The current concept of the player's colony ship occupying a special landing tile should evolve into a persistent **Spaceport**.

The Spaceport becomes the common physical arrival/departure point for colony ships and support vessels.

It is foundational infrastructure for Stage 8 because later systems will need multiple different ships to visit the same colony.

## Initial corporate provision

When the conglomerate establishes a colony, it provides the equipment required for a **Basic Spaceport** as part of the corporate startup package.

This support includes the specialist off-world systems that are not represented by locally mined Build/Ore, such as:

- landing guidance and control;
- navigation beacon equipment;
- communications and approach systems;
- basic landing-pad systems;
- ground-support equipment;
- cargo/passenger handling interfaces;
- basic refuelling/service connections.

The player still owns their original colony ship. The conglomerate provides the Basic Spaceport capability used by that ship and future visiting vessels.

The Basic Spaceport is therefore another concrete item supplied free to a conglomerate-backed operation.

---

# 6. Spaceport Upgrades

The conglomerate provides the initial/basic Spaceport only.

Further Spaceport development follows the same principle as other colony infrastructure:

- the player supplies locally mined construction resources;
- the player upgrades the Spaceport through normal colony development;
- higher Spaceport levels eventually provide greater ship-handling capability.

Exact berth numbers, ship-size classes and capacity progression are **deliberately deferred** until the wider player-built freight/cargo ship system is designed.

Do not hard-code future assumptions that all ships use identical capacity.

The state/domain model should be designed so later work can support different ship sizes or berth requirements without replacing the Spaceport system.

---

# 7. Spaceport Berths

Every landed ship consumes a Spaceport berth/ship slot.

This includes:

- the player's colony ship;
- the ordinary Corporate Ship;
- Engineering Ships;
- future player cargo/freight ships;
- future conglomerate or third-party support ships.

The Corporate Ship explicitly **does consume a berth** while landed.

A ship that cannot obtain a berth enters Orbital Holding rather than failing its visit.

The exact number and type of berths at each Spaceport level are deferred to the later logistics/ship-capacity design.

---

# 8. Orbital Holding

Orbital Holding is the standard state for any arriving ship that cannot currently land.

Rules:

- the ship remains associated with the destination colony;
- it waits in orbit until a compatible berth becomes available;
- it lands automatically when the required berth becomes free;
- Engineering Ship commissioning does not begin while the vessel is in orbit;
- the player can see which ships are waiting and why;
- the visit is not cancelled because of temporary Spaceport congestion.

This same mechanism should later be reused by cargo ships and other visiting vessels so ship congestion has one canonical behaviour.

Potential waiting fees or congestion costs for commercial third-party vessels are future balancing options and are **not part of this initial feature**.

---

# 9. Engineering Specialists

Engineering specialists are temporary conglomerate personnel assigned to the Engineering Ship.

They are not imported colonists.

Therefore they:

- do not increase colony population;
- do not consume Housing;
- do not consume normal passenger capacity;
- do not require permanent workforce jobs;
- remain aboard their Engineering Ship for accommodation/life support;
- leave with the Engineering Ship when commissioning is complete.

This keeps the technology-delivery system physical without creating unnecessary permanent population-management overhead.

---

# 10. Colonies Outside Corporate Ship Range

Remote colonies remain eligible for technology advancement.

The normal Corporate Ship service radius controls ordinary corporate trade/support visits, but it does **not** prevent Engineering Ship deployments.

When an upgrade is ordered for a remote colony:

1. the order is batched in the normal way;
2. the conglomerate dispatches an Engineering Ship;
3. the ship travels the greater distance;
4. it enters Orbital Holding if necessary;
5. it lands at the colony Spaceport;
6. it commissions the upgrades;
7. the capabilities become active;
8. the Engineering Ship departs.

Greater distance should primarily create **time pressure**. Whether it also increases deployment cost can be decided during balancing.

This avoids technology progression becoming impossible merely because expansion has moved beyond the Corporate Ship service radius.

---

# 11. Capability Scope

For this implementation, a technology upgrade is requested for a specific colony and must physically be commissioned there.

This refines the earlier company-wide-only concept in `TechnologyModel.md`.

The conglomerate owns the underlying technology library, but each colony needs the physical specialist equipment and commissioning required to operate that capability locally.

The long-term model can therefore distinguish:

- **Corporate technology access** — what the conglomerate is willing/able to provide to the player's operation;
- **Colony deployed capability** — what has actually been delivered and commissioned at that colony.

The exact persistence/schema for company access versus colony deployment should be finalised during implementation, but the gameplay rule is now clear: **remote colonies do not gain physical capability instantly because another colony received equipment**.

This gives the logistics system meaningful physical consequences and supports later independence gameplay.

---

# 12. Relationship to the Normal Corporate Ship

The ordinary Corporate Ship is no longer responsible for technology delivery.

Its roles remain things such as:

- buying/exporting resources;
- supplying purchased resources;
- colonist transfers;
- other normal corporate support functions.

It visits according to its existing service schedule and service-radius rules and consumes a Spaceport berth when landed.

Technology delivery belongs exclusively to the dedicated Engineering Ship system.

This separation prevents one generic Corporate Ship from unrealistically providing every possible corporate service.

---

# 13. UI / Player Information Requirements

The player should be able to see the status of each Engineering Deployment Order.

Useful states include:

- Preparing — dispatches end of day
- Dispatched
- In Transit
- Orbital Holding — waiting for Spaceport berth
- Landed
- Commissioning
- Complete

Before launch, the order view should also show:

- all included upgrades;
- package subtotal;
- deployment cost;
- same-day batching discount/saving;
- final total;
- Cancel Order action.

After launch, Cancel Order disappears/is disabled.

The Spaceport UI should eventually show:

- landed ships;
- occupied/free berths;
- ships in Orbital Holding;
- ship role/owner;
- current activity such as trading, commissioning or idle.

Exact mobile presentation belongs to implementation design.

---

# 14. Deferred Decisions

The following are intentionally **not locked yet**:

- exact Spaceport berth counts by level;
- Small/Medium/Heavy or other berth-size classes;
- exact Engineering Ship travel-speed formula;
- exact commissioning durations;
- exact multi-upgrade deployment discount;
- exact pre-launch cancellation fee/refund;
- whether extreme distance increases Engineering Ship deployment cost;
- whether independent companies later build/own their own engineering vessels;
- commercial waiting/congestion fees for future third-party ships.

These should be resolved when the relevant logistics and ship-design systems are developed.

---

# 15. Implementation Rules to Preserve

When this feature is implemented:

1. Technology upgrades must no longer activate immediately on purchase.
2. Technology delivery must not depend on ordinary Corporate Ship visits.
3. Same-colony upgrades ordered on the same game day must batch into one Engineering Deployment Order.
4. The Engineering Ship must be conglomerate-owned and autonomously dispatched.
5. The ship must physically travel to the target colony.
6. A Spaceport berth must be available before commissioning can begin.
7. Full Spaceports must cause Orbital Holding, not failed delivery.
8. The normal Corporate Ship consumes a Spaceport berth when landed.
9. Engineering specialists remain ship-based and consume no colony Housing/population/passenger space.
10. Pre-launch cancellation is supported; post-launch cancellation is not.
11. A Basic Spaceport is part of the conglomerate-funded colony startup package.
12. Spaceport upgrades after the basic level are player-developed infrastructure.
13. Exact Spaceport capacity/ship-size rules remain deferred until the wider freight-ship design is established.
14. Remote colonies outside normal Corporate Ship range remain valid Engineering Ship destinations.
15. Save/load and regression coverage must preserve every lifecycle state, including Orbital Holding and pending same-day batches.
