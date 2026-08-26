import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const app=read("js/app.js"),baseUi=read("js/ui/ui-controller.js"),world=read("js/ui/world-view-runtime.js"),mapFirst=read("js/ui/map-first-ui.js"),operational=read("js/ui/operational-controls-ui.js");

assert.match(app,/import \{ GameStore \} from "\.\/core\/game-store\.js"/);
assert.match(app,/this\.store=new GameStore\(/);
assert.match(app,/get state\(\)\{return this\.store\.getState\(\);\}/);
assert.doesNotMatch(app,/this\.state\s*=/,"MineITApp must not own a second mutable root-state reference");
assert.match(app,/this\.store\.replaceState\(createGameState/);

assert.match(app,/this\.rafId=requestAnimationFrame\(this\.animationFrameHandler\)/);
assert.match(app,/cancelAnimationFrame\(this\.rafId\)/);
assert.match(app,/removeEventListener\("error",this\.onWindowError\)/);
assert.match(app,/removeEventListener\("unhandledrejection",this\.onUnhandledRejection\)/);
assert.match(app,/document\.removeEventListener\("visibilitychange",this\.onVisibilityChange\)/);
assert.match(app,/this\.ui\?\.dispose\?\.\(\)/);assert.match(app,/this\.view\?\.dispose\?\.\(\)/);assert.match(app,/this\.store\?\.dispose\?\.\(\)/);
assert.match(app,/addEventListener\("DOMContentLoaded",startMineIT,\{once:true\}\)/);

assert.match(baseUi,/this\.speedClickHandler=/);assert.match(baseUi,/removeEventListener\("click",this\.speedClickHandler,true\)/);assert.match(baseUi,/this\.diagnosticsUnsubscribe=this\.diagnostics\.subscribe/);assert.match(baseUi,/this\.diagnosticsUnsubscribe\?\.\(\)/);assert.match(baseUi,/clearTimeout\(this\.toastTimer\)/);
assert.match(world,/dispose\(\)/);assert.match(mapFirst,/dispose\(\)/);assert.match(operational,/dispose\(\)/);

console.log("application state ownership and listener/RAF disposal guard passed");
