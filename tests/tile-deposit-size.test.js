import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WorldView } from "../js/ui/world-view.js";

const view=Object.create(WorldView.prototype);
view.resources={isRenewable:tile=>tile.sustainability==="renewable"};

assert.equal(view.depositText({sustainability:"finite",depositScale:"Huge",initialReserve:1250000}),"HUGE • 1.25M");
assert.equal(view.depositText({sustainability:"finite",depositScale:"Small",initialReserve:840}),"SMALL • 840");
assert.equal(view.depositText({sustainability:"renewable",abundanceLabel:"Vast"}),"VAST • ∞");
assert.equal(view.depositText({sustainability:"renewable",abundanceLabel:"Established"}),"ESTABLISHED • ∞");

const source=readFileSync(new URL("../js/ui/world-view.js",import.meta.url),"utf8");
assert.match(source,/fillText\(this\.depositText\(tile\)/,"Every revealed tile must render deposit size/abundance text");
assert.match(source,/initialReserve/,"Finite tile size must use the original deposit size rather than only remaining reserve");
assert.match(source,/depositScale/);
assert.match(source,/abundanceLabel/);

console.log("MineIT tile deposit-size labels test passed");
