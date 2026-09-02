import assert from "node:assert/strict";
import { readFileSync,existsSync } from "node:fs";
import { CONFIG } from "../js/core/config.js";
import { ContractService } from "../js/domain/contract-service.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { PortfolioService } from "../js/domain/portfolio-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import {
  ExpansionService,EXPANSION_VERSION,HOME_SYSTEM_ID,PROBE_UNLOCK_INDUSTRY_LEVEL,
  PLAYER_SHIP_CAPACITY,PLAYER_SHIP_CARGO_CAPACITY,PLAYER_SHIP_FOOD_CAPACITY,PLAYER_SHIP_FUEL_CAPACITY,
  PLAYER_SHIP_MIN_CREW,CORPORATE_SERVICE_RADIUS_LY,MIN_NEARBY_FRONTIER_SYSTEMS
} from "../js/domain/expansion-service.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),trade=new TradeService(resources,inventory);
const fresh=()=>{const state=createGameState(contracts.first()),portfolio=new PortfolioService(),expansion=new ExpansionService(inventory,resources,contracts);portfolio.ensure(state);expansion.ensure(state);state.colony.commandHandoverComplete=true;return{state,portfolio,expansion};};
const setAbsolute=(s,day)=>{s.year=Math.floor((day-1)/CONFIG.DAYS_PER_YEAR)+1;s.day=(day-1)%CONFIG.DAYS_PER_YEAR+1;};
const stock=(state)=>{inventory.store(state,"food","fungal","Fungal Shelf",20000,500);inventory.store(state,"fuel","biomass","Biomass",20000,500);inventory.store(state,"build","stone","Stone",20000,500);inventory.store(state,"ore","surface-iron","Surface Iron Nodules",20000,500);};
const stockedKey=(type,resourceId)=>inventory.key(type,resourceId);

const {state,portfolio,expansion}=fresh();
assert.equal(state.version,16);
assert.equal(state.company.expansion.version,EXPANSION_VERSION);
assert.equal(EXPANSION_VERSION,3);
assert.equal(state.company.expansion.ships.length,1);
assert.equal(expansion.ship(state).status,"docked");
assert.equal(expansion.capacityRemaining(state),PLAYER_SHIP_CAPACITY);
assert.equal(PLAYER_SHIP_CAPACITY,12000);
assert.equal(PLAYER_SHIP_CARGO_CAPACITY,8000);
assert.equal(PLAYER_SHIP_FOOD_CAPACITY,2000);
assert.equal(PLAYER_SHIP_FUEL_CAPACITY,2000);
assert.equal(PLAYER_SHIP_MIN_CREW,10);
assert.equal(Object.prototype.propertyIsEnumerable.call(state.company.expansion,"ship"),false,"legacy singular ship alias must not become persisted parallel state");
const nearby=state.company.expansion.systems.filter(system=>!system.home&&system.id!==state.contract.systemId&&expansion.distanceFromHome(state,system.id)<=CORPORATE_SERVICE_RADIUS_LY);
assert.ok(nearby.length>=MIN_NEARBY_FRONTIER_SYSTEMS,`Galaxy must guarantee at least ${MIN_NEARBY_FRONTIER_SYSTEMS} reachable frontier systems`);

// Probe progression remains the gate for unknown systems.
const unknown=nearby[0];
let probeCheck=expansion.canLaunchProbe(state,unknown.id);
assert.equal(probeCheck.ok,false);
assert.match(probeCheck.reason,new RegExp(`Industry L${PROBE_UNLOCK_INDUSTRY_LEVEL}`));
state.company.tech.industry=PROBE_UNLOCK_INDUSTRY_LEVEL;
stock(state);
probeCheck=expansion.canLaunchProbe(state,unknown.id);
assert.equal(probeCheck.ok,true);
const probe=expansion.launchProbe(state,unknown.id);
assert.equal(probe.ok,true);
setAbsolute(state,probe.probe.arrivalAbsoluteDay);
expansion.processDay(state);
assert.equal(unknown.surveyed,true);
assert.ok(unknown.planets.every(p=>p.indicators&&p.surveyConfidence));

// Physical ship capacity remains split into general hold + Food + Fuel for the starter ship.
const cargoState=fresh(),cs=cargoState.state,ce=cargoState.expansion;
stock(cs);
const foodKey=stockedKey("food","fungal"),fuelKey=stockedKey("fuel","biomass"),buildKey=stockedKey("build","stone");
assert.equal(ce.loadCargo(cs,buildKey,6000).qty,6000);
assert.equal(ce.loadCargo(cs,foodKey,2000).qty,2000);
assert.equal(ce.cargoAmount(cs),8000);
assert.equal(ce.cargoCapacityRemaining(cs),0);
assert.equal(ce.loadFood(cs,foodKey,2000).qty,2000);
assert.equal(ce.foodAmount(cs),2000);
assert.equal(ce.loadFuel(cs,fuelKey,2000).qty,2000);
assert.equal(ce.fuelAmount(cs),2000);
assert.equal(ce.capacityUsed(cs),12000);
assert.equal(ce.capacityRemaining(cs),0);
assert.equal(ce.loadCargo(cs,buildKey,1).ok,false);
const consumed=ce.consumeTransitFood(cs,2500);
assert.equal(consumed.consumed,2500);
assert.equal(ce.foodAmount(cs),0,"dedicated Food is consumed first");
assert.equal(ce.cargoCategory(cs,"food"),1500,"general-hold Food supplements the dedicated transit store");

