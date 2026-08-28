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

const buildingAtlases=files.filter(f=>f.pathname.endsWith("-levels-256.webp"));
const resourceAtlases=files.filter(f=>f.pathname.endsWith("/resource-atlas-256.webp"));
const regularMapArt=files.filter(f=>!buildingAtlases.includes(f)&&!resourceAtlases.includes(f));
const regularSizes=regularMapArt.map(f=>fs.statSync(f).size);
const buildingAtlasSizes=buildingAtlases.map(f=>fs.statSync(f).size);
const resourceAtlasSizes=resourceAtlases.map(f=>fs.statSync(f).size);
const allSizes=[...regularSizes,...buildingAtlasSizes,...resourceAtlasSizes];
const total=allSizes.reduce((a,b)=>a+b,0);
const regularMax=regularSizes.length?Math.max(...regularSizes):0;
const buildingAtlasMax=buildingAtlasSizes.length?Math.max(...buildingAtlasSizes):0;
const buildingAtlasTotal=buildingAtlasSizes.reduce((a,b)=>a+b,0);
const resourceAtlasMax=resourceAtlasSizes.length?Math.max(...resourceAtlasSizes):0;

assert.ok(regularMax<64*1024,`regular map WebP unexpectedly large: ${regularMax} bytes`);
assert.ok(buildingAtlasMax<256*1024,`high-resolution building atlas unexpectedly large: ${buildingAtlasMax} bytes`);
assert.ok(buildingAtlasTotal<2*1024*1024,`high-resolution building atlases exceed 2 MiB total: ${buildingAtlasTotal} bytes`);
assert.equal(resourceAtlases.length,1,"map should use exactly one consolidated resource atlas");
assert.ok(resourceAtlasMax<1.25*1024*1024,`resource atlas unexpectedly large: ${resourceAtlasMax} bytes`);
console.log(`render performance guard passed (${files.length} WebPs, total ${total} bytes, regular max ${regularMax} bytes, ${buildingAtlases.length} building atlases / ${buildingAtlasTotal} bytes, building max ${buildingAtlasMax} bytes, resource atlas ${resourceAtlasMax} bytes)`);
