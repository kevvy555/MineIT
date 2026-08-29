import assert from "node:assert/strict";
import { CONFIG } from "../js/core/config.js";
import { TECH_TREES } from "../js/data/technologies.js";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState,normalizeState } from "../js/domain/game-state-runtime.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { SurveyService } from "../js/domain/survey-service.js";
import { WorldService } from "../js/domain/world-service.js";
import { LandService } from "../js/domain/land-service.js";
import { berthStatus } from "../js/domain/spaceport-model.js";

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),technology=new TechnologyService(),trade=new TradeService(resources,inventory),land=new LandService(),world=new WorldService(resources,contracts,land),survey=new SurveyService(world,contracts);
const absoluteDay=state=>(state.year-1)*CONFIG.DAYS_PER_YEAR+state.day;
const nextDay=state=>{state.day++;if(state.day>CONFIG.DAYS_PER_YEAR){state.day=1;state.year++;}};
const processNextDay=state=>{nextDay(state);return technology.processDay(state);};

assert.equal(TECH_TREES.scanning.length,10,"Scanning must expose ten prospecting capability levels");
const legacyMining=[0,25000,90000,300000,1000000,3500000,12000000,40000000,130000000,400000000];
for(let i=0;i<10;i++)assert.equal(TECH_TREES.mining[i].cost+TECH_TREES.scanning[i].cost,legacyMining[i],`Mining + Scanning L${i+1} must preserve the old combined technology cost`);

const migrated=createGameState(contracts.first());
migrated.version=9;migrated.company.tech={housing:3,power:4,food:2,industry:3,mining:5};delete migrated.colony.tech;delete migrated.company.tech.scanning;migrated.contract.requiredTech={power:1,food:1,mining:1};
for(const entry of migrated.portfolio.colonies){if(entry.data?.colony)delete entry.data.colony.tech;if(entry.data?.contract)entry.data.contract.requiredTech={power:1,food:1,mining:1};}
for(const system of migrated.company.expansion.systems)for(const planet of system.planets||[])if(planet.requiredTech)delete planet.requiredTech.scanning;
const normalized=normalizeState(JSON.parse(JSON.stringify(migrated)));
assert.equal(normalized.version,10);
assert.equal(normalized.company.tech.scanning,5,"old Mining level must migrate into corporate Scanning access");
assert.equal(normalized.colony.tech.mining,5);
assert.equal(normalized.colony.tech.scanning,5,"old colony capability must retain its previous scanning strength");
assert.equal(normalized.contract.requiredTech.scanning,normalized.contract.requiredTech.mining,"old contracts must inherit their Mining requirement as Scanning");
for(const system of normalized.company.expansion.systems)for(const planet of system.planets||[])assert.equal(planet.requiredTech.scanning,planet.requiredTech.mining,"existing generated planets must migrate their Scanning requirement");
assert.deepEqual(normalized.colony.spaceport.tile,{x:0,y:0});
assert.equal(normalized.colony.spaceport.level,1);
assert.equal(normalized.colony.spaceport.berthCapacity,CONFIG.BASIC_SPACEPORT_BERTHS);

const state=createGameState(contracts.first());state.company.cash=500000;state.contract.distanceLy=0;technology.recompute(state);
assert.equal(technology.level(state,"mining"),1);assert.equal(technology.level(state,"scanning"),1);
const cashBefore=state.company.cash,first=technology.orderUpgrade(state,"mining");
assert.equal(first.ok,true);assert.equal(first.transportCost,CONFIG.ENGINEERING_SHIP_TRANSPORT_COST);assert.equal(first.packageCost,15000);assert.equal(first.cost,20000);assert.equal(technology.level(state,"mining"),1,"ordered equipment must not activate immediately");
const second=technology.orderUpgrade(state,"scanning");
assert.equal(second.ok,true);assert.equal(second.joinsBatch,true);assert.equal(second.transportCost,0,"same-day second upgrade must share the Engineering Ship");assert.equal(second.packageCost,10000);assert.equal(state.company.cash,cashBefore-30000);
const deployment=first.deployment;
assert.equal(deployment.id,second.deployment.id);assert.equal(deployment.transportCost,CONFIG.ENGINEERING_SHIP_TRANSPORT_COST);assert.equal(deployment.packageSubtotal,25000);assert.equal(deployment.paidTotal,30000);assert.equal(deployment.sharedTransportSaving,CONFIG.ENGINEERING_SHIP_TRANSPORT_COST);assert.equal(deployment.upgrades.length,2);

technology.processDay(state);assert.equal(deployment.status,"preparing");assert.equal(deployment.preparationDaysRemaining,5);
for(let remaining=4;remaining>=1;remaining--){processNextDay(state);assert.equal(deployment.status,"preparing");assert.equal(deployment.preparationDaysRemaining,remaining);assert.equal(technology.level(state,"mining"),1);}
processNextDay(state);assert.equal(deployment.status,"in-transit","Engineering Ship must launch only after five full preparation days");assert.equal(deployment.departedAbsoluteDay,absoluteDay(state));assert.equal(deployment.travelDaysRemaining,CONFIG.ENGINEERING_MIN_TRAVEL_DAYS);
assert.equal(technology.cancelDeployment(state,deployment.id).ok,false,"post-launch deployments must not be cancellable");

