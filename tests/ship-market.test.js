import assert from "node:assert/strict";
import { UniverseShipCatalogue } from "../js/data/universe-ship-catalogue.js";
import { ExpansionService } from "../js/domain/expansion-service.js";
import { ShipMarketService,SHIP_CHARTER_DISCOUNT_RATE } from "../js/domain/ship-market-service.js";
import { CONFIG } from "../js/core/config.js";

const setAbsolute=(state,absoluteDay)=>{state.year=Math.floor((absoluteDay-1)/CONFIG.DAYS_PER_YEAR)+1;state.day=(absoluteDay-1)%CONFIG.DAYS_PER_YEAR+1;};
const catalogue=new UniverseShipCatalogue();
assert.equal(catalogue.provenance().source,"bundled");
assert.equal(catalogue.provenance().schemaVersion,6);
assert.equal(catalogue.retail().length,30);
assert.equal(catalogue.starter().id,"ship-class-asterion-pioneer-colony-transport");
assert.equal(catalogue.classById("ship-class-dart-courier").production.factoryLeadTimeDays,120);
assert.equal(catalogue.classById("ship-class-dart-courier").specifications.fuelUsePerLightYear,517);

const state={
  year:1,day:1,speed:0,seed:42,pop:100,
  colonyId:"colony-a",
  contract:{uid:"colony-a",systemId:"koplin-frontier",planetId:"frontier-1",colonyName:"Alpha"},
  colony:{spaceport:{level:1,berthCapacity:2},engineeringDeployments:[]},trade:{active:false},
  portfolio:{activeColonyId:"colony-a",colonies:[{id:"colony-a",name:"Alpha",data:{status:"playing",contract:{systemId:"koplin-frontier",planetId:"frontier-1",colonyName:"Alpha"},colony:{spaceport:{level:1,berthCapacity:2},engineeringDeployments:[]},trade:{active:false}}}]},
  company:{cash:10000000,gameOver:false,buyers:{contracts:{}}}
};
const expansion=new ExpansionService(),market=new ShipMarketService(catalogue,expansion);
expansion.ensure(state);market.ensure(state);

const quote=market.quote(state,"ship-class-dart-courier");
assert.equal(quote.ok,true);
assert.equal(quote.discountRate,SHIP_CHARTER_DISCOUNT_RATE);
assert.equal(quote.listPrice,3600000);
assert.equal(quote.price,2340000);
assert.equal(quote.leadTimeDays,120);
assert.equal(market.deliveryColonies(state)[0].berth.free,1,"starter ship occupies one of two berths");

const before=state.company.cash,placed=market.placeOrder(state,"ship-class-dart-courier","colony-a",{signatureAccepted:true});
assert.equal(placed.ok,true);
assert.equal(state.company.cash,before-2340000);
assert.equal(placed.order.status,"production-queued");
assert.equal(placed.order.vesselName,"Dart Courier 01");
assert.equal(placed.order.universeContentVersion,"0.6.0");

const cancelled=market.cancelOrder(state,placed.order.id);
assert.equal(cancelled.ok,true);
assert.equal(cancelled.fee,117000);
assert.equal(cancelled.refund,2223000);
assert.equal(state.company.cash,before-117000);

state.company.cash=10000000;
const next=market.placeOrder(state,"ship-class-dart-courier","colony-a",{signatureAccepted:true});
assert.equal(next.ok,true);
const order=market.order(state,next.order.id);
setAbsolute(state,order.productionLockAbsoluteDay);
assert.equal(market.cancelOrder(state,order.id).ok,false,"manufacturing lock must prevent cancellation");
setAbsolute(state,order.dueAbsoluteDay);
const events=market.processDay(state);
assert.equal(events.length,1);
assert.equal(order.status,"delivered");
assert.ok(order.shipId);
const delivered=expansion.ship(state,order.shipId);
assert.equal(delivered.name,"Dart Courier 02");
assert.equal(delivered.shipClassId,"ship-class-dart-courier");
assert.equal(delivered.cargoCapacity,2500);
assert.equal(delivered.fuelCapacity,6200);
assert.equal(delivered.status,"docked");
assert.equal(delivered.colonyId,"colony-a");
assert.equal(delivered.purchase.procurementChannel,"koplin-deep-reach-framework");
assert.equal(expansion.cargoAmount(state,delivered.id),0);
assert.equal(expansion.fuelAmount(state,delivered.id),0);

// Full berth delivers the completed vessel into orbital holding and the fleet auto-docking system owns the next transition.
state.company.cash=10000000;
state.colony.spaceport.berthCapacity=2;
state.portfolio.colonies[0].data.colony.spaceport.berthCapacity=2;
const third=market.placeOrder(state,"ship-class-kestrel-light-freighter","colony-a",{signatureAccepted:true});
const thirdOrder=market.order(state,third.order.id);
setAbsolute(state,thirdOrder.dueAbsoluteDay);
market.processDay(state);
const orbiting=expansion.ship(state,thirdOrder.shipId);
assert.equal(thirdOrder.deliveryStatus,"orbiting");
assert.equal(orbiting.status,"orbiting");
assert.equal(orbiting.targetColonyId,"colony-a");

const wren=market.canOrder(state,"ship-class-wren-shuttle","colony-a");
assert.equal(wren.ok,false);
assert.match(wren.reason,/in-system-only/i);

console.log("MineIT ship market test passed");
