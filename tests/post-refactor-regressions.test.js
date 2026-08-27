import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const sell=read("views/quick-trade-sell.html"),buy=read("views/quick-trade-buy.html"),playerShip=read("js/ui/player-ship-ui.js"),shipNav=read("js/ui/ship-navigation-ui.js"),starMap=read("views/star-map-screen.html"),planetTable=read("views/planet-table.html");

const sellClose=sell.lastIndexOf("</section>");
assert.ok(sellClose>0&&sell.indexOf("data-sell-row-template")<sellClose,"Sell row template must live inside the mounted sell-view root");
const buyClose=buy.lastIndexOf("</section>");
assert.ok(buyClose>0&&buy.indexOf("data-buy-category-template")<buyClose&&buy.indexOf("data-buy-row-template")<buyClose,"Buy templates must live inside the mounted buy-view root");

const selectStart=playerShip.indexOf("selectMapTile(x,y)");
const selectEnd=playerShip.indexOf("contextParts(tile)",selectStart);
const selectSource=playerShip.slice(selectStart,selectEnd);
assert.ok(selectSource.includes("this.playerShipPanel();return;"),"Landed ship selection must open the player ship panel directly");
assert.ok(selectSource.indexOf("this.playerShipPanel();return;")<selectSource.indexOf("super.selectMapTile(x,y)"),"Player ship interception must happen before generic map selection");
assert.match(playerShip,/addEventListener\("pointerup",this\.playerShipPointerTracker,true\)/,"Player ship UI must snapshot the opening pointer gesture");
assert.match(playerShip,/addEventListener\("click",this\.playerShipClickGuard,true\)/,"Player ship UI must capture action clicks before the active navigation handler");
assert.match(playerShip,/Math\.hypot\(event\.clientX-opening\.x,event\.clientY-opening\.y\)<=24/,"Player ship click-through guard must match the opening gesture coordinates");
assert.match(playerShip,/stopImmediatePropagation\(\)/,"Player ship opening click-through must be stopped before STAR MAP action handlers run");
assert.match(shipNav,/playerShipPanel\(\)[\s\S]*this\.open\("Player Colony Ship"/,"Active ship-navigation override must still open through the guarded Player Colony Ship presentation path");

assert.match(starMap,/star-system-detail-host[^>]*>\s*\{\{CORPORATE_TRADE\}\}\s*\{\{SYSTEM_DETAIL\}\}\s*<\/div>/,"Optional corporate trade control must remain inside the Star Map detail row so it cannot shift the canvas out of the full-screen grid");
assert.ok(starMap.indexOf("{{CORPORATE_TRADE}}")<starMap.indexOf("exp-map-wrap"),"Corporate trade control must render above, not as a sibling after, Star Map detail");
assert.match(planetTable,/<template data-planet-colony-template>\s*<[^>]+>\s*<[^>]+data-planet-colony-name/,"Planet colony-name marker must be a descendant of the cloned template root because renderPlanetColonies queries inside that root");

console.log("post-refactor ship/trade/star-map regression ownership contract passed");
