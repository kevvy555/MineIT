import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WorldView } from "../js/ui/world-view.js";

const view=Object.create(WorldView.prototype);
view.state={company:{tech:{mining:2}}};
view.technology={canExploit:(_state,tile)=>(tile.requiredMiningLevel||1)<=2};
view.filters={developed:true,notDeveloped:true,locked:true};
view.typeFilters={food:true,build:true,fuel:true,ore:true};

const unsurveyed={revealed:false,developed:false,depleted:false};
const developed={revealed:true,developed:true,depleted:false,requiredMiningLevel:6,type:"ore"};
const available={revealed:true,developed:false,depleted:false,requiredMiningLevel:2,type:"food"};
const locked={revealed:true,developed:false,depleted:false,requiredMiningLevel:3,type:"fuel"};
const depleted={revealed:true,developed:false,depleted:true,requiredMiningLevel:8,type:"build"};

assert.equal(view.tileFilterBucket(unsurveyed),null);
assert.equal(view.tileFilterBucket(developed),"developed");
assert.equal(view.tileFilterBucket(available),"notDeveloped");
assert.equal(view.tileFilterBucket(locked),"locked");
assert.equal(view.tileFilterBucket(depleted),"notDeveloped");
view.filters.developed=false;
assert.equal(view.isTileVisible(developed,4,4),false);
assert.equal(view.isTileVisible(available,4,4),true);
view.filters.notDeveloped=false;
assert.equal(view.isTileVisible(available,4,4),false);
view.filters.locked=false;
assert.equal(view.isTileVisible(locked,4,4),false);
assert.equal(view.isTileVisible(unsurveyed,4,4),true);
assert.equal(view.isTileVisible(locked,0,0),true);
view.filters={developed:true,notDeveloped:true,locked:true};
view.typeFilters.ore=false;
assert.equal(view.isTileVisible(developed,2,2),false);
assert.equal(view.isTileVisible(available,2,2),true);

const controls=readFileSync(new URL("../js/ui/map-controls.js",import.meta.url),"utf8");
const defs=readFileSync(new URL("../js/ui/map-filter-definitions.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../css/world.css",import.meta.url),"utf8");
for(const label of["DEVELOPED","NOT DEVELOPED","LOCKED","FOOD","BUILD","FUEL","ORE"])
  assert.ok(defs.includes(label),`Missing filter definition: ${label}`);
for(const label of["STATE","SIZE","QUALITY","ALL","CLEAR","PROBLEMS","BUILDINGS","UPGRADE","FOOD","BUILD","FUEL","ORE"])
  assert.ok(controls.includes(label),`Missing canonical map control: ${label}`);
assert.doesNotMatch(controls,/\[\["land","LAND"\],\["resource","RESOURCES"\]\]/,"canonical controls must expose one unified map");
assert.match(controls,/dispose\(\)/,"document-level map focus listener must have an explicit disposal path");
assert.match(css,/\.map-filter-options/);
console.log("MineIT canonical map filters test passed");
