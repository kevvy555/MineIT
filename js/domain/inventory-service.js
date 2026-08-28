import { CATEGORY_NAMES } from "../data/resources.js";
import { DEFAULT_QUALITY_BAND } from "./resource-service.js";

export class InventoryService {
  constructor(resourceService){this.resources=resourceService;}
  key(type,resourceId){return `${type}:${resourceId}`;}
  categoryName(type){return CATEGORY_NAMES[type]||type;}
  syncEntry(entry){if(!entry.qualityBands){const legacy=Math.max(0,Number(entry.amount)||0);entry.qualityBands={};if(legacy)entry.qualityBands[DEFAULT_QUALITY_BAND]={amount:legacy};}let total=0;for(const [key,band] of Object.entries(entry.qualityBands)){const info=this.resources.qualityBandByKey(key);band.key=info.key;band.label=info.label;band.className=info.className;band.multiplier=info.multiplier;band.min=info.min;band.max=info.max;band.amount=Math.max(0,Number(band.amount)||0);total+=band.amount;}entry.amount=total;return entry;}
  ensureEntry(state,type,resourceId,name){state.inventory||={};const key=this.key(type,resourceId);if(!state.inventory[key]){const def=this.resources.get(type,resourceId);state.inventory[key]={key,type,resourceId,name:name||def?.name||resourceId,category:this.categoryName(type),amount:0,qualityBands:{}};}const entry=state.inventory[key];entry.key=key;entry.type=type;entry.resourceId=resourceId;entry.name=name||entry.name||this.resources.get(type,resourceId)?.name||resourceId;entry.category=this.categoryName(type);return this.syncEntry(entry);}
  ensureBand(entry,bandKey){const info=this.resources.qualityBandByKey(bandKey);entry.qualityBands||={};entry.qualityBands[info.key]||={amount:0};const band=entry.qualityBands[info.key];Object.assign(band,{key:info.key,label:info.label,className:info.className,multiplier:info.multiplier,min:info.min,max:info.max});band.amount=Math.max(0,Number(band.amount)||0);return band;}
  store(state,type,resourceId,name,amount,quality=null){const qty=Math.max(0,Number(amount)||0);if(!qty)return 0;const entry=this.ensureEntry(state,type,resourceId,name),bandKey=quality===null||quality===undefined?DEFAULT_QUALITY_BAND:this.resources.qualityBandDetails(quality).key;this.ensureBand(entry,bandKey).amount+=qty;this.syncEntry(entry);return qty;}
  storeTile(state,tile,amount){return this.store(state,tile.type,tile.resourceId,tile.name,amount,tile.quality);}
  bands(entry){this.syncEntry(entry);return Object.values(entry.qualityBands).filter(b=>b.amount>.0001).sort((a,b)=>a.min-b.min);}
  amountFor(state,type,resourceId){const entry=state.inventory?.[this.key(type,resourceId)];return entry?this.syncEntry(entry).amount:0;}
  amount(state,type){return Object.values(state.inventory||{}).filter(e=>e.type===type).reduce((s,e)=>s+this.syncEntry(e).amount,0);}
  stock(state){return Object.values(state.inventory||{}).map(e=>this.syncEntry(e)).filter(e=>e.amount>.0001).sort((a,b)=>this.categoryName(a.type).localeCompare(this.categoryName(b.type))||a.name.localeCompare(b.name));}
  consumeCategory(state,type,requested){const original=Math.max(0,Number(requested)||0);let remaining=original,consumed=0;const lots=[];for(const entry of this.stock(state).filter(e=>e.type===type)){for(const band of this.bands(entry))lots.push({entry,band,unitValue:this.resources.sellPrice(entry.type,entry.resourceId,band.key)});}lots.sort((a,b)=>a.unitValue-b.unitValue||a.band.min-b.band.min);for(const lot of lots){if(remaining<=0)break;const take=Math.min(lot.band.amount,remaining);lot.band.amount-=take;remaining-=take;consumed+=take;this.syncEntry(lot.entry);}return{requested:original,consumed,ratio:original>0?Math.min(1,consumed/original):1};}
}
