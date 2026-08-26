import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TECH_TREES } from "../js/data/technologies.js";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { PortfolioService } from "../js/domain/portfolio-service.js";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

for(const category of["housing","power","food","industry","mining"]){
  const costs=TECH_TREES[category].map(t=>t.cost);assert.equal(costs[0],0);for(let i=2;i<costs.length;i++)assert.ok(costs[i]>costs[i-1],`${category} costs must increase every level`);assert.ok(costs[1]>=25000,`${category} L2 must be materially expensive`);
  const top=costs.at(-1);if(category==="mining")assert.ok(top>=100000000,"Mining L10 must be corporation-scale expensive");else assert.ok(top>=1000000,`${category} L5 must be a major corporation-scale investment`);
}
const contracts=new ContractService(),state=createGameState(contracts.first()),portfolio=new PortfolioService();portfolio.ensure(state);assert.equal(state.portfolio.colonies.length,1);state.pop=333;portfolio.captureActive(state,true);const second=contracts.options(2)[0];portfolio.addColony(state,second);assert.equal(state.portfolio.colonies.length,2);assert.equal(state.pop,120);const firstId=state.portfolio.colonies[0].id;assert.equal(portfolio.switchTo(state,firstId),true);assert.equal(Math.round(state.pop),333,"switching colonies must restore independent population state");
const sim=read("js/domain/simulation-engine.js");assert.match(sim,/operatingCost/);assert.match(sim,/killColony/);const collection=read("js/domain/collection-service.js");assert.match(collection,/state\.contract\?\.ended/);assert.match(collection,/state\.status==="dead"/);const app=read("js/app.js");assert.match(app,/simulateInactive/);assert.match(app,/backgroundDeaths/);assert.match(app,/onSwitchColony/);assert.match(app,/onRelocateColony/);const ui=read("js/ui/portfolio-ui.js");assert.match(ui,/colony-grid/);assert.match(ui,/data-colony-id/);assert.match(ui,/Corporation Refuses Colony/);assert.match(ui,/DEAD/);const contract=read("js/domain/contract-service.js");assert.match(contract,/RENEWAL_YEARS/);assert.match(contract,/resourceHealth/);assert.match(contract,/localRevenue/);assert.match(contract,/localCosts/);
console.log("MineIT canonical multi-colony portfolio and technology-cost test passed");
