import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html");
assert.match(index,/css\/app\.css\?v=5\.6\.0/);
assert.match(index,/css\/world\.css\?v=5\.6\.0/);
assert.match(index,/css\/land\.css\?v=5\.6\.0/);
for(const css of["panels","portfolio","trade-quality","ui-enhancements"])
  assert.match(index,new RegExp(`css/${css}\\.css\\?v=5\\.5\\.5`));
assert.match(index,/js\/app\.js\?v=5\.5\.5/);
assert.match(index,/type="importmap"/);
assert.match(index,/world-view-v56\.js\?v=5\.6\.0/);
assert.match(index,/ui-controller-v56\.js\?v=5\.6\.0/);
assert.match(index,/v55-trade-ui-v56\.js\?v=5\.6\.0/);
assert.match(index,/id="overlayRoot"/);
assert.doesNotMatch(index,/mapFilterHost/);
assert.doesNotMatch(index,/world-view-hotfix/);

const app=read("js/app.js");
for(const module of["game-state","portfolio-service","resource-service","inventory-service","collection-service","colony-service","trade-service","land-service","development-service","world-service","site-service","technology-service","survey-service","simulation-engine","game-log-service","transport-service"])
  assert.match(app,new RegExp(`domain/${module}\\.js\\?v=5\\.5\\.5`));
assert.match(app,/ui\/world-view\.js\?v=5\.5\.5/);
assert.match(app,/ui\/ui-controller\.js\?v=5\.5\.5/);
assert.match(app,/ui\/v55-trade-ui\.js\?v=5\.5\.5/);
assert.match(app,/advanceGlobalDate/);
assert.match(app,/processPendingShipEvent/);
assert.match(app,/startup failed/);
assert.match(app,/STARTUP ERROR • TAP FOR DETAILS/);

const v56=read("js/ui/world-view-v56.js");
assert.match(v56,/extends CanvasWorldView/);
assert.match(v56,/new MapControls/);
assert.match(read("js/ui/ui-controller-v56.js"),/extends LegacyUIController/);
assert.match(read("js/ui/v55-trade-ui-v56.js"),/extends LegacyTradeUI/);
console.log("MineIT v5.6 presentation composition startup coherence test passed");
