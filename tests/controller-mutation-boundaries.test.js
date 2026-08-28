import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const operational=read("js/ui/operational-controls-ui.js");
const adaptive=read("js/ui/adaptive-building-ui.js");
const resourceService=read("js/domain/resource-service.js");

assert.match(resourceService,/adjustHarvestIntensity\(tile,deltaPercent\)/,"ResourceService must own renewable harvest mutation");
for(const [name,source] of Object.entries({operational,adaptive})){
  assert.match(source,/resources\.adjustHarvestIntensity\(tile,/ ,`${name} must dispatch renewable harvest changes through ResourceService`);
  assert.doesNotMatch(source,/tile\.harvestIntensity\s*=/,`${name} must not directly mutate harvestIntensity`);
}
assert.doesNotMatch(operational,/import\s*\{\s*clamp\s*\}/,"operational controls no longer need a UI-side harvest clamp");
assert.match(operational,/const \{before,after,sustainableRate\}=result/);
assert.match(operational,/repo\.save\(this\.state\)/);
assert.match(operational,/logEvent\?\.\("harvest-intensity"/);

console.log("controller mutation-boundary guard passed");
