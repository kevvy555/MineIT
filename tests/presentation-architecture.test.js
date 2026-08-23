import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

const index=read("index.html");
const appCss=read("css/app.css");
const worldCss=read("css/world.css");
const view=read("js/ui/world-view-v56.js");
const controls=read("js/ui/map-controls.js");
const ui=read("js/ui/ui-controller-v56.js");
const cashUi=read("js/ui/ui-controller-v563.js");
const helpUi=read("js/ui/ui-controller-v564.js");
const tradeAdapter=read("js/ui/v55-trade-ui-v56.js");

assert.doesNotMatch(index,/world-view-hotfix/);
assert.match(index,/id="overlayRoot"/);
assert.doesNotMatch(index,/mapFilterHost/);
assert.match(index,/type="importmap"/);
assert.match(index,/world-view-v56\.js\?v=5\.6\.2/);
assert.match(index,/ui-controller-v564\.js\?v=5\.6\.4/);
assert.match(index,/v55-trade-ui-v56\.js\?v=5\.6\.0/);

assert.match(appCss,/grid-template-rows:auto minmax\(0,1fr\) auto/);
assert.doesNotMatch(appCss,/minmax\(160px,1fr\)/);
assert.match(worldCss,/#worldShell\{[^}]*grid-template-rows:var\(--map-toolbar-height\) minmax\(0,1fr\)/);
assert.match(worldCss,/#overlayRoot\{[^}]*pointer-events:none/);
assert.match(worldCss,/#overlayRoot>\.panel,#overlayRoot>\.error-badge\{pointer-events:auto\}/);

assert.match(view,/extends CanvasWorldView/);
assert.match(view,/new MapControls/);
assert.match(view,/world-view\.js\?v=5\.5\.5&legacy=1/);
assert.match(view,/canvas\.style\.removeProperty\("width"\)/);
assert.match(view,/canvas\.style\.removeProperty\("height"\)/);
assert.doesNotMatch(view,/prototype\./);
assert.doesNotMatch(view,/createElement\("style"\)/);
assert.match(controls,/class MapControls/);
assert.match(controls,/replaceChildren\(\)/);
assert.match(controls,/map-toolbar-main/);

assert.match(ui,/class UIController extends LegacyUIController/);
assert.match(ui,/ui-controller\.js\?v=5\.6\.2&legacy=1/);
assert.match(ui,/addEventListener\("click"/);
assert.match(ui,/stopImmediatePropagation\(\)/);
assert.match(ui,/setSpeed\(next\)/);
assert.match(cashUi,/class UIController extends V56UIController/);
assert.match(cashUi,/ui-controller-v56\.js\?v=5\.6\.2&legacy=1/);
assert.doesNotMatch(cashUi,/prototype\./);
assert.doesNotMatch(cashUi,/createElement\("style"\)/);
assert.match(helpUi,/class UIController extends V563UIController/);
assert.match(helpUi,/ui-controller-v563\.js\?v=5\.6\.3&legacy=1/);
assert.doesNotMatch(helpUi,/prototype\./);
assert.doesNotMatch(helpUi,/createElement\("style"\)/);
assert.match(tradeAdapter,/v55-trade-ui\.js\?v=5\.5\.5&legacy=1/);
assert.match(tradeAdapter,/button\.onclick=null/);
assert.match(tradeAdapter,/bindSpeedInputs/);

console.log("presentation architecture ownership test passed");
