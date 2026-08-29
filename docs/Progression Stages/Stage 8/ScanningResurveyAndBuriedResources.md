# Stage 8 Feature — Scanning Resurvey and Buried Resources

Status: **Not Started**  
Design state: **Approved for implementation after review**

## Purpose

Make Scanning technology feel like improved discovery capability rather than a visible lock on known resources.

The player should not be told that a previously scanned tile contains a resource that their current scanner cannot detect. Instead, higher Scanning technology should create new reasons to revisit previously surveyed ground, including developed colony tiles.

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

A scan performed with insufficient Scanning capability should resolve only what that scanner is capable of detecting.

The visible result may therefore be effectively:

**NO DEPOSIT DETECTED**

The player must not know whether that means the tile is truly empty or whether something remains below the current detection capability.

---

### 2. Every scan records the Scanning level used

Each surveyed tile must persist the Scanning capability that produced its latest result.

Conceptually:

`lastScannedAtLevel`

A tile becomes eligible for resurvey whenever:

`lastScannedAtLevel < colony.tech.scanning`

This rule applies to all previously scanned eligible tiles, not only tiles that secretly contain a newly detectable resource.

That prevents the resurvey marker itself becoming a hidden-resource detector.

---

### 3. Scanning upgrades make old scans resurveyable

When a higher Scanning level is physically commissioned at a colony:

- previously scanned eligible tiles remain in their current visible state;
- any tile last scanned with a lower Scanning level becomes eligible for resurvey;
- the game does **not** automatically reveal or automatically rescan those tiles;
- the player chooses which old areas are worth revisiting.

This makes each Scanning upgrade refresh the exploration value of previously developed territory without invalidating prior map knowledge.

---

### 4. Yellow question mark means resurvey available

A previously scanned tile that can now benefit from better Scanning equipment should display a **yellow `?`**.

Meaning:

- normal/unscanned `?` = first survey still required;
- yellow `?` = this tile was scanned before, but the colony now has better Scanning capability and may resurvey it.

The yellow marker must indicate only **resurvey opportunity**, never guaranteed resource presence.

Once the tile is rescanned at the current Scanning level, the yellow `?` disappears until Scanning capability increases again.

The normal map may show the marker in a restrained way; a Scanning/Upgrade-focused map view may emphasize it more strongly later if required.

---

### 5. Resurvey uses the existing survey queue

Resurvey should be a normal survey action using the same queue/capacity system rather than a separate parallel mechanic.

The player chooses whether to spend surveying capacity on:

- unexplored tiles; or
- previously explored tiles that can now benefit from the improved scanner.

Automatic mass-resurvey is intentionally not part of the initial feature.

Potential future quality-of-life options such as multi-select or `RESCAN ALL VISIBLE` are deferred until the individual resurvey loop has been tested for pacing and friction.

---

## Developed-tile scanning

### 6. Housing, Industry and Power remain scannable

Housing, Industry and Power must **not** block scanning or resurveying.

A developed tile can be rescanned while the building remains fully operational.

Scanning does not:

- stop production;
- consume the building;
- reduce building output;
- require demolition first.

The scanner is determining what exists beneath/around the established site, not physically extracting it.

---

### 7. A resource can be discovered beneath an existing building

If a resurvey reveals a resource under Housing, Industry or Power:

- the resource becomes permanently known;
- the existing building remains in place and continues operating;
- the resource is shown as **blocked by the current development**;
- the player cannot exploit the deposit until the occupying building is demolished.

Example presentation:

**High-Quality Cobalt Deposit**  
**Blocked by Housing L5**

This creates a deliberate economic decision:

**Keep the valuable mature building, or demolish it to gain access to the deposit.**

---

### 8. Demolition uses normal building rules

There is no special demolition penalty simply because a resource exists beneath a building.

If the player chooses to exploit the resource:

1. demolish the Housing/Industry/Power using the normal demolition/recovery rules;
2. the known resource remains on the tile;
3. once the site is clear, normal extraction-development rules apply.

---

### 9. Known resources may still be built over

A known undeveloped resource should not permanently reserve the tile for extraction.

