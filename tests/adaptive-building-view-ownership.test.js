import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const ui=read("js/ui/adaptive-building-ui.js"),view=read("views/adaptive-building.html"),resources=read("js/domain/resource-service.js");

assert.match(ui,/\.\/views\/adaptive-building\.html/);
assert.match(ui,/preloadViewTemplates\(\[ADAPTIVE_BUILDING_VIEW\]\)/);
assert.doesNotMatch(ui,/await\s+preloadViewTemplates/);
assert.match(ui,/getLoadedViewTemplate\(ADAPTIVE_BUILDING_VIEW\)/);
assert.match(ui,/this\.activeAdaptiveTile===tile/);
assert.match(ui,/renderViewSource\(source/);
assert.match(ui,/createContextualFragment\(html\)/);
assert.match(ui,/panel\.replaceChildren\(fragment\)/);
assert.doesNotMatch(ui,/panel\.innerHTML\s*=/);
assert.match(ui,/document\.createDocumentFragment\(\)/);
assert.match(ui,/template\.content\.cloneNode\(true\)/);
assert.match(ui,/host\.replaceChildren\(buttons\)/);
assert.match(ui,/button\[data-adaptive-mode\]/);
assert.match(ui,/this\.resources\.adjustHarvestIntensity\(tile,Number\(button\.dataset\.harvestDelta\)\)/);
assert.match(ui,/setPrimaryHeadquarters\(this\.state,tile\)/,"Headquarters Primary selection must dispatch to the domain service");
for(const marker of["ONLINE CAPACITY","FUEL-LIMITED","FULL FUEL BURN","ACTUAL FUEL USED","power.bandRows"])assert.ok(ui.includes(marker),`missing always-visible Power detail ${marker}`);
assert.doesNotMatch(ui,/tile\.harvestIntensity\s*=/,"adaptive UI must not mutate renewable harvest state directly");
assert.match(resources,/adjustHarvestIntensity\(tile,deltaPercent\)/);
assert.equal(largeHtmlTemplates(ui).length,0,"adaptive-building-ui.js must not retain large inline presentation templates");

for(const marker of["data-adaptive-building-shell","data-adaptive-art","data-adaptive-badges","data-adaptive-mode","data-adaptive-mode-template","data-adaptive-harvest","data-adaptive-primary","data-adaptive-upgrade","data-adaptive-demolish","data-adaptive-close"])assert.ok(view.includes(marker),`missing adaptive-building view marker ${marker}`);
for(const text of["OVERVIEW","OPERATING MODE","Choose mode directly","HARVEST INTENSITY","OPERATIONS","UPGRADE TO NEXT LEVEL","REQUIREMENTS","DEMOLISH","CLOSE"])assert.ok(view.includes(text),`missing adaptive-building view copy ${text}`);

console.log("MineIT adaptive-building view ownership test passed");
