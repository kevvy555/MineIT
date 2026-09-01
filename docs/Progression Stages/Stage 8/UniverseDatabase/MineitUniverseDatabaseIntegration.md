# MineIT Universe Integration — Moved

Status: **Canonical integration plan moved to the dedicated MineIT Universe repository**

The authoritative cross-application integration plan now lives in:

`kevvy555/MineIT-Universe/docs/MineitUniverseDatabaseIntegration.md`

The MineIT game remains responsible for game-specific mutable state and behaviour, including:

- buyer contract lifecycle;
- prices and quantities;
- collection cadence and ship events;
- reputation and buyer happiness;
- save state;
- procedural frontier systems, deposits and player colonies.

The dedicated Universe repository owns persistent shared identity/content such as people, companies, locations, facilities, operations, named ships and structural resource demand.

Future MineIT integration should consume the Universe repository through stable IDs and its published/cached manifest-driven JSON rather than recreating canonical universe records inside this game repository.

This file is intentionally a pointer to prevent duplicate architecture documentation from drifting.
