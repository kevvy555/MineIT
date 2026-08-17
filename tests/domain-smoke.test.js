import assert from "node:assert/strict";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { WorldService } from "../js/domain/world-service.js";
import { SiteService } from "../js/domain/site-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { SurveyService } from "../js/domain/survey-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";

const contracts=new ContractService();
const resources=new ResourceService();
const collection=new CollectionService(resources);
const tech=new TechnologyService();
const world=new WorldService(resources,contracts);
const sites=new SiteService(contracts);
const survey=new SurveyService(world,contracts);
const engine=new SimulationEngine(resources,tech,collection);
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

const revealed=[];
const families=new Set();
for(let y=-40;y<=40;y++){
  for(let x=-40;x<=40;x++){
    const tile=world.reveal(state,x,y);
    revealed.push(tile);families.add(tile.type);
  }
}
assert.deepEqual([...families].sort(),["food","industry","valuable"]);

const food=revealed.find(t=>t.type==="food");
const finite=revealed.find(t=>t.type!=="food"&&t.reserve>0);
assert.ok(food&&finite);
assert.equal(food.sustainability,"renewable");
assert.equal(food.reserve,null);
assert.equal(finite.sustainability,"finite");

state.company.cash=1e9;
assert.equal(sites.develop(state,food),true);
assert.equal(sites.develop(state,finite),true);
const finiteBefore=finite.reserve;

for(let day=0;day<720;day++){
  engine.tick(state);
  survey.tick(state);
}
engine.recalculate(state);

assert.equal(food.developed,true,"renewable food site should still be collecting");
assert.equal(food.depleted,false,"renewable food site must not deplete");
assert.equal(food.reserve,null,"renewable food reserve stays unbounded");
assert.ok(finite.reserve<finiteBefore,"finite deposit reserve must fall as it is collected");
assert.ok(Number.isFinite(state.company.cash));
assert.ok(Number.isFinite(state.pop));

const lifetimes=revealed
  .filter(t=>t.type!=="food")
  .map(t=>t.initialReserve/(resources.baseOutput(t.quality)*(t.resourceMult||1))/360);
assert.ok(lifetimes.some(y=>y>200),"world generation should include rare century-scale deposits");
assert.ok(lifetimes.some(y=>y<8),"world generation should include small short-lived deposits");

const rows=collection.current(state);
assert.ok(rows.some(r=>r.renewable&&r.remaining===null));
assert.ok(rows.some(r=>!r.renewable&&Number.isFinite(r.remaining)));
assert.ok(rows.every(r=>r.rate>0));

console.log("MineIT persistent collection smoke test passed",{
  date:`Y${state.year} D${state.day}`,
  food:food.name,
  finite:finite.name,
  minLife:Math.min(...lifetimes).toFixed(1),
  maxLife:Math.max(...lifetimes).toFixed(1)
});
