# Stage 8 — Buyer and Collection Ship Content Generation

This document is the index/usage guide for the 1,000-buyer and 1,000-collection-ship art catalogue used by the **Conglomerate Buyers Service**.

## Interactive directory

Open:

`docs/Progression Stages/Stage 8/BuyerAndShipImageDirectory.html`

The directory deterministically generates and displays:

- 1,000 unique buyer/contact identities;
- 1,000 unique companies paired to those contacts;
- buyer role, company business type, commercial tier and home market;
- minimum global reputation;
- appropriate resource interests and typical quality expectation;
- one unique named primary collection ship per buyer;
- one of the 30 approved buyer ship classes and its cargo capacity;
- a detailed portrait-generation description for every buyer;
- a detailed ship-generation description for every named collection ship.

Buyer N is permanently paired with Ship N.

## Artwork naming

Buyer portraits:

`assets/art/buyers/buyer-0001.webp` through `buyer-1000.webp`

Buyer collection ships:

`assets/art/buyer-ships/buyer-ship-0001.webp` through `buyer-ship-1000.webp`

## Using the directory

The BUYERS and SHIPS tabs can be searched and filtered by commercial tier. Each entry has a **COPY PROMPT** action for image generation.

The **EXPORT CURRENT CSV** action exports all currently filtered records. With no search/filter active this produces the complete 1,000-row buyer or ship catalogue, including the generated image prompt.

This allows the image pool to be built gradually without manually maintaining a huge duplicated prose document.

## Determinism

The directory uses fixed seed `8302026`. Names, companies, home markets, reputation levels, resource interests, portrait descriptions, ship names, ship classes and liveries therefore remain stable unless the canonical generator itself is intentionally changed.

When this content is integrated into gameplay, persisted buyer identity and art-assignment keys must still be saved so later content additions cannot reshuffle an existing game.

## Visual direction

Buyer portraits should be vertical, grounded cinematic MineIT corporate/industrial science-fiction portraits. The person should look like a real procurement professional in a working environment appropriate to their company rather than a studio portrait.

Buyer ships should be wide/landscape images showing the complete vessel in a clear three-quarter exterior view. The 30 ship classes share canonical structural identities while individual named ships vary through commercial livery and presentation. Buyer ships are logistics craft rather than combat ships.

Gameplay rules remain owned by `ConglomerateBuyersService.md`; this directory is the canonical content/art-generation reference.