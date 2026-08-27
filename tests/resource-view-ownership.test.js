import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/resource-ui.js"),viewTemplate=read("js/core/view-template.js"),activeCollection=read("js/ui/v55-ui.js"),unsurveyed=read("views/resource-unsurveyed-panel.html"),site=read("views/resource-site-panel.html"),overdrive=read("views/resource-overdrive-card.html"),company=read("views/corporation-summary.html");
for(const path of["./views/resource-unsurveyed-panel.html","./views/resource-site-panel.html","./views/resource-overdrive-card.html","./views/corporation-summary.html"])assert.ok(ui.includes(path),`missing resource presentation path: ${path}`);
for(const marker of["data-survey-hint","data-survey-time","data-scan"])assert.ok(unsurveyed.includes(marker),`missing unsurveyed marker: ${marker}`);
for(const marker of["data-resource-site-grid","data-mining-requirement","data-develop","data-upgrade","data-emergency-pause"])assert.ok(site.includes(marker),`missing resource-site marker: ${marker}`);
for(const marker of["data-overdrive-card","data-overdrive-shutdown","data-site-mode-template","data-overdrive-effect"])assert.ok(overdrive.includes(marker),`missing overdrive marker: ${marker}`);
for(const marker of["data-corporation-summary","data-company-cash","data-company-operating-cost","data-colonies"])assert.ok(company.includes(marker),`missing corporation-summary marker: ${marker}`);
for(const marker of["preloadViewTemplates(Object.values(RESOURCE_VIEW_PATHS))","getLoadedViewTemplate","createContextualFragment","replaceChildren","cloneNode(true)"])assert.ok(ui.includes(marker),`missing synchronous external resource-view ownership marker: ${marker}`);
assert.doesNotMatch(ui,/await\s+preloadViewTemplates\(/,"resource view preload must not delay module evaluation or DOMContentLoaded registration");
assert.match(viewTemplate,/getLoadedViewTemplate/);assert.match(viewTemplate,/Promise\.allSettled/);assert.match(viewTemplate,/templateCache\.delete/);
assert.equal(largeHtmlTemplates(ui).length,0,"resource-ui must not retain large embedded HTML templates");
assert.doesNotMatch(ui,/\n\s{2}currentCollection\(\)/,"shadowed base collection renderer must stay removed");assert.match(activeCollection,/\n\s{2}currentCollection\(\)/,"active V55 collection owner must remain available");
assert.doesNotMatch(ui,/\.innerHTML\s*=/,"resource UI must not rebuild extracted views with innerHTML");
assert.match(ui,/\n\s{2}tile\(tile\)/,"resource tile public contract must remain synchronous for downstream decorators");assert.doesNotMatch(ui,/async\s+tile\(tile\)/);
console.log("resource presentation external synchronous view ownership contract passed");
