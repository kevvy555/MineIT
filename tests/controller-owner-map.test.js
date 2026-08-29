import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const base=read("js/ui/ui-controller.js"),tasks=read("js/ui/development-tasks-ui.js"),industry=read("js/ui/industry-ui.js"),v55=read("js/ui/v55-ui.js"),contractLog=read("js/ui/v55-contract-log-ui.js"),mapFirst=read("js/ui/map-first-ui.js"),operational=read("js/ui/operational-controls-ui.js"),events=read("js/ui/corporate-events-ui.js"),reserve=read("js/ui/trade-reserve-ui.js"),resourceDevelopment=read("js/ui/resource-development-ui.js"),adaptive=read("js/ui/adaptive-building-ui.js"),expansion=read("js/ui/expansion-ui.js"),technology=read("js/ui/technology-presentation-ui.js");

// Modern active controller chain: each feature has one real parent and no removed bridge is reintroduced.
for(const [source,parent] of [[technology,"cash-policy-ui"],[mapFirst,"technology-presentation-ui"],[operational,"map-first-ui"],[events,"operational-controls-ui"],[reserve,"corporate-events-ui"],[resourceDevelopment,"trade-reserve-ui"],[adaptive,"resource-development-ui"],[expansion,"adaptive-building-ui"]])assert.match(source,new RegExp(`from "\\.\\/${parent}\\.js"`),`missing canonical parent ${parent}`);
for(const removed of["building-details-ui.js","survival-presentation-ui.js"])assert.equal(fs.existsSync(new URL(`../js/ui/${removed}`,import.meta.url)),false,`${removed} must stay removed`);

// Legacy composition order is intentional. Later mixins own the public method while explicit calls below emulate the required super-chain.
const mixOrder=["ResourceUIMixin","ColonyTechUIMixin","ContractUIMixin","PortfolioUIMixin","UIEnhancementsMixin","DevelopmentTasksUIMixin","SurvivalUIMixin","IndustryUIMixin","V55UIMixin","V55ContractLogUIMixin","LandUIMixin"];
let previous=-1;for(const owner of mixOrder){const at=base.indexOf(`mix(UIController,${owner})`);assert.ok(at>previous,`legacy mixin order changed around ${owner}`);previous=at;}
assert.doesNotMatch(tasks,/this\.state\.[A-Za-z0-9_$]+\s*=/,"development tasks must not mutate gameplay state");assert.match(tasks,/taskRepository\.(?:create|update|move|remove|markInProgress)/,"development-task UI must dispatch data changes to its persistence owner");

const qualifiedCalls=(source)=>[...source.matchAll(/([A-Za-z0-9_$]+)\.prototype\.([A-Za-z0-9_$]+)\.call\(this/g)].map(match=>`${match[1]}.${match[2]}`);
assert.deepEqual(qualifiedCalls(industry),["ColonyTechUIMixin.colonyPanel","UIEnhancementsMixin.currentCollection","ResourceUIMixin.tile"],"Industry delegates are the intentional legacy super-chain");
assert.deepEqual(qualifiedCalls(v55),["ContractUIMixin.render","IndustryUIMixin.colonyPanel","IndustryUIMixin.currentCollection","IndustryUIMixin.tile","UIEnhancementsMixin.menu"],"V55 delegates are the intentional legacy super-chain");
assert.deepEqual(qualifiedCalls(contractLog),["V55UIMixin.colonyPanel","ContractUIMixin.completionActions","ContractUIMixin.deadline"],"V55 contract-log delegates are the intentional legacy super-chain");

// Help ownership: Map First contributes controls, Trade Reserve owns the final active intro; intermediate intro-only overrides stay absent.
assert.match(mapFirst,/\n\s{2}help\(\)/);assert.match(mapFirst,/super\.help\(\)/);
assert.doesNotMatch(operational,/\n\s{2}help\(\)/);assert.doesNotMatch(events,/\n\s{2}help\(\)/);
assert.match(reserve,/\n\s{2}help\(\)/);assert.match(reserve,/super\.help\(\)/);

console.log("canonical controller owner map and intentional legacy super-chain contract passed");
