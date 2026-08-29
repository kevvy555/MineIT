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

**AVAILABLE → ORDERED / SAME-DAY BATCH → 5-DAY PREPARATION → ENGINEERING SHIP DISPATCHED → IN TRANSIT → ORBITAL HOLDING OR LANDED → COMMISSIONING → ACTIVE → ENGINEERING SHIP DEPARTS**

## Available

The next sequential capability level is available to order.

## Ordered / same-day batch

The player orders an upgrade and pays its package cost plus the deployment's fixed Engineering Ship transport charge.

Any additional technology upgrades ordered for the **same colony during the same game day** are added to the same Engineering Deployment Order.

Because those additional upgrades use the already-booked Engineering Ship, they add only their individual upgrade-package price and do not add another transport charge.

The order remains cancellable before launch.

## Five-day preparation

After the order day closes, the conglomerate requires **5 full game days** to assemble the equipment, allocate the specialists, prepare the Engineering Ship and complete pre-flight checks.

During this preparation period:

- the deployment status is `Preparing`;
- the Engineering Ship has not launched;
- the order may still be cancelled under the pre-launch cancellation rule;
- the target colony does not gain any capability from the ordered upgrades;
- additional upgrades ordered on later game days do not join this deployment and create a separate deployment order.

The 5-day period is fixed for the current feature. Travel time begins only after preparation is complete and the Engineering Ship launches.

## Dispatch

At the end of the fifth preparation day, the conglomerate automatically dispatches one Engineering Ship carrying every upgrade in that deployment batch.

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

# 3. Engineering Deployment Pricing

Every Engineering Deployment has two distinct cost components.

## Fixed Engineering Ship transport price

Each dispatched Engineering Ship has **one fixed transport/deployment price**.

This represents:

- ship mobilisation;
- crew costs;
- specialist transport;
- fuel and flight operations;
- loading and ground-support preparation;
- engineering deployment administration.

The fixed transport price is charged **once per Engineering Deployment Order**, regardless of whether that ship carries one upgrade or several upgrades batched together on the same game day.

The exact monetary value is a balance constant and may be tuned without changing the gameplay rule.

## Individual upgrade-package prices

Every requested capability upgrade also has its own individual package price.

This represents the actual specialist equipment, tooling, systems and commissioning requirements associated with that upgrade.

Therefore:

**Deployment Total = Fixed Engineering Ship Transport Price + Sum of Upgrade Package Prices**

Example structure:

- Engineering Ship transport: £X
- Mining L4 package: £Y
- Scanning L4 package: £Z
- Total: £X + £Y + £Z

If Mining L4 and Scanning L4 were ordered on separate game days, two separate deployments would be created and the fixed Engineering Ship transport price would be paid twice.

This replaces the earlier generic percentage-based multi-upgrade discount idea. The saving from batching is now concrete and understandable: **the player pays for only one Engineering Ship instead of several**.

---

# 4. Same-Day Upgrade Batching

Technology purchasing should reward planning without making the player micromanage dispatches.

Rules:

- the first upgrade ordered on a game day creates an Engineering Deployment Order for that colony;
- further upgrades ordered for the same colony before the end of that game day join that order;
- only one Engineering Ship transport charge is applied to the deployment;
- additional same-day upgrades add only their individual package price;
- only one Engineering Ship is dispatched for the batch;
- all upgrades in the batch arrive together;
- all upgrades in the batch are commissioned during the same visit;
- after the order day ends the batch is closed and enters its fixed 5-day preparation period;
- upgrades ordered on later days create new Engineering Deployment Orders;
- the player does not need a separate Dispatch button.

The UI should make the saving visible, for example:

- Upgrade package subtotal
- Engineering Ship transport
- Shared-transport saving compared with separate deployments
- Final order total

This creates a useful decision: order an upgrade immediately, or combine several upgrades on the same day so they share the transport cost.

---

# 5. Cancellation

Cancellation is deliberately simple.

## Before launch

The player may cancel an Engineering Deployment Order at any point before its Engineering Ship launches, including during the fixed 5-day preparation period.

The cancellation cost/refund rule is deliberately a simple initial cancellation cost and should be represented by a single balance constant.

This is the **only cancellation window**.

## After launch

Once the Engineering Ship has dispatched:

- the order cannot be cancelled;
- the ship continues to its assigned colony;
- the upgrades remain committed.

No mid-flight cancellation system is required.

---

# 6. Spaceport Foundation

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

# 7. Spaceport Upgrades

The conglomerate provides the initial/basic Spaceport only.

Further Spaceport development follows the same principle as other colony infrastructure:

- the player supplies locally mined construction resources;
- the player upgrades the Spaceport through normal colony development;
- higher Spaceport levels eventually provide greater ship-handling capability.

