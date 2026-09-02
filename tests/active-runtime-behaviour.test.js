import assert from "node:assert/strict";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";
import { DevelopmentService } from "../js/domain/development-service.js";
import { LandService } from "../js/domain/land-service.js";
import { WorldService } from "../js/domain/world-service.js";
import { SurveyService } from "../js/domain/survey-service.js";

// This test composes the same canonical domain implementations used by the browser runtime.
const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),technology=new TechnologyService(),collection=new CollectionService(resources,inventory,technology),colony=new ColonyService(inventory,technology),trade=new TradeService(resources,inventory),engine=new SimulationEngine(resources,technology,collection,trade,inventory,colony),land=new LandService(),development=new DevelopmentService(inventory,land),world=new WorldService(resources,contracts,land),survey=new SurveyService(world,contracts);
const state=createGameState(contracts.first());
state.company.tech={housing:5,power:5,food:5,industry:5,mining:5};
state.colony.shipAccommodation={};
land.ensure(state);technology.recompute(state);engine.recalculate(state);

// Resurvey regression: a developed extraction site must not become "resource covered" and lose all output.
const rescanState=createGameState(contracts.first());technology.recompute(rescanState);inventory.store(rescanState,"fuel","biomass","Biomass",1000,500);rescanState.tiles["0,0"]={x:0,y:0,terrain:"plain",revealed:true,developed:true,development:{kind:"power",level:1,investedBuild:40,investedOre:0}};rescanState.tiles["0,1"]={x:0,y:1,terrain:"plain",revealed:true,developed:true,development:{kind:"industry",level:1,investedBuild:80,investedOre:0}};rescanState.colony.shipAccommodation={};rescanState.company.tech.scanning=2;rescanState.colony.tech.scanning=2;
const rescanTile={x:2,y:2,terrain:"plain",terrainYieldFactor:1,revealed:true,lastScannedAtLevel:1,developed:true,depleted:false,resourceCovered:false,type:"ore",family:"ore",resourceId:"surface-iron",name:"Surface Iron Nodules",quality:100,resourceMult:1,requiredScanningLevel:1,requiredMiningLevel:1,requiredMiningTech:"Surface Recovery",sustainability:"finite",reserve:10000,initialReserve:10000,depositScale:"Large",level:1,development:{kind:"extract",family:"mine",level:1,investedBuild:40,investedOre:0}};
rescanState.tiles["2,2"]=rescanTile;engine.recalculate(rescanState);const rateBeforeRescan=resources.collectionRate(rescanState,rescanTile);assert.ok(rateBeforeRescan>0,"developed extraction must produce before resurvey");
const queuedRescan=survey.enqueue(rescanState,2,2);assert.equal(queuedRescan.ok,true);assert.equal(queuedRescan.resurvey,true);rescanState.scans[0].remaining=1;const duplicateResults=survey.tick(rescanState);assert.deepEqual(duplicateResults,[],"resurveying the same known resource must not report a new discovery");assert.equal(rescanTile.lastScannedAtLevel,2);assert.equal(rescanTile.resourceCovered,false,"an extraction facility must never cover its own resource");assert.ok(resources.collectionRate(rescanState,rescanTile)>0,"resurvey must preserve extraction production capacity");
rescanTile.resourceCovered=true;assert.equal(resources.collectionRate(rescanState,rescanTile),0,"corrupted covered flag reproduces the zero-production failure");land.syncExtraction(rescanTile);assert.equal(rescanTile.resourceCovered,false,"land sync must repair already-corrupted extraction saves");assert.ok(resources.collectionRate(rescanState,rescanTile)>0,"repaired extraction must resume production without demolition/rebuild");

// A resurvey that genuinely reveals a previously unknown resource must still be surfaced.
const newlyFoundTile={x:3,y:3,terrain:"plain",revealed:true,lastScannedAtLevel:1,developed:false,depleted:false,resourceId:null,development:null};
const discoveryWorld={get:()=>newlyFoundTile,reveal:(local,x,y,level)=>Object.assign(newlyFoundTile,{revealed:true,lastScannedAtLevel:level,type:"fuel",family:"fuel",resourceId:"oil",name:"Crude Oil",quality:500,requiredMiningLevel:5,sustainability:"finite",reserve:10000,initialReserve:10000,depositScale:"Large"})};
const discoverySurvey=new SurveyService(discoveryWorld,contracts),discoveryState=createGameState(contracts.first());technology.recompute(discoveryState);discoveryState.company.tech.scanning=2;discoveryState.colony.tech.scanning=2;discoveryState.tiles["3,3"]=newlyFoundTile;const queuedDiscovery=discoverySurvey.enqueue(discoveryState,3,3);assert.equal(queuedDiscovery.ok,true);assert.equal(queuedDiscovery.resurvey,true);discoveryState.scans[0].remaining=1;const discoveryResults=discoverySurvey.tick(discoveryState);assert.equal(discoveryResults.length,1,"a genuinely new resource found during resurvey must still be reported");assert.equal(discoveryResults[0].resourceId,"oil");

// Active depletion path: workers must be released in the very tick a finite deposit ends.
inventory.store(state,"fuel","biomass","Biomass",1000,500);state.tiles["0,0"]={x:0,y:0,terrain:"plain",revealed:true,developed:true,development:{kind:"power",level:1,investedBuild:40,investedOre:0}};
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

// Canonical trade service enforces the corporate service radius.
state.contract.distanceLy=state.company.expansion.serviceRadiusLy+1;assert.equal(trade.serviceAvailable(state),false);state.contract.distanceLy=1;assert.equal(trade.serviceAvailable(state),true);

console.log("MineIT canonical browser-domain composition behaviour test passed");
