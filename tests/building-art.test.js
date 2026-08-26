import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js"),art591=read("js/ui/land-art-v591.js"),view=read("js/ui/world-view-v56.js"),view570=read("js/ui/world-view-v570.js"),view580=read("js/ui/world-view-v580.js"),view591=read("js/ui/world-view-v591.js"),ui592=read("js/ui/ui-controller-v592.js"),detailsCss=read("css/building-details.css"),pkg=JSON.parse(read("package.json"));
assert.equal(pkg.version,"5.11.3");
const families=["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"];
for(const family of families)assert.ok(art.includes(family),`missing development family ${family}`);
assert.match(art,/bio:\"bio-harvester\"/);assert.match(art,/algae:\"algae-facility\"/);assert.match(art,/function developmentLevel\(dev\)/);assert.match(art,/Math\.max\(1,Math\.min\(5,Number\(dev\?\.level\)\|\|1\)\)/);
assert.match(art591,/function developmentOriginalPath\(dev\)/);assert.match(art591,/originals\/\$\{kind\}-l\$\{level\}\.png/);assert.match(art591,/function developmentAtlasPath\(dev\)/);assert.match(art591,/\$\{kind\}-levels-256\.webp/);assert.match(art591,/MIN_FRAME_SIZE=128/);assert.match(art591,/function drawDevelopmentFrame\(/);assert.match(art591,/frameWidth\*index,0,frameWidth,frameHeight/);
assert.match(view,/developmentAtlasPath/);assert.match(view570,/development\?\.kind!=="power"/);assert.match(view570,/P L\$\{level\}/,"legacy Power fallback remains available beneath the active presentation layer");assert.match(view580,/if\(tile\?\.development\)this\.drawDevelopment/,'unified map must keep development artwork visible over resource rendering');
assert.match(view591,/land-art-v591\.js\?v=5\.9\.1/);assert.match(view591,/developmentAtlasPath/);assert.match(view591,/artImage\(src,this\.assetReady\)/);assert.match(view591,/drawDevelopmentFrame/);assert.match(view591,/drawSurveyState\(/);assert.match(view591,/this\.drawTerrain\(c,tile,px,py\)/,"terrain must remain the visual base for unscanned and surveyed tiles");assert.match(view591,/drawResourceOverlay\(/);assert.match(view591,/drawResourceBadge\(/);assert.match(view591,/drawLevelBadge\(/);assert.match(view591,/assets\/art\/Level\/L\$\{/);assert.match(view591,/drawQuality\(/);assert.match(view591,/drawRemainingBar\(/);assert.match(view591,/fillText\("\?"/);assert.match(view591,/`Q\$\{Math\.round\(tile\.quality\)\}`/);assert.doesNotMatch(view591,/DEVELOPMENT_LABELS/);assert.doesNotMatch(view591,/fillText\("CLEAR"/);assert.doesNotMatch(view591,/const badge=`\$\{label\} L/);
assert.match(ui592,/developmentOriginalPath/);assert.match(ui592,/buildingHero\(dev/);assert.match(ui592,/openColonyBuilding\(tile\)/);assert.match(ui592,/compactExtractionPanel\(tile\)/);assert.match(ui592,/UPGRADE TO L/);assert.match(ui592,/data-building-demolish/);assert.match(detailsCss,/\.building-art-frame img/);assert.match(detailsCss,/object-fit:contain/);assert.match(detailsCss,/\.building-detail-actions/);

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
  for(let level=1;level<=5;level++)assert.ok(fs.existsSync(new URL(`../assets/art/development/${family}/originals/${family}-l${level}.png`,import.meta.url)),`missing ${family} original L${level}`);
}
const obsoleteMaster=new URL("../assets/art/development/buildings-levels.webp",import.meta.url);assert.equal(fs.existsSync(obsoleteMaster),false);
console.log(`high-resolution building artwork + terrain-first tile presentation test passed (${families.length} 1280x256 atlases, 50 originals, ${total} bytes)`);
