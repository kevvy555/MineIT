import assert from "node:assert/strict";
import fs from "node:fs";

const view=fs.readFileSync(new URL("../js/ui/world-view.js",import.meta.url),"utf8");
const app=fs.readFileSync(new URL("../js/app.js",import.meta.url),"utf8");

assert.match(view,/this\.assetReady=\(\)=>this\.safeDraw\(\)/,"terrain/resource image loads should share one stable redraw callback");
assert.doesNotMatch(view,/artImage\(src,\(\)=>this\.safeDraw\(\)\)/,"terrain drawing must not register a fresh callback per tile");
assert.match(view,/if\(this\.drawQueued\)return/,"map redraws should be coalesced");
assert.match(view,/Math\.min\(2,Math\.max\(1,devicePixelRatio\|\|1\)\)/,"canvas DPR should be capped at 2");
assert.match(app,/lastHudFrame=0/,"HUD rendering should be throttled");
assert.match(app,/now-this\.lastHudFrame>=125/,"HUD rendering should not run on every animation frame");

const root=new URL("../assets/art/",import.meta.url),files=[];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=new URL(e.name+(e.isDirectory()?"/":""),dir);
    if(e.isDirectory())walk(p);
    else if(e.name.endsWith(".webp"))files.push(p);
  }
}
walk(root);
const sizes=files.map(f=>fs.statSync(f).size),max=Math.max(...sizes),total=sizes.reduce((a,b)=>a+b,0);
assert.ok(max<64*1024,`map WebP unexpectedly large: ${max} bytes`);
console.log(`render performance guard passed (${files.length} WebPs, total ${total} bytes, max ${max} bytes)`);
