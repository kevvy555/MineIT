import assert from "node:assert/strict";
import { ResourceService } from "../js/domain/resource-service-v562.js";
import { ColonyService } from "../js/domain/colony-service-v562.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { OPERATING_MODES,supportsOverdrive,setOperatingMode,advanceOverdriveRisk,riskExposure } from "../js/domain/extraction-overdrive.js";

const tile=(family="mine",type="ore")=>({x:2,y:3,revealed:true,developed:true,depleted:false,level:1,type,resourceId:"test",sustainability:"finite",depositScale:"large",terrainYieldFactor:1,requiredMiningLevel:1,development:{kind:"extract",family,level:1}});

assert.deepEqual(Object.keys(OPERATING_MODES),["normal","pushed","hard"]);
assert.equal(OPERATING_MODES.pushed.workforce,1.25);
assert.equal(OPERATING_MODES.pushed.output,1.15);
assert.equal(OPERATING_MODES.hard.workforce,1.5);
assert.equal(OPERATING_MODES.hard.output,1.3);
for(const family of["quarry","mine","deep-mine","rig"])assert.equal(supportsOverdrive(tile(family)),true,`${family} should support overdrive`);
assert.equal(supportsOverdrive(tile("farm","food")),false,"food sites must remain unchanged");
const renewable=tile("mine","fuel");renewable.sustainability="renewable";assert.equal(supportsOverdrive(renewable),false,"renewable sites keep their existing harvest system");

const mine=tile("mine","ore"),resources=new ResourceService(),state={metrics:{workforceCommercialFactor:1,industryCommercialFactor:1}};
const normalOutput=resources.sitePotentialRate(mine);assert.ok(setOperatingMode(mine,"hard").ok);assert.equal(resources.sitePotentialRate(mine),normalOutput*1.3);
const colony=new ColonyService({},{}),workerState={metrics:{miningWorkforceEfficiency:1}};
const normalWorkers=colony.siteWorkforce(workerState,mine,null,"normal"),hardWorkers=colony.siteWorkforce(workerState,mine,null,"hard");assert.equal(hardWorkers,Math.ceil(normalWorkers*1.5));

mine.overdriveExposure=29;mine.operatingMode="hard";const accidentState={seed:7,year:1,day:10,pop:100};let rolls=[0,.9];const machinery=advanceOverdriveRisk(accidentState,mine,()=>rolls.shift());assert.equal(machinery.outcome,"machinery");assert.equal(machinery.name,"Tunnel Collapse");assert.equal(mine.accidentShutdownDays,3);assert.equal(mine.operatingMode,"normal");assert.equal(riskExposure(mine),0);assert.equal(accidentState.pop,100);

const deep=tile("deep-mine","ore");deep.overdriveExposure=29;deep.operatingMode="hard";const fatalState={seed:9,year:2,day:20,pop:50};rolls=[0,0,.999];const fatal=advanceOverdriveRisk(fatalState,deep,()=>rolls.shift());assert.equal(fatal.outcome,"fatalities");assert.equal(fatal.name,"Rockburst & Shaft Collapse");assert.equal(fatal.deaths,4);assert.equal(fatalState.pop,46);

const collection=new CollectionService(resources,{},{canExploit:()=>true}),closed=tile("rig","fuel");closed.accidentShutdownDays=3;const collectionState={contract:{ended:false},status:"playing",colony:{emergencyMode:false},tiles:{a:closed}};assert.equal(collection.activeSites(collectionState).length,0);const initial=collection.shutdownSites(collectionState);collection.advanceShutdowns(initial);assert.equal(closed.accidentShutdownDays,2);collection.advanceShutdowns([closed]);collection.advanceShutdowns([closed]);assert.equal(closed.accidentShutdownDays,0);assert.equal(collection.activeSites(collectionState).length,1);

console.log("extraction overdrive and accident tests passed");
