import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIG } from "../js/core/config.js";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState, normalizeState } from "../js/domain/game-state.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),tech=new TechnologyService(),collection=new CollectionService(resources,inventory,tech),colony=new ColonyService(inventory,tech),trade=new TradeService(resources,inventory),engine=new SimulationEngine(resources,tech,collection,trade,inventory,colony);
const fresh=()=>{const state=createGameState(contracts.first());tech.recompute(state);engine.recalculate(state);return state;};

const state=fresh();
assert.equal(state.version,7);assert.equal(inventory.amount(state,"food"),CONFIG.START_FOOD);assert.equal(inventory.amount(state,"build"),CONFIG.START_BUILD);assert.equal(inventory.amount(state,"fuel"),CONFIG.START_FUEL);assert.equal(inventory.amount(state,"ore"),CONFIG.START_ORE);
assert.ok(resources.baseOutput(100)<20,"A normal early resource site must no longer solve a whole large colony");assert.ok(resources.baseOutput(10000)>resources.baseOutput(100)*4,"Very high quality must still materially improve throughput");
assert.ok(state.metrics.foodDays>80&&state.metrics.foodDays<100,"Starter Food should provide roughly three months with no production");
assert.equal(state.contract.supportLoad,1);const barren=contracts.make(contracts.archetype({arch:"barren"}),3,0);assert.equal(barren.supportLoad,1.5,"Hostile worlds must carry ongoing support load");

state.colony.industryLevel=6;state.pop=375;assert.equal(colony.industryPopulationRequirement(6),750);assert.equal(colony.industryPopulationFactor(state),.5,"Industry output must be population staffed");state.pop=750;assert.equal(colony.industryPopulationFactor(state),1);

const emergency=fresh();emergency.tiles={
  food:{x:1,y:1,revealed:true,developed:true,depleted:false,level:1,type:"food",resourceId:"fungal",name:"Fungal Shelf",quality:100,resourceMult:1,requiredMiningLevel:1,sustainability:"renewable",abundance:1},
  fuel:{x:2,y:1,revealed:true,developed:true,depleted:false,level:1,type:"fuel",resourceId:"biomass",name:"Biomass",quality:100,resourceMult:1,requiredMiningLevel:1,sustainability:"renewable",abundance:1},
  ore:{x:3,y:1,revealed:true,developed:true,depleted:false,level:1,type:"ore",resourceId:"surface-iron",name:"Surface Iron Nodules",quality:100,resourceMult:1,requiredMiningLevel:1,sustainability:"finite",reserve:10000,initialReserve:10000},
  build:{x:4,y:1,revealed:true,developed:true,depleted:false,level:1,type:"build",resourceId:"fiber",name:"Construction Fibre",quality:100,resourceMult:1,requiredMiningLevel:1,sustainability:"renewable",abundance:1}
};
emergency.colony.emergencyMode=false;const normalSites=collection.activeSites(emergency),normalDemand=colony.demand(emergency,normalSites.length);assert.equal(normalSites.length,4);emergency.colony.emergencyMode=true;const emergencySites=collection.activeSites(emergency),emergencyDemand=colony.demand(emergency,emergencySites.length);assert.deepEqual(emergencySites.map(t=>t.type).sort(),["food","fuel"]);assert.equal(emergencyDemand.oreDemand,0);assert.ok(emergencyDemand.powerDemand<normalDemand.powerDemand,"Emergency Mode must reduce power demand");engine.recalculate(emergency);assert.equal(emergency.metrics.industry,0,"Emergency Mode must stop Industry");

