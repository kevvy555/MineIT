import assert from "node:assert/strict";
import { CONFIG } from "../js/core/config.js";
import { ContractService } from "../js/domain/contract-service.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { DevelopmentService } from "../js/domain/development-service.js";
import { LandService } from "../js/domain/land-service.js";
import { ExpansionService } from "../js/domain/expansion-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";
import { createGameState,normalizeState } from "../js/domain/game-state-runtime.js";
import { POWER_GENERATION,HEADQUARTERS_POWER_DEMAND,FACILITY_POWER_DEMAND,POWER_UPGRADE_GATES } from "../js/domain/building-model.js";

const contracts=new ContractService();
const resources=new ResourceService();
const inventory=new InventoryService(resources);
const colonyService=new ColonyService(inventory,{});
const land=new LandService();
const development=new DevelopmentService(inventory,land,colonyService);
const expansion=new ExpansionService(inventory,resources,contracts);
expansion.colonyService=colonyService;

const state=createGameState(contracts.first());
expansion.ensure(state);
state.colony.shipAccommodation={};
state.metrics.fuelIntensity=.1;
for(const type of ["build","ore","fuel","food"])inventory.store(state,type,type==="build"?"fiber":type==="ore"?"surface-iron":type==="fuel"?"biomass":"fungal","Test",100000,500);
const ship=expansion.ship(state);
ship.crew=ship.minimumCrew;
ship.targetSystemId=state.company.expansion.systems.find(system=>!system.home&&system.id!==state.contract.systemId).id;
const route=expansion.travelProfile(state,ship.targetSystemId,null,ship.id);
const powerTile={x:2,y:1,terrain:"plain",revealed:true,developed:false,resourceId:null};state.tiles["2,1"]=powerTile;assert.equal(development.place(state,powerTile,"power").ok,true);
expansion.loadFuel(state,"fuel:biomass",route.fuelRequired+100);
expansion.loadFood(state,"food:fungal",route.foodRequired+100);
let gate=expansion.canLaunch(state,ship.id);
assert.equal(gate.ok,false);
assert.equal(gate.launchEnabled,true);
assert.match(gate.reason,/Primary Headquarters/);
assert.deepEqual(gate.headquarters.failures.map(failure=>failure.code),["primary-missing"]);

const hqTile={x:1,y:1,terrain:"plain",revealed:true,developed:false,resourceId:null};
state.tiles["1,1"]=hqTile;
assert.equal(development.place(state,hqTile,"headquarters").ok,true);
colonyService.totals(state);
const network=colonyService.headquartersNetwork(state,{fuelStock:inventory.amount(state,"fuel")});
assert.equal(network.primaryId,"1,1");
assert.equal(network.rows.find(row=>row.id==="1,1").staffed,true);
gate=expansion.canLaunch(state,ship.id);
assert.equal(gate.ok,true);
assert.equal(expansion.launch(state,ship.id).ok,true);
assert.equal(state.colony.commandHandoverComplete,true);

const legacy=JSON.parse(JSON.stringify(state));
legacy.version=14;
legacy.colony.commandHandoverComplete=false;
const migrated=normalizeState(legacy);
assert.equal(migrated.version,15);
assert.equal(migrated.colony.commandHandoverComplete,true,"pre-A08a colonies migrate complete");
assert.equal(typeof migrated.colony.primaryHeadquartersId,"string");

const powerState=createGameState(contracts.first());
const powerInventory=new InventoryService(resources);
const powerColony=new ColonyService(powerInventory,{});
const powerLand=new LandService();
const powerDevelopment=new DevelopmentService(powerInventory,powerLand,powerColony);
for(const type of ["build","ore","fuel"])powerInventory.store(powerState,type,type==="build"?"fiber":type==="ore"?"surface-iron":"biomass","Test",100000,500);
powerState.tiles["3,3"]={x:3,y:3,terrain:"plain",revealed:true,resourceId:null,developed:false};
assert.equal(powerDevelopment.place(powerState,powerState.tiles["3,3"],"power").ok,true);
powerColony.totals(powerState);
const full=powerColony.powerNetwork(powerState,{fuelStock:100000});
const empty=powerColony.powerNetwork(powerState,{fuelStock:0});
assert.ok(full.onlineCapacity>0);
assert.equal(empty.fuelLimitedGeneration,0);
assert.equal(full.fullFuelBurn,full.onlineCapacity*.1);

assert.deepEqual([...POWER_GENERATION],[75,165,300,500,800]);
assert.deepEqual([...HEADQUARTERS_POWER_DEMAND],[1,2,4,7,11]);
assert.deepEqual([...FACILITY_POWER_DEMAND.farm],[2,5,10,18,30]);
assert.deepEqual([...FACILITY_POWER_DEMAND["deep-mine"]],[7,16,31,54,86]);
assert.deepEqual([...POWER_UPGRADE_GATES.mine],[0,125,250,440,710]);

