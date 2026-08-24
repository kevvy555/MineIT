import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js"),art591=read("js/ui/land-art-v591.js"),view=read("js/ui/world-view-v56.js"),view570=read("js/ui/world-view-v570.js"),view580=read("js/ui/world-view-v580.js"),view591=read("js/ui/world-view-v591.js"),pkg=JSON.parse(read("package.json"));
assert.equal(pkg.version,"5.9.0");
const families=["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"];
for(const family of families)assert.ok(art.includes(family),`missing development family ${family}`);
assert.match(art,/bio:\"bio-harvester\"/);assert.match(art,/algae:\"algae-facility\"/);assert.match(art,/function developmentLevel\(dev\)/);assert.match(art,/Math\.max\(1,Math\.min\(5,Number\(dev\?\.level\)\|\|1\)\)/);
assert.match(art591,/function developmentOriginalPath\(dev\)/);assert.match(art591,/originals\/\$\{kind\}-l\$\{level\}\.png/);assert.match(art591,/function developmentAtlasPath\(dev\)/);assert.match(art591,/\$\{kind\}-levels-256\.webp/);assert.match(art591,/MIN_FRAME_SIZE=128/);assert.match(art591,/function drawDevelopmentFrame\(/);assert.match(art591,/frameWidth\*index,0,frameWidth,frameHeight/);
assert.match(view,/developmentAtlasPath/);assert.match(view570,/development\?\.kind!=="power"/);assert.match(view570,/P L\$\{level\}/,"Power buildings use an explicit vector fallback until a dedicated atlas is supplied");assert.match(view580,/if\(tile\?\.development\)this\.drawDevelopment/,'unified map must keep development artwork visible over resource rendering');
assert.match(view591,/land-art-v591\.js\?v=5\.9\.1/);assert.match(view591,/developmentAtlasPath/);assert.match(view591,/artImage\(src,this\.assetReady\)/);assert.match(view591,/drawDevelopmentFrame/);assert.match(view591,/dev\.kind==="power"/);assert.match(view591,/super\.drawDevelopment\(ctx,tile,px,py\)/);assert.match(view591,/DEVELOPMENT_LABELS/);

function webpVp8xSize(buffer){
  assert.equal(buffer.subarray(0,4).toString("ascii"),"RIFF");
  assert.equal(buffer.subarray(8,12).toString("ascii"),"WEBP");
  assert.equal(buffer.subarray(12,16).toString("ascii"),"VP8X");
  const width=1+buffer[24]+(buffer[25]<<8)+(buffer[26]<<16),height=1+buffer[27]+(buffer[28]<<8)+(buffer[29]<<16);
  return{width,height};
}

let total=0;
for(const family of families){
  const atlas=new URL(`../assets/art/development/${family}/${family}-levels-256.webp`,import.meta.url);
  assert.ok(fs.existsSync(atlas),`missing high-resolution building atlas ${family}`);
  const buffer=fs.readFileSync(atlas),stat=fs.statSync(atlas),size=webpVp8xSize(buffer);total+=stat.size;
  assert.deepEqual(size,{width:1280,height:256},`${family} atlas must be 5 x 256px frames`);
  assert.ok(stat.size>20*1024,`${family} atlas is suspiciously small: ${stat.size} bytes`);
  assert.ok(stat.size<1024*1024,`${family} atlas unexpectedly large: ${stat.size} bytes`);
}
const obsoleteMaster=new URL("../assets/art/development/buildings-levels.webp",import.meta.url);assert.equal(fs.existsSync(obsoleteMaster),false);
console.log(`high-resolution building artwork test passed (${families.length} 1280x256 atlases + Power fallback + unified overlay, ${total} bytes)`);
