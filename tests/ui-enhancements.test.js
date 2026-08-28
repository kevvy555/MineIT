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

const ui=read("js/ui/ui-enhancements.js"),collectionView=read("views/current-collection.html"),techUI=read("js/ui/technology-presentation-ui.js"),techView=read("views/corporate-technology.html"),survivalUI=read("js/ui/survival-ui.js"),survivalManual=read("views/survival-manual.html"),viewTemplate=read("js/core/view-template.js");
for(const key of["name","category","rate","stock","remaining"])assert.ok(ui.includes(`\"${key}\"`),`Collect sorting must include ${key}`);assert.match(collectionView,/data-collection-sort/);assert.match(ui,/collectionSort\.dir\*=-1/);assert.match(ui,/replaceChildren/);
assert.match(techUI,/showFutureTech/);assert.match(techUI,/async tech\(\)/);assert.match(techView,/data-tech-toggle/);assert.match(techView,/data-tech-card-template/);assert.doesNotMatch(ui,/\n\s{2}async tech\(\)/,"UI-enhancement compatibility tech remains synchronous and is not the final player-facing owner");
for(const marker of["MINEIT FIELD MANUAL","Objective &amp; game loop","Resource catalogue","Quality &amp; sale value","Trade ships, export capacity &amp; colonist transport","Multiple colonies &amp; one corporation clock","Returns, liability colonies &amp; death","Saving, game log &amp; diagnostics"])assert.ok(survivalManual.includes(marker),`Detailed survival manual missing ${marker}`);assert.match(survivalUI,/this\.resources\.catalog\(\)/,"Manual resource list must remain data-driven");assert.match(survivalUI,/\.\/views\/survival-manual\.html/);assert.match(viewTemplate,/templateCache/);assert.match(survivalManual,/data-help-target/);assert.match(survivalManual,/help-index/);assert.doesNotMatch(ui,/MINEIT FIELD MANUAL/,"Static field-manual markup belongs in the external view, not UI enhancements");

const controller=read("js/ui/ui-controller.js");assert.match(controller,/UIEnhancementsMixin/);assert.ok(controller.lastIndexOf("mix(UIController,UIEnhancementsMixin)")>controller.indexOf("mix(UIController,ContractUIMixin)"),"Enhancement mixin must remain ahead of later survival/Industry/V55 wrappers");
console.log("MineIT active UI enhancement ownership test passed");
