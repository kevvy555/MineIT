# Stage 8 Feature — Scanning Resurvey and Buried Resources

Status: **Complete**  
Design state: **Implemented and validated**

## Purpose

Make Scanning technology feel like improved discovery capability rather than a visible lock on known resources.

The player should not be told that a previously scanned tile contains a resource that their current scanner cannot detect. Instead, higher Scanning technology creates new reasons to revisit previously surveyed ground, including developed colony tiles.

The intended player experience is:

**Scan → apparently resolve tile → improve Scanning technology → old scans become eligible for resurvey → choose where to rescan → potentially discover new subsurface resources → decide whether exploiting them is worth disrupting existing development.**

---

## Core rules

### 1. Remove hidden-resource information leaks

Low-level scanning must not reveal that a tile contains a resource that requires better Scanning technology.

Do not present states such as:

- `Scanning L4 required` on a hidden deposit;
- `Unresolved deposit` where the message itself proves something valuable exists;
- locked-resource markers that distinguish a genuinely empty tile from a resource the current scanner cannot detect.

A scan performed with insufficient Scanning capability resolves only what that scanner can detect. The visible result is effectively:

**NO DEPOSIT DETECTED**

The player must not know whether that means the tile is truly empty or whether something remains below the current detection capability.

### 2. Every scan records the Scanning level used

Each surveyed tile persists the Scanning capability that produced its latest result:

`lastScannedAtLevel`

A tile becomes eligible for resurvey whenever:

`lastScannedAtLevel < colony.tech.scanning`

This applies to all previously scanned eligible tiles, not only tiles that secretly contain a newly detectable resource. The resurvey marker therefore cannot itself become a hidden-resource detector.

### 3. Scanning upgrades make old scans resurveyable

When a higher Scanning level is physically commissioned at a colony:

- previously scanned eligible tiles remain in their current visible state;
- any tile last scanned with a lower Scanning level becomes eligible for resurvey;
- the game does not automatically reveal or automatically rescan those tiles;
- the player chooses which old areas are worth revisiting.

### 4. Yellow question mark means resurvey available

A previously scanned tile that can now benefit from better Scanning equipment displays a **yellow `?`**.

- normal/unscanned `?` = first survey still required;
- yellow `?` = previously scanned with older equipment and eligible for resurvey.

The yellow marker means only **resurvey opportunity**, never guaranteed resource presence. Once rescanned at the current level, the yellow marker disappears until Scanning capability increases again.

No additional Scanning map filter or focus mode is required. The yellow marker works directly on the normal colony map, including over normal colony development.

### 5. Resurvey uses the existing survey queue and is faster

Resurvey is a normal survey action using the same queue and survey-slot system rather than a separate mechanic.

The player chooses whether surveying capacity is spent on unexplored tiles or old scans.

A resurvey takes **50% of the equivalent first-survey time**, rounded to whole game days with a minimum of 1 day. The speed increase represents existing terrain/geology records and known coordinates allowing the new equipment to focus on improved sensor passes rather than repeating the complete initial survey.

Automatic mass-resurvey is intentionally not part of the initial feature. Batch/multi-select quality-of-life can be considered later if needed.

---

## Developed-tile scanning

### 6. Housing, Industry and Power remain scannable

Housing, Industry and Power do not block scanning or resurveying. A developed tile can be rescanned while the building remains fully operational.

Scanning does not stop production, consume the building, reduce output, or require demolition first.

### 7. A resource can be discovered beneath an existing building

If a resurvey reveals a resource under Housing, Industry or Power:

- the resource becomes permanently known;
- the existing building remains in place and continues operating;
- the resource is marked as blocked by current development;
- the player cannot exploit the deposit until the occupying building is demolished.

Example:

**High-Quality Cobalt Deposit**  
**Blocked by Housing L5**

The decision is deliberately economic: keep the mature building or demolish it to expose the deposit.

### 8. Demolition uses normal building rules

There is no extra demolition penalty because a resource exists beneath a building. Normal demolition/recovery rules apply. The known resource remains after demolition and normal extraction-development rules then become available.

### 9. Known resources may still be built over

A known undeveloped resource does not permanently reserve a tile for extraction. The player may intentionally place Housing, Industry or Power over it. Doing so blocks exploitation but preserves the known resource and its deterministic properties until the development is removed.

---

## Resource Scanning levels

Scanning level is based on **how physically detectable the resource is in its natural location**, not on how hard it is to extract. Mining technology remains the extraction requirement.

### Scanning L1 — Surface Survey Suite

Clearly visible surface biology/materials or very strong exposed signatures:

- Fungal Shelf
- Edible Flora
- Grazing Herd
- Nutrient Crop
- Protein Bloom
- Construction Fibre
- Stone
- Biomass
- Surface Iron Nodules

