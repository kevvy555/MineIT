import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js"),world=read("js/ui/world-view-runtime.js"),buildingUi=read("js/ui/building-details-ui.js"),adaptiveUi=read("js/ui/adaptive-building-ui.js"),adaptiveView=read("views/adaptive-building.html"),detailsCss=read("css/building-details.css"),pkg=JSON.parse(read("package.json"));
assert.equal(pkg.version,"5.11.3");
const families=["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"];
for(const family of families)assert.ok(art.includes(family),`missing development family ${family}`);
assert.match(art,/bio:"bio-harvester"/);assert.match(art,/algae:"algae-facility"/);assert.match(art,/function developmentLevel\(dev\)/);assert.match(art,/DEVELOPMENT_FRAMES=5/);
assert.match(art,/function developmentOriginalPath\(dev\)/);assert.match(art,/originals\/\$\{kind\}-l\$\{level\}\.png/);assert.match(art,/function developmentAtlasPath\(dev\)/);assert.match(art,/\$\{kind\}-levels-256\.webp/);assert.match(art,/MIN_DEVELOPMENT_FRAME_SIZE=128/);assert.match(art,/function drawDevelopmentFrame\(/);assert.match(art,/frameWidth\*index,0,frameWidth,frameHeight/);
assert.match(world,/developmentAtlasPath/);assert.match(world,/drawBuildingFallback/);assert.match(world,/dev\.kind==="power"/);assert.match(world,/drawDevelopment\(c,tile,px,py\)/);assert.match(world,/artImage\(src,this\.assetReady\)/);assert.match(world,/drawDevelopmentFrame/);assert.match(world,/drawSurveyState\(/);assert.match(world,/this\.drawTerrain\(c,tile,px,py\)/,"terrain must remain the visual base for unscanned and surveyed tiles");assert.match(world,/drawResourceOverlay\(/);assert.match(world,/drawResourceBadge\(/);assert.match(world,/drawLevelBadge\(/);assert.match(world,/assets\/art\/Level\/L\$\{/);assert.match(world,/drawQuality\(/);assert.match(world,/drawRemainingBar\(/);assert.match(world,/fillText\("\?"/);assert.match(world,/`Q\$\{Math\.round\(tile\.quality\)\}`/);assert.doesNotMatch(world,/DEVELOPMENT_LABELS/);assert.doesNotMatch(world,/const badge=`\$\{label\} L/);

assert.match(buildingUi,/from "\.\/trade-reserve-ui\.js"/);
for(const method of["buildingHero","openColonyBuilding","compactExtractionPanel","tile","landTile"])assert.doesNotMatch(buildingUi,new RegExp(`\\n\\s{2}${method}\\(`),`shadowed legacy building renderer must stay removed: ${method}`);
assert.match(adaptiveUi,/developmentOriginalPath/);assert.match(adaptiveUi,/renderAdaptiveBuilding\(tile\)/);assert.match(adaptiveUi,/isAdaptiveBuilding\(tile\)/);assert.match(adaptiveView,/data-adaptive-art-image/);assert.match(adaptiveView,/data-adaptive-upgrade/);assert.match(adaptiveView,/data-adaptive-demolish/);
assert.match(detailsCss,/\.building-art-frame img/);assert.match(detailsCss,/object-fit:contain/);assert.match(detailsCss,/\.building-detail-actions/);

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
console.log(`high-resolution building artwork + adaptive detail presentation test passed (${families.length} 1280x256 atlases, 50 originals, ${total} bytes)`);
