import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const sell=read("views/quick-trade-sell.html"),buy=read("views/quick-trade-buy.html"),playerShip=read("js/ui/player-ship-ui.js"),worldView=read("js/ui/world-view.js"),worldRuntime=read("js/ui/world-view-runtime.js"),starMap=read("views/star-map-screen.html"),planetTable=read("views/planet-table.html"),index=read("index.html"),operational=read("js/ui/operational-controls-ui.js"),mapFirstCss=read("css/map-first.css");

const sellClose=sell.lastIndexOf("</section>");
assert.ok(sellClose>0&&sell.indexOf("data-sell-row-template")<sellClose,"Sell row template must live inside the mounted sell-view root");
const buyClose=buy.lastIndexOf("</section>");
assert.ok(buyClose>0&&buy.indexOf("data-buy-category-template")<buyClose&&buy.indexOf("data-buy-row-template")<buyClose,"Buy templates must live inside the mounted buy-view root");

const selectStart=playerShip.indexOf("selectMapTile(x,y)");
const selectEnd=playerShip.indexOf("contextParts(tile)",selectStart);
const selectSource=playerShip.slice(selectStart,selectEnd);
assert.ok(selectSource.includes("this.playerShipPanel();return;"),"Landed ship selection must open the player ship panel directly");
assert.ok(selectSource.indexOf("this.playerShipPanel();return;")<selectSource.indexOf("super.selectMapTile(x,y)"),"Player ship interception must happen before generic map selection");
assert.doesNotMatch(playerShip,/playerShipClickGuard|playerShipOpeningPointer|playerShipLastPointerUp/,"Player Ship panel must not need a ghost-click workaround when canvas activation is click-owned");

const inputStart=worldView.indexOf("bindInput(){");
const inputEnd=worldView.indexOf("addSelection(c)",inputStart);
const inputSource=worldView.slice(inputStart,inputEnd);
const pointerUpStart=inputSource.indexOf('addEventListener("pointerup"');
const clickStart=inputSource.indexOf('addEventListener("click"');
assert.ok(pointerUpStart>=0&&clickStart>pointerUpStart,"Canvas input must keep gesture completion separate from click activation");
assert.doesNotMatch(inputSource.slice(pointerUpStart,clickStart),/this\.onTap\?\./,"pointerup must never perform normal canvas activation");
assert.match(inputSource.slice(clickStart),/this\.onTap\?\./,"click must own normal canvas activation");
assert.match(inputSource,/suppressClick=true/,"Consumed pointer gestures must suppress their follow-on click");
assert.doesNotMatch(worldRuntime,/bindPlayerShipCapture|_shipPointer|_shipCaptureHandlers|onPlayerShipClick/,"Active WorldView must not maintain a ship-specific pointer activation path");

assert.match(starMap,/star-system-detail-host[^>]*>\s*\{\{CORPORATE_TRADE\}\}\s*\{\{SYSTEM_DETAIL\}\}\s*<\/div>/,"Optional corporate trade control must remain inside the Star Map detail row so it cannot shift the canvas out of the full-screen grid");
assert.ok(starMap.indexOf("{{CORPORATE_TRADE}}")<starMap.indexOf("exp-map-wrap"),"Corporate trade control must render above, not as a sibling after, Star Map detail");
assert.match(planetTable,/<template data-planet-colony-template>\s*<[^>]+>\s*<[^>]+data-planet-colony-name/,"Planet colony-name marker must be a descendant of the cloned template root because renderPlanetColonies queries inside that root");

for(const type of["food","build","fuel","ore"]){assert.match(index,new RegExp(`id="${type}ResourceHud"`),`${type} resource card needs a trend-state owner`);assert.match(index,new RegExp(`id="${type}DaysHud"`),`${type} resource card needs days remaining`);assert.match(index,new RegExp(`id="${type}Stock"[^>]*>0 \\+0 -0 S0`),`${type} resource card should expose the compact stock/production/consumption/surplus format`);}
assert.match(operational,/RESOURCE_FLOW_METRICS/);assert.match(operational,/build:\{production:"buildProduction",consumption:"buildDemand"\}/,"Build must participate in the same flow HUD even though its current daily demand is zero");assert.match(operational,/resourceFlowText\(flow\)/);assert.match(operational,/S\$\{sign\}/,"surplus must retain an explicit S prefix and sign");assert.match(operational,/resourceDaysText\(days\).*∞d/);assert.match(operational,/card\.classList\.toggle\("good",!flow\.declining\)/);assert.match(operational,/card\.classList\.toggle\("bad",flow\.declining\)/);assert.match(mapFirstCss,/\.resource-hud\.good\{background:#102919\}/);assert.match(mapFirstCss,/\.resource-hud\.bad\{background:#3a1416\}/);assert.match(mapFirstCss,/font-variant-numeric:tabular-nums/);

console.log("post-refactor ship/trade/star-map/resource-HUD regression ownership contract passed");
