# Conglomerate Buyer Portraits

This folder contains portrait artwork for contacts used by the Stage 8 **Conglomerate Buyers Service**.

## Preferred naming

Use sequential WEBP filenames:

- `buyer-0001.webp`
- `buyer-0002.webp`
- ...
- `buyer-1000.webp`

WEBP is preferred for mobile download size. PNG may be used temporarily while artwork is being prepared, but production integration should favour the WEBP copy.

## Assignment rules

Buyer identities do not depend on portraits. The game will assign available portraits deterministically when a new game's buyer pool is seeded.

- Use available portraits without replacement first so early/visible buyers are as visually distinct as possible.
- Reuse is allowed when the portrait pool is smaller than the buyer pool.
- Existing saves must preserve their assigned portrait key when more artwork is added later.
- If an assigned image is missing, the UI must show the buyer's name/initials instead; a missing portrait must never break buyer/contact or ship-event screens.

The full design is documented in:

`docs/Progression Stages/Stage 8/ConglomerateBuyersService.md`
