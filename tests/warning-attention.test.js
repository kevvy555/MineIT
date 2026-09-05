import assert from "node:assert/strict";
import fs from "node:fs";

const mapFirstUi=fs.readFileSync(new URL("../js/ui/map-first-ui.js",import.meta.url),"utf8");

assert.match(
  mapFirstUi,
  /attentionStatus\(\)\{[^]*planetary=this\.expansion\.planetaryResidentCount\(s\)/,
  "attention policy must derive planetary residents separately from total population",
);
assert.match(
  mapFirstUi,
  /totals\.housing>0&&planetary\/totals\.housing>\.9/,
  "Housing near-capacity attention must use residents actually living ashore",
);
assert.match(
  mapFirstUi,
  /totals\.housing-planetary/,
  "Housing remaining-space copy must use planetary residents",
);
assert.doesNotMatch(
  mapFirstUi,
  /totals\.housing-s\.pop/,
  "ship residents must never be counted against planetary Housing",
);

console.log("MineIT N05 housing-attention regression test passed");
