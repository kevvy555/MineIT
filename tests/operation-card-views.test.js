import assert from "node:assert/strict";
import fs from "node:fs";
import { ResourceService } from "../js/domain/resource-service.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/v55-ui.js"),resources=read("js/domain/resource-service.js"),workforce=read("views/operational-workforce.html"),transport=read("views/dedicated-colony-transport.html"),renewable=read("views/renewable-harvest.html");
for(const marker of["OPERATIONAL WORKFORCE","data-workforce-available","data-workforce-shortfall"])assert.ok(workforce.includes(marker),`missing workforce view marker: ${marker}`);
for(const marker of["DEDICATED COLONY TRANSPORT","data-transport-orders","data-transport-order-template","data-transport-custom","data-transport-request"])assert.ok(transport.includes(marker),`missing transport view marker: ${marker}`);
for(const marker of["RENEWABLE HARVEST","data-harvest-intensity","data-harvest-down","data-harvest-up"])assert.ok(renewable.includes(marker),`missing renewable view marker: ${marker}`);
for(const viewPath of["./views/operational-workforce.html","./views/dedicated-colony-transport.html","./views/renewable-harvest.html"])assert.ok(ui.includes(viewPath),`missing external operation view load: ${viewPath}`);
for(const marker of["createDocumentFragment","cloneNode(true)","replaceChildren(rows)","body.isConnected","anchor.isConnected","card.addEventListener(\"click\""])assert.ok(ui.includes(marker),`missing bounded DOM/lifecycle marker: ${marker}`);
assert.match(ui,/requestTransport\(amount\).*this\.transport\.request\(this\.state,amount\)/s,"transport mutation must remain in TransportService path");
assert.match(ui,/this\.resources\.adjustHarvestIntensity\(tile,delta\)/,"harvest action must dispatch to ResourceService");
assert.doesNotMatch(ui,/tile\.harvestIntensity\s*=/,"UI must not own harvest-intensity state mutation");
assert.match(resources,/adjustHarvestIntensity\(tile,deltaPercent\)/,"ResourceService must own harvest-intensity mutation");

const service=new ResourceService(),tile={type:"food",resourceId:"fungal",abundanceLabel:"Established",level:1,terrainYieldFactor:1};
const increased=service.adjustHarvestIntensity(tile,25);assert.deepEqual({ok:increased.ok,before:increased.before,after:increased.after},{ok:true,before:100,after:125});assert.equal(tile.harvestIntensity,1.25);
const clamped=service.adjustHarvestIntensity(tile,-500);assert.equal(clamped.after,25);assert.equal(tile.harvestIntensity,.25);

console.log("external operational workforce, transport and renewable-harvest view ownership contract passed");
