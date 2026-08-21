import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js");
const view=read("js/ui/world-view-v56.js");
const pkg=JSON.parse(read("package.json"));

assert.equal(pkg.version,"5.6.1");

for(const family of["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"])
  assert.match(art,new RegExp(`(?:\\"|:)${family.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")}\\"?`),`missing development family ${family}`);

assert.match(art,/bio:\"bio-harvester\"/);
assert.match(art,/algae:\"algae-facility\"/);
assert.match(art,/function developmentLevel\(dev\)/);
assert.match(art,/Math\.max\(1,Math\.min\(5,Number\(dev\?\.level\)\|\|1\)\)/);
assert.match(art,/function developmentAtlasPath\(dev\)/);
assert.match(art,/assets\/art\/development\/\$\{kind\}\/\$\{kind\}-levels\.webp/);
assert.match(art,/function drawDevelopmentFrame\(/);
assert.match(art,/const frames=5/);
assert.match(art,/frameWidth\*index,0,frameWidth,frameHeight/);

assert.match(view,/developmentAtlasPath/);
assert.match(view,/developmentLevel/);
assert.match(view,/artImage\(src,this\.assetReady\)/,"building art must reuse the stable redraw callback");
assert.match(view,/drawDevelopmentFrame/);
assert.match(view,/super\.drawDevelopment\(ctx,tile,px,py\)/,"vector building fallback must remain available");
assert.match(view,/DEVELOPMENT_LABELS/);

console.log("building artwork atlas integration test passed");
