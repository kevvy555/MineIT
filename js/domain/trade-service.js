import { CONFIG } from "../core/config.js?v=5.0.0";

export class TradeService {
  constructor(resourceService,inventoryService){this.resources=resourceService;this.inventory=inventoryService;}
  absoluteDay(state){return(Math.max(1,state.year)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,state.day);}
  catalog(){return this.resources.catalog().map(def=>({key:this.inventory.key(def.type,def.id),type:def.type,resourceId:def.id,name:def.name,category:def.category,rarity:def.rarity,sellPrice:def.sellPrice})).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));}
  stock(state){return this.inventory.stock(state);}
  store(state,tile,amount){return this.inventory.storeTile(state,tile,amount);}
  sellPrice(itemOrType,resourceId=null){if(typeof itemOrType==="object")return this.resources.sellPrice(itemOrType.type,itemOrType.resourceId);return this.resources.sellPrice(itemOrType,resourceId);}
  buyPrice(itemOrType,resourceId=null){return this.sellPrice(itemOrType,resourceId)*CONFIG.CORPORATE_BUY_MARKUP;}
  stockValue(state){return this.stock(state).reduce((sum,e)=>sum+e.amount*this.sellPrice(e.type,e.resourceId),0);}
  shouldArrive(state){return["playing","holdover"].includes(state.status)&&!state.contract.ended&&!state.trade.active&&this.absoluteDay(state)>=state.trade.nextArrivalDay;}
  arrive(state){if(state.trade.active)return false;state.trade.active=true;state.trade.returnSpeed=state.speed>0?state.speed:1;state.trade.arrivedAt=this.absoluteDay(state);state.trade.visits++;do{state.trade.nextArrivalDay+=CONFIG.TRADE_INTERVAL_DAYS;}while(state.trade.nextArrivalDay<=state.trade.arrivedAt);state.speed=0;return true;}
  depart(state){if(!state.trade.active)return false;state.trade.active=false;state.trade.arrivedAt=null;if(["playing","holdover","liability"].includes(state.status))state.speed=state.trade.returnSpeed||1;return true;}
  daysUntilArrival(state){return state.trade.active?0:Math.max(0,state.trade.nextArrivalDay-this.absoluteDay(state));}
  sell(state,key,amount){if(!state.trade.active)return{ok:false,reason:"No corporate ship is docked."};const entry=state.inventory[key];if(!entry||entry.amount<=0)return{ok:false,reason:"No stock available."};const qty=Math.min(entry.amount,Math.max(0,Number(amount)||0));if(qty<=0)return{ok:false,reason:"Nothing selected."};const revenue=qty*this.sellPrice(entry.type,entry.resourceId);entry.amount-=qty;state.company.cash+=revenue;state.company.earn+=revenue;state.contract.localRevenue=(state.contract.localRevenue||0)+revenue;return{ok:true,qty,revenue,entry};}
  sellAll(state){let revenue=0,qty=0;for(const entry of this.stock(state)){const r=this.sell(state,entry.key,entry.amount);if(r.ok){revenue+=r.revenue;qty+=r.qty;}}return{ok:revenue>0,revenue,qty};}
  buy(state,key,amount){if(!state.trade.active)return{ok:false,reason:"No corporate ship is docked."};const item=this.catalog().find(x=>x.key===key);if(!item)return{ok:false,reason:"Unknown resource."};const requested=Math.max(0,Number(amount)||0);if(!requested)return{ok:false,reason:"Nothing selected."};const price=this.buyPrice(item),affordable=Math.floor(Math.max(0,state.company.cash)/price),qty=Math.min(requested,affordable);if(qty<=0)return{ok:false,reason:"Insufficient cash."};const cost=qty*price,entry=this.inventory.ensureEntry(state,item.type,item.resourceId,item.name);entry.amount+=qty;state.company.cash-=cost;state.contract.localCosts=(state.contract.localCosts||0)+cost;return{ok:true,qty,cost,entry};}
}