for(let remaining=CONFIG.ENGINEERING_MIN_TRAVEL_DAYS-1;remaining>=1;remaining--){processNextDay(state);assert.equal(deployment.status,"in-transit");assert.equal(deployment.travelDaysRemaining,remaining);}
state.trade.active=true;
processNextDay(state);assert.equal(deployment.status,"orbital-holding","Engineering Ship must hold in orbit when both Basic Spaceport berths are occupied");
const full=berthStatus(state);assert.equal(full.capacity,CONFIG.BASIC_SPACEPORT_BERTHS);assert.equal(full.used,CONFIG.BASIC_SPACEPORT_BERTHS);assert.equal(full.full,true);
state.trade.active=false;
processNextDay(state);assert.equal(deployment.status,"landed");
const popBefore=state.pop,housingBefore=state.colony.housingCapacity;
processNextDay(state);assert.equal(deployment.status,"commissioning");assert.equal(deployment.commissionDaysRemaining,CONFIG.ENGINEERING_COMMISSION_DAYS);
for(let remaining=CONFIG.ENGINEERING_COMMISSION_DAYS-1;remaining>=1;remaining--){processNextDay(state);assert.equal(deployment.status,"commissioning");assert.equal(deployment.commissionDaysRemaining,remaining);}
processNextDay(state);assert.equal(deployment.status,"complete");assert.equal(technology.level(state,"mining"),2);assert.equal(technology.level(state,"scanning"),2);assert.equal(technology.companyLevel(state,"mining"),2);assert.equal(technology.companyLevel(state,"scanning"),2);assert.equal(state.pop,popBefore,"Engineering specialists must not join colony population");assert.equal(state.colony.housingCapacity,housingBefore,"Engineering specialists must not consume colony Housing");

const cancelling=createGameState(contracts.first());cancelling.company.cash=100000;technology.recompute(cancelling);const cancelOrder=technology.orderUpgrade(cancelling,"housing");assert.equal(cancelOrder.ok,true);technology.processDay(cancelling);assert.equal(cancelOrder.deployment.status,"preparing");const afterPayment=cancelling.company.cash,cancel=technology.cancelDeployment(cancelling,cancelOrder.deployment.id);assert.equal(cancel.ok,true);assert.equal(cancel.fee,CONFIG.ENGINEERING_CANCELLATION_FEE);assert.equal(cancel.refund,cancelOrder.deployment.paidTotal-CONFIG.ENGINEERING_CANCELLATION_FEE);assert.equal(cancelling.company.cash,afterPayment+cancel.refund);assert.equal(technology.level(cancelling,"housing"),1);

const corporate=createGameState(contracts.first());technology.recompute(corporate);corporate.trade.nextArrivalDay=absoluteDay(corporate);corporate.colony.engineeringDeployments.push({id:"landed-engineering",status:"landed",upgrades:[]});assert.equal(berthStatus(corporate).free,0,"player ship + Engineering Ship must fill the provisional Basic Spaceport");assert.equal(trade.shouldArrive(corporate),false);assert.equal(corporate.trade.orbitalHolding,true,"Corporate Ship must enter orbital holding if the Spaceport is full");corporate.colony.engineeringDeployments[0].status="complete";assert.equal(trade.shouldArrive(corporate),true);assert.equal(trade.arrive(corporate),true);assert.equal(corporate.trade.orbitalHolding,false);assert.equal(berthStatus(corporate).used,2,"landed player and Corporate ships must both consume a berth");

const prospect=createGameState(contracts.first());land.ensure(prospect);land.settle(prospect,0);technology.recompute(prospect);let anomaly=null;for(const tile of Object.values(prospect.tiles)){if(tile.x===0&&tile.y===0)continue;const result=world.reveal(prospect,tile.x,tile.y);if(result.unresolved){anomaly=result;break;}}
assert.ok(anomaly,"low-level Scanning should produce at least one unresolved higher-tier deposit in the generated landing area");const requiredScanningLevel=anomaly.unresolvedScanningLevel;assert.ok(requiredScanningLevel>1);assert.equal(survey.surveyable(prospect,anomaly.x,anomaly.y),false);prospect.colony.tech.scanning=requiredScanningLevel;technology.recompute(prospect);assert.equal(survey.surveyable(prospect,anomaly.x,anomaly.y),true,"an unresolved anomaly must become surveyable after the required Scanning capability is deployed");const resolved=world.reveal(prospect,anomaly.x,anomaly.y);assert.equal(resolved.unresolved,false);assert.ok(resolved.resourceId,"re-surveying with adequate Scanning must reveal the deterministic hidden resource rather than clear the tile");assert.equal(resolved.requiredScanningLevel,requiredScanningLevel);

console.log("MineIT Engineering Ship, Spaceport berth and split Scanning/Mining technology tests passed");
