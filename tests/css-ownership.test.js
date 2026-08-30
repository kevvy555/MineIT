import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html"),adaptiveView=read("views/adaptive-building.html"),resourceView=read("views/undeveloped-resource.html"),adaptiveCss=read("css/adaptive-building-details.css"),resourceCss=read("css/resource-details.css");
const linkedCss=[...index.matchAll(/href="\.\/css\/([^"?]+\.css)(?:\?[^\"]*)?"/g)].map(match=>match[1]);
const canonicalCss=["app.css","world.css","panels.css","portfolio.css","trade-quality.css","trade-quick.css","ui-enhancements.css","land.css","map-first.css","resource-details.css","adaptive-building-details.css","ship-expansion.css","conglomerate-buyers.css"];
const diskCss=fs.readdirSync(new URL("../css/",import.meta.url)).filter(name=>name.endsWith(".css")).sort();

assert.deepEqual(linkedCss,canonicalCss,"index.html must load exactly the canonical CSS ownership set in cascade order");
assert.deepEqual(diskCss,[...canonicalCss].sort(),"css directory must not contain orphan or unowned stylesheets");
assert.equal(fs.existsSync(new URL("../css/building-details.css",import.meta.url)),false,"legacy building-details stylesheet must remain deleted");
assert.ok(!index.includes("./css/building-details.css"),"application shell must not load deleted building-details CSS");
for(const marker of["adaptive-building-shell","adaptive-building-hero","adaptive-building-actions"])assert.ok(adaptiveView.includes(marker),`missing adaptive building view marker ${marker}`);
for(const marker of["resource-detail-shell","resource-detail-hero","resource-detail-actions"])assert.ok(resourceView.includes(marker),`missing resource detail view marker ${marker}`);
for(const legacy of["building-detail-shell","building-detail-hero","building-art-frame","building-detail-actions"]){assert.ok(!adaptiveView.includes(legacy),`adaptive view must not depend on legacy class ${legacy}`);assert.ok(!resourceView.includes(legacy),`resource view must not depend on legacy class ${legacy}`);}
for(const marker of[/\.adaptive-building-hero/,/\.adaptive-building-art img/,/\.adaptive-building-actions/])assert.match(adaptiveCss,marker);
for(const marker of[/\.resource-detail-hero/,/\.resource-detail-facts/,/\.resource-detail-actions/])assert.match(resourceCss,marker);

console.log(`canonical CSS ownership test passed (${canonicalCss.length} loaded stylesheets, zero orphan CSS files)`);