Exact berth numbers, ship-size classes and capacity progression are **deliberately deferred** until the wider player-built freight/cargo ship system is designed.

Do not hard-code future assumptions that all ships use identical capacity.

The state/domain model should be designed so later work can support different ship sizes or berth requirements without replacing the Spaceport system.

---

# 8. Spaceport Berths

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

# 9. Orbital Holding

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

# 10. Engineering Specialists

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

# 11. Colonies Outside Corporate Ship Range

Remote colonies remain eligible for technology advancement.

The normal Corporate Ship service radius controls ordinary corporate trade/support visits, but it does **not** prevent Engineering Ship deployments.

When an upgrade is ordered for a remote colony:

1. the order is batched in the normal way;
2. the deployment spends 5 days preparing at the conglomerate;
3. the conglomerate dispatches an Engineering Ship;
4. the ship travels the greater distance;
5. it enters Orbital Holding if necessary;
6. it lands at the colony Spaceport;
7. it commissions the upgrades;
8. the capabilities become active;
9. the Engineering Ship departs.

Greater distance creates **time pressure only** for the current feature. The Engineering Ship transport price remains fixed regardless of destination distance unless later balancing explicitly changes that rule.

This avoids technology progression becoming impossible merely because expansion has moved beyond the Corporate Ship service radius.

---

# 12. Capability Scope

For this implementation, a technology upgrade is requested for a specific colony and must physically be commissioned there.

This refines the earlier company-wide-only concept in `TechnologyModel.md`.

The conglomerate owns the underlying technology library, but each colony needs the physical specialist equipment and commissioning required to operate that capability locally.

The long-term model can therefore distinguish:

- **Corporate technology access** — what the conglomerate is willing/able to provide to the player's operation;
- **Colony deployed capability** — what has actually been delivered and commissioned at that colony.

The exact persistence/schema for company access versus colony deployment should be finalised during implementation, but the gameplay rule is now clear: **remote colonies do not gain physical capability instantly because another colony received equipment**.

This gives the logistics system meaningful physical consequences and supports later independence gameplay.

---

# 13. Relationship to the Normal Corporate Ship

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

# 14. UI / Player Information Requirements

The player should be able to see the status of each Engineering Deployment Order.

Useful states include:

- Ordered / same-day batch
- Preparing — day N of 5
- Dispatched
- In Transit
- Orbital Holding — waiting for Spaceport berth
- Landed
- Commissioning
- Complete

Before launch, the order view should also show:

- all included upgrades;
- upgrade-package subtotal;
- fixed Engineering Ship transport price;
- shared-transport saving compared with separate deployments;
- final total;
- expected dispatch date;
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

# 15. Deferred Decisions

The following are intentionally **not locked yet**:

- exact Spaceport berth counts by level;
- Small/Medium/Heavy or other berth-size classes;
- exact Engineering Ship travel-speed formula;
- exact commissioning durations;
- exact monetary value of the fixed Engineering Ship transport price;
- exact pre-launch cancellation fee/refund;
- whether independent companies later build/own their own engineering vessels;
- commercial waiting/congestion fees for future third-party ships.

These should be resolved when the relevant logistics, balancing and ship-design systems are developed.

---

# 16. Implementation Rules to Preserve

When this feature is implemented:

1. Technology upgrades must no longer activate immediately on purchase.
2. Technology delivery must not depend on ordinary Corporate Ship visits.
3. Same-colony upgrades ordered on the same game day must batch into one Engineering Deployment Order.
4. Every Engineering Deployment must charge exactly one fixed Engineering Ship transport price plus the price of each included upgrade package.
5. The batching saving comes from sharing one Engineering Ship transport charge; do not apply a generic percentage discount to the upgrade packages.
6. After the order day closes, every deployment must spend exactly 5 full game days preparing before launch.
7. The Engineering Ship must be conglomerate-owned and autonomously dispatched.
8. The ship must physically travel to the target colony.
9. A Spaceport berth must be available before commissioning can begin.
10. Full Spaceports must cause Orbital Holding, not failed delivery.
11. The normal Corporate Ship consumes a Spaceport berth when landed.
12. Engineering specialists remain ship-based and consume no colony Housing/population/passenger space.
13. Pre-launch cancellation is supported throughout preparation; post-launch cancellation is not.
14. A Basic Spaceport is part of the conglomerate-funded colony startup package.
15. Spaceport upgrades after the basic level are player-developed infrastructure.
16. Exact Spaceport capacity/ship-size rules remain deferred until the wider freight-ship design is established.
17. Remote colonies outside normal Corporate Ship range remain valid Engineering Ship destinations.
18. Engineering Ship transport price is fixed for the current feature rather than distance-based.
19. Save/load and regression coverage must preserve every lifecycle state, including Preparing, Orbital Holding and pending same-day batches.
