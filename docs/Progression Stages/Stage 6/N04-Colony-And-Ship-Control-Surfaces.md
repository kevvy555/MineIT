# N04 — Colony And Ship Control Surfaces

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Ready for Testing  
**Branch:** `feature/fleet-colony-ship-control`  
**Source:** Split from the multi-ship accessibility review and the Stage 6 ship/headquarters command design (**B03a**, **A08a**).

Mockups approved. Implementation ready for player testing (Fleet Manager list UI is owned by **B03a**).

## Original report

> Split colony management from ship management. If I am at a colony and a ship is docked, I can click that ship and decide what to do with it. If the ship is not docked, the star map lets me click any ship and open its control panel. There should be a ship-management UI listing all ships with a path into each ship’s controls. Early game a docked command ship also provides colony controls; later an Operational Headquarters provides colony controls and a docked non-command ship is ship-only.

## Purpose

Establish three UI surfaces with clear ownership:

1. **Colony Control** — run the active colony (and host the Koplin Deep Reach Corporation terminal entry)
2. **Ship Control** — run one selected ship, with an optional Colony Support Module link into Colony Control
3. **Fleet Manager / global Ships list (**B03a**)** — choose a ship, then open Ship Control

Spaceport is colony infrastructure (Colony Services), not a Ship Control tile.

## Domain command source (A08a alignment)

Authoritative command state already exists in `ColonyService.commandStatus(state)` / `headquartersNetwork(state)`:

```text
source = { type: "headquarters", id } | { type: "ship", id } | null
```

Rules for this feature:

- Prefer the domain `source` rather than inventing a parallel UI command flag.
- A ship **holds colony command** only when `source?.type === "ship"` and `source.id === ship.id`.
- Command-capable ships are those already recognised by `commandCapableShips(state)` (docked at the active colony, `commandCapable`, meeting minimum crew).
- When Primary Headquarters is operational, `source.type === "headquarters"` and docked ships do not expose an active Colony Support Module link.
- When Primary is offline after handover and a docked command-capable ship takes over, `source.type === "ship"` again. That ship’s Colony Support Module becomes linked and can open Colony Control. A08b still keeps the conglomerate network offline; emergency ship command does not restore network orders.
- `source === null` does not grant a Colony Support Module link. Colony map / Headquarters remain the colony entry points; A08b owns outage continuity and network lockouts.

## Approved behaviour

### Colony Control

Opened from Primary Headquarters (when HQ holds command), existing colony chrome, or a linked Colony Support Module on a commanding ship.

**Keeps live Headquarters adaptive content** (`adaptive-building-ui.js` for `kind === "headquarters"`):

- hero / status / badges (including PRIMARY / EXPANSION);
- outage / recovery alert from `headquartersContinuity`;
- **Overview:** Command Capacity, Staff, Power, Role;
- **Operations:** Network Source, Conglomerate Link, Total Capacity, Command Load, Command Efficiency (bonus • penalty), Outage Continuity, Effective Output;
- upgrade / requirements / **Set Primary** / Demolish / Close.

**Colony Services** (local colony tools only):

- Colony Summary
- Corporation (player company overview)
- Colonies
- Spaceport

**Koplin Deep Reach Corporation** (separate immersive terminal, not inline tiles):

- Colony Control shows a conglomerate port with preset username/password and a **CONNECT** button.
- CONNECT opens a separate Koplin Deep Reach Corporation OS panel (same visual language / menu wherever the player connects — Headquarters or authorised colony terminal).
- After authenticate, the OS directory offers:
  - Buyers Service
  - Technology
  - Fleet Procurement
  - Star Map (corporate survey / route directory)
- When A08b `networkAvailable === false`, CONNECT is blocked and the OS cannot open new conglomerate sessions; existing commitments remain governed by A08b domain rules.
- Individual Koplin services (Buyers, Fleet Procurement, Technology) retain their existing terminal immersion once opened from this directory.

### Ship Control

Always ship-scoped (`shipId` / `activeShipId`).

**Ship systems:**

- Cargo Bay (docked only)
- Accommodation
- Route / journey preview
- **Star Map** — the ship’s own navigation system (not the Koplin corporate directory)
- Fleet Manager (**B03a**) — in-panel only; no duplicate footer Fleet button
- Ship Status
- Launch / land / request landing as valid for state (footer primary action)

