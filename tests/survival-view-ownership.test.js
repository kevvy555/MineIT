import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const ui=read("js/ui/survival-ui.js"),lost=read("views/survival-colony-lost.html"),failed=read("views/corporation-failed.html"),managedLost=read("views/colony-lost.html"),manual=read("views/survival-manual.html");

assert.match(ui,/\.\/views\/survival-colony-lost\.html/);
assert.match(ui,/\.\/views\/corporation-failed\.html/);
assert.doesNotMatch(ui,/\.\/views\/colony-lost\.html/,"survival notification must not steal the detailed dead-colony management view");
assert.match(ui,/preloadViewTemplates\(Object\.values\(SURVIVAL_VIEWS\)\)/);
assert.doesNotMatch(ui,/await\s+preloadViewTemplates/);
assert.match(ui,/getLoadedViewTemplate\(path\)/);
assert.match(ui,/loadViewTemplate\(path\)\.then/);
assert.match(ui,/this\.state\.status==="dead"&&!this\.state\.company\.gameOver/);
assert.match(ui,/this\.state\.company\.gameOver=true;this\.repo\.save\(this\.state\);return this\.renderGameOver\(\)/);
assert.equal(largeHtmlTemplates(ui).length,0,"survival-ui.js must not regain large inline presentation templates");

for(const marker of["data-survival-colony-lost-view","data-lost-colony-name","data-lost-colony-status","data-lost-colonies"])assert.ok(lost.includes(marker),`missing survival colony-lost marker ${marker}`);
for(const text of["HAS BEEN LOST","life-support failure","VIEW SURVIVING COLONIES"])assert.ok(lost.includes(text),`missing survival colony-lost copy ${text}`);
for(const marker of["data-corporation-failed-view","data-gameover-colonies","data-gameover-reset"])assert.ok(failed.includes(marker),`missing corporation-failed marker ${marker}`);
for(const text of["ALL COLONIES LOST","Mining operations have ended","START NEW CORPORATION"])assert.ok(failed.includes(text),`missing corporation-failed copy ${text}`);
for(const marker of["data-colony-death-date","data-colony-final-industry","data-abandon-dead"])assert.ok(managedLost.includes(marker),`detailed dead-colony management view must remain intact: ${marker}`);
assert.match(manual,/Survival, shortages &amp; colony death/);
assert.match(ui,/survival-manual\.html/);

console.log("MineIT survival terminal-view ownership test passed");
