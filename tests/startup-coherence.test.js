import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html");
assert.match(index,/css\/app\.css\?v=5\.6\.0/);
assert.match(index,/css\/world\.css\?v=5\.6\.0/);
assert.match(index,/css\/land\.css\?v=5\.6\.0/);
for(const css of["panels","portfolio","trade-quality","ui-enhancements"])assert.match(index,new RegExp(`css/${css}\\.css\\?v=5\\.5\\.5`));
assert.match(index,/js\/app\.js\?v=5\.5\.5/);
assert.match(index,/type="importmap"/);
for(const module of["resource-service-v570","colony-service-v570","development-service-v570","site-service-v570","technology-service-v570","simulation-engine-v570"])assert.match(index,new RegExp(`${module}\\.js\\?v=5\\.7\\.0`));
assert.match(index,/collection-service\.js\?v=5\.6\.2/);
assert.match(index,/world-view-v570\.js\?v=5\.7\.0/);
assert.match(index,/ui-controller-v570\.js\?v=5\.7\.0/);
assert.match(index,/v55-trade-ui-v56\.js\?v=5\.6\.0/);
assert.match(index,/id="overlayRoot"/);
assert.doesNotMatch(index,/mapFilterHost/);
assert.doesNotMatch(index,/world-view-hotfix/);

const app=read("js/app.js");
for(const module of["game-state","portfolio-service","resource-service","inventory-service","collection-service","colony-service","trade-service","land-service","development-service","world-service","site-service","technology-service","survey-service","simulation-engine","game-log-service","transport-service"])assert.match(app,new RegExp(`domain/${module}\\.js\\?v=5\\.5\\.5`));
assert.match(app,/ui\/world-view\.js\?v=5\.5\.5/);assert.match(app,/ui\/ui-controller\.js\?v=5\.5\.5/);assert.match(app,/ui\/v55-trade-ui\.js\?v=5\.5\.5/);assert.match(app,/advanceGlobalDate/);assert.match(app,/processPendingShipEvent/);assert.match(app,/startup failed/);assert.match(app,/STARTUP ERROR • TAP FOR DETAILS/);

const view=read("js/ui/world-view-v570.js"),ui=read("js/ui/ui-controller-v570.js"),tech=read("js/domain/technology-service-v570.js"),development=read("js/domain/development-service-v570.js"),model=read("js/domain/building-model.js");
assert.match(view,/extends LegacyWorldView/);assert.match(view,/LOCAL_BUILDINGS/);assert.match(view,/development\?\.kind!=="power"/);
assert.match(ui,/extends LegacyUIController/);assert.match(ui,/\["housing","power","industry"\]/);assert.match(ui,/MINING \/ EXTRACTION/);assert.match(ui,/corporation technology families/);
assert.match(tech,/technologies-v570\.js\?v=5\.7\.0/);assert.match(tech,/syncBuildingTotals/);assert.match(tech,/maxBuildingLevel/);assert.match(tech,/canExploit/);
assert.match(development,/BUILDING_MODEL/);assert.match(development,/kind==="power"/);assert.doesNotMatch(development,/company\.cash-=/);
assert.match(model,/SHIP_INFRASTRUCTURE/);assert.match(model,/housing:180/);assert.match(model,/power:30/);assert.match(model,/industry:50/);
console.log("MineIT v5.7.0 unified-building startup coherence test passed");
