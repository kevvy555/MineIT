import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const ui=read("js/ui/survival-ui.js"),lost=read("views/survival-colony-lost.html"),failed=read("views/corporation-failed.html"),managedLost=read("views/colony-lost.html"),resourceCatalog=read("views/survival-resource-catalog.html"),manual=read("views/survival-manual.html");

assert.match(ui,/\.\/views\/survival-colony-lost\.html/);
assert.match(ui,/\.\/views\/corporation-failed\.html/);
assert.match(ui,/\.\/views\/survival-resource-catalog\.html/);
assert.doesNotMatch(ui,/\.\/views\/colony-lost\.html/,"survival notification must not steal the detailed dead-colony management view");
assert.match(ui,/preloadViewTemplates\(Object\.values\(SURVIVAL_VIEWS\)\)/);
assert.doesNotMatch(ui,/await\s+preloadViewTemplates/);
assert.match(ui,/getLoadedViewTemplate\(path\)/);
assert.match(ui,/this\.state\.status==="dead"&&!this\.state\.company\.gameOver/);
assert.match(ui,/this\.state\.company\.gameOver=true;this\.repo\.save\(this\.state\);return this\.renderGameOver\(\)/);
assert.match(ui,/document\.createDocumentFragment\(\)/);
assert.match(ui,/cloneNode\(true\)/);
assert.match(ui,/replaceChildren\(rowFragment\)/);
assert.match(ui,/host\.replaceChildren\(categories\)/);
assert.equal(largeHtmlTemplates(ui).length,0,"survival-ui.js must not regain large inline presentation templates");

for(const marker of["data-survival-colony-lost-view","data-lost-colony-name","data-lost-colony-status","data-lost-colonies"])assert.ok(lost.includes(marker),`missing survival colony-lost marker ${marker}`);
for(const marker of["data-corporation-failed-view","data-gameover-colonies","data-gameover-reset"])assert.ok(failed.includes(marker),`missing corporation-failed marker ${marker}`);
for(const marker of["data-help-resource-catalog","data-help-resource-category-template","data-help-resource-row-template","data-help-resource-rows"])assert.ok(resourceCatalog.includes(marker),`missing help resource-catalog marker ${marker}`);
for(const marker of["data-colony-death-date","data-colony-final-industry","data-abandon-dead"])assert.ok(managedLost.includes(marker),`detailed dead-colony management view must remain intact: ${marker}`);
assert.match(manual,/\{\{RESOURCES\}\}/);
assert.match(manual,/Survival, shortages &amp; colony death/);

console.log("MineIT survival terminal/help view ownership test passed");
