import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

const shipNav=read("js/ui/ship-navigation-ui.js"),shipPrep=read("js/ui/ship-preparation-ui.js"),adaptive=read("js/ui/adaptive-building-ui.js"),shipView=read("views/ship-control.html"),colonyView=read("views/colony-control.html"),koplinView=read("views/koplin-terminal.html"),css=read("css/ship-expansion.css"),sounds=read("js/core/ui-sounds.js"),ui=read("js/ui/ui-controller.js");

assert.match(shipNav,/views\/ship-control\.html/);
assert.match(shipNav,/data-csm-open|csmLinked|commandStatus/);
assert.match(shipNav,/ship-control-modal","full-screen-panel/);
assert.match(shipView,/CARGO BAY/);assert.match(shipView,/FLEET MANAGER/);assert.match(shipView,/OPEN COLONY CONTROL|data-csm-open/);
assert.match(shipView,/data-ship-metrics/);assert.match(shipView,/data-m-cargo/);
assert.doesNotMatch(shipView,/data-ship-status-strip/);assert.doesNotMatch(shipView,/ship-control-note/);
assert.doesNotMatch(shipView,/BUYERS SERVICE/);assert.doesNotMatch(shipView,/>SPACEPORT</);

assert.match(shipPrep,/colonyControl\(/);assert.match(shipPrep,/koplinTerminal\(/);assert.match(shipPrep,/fleetManager\(/);assert.match(shipPrep,/openFleetManager\(/);
assert.match(shipPrep,/networkAvailable/);assert.match(shipPrep,/headquartersContinuity/);
assert.match(shipPrep,/views\/fleet-manager\.html/);
assert.match(shipPrep,/demolitionPanel\(hqTile\)/);
assert.doesNotMatch(shipPrep,/confirm\(`Demolish/);
assert.match(shipPrep,/colonyControlTile/);
assert.match(shipPrep,/primaryHeadquartersTile\(tile\|\|this\.colonyControlTile\)/);
assert.match(shipPrep,/setHidden\(/);
assert.match(shipNav,/colonyControl\?\.\(\{tile:this\.colonyControlTile\}\)/);
assert.match(colonyView,/COLONY SERVICES/);assert.match(colonyView,/data-koplin-connect/);
assert.doesNotMatch(colonyView,/koplin-creds|USERNAME|PASSWORD/);
assert.match(koplinView,/BUYERS SERVICE/);assert.match(koplinView,/FLEET PROCUREMENT/);assert.match(koplinView,/data-koplin-service="star-map"/);

assert.match(adaptive,/openHeadquartersColonyControl/);assert.match(adaptive,/openPrimaryHeadquarters/);assert.match(adaptive,/isPrimaryHeadquarters/);
assert.match(adaptive,/selectMapTile\(x,y\)/);
assert.match(adaptive,/openHeadquartersColonyControl\(this\.selectedTile\)/);
assert.match(adaptive,/adaptive-building-modal","full-screen-panel/);
assert.match(adaptive,/kind==="headquarters"\?null:data\.modeControl/);
assert.match(adaptive,/kind==="headquarters"\?null:data\.harvestControl/);
assert.match(css,/\.csm-module-bay/);assert.match(css,/\.koplin-os/);assert.match(css,/\.ship-control-strip/);
assert.match(css,/\.colony-service-grid\{display:grid;grid-template-columns:1fr 1fr/);
assert.match(css,/colony-control-shell .adaptive-building-section\[hidden\].*display:none!important/);
assert.doesNotMatch(css,/@media\(max-width:420px\)\{[^}]*colony-service-grid/);
assert.doesNotMatch(css,/\.koplin-creds/);
assert.match(sounds,/playUiClick/);assert.match(ui,/playUiClick/);

const mapFirst=read("js/ui/map-first-ui.js"),tech=read("js/ui/technology-presentation-ui.js"),landUi=read("js/ui/land-ui.js"),resourceDev=read("js/ui/resource-development-ui.js");
assert.match(mapFirst,/COLONY CONTROL/);
assert.match(tech,/build-choice-modal","full-screen-panel/);
assert.match(tech,/demolitionPanel\(tile\)/);
assert.doesNotMatch(tech,/confirm\(`Demolish/);
assert.match(landUi,/demolitionPanel\(tile\)/);
assert.doesNotMatch(landUi,/confirm\(`Demolish the \$\{tile\.name\}/);
assert.match(resourceDev,/demolitionPanel\(tile\)/);
assert.doesNotMatch(resourceDev,/confirm\(`Demolish the depleted/);

console.log("N04 Colony Control / Ship Control / Koplin surface ownership passed");
