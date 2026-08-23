import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js");
const view=read("js/ui/world-view-v56.js");
const pkg=JSON.parse(read("package.json"));

assert.equal(pkg.version,"5.6.4");

const families=["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"];
for(const family of families)assert.ok(art.includes(family),`missing development family ${family}`);

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

let total=0;
for(const family of families){
  const atlas=new URL(`../assets/art/development/${family}/${family}-levels.webp`,import.meta.url);
  assert.ok(fs.existsSync(atlas),`missing building atlas ${family}`);
  const stat=fs.statSync(atlas);total+=stat.size;
  assert.ok(stat.size>0,`${family} atlas must not be empty`);
  assert.ok(stat.size<64*1024,`${family} atlas unexpectedly large: ${stat.size} bytes`);
  const header=fs.readFileSync(atlas).subarray(0,12).toString("ascii");
  assert.equal(header.slice(0,4),"RIFF");
  assert.equal(header.slice(8,12),"WEBP");
}

const obsoleteMaster=new URL("../assets/art/development/buildings-levels.webp",import.meta.url);
assert.equal(fs.existsSync(obsoleteMaster),false,"obsolete master atlas should not remain in the repo");

console.log(`building artwork integration test passed (${families.length} atlases, ${total} bytes)`);
