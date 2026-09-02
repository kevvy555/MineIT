import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ContractService } from "../js/domain/contract-service.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { ExpansionService } from "../js/domain/expansion-service.js";
import { BuyerService } from "../js/domain/buyer-service.js";
import { SurveyService } from "../js/domain/survey-service.js";
import { PortfolioService } from "../js/domain/portfolio-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { TransportService } from "../js/domain/transport-service.js";
import { ShipMarketService } from "../js/domain/ship-market-service.js";
import { UniverseShipCatalogue } from "../js/data/universe-ship-catalogue.js";
import { createGameState,normalizeState,A08B_STATE_VERSION } from "../js/domain/game-state-runtime.js";

const contracts=new ContractService();
const resources=new ResourceService();
const approx=(actual,expected,epsilon=.000001)=>assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} != ${expected}`);
const absoluteDay=state=>(state.year-1)*360+state.day;
const setAbsoluteDay=(state,value)=>{state.year=Math.floor((value-1)/360)+1;state.day=(value-1)%360+1;};
const clearFuel=(state,inventory)=>{for(const entry of Object.values(state.inventory)){if(entry.type!=="fuel")continue;for(const band of Object.values(entry.qualityBands||{}))band.amount=0;inventory.syncEntry(entry);}};

function establishedColony(){
  const state=createGameState(contracts.first()),inventory=new InventoryService(resources),colony=new ColonyService(inventory,{}),expansion=new ExpansionService(inventory,resources,contracts);
  expansion.colonyService=colony;state.colony.shipAccommodation={};state.colony.commandHandoverComplete=true;state.metrics.fuelIntensity=.1;
  inventory.store(state,"fuel","biomass","Biomass",100000,500);
  state.tiles.housing={x:0,y:1,terrain:"plain",revealed:true,development:{kind:"housing",level:1,constructionComplete:true}};
  state.tiles.power={x:1,y:0,terrain:"plain",revealed:true,development:{kind:"power",level:1,constructionComplete:true}};
  state.tiles.hq={x:1,y:1,terrain:"plain",revealed:true,development:{kind:"headquarters",level:1,constructionComplete:true}};
  const ship=expansion.ship(state);ship.crew=ship.minimumCrew;
  const status=colony.headquartersContinuity(state);assert.equal(status.phase,"online");assert.equal(status.networkAvailable,true);assert.equal(status.primaryOperational,true);
  return{state,inventory,colony,expansion,ship};
}

// A founding colony does not enter A08b before its command handover is complete.
{
  const state=createGameState(contracts.first()),inventory=new InventoryService(resources),colony=new ColonyService(inventory,{});
  clearFuel(state,inventory);const status=colony.headquartersContinuity(state);assert.equal(status.established,false);assert.equal(status.phase,"online");assert.equal(status.networkAvailable,true);assert.equal(status.efficiencyFactor,1);assert.equal(status.outageStartedAbsoluteDay,null);assert.equal(status.recoveryStartedAbsoluteDay,null);
}

// An established Primary outage is immediate, degrades once per complete offline day, and is not hidden by emergency ship command.
{
  const {state,inventory,colony}=establishedColony(),start=absoluteDay(state);clearFuel(state,inventory);
  let status=colony.headquartersContinuity(state);assert.equal(status.phase,"outage");assert.equal(status.networkAvailable,false);assert.equal(status.command.source?.type,"ship");approx(status.penalty,.10);approx(status.efficiencyFactor,.90);assert.equal(status.offlineDays,0);
  const sameDay=colony.headquartersContinuity(state);approx(sameDay.penalty,.10);assert.equal(sameDay.offlineDays,0);
  setAbsoluteDay(state,start+1);status=colony.headquartersContinuity(state);approx(status.penalty,.11);assert.equal(status.offlineDays,1);
  setAbsoluteDay(state,start+90);status=colony.headquartersContinuity(state);approx(status.penalty,1);approx(status.efficiencyFactor,0);assert.equal(status.downTools,true);
  inventory.store(state,"fuel","biomass","Biomass",100000,500);status=colony.headquartersContinuity(state);assert.equal(status.phase,"recovery");assert.equal(status.networkAvailable,true);approx(status.penalty,1);assert.equal(status.recoveryDaysRemaining,10);
  setAbsoluteDay(state,start+95);status=colony.headquartersContinuity(state);approx(status.penalty,.5);approx(status.efficiencyFactor,.5);assert.equal(status.recoveryDaysRemaining,5);
  setAbsoluteDay(state,start+100);status=colony.headquartersContinuity(state);assert.equal(status.phase,"online");approx(status.penalty,0);approx(status.efficiencyFactor,1);
}

// Every A08a Primary-operational failure mode triggers the same A08b state machine.
{
  const understaffed=establishedColony();understaffed.state.colony.foodStarvationDays=1;let status=understaffed.colony.headquartersContinuity(understaffed.state);assert.equal(status.phase,"outage");assert.equal(status.primaryOperational,false);assert.equal(status.command.primary?.staffed,false);
  const missing=establishedColony();delete missing.state.tiles.hq;status=missing.colony.headquartersContinuity(missing.state);assert.equal(status.phase,"outage");assert.equal(status.primaryOperational,false);assert.equal(status.command.primary,undefined);
}

// Recovery returns the actual accumulated loss evenly over ten days, and a relapse resumes from the current loss.
{
  const {state,inventory,colony}=establishedColony(),start=absoluteDay(state);clearFuel(state,inventory);colony.headquartersContinuity(state);setAbsoluteDay(state,start+30);
  let status=colony.headquartersContinuity(state);approx(status.penalty,.40);inventory.store(state,"fuel","biomass","Biomass",100000,500);status=colony.headquartersContinuity(state);assert.equal(status.phase,"recovery");approx(status.penalty,.40);
  setAbsoluteDay(state,start+35);status=colony.headquartersContinuity(state);approx(status.penalty,.20);clearFuel(state,inventory);status=colony.headquartersContinuity(state);assert.equal(status.phase,"outage");approx(status.penalty,.20);
  setAbsoluteDay(state,start+36);status=colony.headquartersContinuity(state);approx(status.penalty,.21);
}

// Extraction and surveying both use the persisted continuity factor, including a full stop at 100% loss.
{
  const state=createGameState(contracts.first()),tile={x:2,y:2,type:"ore",resourceId:"surface-iron",quality:500,level:1,development:{kind:"extract",level:1}};
  Object.assign(state.metrics,{workforceCommercialFactor:1,industryCommercialFactor:1,powerFactors:{"2,2":1},commandEfficiency:1,headquartersContinuityFactor:1});
  const full=resources.collectionRate(state,tile);state.metrics.headquartersContinuityFactor=.4;approx(resources.collectionRate(state,tile),full*.4);state.metrics.headquartersContinuityFactor=0;assert.equal(resources.collectionRate(state,tile),0);
  const world={get(){return{revealed:false};},reveal(){return{revealed:true};}},survey=new SurveyService(world,{archetype(){return{scan:1};}});state.scans=[{x:3,y:3,total:2,remaining:2,scanningLevel:1}];state.scanQueue=[];state.metrics.slots=1;survey.tick(state);assert.equal(state.scans[0].remaining,2);state.metrics.headquartersContinuityFactor=.4;survey.tick(state);approx(state.scans[0].remaining,1.6);
}

// The outage blocks only new buyer commitments; already scheduled collections continue.
{
  const {state,inventory,colony}=establishedColony(),buyers=new BuyerService(resources,inventory,colony);state.company.rep=100;const available=buyers.catalog(state).filter(row=>row.status==="available");assert.ok(available.length>=2);
  const entered=buyers.enterContract(state,available[0].id);assert.equal(entered.ok,true);clearFuel(state,inventory);assert.equal(buyers.networkStatus(state).networkAvailable,false);const blocked=buyers.enterContract(state,available[1].id);assert.equal(blocked.ok,false);assert.match(blocked.reason,/network offline/i);
  entered.contract.nextDueAbsoluteDay=buyers.absoluteDay(state);const events=buyers.processDay(state);assert.equal(events.length,1);assert.equal(events[0].contractId,entered.contract.id);assert.ok(["docked","orbital-holding"].includes(entered.contract.ship.status));
}

// Every remote conglomerate ordering channel is blocked, while its already-paid commitments keep progressing.
{
  const {state,inventory,colony}=establishedColony(),technology=new TechnologyService(colony);state.company.cash=1e9;technology.recompute(state);const deployment=technology.orderUpgrade(state,"mining");assert.equal(deployment.ok,true);clearFuel(state,inventory);const blocked=technology.orderUpgrade(state,"scanning");assert.equal(blocked.ok,false);assert.match(blocked.reason,/network offline/i);const events=technology.processDay(state);assert.equal(events[0].type,"engineering-preparing");assert.equal(deployment.deployment.status,"preparing");
}
{
  const {state,inventory,colony}=establishedColony(),transport=new TransportService(colony);
  state.company.cash=1e9;state.colony.planetaryAccommodationResidents=0;state.metrics.powerPopulationCap=state.colony.housingCapacity;
  const order=transport.request(state,1);assert.equal(order.ok,true);
  clearFuel(state,inventory);const blocked=transport.request(state,1);assert.equal(blocked.ok,false);assert.match(blocked.reason,/network offline/i);
  setAbsoluteDay(state,order.arrivalDay);const arrivals=transport.processArrivals(state);assert.equal(arrivals.length,1);assert.equal(arrivals[0].id,order.id);
}
{
  const {state,inventory,colony,expansion}=establishedColony(),market=new ShipMarketService(new UniverseShipCatalogue(),expansion,colony);state.company.cash=1e9;const order=market.placeOrder(state,"ship-class-dart-courier",state.colonyId,{signatureAccepted:true});assert.equal(order.ok,true);clearFuel(state,inventory);const blocked=market.placeOrder(state,"ship-class-kestrel-light-freighter",state.colonyId,{signatureAccepted:true});assert.equal(blocked.ok,false);assert.match(blocked.reason,/network offline/i);setAbsoluteDay(state,order.order.dueAbsoluteDay);const events=market.processDay(state);assert.equal(events.length,1);assert.equal(market.order(state,order.order.id).status,"delivered");
}

// Root and portfolio colony state both survive save migration/normalization.
{
  const {state,inventory,colony}=establishedColony(),portfolio=new PortfolioService();clearFuel(state,inventory);colony.headquartersContinuity(state);state.day+=7;const outage=colony.headquartersContinuity(state),outageLoaded=normalizeState(JSON.parse(JSON.stringify(state)));assert.equal(outageLoaded.colony.headquartersOutage.phase,"outage");approx(outageLoaded.colony.headquartersOutage.penalty,outage.penalty);
  inventory.store(state,"fuel","biomass","Biomass",100000,500);const before=colony.headquartersContinuity(state);assert.equal(before.phase,"recovery");portfolio.ensure(state);portfolio.captureActive(state,true);
  const loaded=normalizeState(JSON.parse(JSON.stringify(state)));assert.equal(loaded.version,A08B_STATE_VERSION);assert.equal(loaded.colony.headquartersOutage.phase,"recovery");approx(loaded.colony.headquartersOutage.recoveryInitialPenalty,before.recoveryInitialPenalty);assert.equal(loaded.colony.headquartersOutage.lastOutageDays,7);assert.equal(loaded.portfolio.colonies[0].data.colony.headquartersOutage.phase,"recovery");
  const legacy=JSON.parse(JSON.stringify(state));legacy.version=15;delete legacy.colony.headquartersOutage;delete legacy.portfolio.colonies[0].data.colony.headquartersOutage;const migrated=normalizeState(legacy);assert.equal(migrated.colony.headquartersOutage.phase,"online");assert.equal(migrated.portfolio.colonies[0].data.colony.headquartersOutage.phase,"online");
}

// Presentation consumes domain-owned status rather than rebuilding its arithmetic.
{
  const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8"),buyerUi=read("js/ui/buyer-ui.js"),buyerView=read("views/conglomerate-buyers.html"),hqUi=read("js/ui/adaptive-building-ui.js"),simulation=read("js/domain/simulation-engine.js");
  assert.match(buyerUi,/this\.buyers\.networkStatus\(this\.state\)/);assert.match(buyerView,/data-buyers-network-state/);assert.match(buyerView,/NETWORK OFFLINE = new commitments blocked/);assert.match(hqUi,/this\.colony\.headquartersContinuity\(this\.state,\{command\}\)/);assert.match(hqUi,/OUTAGE CONTINUITY/);assert.match(simulation,/synthetic=this\.colony\.syntheticFoodRate\(state\)\*continuityFactor/);
}

console.log("A08b Headquarters outage, network restriction, degradation, recovery and persistence regression coverage passed");