### Scanning L2 — Shallow Geophysical Survey

Shallow beds, water-associated biology and near-surface geological material:

- Thermal Algae
- Clay
- Silica
- Limestone
- Peat Bed

### Scanning L3 — Subsurface Tomography

Common buried seams and conventional subsurface ore bodies:

- Structural Mineral
- Coal Seam
- Iron Ore
- Copper Ore

### Scanning L4 — Deep Spectral Survey

Deeper or weaker metallic/mineral signatures and precious mineralisation:

- Reactive Metal Ore
- Conductive Ore
- Silver
- Gold
- Gemstone Deposit
- Magnetic Ore

### Scanning L5 — Seismic Prospecting Array

Deep fluid reservoirs and targets primarily identified through seismic/gravimetric structure:

- Crude Oil
- Natural Gas

### Scanning L6 — Precision Mineral Spectrometry

Weak specialist/high-value mineral signatures requiring high-resolution mineral analysis:

- Advanced Ceramic Feedstock
- Fissile Mineral
- Platinum
- Palladium
- Sapphire
- Ruby
- Emerald

### Scanning L7 — High-Pressure Geochemistry

Extreme-pressure/deep geochemical deposits:

- Hydrogen-rich Brine
- Diamond

### Scanning L8 — Deep-Core Imaging

Very deep, high-temperature or unusual core mineralisation:

- Exotic Industrial Mineral

### Scanning L9 — Exotic Matter Detection

Non-standard matter/crystal signatures requiring specialist detection arrays:

- Exotic Fuel Crystal
- Exotic Crystal

### Scanning L10 — Quantum Resonance Survey

Weakest and most unusual deep advanced-element signatures:

- Advanced Element Deposit

Manufactured resources such as Synthetic Nutrient do not participate in natural planetary discovery.

---

## Deterministic discovery

A tile's underlying resource truth does not reroll when rescanned. Improved Scanning reveals additional information from the same deterministic world seed.

Repeated scans at the same Scanning level cannot create different resources, qualities or deposit sizes.

A previously known resource remains the same resource after later rescans; higher Scanning does not replace a known deposit with a newly rolled one.

---

## Spaceport exception

The Basic Spaceport is excluded from this first buried-resource implementation. It remains mandatory startup/logistics infrastructure and cannot become a forced demolition decision before Spaceport relocation has been designed.

Housing, Industry and Power are included because they are normal player-managed developments with existing demolition rules.

---

## UI behaviour

The normal colony map distinguishes:

- **Unsurveyed** — normal survey `?`;
- **Surveyed at current Scanning level** — no resurvey marker;
- **Surveyed at an older Scanning level** — yellow resurvey `?`.

No additional map filter is added.

If a resource is known beneath a building:

- the building remains the primary visual;
- a secondary resource badge/indicator communicates that a known resource is beneath it and blocked;
- the tile details explain which development blocks exploitation without implying demolition is mandatory.

---

## State / save behaviour

Runtime save schema is **v11** for this feature.

Per-tile survey history persists `lastScannedAtLevel`. Resurvey eligibility is derived from scan level versus current deployed colony Scanning capability rather than stored as a separate UI-owned flag.

Legacy unresolved-anomaly tiles migrate to ordinary completed clear scans at the colony's deployed Scanning level, removing the previous hidden-resource information leak. Existing revealed resources remain known, and resources covered by normal buildings retain their deterministic resource state.

---

## Implementation

Canonical implementation lives in:

- `js/data/resources.js` — explicit L1–L10 detection requirements;
- `js/domain/world-service.js` — deterministic hidden-resource truth and scanner-dependent reveal;
- `js/domain/survey-service.js` — resurvey eligibility, queueing and 50% duration;
- `js/domain/development-service.js` — building-over-resource preservation and normal demolition exposure;
- `js/domain/game-state-runtime.js` — v11 scan-history migration;
- `js/ui/world-view-runtime.js` — yellow resurvey marker and normal-map resurvey interaction.

Primary regression coverage:

- `tests/technology-delivery.test.js`;
- `tests/save-roundtrip.test.js`;
- `tests/map-first-ux.test.js`;
- existing startup/survival/expansion regression suite.

Validated gameplay head:

- Commit: `8bcbf927ea7b691602aca76850f6ca1ee69f4b5b`
- Workflow run: `33266200034`
- Job: `99136585382`
- Unit / regression / domain coverage: **SUCCESS**
- Browser startup / presentation interaction: **SUCCESS**

---

## Deferred items

Only these remain deferred:

- whether later quality-of-life tools should support batch/multi-select resurveying beyond the existing selection behaviour;
- future Spaceport relocation/resurvey/exploitation behaviour.

These do not block completion of this feature.
