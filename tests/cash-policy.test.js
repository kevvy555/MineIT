import assert from "node:assert/strict";
import { SiteService } from "../js/domain/site-service.js";
import { ColonyService } from "../js/domain/colony-service.js";
import { DevelopmentService } from "../js/domain/development-service.js";
import { TechnologyService } from "../js/domain/technology-service.js";
import { TransportService } from "../js/domain/transport-service.js";
import { ContractService } from "../js/domain/contract-service.js";
import { TradeService } from "../js/domain/trade-service.js";

let build=5000,ore=5000;
const inventory={
  amount:(_state,type)=>type==="build"?build:type==="ore"?ore:0,
  consumeCategory:(_state,type,amount)=>{if(type==="build")build-=amount;if(type==="ore")ore-=amount;return{consumed:amount,ratio:1};},
  store(){},ensureEntry:()=>({}),key:(type,id)=>`${type}:${id}`
};

// Local extraction construction/upgrades may require physical capacity and materials, but never cash.
const colonyMock={siteWorkforce:()=>5,freeWorkforce:()=>100,totals:()=>({industry:1000,power:1000,housing:1000})};
const technologyMock={canExploit:()=>true,level:()=>5};
const resourcesMock={isRenewable:()=>false,finiteCostFactor:()=>1};
const contractsMock={archetype:()=>({cost:1})};
const siteService=new SiteService(contractsMock,technologyMock,inventory,colonyMock,resourcesMock);
const siteState={company:{cash:32000},contract:{ended:false,localCosts:0},metrics:{industryInstalled:1000,powerCapacity:1000}};
const tile={x:1,y:1,terrain:"plain",type:"build",resourceId:"stone",revealed:true,developed:false,depleted:false,resourceCovered:false,requiredMiningLevel:1};
const siteBefore=siteState.company.cash;
const developed=siteService.develop(siteState,tile);assert.equal(developed.ok,true);assert.equal(developed.cash,0);assert.equal(siteState.company.cash,siteBefore,"local extraction construction must not spend cash");assert.equal(siteState.contract.localCosts,0);
const upgraded=siteService.upgrade(siteState,tile);assert.equal(upgraded.ok,true);assert.equal(upgraded.cash,0);assert.ok(upgraded.ore>0,"higher-level extraction still requires physical Ore");assert.equal(siteState.company.cash,siteBefore,"local extraction upgrades must not spend cash");

// Housing/Power/Industry construction follows the same local-material policy.
const land={terrainCostMultiplier:()=>1,isShipTile:()=>false};
const development=new DevelopmentService(inventory,land);
const devState={status:"playing",company:{cash:32000,tech:{housing:2,power:1,food:1,industry:1,mining:1}},contract:{ended:false,localCosts:0},tiles:{},colony:{},metrics:{}};
const landTile={x:2,y:2,terrain:"plain",revealed:true,developed:false,development:null,resourceId:null};devState.tiles["2,2"]=landTile;
const devBefore=devState.company.cash;
const placed=development.place(devState,landTile,"housing");assert.equal(placed.ok,true);assert.equal(placed.cash,0);assert.equal(devState.company.cash,devBefore,"Housing construction must use local resources, not cash");
const devUpgrade=development.upgrade(devState,landTile);assert.equal(devUpgrade.ok,true);assert.equal(devUpgrade.cash,0);assert.ok(devUpgrade.ore>0);assert.equal(devState.company.cash,devBefore,"Housing upgrades must not spend cash");

const colony=new ColonyService(inventory,new TechnologyService());
assert.equal(colony.housingCashCost(),0);assert.equal(colony.industryCashCost(),0);for(const status of["playing","holdover","liability"])assert.equal(colony.operatingCost({status},20),0,`${status} must not have a generic daily cash drain`);

// Technology packages, their Engineering Ship transport, other transport, contracts and imports remain genuine external cash costs.
const tech=new TechnologyService();
const techState={year:1,day:1,status:"playing",colonyId:"cash-policy",company:{cash:32000,tech:{housing:1,power:1,food:1,industry:1,mining:1,scanning:1}},contract:{techAccess:"direct",ended:false,localCosts:0,colonyName:"Cash Policy"},colony:{tech:{housing:1,power:1,food:1,industry:1,mining:1,scanning:1}},tiles:{},metrics:{}};
const miningOrder=tech.buy(techState,"mining");assert.equal(miningOrder.ok,true);assert.equal(miningOrder.tech.cost,15000);assert.equal(miningOrder.transportCost,5000);assert.equal(techState.company.cash,12000,"first same-day capability order pays its package plus one Engineering Ship transport charge");
const scanningOrder=tech.buy(techState,"scanning");assert.equal(scanningOrder.ok,true);assert.equal(scanningOrder.tech.cost,10000);assert.equal(scanningOrder.transportCost,0);assert.equal(scanningOrder.joinsBatch,true);assert.equal(techState.company.cash,2000,"same-day second capability pays only its package because it shares the Engineering Ship");assert.equal(miningOrder.deployment.paidTotal,30000);assert.equal(miningOrder.deployment.sharedTransportSaving,5000);

const transport=new TransportService();
const transportState={year:1,day:1,status:"playing",company:{cash:100000},contract:{supportLoad:1,ended:false,localCosts:0},colony:{housingCapacity:500,transportOrders:[]},metrics:{powerPopulationCap:500},pop:120};
const order=transport.request(transportState,100);assert.equal(order.ok,true);assert.equal(order.cost,45000);assert.equal(transportState.company.cash,55000,"dedicated transport remains a cash purchase");

const contractService=new ContractService();
const extensionState={company:{cash:100000},contract:{extUsed:0,ext:0,tier:1,localCosts:0},status:"deadline-missed"};assert.equal(contractService.extend(extensionState),true);assert.equal(extensionState.company.cash,75000,"contract extensions remain cash fees");
const renewalState={company:{cash:200000},contract:{completed:true,ended:false,renewals:0,tier:1,colonyTier:1,ext:0,localCosts:0},status:"holdover",speed:0};const renewal=contractService.renew(renewalState);assert.equal(renewal.ok,true);assert.equal(renewal.fee,100000);assert.equal(renewalState.company.cash,100000,"contract renewal remains a cash fee");

const tradeInventory={key:(type,id)=>`${type}:${id}`,store(){},ensureEntry:()=>({})};
const tradeResources={catalog:()=>[{type:"build",id:"fiber",name:"Construction Fibre",category:"Build",rarity:"Common",sellPrice:.12}],sellPrice:()=>.6};
const trade=new TradeService(tradeResources,tradeInventory);
const tradeState={company:{cash:100,rep:0},trade:{active:true,cargoUsed:0,exportUsed:0,passengersUsed:0},contract:{localCosts:0}};
const imported=trade.buy(tradeState,"build:fiber",10);assert.equal(imported.ok,true);assert.equal(imported.cost,9);assert.equal(tradeState.company.cash,91,"off-world resource imports remain cash purchases");

console.log("canonical external-only cash economy policy tests passed");
