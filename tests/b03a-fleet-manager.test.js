import assert from "node:assert/strict";
import fs from "node:fs";

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const index=read("index.html"),shipPrep=read("js/ui/ship-preparation-ui.js"),shipNav=read("js/ui/ship-navigation-ui.js"),fleetView=read("views/fleet-manager.html"),starMap=read("views/star-map-screen.html"),spaceport=read("views/player-fleet-spaceport.html"),css=read("css/ship-expansion.css"),mapCss=read("css/map-first.css"),preload=read("js/ui/ship-view-preload.js");

assert.match(index,/id="fleetBtn"/);
assert.match(index,/<button id="tradeBtn" disabled>CORP SHIP<\/button><button id="fleetBtn">FLEET<\/button><button id="starMapBtn">STAR MAP<\/button><button id="menuBtn">/);
assert.match(mapCss,/\.app-footer \.primary-controls\{grid-template-columns:minmax\(0,1\.45fr\)/);

assert.match(shipPrep,/openFleetManager\(/);
assert.match(shipPrep,/views\/fleet-manager\.html/);
assert.match(shipPrep,/fleetStatusFilter/);
assert.match(shipPrep,/data-fleet-open/);
assert.match(shipPrep,/_panelReturn="fleet"/);
assert.doesNotMatch(shipPrep,/Fleet Manager coming online/);
assert.match(shipPrep,/#fleetBtn/);

assert.match(shipNav,/ret==="fleet"/);
assert.match(shipNav,/data-open-fleet-manager/);
assert.match(shipNav,/lostShipPanel\(revision,ship,"shipControlRevision"\)/);

assert.match(fleetView,/data-fleet-manager/);
assert.match(fleetView,/data-fleet-sort="name"/);
assert.match(fleetView,/data-fleet-status-chips/);
assert.match(fleetView,/OPEN SHIP CONTROLS/);
assert.doesNotMatch(fleetView,/BUYERS SERVICE/);
assert.doesNotMatch(fleetView,/COLONY SERVICES/);
assert.doesNotMatch(fleetView,/LAUNCH/);

assert.match(starMap,/data-open-fleet-manager/);
assert.match(spaceport,/data-open-fleet-manager/);
assert.match(preload,/fleet-manager\.html/);
assert.match(css,/\.fleet-manager/);
assert.match(css,/\.fleet-row/);
assert.match(css,/\.fleet-chip/);

console.log("B03a Fleet Manager surface ownership passed");
