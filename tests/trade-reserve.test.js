import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TradeService } from "../js/domain/trade-service.js";

const resources=new ResourceService(),inventory=new InventoryService(resources),trade=new TradeService(resources,inventory);
const state={year:1,day:1,inventory:{},metrics:{processingBonus:0,powerPopulationCap:1000,food:20,foodDemand:12},company:{cash:0,earn:0,rep:0},contract:{localRevenue:0,localCosts:0,supportLoad:1,ended:false},trade:{active:true,cargoUsed:0,exportUsed:0,passengersUsed:0},colony:{housingCapacity:1000,transportOrders:[],tradeReserves:{"ore:gold":50,"fuel:coal":1000}},pop:100,status:"playing"};

// Old per-resource saves migrate deterministically to one conservative colony-wide reserve.
assert.equal(trade.colonyTradeReserve(state),1000);
assert.equal(state.colony.tradeReserve,1000);
assert.equal(trade.tradeReserve(state,"ore:gold"),1000);

inventory.storeTile(state,{type:"ore",resourceId:"gold",name:"Gold",quality:20},1200);
inventory.storeTile(state,{type:"ore",resourceId:"gold",name:"Gold",quality:9000},200);
inventory.store(state,"fuel","coal","Coal Seam",1300);
const gold=state.inventory["ore:gold"],coal=state.inventory["fuel:coal"];
assert.equal(gold.amount,1400);
assert.equal(trade.sellableAmount(state,gold),400);
assert.equal(trade.sellableAmount(state,coal),300);
assert.equal(trade.reserveShortfall(state,"fuel:coal"),0);
assert.equal(trade.quoteSell(state,"ore:gold",100000).qty,400);

// One setting applies to every resource and is mutated through TradeService.
assert.equal(trade.setColonyTradeReserve(state,250),250);
assert.equal(state.colony.tradeReserve,250);
assert.equal("tradeReserves" in state.colony,false);
assert.equal(trade.sellableAmount(state,gold),1150);
assert.equal(trade.sellableAmount(state,coal),1050);

// Category exports protect the same reserve independently on every entry.
const oreQuote=trade.sellCategoryQuote(state,"ore");
assert.equal(oreQuote.qty,1150);
const sale=trade.sellCategory(state,"ore");
assert.equal(sale.ok,true);
assert.equal(sale.qty,1150);
assert.equal(gold.amount,250);
assert.equal(trade.sellableAmount(state,gold),0);
assert.match(trade.sell(state,"ore:gold",1).reason,/reserve/i);
assert.equal(coal.amount,1300,"selling Ore must not consume Fuel stock");

// Fresh runtime state accepts the new colony-wide setting without creating legacy maps.
const contracts=new ContractService(),fresh=createGameState(contracts.first());
assert.equal(trade.setColonyTradeReserve(fresh,12345),12345);
assert.equal(fresh.colony.tradeReserve,12345);
assert.equal("tradeReserves" in fresh.colony,false);

// MAX SAFE is convenience only: it uses Food surplus, while hard transfer validation remains housing/power/passenger based.
state.trade.passengersUsed=0;state.company.cash=1e9;state.colony.housingCapacity=1000;state.metrics.powerPopulationCap=1000;state.pop=100;state.metrics.food=20;state.metrics.foodDemand=12;
const safe=trade.colonistSafeCapacity(state),hard=trade.colonistCapacity(state);
assert.ok(safe>0&&safe<hard,"Food-safe capacity should be lower than the hard supported capacity in this fixture");
const overrideQty=Math.min(hard,trade.passengerRemaining(state),safe+1);
assert.equal(trade.canTransferColonists(state,overrideQty).ok,true,"manual quantity may override MAX SAFE when hard limits allow it");

const quick=readFileSync(new URL("../js/ui/quick-trade-ui.js",import.meta.url),"utf8"),sellView=readFileSync(new URL("../views/quick-trade-sell.html",import.meta.url),"utf8"),buyView=readFileSync(new URL("../views/quick-trade-buy.html",import.meta.url),"utf8"),colonists=readFileSync(new URL("../views/quick-trade-colonists.html",import.meta.url),"utf8"),controller=readFileSync(new URL("../js/ui/trade-reserve-ui.js",import.meta.url),"utf8"),reserveView=readFileSync(new URL("../views/trade-reserve.html",import.meta.url),"utf8"),reserveCard=readFileSync(new URL("../views/colony-trade-reserve-card.html",import.meta.url),"utf8"),css=readFileSync(new URL("../css/trade-quick.css",import.meta.url),"utf8");
assert.match(sellView,/SELL COLONY STOCK/);assert.match(sellView,/data-sell-category/);assert.match(buyView,/BUY FROM CORPORATION/);assert.match(colonists,/MAX SAFE/);assert.match(colonists,/PROJECTED FOOD/);assert.match(quick,/sellCategoryQuote/);assert.match(quick,/colonistSafeCapacity/);assert.match(controller,/setColonyTradeReserve/);assert.doesNotMatch(controller,/tradeReserves/);assert.match(reserveView,/RESERVE PER RESOURCE/i);assert.match(reserveCard,/COLONY STOCK RESERVE/);assert.match(css,/trade-quick-modal \.modal-body\{overflow:hidden\}/);
console.log("MineIT colony-wide Corporate Ship reserve and safe-colonist test passed");
