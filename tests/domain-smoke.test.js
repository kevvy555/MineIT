import assert from "node:assert/strict";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { WorldService } from "../js/domain/world-service.js";
import { SiteService } from "../js/domain/site-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { SurveyService } from "../js/domain/survey-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";

const contracts=new ContractService();
const resources=new ResourceService();
const tech=new TechnologyService();
const world=new WorldService(resources,contracts);
const sites=new SiteService(contracts);
const survey=new SurveyService(world,contracts);
const engine=new SimulationEngine(resources,tech);
const state=createGameState(contracts.first());

tech.recompute(state);
assert.equal(survey.slots(state),1);

for(let i=1;i<=5;i++) survey.enqueue(state,i,0);
assert.equal(state.scans.length,1);
assert.equal(state.scanQueue.length,4);

for(const id of ["survey-1","survey-2","survey-3"]) state.company.licenses.push(id);
tech.recompute(state);survey.fill(state);
assert.equal(state.metrics.sl,4);
assert.equal(survey.slots(state),2);
assert.equal(state.scans.length,2);

const families=new Set();
for(let y=-20;y<=20;y++){
  for(let x=-20;x<=20;x++) families.add(world.reveal(state,x,y).type);
}
assert.deepEqual([...families].sort(),["food","industry","valuable"]);

const developed=Object.values(state.tiles).find(t=>t.revealed&&!t.depleted);
state.company.cash=1e9;
assert.equal(sites.develop(state,developed),true);

for(let day=0;day<500;day++){
  engine.tick(state);
  survey.tick(state);
}
engine.recalculate(state);

assert.ok(Number.isFinite(state.company.cash));
assert.ok(Number.isFinite(state.pop));
assert.ok(Number.isFinite(state.metrics.food));
assert.ok(Number.isFinite(state.metrics.industry));
assert.ok(state.year>=2);

console.log("MineIT domain smoke test passed",{
  date:`Y${state.year} D${state.day}`,
  surveyLevel:state.metrics.sl,
  surveySlots:state.metrics.slots,
  families:[...families]
});
