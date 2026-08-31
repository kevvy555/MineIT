import assert from "node:assert/strict";
import {
  ExpansionService,EXPANSION_VERSION,STARTER_SHIP_ID,STARTER_SHIP_CLASS_ID,
  PLAYER_SHIP_CARGO_CAPACITY,PLAYER_SHIP_FUEL_CAPACITY,PLAYER_SHIP_FOOD_CAPACITY
} from "../js/domain/expansion-service.js";
import { CONFIG } from "../js/core/config.js";

const inventoryEntry=(key,type,amount)=>({key,type,resourceId:key.split(":")[1],name:key,category:type,amount,qualityBands:{excellent:{amount}}});
const setAbsolute=(state,day)=>{state.year=Math.floor((day-1)/CONFIG.DAYS_PER_YEAR)+1;state.day=(day-1)%CONFIG.DAYS_PER_YEAR+1;};

const state={
  year:1,day:1,speed:0,pop:120,seed:123,
  colonyId:"colony-a",
  colony:{spaceport:{berthCapacity:2},engineeringDeployments:[]},
  contract:{uid:"colony-a",systemId:"koplin-frontier",planetId:"frontier-1",colonyName:"Alpha"},
  portfolio:{activeColonyId:"colony-a",colonies:[
    {id:"colony-a",name:"Alpha",data:{status:"playing",contract:{systemId:"koplin-frontier",planetId:"frontier-1",colonyName:"Alpha"},colony:{spaceport:{berthCapacity:2}}}}
  ]},
  company:{
    cash:10000000,gameOver:false,tech:{industry:5},
    expansion:{
      version:2,
      ship:{status:"docked",systemId:"koplin-frontier",colonyId:"colony-a",cargo:{},foodLots:{},fuelLots:{},passengers:0},
      probes:[],systems:[],lastProcessedAbsoluteDay:0
    }
  },
  inventory:{
    "fuel:test":inventoryEntry("fuel:test","fuel",10000),
    "food:test":inventoryEntry("food:test","food",10000),
    "build:test":inventoryEntry("build:test","build",10000)
  }
};

const expansion=new ExpansionService();
const root=expansion.ensure(state);
assert.equal(root.version,EXPANSION_VERSION);
assert.equal(EXPANSION_VERSION,3);
assert.equal(root.ships.length,1);
assert.equal(root.activeShipId,STARTER_SHIP_ID);
assert.equal(expansion.ship(state).shipClassId,STARTER_SHIP_CLASS_ID);
assert.equal(expansion.ship(state).cargoCapacity,PLAYER_SHIP_CARGO_CAPACITY);
assert.equal(expansion.ship(state).fuelCapacity,PLAYER_SHIP_FUEL_CAPACITY);
assert.equal(expansion.ship(state).foodCapacity,PLAYER_SHIP_FOOD_CAPACITY);
assert.equal(Object.prototype.propertyIsEnumerable.call(root,"ship"),false,"legacy ship alias must not persist as duplicate save truth");

const classRecord={
  id:"ship-class-test-courier",name:"Test Courier",
  capacity:{cargo:500,fuel:1200,food:600,colonists:20},
  minimumCrew:3,maximumCrew:6,
  transitWeeksPerLightYear:2,
  fuelUsePerLightYear:100,
  veCapable:true
};
const second=expansion.createPurchasedShip(state,classRecord,{colonyId:"colony-a",purchase:{paidPrice:1000,currencyId:"currency-commonwealth-credit"}});
assert.equal(root.ships.length,2);
assert.equal(second.cargoCapacity,500);
assert.equal(second.minimumCrew,3);
assert.equal(second.status,"docked");
assert.equal(expansion.ship(state).id,second.id,"newly delivered ship becomes active");

assert.equal(expansion.loadCrew(state,second.id,3).qty,3);
assert.equal(second.crew,3);
assert.equal(expansion.loadPassengers(state,second.id,5).qty,5);
assert.equal(second.passengers,5);
assert.equal(expansion.loadCargo(state,second.id,"build:test",500).qty,500);
assert.equal(expansion.cargoCapacityRemaining(state,second.id),0);
assert.equal(expansion.loadFuel(state,second.id,"fuel:test",1200).qty,1200);
assert.equal(expansion.loadFood(state,second.id,"food:test",600).qty,600);

const target=root.systems.find(system=>!system.home&&system.id!=="koplin-frontier");
target.surveyed=true;
state.portfolio.colonies.push({
  id:"colony-b",name:"Beta",
  data:{status:"playing",contract:{systemId:target.id,planetId:target.planets[0]?.id||"p1",colonyName:"Beta"},colony:{spaceport:{berthCapacity:1}}}
});

// Fill Beta's only berth with the starter ship so the purchased ship must hold in orbit.
const starter=expansion.ship(state,STARTER_SHIP_ID);
starter.status="docked";starter.systemId=target.id;starter.colonyId="colony-b";

const targetResult=expansion.setTarget(state,target.id,"colony-b",second.id);
assert.equal(targetResult.ok,true);
const profile=expansion.travelProfile(state,target.id,null,second.id);
assert.ok(profile.days>0);
assert.equal(profile.fuelRequired,Math.ceil(profile.distanceLy*100));
assert.equal(expansion.canLaunch(state,second.id).ok,true);
const launched=expansion.launch(state,second.id);
assert.equal(launched.ok,true);
assert.equal(second.status,"travelling");

for(let day=expansion.absoluteDay(state)+1;day<=launched.profile.arrivalAbsoluteDay;day++){
  setAbsolute(state,day);
  expansion.processDay(state);
}
assert.equal(second.systemId,target.id);
assert.equal(second.status,"orbiting","full destination Spaceport should put the ship into orbital holding");
assert.equal(second.targetColonyId,"colony-b");

// Free the berth; orbital holding should automatically dock on the following day.
starter.status="home";starter.colonyId=null;starter.systemId="corporate-home";
setAbsolute(state,expansion.absoluteDay(state)+1);
expansion.processDay(state);
assert.equal(second.status,"docked");
assert.equal(second.colonyId,"colony-b");
assert.equal(second.targetColonyId,null);

// Losing one fleet ship must not automatically end the corporation.
const lost=expansion.loseShip(state,"Test loss",second.id);
assert.equal(lost.shipLost,true);
assert.equal(second.status,"lost");
assert.equal(state.company.gameOver,false);

console.log("MineIT fleet foundation test passed");
