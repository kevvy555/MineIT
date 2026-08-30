import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TECH_TREES } from "../js/data/technologies.js";
import { RESOURCE_TYPES } from "../js/data/resources.js";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

for(const category of["housing","power","food","industry"])assert.equal(TECH_TREES[category].length,5,`${category} must expose five physical building technology levels`);
assert.equal(TECH_TREES.mining.length,10,"mining must retain ten extraction technology levels");
assert.equal(TECH_TREES.scanning.length,10,"scanning must expose ten prospecting capability levels");
const naturalResources=Object.values(RESOURCE_TYPES).flat().filter(resource=>!resource.manufactured);
for(const technology of TECH_TREES.scanning){
  const expected=naturalResources.filter(resource=>resource.scanningLevel===technology.level);
  assert.match(technology.description,new RegExp(`New discoveries at L${technology.level}:`),`Scanning L${technology.level} must explicitly label its newly discoverable resources`);
  for(const resource of expected)assert.ok(technology.description.includes(resource.name),`Scanning L${technology.level} description must list canonical resource ${resource.name}`);
  for(const resource of naturalResources.filter(resource=>resource.scanningLevel!==technology.level))assert.ok(!technology.description.includes(resource.name),`Scanning L${technology.level} must not claim ${resource.name}, which belongs to L${resource.scanningLevel}`);
}
const app=read("js/app.js");assert.match(app,/technology:this\.technology/);
const world=read("js/ui/world-view.js");assert.match(world,/technology\.canExploit/);assert.match(world,/globalAlpha=/,"Technology-locked resources must be visually ghosted even with image backgrounds");assert.match(world,/LOCK • M/);assert.match(world,/this\.onTap/);
const tech=read("js/ui/technology-presentation-ui.js"),techView=read("views/corporate-technology.html"),enhanced=read("js/ui/ui-enhancements.js"),v55=read("js/ui/v55-ui.js");assert.match(tech,/technology\.tree/);assert.match(tech,/corporate-technology\.html/);assert.match(tech,/showFutureTech/);assert.match(tech,/FUTURE: ON/);assert.match(tech,/FUTURE: OFF/);assert.match(tech,/populateTechnologyLevels/);assert.match(techView,/data-tech-toggle/);assert.match(techView,/data-tech-level-template/);for(const marker of["Allows Housing buildings","Allows Power buildings","Allows Food facilities","Allows Industry buildings","mining workforce"])assert.ok(tech.includes(marker),`modern technology effect missing ${marker}`);assert.doesNotMatch(enhanced,/showFutureTech|HIDE OLD TECH|legacy-technology\.html/,"shadowed legacy technology state and view must stay removed from UI enhancements");assert.doesNotMatch(v55,/\n\s{2}techEffect\(/,"V55 must not retain the shadowed technology effect renderer");
console.log("MineIT canonical locked-tile and full-screen technology selector test passed");
