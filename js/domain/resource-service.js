import { RESOURCE_TYPES, CATEGORY_NAMES, CATEGORY_ORDER } from "../data/resources.js?v=4.0.1";
import { clamp } from "../core/utils.js?v=4.0.1";

export class ResourceService {
  pick(list,random){const eligible=list.filter(x=>(x.weight||0)>0);const total=eligible.reduce((s,i)=>s+i.weight,0);let roll=random()*total;for(const item of eligible){roll-=item.weight;if(roll<=0)return item;}return eligible[eligible.length-1];}
  get(type,id){return RESOURCE_TYPES[type]?.find(x=>x.id===id)||null;}
  catalog(){return CATEGORY_ORDER.flatMap(type=>(RESOURCE_TYPES[type]||[]).map(def=>({...def,type,category:CATEGORY_NAMES[type]})));}
  categoryName(type){return CATEGORY_NAMES[type]||type;}
  quality(random,bias=1,contractRare=1){const raw=random(),z=1-Math.pow(1-raw,clamp(bias*Math.sqrt(contractRare),.55,2.4));let q;if(z<.60)q=1+Math.floor(random()*100);else if(z<.85)q=101+Math.floor(random()*400);else if(z<.95)q=501+Math.floor(random()*1500);else if(z<.99)q=2001+Math.floor(random()*3000);else if(z<.999)q=5001+Math.floor(random()*4000);else q=9001+Math.floor(random()*1000);return clamp(q,1,10000);}
  qualityBand(q){if(q<=50)return["Common","q0"];if(q<=200)return["Good","q1"];if(q<=750)return["Excellent","q2"];if(q<=2500)return["Exceptional","q3"];if(q<=7500)return["Rare","q4"];return["Extraordinary","q5"];}
  baseOutput(q){return 8+7*Math.pow(q,.52);}
  isRenewable(tile){const def=this.get(tile.type,tile.resourceId);return tile.sustainability==="renewable"||!!def?.renewable;}
  requiredMiningLevel(tile){return this.get(tile.type,tile.resourceId)?.miningLevel||1;}
  unlockName(tile){return this.get(tile.type,tile.resourceId)?.unlock||"Mining technology";}
  baselineRate(tile){return this.baseOutput(tile.quality)*(tile.resourceMult||1)*(tile.abundance||1);}
  collectionRate(state,tile){const level=1+Math.max(0,tile.level-1)*.22;let mult=1;if(tile.type==="food")mult=state.metrics.foodMult||1;else mult=state.metrics.miningMult||1;return this.baselineRate(tile)*level*mult;}
  estimatedLifeYears(state,tile){if(this.isRenewable(tile))return Infinity;const rate=this.collectionRate(state,tile);return rate>0?Math.max(0,tile.reserve||0)/rate/360:Infinity;}
  sellPrice(type,resourceId){return this.get(type,resourceId)?.sellPrice ?? ({food:.08,build:.12,fuel:.20,ore:.40}[type]||.10);}
}
