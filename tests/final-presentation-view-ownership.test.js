import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const contract=read("js/ui/contract-ui.js"),industry=read("js/ui/industry-ui.js"),failedView=read("views/contract-failed.html"),capacityView=read("views/industry-capacity-card.html");

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

assert.equal(largeHtmlTemplates(contract).length,0,"contract UI must not regain a large inline application template");
assert.equal(largeHtmlTemplates(industry).length,0,"industry UI must not regain a large inline application template");
console.log("contract + Industry external view ownership test passed");
