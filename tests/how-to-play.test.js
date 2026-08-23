import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const pkg=JSON.parse(read("package.json")),index=read("index.html"),legacy=read("js/ui/ui-controller-v564.js"),help570=read("js/ui/ui-controller-v570.js"),help580=read("js/ui/ui-controller-v580.js");
assert.equal(pkg.version,"5.8.0");assert.match(index,/ui-controller-v580\.js\?v=5\.8\.0/);assert.match(legacy,/SurvivalUIMixin\.prototype\.help\.call\(this\)/);assert.match(help570,/super\.help\(\)/);assert.match(help580,/super\.help\(\)/);
for(const rule of["Housing, Power and Industry are individual L1–L5 map buildings","five corporation technology families","Mining is the exception","technology limits sophistication, not quantity","Local construction uses physical colony resources, not corporation cash","PUSHED uses 125% staff for 115% output","Every 30 accumulated risk-days triggers a 25% accident check"])assert.ok(help570.includes(rule),`missing retained v5.7 rule: ${rule}`);
for(const rule of["There is one colony map","Tap selects","persistent action bar","main HUD always shows Housing, Power, effective/installed Industry, free workforce, resource stocks and supply days"])assert.ok(help580.includes(rule),`missing v5.8 map-first rule: ${rule}`);
for(const retained of["Quality affects economic value, not the basic collection rate","Surveying costs <strong>time, not cash</strong>","Renewable does <strong>not</strong> mean impossible to destroy"])assert.ok(legacy.includes(retained),`missing retained rule: ${retained}`);
console.log("v5.8.0 How to Play rules test passed");
