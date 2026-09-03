import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

const shipNav=read("js/ui/ship-navigation-ui.js"),shipPrep=read("js/ui/ship-preparation-ui.js"),adaptive=read("js/ui/adaptive-building-ui.js"),shipView=read("views/ship-control.html"),colonyView=read("views/colony-control.html"),koplinView=read("views/koplin-terminal.html"),css=read("css/ship-expansion.css");

assert.match(shipNav,/views\/ship-control\.html/);
assert.match(shipNav,/data-csm-open|csmLinked|commandStatus/);
assert.match(shipView,/CARGO BAY/);assert.match(shipView,/FLEET MANAGER/);assert.match(shipView,/OPEN COLONY CONTROL|data-csm-open/);
assert.doesNotMatch(shipView,/BUYERS SERVICE/);assert.doesNotMatch(shipView,/>SPACEPORT</);

assert.match(shipPrep,/colonyControl\(/);assert.match(shipPrep,/koplinTerminal\(/);assert.match(shipPrep,/fleetManager\(/);assert.match(shipPrep,/openFleetManager\(/);
assert.match(shipPrep,/networkAvailable/);assert.match(shipPrep,/headquartersContinuity/);
assert.match(shipPrep,/views\/fleet-manager\.html/);
assert.match(colonyView,/COLONY SERVICES/);assert.match(colonyView,/data-koplin-connect/);
assert.match(koplinView,/BUYERS SERVICE/);assert.match(koplinView,/FLEET PROCUREMENT/);assert.match(koplinView,/data-koplin-service="star-map"/);

assert.match(adaptive,/openPrimaryHeadquarters/);assert.match(adaptive,/isPrimaryHeadquarters/);
assert.match(css,/\.csm-module-bay/);assert.match(css,/\.koplin-os/);

console.log("N04 Colony Control / Ship Control / Koplin surface ownership passed");
