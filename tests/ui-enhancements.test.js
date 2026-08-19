import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WorldView } from "../js/ui/world-view.js";
import { ResourceService } from "../js/domain/resource-service.js";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8"),resources=new ResourceService();
assert.equal(resources.qualityBands().length,6,"Map/manual must use all six existing quality bands");

const view=Object.create(WorldView.prototype);view.state={company:{tech:{mining:3}}};view.technology={canExploit:(_state,tile)=>(tile.requiredMiningLevel||1)<=3};view.resources=resources;view.filters={developed:true,notDeveloped:true,locked:true};view.sizeFilters=Object.fromEntries(["limited","established","small","modest","large","huge","colossal","vast","legacy"].map(k=>[k,true]));view.qualityFilters=Object.fromEntries(resources.qualityBands().map(b=>[b.key,true]));
const rareHuge={revealed:true,developed:false,depleted:false,type:"ore",resourceId:"gold",requiredMiningLevel:3,quality:3000,sustainability:"finite",depositScale:"Huge"};
assert.equal(view.tileSizeKey(rareHuge),"huge");assert.equal(view.tileQualityKey(rareHuge),"rare");assert.equal(view.isTileVisible(rareHuge,2,2),true);
view.sizeFilters.huge=false;assert.equal(view.isTileVisible(rareHuge,2,2),false,"Size filter must hide matching deposits");view.sizeFilters.huge=true;view.qualityFilters.rare=false;assert.equal(view.isTileVisible(rareHuge,2,2),false,"Quality filter must hide matching quality bands");view.qualityFilters.rare=true;view.filters.notDeveloped=false;assert.equal(view.isTileVisible(rareHuge,2,2),false,"State, size and quality filters must intersect");
const unsurveyed={revealed:false};assert.equal(view.isTileVisible(unsurveyed,5,5),true,"Unsurveyed sectors must remain visible regardless of resource filters");assert.equal(view.isTileVisible(rareHuge,0,0),true,"Ship tile remains visible");

const world=read("js/ui/world-view.js");for(const label of["SIZE","QUALITY","LIMITED","ESTABLISHED","SMALL","MODEST","LARGE","HUGE","COLOSSAL","VAST","LEGACY"])assert.ok(world.includes(label),`Missing map size/filter label ${label}`);for(const band of resources.qualityBands())assert.ok(world.includes("qualityBands"),`Quality filters must derive from existing quality bands (${band.label})`);assert.match(world,/data-map-size/);assert.match(world,/data-map-quality/);

const ui=read("js/ui/ui-enhancements.js");for(const key of["name","category","rate","stock","remaining"])assert.ok(ui.includes(`[\"${key}\"`)||ui.includes(`\"${key}\"`),`Collect sorting must include ${key}`);assert.match(ui,/data-collection-sort/);assert.match(ui,/collectionSort\.dir\*=-1/);
assert.match(ui,/HIDE FUTURE TECH/);assert.match(ui,/SHOW FUTURE TECH/);assert.match(ui,/HIDE OLD TECH/);assert.match(ui,/SHOW OLD TECH/);assert.ok(ui.includes("this.showFutureTech||t.level<=Math.min(10,level+1)"),"Hiding future tech must retain the next purchasable tier");assert.ok(ui.includes("this.showOldTech||t.level>=level"),"Hiding old tech must remove only previously purchased tiers");
for(const marker of["MINEIT FIELD MANUAL","Objective & game loop","All resources","Quality & value","Corporate trade ship","Multiple colonies","Returns & liability colonies","Saving, reset & diagnostics"])assert.ok(ui.includes(marker),`Detailed help missing ${marker}`);assert.match(ui,/this\.resources\.catalog\(\)/,"Manual resource list must be data-driven");assert.match(ui,/data-help-target/);assert.match(ui,/help-index/);

const controller=read("js/ui/ui-controller.js");assert.match(controller,/UIEnhancementsMixin/);assert.ok(controller.lastIndexOf("mix(UIController,UIEnhancementsMixin)")>controller.indexOf("mix(UIController,ContractUIMixin)"),"Enhancement mixin must override the legacy menu/tech/collection views");
console.log("MineIT v5.2 UI enhancements test passed");