// Launch now requires class-specific minimum crew; passengers remain separate colonists.
const travel=fresh(),ts=travel.state,te=travel.expansion,tp=travel.portfolio;
stock(ts);
const target=ts.company.expansion.systems.filter(s=>!s.home&&s.id!==ts.contract.systemId).sort((a,b)=>te.systemDistance(ts,ts.contract.systemId,a.id)-te.systemDistance(ts,ts.contract.systemId,b.id))[0];
target.surveyed=true;
assert.equal(te.loadCrew(ts,PLAYER_SHIP_MIN_CREW-1).qty,PLAYER_SHIP_MIN_CREW-1);
assert.equal(te.loadPassengers(ts,10).qty,10);
assert.equal(te.setTarget(ts,target.id).ok,true);
let profile=te.travelProfile(ts,target.id);
assert.ok(profile&&profile.distanceLy>0);
assert.equal(te.loadFuel(ts,stockedKey("fuel","biomass"),profile.fuelRequired+250).ok,true);
assert.equal(te.loadFood(ts,stockedKey("food","fungal"),profile.foodRequired+500).ok,true);
assert.equal(te.loadCargo(ts,stockedKey("build","stone"),800).ok,true);
assert.equal(te.canLaunch(ts).ok,false);
assert.match(te.canLaunch(ts).reason,/at least 10 crew/i);
assert.equal(te.loadCrew(ts,1).ok,true);
profile=te.travelProfile(ts,target.id);
assert.equal(te.canLaunch(ts).ok,true);
const launch=te.launch(ts);
assert.equal(launch.ok,true);
assert.equal(te.ship(ts).status,"travelling");
assert.equal(te.ship(ts).colonyId,null);
for(let day=te.absoluteDay(ts)+1;day<=launch.profile.arrivalAbsoluteDay;day++){setAbsolute(ts,day);te.processDay(ts);}
assert.equal(te.ship(ts).status,"arrived");
assert.equal(te.ship(ts).systemId,target.id);
assert.equal(te.ship(ts).awaitingDestination,true);

// Ship Food remains aboard after founding; non-Food cargo and Fuel become initial colony stock.
ts.company.tech={housing:5,power:5,food:5,industry:5,mining:10,scanning:10};
const planet=target.planets[0],contract=te.makePlanetContract(ts,target.id,planet.id),beforeFood=te.transitFoodAmount(ts),beforeFuel=te.fuelAmount(ts);
assert.ok(beforeFood>0);
assert.ok(beforeFuel>0);
const entry=tp.addColony(ts,contract);
assert.equal(ts.colonyId,entry.id);
assert.equal(Math.floor(ts.pop),PLAYER_SHIP_MIN_CREW+10);
assert.ok(inventory.amount(ts,"build")>=800);
assert.equal(inventory.amount(ts,"food"),0,"founding must not turn ship Food into colony stock");
assert.ok(inventory.amount(ts,"fuel")>=beforeFuel-.001,"remaining Fuel must disembark into colony stock");
assert.equal(te.transitFoodAmount(ts),beforeFood,"all dedicated/general-hold Food must remain aboard the landed ship");
assert.equal(te.cargoAmount(ts),te.cargoCategory(ts,"food"),"only general-hold Food may remain after founding");
assert.equal(te.fuelAmount(ts),0);
assert.equal(te.ship(ts).crew,0);
assert.equal(te.ship(ts).passengers,0);
assert.equal(te.ship(ts).status,"docked");
assert.equal(te.ship(ts).colonyId,entry.id);
assert.equal(te.shipResidentCount(ts,te.ship(ts).id),Math.floor(ts.pop),"founders must remain resident aboard until manually moved ashore");

