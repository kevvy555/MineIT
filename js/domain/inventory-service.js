import { CATEGORY_NAMES } from "../data/resources.js?v=4.0.1";

export class InventoryService {
  constructor(resourceService){ this.resources=resourceService; }
  key(type,resourceId){ return `${type}:${resourceId}`; }
  categoryName(type){ return CATEGORY_NAMES[type]||type; }
  ensureEntry(state,type,resourceId,name){
    state.inventory ||= {};
    const key=this.key(type,resourceId);
    if(!state.inventory[key]){
      const def=this.resources.get(type,resourceId);
      state.inventory[key]={key,type,resourceId,name:name||def?.name||resourceId,category:this.categoryName(type),amount:0};
    }
    return state.inventory[key];
  }
  store(state,type,resourceId,name,amount){
    const qty=Math.max(0,Number(amount)||0);if(!qty)return 0;
    this.ensureEntry(state,type,resourceId,name).amount+=qty;return qty;
  }
  storeTile(state,tile,amount){return this.store(state,tile.type,tile.resourceId,tile.name,amount);}
  amountFor(state,type,resourceId){return Math.max(0,state.inventory?.[this.key(type,resourceId)]?.amount||0);}
  amount(state,type){return Object.values(state.inventory||{}).filter(e=>e.type===type).reduce((s,e)=>s+Math.max(0,e.amount||0),0);}
  stock(state){return Object.values(state.inventory||{}).filter(e=>e.amount>.0001).sort((a,b)=>this.categoryName(a.type).localeCompare(this.categoryName(b.type))||a.name.localeCompare(b.name));}
  consumeCategory(state,type,requested){
    let remaining=Math.max(0,Number(requested)||0),consumed=0;
    const entries=this.stock(state).filter(e=>e.type===type).sort((a,b)=>this.resources.sellPrice(a.type,a.resourceId)-this.resources.sellPrice(b.type,b.resourceId));
    for(const entry of entries){if(remaining<=0)break;const take=Math.min(entry.amount,remaining);entry.amount-=take;remaining-=take;consumed+=take;}
    return {requested:Math.max(0,Number(requested)||0),consumed,ratio:requested>0?Math.min(1,consumed/requested):1};
  }
}
