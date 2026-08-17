import { CONFIG } from "../core/config.js";
import { RESOURCE_TYPES } from "../data/resources.js";

export class TradeService {
  constructor(resourceService){ this.resources=resourceService; }
  key(type,resourceId){ return `${type}:${resourceId}`; }
  absoluteDay(state){ return (Math.max(1,state.year)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,state.day); }
  category(type){ if(type==="food") return "Food"; if(type==="industry") return "Industrial Ore"; return "Valuable"; }
  catalog(){
    const rows=[];
    for(const [type,list] of Object.entries(RESOURCE_TYPES)){
      for(const def of list) rows.push({key:this.key(type,def.id),type,resourceId:def.id,name:def.name,category:this.category(type),rarity:def.rarity});
    }
    return rows.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  }
  ensureEntry(state,type,resourceId,name){
    const key=this.key(type,resourceId);
    if(!state.inventory[key]){
      const def=this.resources.get(type,resourceId);
      state.inventory[key]={key,type,resourceId,name:name||def?.name||resourceId,category:this.category(type),amount:0};
    }
    return state.inventory[key];
  }
  store(state,tile,amount){
    if(!(amount>0)) return 0;
    const entry=this.ensureEntry(state,tile.type,tile.resourceId,tile.name);
    entry.amount+=amount;
    return amount;
  }
  stock(state){
    return Object.values(state.inventory).filter(entry=>entry.amount>.0001).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  }
  sellPrice(type){ if(type==="valuable") return 2.5; if(type==="industry") return .30; return .08; }
  buyPrice(type){ return this.sellPrice(type)*CONFIG.CORPORATE_BUY_MARKUP; }
  stockValue(state){ return this.stock(state).reduce((sum,entry)=>sum+entry.amount*this.sellPrice(entry.type),0); }
  shouldArrive(state){ return state.status==="playing"&&!state.trade.active&&this.absoluteDay(state)>=state.trade.nextArrivalDay; }
  arrive(state){
    if(state.trade.active) return false;
    state.trade.active=true;
    state.trade.returnSpeed=state.speed>0?state.speed:1;
    state.trade.arrivedAt=this.absoluteDay(state);
    state.trade.visits++;
    state.trade.nextArrivalDay+=CONFIG.TRADE_INTERVAL_DAYS;
    state.speed=0;
    return true;
  }
  depart(state){
    if(!state.trade.active) return false;
    state.trade.active=false;state.trade.arrivedAt=null;
    if(state.status==="playing") state.speed=state.trade.returnSpeed||1;
    return true;
  }
  daysUntilArrival(state){ if(state.trade.active) return 0; return Math.max(0,state.trade.nextArrivalDay-this.absoluteDay(state)); }
  sell(state,key,amount){
    if(!state.trade.active) return {ok:false,reason:"No corporate ship is docked."};
    const entry=state.inventory[key];
    if(!entry||entry.amount<=0) return {ok:false,reason:"No stock available."};
    const qty=Math.min(entry.amount,Math.max(0,Number(amount)||0));
    if(qty<=0) return {ok:false,reason:"Nothing selected."};
    const revenue=qty*this.sellPrice(entry.type);
    entry.amount-=qty;state.company.cash+=revenue;state.company.earn+=revenue;
    return {ok:true,qty,revenue,entry};
  }
  sellAll(state){
    let revenue=0,qty=0;
    for(const entry of this.stock(state)){
      const result=this.sell(state,entry.key,entry.amount);
      if(result.ok){revenue+=result.revenue;qty+=result.qty;}
    }
    return {ok:revenue>0,revenue,qty};
  }
  buy(state,key,amount){
    if(!state.trade.active) return {ok:false,reason:"No corporate ship is docked."};
    const item=this.catalog().find(row=>row.key===key);
    if(!item) return {ok:false,reason:"Unknown resource."};
    const requested=Math.max(0,Number(amount)||0);
    if(requested<=0) return {ok:false,reason:"Nothing selected."};
    const price=this.buyPrice(item.type),affordable=Math.floor(state.company.cash/price),qty=Math.min(requested,affordable);
    if(qty<=0) return {ok:false,reason:"Insufficient cash."};
    const cost=qty*price,entry=this.ensureEntry(state,item.type,item.resourceId,item.name);
    entry.amount+=qty;state.company.cash-=cost;
    return {ok:true,qty,cost,entry};
  }
}
