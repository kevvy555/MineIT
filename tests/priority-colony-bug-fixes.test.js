import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIG } from "../js/core/config.js";
import { ContractService } from "../js/domain/contract-service.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { CollectionService } from "../js/domain/collection-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { SimulationEngine } from "../js/domain/simulation-engine.js";
import { createGameState,normalizeState } from "../js/domain/game-state-runtime.js";

const contracts=new ContractService(),resources=new ResourceService();
function setup(){
  const inventory=new InventoryService(resources),technology=new TechnologyService(),collection=new CollectionService(resources,inventory,technology),colony=new ColonyService(inventory,technology),trade=new TradeService(resources,inventory,colony),engine=new SimulationEngine(resources,technology,collection,trade,inventory,colony),state=createGameState(contracts.first()),expansion=engine.expansion;
  expansion.ensure(state);state.tiles.power={x:2,y:1,revealed:true,development:{kind:"power",level:1}};inventory.store(state,"fuel","biomass","Biomass",100);engine.recalculate(state);return{state,inventory,technology,colony,trade,engine,expansion};
}
function clearFood(state,inventory){for(const entry of Object.values(state.inventory||{})){if(entry.type!=="food")continue;for(const band of Object.values(entry.qualityBands||{}))band.amount=0;inventory.syncEntry(entry);}}
function addShipFood(state,inventory,expansion,amount=200){const key=Object.keys(state.inventory).find(candidate=>state.inventory[candidate]?.type==="food");inventory.store(state,"food","fungal","Fungal Shelf",amount);const loaded=expansion.loadFood(state,key,amount);assert.equal(loaded.ok,true);clearFood(state,inventory);return expansion.transitFoodAmount(state);}

// A02: the selector and live simulation share ColonyService.foodForecast.
{
  const{state,trade,engine}=setup();state.colony.shipAccommodation={};state.tiles.house={x:1,y:1,revealed:true,development:{kind:"housing",level:2}};state.trade.active=true;state.company.cash=1e9;engine.recalculate(state);
  const selected=50,projection=trade.colonistProjection(state,selected);
  assert.equal(projection.population,state.pop+selected);
  assert.equal(projection.demand,(state.pop+selected)*CONFIG.FOOD_PER_COLONIST);
  assert.equal(projection.production,state.metrics.food,"the projection must count only the engine's operational Food production");
  assert.equal(projection.net,projection.production-projection.demand);
  assert.equal(projection.daysRemaining,state.metrics.foodStock/Math.max(.0001,-projection.net));
  const transfer=trade.transferColonists(state,selected);assert.equal(transfer.ok,true);engine.recalculate(state);
  assert.equal(state.metrics.foodDemand,projection.demand,"post-transfer live demand must exactly match the preview");
  assert.equal(state.metrics.foodNet,projection.net,"post-transfer live Food net must exactly match the preview");
  state.tiles.stoppedFarm={x:2,y:2,revealed:true,developed:true,depleted:false,productionStopped:true,type:"food",resourceId:"fungal",level:5,quality:10000,resourceMult:10,sustainability:"renewable",harvestIntensity:1};engine.recalculate(state);
  assert.equal(trade.colonistProjection(state,0).production,0,"stopped Food sites must never make the safe forecast appear sustainable");
}

// A06: ship Food is explicit emergency supply, never implicit colony stock.
{
  const{state,inventory,engine,expansion}=setup();state.colony.shipAccommodation={};const ship=expansion.ship(state),shipFood=addShipFood(state,inventory,expansion,300);
  engine.recalculate(state);assert.equal(state.metrics.foodStock,0);assert.equal(state.metrics.food,0);
  const first=engine.tick(state);assert.equal(first.emergencyFoodRequest?.shipId,ship.id);assert.equal(expansion.transitFoodAmount(state),shipFood,"the first shortage must not consume unapproved ship Food");
  assert.equal(expansion.emergencyFoodDecision(state).status,"pending");assert.equal(expansion.authorizeEmergencyFood(state,ship.id).ok,true);
  const second=engine.tick(state);assert.ok(second.emergencyFoodUsed>0);assert.equal(expansion.transitFoodAmount(state),shipFood-second.emergencyFoodUsed);assert.equal(expansion.emergencyFoodDecision(state).status,"authorized");
  inventory.store(state,"food","fungal","Fungal Shelf",.5);engine.recalculate(state);assert.equal(expansion.emergencyFoodDecision(state).status,"none","any returning colony Food must end emergency authorisation");
}
{
  const{state,inventory,engine,expansion}=setup();state.colony.shipAccommodation={};const ship=expansion.ship(state),shipFood=addShipFood(state,inventory,expansion,200),request=engine.tick(state).emergencyFoodRequest;assert.equal(expansion.declineEmergencyFood(state,request.shipId).ok,true);engine.tick(state);assert.equal(expansion.transitFoodAmount(state),shipFood,"declining must leave ship Food untouched");
}
{
  const{state,inventory,engine,expansion}=setup();state.colony.shipAccommodation={};const ship=expansion.ship(state);addShipFood(state,inventory,expansion,200);engine.tick(state);assert.equal(expansion.authorizeEmergencyFood(state,ship.id).ok,true);const loaded=normalizeState(JSON.parse(JSON.stringify(state))),loadedExpansion=engine.expansion;assert.equal(loaded.version,16);assert.deepEqual(loaded.colony.emergencyShipFood,{shipId:ship.id,status:"authorized"},"a valid authorisation must survive save/load");const target=loaded.company.expansion.systems.find(system=>system.id!==loaded.contract.systemId),profile=loadedExpansion.travelProfile(loaded,target.id);const launched=loadedExpansion.startTravel(loaded,profile,{shipId:ship.id});assert.equal(launched.ok,true);assert.equal(loadedExpansion.emergencyFoodDecision(loaded).status,"none","ship departure must end emergency Food access");
}

