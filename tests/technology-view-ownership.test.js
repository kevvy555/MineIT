import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/technology-presentation-ui.js"),buildChoice=read("views/build-choice.html"),localBuilding=read("views/local-building-panel.html"),localInfrastructure=read("views/local-infrastructure-card.html"),technology=read("views/corporate-technology.html"),manual=read("views/survival-manual.html");
for(const path of["./views/build-choice.html","./views/local-building-panel.html","./views/local-infrastructure-card.html","./views/corporate-technology.html"])assert.ok(ui.includes(path),`missing technology presentation view path: ${path}`);
for(const marker of["data-build-choice-option-template","data-build-choice-requirement-template","data-build-choice-options"])assert.ok(buildChoice.includes(marker),`missing construction-choice view marker: ${marker}`);
for(const marker of["data-local-upgrade-block","data-local-upgrade","data-demolish"])assert.ok(localBuilding.includes(marker),`missing local-building view marker: ${marker}`);
for(const marker of["LOCAL INFRASTRUCTURE","data-local-housing","data-ship-industry"])assert.ok(localInfrastructure.includes(marker),`missing local-infrastructure marker: ${marker}`);
for(const marker of["data-tech-path-template","data-tech-card-template","data-tech-card-action","data-tech-toggle"])assert.ok(technology.includes(marker),`missing technology roadmap view marker: ${marker}`);
for(const marker of["createDocumentFragment","cloneNode(true)","replaceChildren","body.isConnected"])assert.ok(ui.includes(marker),`missing bounded DOM marker: ${marker}`);
for(const rule of["Housing, Power and Industry are individual L1–L5 map buildings","technology limits sophistication, not quantity","Mining is the exception","Local construction uses physical colony resources, not corporation cash"])assert.ok(manual.includes(rule),`missing externally owned technology help rule: ${rule}`);
assert.doesNotMatch(ui,/\.innerHTML\s*=/,"technology presentation must not rebuild extracted views through innerHTML");
assert.doesNotMatch(ui,/replaceSection\(/,"technology presentation must not replace manual sections after render");
assert.doesNotMatch(ui,/\n\s{2}help\(\)/,"technology presentation help must inherit the external manual rather than override sections");
console.log("technology presentation external view ownership contract passed");
