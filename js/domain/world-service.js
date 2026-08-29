import { RESOURCE_TYPES } from "../data/resources.js";
import { clamp, hashString, seededRandom, tileKey } from "../core/utils.js";

const SURFACE_CHANCE={plain:.44,hill:.60,mountain:.72,lake:.52};
const TERRAIN_WEIGHTS={
  plain:{food:1.75,build:.85,fuel:.70,ore:.38},
  hill:{food:.58,build:1.75,fuel:.72,ore:1.05},
  mountain:{food:.12,build:.86,fuel:.82,ore:2.35},
  lake:{food:2.25,build:.42,fuel:.62,ore:.10}
};
const SURFACE_IDS={
  plain:{food:["fungal","flora","herd","nutrient","protein"],build:["fiber","stone","clay","silica","limestone"],fuel:["biomass","peat"],ore:["surface-iron"]},
  hill:{food:["fungal","flora","herd","protein"],build:["fiber","stone","clay","silica","limestone","structural","ceramic"],fuel:["biomass","peat","coal"],ore:["surface-iron","iron","copper","reactive","conductive","silver"]},
  mountain:{food:["fungal"],build:["stone","silica","limestone","structural","ceramic"],fuel:["coal","fissile"],ore:["surface-iron","iron","copper","reactive","conductive","silver","gold","gems","platinum","palladium","sapphire","ruby","emerald","magnetic"]},
  lake:{food:["flora","protein","thermal"],build:["clay","silica"],fuel:["biomass","peat"],ore:["surface-iron"]}
};
const DEEP_POOL=[
  ["fuel","oil",18],["fuel","gas",18],["fuel","brine",8],["fuel","exotic-fuel",2],
  ["ore","iron",14],["ore","copper",11],["ore","reactive",9],["ore","conductive",7],["ore","gold",5],["ore","magnetic",6],["ore","diamond",4],["ore","exotic",2],["ore","crystal",1],["ore","advanced",.5]
];

