import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

const index=read("index.html"),appCss=read("css/app.css"),worldCss=read("css/world.css"),mapFirstCss=read("css/map-first.css"),buildingCss=read("css/building-details.css"),resourceDetailsCss=read("css/resource-details.css"),adaptiveBuildingCss=read("css/adaptive-building-details.css"),shipExpansionCss=read("css/ship-expansion.css"),shipExpansion5113Css=read("css/ship-expansion-v5113.css");

// Stable application-shell ownership.
assert.doesNotMatch(index,/world-view-hotfix/);for(const id of["overlayRoot","contextBar","colonyNavStrip","mapViewHost","world","tradeBtn","menuBtn"])assert.match(index,new RegExp(`id="${id}"`));assert.doesNotMatch(index,/mapFilterHost/);
for(const target of["game-state-runtime","portfolio-service","resource-service","collection-service","colony-service","development-service","site-service","technology-service","simulation-engine","trade-service"])assert.match(index,new RegExp(`js/domain/${target}\\.js`),`domain runtime must terminate at ${target}`);

// Layout responsibilities stay in CSS, not runtime-injected style tags.
assert.match(appCss,/grid-template-rows:auto minmax\(0,1fr\) auto/);assert.doesNotMatch(appCss,/minmax\(160px,1fr\)/);assert.match(mapFirstCss,/#app\{grid-template-rows:auto minmax\(0,1fr\) auto auto\}/);assert.match(worldCss,/#worldShell\{[^}]*grid-template-rows:var\(--map-toolbar-height\) minmax\(0,1fr\)/);assert.match(worldCss,/#overlayRoot\{[^}]*pointer-events:none/);assert.match(worldCss,/#overlayRoot>\.panel,#overlayRoot>\.error-badge\{pointer-events:auto\}/);
assert.match(buildingCss,/\.building-detail-hero/);assert.match(resourceDetailsCss,/\.resource-detail-hero/);assert.match(adaptiveBuildingCss,/\.adaptive-building-hero/);assert.match(adaptiveBuildingCss,/\.adaptive-building-mode-buttons/);assert.match(adaptiveBuildingCss,/\.adaptive-building-requirements/);assert.match(adaptiveBuildingCss,/\.adaptive-building-actions/);for(const marker of[/\.exp-map-wrap/,/\.exp-ship-strip/,/\.exp-planets/,/touch-action:none/,/\.ship-action-grid/,/\.colony-nav-strip/,/\.full-screen-panel/,/\.exp-planet-table/,/\.demolition-confirm/,/\.danger-close/])assert.match(shipExpansionCss,marker);for(const marker of[/\.compact-ship-prep/,/\.exp-load-overview/,/\.exp-load-meter/,/\.exp-planet-sort/])assert.match(shipExpansion5113Css,marker);

// Active presentation layer still exposes the important current features during the UI cleanup phase.
const activeWorld=read("js/ui/world-view-v5112.js"),activeUi=read("js/ui/ui-controller-v5113.js"),activeTrade=read("js/ui/quick-trade-ui-v5111.js"),controls=read("js/ui/map-controls-v581.js"),resourceIcons=read("js/ui/resource-icons-v597.js"),baseUi=read("js/ui/ui-controller.js");
assert.match(activeWorld,/mineit:player-ship-clicked/);assert.match(activeWorld,/stopImmediatePropagation/);assert.match(activeUi,/planetSortHeader/);assert.match(activeUi,/availableCargoCategories/);assert.match(activeUi,/manifestOverview/);assert.match(activeTrade,/CORP SHIP • TRADE!/);assert.match(controls,/replaceChildren/);assert.match(resourceIcons,/resource-atlas-256\.webp/);assert.match(baseUi,/export function mix/);assert.match(baseUi,/Object\.getPrototypeOf/);
for(const [name,source] of Object.entries({activeWorld,activeUi,activeTrade,controls,resourceIcons,baseUi})){assert.doesNotMatch(source,/prototype\.[A-Za-z0-9_$]+\s*=/,`${name} must not monkey-patch prototypes`);assert.doesNotMatch(source,/createElement\(["']style["']\)/,`${name} must not inject runtime styles`);}

console.log("presentation architecture ownership invariants passed");
