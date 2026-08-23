import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html"),portfolio=read("js/ui/portfolio-ui-v570.js");
assert.match(index,/portfolio-ui-v570\.js\?v=5\.7\.0/);
assert.match(portfolio,/SHIP_INFRASTRUCTURE\.industry\+builtCapacity\(entry\.data,"industry"\)/,"portfolio Industry must be derived from physical buildings plus the ship workshop");
assert.match(portfolio,/effective.*installed/s,"portfolio must display effective and installed Industry values");
assert.match(portfolio,/There is no generic daily corporate cash charge/);
assert.doesNotMatch(portfolio,/industryLevel/,"v5.7 portfolio adapter must not present the obsolete aggregate Industry level");
console.log("v5.7 physical Industry portfolio presentation test passed");