export class WorldService {
  constructor(resourceService,contractService,landService=null){this.resources=resourceService;this.contracts=contractService;this.land=landService;}
  seed(state,x,y,suffix="surface"){return hashString(`${state.seed}|${state.contract.uid}|${x}|${y}|${suffix}`);}
  legacySeed(state,x,y){return hashString(`${state.seed}|${state.contract.uid}|${x}|${y}`);}
  scanningLevel(state){return Math.max(1,Number(state.colony?.tech?.scanning)||Number(state.metrics?.scanningTech)||Number(state.company?.tech?.scanning)||1);}
  scanningRequirement(def){return Math.max(1,Number(def?.scanningLevel)||Number(def?.miningLevel)||1);}
  get(state,x,y){const key=tileKey(x,y);return state.tiles[key]||=({x,y,terrain:"plain",terrainVariant:1,revealed:false,lastScannedAtLevel:0,developed:false,level:0,depleted:false,development:null});}
  legacyFamilyWeights(state){const a=this.contracts.archetype(state.contract);return{...a.weights,a};}
  legacyFamilyFor(state,random){const{food,build,fuel,ore}=this.legacyFamilyWeights(state),total=food+build+fuel+ore,roll=random()*total;if(roll<food)return"food";if(roll<food+build)return"build";if(roll<food+build+fuel)return"fuel";return"ore";}
  familyWeights(state,tile){const a=this.contracts.archetype(state.contract),terrain=TERRAIN_WEIGHTS[tile.terrain]||TERRAIN_WEIGHTS.plain;return{food:(a.weights.food||0)*terrain.food,build:(a.weights.build||0)*terrain.build,fuel:(a.weights.fuel||0)*terrain.fuel,ore:(a.weights.ore||0)*terrain.ore,a};}
  familyFor(state,tile,random){const w=this.familyWeights(state,tile),entries=[["food",w.food],["build",w.build],["fuel",w.fuel],["ore",w.ore]].filter(([,v])=>v>0),total=entries.reduce((s,[,v])=>s+v,0);let roll=random()*total;for(const[type,value]of entries){roll-=value;if(roll<=0)return type;}return entries.at(-1)?.[0]||"build";}
  defsFor(tile,type){const ids=SURFACE_IDS[tile.terrain]?.[type]||[];return(RESOURCE_TYPES[type]||[]).filter(def=>ids.includes(def.id)&&(def.weight||0)>0&&!def.manufactured);}
  pickSurface(state,tile,random){const families=[];for(const type of["food","build","fuel","ore"]){const defs=this.defsFor(tile,type);if(!defs.length)continue;const weights=this.familyWeights(state,tile);families.push({type,weight:weights[type],defs});}const total=families.reduce((s,f)=>s+Math.max(0,f.weight),0);if(total<=0)return null;let roll=random()*total,family=families.at(-1);for(const f of families){roll-=Math.max(0,f.weight);if(roll<=0){family=f;break;}}return{type:family.type,def:this.resources.pick(family.defs,random)};}
  renewableAbundance(random){const roll=random();if(roll<.52)return{label:"Limited",factor:.65};if(roll<.82)return{label:"Established",factor:1};if(roll<.96)return{label:"Large",factor:1.45};return{label:"Vast",factor:2.10};}
  finiteDeposit(random,reserveBias=1,type="ore"){const roll=random();let label,years;if(roll<.16){label="Small";years=1.5+random()*5.5;}else if(roll<.52){label="Modest";years=7+random()*20;}else if(roll<.80){label="Large";years=27+random()*55;}else if(roll<.95){label="Huge";years=82+random()*120;}else{label="Colossal";years=202+random()*350;}years*=reserveBias*(type==="ore"?.92:1);return{label,years:Math.max(.5,years)};}
  truthFromDefinition(state,tile,type,def,random,rareMultiplier=1){
    const a=this.contracts.archetype(state.contract),quality=clamp(Math.round(this.resources.quality(random,def.qualityBias,a.rare*rareMultiplier)),1,10000),requiredScanningLevel=this.scanningRequirement(def),terrainYieldFactor=this.land?.terrainYieldFactor({...tile,type,resourceId:def.id})||1,shared={type,family:type,resourceId:def.id,name:def.name,resourceRarity:def.rarity,resourceMult:def.multiplier,quality,requiredScanningLevel,requiredMiningLevel:def.miningLevel,requiredMiningTech:def.unlock,terrainYieldFactor};
    if(def.renewable){const abundance=this.renewableAbundance(random),rank=this.resources.renewableRank(abundance.label);return{...shared,sustainability:"renewable",abundance:abundance.factor,abundanceLabel:abundance.label,renewableOriginalRank:rank,renewableHealth:rank+1,renewableWiped:false,harvestIntensity:1,reserve:null,initialReserve:null,depleted:false};}
    const deposit=this.finiteDeposit(random,a.res,type),baseline=this.resources.baseSiteOutput(1)*this.resources.finiteRateFactor(deposit.label)*terrainYieldFactor,reserve=Math.max(1,Math.round(baseline*360*deposit.years));return{...shared,sustainability:"finite",abundance:1,depositScale:deposit.label,reserve,initialReserve:reserve,renewableOriginalRank:null,renewableHealth:null,renewableWiped:false,harvestIntensity:null,depleted:false};
  }
  pickDeep(state,x,y,tile=this.get(state,x,y)){
    const random=seededRandom(this.seed(state,x,y,"deep"));if(random()>.12)return null;const weighted=DEEP_POOL.map(([type,id,weight])=>({type,id,weight,def:this.resources.get(type,id)})).filter(x=>x.def),total=weighted.reduce((s,x)=>s+x.weight,0);let roll=random()*total,pick=weighted.at(-1);for(const item of weighted){roll-=item.weight;if(roll<=0){pick=item;break;}}return this.truthFromDefinition(state,tile,pick.type,pick.def,random,1.08);
  }
  surfaceTruth(state,x,y,tile=this.get(state,x,y)){
    const random=seededRandom(this.seed(state,x,y));if(random()>(SURFACE_CHANCE[tile.terrain]??.5))return null;const picked=this.pickSurface(state,tile,random);return picked?this.truthFromDefinition(state,tile,picked.type,picked.def,random):null;
  }
  legacyTruth(state,x,y,tile=this.get(state,x,y)){
    const random=seededRandom(this.legacySeed(state,x,y)),type=this.legacyFamilyFor(state,random),def=this.resources.pick(RESOURCE_TYPES[type],random);return def?this.truthFromDefinition(state,tile,type,def,random):null;
  }
  resourceTruth(state,x,y,tile=this.get(state,x,y)){if(!this.land)return this.legacyTruth(state,x,y,tile);return this.surfaceTruth(state,x,y,tile)||this.pickDeep(state,x,y,tile);}
  clearResult(tile,scanLevel=1){Object.assign(tile,{revealed:true,lastScannedAtLevel:Math.max(1,Number(scanLevel)||1),unresolved:false,unresolvedScanningLevel:0,requiredScanningLevel:0,empty:true,type:null,family:null,resourceId:null,name:"Clear Land",quality:null,resourceRarity:null,resourceMult:null,requiredMiningLevel:0,requiredMiningTech:null,sustainability:null,reserve:null,initialReserve:null,renewableOriginalRank:null,renewableHealth:null,renewableWiped:false,harvestIntensity:null,depleted:false,resourceCovered:false});return tile;}
  applyTruth(tile,truth,scanLevel){Object.assign(tile,truth,{revealed:true,lastScannedAtLevel:Math.max(1,Number(scanLevel)||1),unresolved:false,unresolvedScanningLevel:0,empty:false,resourceCovered:!!tile.development});return tile;}
  revealLegacy(state,x,y,tile=this.get(state,x,y),scanLevel=this.scanningLevel(state)){if(tile.revealed&&tile.resourceId){tile.lastScannedAtLevel=Math.max(Number(tile.lastScannedAtLevel)||0,scanLevel);tile.unresolved=false;tile.unresolvedScanningLevel=0;return tile;}const truth=this.legacyTruth(state,x,y,tile);return !truth||scanLevel<truth.requiredScanningLevel?this.clearResult(tile,scanLevel):this.applyTruth(tile,truth,scanLevel);}
  reveal(state,x,y,scanLevel=this.scanningLevel(state)){
    const tile=this.get(state,x,y),level=Math.max(1,Number(scanLevel)||1);if(tile.revealed&&Number(tile.lastScannedAtLevel)>=level)return tile;if(tile.revealed&&tile.resourceId){tile.lastScannedAtLevel=level;tile.unresolved=false;tile.unresolvedScanningLevel=0;tile.resourceCovered=!!tile.development||!!tile.resourceCovered;return tile;}if(!this.land)return this.revealLegacy(state,x,y,tile,level);const truth=this.resourceTruth(state,x,y,tile);return !truth||level<truth.requiredScanningLevel?this.clearResult(tile,level):this.applyTruth(tile,truth,level);
  }
  hint(state,x,y){
    const tile=this.get(state,x,y),current=this.scanningLevel(state),last=Math.max(0,Number(tile.lastScannedAtLevel)||0);if(tile.revealed&&last<current)return`Resurvey available • previous scan L${last||1}`;if(tile.revealed)return tile.resourceId?`${tile.name} • surveyed L${last||current}`:`No deposit detected • surveyed L${last||current}`;
    const level=state.metrics.hint||0;if(!this.land){if(level<=0)return"Unknown";const random=seededRandom(this.legacySeed(state,x,y)),type=this.legacyFamilyFor(state,random),label=this.resources.categoryName(type);if(level===1)return`Possible ${label.toLowerCase()} signal`;if(level===2)return`${label} • ${["Low","Moderate","Good","High","Rare"][Math.floor(random()*5)]} signal`;return`${label} • quality band detected`;}
    if(level<=0)return`${tile.terrain?.toUpperCase?.()||"LAND"} • unsurveyed`;const random=seededRandom(this.seed(state,x,y)),chance=SURFACE_CHANCE[tile.terrain]??.5;if(random()>chance)return level>=2?"Low surface signal":"Weak surface signal";const type=this.familyFor(state,tile,random),label=this.resources.categoryName(type);if(level===1)return`Possible ${label.toLowerCase()} signal`;if(level===2)return`${label} • ${["Low","Moderate","Good","High","Rare"][Math.floor(random()*5)]} signal`;return`${label} • quality band detected`;
  }
}