const commandState=createGameState(contracts.first()),commandInventory=new InventoryService(resources),commandColony=new ColonyService(commandInventory,{}),commandDevelopment=new DevelopmentService(commandInventory,new LandService(),commandColony),commandExpansion=new ExpansionService(commandInventory,resources,contracts);commandExpansion.colonyService=commandColony;commandState.colony.shipAccommodation={};for(const type of["build","ore","fuel"])commandInventory.store(commandState,type,type==="build"?"fiber":type==="ore"?"surface-iron":"biomass","Test",100000,500);commandState.tiles.power={x:0,y:1,terrain:"plain",revealed:true,development:{kind:"power",level:1}};commandState.tiles["1,1"]={x:1,y:1,terrain:"plain",revealed:true,development:{kind:"headquarters",level:1}};commandState.tiles["2,1"]={x:2,y:1,terrain:"plain",revealed:true,development:{kind:"headquarters",level:2}};commandColony.totals(commandState);let command=commandColony.headquartersNetwork(commandState);assert.equal(command.primaryId,"1,1");assert.equal(command.source?.type,"headquarters");assert.equal(command.capacity,52);assert.equal(commandDevelopment.demolish(commandState,commandState.tiles["1,1"]).ok,true);command=commandColony.headquartersNetwork(commandState);assert.equal(command.source,null);assert.equal(command.capacity,0);assert.equal(command.rows.find(row=>row.id==="2,1").staffed,false);assert.equal(command.rows.find(row=>row.id==="2,1").eligibleForPrimary,true);assert.equal(command.reserved,0);assert.equal(command.power.bandRows.find(row=>row.priority==="headquarters").requested,0);const recoveredState=JSON.parse(JSON.stringify(commandState));assert.equal(commandColony.setPrimaryHeadquarters(recoveredState,recoveredState.tiles["2,1"]).ok,true);assert.equal(commandColony.headquartersNetwork(recoveredState).source?.type,"headquarters");const commandShip=commandExpansion.ship(commandState);commandShip.crew=commandShip.minimumCrew;command=commandColony.headquartersNetwork(commandState);assert.equal(command.source?.type,"ship");assert.equal(command.capacity,52);assert.equal(command.rows.find(row=>row.id==="2,1").staffed,true);assert.equal(command.power.bandRows.find(row=>row.priority==="headquarters").requested,2);

const shipSupportState=createGameState(contracts.first()),shipSupportInventory=new InventoryService(resources),shipSupportColony=new ColonyService(shipSupportInventory,{}),shipSupportTechnology={recompute(){},processDay(){return[];}},shipSupportCollection={activeSites(){return[];},shutdownSites(){return[];},collectDay(){return{collected:0};},advanceShutdowns(){}},shipSupportEngine=new SimulationEngine(resources,shipSupportTechnology,shipSupportCollection,{stockValue:()=>0},shipSupportInventory,shipSupportColony);const supportedShip=shipSupportEngine.expansion.ship(shipSupportState),shipFoodKey="food:fungal",shipFoodEntry=shipSupportState.inventory[shipFoodKey];supportedShip.foodLots[shipFoodKey]=JSON.parse(JSON.stringify(shipFoodEntry));delete shipSupportState.inventory[shipFoodKey];const shipFoodBefore=shipSupportEngine.expansion.transitFoodAmount(shipSupportState,supportedShip.id),populationBefore=shipSupportState.pop,shipDay=shipSupportEngine.tick(shipSupportState);assert.equal(shipSupportColony.foodDemandForPopulation(shipSupportState),0);assert.equal(shipDay.deaths,0);assert.equal(shipSupportState.pop,populationBefore);assert.ok(shipSupportEngine.expansion.transitFoodAmount(shipSupportState,supportedShip.id)<shipFoodBefore);assert.equal(shipSupportState.metrics.shipFoodConsumed,populationBefore*CONFIG.FOOD_PER_COLONIST);

const timingState=createGameState(contracts.first()),timingInventory=new InventoryService(resources),timingColony=new ColonyService(timingInventory,{}),timingFuelTile={x:4,y:4,terrain:"plain",revealed:true,developed:true,depleted:false,type:"fuel",resourceId:"biomass",name:"Timing Fuel",quality:500,level:1,development:{kind:"extract",family:"mine",level:1}},timingCollection={activeSites(){return[timingFuelTile];},shutdownSites(){return[];},collectDay(){return{collected:10};},advanceShutdowns(){}},timingEngine=new SimulationEngine(resources,shipSupportTechnology,timingCollection,{stockValue:()=>0},timingInventory,timingColony);timingState.tiles.power={x:3,y:3,terrain:"plain",revealed:true,development:{kind:"power",level:1}};timingState.tiles.fuel=timingFuelTile;for(const entry of Object.values(timingState.inventory))if(entry.type==="fuel"){for(const band of Object.values(entry.qualityBands||{}))band.amount=0;timingInventory.syncEntry(entry);}const timingShip=timingEngine.expansion.ship(timingState);timingShip.foodLots[shipFoodKey]=JSON.parse(JSON.stringify(shipFoodEntry));delete timingState.inventory[shipFoodKey];timingEngine.tick(timingState);assert.equal(timingState.metrics.powerFuelLimitedGeneration,0);assert.equal(timingState.metrics.powerFuelConsumed,0);assert.equal(timingInventory.amount(timingState,"fuel"),10,"Fuel produced today must remain available for tomorrow");timingEngine.tick(timingState);assert.equal(timingState.metrics.powerFuelLimitedGeneration,75);assert.equal(timingState.metrics.powerFuelConsumed,7.5);assert.equal(timingInventory.amount(timingState,"fuel"),12.5);
console.log("A08a Headquarters gate, migration and Power timing regression coverage passed");
