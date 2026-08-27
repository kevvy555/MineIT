import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const contract=read("js/ui/contract-ui.js");
const industry=read("js/ui/industry-ui.js");
const failedView=read("views/contract-failed.html");
const capacityView=read("views/industry-capacity-card.html");
const mapFirst=read("js/ui/map-first-ui.js");
const mapHelpView=read("views/map-first-help-controls.html");
const building=read("js/ui/building-details-ui.js");
const resource=read("js/ui/resource-development-ui.js");
const resourceView=read("views/undeveloped-resource.html");
const adaptive=read("js/ui/adaptive-building-ui.js");

assert.match(contract,/CONTRACT_FAILED_VIEW="\.\/views\/contract-failed\.html"/);
assert.match(contract,/preloadViewTemplates\(\[CONTRACT_FAILED_VIEW\]\)/);
assert.match(contract,/getLoadedViewTemplate\(CONTRACT_FAILED_VIEW\)/);
assert.match(contract,/loadViewTemplate\(CONTRACT_FAILED_VIEW\)/);
assert.match(contract,/renderContractFailed\(\)/);
assert.match(contract,/if\(kind==="failed"\)\{[^]*this\.state\.contract\.ended=true;this\.state\.status="liability";this\.repo\.save\(this\.state\);this\.renderContractFailed\(\);/);
assert.match(failedView,/data-contract-failed-view/);
for(const marker of["CONTRACT FAILED","ACKNOWLEDGE","ALL COLONIES"])assert.ok(failedView.includes(marker),`missing contract-failed marker ${marker}`);

assert.match(industry,/INDUSTRY_CAPACITY_VIEW="\.\/views\/industry-capacity-card\.html"/);
assert.match(industry,/preloadViewTemplates\(\[INDUSTRY_CAPACITY_VIEW\]\)/);
assert.match(industry,/getLoadedViewTemplate\(INDUSTRY_CAPACITY_VIEW\)/);
assert.match(industry,/createContextualFragment\(source\)/);
assert.match(industry,/body\.isConnected&&needs\.isConnected/);
assert.match(industry,/needs\.before\(fragment\)/);
for(const marker of["data-industry-capacity-card","data-industry-status","data-industry-load","data-industry-processing","data-industry-copy"])assert.ok(capacityView.includes(marker),`missing Industry capacity marker ${marker}`);
assert.match(industry,/Food and Fuel/,"state-dependent Industry guidance must remain bound by the controller");

assert.match(mapFirst,/MAP_FIRST_HELP_VIEW="\.\/views\/map-first-help-controls\.html"/);
assert.match(mapFirst,/preloadViewTemplates\(\[MAP_FIRST_HELP_VIEW\]\)/);
assert.match(mapFirst,/getLoadedViewTemplate\(MAP_FIRST_HELP_VIEW\)/);
assert.match(mapFirst,/loadViewTemplate\(MAP_FIRST_HELP_VIEW\)/);
assert.match(mapFirst,/mountMapFirstHelp\(section\)/);
assert.match(mapFirst,/section\.isConnected/);
assert.match(mapFirst,/createContextualFragment\(source\)/);
for(const marker of["There is one colony map","Tap selects","persistent action bar","main HUD always shows Housing, Power, effective/installed Industry, free workforce, resource stocks and supply days"])assert.ok(mapHelpView.includes(marker),`missing external map-first help marker ${marker}`);

assert.match(building,/from "\.\/trade-reserve-ui\.js"/);
for(const method of["buildingHero","openColonyBuilding","compactExtractionPanel","tile","landTile"])assert.doesNotMatch(building,new RegExp(`\\n\\s{2}${method}\\(`),`shadowed building-details method must stay removed: ${method}`);
assert.match(adaptive,/isAdaptiveBuilding\(tile\)/);
assert.match(adaptive,/renderAdaptiveBuilding\(tile\)/);
assert.match(adaptive,/developmentOriginalPath/);

assert.match(resource,/UNDEVELOPED_RESOURCE_VIEW="\.\/views\/undeveloped-resource\.html"/);
assert.match(resource,/preloadViewTemplates\(\[UNDEVELOPED_RESOURCE_VIEW\]\)/);
assert.match(resource,/getLoadedViewTemplate\(UNDEVELOPED_RESOURCE_VIEW\)/);
assert.match(resource,/loadViewTemplate\(UNDEVELOPED_RESOURCE_VIEW\)/);
assert.match(resource,/activeUndevelopedTile===tile/);
assert.match(resource,/createContextualFragment\(source\)/);
assert.match(resource,/panel\.replaceChildren\(fragment\)/);
assert.doesNotMatch(resource,/panel\.innerHTML\s*=/);
assert.match(resource,/populateResourceRequirements/);
for(const marker of["data-undeveloped-resource-view","data-resource-requirement-template","data-resource-requirements","DEVELOP SITE","WHEN DEVELOPED"])assert.ok(resourceView.includes(marker),`missing undeveloped-resource view marker ${marker}`);

for(const [name,source] of Object.entries({contract,industry,mapFirst,building,resource}))assert.equal(largeHtmlTemplates(source).length,0,`${name} must not regain a large inline application template`);
console.log("final Phase-4 external view ownership test passed");
