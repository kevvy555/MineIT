import assert from "node:assert/strict";
import fs from "node:fs";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { DevelopmentService } from "../js/domain/development-service.js";
import { LandService } from "../js/domain/land-service.js";
import { WorldService } from "../js/domain/world-service.js";
import { ContractService } from "../js/domain/contract-service.js";

const resources=new ResourceService(),inventory=new InventoryService(resources),land=new LandService(),development=new DevelopmentService(inventory,land),collection=new CollectionService(resources,inventory,{canExploit:()=>true}),world=new WorldService(resources,new ContractService(),land);
const state={
  seed:246813579,
  contract:{uid:"depleted-site-test",arch:"temperate",ended:false},
  status:"playing",
  tiles:{},
  inventory:{},
  colony:{tech:{housing:1,power:1,food:1,industry:1,mining:5,scanning:5}},
  company:{tech:{housing:1,power:1,food:1,industry:1,mining:5,scanning:5}},
  metrics:{workforceSurvivalFactor:1,workforceCommercialFactor:1,industryCommercialFactor:1,foodProductionMultiplier:1}
};
inventory.store(state,"build","fiber","Construction Fibre",1000);
inventory.store(state,"ore","surface-iron","Surface Iron Nodules",1000);

const finite={x:1,y:1,terrain:"hill",terrainVariant:2,revealed:true,lastScannedAtLevel:1,developed:true,level:2,depleted:false,resourceExhausted:false,resourceCovered:false,type:"ore",family:"ore",resourceId:"iron",name:"Iron Ore",resourceRarity:"Common",resourceMult:1,quality:250,requiredScanningLevel:1,requiredMiningLevel:1,requiredMiningTech:"Mining",terrainYieldFactor:1,sustainability:"finite",abundance:1,depositScale:"Small",reserve:1,initialReserve:1,development:{kind:"extract",family:"mine",level:2,investedBuild:120,investedOre:20}};
state.tiles["1,1"]=finite;
const exhausted=collection.collectDay(state,finite);
assert.equal(exhausted.exhausted,true,"finite extraction should report exhaustion");
assert.equal(finite.depleted,true,"finite deposit should become depleted");
assert.equal(finite.developed,true,"depletion must leave the physical extraction facility in place");
assert.equal(finite.development?.kind,"extract","depleted extraction facility must remain demolishable");

const originalTerrain=finite.terrain,originalResourceId=finite.resourceId,demolished=development.demolish(state,finite);
assert.equal(demolished.ok,true);
assert.equal(demolished.clearedExhaustedResource,true,"demolishing a depleted extractor must clear the exhausted deposit");
assert.equal(finite.development,null);
assert.equal(finite.developed,false);
assert.equal(finite.level,0);
assert.equal(finite.resourceId,null,"depleted resource must disappear after demolition");
assert.equal(finite.name,"Clear Land");
assert.equal(finite.depleted,false);
assert.equal(finite.resourceExhausted,true,"tile must remember that its deterministic deposit has been exhausted");
assert.equal(finite.exhaustedResourceId,originalResourceId);
assert.equal(finite.terrain,originalTerrain,"demolition must preserve the original terrain");
assert.equal(development.canPlace(state,finite,"housing").ok,true,"cleared depleted site must become reusable land");

world.reveal(state,finite.x,finite.y,10);
assert.equal(finite.resourceId,null,"higher-level resurvey must not regenerate an exhausted deposit");
assert.equal(finite.name,"Clear Land");
assert.equal(finite.resourceExhausted,true);
assert.equal(finite.terrain,originalTerrain);

const active={x:2,y:1,terrain:"plain",terrainVariant:1,revealed:true,lastScannedAtLevel:1,developed:true,level:1,depleted:false,resourceCovered:false,type:"ore",family:"ore",resourceId:"surface-iron",name:"Surface Iron Nodules",quality:100,depositScale:"Large",reserve:5000,initialReserve:5000,development:{kind:"extract",family:"mine",level:1,investedBuild:80,investedOre:0}};
state.tiles["2,1"]=active;
const activeResult=development.demolish(state,active);
assert.equal(activeResult.ok,true);
assert.equal(activeResult.clearedExhaustedResource,false,"active extraction demolition must not erase an undepleted deposit");
assert.equal(active.resourceId,"surface-iron");
assert.equal(active.resourceExhausted,undefined);
assert.equal(active.development,null);

const legacy={x:3,y:1,terrain:"mountain",revealed:true,developed:false,level:3,depleted:true,type:"ore",resourceId:"copper",name:"Copper Ore",quality:400,depositScale:"Modest",reserve:0,initialReserve:1000,development:null};
land.syncExtraction(legacy);
assert.equal(legacy.developed,true,"legacy depleted saves must restore the still-present extraction facility");
assert.equal(legacy.development?.kind,"extract");
assert.equal(legacy.development?.level,3);

const renewable={x:4,y:1,terrain:"plain",revealed:true,developed:true,level:1,depleted:false,type:"food",resourceId:"flora",name:"Edible Flora",sustainability:"renewable",abundanceLabel:"Limited",renewableOriginalRank:0,renewableHealth:0,harvestIntensity:2,development:{kind:"extract",family:"farm",level:1,investedBuild:50}};
const wiped=resources.updateRenewable(renewable);
assert.equal(wiped?.kind,"wiped");
assert.equal(renewable.depleted,true);
assert.equal(renewable.developed,true,"wiped renewable resources must also leave their facility for player demolition");

const resourceDevelopmentUI=fs.readFileSync(new URL("../js/ui/resource-development-ui.js",import.meta.url),"utf8"),landUI=fs.readFileSync(new URL("../js/ui/land-ui.js",import.meta.url),"utf8");
assert.match(resourceDevelopmentUI,/DEMOLISH DEPLETED SITE/,"depleted resource details must expose demolition");
assert.match(resourceDevelopmentUI,/appendDepletedDemolish/);
assert.match(resourceDevelopmentUI,/onDemolishDevelopment/);
assert.match(landUI,/if\(tile\.depleted\)\{this\.appendDepletedDemolish\?\.\(tile\);return true;\}/,"land inspection must reuse the depleted demolition action instead of adding a duplicate");

console.log("depleted extraction demolition and permanent land restoration regression passed");