The player may intentionally place Housing, Industry or Power over a known deposit if that development is strategically more valuable.

Doing so temporarily blocks exploitation but does not erase the resource knowledge.

This preserves genuine land-use opportunity cost instead of making resource discovery automatically dictate colony layout.

---

## Resource-discovery rules

### 10. Later Scanning levels primarily reveal plausible hidden/subsurface resources

The resources unlocked by progressively better Scanning should make physical sense.

Higher Scanning levels are especially appropriate for:

- deeper ores;
- rare metals;
- gemstones/mineral concentrations;
- underground fuels;
- brines;
- deep geological deposits;
- exotic or difficult-to-detect subsurface materials.

Obvious surface resources such as major vegetation/food sites should generally be detectable at early Scanning levels rather than suddenly appearing beneath long-established heavy development at a very high scanner tier.

Exact resource-to-Scanning-level mapping remains a balance/data-design task for implementation.

---

### 11. Hidden resource generation remains deterministic

A tile's underlying resource truth must not reroll when rescanned.

Improved Scanning reveals additional deterministic information from the same underlying world state.

Repeated rescans at the same Scanning level must not produce different hidden resources, qualities or sizes.

---

## Spaceport exception

### 12. Spaceport scanning/exploitation is deferred

The Basic Spaceport is mandatory startup/logistics infrastructure and currently has special strategic importance.

For this first feature:

- do not create a situation where an effectively irreplaceable starting Spaceport must be demolished to access a major deposit;
- Spaceport resurvey/exploitation behaviour is explicitly deferred until Spaceport relocation and broader freight/logistics mechanics are designed.

Housing, Industry and Power are included now because they are normal player-managed development with existing demolition rules.

---

## UI expectations

The player should be able to distinguish three broad map states without learning hidden information:

- **Unsurveyed** — normal survey `?`;
- **Surveyed at current Scanning level** — no resurvey marker;
- **Surveyed at an older Scanning level** — yellow resurvey `?`.

If a resource is discovered beneath a building, the tile presentation must show both truths:

- the current building remains the primary visible development;
- a secondary marker/indicator shows that a known resource exists underneath and is blocked.

Opening the tile should clearly explain the trade-off without implying that demolition is mandatory.

---

## State / save implications

Implementation will likely require persisted per-tile survey metadata equivalent to:

- latest Scanning level used;
- current survey/resurvey eligibility;
- deterministic hidden-resource truth where not already represented canonically;
- known-but-blocked resource state beneath development.

The exact data shape must be implemented through the existing canonical world/survey state owners rather than adding UI-owned flags.

Save migration must preserve existing surveyed tiles. A migration strategy should assign a sensible `lastScannedAtLevel` based on the colony's deployed Scanning capability at migration time, unless existing survey history provides a more accurate source.

---

## Required implementation coverage

When implemented, regression/domain coverage should prove at minimum:

1. insufficient Scanning does not reveal that a hidden resource exists;
2. both truly empty and secretly richer tiles become resurveyable after a Scanning upgrade;
3. the yellow `?` therefore does not leak resource presence;
4. rescanning at a higher level can reveal a deterministic previously hidden deposit;
5. rescanning at the same level does not repeatedly become available;
6. Housing, Industry and Power tiles can be scanned/rescanned while operating;
7. a resource revealed beneath a building remains blocked until demolition;
8. normal demolition exposes the known resource without rerolling it;
9. the player can intentionally build normal development over a known undeveloped resource;
10. save/load preserves scan level, resurvey eligibility and buried-resource knowledge;
11. the Spaceport remains excluded from this first buried-resource implementation;
12. map/browser interaction correctly distinguishes normal survey and yellow resurvey markers on mobile.

---

## Deferred balance questions

Not yet locked:

- whether resurvey should take the same time as an initial survey or receive a time reduction;
- exact resource families and detection levels for Scanning L1–L10;
- whether a dedicated Scanning map focus should emphasize resurvey markers;
- whether later quality-of-life tools should support batch/multi-select resurveying;
- future Spaceport relocation/resurvey/exploitation behaviour.

These should not block the core feature design.
