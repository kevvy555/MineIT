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
import { PortfolioService } from "../js/domain/portfolio-service.js";
import { starterInventory } from "../js/domain/game-state.js";
import { INITIAL_SHIP_FUEL } from "../js/domain/expansion-service.js";
import { createGameState,normalizeState,N05_STATE_VERSION } from "../js/domain/game-state-runtime.js";

const contracts=new ContractService(),resources=new ResourceService();
function setup(){
  const inventory=new InventoryService(resources),technology=new TechnologyService(),collection=new CollectionService(resources,inventory,technology),colony=new ColonyService(inventory,technology),trade=new TradeService(resources,inventory,colony),engine=new SimulationEngine(resources,technology,collection,trade,inventory,colony),state=createGameState(contracts.first());
  return{state,inventory,technology,collection,colony,trade,engine,expansion:engine.expansion};
}
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<.0001,`${message}: expected ${expected}, got ${actual}`);
const keyFor=(container,type)=>Object.keys(container||{}).find(key=>container[key]?.type===type);
function setCategory(container,type,amount){
  let remaining=amount;
  for(const entry of Object.values(container||{})){
    if(entry.type!==type)continue;
    const next=Math.max(0,remaining);entry.qualityBands=next?{excellent:{amount:next}}:{};entry.amount=next;remaining=0;
  }
}

// Colony 01 starts as a real, crewed, ship-supported settlement.
{
  const{state,expansion}=setup(),ship=expansion.ship(state);
  assert.equal(state.version,N05_STATE_VERSION);
  assert.equal(CONFIG.START_FUEL,420);
  assert.equal(ship.crew,ship.minimumCrew);
  assert.equal(expansion.shipResidentCount(state,ship.id),120);
  assert.equal(expansion.planetaryResidentCount(state),0);
  assert.equal(expansion.transitFoodAmount(state,ship.id),1300);
  assert.equal(expansion.fuelAmount(state,ship.id),INITIAL_SHIP_FUEL);
  assert.equal(expansion.cargoCategory(state,"build",ship.id),520);
  assert.equal(expansion.cargoCategory(state,"ore",ship.id),260);
  for(const type of["food","build","fuel","ore"])assert.equal(Object.values(state.inventory).filter(entry=>entry.type===type).reduce((sum,entry)=>sum+entry.amount,0),0);
  assert.equal(state.colony.foundingShipId,ship.id);
  assert.equal(state.colony.establishmentAcknowledged,false);
}

// The real starting manifest keeps every resident alive for the intended first 90 days.
{
  const{state,engine,expansion}=setup();let deaths=0;
  for(let day=0;day<90;day++)deaths+=engine.tick(state).deaths;
  engine.recalculate(state);
  assert.equal(deaths,0);
  assert.equal(state.pop,120);
  near(expansion.transitFoodAmount(state),4,"90-day ship Food balance");
  assert.ok(state.metrics.shipFoodShortestDays>0);
}

// Founding unload is outbound-only before Spaceport Power, and stock is conserved.
{
  const{state,engine,expansion,inventory}=setup(),ship=expansion.ship(state),buildKey=keyFor(ship.cargo,"build"),foodKey=keyFor(ship.foodLots,"food"),fuelKey=keyFor(ship.fuelLots,"fuel");
  const buildBefore=expansion.cargoCategory(state,"build")+inventory.amount(state,"build");
  assert.equal(expansion.unloadCargo(state,ship.id,buildKey,100).ok,true);
  assert.equal(expansion.cargoCategory(state,"build")+inventory.amount(state,"build"),buildBefore);
  assert.equal(expansion.loadCargo(state,ship.id,buildKey,1).ok,false,"reverse loading must still require powered Spaceport services");
  assert.equal(expansion.unloadFood(state,ship.id,foodKey,300).ok,true);
  assert.equal(expansion.unloadFuel(state,ship.id,fuelKey,200).ok,true);

  state.tiles.power={x:1,y:1,revealed:true,development:{kind:"power",level:1}};
  state.tiles.housing={x:2,y:1,revealed:true,development:{kind:"housing",level:1}};
  engine.recalculate(state);
  assert.equal(expansion.moveResidentsAshore(state,ship.id,30).ok,true);
  const shipFoodBefore=expansion.transitFoodAmount(state),colonyFoodBefore=inventory.amount(state,"food");
  engine.tick(state);
  near(shipFoodBefore-expansion.transitFoodAmount(state),90*CONFIG.FOOD_PER_COLONIST,"ship residents consume ship Food");
  near(colonyFoodBefore-inventory.amount(state,"food"),30*CONFIG.FOOD_PER_COLONIST,"planetary residents consume colony Food");
}

