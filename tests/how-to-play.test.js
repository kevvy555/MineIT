import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const pkg=JSON.parse(read("package.json"));
const index=read("index.html");
const help=read("js/ui/ui-controller-v564.js");

assert.equal(pkg.version,"5.6.4");
assert.match(index,/ui-controller-v564\.js\?v=5\.6\.4/);
assert.match(help,/SurvivalUIMixin\.prototype\.help\.call\(this\)/,"How to Play must open the complete field manual");
assert.match(help,/help\.onclick=\(\)=>this\.help\(\)/,"Game menu must route How to Play to the field manual");

for(const rule of[
  "Local construction does not consume corporation cash",
  "Quality affects economic value, not the basic collection rate",
  "Surveying costs <strong>time, not cash</strong>",
  "Housing, Industry and extraction construction do not spend corporation cash",
  "Finite <strong>Quarry, Mine, Deep Mine and Rig</strong> sites can run NORMAL, PUSHED or HARD",
  "Every 30 accumulated risk-days triggers a <strong>25% accident check</strong>",
  "3 full game days",
  "Renewable does <strong>not</strong> mean impossible to destroy",
  "State</strong> (Developed / Not Developed / Locked)",
  "<strong>Type</strong> (Food / Build / Fuel / Ore)",
  "no generic daily corporate cash surcharge"
])assert.ok(help.includes(rule),`missing current rule in How to Play: ${rule}`);

assert.match(help,/DEDICATED_TRANSPORT_DAYS/);
assert.match(help,/TRADE_INTERVAL_DAYS/);
assert.match(help,/SITE_OUTPUT_LEVELS\.slice\(0,5\)/);
assert.match(help,/local <strong>external cash costs<\/strong>/);

console.log("v5.6.4 How to Play rules test passed");
