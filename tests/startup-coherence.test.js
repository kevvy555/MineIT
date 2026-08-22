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
assert.match(index,/resource-service-v562\.js\?v=5\.6\.2/);
assert.match(index,/collection-service\.js\?v=5\.6\.2/);
assert.match(index,/colony-service-v563\.js\?v=5\.6\.3/);
assert.match(index,/development-service-v563\.js\?v=5\.6\.3/);
assert.match(index,/site-service-v563\.js\?v=5\.6\.3/);
assert.match(index,/simulation-engine-v562\.js\?v=5\.6\.2/);
assert.match(index,/world-view-v56\.js\?v=5\.6\.2/);
assert.match(index,/ui-controller-v563\.js\?v=5\.6\.3/);
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

const v56=read("js/ui/world-view-v56.js"),ui=read("js/ui/ui-controller.js"),ui56=read("js/ui/ui-controller-v56.js"),ui563=read("js/ui/ui-controller-v563.js");
assert.match(v56,/extends CanvasWorldView/);
assert.match(v56,/new MapControls/);
assert.match(v56,/land-art\.js\?v=5\.6\.1/);
assert.match(v56,/developmentAtlasPath/);
assert.match(v56,/drawDevelopmentFrame/);
assert.match(v56,/CLOSED \$\{closed\}D/);
assert.match(ui,/resource-ui-v562\.js\?v=5\.6\.2/);
assert.match(ui56,/ui-controller\.js\?v=5\.6\.2&legacy=1/);
assert.match(ui56,/extends LegacyUIController/);
assert.match(ui563,/ui-controller-v56\.js\?v=5\.6\.2&legacy=1/);
assert.match(ui563,/extends V56UIController/);
assert.match(read("js/ui/v55-trade-ui-v56.js"),/extends LegacyTradeUI/);
console.log("MineIT v5.6.3 external-cash startup coherence test passed");