// Founding-ship Industry is self-powered and does not create colony Power demand.
{
  const{state,colony,inventory,engine}=setup(),totals=colony.totals(state),breakdown=colony.powerDemandBreakdown(state);
  assert.equal(totals.shipIndustry,50);
  assert.equal(colony.industryOperationalCapacity(state),50);
  assert.ok(!breakdown.industry.some(row=>row.id==="founding-ship-industry"));
  state.tiles.industry={x:3,y:1,revealed:true,development:{kind:"industry",level:1}};inventory.store(state,"ore","surface-iron","Surface Iron Nodules",100,500);engine.recalculate(state);
  assert.equal(state.metrics.industry,50,"an unpowered colony Industry building must not switch off self-powered ship Industry");
}

// Occupied ship Food remains a warning at ten days and pauses once below it.
{
  const{state,engine,expansion}=setup(),ship=expansion.ship(state),daily=120*CONFIG.FOOD_PER_COLONIST;
  setCategory(ship.foodLots,"food",daily*10);
  state.speed=1;engine.recalculate(state);
  assert.equal(state.speed,1);
  assert.equal(state.metrics.shipFoodCritical,false);
  setCategory(ship.foodLots,"food",daily*9);
  state.speed=1;engine.recalculate(state);
  assert.equal(state.speed,0);
  assert.ok(state.metrics.shipFoodShortestDays<10);
  assert.equal(state.metrics.shipFoodCritical,true);
  assert.equal(state.colony.shipFoodCriticalPauses[ship.id],true);
}

// An occupied ship on an inactive colony still pauses the corporate clock.
{
  const{state,engine,expansion}=setup(),portfolio=new PortfolioService(),ship=expansion.ship(state),firstColonyId=state.colonyId;
  portfolio.ensure(state);portfolio.captureActive(state,true);portfolio.addColony(state,contracts.options(2)[0]);
  assert.equal(inventoryAmount(state.inventory,"fuel"),CONFIG.START_FUEL,"ordinary non-ship colonies retain the established starter Fuel allocation");
  setCategory(ship.foodLots,"food",120*CONFIG.FOOD_PER_COLONIST*9);state.speed=1;
  portfolio.simulateInactive(state,temp=>engine.recalculate(temp));
  assert.equal(state.speed,0,"an inactive colony ship Food warning must pause the global simulation");
  assert.equal(state.portfolio.colonies.find(entry=>entry.id===firstColonyId).data.colony.shipFoodCriticalPauses[ship.id],true);
}

// Expedition founding retains every loaded resource and crew aboard; only passengers become colony residents.
{
  const{state,expansion}=setup(),portfolio=new PortfolioService(),ship=expansion.ship(state),target=state.company.expansion.systems.find(system=>!system.home&&system.id!==state.contract.systemId);
  target.surveyed=true;ship.status="arrived";ship.systemId=target.id;ship.colonyId=null;ship.passengers=20;ship.crew=10;
  state.company.tech={housing:5,power:5,food:5,industry:5,mining:10,scanning:10};
  const before={food:expansion.transitFoodAmount(state),fuel:expansion.fuelAmount(state),cargo:expansion.cargoAmount(state)},contract=expansion.makePlanetContract(state,target.id,target.planets[0].id),entry=portfolio.addColony(state,contract);
  assert.equal(state.colonyId,entry.id);
  assert.equal(state.pop,20);
  assert.equal(ship.crew,10);
  assert.equal(ship.passengers,0);
  assert.equal(expansion.transitFoodAmount(state),before.food);
  assert.equal(expansion.fuelAmount(state),before.fuel);
  assert.equal(expansion.cargoAmount(state),before.cargo);
  assert.equal(expansion.shipResidentCount(state,ship.id),20);
  assert.equal(state.colony.establishmentAcknowledged,false);
  for(const type of["food","build","fuel","ore"])assert.equal(inventoryAmount(state.inventory,type),0);
}

