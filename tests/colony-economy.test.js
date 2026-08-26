import assert from "node:assert/strict";
import { CONFIG } from "../js/core/config.js";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { WorldService } from "../js/domain/world-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { SiteService } from "../js/domain/site-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),tech=new TechnologyService();
const world=new WorldService(resources,contracts),collection=new CollectionService(resources,inventory,tech),colony=new ColonyService(inventory,tech),sites=new SiteService(contracts,tech,inventory,colony,resources),trade=new TradeService(resources,inventory),engine=new SimulationEngine(resources,tech,collection,trade,inventory,colony);
const state=createGameState(contracts.first());tech.recompute(state);engine.recalculate(state);
assert.deepEqual(state.company.tech,{housing:1,power:1,food:1,industry:1,mining:1});
assert.equal(state.contract.colonyTier,1);assert.equal(state.contract.techAccess,"direct");
assert.ok(inventory.amount(state,"food")>0&&inventory.amount(state,"build")>0&&inventory.amount(state,"fuel")>0&&inventory.amount(state,"ore")>0);

const cats=new Set();for(let y=-30;y<=30;y++)for(let x=-30;x<=30;x++)cats.add(world.reveal(state,x,y).type);
assert.deepEqual([...cats].sort(),["build","food","fuel","ore"]);

const stone={x:1,y:1,terrain:"hill",terrainYieldFactor:1,revealed:true,developed:false,depleted:false,type:"build",resourceId:"stone",name:"Stone",quality:100,resourceMult:1,requiredMiningLevel:2,requiredMiningTech:"Quarrying",sustainability:"finite",reserve:100000,initialReserve:100000};
assert.equal(sites.developRequirements(state,stone).ok,false);assert.match(sites.developRequirements(state,stone).reason,/Mining L2/);
state.company.cash=1e9;const buyMining=tech.buy(state,"mining");assert.equal(buyMining.ok,true);assert.equal(state.company.tech.mining,2);
const buildBefore=inventory.amount(state,"build"),cashBeforeDevelop=state.company.cash;const developed=sites.develop(state,stone);assert.equal(developed.ok,true);assert.ok(inventory.amount(state,"build")<buildBefore);assert.equal(state.company.cash,cashBeforeDevelop,"local extraction construction must not spend corporate cash");
state.tiles["1,1"]=stone;

const rowsBefore=collection.current(state);assert.equal(rowsBefore.length,1);assert.equal(rowsBefore[0].stock,0);
engine.tick(state);const rowsAfter=collection.current(state);assert.ok(rowsAfter[0].stock>0,"collection popup stock should rise after collection");

const foodBefore=inventory.amount(state,"food"),fuelBefore=inventory.amount(state,"fuel"),oreBefore=inventory.amount(state,"ore");
for(let i=0;i<10;i++)engine.tick(state);
assert.ok(inventory.amount(state,"food")<foodBefore,"population consumes food");
assert.ok(inventory.amount(state,"fuel")<fuelBefore,"population/industry consume fuel");
assert.ok(inventory.amount(state,"ore")<oreBefore,"installed industry consumes ore");
assert.ok(state.metrics.foodDemand>0&&state.metrics.fuelDemand>0&&state.metrics.oreDemand>0);
assert.equal(colony.canExpandIndustry(state).ok,false);assert.match(colony.canExpandIndustry(state).reason,/individual map buildings/i);

const powerBefore=tech.level(state,"power");assert.equal(tech.buy(state,"power").ok,true);tech.recompute(state);assert.equal(tech.level(state,"power"),powerBefore+1);assert.equal(tech.maxBuildingLevel(state,"power"),powerBefore+1);

const barren=contracts.make(contracts.archetype({arch:"barren"}),3,0);assert.equal(barren.naturalFood,false);assert.equal(tech.meetsRequirements(state,barren.requiredTech),false);
state.contract=barren;assert.equal(tech.canAccessStore(state),false);state.trade.active=true;assert.equal(tech.canAccessStore(state),true);state.trade.active=false;

state.contract.techAccess="direct";while(state.company.tech.food<3){assert.equal(tech.buy(state,"food").ok,true);}tech.recompute(state);assert.ok(colony.syntheticFoodRate(state)>0);

state.trade.active=true;const gold=trade.catalog().find(x=>x.resourceId==="gold"),iron=trade.catalog().find(x=>x.resourceId==="iron");assert.ok(trade.sellPrice(gold)>trade.sellPrice(iron));assert.ok(trade.buyPrice(gold)>trade.sellPrice(gold));
const cashBefore=state.company.cash;const buy=trade.buy(state,gold.key,100);assert.ok(buy.ok&&state.company.cash<cashBefore);const sell=trade.sell(state,gold.key,100);assert.ok(sell.ok);assert.ok(state.company.cash<cashBefore,"buy then sell must lose money");

state.trade.active=false;state.contract.distanceLy=1;state.year=1;state.day=181;state.trade.nextArrivalDay=CONFIG.FIRST_TRADE_DAY;assert.equal(trade.shouldArrive(state),true);

console.log("MineIT canonical colony economy + technology smoke test passed",{categories:[...cats],tech:state.company.tech,foodDemand:state.metrics.foodDemand,fuelDemand:state.metrics.fuelDemand,oreDemand:state.metrics.oreDemand});
