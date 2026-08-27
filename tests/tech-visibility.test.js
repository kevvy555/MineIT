import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TECH_TREES } from "../js/data/technologies.js";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

for(const category of["housing","power","food","industry"])assert.equal(TECH_TREES[category].length,5,`${category} must expose five physical building technology levels`);
assert.equal(TECH_TREES.mining.length,10,"mining must retain ten extraction technology levels");
const app=read("js/app.js");assert.match(app,/technology:this\.technology/);
const world=read("js/ui/world-view.js");assert.match(world,/technology\.canExploit/);assert.match(world,/globalAlpha=/,"Technology-locked resources must be visually ghosted even with image backgrounds");assert.match(world,/LOCK • M/);assert.match(world,/this\.onTap/);
const tech=read("js/ui/technology-presentation-ui.js"),enhanced=read("js/ui/ui-enhancements.js"),v55=read("js/ui/v55-ui.js");assert.match(tech,/technology\.tree/);assert.match(tech,/corporate-technology\.html/);assert.match(tech,/showFutureTech/);assert.match(tech,/HIDE FUTURE TECH/);assert.match(tech,/SHOW FUTURE TECH/);assert.doesNotMatch(enhanced,/showFutureTech|HIDE OLD TECH|legacy-technology\.html/,"shadowed legacy technology state and view must stay removed from UI enhancements");assert.match(v55,/Extraction workforce/);assert.match(v55,/Natural Food workforce requirement/);assert.match(v55,/techEffect/);
console.log("MineIT canonical locked-tile and technology-roadmap test passed");
