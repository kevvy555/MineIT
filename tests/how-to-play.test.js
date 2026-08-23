import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const pkg=JSON.parse(read("package.json")),index=read("index.html"),legacy=read("js/ui/ui-controller-v564.js"),help=read("js/ui/ui-controller-v570.js");
assert.equal(pkg.version,"5.7.0");assert.match(index,/ui-controller-v570\.js\?v=5\.7\.0/);assert.match(legacy,/SurvivalUIMixin\.prototype\.help\.call\(this\)/);assert.match(help,/super\.help\(\)/);
for(const rule of["Housing, Power and Industry are individual L1–L5 map buildings","five corporation technology families","Mining is the exception","technology limits sophistication, not quantity","Local construction uses physical colony resources, not corporation cash","PUSHED uses 125% staff for 115% output","Every 30 accumulated risk-days triggers a 25% accident check"])assert.ok(help.includes(rule),`missing v5.7 rule: ${rule}`);
for(const retained of["Quality affects economic value, not the basic collection rate","Surveying costs <strong>time, not cash</strong>","Renewable does <strong>not</strong> mean impossible to destroy"])assert.ok(legacy.includes(retained),`missing retained rule: ${retained}`);
console.log("v5.7.0 How to Play rules test passed");
