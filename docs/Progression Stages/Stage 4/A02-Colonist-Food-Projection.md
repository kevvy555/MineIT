# A02 — Colonist Food Projection

**Progression stage:** 4 — Production Expansion  
**Type:** Bug fix  
**Status:** Complete

## Original backlog text

> [BUG] Projected food usage doesn't seem to reflect reality when onboarding new colonists from the corporate ship. It can say there is enough and then when the colonists are bought it goes to red and minus.

## Purpose

Give the player an accurate view of the Food consequences of accepting new colonists before the transfer is confirmed. The forecast and the live simulation must not disagree.

“Colonist-order interface” means whichever current or future interface allows the player to select and confirm colonists being transported from the conglomerate ship. It does not require the separate Conglomerate Access terminal feature to be implemented first.

## Approved behaviour

- The preview calculates the colony state after all currently selected colonists transfer ashore.
- The preview and live colony simulation use the same authoritative Food-consumption calculation.
- It displays:
  - operational Food production per day;
  - post-transfer Food consumption per day;
  - post-transfer daily surplus or deficit;
  - estimated days until stored colony Food is exhausted.
- Only production that is currently completed, powered, staffed and otherwise operational counts toward the safe forecast.
- Planned, under-construction, unpowered, unstaffed or blocked production may be shown separately, but it must not make the forecast appear safe.
- Incoming colonists start consuming colony Food only when they physically transfer ashore. The conglomerate transport supplies them until that point.
- A negative daily Food balance is displayed in red even when the colony has a large stockpile. The days-remaining value communicates urgency.
- The player may confirm an order with a negative forecast. The visible forecast is sufficient; no additional warning popup is shown.
- Unapproved Food aboard a landed player ship is kept separate and does not make the colony forecast appear sustainable.
- If emergency use of landed-ship Food is already authorised and active, it may be shown as a separately identified emergency supply rather than ordinary colony production.

## Calculation boundary

The forecast is a read-only projection over the same domain calculation used by the simulation. The UI must not recreate calorie or Food rules independently.

At minimum, the calculation receives:

- current colony Food stock;
- currently operational daily production;
- current population;
- selected incoming population;
- authoritative per-colonist consumption;
- any currently active emergency ship-Food authorisation.

## Acceptance criteria

1. Selecting colonists updates the projected consumption before confirmation.
2. Confirming the transfer produces the same daily balance that was previewed, provided no other simulation input changed.
3. Inactive Food buildings never contribute to the safe forecast.
4. A negative balance is red before and after confirmation.
5. The displayed days remaining is derived from colony stock and the projected net deficit.
6. The player can proceed despite a deficit without a second warning.
7. Regression coverage reproduces the original mismatch and proves the preview and simulation use the same result.

## Implementation

- The colonist-order preview and live simulation now use the same `ColonyService` Food forecast.
- The preview separates operational production, post-transfer consumption, daily balance, stored-Food duration and authorised emergency ship supplies.
- Inactive production does not make the transfer appear safe, and a deficit remains visible without blocking the order.
- Behavioural regression coverage is provided by `tests/priority-colony-bug-fixes.test.js`.
