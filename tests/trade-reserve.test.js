import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ContractService } from "../js/domain/contract-service.js";
import { createGameState,normalizeState } from "../js/domain/game-state.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TradeService } from "../js/domain/trade-service.js";

const resources=new ResourceService(),inventory=new InventoryService(resources),trade=new TradeService(resources,inventory);
const state={year:1,day:1,inventory:{},metrics:{processingBonus:0,powerPopulationCap:1000},company:{cash:0,earn:0,rep:0},contract:{localRevenue:0,localCosts:0,supportLoad:1,ended:false},trade:{active:true,cargoUsed:0,exportUsed:0,passengersUsed:0},colony:{housingCapacity:1000,transportOrders:[],tradeReserves:{"ore:gold":50}},pop:100,status:"playing"};
inventory.storeTile(state,{type:"ore",resourceId:"gold",name:"Gold",quality:20},80);
inventory.storeTile(state,{type:"ore",resourceId:"gold",name:"Gold",quality:9000},20);
const gold=state.inventory["ore:gold"];
assert.equal(trade.tradeReserve(state,"ore:gold"),50);
assert.equal(trade.sellableAmount(state,gold),50);
const quote=trade.quoteSell(state,"ore:gold",100000);
assert.equal(quote.qty,50);
assert.equal(quote.revenue,20*75+30*18.75);
const sale=trade.sell(state,"ore:gold",100000);
assert.equal(sale.qty,50);
assert.equal(gold.amount,50);
assert.equal(gold.qualityBands.extraordinary.amount,0);
assert.equal(gold.qualityBands.common.amount,50);
assert.equal(trade.sellableAmount(state,gold),0);
assert.match(trade.sell(state,"ore:gold",1).reason,/reserve/i);

state.colony.tradeReserves["fuel:coal"]=1000;
inventory.store(state,"fuel","coal","Coal Seam",200);
assert.equal(trade.reserveShortfall(state,"fuel:coal"),800);
assert.equal(trade.sellableStock(state).some(x=>x.key==="fuel:coal"),false);

const contracts=new ContractService(),saved=createGameState(contracts.first());saved.colony.tradeReserves={"ore:iron":12345};normalizeState(saved);assert.equal(saved.colony.tradeReserves["ore:iron"],12345);

const quick=readFileSync(new URL("../js/ui/quick-trade-ui.js",import.meta.url),"utf8"),controller=readFileSync(new URL("../js/ui/ui-controller-v590.js",import.meta.url),"utf8"),css=readFileSync(new URL("../css/trade-quick.css",import.meta.url),"utf8");
assert.match(quick,/SELL COLONY STOCK/);assert.match(quick,/BUY FROM CORPORATION/);assert.match(quick,/COLONIST TRANSFER/);assert.match(quick,/MAX_TRADE=100000/);assert.match(quick,/PAGE_SIZE=4/);assert.match(quick,/data-buy-reserve/);assert.match(controller,/trade-reserve/);assert.match(controller,/tradeReserves/);assert.match(css,/trade-quick-modal \.modal-body\{overflow:hidden\}/);
console.log("MineIT quick ship trade reserve test passed");
