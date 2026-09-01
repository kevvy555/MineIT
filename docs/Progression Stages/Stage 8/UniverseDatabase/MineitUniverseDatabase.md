# MineIT Universe Database — Moved

Status: **Moved to the dedicated MineIT Universe repository**

The canonical MineIT Universe architecture, data model, Directory application and authored universe content are now owned by:

`kevvy555/MineIT-Universe`

Canonical plan:

`docs/MineitUniverseDatabase.md`

Canonical published content will live under:

`MineIT-Universe/data/`

This file is intentionally only a pointer so the MineIT game repository does not become a second authored source of universe truth.

The existing Stage 8 Conglomerate Buyers Service remains game-owned. Future integration should consume stable universe IDs/content from `MineIT-Universe` while keeping mutable buyer contracts, prices, quantities, reputation and save state inside MineIT.

See the dedicated repository's `AGENTS.md` before changing universe architecture or content.
