import assert from "node:assert/strict";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState, normalizeState } from "../js/domain/game-state-runtime.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { PortfolioService } from "../js/domain/portfolio-service.js";
import { ExpansionService, HOME_SYSTEM_ID } from "../js/domain/expansion-service.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),portfolio=new PortfolioService(),expansion=new ExpansionService(inventory,resources,contracts);
const state=createGameState(contracts.first());portfolio.ensure(state);expansion.ensure(state);
const firstId=state.colonyId;

state.company.cash=987654;
state.company.tech={housing:3,power:4,food:2,industry:3,mining:5,scanning:4};
state.colony.tech={housing:2,power:3,food:2,industry:2,mining:4,scanning:3};
state.colony.engineeringDeployments=[{id:"roundtrip-engineering",colonyId:firstId,status:"preparing",orderAbsoluteDay:12,preparationDaysRemaining:3,transportCost:5000,packageSubtotal:15000,paidTotal:20000,upgrades:[{category:"mining",level:5,techId:"mining-5",name:"Rotary Drilling",packageCost:15000}]}];
state.company.pendingEvents.push({id:"roundtrip-event",type:"ship",colonyId:firstId,colonyName:state.contract.colonyName,absoluteDay:42});
state.tiles["1,1"]={x:1,y:1,terrain:"plain",terrainVariant:1,revealed:true,lastScannedAtLevel:2,empty:true,resourceId:null,developed:false,development:null};

const second=contracts.make(contracts.archetype({arch:"arid"}),2,0);second.colonyName="Roundtrip Secondary";portfolio.addColony(state,second);assert.equal(state.portfolio.colonies.length,2);
assert.equal(portfolio.switchTo(state,firstId),true);

inventory.store(state,"food","fungal","Fungal Shelf",350,120);
inventory.store(state,"food","fungal","Fungal Shelf",75,6000);
inventory.store(state,"fuel","biomass","Biomass",500,900);
inventory.store(state,"build","fiber","Construction Fibre",250,300);
const fuelKey=Object.keys(state.inventory).find(k=>state.inventory[k]?.type==="fuel"&&state.inventory[k]?.amount>100);
const foodKey=Object.keys(state.inventory).find(k=>state.inventory[k]?.type==="food"&&state.inventory[k]?.amount>100);
const buildKey=Object.keys(state.inventory).find(k=>state.inventory[k]?.type==="build"&&state.inventory[k]?.amount>100);
assert.equal(expansion.loadFuel(state,fuelKey,140).ok,true);
assert.equal(expansion.loadCargo(state,foodKey,180).ok,true);
assert.equal(expansion.loadCargo(state,buildKey,90).ok,true);
assert.equal(expansion.loadPassengers(state,12).ok,true);
assert.equal(expansion.setTarget(state,HOME_SYSTEM_ID).ok,true);
portfolio.captureActive(state,true);

const expected={
  cash:state.company.cash,
  tech:{...state.company.tech},
  localTech:{...state.colony.tech},
  engineering:JSON.parse(JSON.stringify(state.colony.engineeringDeployments)),
  colonies:state.portfolio.colonies.map(c=>({id:c.id,name:c.name})),
  activeId:state.colonyId,
  pop:state.pop,
  eventCount:state.company.pendingEvents.length,
  ship:{status:expansion.ship(state).status,systemId:expansion.ship(state).systemId,targetSystemId:expansion.ship(state).targetSystemId,passengers:expansion.ship(state).passengers,fuel:expansion.fuelAmount(state),cargo:expansion.cargoAmount(state)},
  foodBands:JSON.parse(JSON.stringify(state.inventory["food:fungal"]?.qualityBands||{})),
  lastScannedAtLevel:state.tiles["1,1"].lastScannedAtLevel
};

const serialized=JSON.stringify(state);
assert.ok(serialized.length>1000,"realistic save should contain substantial state");
const loaded=normalizeState(JSON.parse(serialized));portfolio.ensure(loaded);expansion.ensure(loaded);

assert.equal(loaded.version,11);
assert.equal(loaded.company.cash,expected.cash);
assert.deepEqual(loaded.company.tech,expected.tech);
assert.deepEqual(loaded.colony.tech,expected.localTech);
assert.deepEqual(loaded.colony.engineeringDeployments,expected.engineering);
assert.equal(loaded.colony.spaceport.level,1);
assert.equal(loaded.company.pendingEvents.length,expected.eventCount);
assert.deepEqual(loaded.portfolio.colonies.map(c=>({id:c.id,name:c.name})),expected.colonies);
assert.equal(loaded.colonyId,expected.activeId);
assert.equal(loaded.pop,expected.pop);
assert.equal(loaded.tiles["1,1"].lastScannedAtLevel,expected.lastScannedAtLevel,"per-tile scan history must survive save/load");
assert.equal(expansion.ship(loaded).status,expected.ship.status);
assert.equal(expansion.ship(loaded).systemId,expected.ship.systemId);
assert.equal(expansion.ship(loaded).targetSystemId,expected.ship.targetSystemId);
assert.equal(expansion.ship(loaded).passengers,expected.ship.passengers);
assert.equal(expansion.fuelAmount(loaded),expected.ship.fuel);
assert.equal(expansion.cargoAmount(loaded),expected.ship.cargo);
for(const [key,band] of Object.entries(expected.foodBands))assert.equal(loaded.inventory["food:fungal"].qualityBands[key]?.amount,band.amount,`quality band ${key} must survive save round-trip`);

portfolio.captureActive(loaded,true);const serializedAgain=JSON.stringify(loaded);const loadedAgain=normalizeState(JSON.parse(serializedAgain));portfolio.ensure(loadedAgain);expansion.ensure(loadedAgain);
assert.equal(loadedAgain.portfolio.colonies.length,2);
assert.equal(expansion.ship(loadedAgain).passengers,expected.ship.passengers);
assert.equal(expansion.fuelAmount(loadedAgain),expected.ship.fuel);
assert.equal(loadedAgain.colony.engineeringDeployments[0].status,"preparing");
assert.equal(loadedAgain.colony.tech.scanning,expected.localTech.scanning);
assert.equal(loadedAgain.tiles["1,1"].lastScannedAtLevel,expected.lastScannedAtLevel);
console.log("MineIT realistic multi-colony + player-ship + engineering-deployment + scan-history save round-trip passed");