const ship=fresh();ship.company.cash=1e9;assert.equal(tech.buy(ship,"power").ok,true);tech.recompute(ship);ship.colony.housingCapacity=500;assert.equal(trade.arrive(ship),true);const transfer=trade.transferColonists(ship,250);assert.equal(transfer.ok,true);assert.equal(Math.round(ship.pop),370);assert.equal(trade.passengerRemaining(ship),0);assert.equal(trade.transferColonists(ship,50).ok,false,"Passenger capacity must limit population expansion per visit");const gold=trade.catalog().find(x=>x.resourceId==="gold");const importResult=trade.buy(ship,gold.key,5000);assert.equal(importResult.ok,true);assert.equal(importResult.qty,CONFIG.TRADE_BASE_CARGO);assert.equal(trade.cargoRemaining(ship),0);assert.equal(trade.buy(ship,gold.key,1).ok,false,"Import cargo must prevent unlimited buying");

const doomed=fresh();doomed.company.rep=10;doomed.inventory={};doomed.pop=5;engine.recalculate(doomed);let days=0;while(doomed.status!=="dead"&&days<300){engine.tick(doomed);days++;}assert.equal(doomed.status,"dead","A colony with no Food and no usable Fuel must be able to die");assert.equal(doomed.pop,0);assert.ok(days<240,"Complete life-support collapse should resolve within months, not years");assert.equal(doomed.contract.ended,true);assert.equal(doomed.company.rep,8);engine.recalculate(doomed);assert.equal(doomed.metrics.operatingCost,0,"Dead colonies must stop operating costs");assert.equal(collection.activeSites(doomed).length,0,"Dead colonies cannot extract resources");

const legacy=fresh();legacy.version=6;legacy.contract.goals.food=620;delete legacy.colony.emergencyMode;delete legacy.trade.cargoUsed;delete legacy.trade.passengersUsed;legacy.tiles["9,9"]={x:9,y:9,revealed:true,developed:false,depleted:false,type:"ore",resourceId:"iron",name:"Iron Ore",quality:100,resourceMult:1,requiredMiningLevel:3,sustainability:"finite",reserve:50000,initialReserve:100000,depositScale:"Large"};legacy.portfolio.colonies[0].data.tiles={"8,8":{x:8,y:8,revealed:true,developed:false,depleted:false,type:"ore",resourceId:"iron",name:"Iron Ore",quality:100,resourceMult:1,requiredMiningLevel:3,sustainability:"finite",reserve:100000,initialReserve:200000,depositScale:"Huge"}};const reserveScale=resources.baseOutput(100)/(8+7*Math.pow(100,.52));normalizeState(legacy);assert.equal(legacy.version,7);assert.equal(legacy.contract.goals.food,124,"Old Food production goals must migrate to the rebalanced scale");assert.equal(legacy.colony.emergencyMode,false);assert.equal(legacy.trade.cargoUsed,0);assert.equal(legacy.trade.passengersUsed,0);assert.equal(legacy.tiles["9,9"].initialReserve,Math.round(100000*reserveScale),"Active legacy deposits must preserve approximate lifetime under lower extraction throughput");assert.equal(legacy.tiles["9,9"].reserve,Math.round(50000*reserveScale));assert.equal(legacy.portfolio.colonies[0].data.tiles["8,8"].initialReserve,Math.round(200000*reserveScale),"Inactive colony deposits must migrate too");

const appSource=readFileSync(new URL("../js/app.js",import.meta.url),"utf8"),tradeUI=readFileSync(new URL("../js/ui/trade-ui.js",import.meta.url),"utf8"),colonyUI=readFileSync(new URL("../js/ui/colony-tech-ui.js",import.meta.url),"utf8"),survivalUI=readFileSync(new URL("../js/ui/survival-ui.js",import.meta.url),"utf8");assert.match(appSource,/backgroundDeaths/);assert.match(appSource,/gameOver/);assert.match(tradeUI,/COLONIST TRANSFER/);assert.match(tradeUI,/Import cargo remaining/);assert.match(colonyUI,/EMERGENCY MODE/);assert.match(colonyUI,/Industry staffing/);assert.match(survivalUI,/Survival, shortages & colony death/);
console.log("MineIT colony survival rebalance test passed",{deathDays:days,foodRunway:state.metrics.foodDays,cargo:CONFIG.TRADE_BASE_CARGO,passengers:CONFIG.TRADE_PASSENGER_CAPACITY});
