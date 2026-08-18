import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WorldView } from "../js/ui/world-view.js";

const view=Object.create(WorldView.prototype);
view.state={company:{tech:{mining:2}}};
view.technology={canExploit:(_state,tile)=>(tile.requiredMiningLevel||1)<=2};
view.filters={developed:true,notDeveloped:true,locked:true};

const unsurveyed={revealed:false,developed:false,depleted:false};
const developed={revealed:true,developed:true,depleted:false,requiredMiningLevel:6};
const available={revealed:true,developed:false,depleted:false,requiredMiningLevel:2};
const locked={revealed:true,developed:false,depleted:false,requiredMiningLevel:3};
const depleted={revealed:true,developed:false,depleted:true,requiredMiningLevel:8};

assert.equal(view.tileFilterBucket(unsurveyed),null,"Unsurveyed tiles are outside resource filters");
assert.equal(view.tileFilterBucket(developed),"developed","Developed tiles stay in the Developed bucket");
assert.equal(view.tileFilterBucket(available),"notDeveloped","Exploitable unworked tiles use Not Developed");
assert.equal(view.tileFilterBucket(locked),"locked","Technology-blocked tiles use Locked");
assert.equal(view.tileFilterBucket(depleted),"notDeveloped","Depleted/non-operating sites are not currently developed");

view.filters.developed=false;
assert.equal(view.isTileVisible(developed,4,4),false);
assert.equal(view.isTileVisible(available,4,4),true);
view.filters.notDeveloped=false;
assert.equal(view.isTileVisible(available,4,4),false);
assert.equal(view.isTileVisible(depleted,4,4),false);
view.filters.locked=false;
assert.equal(view.isTileVisible(locked,4,4),false);
assert.equal(view.isTileVisible(unsurveyed,4,4),true,"Exploration must remain possible with all filters off");
assert.equal(view.isTileVisible(locked,0,0),true,"The colony ship is always visible");

view.filters={developed:true,notDeveloped:false,locked:true};
assert.equal(view.isTileVisible(developed,2,2),true);
assert.equal(view.isTileVisible(available,2,2),false);
assert.equal(view.isTileVisible(locked,2,2),true,"Filters support arbitrary multi-select combinations");

const source=readFileSync(new URL("../js/ui/world-view.js",import.meta.url),"utf8");
for(const label of ["DEVELOPED","NOT DEVELOPED","LOCKED"]){
  assert.ok(source.includes(label),`Missing map filter button: ${label}`);
}
assert.match(source,/aria-pressed/);
assert.match(source,/this\.filters\[key\]=!this\.filters\[key\]/);

console.log("MineIT map filters test passed");
