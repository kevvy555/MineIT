import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { SiteService } from "../js/domain/site-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),technology=new TechnologyService(),collection=new CollectionService(resources,inventory,technology),colony=new ColonyService(inventory,technology),trade=new TradeService(resources,inventory),sites=new SiteService(contracts,technology,inventory,colony),engine=new SimulationEngine(resources,technology,collection,trade,inventory,colony);
const state=createGameState(contracts.first());technology.recompute(state);state.company.cash=1e9;
const tile=(x,type,resourceId,name)=>({x,y:1,revealed:true,developed:true,depleted:false,level:1,type,resourceId,name,quality:100,resourceMult:1,requiredMiningLevel:1,sustainability:type==="food"||resourceId==="biomass"||resourceId==="fiber"?"renewable":"finite",abundance:1,reserve:100000,initialReserve:100000});
state.tiles={
  food:tile(1,"food","fungal","Fungal Shelf"),
  fuel:tile(2,"fuel","biomass","Biomass"),
  build1:tile(3,"build","fiber","Construction Fibre"),
  build2:tile(4,"build","fiber","Construction Fibre"),
  ore1:tile(5,"ore","surface-iron","Surface Iron Nodules"),
  ore2:tile(6,"ore","surface-iron","Surface Iron Nodules")
};
engine.recalculate(state);
assert.equal(Math.round(state.metrics.industryCapacity),100,"L1 staffed Industry should provide 100 operational capacity");
assert.equal(state.metrics.industryLoad,120,"Six L1 sites should consume 120 capacity");
assert.equal(state.metrics.industrySurvivalLoad,40,"Food and Fuel consume capacity first");
assert.equal(state.metrics.industryCommercialLoad,80);
assert.equal(state.metrics.industryCommercialFactor,.75,"Commercial extraction must take the overload penalty after survival priority");
const food=state.tiles.food,ore=state.tiles.ore1;
assert.equal(resources.collectionRate(state,food),resources.unthrottledCollectionRate(state,food),"Food must retain priority during overload");
assert.ok(Math.abs(resources.collectionRate(state,ore)-resources.unthrottledCollectionRate(state,ore)*.75)<1e-9,"Ore must be throttled by Industrial Capacity overload");

state.colony.industryLevel=2;state.pop=190;technology.recompute(state);engine.recalculate(state);assert.equal(Math.round(state.metrics.industryCapacity),200);assert.equal(state.metrics.industryCommercialFactor,1,"Expanding and staffing Industry should restore full commercial extraction");
assert.equal(colony.processingBonus(100),0);assert.equal(colony.processingBonus(200),.05);assert.equal(colony.processingBonus(300),.10);assert.equal(colony.processingBonus(500),.20);assert.equal(colony.processingBonus(1000),.35);assert.equal(colony.processingBonus(2000),.50);assert.equal(colony.processingBonus(5000),.50);

const baseGold=trade.sellPrice("ore","gold","excellent");state.metrics.processingBonus=.20;assert.equal(trade.exportPrice(state,"ore","gold","excellent"),baseGold*1.2,"Industry processing must raise export value without changing corporate buy/base price");
state.trade.active=true;inventory.store(state,"ore","gold","Gold",10,500);const cashBefore=state.company.cash,sale=trade.sellBand(state,"ore:gold","excellent",10);assert.equal(sale.ok,true);assert.equal(sale.revenue,baseGold*1.2*10);assert.equal(state.company.cash,cashBefore+sale.revenue);

const upgradeTile={x:1,y:2,revealed:true,developed:true,depleted:false,level:1,type:"food",resourceId:"fungal",name:"Fungal Shelf",quality:100,resourceMult:1,requiredMiningLevel:1,sustainability:"renewable",abundance:1};
state.colony.industryLevel=1;let req=sites.upgradeRequirements(state,upgradeTile);assert.equal(req.ok,false);assert.match(req.reason,/Industry L2/);state.colony.industryLevel=2;req=sites.upgradeRequirements(state,upgradeTile);assert.equal(req.ok,true,"Site L2 upgrade should unlock at Industry L2");upgradeTile.level=2;req=sites.upgradeRequirements(state,upgradeTile);assert.equal(req.ok,false);assert.match(req.reason,/Industry L3/);
assert.equal(colony.siteUpgradeIndustryRequirement(4),5);assert.equal(colony.siteUpgradeIndustryRequirement(5),7);assert.ok(colony.siteIndustryLoad({...ore,level:3})>colony.siteIndustryLoad({...ore,level:1}),"Upgraded sites must consume more Industrial Capacity");

const industryUI=readFileSync(new URL("../js/ui/industry-ui.js",import.meta.url),"utf8"),tradeUI=readFileSync(new URL("../js/ui/industry-trade-ui.js",import.meta.url),"utf8"),app=readFileSync(new URL("../js/app.js",import.meta.url),"utf8");assert.match(industryUI,/INDUSTRIAL CAPACITY/);assert.match(industryUI,/Food and Fuel sites keep priority/);assert.match(industryUI,/Export processing/);assert.match(industryUI,/Industry now has an operational purpose/);assert.match(tradeUI,/processing bonus/);assert.match(app,/new SiteService\(this\.contracts,this\.technology,this\.inventory,this\.colony\)/);
assert.equal(state.version,7,"Industry purpose update should not require a save-schema bump");
console.log("MineIT Industry capacity + processing test passed",{capacity:state.metrics.industryCapacity,load:state.metrics.industryLoad,processing:state.metrics.processingBonus});