// A travelling ship can be selected/rerouted from its live interpolated position using remaining supplies.
const reroute=fresh(),rs=reroute.state,re=reroute.expansion;
stock(rs);
const outward=rs.company.expansion.systems.filter(s=>!s.home&&s.id!==rs.contract.systemId).sort((a,b)=>re.systemDistance(rs,rs.contract.systemId,a.id)-re.systemDistance(rs,rs.contract.systemId,b.id))[0];
outward.surveyed=true;
re.loadCrew(rs,10);
re.loadPassengers(rs,10);
re.setTarget(rs,outward.id);
re.loadFuel(rs,stockedKey("fuel","biomass"),2000);
re.loadFood(rs,stockedKey("food","fungal"),2000);
const outwardLaunch=re.launch(rs);
assert.equal(outwardLaunch.ok,true);
const nextDay=re.absoluteDay(rs)+1;
setAbsolute(rs,nextDay);
re.processDay(rs);
const live=re.shipPosition(rs),remainingFuel=re.fuelAmount(rs),remainingFood=re.transitFoodAmount(rs);
assert.ok(live&&remainingFuel>0&&remainingFood>0);
const rerouted=re.setTarget(rs,HOME_SYSTEM_ID);
assert.equal(rerouted.ok,true);
assert.equal(rerouted.rerouted,true);
assert.equal(re.ship(rs).targetSystemId,HOME_SYSTEM_ID);
assert.ok(Math.abs(re.ship(rs).routeStartX-live.x)<1e-9);
assert.ok(Math.abs(re.ship(rs).routeStartY-live.y)<1e-9);
assert.ok(re.fuelAmount(rs)<=remainingFuel&&re.transitFoodAmount(rs)<=remainingFood);

// Corporate service radius still controls the automatic trade ship.
ts.contract.distanceLy=CORPORATE_SERVICE_RADIUS_LY+2;
ts.trade.active=false;
ts.trade.nextArrivalDay=1;
assert.equal(trade.serviceAvailable(ts),false);
assert.equal(trade.shouldArrive(ts),false);
ts.contract.distanceLy=1;
assert.equal(trade.serviceAvailable(ts),true);

// Fleet-era ship loss does not itself set corporation game-over.
const loss=fresh(),ls=loss.state,le=loss.expansion;
const lost=le.onColonyDied(ls);
assert.equal(lost.shipLost,true);
assert.equal(le.ship(ls).status,"lost");
assert.equal(ls.company.gameOver,false);

// Presentation/ownership guards for the completed gameplay batch.
const prepUi=readFileSync(new URL("../js/ui/ship-preparation-ui.js",import.meta.url),"utf8"),
  navUi=readFileSync(new URL("../js/ui/ship-navigation-ui.js",import.meta.url),"utf8"),
  prepView=readFileSync(new URL("../views/player-ship-prep.html",import.meta.url),"utf8"),
  paxView=readFileSync(new URL("../views/player-ship-passengers.html",import.meta.url),"utf8"),
  mapControls=readFileSync(new URL("../js/ui/map-controls.js",import.meta.url),"utf8"),
  worldRuntime=readFileSync(new URL("../js/ui/world-view-runtime.js",import.meta.url),"utf8"),
  operational=readFileSync(new URL("../js/ui/operational-controls-ui.js",import.meta.url),"utf8"),
  failure=readFileSync(new URL("../views/corporation-contract-failed.html",import.meta.url),"utf8"),
  index=readFileSync(new URL("../index.html",import.meta.url),"utf8"),
  portfolioSource=readFileSync(new URL("../js/domain/portfolio-service.js",import.meta.url),"utf8");
for(const marker of["cargoCapacity","foodCapacity","fuelCapacity","passengerCapacity","minimumCrew","loadCrew","loadPassengers","loadFood","unloadFood","transitFoodAmount"])assert.ok(prepUi.includes(marker),`missing fleet-aware ship preparation behavior ${marker}`);
for(const obsolete of["PLAYER_SHIP_CARGO_CAPACITY","PLAYER_SHIP_FOOD_CAPACITY","PLAYER_SHIP_FUEL_CAPACITY","PLAYER_SHIP_PASSENGERS"])assert.ok(!prepUi.includes(obsolete),`ship preparation must not use starter-only capacity constant ${obsolete}`);
for(const marker of["TRANSIT FOOD STORE","GENERAL HOLD","data-ship-food-rows","data-ship-unload-quantity"])assert.ok(prepView.includes(marker),`missing ship preparation view ${marker}`);
for(const marker of["CREW −1","UNLOAD CREW","−10","−50","UNLOAD ALL"])assert.ok(paxView.includes(marker));
for(const marker of["SHIP_HIT_ID","shipPosition","REROUTE TO","routeStartX","data-production-toggle"])assert.ok(navUi.includes(marker),`missing live ship navigation marker ${marker}`);
for(const marker of['["housing","HOUSING"]','["industry","INDUSTRY"]','["power","POWER"]'])assert.ok(mapControls.includes(marker));
assert.match(worldRuntime,/if\(mode==="power"\)return tile\?\.development\?\.kind==="power"/);
assert.match(operational,/canAdjustHarvestIntensity/);
assert.match(operational,/critical-resource-warning\.html/);
assert.match(failure,/CORPORATION FAILED — CONTRACT DEFAULT/);
assert.match(index,/id="starMapBtn"/);
assert.match(portfolioSource,/entry\?\.type!=="food"/,"expedition founding must keep every ship Food lot out of colony inventory");
assert.equal(existsSync(new URL("../js/ui/ship-gameplay-extension.js",import.meta.url)),false,"temporary parallel ship gameplay controller must be removed");
console.log("MineIT ShipExpansion gameplay regression test passed");
