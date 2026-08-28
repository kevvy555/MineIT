import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const colonyTech=read("js/ui/colony-tech-ui.js"),technology=read("js/ui/technology-presentation-ui.js"),lost=read("views/colony-lost.html"),goals=read("views/contract-goals.html");
for(const path of["./views/colony-lost.html","./views/contract-goals.html"])assert.ok(colonyTech.includes(path),`missing colony view path: ${path}`);
for(const marker of["data-colony-lost-view","data-colony-death-date","data-all-colonies","data-abandon-dead"])assert.ok(lost.includes(marker),`missing lost-colony view marker: ${marker}`);
for(const marker of["data-contract-goals-view","data-goals-food","data-goals-profit","data-goals-platinum"])assert.ok(goals.includes(marker),`missing contract-goals view marker: ${marker}`);
for(const marker of["colonyViewSnapshot","colonyViewStillCurrent","loadViewTemplate","renderLostColony"])assert.ok(colonyTech.includes(marker),`missing colony view ownership marker: ${marker}`);
assert.equal(largeHtmlTemplates(colonyTech).length,0,"colony-tech presentation must not retain large embedded HTML templates");
assert.doesNotMatch(colonyTech,/\n\s{2}tech\(\)/,"shadowed legacy technology screen must stay removed from colony-tech-ui");
assert.doesNotMatch(colonyTech,/\n\s{2}techEffect\(/,"shadowed legacy technology effect renderer must stay removed from colony-tech-ui");
assert.doesNotMatch(colonyTech,/EXPAND INDUSTRY|Advanced licences are major corporation-scale investments/,"shadowed non-dead colony/technology presentation must stay removed");
assert.ok(technology.includes("return this.landColonyPanel()"),"active non-dead colony screen must remain owned by the land-first technology layer");
assert.ok(technology.includes("./views/corporate-technology.html"),"active technology screen must remain owned by technology-presentation-ui");
console.log("colony-tech external view ownership contract passed");
