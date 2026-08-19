import { RESOURCE_TYPES, CATEGORY_NAMES, CATEGORY_ORDER } from "../data/resources.js?v=4.0.1";
import { clamp } from "../core/utils.js?v=4.0.1";

export const QUALITY_VALUE_BANDS=Object.freeze([
  Object.freeze({key:"common",label:"Common",className:"q0",min:1,max:50,multiplier:.75}),
  Object.freeze({key:"good",label:"Good",className:"q1",min:51,max:200,multiplier:.90}),
  Object.freeze({key:"excellent",label:"Excellent",className:"q2",min:201,max:750,multiplier:1.00}),
  Object.freeze({key:"exceptional",label:"Exceptional",className:"q3",min:751,max:2500,multiplier:1.25}),
  Object.freeze({key:"rare",label:"Rare",className:"q4",min:2501,max:7500,multiplier:1.75}),
  Object.freeze({key:"extraordinary",label:"Extraordinary",className:"q5",min:7501,max:10000,multiplier:3.00})
]);
export const DEFAULT_QUALITY_BAND="excellent";

export class ResourceService {
  pick(list,random){const eligible=list.filter(x=>(x.weight||0)>0);const total=eligible.reduce((s,i)=>s+i.weight,0);let roll=random()*total;for(const item of eligible){roll-=item.weight;if(roll<=0)return item;}return eligible[eligible.length-1];}
  get(type,id){return RESOURCE_TYPES[type]?.find(x=>x.id===id)||null;}
  catalog(){return CATEGORY_ORDER.flatMap(type=>(RESOURCE_TYPES[type]||[]).map(def=>({...def,type,category:CATEGORY_NAMES[type]})));}
  categoryName(type){return CATEGORY_NAMES[type]||type;}
  qualityBands(){return QUALITY_VALUE_BANDS.map(b=>({...b}));}
  quality(random,bias=1,contractRare=1){const raw=random(),z=1-Math.pow(1-raw,clamp(bias*Math.sqrt(contractRare),.55,2.4));let q;if(z<.60)q=1+Math.floor(random()*100);else if(z<.85)q=101+Math.floor(random()*400);else if(z<.95)q=501+Math.floor(random()*1500);else if(z<.99)q=2001+Math.floor(random()*3000);else if(z<.999)q=5001+Math.floor(random()*4000);else q=9001+Math.floor(random()*1000);return clamp(q,1,10000);}
  qualityBandDetails(q){const n=clamp(Math.round(Number(q)||QUALITY_VALUE_BANDS[2].min),1,10000);return QUALITY_VALUE_BANDS.find(b=>n<=b.max)||QUALITY_VALUE_BANDS[QUALITY_VALUE_BANDS.length-1];}
  qualityBandByKey(key){return QUALITY_VALUE_BANDS.find(b=>b.key===key)||QUALITY_VALUE_BANDS.find(b=>b.key===DEFAULT_QUALITY_BAND);}
  qualityBand(q){const b=this.qualityBandDetails(q);return[b.label,b.className];}
  qualityMultiplier(qOrKey){return typeof qOrKey==="string"?this.qualityBandByKey(qOrKey).multiplier:this.qualityBandDetails(qOrKey).multiplier;}
  baseOutput(q){return 8+7*Math.pow(q,.52);}
  isRenewable(tile){const def=this.get(tile.type,tile.resourceId);return tile.sustainability==="renewable"||!!def?.renewable;}
  requiredMiningLevel(tile){return this.get(tile.type,tile.resourceId)?.miningLevel||1;}
  unlockName(tile){return this.get(tile.type,tile.resourceId)?.unlock||"Mining technology";}
  baselineRate(tile){return this.baseOutput(tile.quality)*(tile.resourceMult||1)*(tile.abundance||1);}
  collectionRate(state,tile){const level=1+Math.max(0,tile.level-1)*.22;let mult=1;if(tile.type==="food")mult=state.metrics.foodMult||1;else mult=state.metrics.miningMult||1;return this.baselineRate(tile)*level*mult;}
  estimatedLifeYears(state,tile){if(this.isRenewable(tile))return Infinity;const rate=this.collectionRate(state,tile);return rate>0?Math.max(0,tile.reserve||0)/rate/360:Infinity;}
  baseSellPrice(type,resourceId){return this.get(type,resourceId)?.sellPrice ?? ({food:.08,build:.12,fuel:.20,ore:.40}[type]||.10);}
  sellPrice(type,resourceId,qualityBandKey=null){const base=this.baseSellPrice(type,resourceId);return qualityBandKey?base*this.qualityBandByKey(qualityBandKey).multiplier:base;}
}
