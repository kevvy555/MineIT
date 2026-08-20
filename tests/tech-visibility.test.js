import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TECH_TREES } from "../js/data/technologies.js";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");for(const category of["power","food","mining"])assert.equal(TECH_TREES[category].length,10,`${category} must expose all 10 technology levels`);
const app=read("js/app.js");assert.match(app,/technology:this\.technology/);const world=read("js/ui/world-view.js");assert.match(world,/technology\.canExploit/);assert.match(world,/globalAlpha=/,"Technology-locked resources must be visually ghosted even with image backgrounds");assert.match(world,/LOCK • M/);assert.match(world,/this\.onTap/);
const tech=read("js/ui/colony-tech-ui.js"),enhanced=read("js/ui/ui-enhancements.js"),v55=read("js/ui/v55-ui.js");assert.match(tech,/technology\.tree/);assert.match(enhanced,/showFutureTech/);assert.match(enhanced,/HIDE FUTURE TECH/);assert.match(enhanced,/SHOW FUTURE TECH/);assert.match(enhanced,/HIDE OLD TECH/);assert.match(enhanced,/t\.level<=Math\.min\(10,level\+1\)/);assert.match(v55,/Extraction workforce/);assert.match(v55,/Natural Food workforce requirement/);assert.match(v55,/techEffect/);
console.log("MineIT locked-tile and technology-roadmap test passed");
