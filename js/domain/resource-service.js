import { RESOURCE_TYPES, CATEGORY_NAMES, CATEGORY_ORDER } from "../data/resources.js";
import { clamp } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { outputMultiplier } from "./extraction-overdrive.js";

export const QUALITY_VALUE_BANDS=Object.freeze([
  Object.freeze({key:"common",label:"Common",className:"q0",min:1,max:50,multiplier:.75}),
  Object.freeze({key:"good",label:"Good",className:"q1",min:51,max:200,multiplier:.90}),
  Object.freeze({key:"excellent",label:"Excellent",className:"q2",min:201,max:750,multiplier:1.00}),
  Object.freeze({key:"exceptional",label:"Exceptional",className:"q3",min:751,max:2500,multiplier:1.25}),
  Object.freeze({key:"rare",label:"Rare",className:"q4",min:2501,max:7500,multiplier:1.75}),
  Object.freeze({key:"extraordinary",label:"Extraordinary",className:"q5",min:7501,max:10000,multiplier:3.00})
]);
export const DEFAULT_QUALITY_BAND="excellent";
const FINITE_RATE=Object.freeze({small:.75,modest:.90,large:1.05,huge:1.20,colossal:1.35,legacy:1});
const FINITE_COST=Object.freeze({small:1.15,modest:1.05,large:.95,huge:.85,colossal:.75,legacy:1});
const RENEWABLE_RATE=Object.freeze({limited:.65,established:1,large:1.45,vast:2.10});
const RENEWABLE_LABELS=Object.freeze(["Limited","Established","Large","Vast"]);

