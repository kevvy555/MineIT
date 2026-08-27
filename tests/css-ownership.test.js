import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html"),adaptiveView=read("views/adaptive-building.html"),resourceView=read("views/undeveloped-resource.html"),adaptiveCss=read("css/adaptive-building-details.css"),resourceCss=read("css/resource-details.css");

assert.equal(fs.existsSync(new URL("../css/building-details.css",import.meta.url)),false,"legacy building-details stylesheet must remain deleted");
assert.doesNotMatch(index,/building-details\.css/,"application shell must not load deleted building-details CSS");
for(const marker of["adaptive-building-shell","adaptive-building-hero","adaptive-building-actions"])assert.ok(adaptiveView.includes(marker),`missing adaptive building view marker ${marker}`);
for(const marker of["resource-detail-shell","resource-detail-hero","resource-detail-actions"])assert.ok(resourceView.includes(marker),`missing resource detail view marker ${marker}`);
for(const legacy of["building-detail-shell","building-detail-hero","building-art-frame","building-detail-actions"]){assert.ok(!adaptiveView.includes(legacy),`adaptive view must not depend on legacy class ${legacy}`);assert.ok(!resourceView.includes(legacy),`resource view must not depend on legacy class ${legacy}`);}
for(const marker of[/\.adaptive-building-hero/,/\.adaptive-building-art img/,/\.adaptive-building-actions/])assert.match(adaptiveCss,marker);
for(const marker of[/\.resource-detail-hero/,/\.resource-detail-facts/,/\.resource-detail-actions/])assert.match(resourceCss,marker);

console.log("canonical adaptive/resource CSS ownership test passed");