// A07: class capacity and each manually assigned accommodation pool persist independently.
{
  const{state,engine,expansion}=setup(),starter=expansion.ship(state);state.tiles.house={x:3,y:3,revealed:true,development:{kind:"housing",level:1}};engine.recalculate(state);
  assert.equal(starter.accommodationCapacity,starter.passengerCapacity+starter.maximumCrew);assert.equal(expansion.shipResidentCount(state,starter.id),state.pop);assert.equal(expansion.planetaryAccommodationResidentCount(state),0);
  assert.equal(expansion.moveResidentsAshore(state,starter.id,50).qty,50);assert.equal(expansion.shipResidentCount(state,starter.id),70);assert.equal(expansion.planetaryAccommodationResidentCount(state),50);
  assert.equal(expansion.moveResidentsAboard(state,starter.id,10).qty,10);assert.equal(expansion.shipResidentCount(state,starter.id),80);assert.equal(expansion.planetaryAccommodationResidentCount(state),40);
  const second=expansion.createPurchasedShip(state,{id:"ship-class-small",name:"Small Berth Test",capacity:{cargo:10,fuel:10,food:10,colonists:20},minimumCrew:3,maximumCrew:6},{colonyId:state.colonyId});assert.equal(second.accommodationCapacity,26,"different class data must produce a different real accommodation capacity");
  const loaded=normalizeState(JSON.parse(JSON.stringify(state))),loadedExpansion=engine.expansion;assert.equal(loadedExpansion.shipResidentCount(loaded,starter.id),80);assert.equal(loadedExpansion.planetaryAccommodationResidentCount(loaded),40,"manual allocations must survive save/load");
  const target=loaded.company.expansion.systems.find(system=>system.id!==loaded.contract.systemId),profile=loadedExpansion.travelProfile(loaded,target.id,0,starter.id),beforePop=loaded.pop,launched=loadedExpansion.startTravel(loaded,profile,{shipId:starter.id});assert.equal(launched.displacedResidents,80);assert.equal(loaded.pop,beforePop,"launch-displaced residents remain colony population");engine.recalculate(loaded);assert.equal(loadedExpansion.shipResidentCount(loaded,starter.id),0);assert.equal(loadedExpansion.planetaryAccommodationResidentCount(loaded),40);assert.equal(loadedExpansion.homelessCount(loaded),80,"launch must not auto-assign displaced residents to spare planetary housing");
}
{
  const{state,engine,expansion}=setup(),starter=expansion.ship(state);state.tiles.house={x:4,y:4,revealed:true,development:{kind:"housing",level:1}};state.pop=starter.accommodationCapacity+25;delete state.colony.shipAccommodation;delete state.colony.planetaryAccommodationResidents;delete state.colony.housingBuildingCapacity;const loaded=normalizeState(JSON.parse(JSON.stringify(state)));assert.equal(expansion.shipResidentCount(loaded,starter.id),starter.accommodationCapacity);assert.equal(expansion.planetaryAccommodationResidentCount(loaded),25,"migration must derive planetary capacity from real building tiles when cached totals are absent");assert.equal(expansion.homelessCount(loaded),0);
}

const buildingModel=readFileSync(new URL("../js/domain/building-model.js",import.meta.url),"utf8"),passengerView=readFileSync(new URL("../views/player-ship-passengers.html",import.meta.url),"utf8"),foodView=readFileSync(new URL("../views/emergency-ship-food.html",import.meta.url),"utf8"),colonistView=readFileSync(new URL("../views/quick-trade-colonists.html",import.meta.url),"utf8");
assert.ok(!buildingModel.includes("housing:180"),"production must not retain the fixed 180-person ship accommodation assumption");
for(const marker of["SHIP RESIDENTS","PLANET RESIDENTS","homeless","data-move-residents-ashore","data-move-residents-aboard"])assert.ok(passengerView.includes(marker));
for(const marker of["COLONY FOOD","SHIP_FOOD","data-emergency-food-approve","data-emergency-food-decline"])assert.ok(foodView.includes(marker));
for(const marker of["FOOD PRODUCTION","POST-TRANSFER USE","PROJECTED FOOD NET","COLONY FOOD REMAINING","EMERGENCY SHIP FOOD"])assert.ok(colonistView.includes(marker));

console.log("MineIT priority colony Food and accommodation regressions passed");
