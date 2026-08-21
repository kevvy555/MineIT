import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js");
const view=read("js/ui/world-view-v56.js");
const pkg=JSON.parse(read("package.json"));

assert.equal(pkg.version,"5.6.1");

const families=["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"];
for(const family of families)assert.ok(art.includes(family),`missing development family ${family}`);

assert.match(art,/bio:\"bio-harvester\"/);
assert.match(art,/algae:\"algae-facility\"/);
assert.match(art,/DEVELOPMENT_ROWS/);
assert.match(art,/function developmentLevel\(dev\)/);
assert.match(art,/Math\.max\(1,Math\.min\(5,Number\(dev\?\.level\)\|\|1\)\)/);
assert.match(art,/function developmentAtlasPath\(dev\)/);
assert.match(art,/assets\/art\/development\/buildings-levels\.webp/);
assert.match(art,/function drawDevelopmentFrame\(/);
assert.match(art,/const columns=5,rows=10/);
assert.match(art,/frameWidth\*column,frameHeight\*row,frameWidth,frameHeight/);

assert.match(view,/developmentAtlasPath/);
assert.match(view,/developmentKind/);
assert.match(view,/developmentLevel/);
assert.match(view,/artImage\(src,this\.assetReady\)/,"building art must reuse the stable redraw callback");
assert.match(view,/drawDevelopmentFrame\(ctx,img,kind,developmentLevel\(dev\)/);
assert.match(view,/super\.drawDevelopment\(ctx,tile,px,py\)/,"vector building fallback must remain available");
assert.match(view,/DEVELOPMENT_LABELS/);

const atlas=new URL("../assets/art/development/buildings-levels.webp",import.meta.url);
assert.ok(fs.existsSync(atlas),"master building artwork atlas must be committed");
const stat=fs.statSync(atlas);
assert.ok(stat.size>0,"building atlas must not be empty");
assert.ok(stat.size<96*1024,`building atlas unexpectedly large: ${stat.size} bytes`);
const header=fs.readFileSync(atlas).subarray(0,12).toString("ascii");
assert.equal(header.slice(0,4),"RIFF");
assert.equal(header.slice(8,12),"WEBP");

console.log(`building artwork master-atlas integration test passed (${stat.size} bytes)`);
