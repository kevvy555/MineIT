import assert from "node:assert/strict";
import { SiteService } from "../js/domain/site-service-v563.js?v=5.6.3";
import { ColonyService } from "../js/domain/colony-service-v563.js?v=5.6.3";
import { DevelopmentService } from "../js/domain/development-service-v563.js?v=5.6.3";
import { TechnologyService } from "../js/domain/technology-service.js?v=5.5.5";
import { TransportService } from "../js/domain/transport-service.js?v=5.5.5";
import { ContractService } from "../js/domain/contract-service.js?v=5.5.5";
import { TradeService } from "../js/domain/trade-service.js?v=5.5.5";

let build=5000;
const inventory={
  amount:(_state,type)=>type==="build"?build:0,
  consumeCategory:(_state,type,amount)=>{if(type==="build")build-=amount;return{consumed:amount,ratio:1};},
  store(){},ensureEntry:()=>({}),key:(type,id)=>`${type}:${id}`
};
const colonyMock={siteWorkforce:()=>5,freeWorkforce:()=>100,siteUpgradeIndustryRequirement:()=>1};
const technologyMock={canExploit:()=>true,canUpgradeSite:()=>true,siteUpgradeTechRequirement:()=>1};
const resourcesMock={isRenewable:()=>false,finiteCostFactor:()=>1};
const contractsMock={archetype:()=>({cost:1})};
const siteService=new SiteService(contractsMock,technologyMock,inventory,colonyMock,resourcesMock);
const siteState={company:{cash:32000},contract:{ended:false,localCosts:0},colony:{industryLevel:10}};
const tile={x:1,y:1,terrain:"plain",type:"build",resourceId:"stone",revealed:true,developed:false,depleted:false,resourceCovered:false,requiredMiningLevel:1};
const siteBefore=siteState.company.cash;
const developed=siteService.develop(siteState,tile);
assert.equal(developed.ok,true);
assert.equal(developed.cash,0);
assert.equal(siteState.company.cash,siteBefore,"local extraction construction must not spend cash");
assert.equal(siteState.contract.localCosts,0);
const upgraded=siteService.upgrade(siteState,tile);
assert.equal(upgraded.ok,true);
assert.equal(upgraded.cash,0);
assert.equal(siteState.company.cash,siteBefore,"local extraction upgrades must not spend cash");

const land={
  terrainCostMultiplier:()=>1,isShipTile:()=>false,
  ensure:()=>({baseHousingLevel:1,baseHousingCapacity:180,baseIndustryLevel:1})
};
const development=new DevelopmentService(inventory,land);
const devState={status:"playing",company:{cash:32000},contract:{ended:false,localCosts:0},tiles:{},colony:{housingLevel:1,housingCapacity:180,industryLevel:1},metrics:{powerPopulationCap:1000,powerIndustryCap:10}};
const landTile={x:2,y:2,terrain:"plain",revealed:true};
devState.tiles["2,2"]=landTile;
const devBefore=devState.company.cash;
const placed=development.place(devState,landTile,"housing");
assert.equal(placed.ok,true);
assert.equal(placed.cash,0);
assert.equal(devState.company.cash,devBefore,"Housing/Industry construction must use local resources, not cash");
const devUpgrade=development.upgrade(devState,landTile);
assert.equal(devUpgrade.ok,true);
assert.equal(devUpgrade.cash,0);
assert.equal(devState.company.cash,devBefore,"Housing/Industry upgrades must not spend cash");

const colony=new ColonyService(inventory,new TechnologyService());
assert.equal(colony.housingCashCost({colony:{housingLevel:5}}),0);
assert.equal(colony.industryCashCost({colony:{industryLevel:5}}),0);
for(const status of["playing","holdover","liability"])
  assert.equal(colony.operatingCost({status,contract:{colonyTier:5,supportLoad:2},colony:{industryLevel:10,housingLevel:10,emergencyMode:false},pop:5000},20),0,`${status} must not have a generic daily cash drain`);

const tech=new TechnologyService();
const techState={company:{cash:32000,tech:{power:1,food:1,mining:1}},contract:{techAccess:"direct"},metrics:{}};
const techBuy=tech.buy(techState,"mining");
assert.equal(techBuy.ok,true);
assert.equal(techBuy.tech.cost,25000);
assert.equal(techState.company.cash,7000,"technology remains an external cash purchase");

const transport=new TransportService();
const transportState={year:1,day:1,status:"playing",company:{cash:100000},contract:{supportLoad:1,ended:false,localCosts:0},colony:{housingCapacity:500,transportOrders:[]},metrics:{powerPopulationCap:500},pop:120};
const order=transport.request(transportState,100);
assert.equal(order.ok,true);
assert.equal(order.cost,45000);
assert.equal(transportState.company.cash,55000,"dedicated transport remains a cash purchase");

const contractService=new ContractService();
const extensionState={company:{cash:100000},contract:{extUsed:0,ext:0,tier:1,localCosts:0},status:"deadline-missed"};
assert.equal(contractService.extend(extensionState),true);
assert.equal(extensionState.company.cash,75000,"contract extensions remain cash fees");
const renewalState={company:{cash:200000},contract:{completed:true,ended:false,renewals:0,tier:1,colonyTier:1,ext:0,localCosts:0},status:"holdover",speed:0};
const renewal=contractService.renew(renewalState);
assert.equal(renewal.ok,true);
assert.equal(renewal.fee,100000);
assert.equal(renewalState.company.cash,100000,"contract renewal remains a cash fee");

const tradeInventory={key:(type,id)=>`${type}:${id}`,store(){},ensureEntry:()=>({})};
const tradeResources={catalog:()=>[{type:"build",id:"fiber",name:"Construction Fibre",category:"Build",rarity:"Common",sellPrice:.12}],sellPrice:()=>.6};
const trade=new TradeService(tradeResources,tradeInventory);
const tradeState={company:{cash:100},trade:{active:true,cargoUsed:0},contract:{localCosts:0}};
const imported=trade.buy(tradeState,"build:fiber",10);
assert.equal(imported.ok,true);
assert.equal(imported.cost,9);
assert.equal(tradeState.company.cash,91,"off-world resource imports remain cash purchases");

console.log("external-only cash economy policy tests passed");