**Not on Ship Control:**

- Spaceport (colony infrastructure → Colony Services)
- Technology / Buyers / Fleet Procurement / corporate Star Map (Koplin OS)
- Colony Summary / Colonies / Corporation (Colony Services)

**Colony Support Module (CSM):**

- Presented as a hard-mounted aux-bay module beside ship systems.
- When the ship holds colony command (`source` is that ship), the module is **seated / linked** to the managed colony and **OPEN COLONY CONTROL** opens the same Colony Control surface.
- When Headquarters holds command, or the ship is travelling / unlinked, the module is **offline / unlinked** and cannot open Colony Control.
- The module is a link into Colony Control, not a second mixed tile grid.

### Fleet Manager

Corporation-wide ship list (**B03a**). Open Ship Controls selects the vessel and opens Ship Control only.

### Entry points

| Context | Opens |
|---|---|
| Docked ship that holds command (`source` is that ship) | Ship Control with **linked** Colony Support Module → Colony Control |
| Docked ship that does not hold command | Ship Control with offline CSM |
| Travelling / orbiting / arrived / home / lost ship | Ship Control; CSM unlinked |
| Primary Headquarters tile while HQ holds command | Colony Control (HQ cards + colony services + Koplin CONNECT) |
| Expansion (non-Primary) Headquarters tile | Building panel with Set Primary when eligible; full Colony Control remains Primary / command-source owned |
| Existing colony chrome | Colony Control |
| Spaceport local fleet row | Ship Control for that ship |
| Fleet Manager | Ship Control for that ship |
| Koplin CONNECT (from Colony Control) | Koplin Deep Reach Corporation OS → Buyers / Technology / Fleet Procurement / corporate Star Map |

### After Headquarters handover

- Colony Control is entered from HQ / colony chrome (and emergency CSM when `source.type === "ship"`).
- Ordinary docked ships are Ship Control only (CSM offline).
- Conglomerate-order lockouts remain A08b domain inside the Koplin OS / service screens.

## Proof mockups (implementation targets)

- [N04-Colony-Control-Mockup.html](./N04-Colony-Control-Mockup.html)
- [N04-Ship-Control-Mockup.html](./N04-Ship-Control-Mockup.html)
- Fleet list: [B03a-Fleet-Manager-Mockup.html](./B03a-Fleet-Manager-Mockup.html)

The former composed hub mockup was removed; composition is Ship Control + CSM link, not a third surface.

## Relationship to existing items

- **B03a** — global Ships list and path into Ship Control.
- **A08a / A08b** — Complete; command source, outage, network lockouts.
- **N03** — multi-ship selection/accessibility.
- **B03b** — later logistics-stage fleet automation.
- Live Buyers / Fleet Procurement / Technology UIs — opened from the shared Koplin OS directory; keep their existing immersion.

## Acceptance criteria

1. Ship Control never mutates colony command rules; Colony Control never mutates ship inventory or travel state except by dispatching to domain services.
2. Opening a non-commanding docked ship shows Ship Control with offline CSM and no colony service tiles.
3. Opening a commanding docked ship provides Ship Control plus a linked CSM that opens Colony Control.
4. When `commandStatus.source.type === "headquarters"`, Colony Control is reachable from Primary Headquarters (and colony chrome); docked ships are Ship Control only.
4b. When Primary is offline and `source.type === "ship"` after handover, CSM is linked again; Koplin CONNECT respects A08b `networkAvailable`.
4c. Colony Control includes live HQ overview/operations cards, Set Primary when eligible, Colony Services (Summary / Corporation / Colonies / Spaceport), and Koplin CONNECT — not the adaptive building panel alone.
4d. Koplin OS directory exposes Buyers, Technology, Fleet Procurement and corporate Star Map; Ship Control Star Map remains the vessel navigation system.
4e. Ship Control has no Spaceport tile and no duplicate footer Fleet Manager button.
5. Star-map (ship) and Fleet Manager entry points open Ship Control for the selected ship.
6. UI command checks read `ColonyService.commandStatus` (or thin domain helper) rather than duplicating Headquarters rules.
7. Mobile layout remains usable; async views reject stale ship/colony context.

## Review state

Updated to the approved Colony Control / Ship Control / Koplin OS / CSM design. Ready for final review before implementation.
