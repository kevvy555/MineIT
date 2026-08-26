import assert from "node:assert/strict";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state-v511.js";
import { ResourceService } from "../js/domain/resource-service-v570.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service-v570.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service-v570.js";
import { TradeService } from "../js/domain/trade-service-v511.js";
import { SimulationEngine } from "../js/domain/simulation-engine-v5113.js";
import { DevelopmentService } from "../js/domain/development-service-v570.js";
import { LandService } from "../js/domain/land-service.js";

// This test intentionally composes the same domain implementations selected by the browser import map.
// It protects behaviour while the versioned implementation chain is flattened.
const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),technology=new TechnologyService(),collection=new CollectionService(resources,inventory,technology),colony=new ColonyService(inventory,technology),trade=new TradeService(resources,inventory),engine=new SimulationEngine(resources,technology,collection,trade,inventory,colony),land=new LandService(),development=new DevelopmentService(inventory,land);
const state=createGameState(contracts.first());
state.company.tech={housing:5,power:5,food:5,industry:5,mining:5};
land.ensure(state);technology.recompute(state);engine.recalculate(state);

// Active depletion path: workers must be released in the very tick a finite deposit ends.
const finite={x:1,y:1,terrain:"plain",terrainYieldFactor:1,revealed:true,developed:true,depleted:false,resourceCovered:false,type:"ore",family:"ore",resourceId:"surface-iron",name:"Surface Iron Nodules",quality:500,resourceMult:1,requiredMiningLevel:1,requiredMiningTech:"Surface Recovery",sustainability:"finite",reserve:.01,initialReserve:100,depositScale:"small",level:1,development:{kind:"extract",family:"mine",level:1,investedBuild:40,investedOre:10}};
state.tiles["1,1"]=finite;engine.recalculate(state);
const requiredBefore=state.metrics.workforceRequired,freeBefore=state.metrics.workforceFree;
const tickResult=engine.tick(state);
assert.equal(finite.depleted,true,"finite site should deplete in the active runtime engine");
assert.equal(finite.developed,false,"depleted site should stop operating immediately");
assert.ok((tickResult.depletedSites?.length||0)>=1,"depletion should be reported by the simulation tick");
assert.ok(state.metrics.workforceRequired<requiredBefore,"depleted-site staff must leave required workforce in the same tick");
assert.ok(state.metrics.workforceFree>freeBefore,"depleted-site staff must return to the free pool in the same tick");

// Active construction path: costs are physical inventory and demolition returns exactly 25% of invested materials.
inventory.store(state,"build","fiber","Construction Fibre",5000,500);
inventory.store(state,"ore","surface-iron","Surface Iron Nodules",5000,500);
const buildTile={x:2,y:2,terrain:"plain",revealed:true,developed:false,depleted:false,development:null,resourceId:null};state.tiles["2,2"]=buildTile;
const buildBefore=inventory.amount(state,"build"),oreBefore=inventory.amount(state,"ore"),placed=development.place(state,buildTile,"industry");
assert.equal(placed.ok,true);assert.ok(buildTile.development);assert.ok(inventory.amount(state,"build")<buildBefore);assert.ok(inventory.amount(state,"ore")<=oreBefore);
const investedBuild=buildTile.development.investedBuild,investedOre=buildTile.development.investedOre,afterBuild=inventory.amount(state,"build"),afterOre=inventory.amount(state,"ore"),demolished=development.demolish(state,buildTile);
assert.equal(demolished.ok,true);assert.equal(demolished.recoverBuild,Math.floor(investedBuild*.25));assert.equal(demolished.recoverOre,Math.floor(investedOre*.25));assert.equal(inventory.amount(state,"build"),afterBuild+demolished.recoverBuild);assert.equal(inventory.amount(state,"ore"),afterOre+demolished.recoverOre);assert.equal(buildTile.development,null);

// Active trade wrapper must enforce the corporate service radius rather than silently using legacy service everywhere.
state.contract.distanceLy=state.company.expansion.serviceRadiusLy+1;assert.equal(trade.serviceAvailable(state),false);state.contract.distanceLy=1;assert.equal(trade.serviceAvailable(state),true);

console.log("MineIT active browser-domain composition behaviour test passed");
