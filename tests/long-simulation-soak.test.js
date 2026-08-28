import assert from "node:assert/strict";
import { CONFIG } from "../js/core/config.js";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),technology=new TechnologyService(),collection=new CollectionService(resources,inventory,technology),colony=new ColonyService(inventory,technology),trade=new TradeService(resources,inventory),engine=new SimulationEngine(resources,technology,collection,trade,inventory,colony);
const state=createGameState(contracts.first());
state.company.cash=1e12;
inventory.store(state,"food","soak-food","Soak Food",5e6,500);
inventory.store(state,"fuel","soak-fuel","Soak Fuel",5e6,500);
inventory.store(state,"ore","soak-ore","Soak Ore",5e6,500);
inventory.store(state,"build","soak-build","Soak Build",5e6,500);
technology.recompute(state);engine.recalculate(state);

const startPop=state.pop,totalDays=25*CONFIG.DAYS_PER_YEAR,finiteMetrics=["foodDemand","fuelDemand","oreDemand","survivalSupply","powerFactor","industry","stockValue","operatingCost","totalOperatingCost"];
for(let absoluteDay=1;absoluteDay<=totalDays;absoluteDay++){
  state.year=Math.floor((absoluteDay-1)/CONFIG.DAYS_PER_YEAR)+1;
  state.day=(absoluteDay-1)%CONFIG.DAYS_PER_YEAR+1;
  const result=engine.tick(state);
  assert.equal(result.colonyDied,false,`colony died during soak at Y${state.year} D${state.day}`);
  assert.equal(state.status,"playing",`simulation left playing state at Y${state.year} D${state.day}`);
  if(absoluteDay%CONFIG.DAYS_PER_YEAR===0){
    for(const key of finiteMetrics)assert.ok(Number.isFinite(Number(state.metrics[key]??0)),`metric ${key} became non-finite at Y${state.year}`);
    for(const type of["food","fuel","ore","build"])assert.ok(inventory.amount(state,type)>=0,`${type} inventory became negative at Y${state.year}`);
    assert.ok(state.pop>0,`population collapsed at Y${state.year}`);
    assert.ok(Number.isFinite(state.company.cash),`cash became non-finite at Y${state.year}`);
  }
}

assert.equal(state.year,25);assert.equal(state.day,CONFIG.DAYS_PER_YEAR);assert.ok(state.pop>=startPop,"stable supplied colony should not lose population during soak");assert.equal(engine.expansion.ship(state).status,"docked","player ship should remain stable while docked during long simulation");assert.equal(state.company.gameOver,false);
console.log(`MineIT accelerated long-simulation soak passed (${totalDays} daily ticks / ${state.year} years)`,{population:state.pop,cash:state.company.cash,food:inventory.amount(state,"food"),fuel:inventory.amount(state,"fuel"),ore:inventory.amount(state,"ore")});
