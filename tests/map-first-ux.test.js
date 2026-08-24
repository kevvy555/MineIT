import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

const pkg=JSON.parse(read("package.json")),index=read("index.html"),controls=read("js/ui/map-controls-v580.js"),controls581=read("js/ui/map-controls-v581.js"),view=read("js/ui/world-view-v580.js"),ui=read("js/ui/ui-controller-v580.js"),ui581=read("js/ui/ui-controller-v581.js"),ui582=read("js/ui/ui-controller-v582.js"),css=read("css/map-first.css");
assert.equal(pkg.version,"5.8.1");
assert.match(index,/map-first\.css\?v=5\.8\.0/);assert.match(index,/map-controls-v581\.js\?v=5\.8\.0/);assert.match(index,/world-view-v580\.js\?v=5\.8\.0/);assert.match(index,/ui-controller-v582\.js\?v=5\.8\.1/);
for(const id of["attentionStrip","housingHud","powerHud","industryHud","workforceHud","foodDaysHud","fuelDaysHud","oreDaysHud","contextBar","contextActions"])assert.match(index,new RegExp(`id="${id}"`),`missing persistent HUD element ${id}`);
assert.doesNotMatch(controls,/\[\["land","LAND"\],\["resource","RESOURCES"\]\]/,"active map controls must not expose two map modes");assert.match(controls,/COLONY MAP/);assert.match(controls,/PROBLEMS/);assert.match(controls,/UPGRADE/);assert.match(controls,/mineit:map-focus/);assert.match(controls581,/externalFocusHandler/);assert.match(controls581,/state\.colony\.land\.focusMode=mode/);
assert.match(view,/view\(\)\{return"resource";\}/);assert.match(view,/drawDevelopment\(c,tile,px,py\)/,"unified map must overlay buildings on resource/terrain rendering");assert.match(view,/mineit:tile-selected/);assert.match(view,/originalTap\?\.\(x,y\)/,"unsurveyed tap must retain one-tap surveying");assert.match(view,/selectedKey/);assert.match(view,/hasProblem/);
assert.match(ui,/attentionStatus\(\)/);assert.match(ui,/contextParts\(tile\)/);assert.match(ui,/runContextAction/);assert.match(ui,/site-develop/);assert.match(ui,/site-upgrade/);assert.match(ui,/local-upgrade/);assert.match(ui,/onPlaceDevelopment/);assert.match(ui,/SHOW POWER/);assert.match(ui,/SHOW INDUSTRY/);assert.match(ui,/GET MINING TECH/);
assert.match(ui581,/HARVEST −25%/);assert.match(ui581,/HARVEST \+25%/);assert.match(ui581,/cycleOperatingMode\(\)/);assert.match(ui581,/collection\.setOperatingMode/);assert.match(ui581,/this\.selectedTile=this\.world\.get/);assert.match(ui581,/SHOW ORE/);assert.match(ui581,/data-context-action="colony"/);
assert.match(ui582,/pendingEvents/);assert.match(ui582,/OPEN DECISION/);assert.match(ui582,/OPEN SHIP/);assert.match(ui582,/onProcessPendingEvent/);
assert.match(css,/#app\{grid-template-rows:auto minmax\(0,1fr\) auto auto\}/);assert.match(css,/\.context-bar/);assert.match(css,/\.operational-grid/);assert.match(css,/\.attention-strip/);assert.match(css,/\.primary-controls/);
console.log("MineIT v5.8.1 map-first UX and corporate-event regression test passed");
