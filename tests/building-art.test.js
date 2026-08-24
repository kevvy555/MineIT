import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const art=read("js/ui/land-art.js"),view=read("js/ui/world-view-v56.js"),view570=read("js/ui/world-view-v570.js"),view580=read("js/ui/world-view-v580.js"),pkg=JSON.parse(read("package.json"));
assert.equal(pkg.version,"5.8.0");
const families=["housing","industry","quarry","mine","deep-mine","rig","farm","ranch","bio-harvester","algae-facility"];
for(const family of families)assert.ok(art.includes(family),`missing development family ${family}`);
assert.match(art,/bio:\"bio-harvester\"/);assert.match(art,/algae:\"algae-facility\"/);assert.match(art,/function developmentLevel\(dev\)/);assert.match(art,/Math\.max\(1,Math\.min\(5,Number\(dev\?\.level\)\|\|1\)\)/);assert.match(art,/function developmentAtlasPath\(dev\)/);assert.match(art,/assets\/art\/development\/\$\{kind\}\/\$\{kind\}-levels\.webp/);assert.match(art,/function drawDevelopmentFrame\(/);assert.match(art,/const frames=5/);assert.match(art,/frameWidth\*index,0,frameWidth,frameHeight/);
assert.match(view,/developmentAtlasPath/);assert.match(view,/developmentLevel/);assert.match(view,/artImage\(src,this\.assetReady\)/);assert.match(view,/drawDevelopmentFrame/);assert.match(view,/super\.drawDevelopment\(ctx,tile,px,py\)/);assert.match(view,/DEVELOPMENT_LABELS/);
assert.match(view570,/development\?\.kind!=="power"/);assert.match(view570,/P L\$\{level\}/,"Power buildings use an explicit vector fallback until a dedicated atlas is supplied");assert.match(view580,/if\(tile\?\.development\)this\.drawDevelopment/,'unified map must keep development artwork visible over resource rendering');
let total=0;for(const family of families){const atlas=new URL(`../assets/art/development/${family}/${family}-levels.webp`,import.meta.url);assert.ok(fs.existsSync(atlas),`missing building atlas ${family}`);const stat=fs.statSync(atlas);total+=stat.size;assert.ok(stat.size>0);assert.ok(stat.size<64*1024);const header=fs.readFileSync(atlas).subarray(0,12).toString("ascii");assert.equal(header.slice(0,4),"RIFF");assert.equal(header.slice(8,12),"WEBP");}
const obsoleteMaster=new URL("../assets/art/development/buildings-levels.webp",import.meta.url);assert.equal(fs.existsSync(obsoleteMaster),false);
console.log(`building artwork integration test passed (${families.length} atlases + Power fallback + unified overlay, ${total} bytes)`);
