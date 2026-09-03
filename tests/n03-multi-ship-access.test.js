import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ExpansionService,STARTER_SHIP_ID
} from "../js/domain/expansion-service.js";

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const inventoryEntry=(key,type,amount)=>({key,type,resourceId:key.split(":")[1],name:key,category:type,amount,qualityBands:{excellent:{amount}}});

const world=read("js/ui/world-view-runtime.js"),playerShip=read("js/ui/player-ship-ui.js"),shipPrep=read("js/ui/ship-preparation-ui.js"),spaceport=read("views/player-fleet-spaceport.html");

assert.match(world,/shipsAtColony/);
assert.match(playerShip,/shipsAtColony/);
assert.match(playerShip,/playerShipHere\(\)/);
assert.match(shipPrep,/spaceportPanel\(/);
assert.match(shipPrep,/selectShip/);
assert.match(shipPrep,/FLEET_HIT_PREFIX|__fleet_ship__/);
assert.match(spaceport,/data-player-fleet-ship/);
assert.match(spaceport,/data-open-fleet-manager/);

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
expansion.ensure(state);
const starter=expansion.ship(state,STARTER_SHIP_ID);
assert.equal(starter.status,"docked");
assert.equal(expansion.shipsAtColony(state,"colony-a").length,1);

const classRecord={
  id:"ship-class-test-courier",name:"Test Courier",
  capacity:{cargo:500,fuel:1200,food:600,colonists:20},
  minimumCrew:3,maximumCrew:6,
  transitWeeksPerLightYear:2,
  fuelUsePerLightYear:100,
  veCapable:true
};
const second=expansion.createPurchasedShip(state,classRecord,{colonyId:"colony-a",purchase:{paidPrice:1000,currencyId:"currency-commonwealth-credit"}});
assert.equal(expansion.ships(state).length,2);
assert.equal(expansion.ship(state).id,second.id);
assert.equal(starter.status,"docked");
assert.equal(starter.colonyId,"colony-a");
assert.equal(expansion.shipsAtColony(state,"colony-a").length,2,"both docked ships remain map/Spaceport accessible");

const localFleet=expansion.ships(state).filter(ship=>(ship.status==="docked"&&ship.colonyId==="colony-a")||(ship.status==="orbiting"&&ship.targetColonyId==="colony-a"));
assert.equal(localFleet.length,2);
assert.ok(localFleet.some(ship=>ship.id===STARTER_SHIP_ID),"original ship remains in Spaceport fleet list");
assert.ok(localFleet.some(ship=>ship.id===second.id),"delivered ship appears in Spaceport fleet list");

second.status="orbiting";second.targetColonyId="colony-a";second.colonyId=null;
assert.equal(expansion.shipsAtColony(state,"colony-a").length,1);
assert.equal(expansion.shipsAtColony(state,"colony-a")[0].id,STARTER_SHIP_ID,"docked original ship still shows landed affordance when active ship orbits");
const stillListed=expansion.ships(state).filter(ship=>(ship.status==="docked"&&ship.colonyId==="colony-a")||(ship.status==="orbiting"&&ship.targetColonyId==="colony-a"));
assert.equal(stillListed.length,2);

const selected=expansion.selectShip(state,STARTER_SHIP_ID);
assert.equal(selected.ok,true);
assert.equal(expansion.ship(state).id,STARTER_SHIP_ID);

console.log("N03 multi-ship selection and access regression passed");
