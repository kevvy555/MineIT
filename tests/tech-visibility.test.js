import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TECH_TREES } from "../js/data/technologies.js";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

for (const category of ["power", "food", "mining"]) {
  assert.equal(TECH_TREES[category].length, 10, `${category} must expose all 10 technology levels`);
}

const app = read("js/app.js");
assert.match(app, /technology:this\.technology/, "WorldView must receive TechnologyService");

const world = read("js/ui/world-view.js");
assert.match(world, /technology\.canExploit/, "Map must check whether a revealed resource is exploitable");
assert.match(world, /globalAlpha=\.26/, "Technology-locked resources must be visually ghosted");
assert.match(world, /LOCK • M/, "Technology-locked resources must show their Mining-level lock");
assert.match(world, /this\.onTap/, "Ghosting must not replace normal tile tap handling");

const tech = read("js/ui/colony-tech-ui.js");
assert.match(tech, /technology\.tree/, "Technology screen must render full technology trees");
assert.match(tech, /showFutureTech/, "Technology screen must track future-tech visibility");
assert.match(tech, /HIDE FUTURE TECH/);
assert.match(tech, /SHOW FUTURE TECH/);
assert.match(tech, /data-tech-toggle/);
assert.match(tech, /Unlocks:/, "Mining roadmap must expose resource unlocks");
assert.match(tech, /t\.level===level\+1/, "Only the next technology may be purchased");

console.log("MineIT locked-tile and technology-roadmap test passed");
