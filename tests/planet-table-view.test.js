import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/ship-preparation-ui.js"),nav=read("js/ui/ship-navigation-ui.js"),view=read("views/planet-table.html");

for(const marker of["planetSortValue","sortedPlanets","planetSortIndicator","planetSortHeader","renderPlanetHeaders","renderPlanetRows","renderPlanetTable","planetFoundState","createDockAction","createFoundAction","planetClickHandler","planet-table.html"])assert.ok(ui.includes(marker),`missing planet-table presentation marker ${marker}`);
for(const marker of["▲","▼","↕","COLONY EXISTS","NO COLONISTS","TECH LOCKED","FOUND COLONY"])assert.ok(ui.includes(marker),`missing preserved planet-table state ${marker}`);
assert.match(ui,/living=colonies\.filter\(c=>c\.status!=="dead"\)/,"only living colonies should expose dock actions");
assert.match(ui,/this\.technology\.meetsRequirements\(this\.state,planet\.requiredTech\)/,"technology service must remain the founding presentation gate");
assert.match(ui,/passengers:ship\.passengers/,"ship passenger state must remain the founding presentation gate");
assert.match(ui,/document\.createDocumentFragment\(\)/);assert.match(ui,/replaceChildren\(fragment\)/);assert.doesNotMatch(ui,/class="exp-planet-table"/,"planet table markup must remain externally owned");
assert.match(ui,/removeEventListener\("click",this\.planetClickHandler\)/,"planet sort delegation must have an explicit disposal owner");

for(const marker of["exp-planet-table-wrap","exp-planet-table","data-planet-table-head","data-planet-table-body","data-planet-sort-template","data-planet-action-header-template","data-planet-row-template","data-planet-colony-template","data-planet-dock-template","data-planet-found-template","exp-planet-actions"])assert.ok(view.includes(marker),`missing external planet-table fragment ${marker}`);
assert.match(nav,/async starSystemDetailMarkup/);assert.match(nav,/await this\.planetTable\(system,arrived\)/);assert.match(nav,/await this\.starSystemDetailMarkup\(selected\)/);assert.match(nav,/if\(revision!==this\.starMapRevision\)return/);

console.log("sortable planet table external-view ownership and behaviour contract passed");
