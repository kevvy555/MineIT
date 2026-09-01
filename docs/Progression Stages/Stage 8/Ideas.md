# Stage 8 — Logistics Bottleneck Ideas

This document captures the current options discussed for the **Logistics Bottleneck** progression stage.

## Current options

- **Conglomerate Buyers Service** — before the player has enough independent freight capacity, the conglomerate can broker recurring contracts with multiple outside buyers. Buyers request specific resources, minimum quality, fixed shipment quantities and regular collection intervals. Their own ships collect from the colony, providing additional export throughput beyond the normal Corporate Ship, but at worse unit prices because the conglomerate takes a cut. Buyer access, shipment scale and resource sophistication increase with global reputation. Detailed design: `ConglomerateBuyersService.md`.
- **Dedicated Freight Ships** — keep the colony establishment ship small and specialised, while introducing proper cargo/freight vessels for moving large resource volumes.
- **Player-Designed Ships** — let the player choose ship size and design, trading off cargo capacity, range, speed, Fuel use and cost.
- **Multiple Freight Ships** — logistics capacity scales by building a fleet rather than relying on one vessel.
- **Specialised Ship Roles** — different designs could favour bulk Ore, refined materials, long range, fast delivery or general cargo.
- **Automated Trade Routes** — once a route is established, ships can repeatedly move cargo between colonies, hubs and buyers without constant manual control.
- **Inter-Colony Transport** — remote colonies can move Ore or refined materials to other colonies rather than needing direct access to the Corporate Ship.
- **Central Logistics Hubs** — strategically placed planets, moons or space stations can act as regional freight centres.
- **Hub Warehousing** — logistics hubs can store large quantities of Ore and refined materials until onward transport is available.
- **Hub Refuelling** — hubs extend practical ship range by providing Fuel between distant systems.
- **Basic Hub Buildings** — hubs would need simple infrastructure such as storage, Fuel facilities and loading/unloading capability.
- **Export Hub Colonies** — some colonies may be deliberately developed primarily as collection and export centres rather than mining colonies.
- **Raw Ore Transport** — simple but bulky, requiring substantial freight capacity.
- **Ore Refining** — process raw Ore before shipping to increase value and reduce the amount of cargo space required per unit of value.
- **Refining Infrastructure** — refining consumes Power, Industry, capital and potentially workforce, creating another decision about where processing should happen.
- **Local vs Central Refining** — refine at the mining colony to reduce freight volume, or ship raw Ore to a larger regional refinery with better efficiency.
- **Route Economics** — the player needs to consider distance, Fuel cost, journey time, cargo value and ship utilisation when deciding where resources should travel.
- **Freight Bottlenecks** — production can exceed transport capacity, causing stockpiles and stalled cash generation until logistics investment catches up.
- **Storage Bottlenecks** — warehouses become part of the logistics chain so excess production can accumulate safely while waiting for transport.
- **Corporate Ship Role** — the Corporate Ship remains useful for supported colonies but should not be the permanent answer to large-scale logistics.
- **Corporate Service Zone** — colonies inside the zone retain easy access to conglomerate logistics, while colonies outside it increasingly require player-built infrastructure.
- **Buyer Collection Ships** — Stage 8 now has a defined first implementation through the Conglomerate Buyers Service: contracted buyers send their own collection ships on recurring schedules, subject to quality, quantity, reputation and reliability rules.
- **Contracted Hauliers** — external freight companies could potentially move cargo for a fee, providing an expensive alternative to owning enough ships.
- **Emergency Freight Option** — there should probably always be some costly fallback transport method so a remote colony can never become permanently economically trapped.
- **Unlimited Scaling Principle** — freight capacity must never have a fixed final ceiling; more ships, larger ships, better infrastructure and technology should always allow further growth.
- **Late Logistics Abstraction** — once networks become very large, established routes could eventually become represented by freight throughput rather than forcing the player to manually manage dozens or hundreds of individual journeys.

## Core gameplay loop

**Produce → Store → Sell direct or fulfil brokered buyer contracts → Refine or ship raw → Move through hubs → Deliver to wider markets → Reinvest in larger/better logistics → Produce even more.**

## Immediate design areas

The main Stage 8 areas still requiring detailed design/implementation are:

- Conglomerate Buyers Service implementation and final review of its small set of open rules.
- Ship construction and player-designed ship configuration.
- Hub mechanics for planets, moons and space stations.
- Freight route operation and automation.
- Physical cargo transfer between colonies, hubs and ships.
- Refining location and logistics economics.
- Scalable transport capacity without a permanent profit ceiling.
