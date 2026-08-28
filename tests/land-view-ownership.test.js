import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const land=read("js/ui/land-ui.js"),technology=read("js/ui/technology-presentation-ui.js"),selection=read("views/landing-site-selection.html"),resource=read("views/land-resource-details.html"),colony=read("views/colony-land-panel.html");

for(const path of["./views/landing-site-selection.html","./views/land-resource-details.html","./views/colony-land-panel.html"])assert.ok(land.includes(path),`missing land presentation view path: ${path}`);
for(const marker of["data-land-candidate-template","data-land-candidates","data-land-cancel"])assert.ok(selection.includes(marker),`missing landing-selection marker: ${marker}`);
for(const marker of["data-land-resource-development",'data-cover="housing"','data-cover="industry"'])assert.ok(resource.includes(marker),`missing resource-detail marker: ${marker}`);
for(const marker of["data-pending-transport-template","data-transport-controls","data-emergency","colony-management","data-reselect"])assert.ok(colony.includes(marker),`missing colony-land marker: ${marker}`);
for(const marker of["loadViewTemplate","landViewSnapshot","landViewStillCurrent","createDocumentFragment","cloneNode(true)","replaceChildren"])assert.ok(land.includes(marker),`missing bounded/asynchronous land-view ownership marker: ${marker}`);
assert.equal(largeHtmlTemplates(land).length,0,"land-ui.js must not retain large embedded HTML templates");
assert.doesNotMatch(land,/\n\s{2}buildChoice\(/,"shadowed base build-choice implementation must stay removed");
assert.doesNotMatch(land,/dev\?\.kind==["']housing["']\|\|dev\?\.kind==["']industry["']/,"shadowed base Housing/Industry detail branch must stay removed");
assert.doesNotMatch(land,/\.innerHTML\s*=/,"land presentation must not rebuild external views through innerHTML");
assert.match(technology,/async landTile\(tile\)/,"technology land override must await the asynchronous base land view");
assert.match(technology,/await super\.landTile\(tile\)/,"technology land override must wait before augmenting resource actions");
assert.match(technology,/async landColonyPanel\(\)/,"technology colony-land override must await the asynchronous base colony view");
assert.match(technology,/await super\.landColonyPanel\(\)/,"technology colony-land override must wait before augmenting metrics/infrastructure");
console.log("land presentation external view ownership contract passed");