/** Canonical resource definitions, quality, extraction and renewable rules. */
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
  legacyQualityOutput(q){return 2+2*Math.pow(Math.max(1,Number(q)||1),.42);}
  baseOutput(){return this.baseSiteOutput(1);}
  isRenewable(tile){if(!tile?.resourceId)return false;const def=this.get(tile.type,tile.resourceId);return tile.sustainability==="renewable"||!!def?.renewable;}
  requiredMiningLevel(tile){return this.get(tile.type,tile.resourceId)?.miningLevel||1;}
  unlockName(tile){return this.get(tile.type,tile.resourceId)?.unlock||"Mining technology";}
  normalizeSize(label){const key=String(label||"legacy").toLowerCase().replace(/[^a-z]+/g,"");return key.startsWith("legacy")?"legacy":key;}
  baseSiteOutput(level=1){const l=Math.max(1,Math.round(Number(level)||1));if(l<=CONFIG.SITE_OUTPUT_LEVELS.length)return CONFIG.SITE_OUTPUT_LEVELS[l-1];const last=CONFIG.SITE_OUTPUT_LEVELS.at(-1);return last*Math.pow(1.24,l-CONFIG.SITE_OUTPUT_LEVELS.length);}
  finiteRateFactor(tileOrLabel){const label=typeof tileOrLabel==="string"?tileOrLabel:tileOrLabel?.depositScale;return FINITE_RATE[this.normalizeSize(label)]??1;}
  finiteCostFactor(tileOrLabel){const label=typeof tileOrLabel==="string"?tileOrLabel:tileOrLabel?.depositScale;return FINITE_COST[this.normalizeSize(label)]??1;}
  renewableRank(label){const i=RENEWABLE_LABELS.findIndex(x=>x.toLowerCase()===String(label||"").toLowerCase());return i<0?1:i;}
  renewableLabel(rank){return RENEWABLE_LABELS[clamp(Math.round(Number(rank)||0),0,RENEWABLE_LABELS.length-1)];}
  renewableRateFactor(tileOrLabel){const label=typeof tileOrLabel==="string"?tileOrLabel:tileOrLabel?.abundanceLabel;return RENEWABLE_RATE[this.normalizeSize(label)]??1;}
  terrainYieldFactor(tile){return Math.max(.1,Number(tile?.terrainYieldFactor)||1);}
  ensureRenewable(tile){if(!this.isRenewable(tile))return tile;const rank=this.renewableRank(tile.abundanceLabel||"Established");if(!Number.isFinite(tile.renewableOriginalRank))tile.renewableOriginalRank=rank;if(!Number.isFinite(tile.renewableHealth))tile.renewableHealth=tile.renewableOriginalRank+1;if(!Number.isFinite(tile.harvestIntensity))tile.harvestIntensity=1;tile.harvestIntensity=clamp(tile.harvestIntensity,.25,2);tile.abundanceLabel=this.renewableLabel(Math.min(tile.renewableOriginalRank,Math.max(0,Math.ceil(tile.renewableHealth)-1)));tile.abundance=this.renewableRateFactor(tile);return tile;}
  adjustHarvestIntensity(tile,deltaPercent){
    if(!this.isRenewable(tile)||tile?.renewableWiped)return{ok:false,reason:"Renewable harvesting is unavailable."};
    this.ensureRenewable(tile);
    const before=Math.round(tile.harvestIntensity*100),after=clamp(before+(Number(deltaPercent)||0),25,200);
    tile.harvestIntensity=after/100;
    return{ok:true,before,after,sustainableRate:this.sustainableRate(tile)};
  }
  sustainableRate(tile){this.ensureRenewable(tile);return this.baseSiteOutput(tile.level||1)*this.renewableRateFactor(tile)*this.terrainYieldFactor(tile);}
  sitePotentialRate(tile){if(!tile?.resourceId||tile.resourceCovered)return 0;const base=this.isRenewable(tile)?this.sustainableRate(tile)*clamp(Number(tile.harvestIntensity)||1,.25,2):this.baseSiteOutput(tile.level||1)*this.finiteRateFactor(tile)*this.terrainYieldFactor(tile);return this.isRenewable(tile)?base:base*outputMultiplier(tile);}
  baselineRate(tile){return this.sitePotentialRate(tile);}
  unthrottledCollectionRate(state,tile){const base=this.sitePotentialRate(tile);return tile?.type==="food"?base*(state?.metrics?.foodProductionMultiplier||1):base;}
  collectionRate(state,tile){if(!tile?.resourceId||tile.resourceCovered)return 0;let rate=this.unthrottledCollectionRate(state,tile);if(tile.type==="food"||tile.type==="fuel")rate*=state.metrics.workforceSurvivalFactor??1;else rate*=(state.metrics.workforceCommercialFactor??1)*(state.metrics.industryCommercialFactor??1);return rate;}
  updateRenewable(tile){if(!this.isRenewable(tile)||tile.renewableWiped)return null;this.ensureRenewable(tile);const beforeRank=this.renewableRank(tile.abundanceLabel),beforeLabel=tile.abundanceLabel,intensity=clamp(Number(tile.harvestIntensity)||1,.25,2),maxScore=tile.renewableOriginalRank+1;if(intensity>1)tile.renewableHealth=Math.max(0,tile.renewableHealth-CONFIG.RENEWABLE_OVERHARVEST_RATE*(intensity-1));else if(intensity<1)tile.renewableHealth=Math.min(maxScore,tile.renewableHealth+CONFIG.RENEWABLE_RECOVERY_RATE*(1-intensity));if(tile.renewableHealth<=0){tile.renewableHealth=0;tile.renewableWiped=true;tile.depleted=true;return{kind:"wiped",from:beforeLabel,to:"Wiped Out"};}const afterRank=Math.min(tile.renewableOriginalRank,Math.max(0,Math.ceil(tile.renewableHealth)-1)),afterLabel=this.renewableLabel(afterRank);tile.abundanceLabel=afterLabel;tile.abundance=this.renewableRateFactor(afterLabel);if(afterRank<beforeRank)return{kind:"downgrade",from:beforeLabel,to:afterLabel};if(afterRank>beforeRank)return{kind:"recovery",from:beforeLabel,to:afterLabel};return null;}
  renewableCondition(tile){if(!this.isRenewable(tile))return null;this.ensureRenewable(tile);if(tile.renewableWiped)return{label:"Wiped Out",score:0,stageProgress:0};const rank=this.renewableRank(tile.abundanceLabel),floor=rank,stageProgress=clamp(tile.renewableHealth-floor,0,1);return{label:tile.abundanceLabel,score:tile.renewableHealth,stageProgress};}
  estimatedLifeYears(state,tile){if(this.isRenewable(tile))return Infinity;const rate=this.collectionRate(state,tile);return rate>0?Math.max(0,tile.reserve||0)/rate/360:Infinity;}
  baseSellPrice(type,resourceId){const base=this.get(type,resourceId)?.sellPrice ?? ({food:.08,build:.12,fuel:.20,ore:.40}[type]||.10);return base*CONFIG.RESOURCE_VALUE_SCALE;}
  sellPrice(type,resourceId,qualityBandKey=null){const base=this.baseSellPrice(type,resourceId);return qualityBandKey?base*this.qualityBandByKey(qualityBandKey).multiplier:base;}
}