// A pre-N05 at-risk save receives ship Food and minimum corporate crew without reopening onboarding.
{
  const{state,expansion}=setup(),ship=expansion.ship(state);
  state.version=16;state.inventory=starterInventory(1);ship.foodLots={};ship.crew=0;delete state.colony.establishmentAcknowledged;delete state.colony.initialManifestProvisioned;delete state.colony.shipFoodCriticalPauses;
  const loaded=normalizeState(JSON.parse(JSON.stringify(state))),loadedExpansion=new (expansion.constructor)(),loadedShip=loadedExpansion.ship(loaded,ship.id);
  assert.equal(loaded.version,N05_STATE_VERSION);
  assert.equal(loadedExpansion.transitFoodAmount(loaded,ship.id),CONFIG.START_POPULATION*CONFIG.FOOD_PER_COLONIST*90);
  near(inventoryAmount(loaded.inventory,"food"),4,"migration leaves planetary Food beyond the occupied-ship reserve");
  assert.equal(loadedShip.crew,loadedShip.minimumCrew);
  assert.equal(loaded.colony.establishmentAcknowledged,true);
}

// Migration never overfills the dedicated Food store.
{
  const{state,expansion}=setup(),ship=expansion.ship(state);
  state.version=16;state.pop=250;state.colony.shipAccommodation={[ship.id]:250};state.inventory=starterInventory(1);setCategory(state.inventory,"food",3000);ship.foodLots={};
  const loaded=normalizeState(JSON.parse(JSON.stringify(state))),loadedExpansion=new (expansion.constructor)();
  assert.equal(loadedExpansion.transitFoodAmount(loaded,ship.id),ship.foodCapacity);
  assert.equal(inventoryAmount(loaded.inventory,"food"),1000);
}

// Established pre-N05 colonies must not have planetary Food moved back aboard.
{
  const{state,expansion}=setup(),ship=expansion.ship(state);
  state.version=16;state.inventory=starterInventory(1);ship.foodLots={};ship.crew=0;state.colony.commandHandoverComplete=true;
  const loaded=normalizeState(JSON.parse(JSON.stringify(state))),loadedExpansion=new (expansion.constructor)();
  assert.equal(loadedExpansion.transitFoodAmount(loaded,ship.id),0);
  assert.equal(inventoryAmount(loaded.inventory,"food"),CONFIG.START_FOOD);
}

function inventoryAmount(container,type){return Object.values(container||{}).filter(entry=>entry.type===type).reduce((sum,entry)=>sum+Math.max(0,Number(entry.amount)||0),0);}

// The approved mock is an explicit production and regression reference.
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8"),css=readFileSync(new URL("../css/map-first.css",import.meta.url),"utf8"),ui=readFileSync(new URL("../js/ui/operational-controls-ui.js",import.meta.url),"utf8"),establishment=readFileSync(new URL("../views/colony-establishment.html",import.meta.url),"utf8");
for(const marker of["foodShipRow","foodColonyRow","foodShipDaysHud","stock +production"]){
  const source=marker==="stock +production"?readFileSync(new URL("../docs/Progression Stages/Stage 1/N05-Ship-To-Colony-Establishment-Transition.md",import.meta.url),"utf8"):html;
  assert.ok(source.includes(marker),`dual HUD marker missing: ${marker}`);
}
for(const marker of["resource-flow-row.good","resource-flow-row.bad","op-row"])assert.ok(css.includes(marker));
for(const marker of["shipResourceFlow","hudShip","resourceFlowText"])assert.ok(ui.includes(marker));
for(const marker of["DEPLOY BUILD + FUEL","MOVE RESIDENTS ASHORE","ESTABLISH HEADQUARTERS","BEGIN OPERATIONS"])assert.ok(establishment.includes(marker));

console.log("MineIT N05 ship-to-colony transition regressions passed");
