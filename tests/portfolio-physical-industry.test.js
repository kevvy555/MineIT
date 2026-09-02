import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html"),portfolio=read("js/ui/portfolio-ui.js"),colonyCard=read("views/colony-card.html"),refusedColony=read("views/refused-colony.html");
assert.doesNotMatch(index,/portfolio-ui-v\d+/,"portfolio UI must resolve directly to the canonical mixin");
assert.match(portfolio,/foundingShipIndustryCapacity\(colonyState\)\+builtCapacity\(entry\.data,"industry"\)/,"portfolio Industry must be derived from physical buildings plus a docked founding-ship workshop");
assert.match(portfolio,/effective.*installed/s,"portfolio must display effective and installed Industry values");
assert.match(refusedColony,/There is no generic daily corporate cash charge/);
assert.doesNotMatch(portfolio,/industryLevel/,"canonical portfolio presentation must not use the obsolete aggregate Industry level");
assert.match(portfolio,/ACTION REQUIRED/);assert.match(colonyCard,/\{\{SHIP_TAG\}\}/);assert.match(colonyCard,/\{\{INDUSTRY_EFFECTIVE\}\} \/ \{\{INDUSTRY_INSTALLED\}\}/);
assert.match(portfolio,/CORPORATE SHIP DOCKED/);assert.match(portfolio,/data-ship-waiting/);
console.log("canonical physical Industry and lifecycle portfolio presentation test passed");
