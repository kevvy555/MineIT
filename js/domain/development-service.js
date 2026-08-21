import { CONFIG } from "../core/config.js?v=5.5.1";

const MAX_LEVEL=5,HOUSING_PER_LEVEL=160,RECOVERY=.25;
const LABELS={housing:"Housing",industry:"Industry",extract:"Extraction"};
export class DevelopmentService{
  constructor(inventoryService,landService){this.inventory=inventoryService;this.land=landService;}
  label(kind){return LABELS[kind]||kind;}
  developments(state,kind=null){return Object.values(state.tiles||{}).filter(t=>t.development&&(!kind||t.development.kind===kind));}
  levels(state,kind){return this.developments(state,kind).reduce((sum,t)=>sum+Math.max(0,Number(t.development.level)||0),0);}
  sync(state){
    const land=this.land.ensure(state),housing=this.levels(state,"housing"),industry=this.levels(state,"industry");
    state.colony.housingLevel=Math.max(1,(land.baseHousingLevel||1)+housing);
    state.colony.housingCapacity=Math.max(CONFIG.START_HOUSING,(land.baseHousingCapacity||CONFIG.START_HOUSING)+housing*HOUSING_PER_LEVEL);
    state.colony.industryLevel=Math.max(1,(land.baseIndustryLevel||1)+industry);
    return{housingLevels:housing,industryLevels:industry};
  }
  cost(state,tile,kind,nextLevel=1){
    const terrain=this.land.terrainCostMultiplier(tile.terrain,kind);if(!Number.isFinite(terrain))return{build:Infinity,cash:Infinity};
    const level=Math.max(1,Math.min(MAX_LEVEL,Number(nextLevel)||1)),baseBuild=kind==="housing"?55:80,baseCash=kind==="housing"?1400:2200,growthBuild=kind==="housing"?1.62:1.72,growthCash=kind==="housing"?1.48:1.56;
    return{build:Math.round(baseBuild*Math.pow(growthBuild,level-1)*terrain),cash:Math.round(baseCash*Math.pow(growthCash,level-1)*terrain)};
  }
  checkResources(state,cost){if(this.inventory.amount(state,"build")<cost.build)return`Need ${cost.build} Build materials.`;if(state.company.cash<cost.cash)return"Insufficient cash.";return null;}
  nextAggregateLevel(state,kind,delta=1){this.sync(state);return kind==="housing"?state.colony.housingLevel+delta:state.colony.industryLevel+delta;}
  canPlace(state,tile,kind){
    if(!["housing","industry"].includes(kind))return{ok:false,reason:"Unknown development type."};if(state.status==="dead")return{ok:false,reason:"This colony has been lost."};if(state.contract?.ended)return{ok:false,reason:"The mining contract has ended."};if(!tile?.revealed)return{ok:false,reason:"Survey this tile before construction."};if(this.land.isShipTile(tile.x,tile.y))return{ok:false,reason:"The landing ship occupies this tile."};if(tile.development||tile.developed)return{ok:false,reason:"Demolish the existing development first."};if(tile.terrain==="lake")return{ok:false,reason:"Standard Housing and Industry cannot be built on lakes."};
    const cost=this.cost(state,tile,kind,1),resourceReason=this.checkResources(state,cost);if(resourceReason)return{ok:false,reason:resourceReason,...cost};
    if(kind==="housing"){const nextCapacity=state.colony.housingCapacity+HOUSING_PER_LEVEL;if(nextCapacity>(state.metrics.powerPopulationCap||nextCapacity))return{ok:false,reason:`Power Tech L${state.metrics.powerTech||1} supports up to ${state.metrics.powerPopulationCap} population.`,...cost};}
    else{const next=this.nextAggregateLevel(state,"industry",1);if(next>(state.metrics.powerIndustryCap||next))return{ok:false,reason:`Power Tech L${state.metrics.powerTech||1} supports Industry L${state.metrics.powerIndustryCap}.`,...cost};}
    return{ok:true,...cost,coversResource:!!tile.resourceId};
  }
  place(state,tile,kind){const check=this.canPlace(state,tile,kind);if(!check.ok)return check;this.inventory.consumeCategory(state,"build",check.build);state.company.cash-=check.cash;state.contract.localCosts=(state.contract.localCosts||0)+check.cash;tile.development={kind,level:1,investedBuild:check.build};let destroyedFood=false;if(tile.resourceId){if(tile.type==="food"){destroyedFood=true;tile.destroyedResource={type:tile.type,resourceId:tile.resourceId,name:tile.name,quality:tile.quality};Object.assign(tile,{type:null,family:null,resourceId:null,name:"Developed Land",quality:null,resourceRarity:null,resourceMult:null,requiredMiningLevel:0,requiredMiningTech:null,sustainability:null,reserve:null,initialReserve:null,empty:true,resourceCovered:false});}else tile.resourceCovered=true;}this.sync(state);return{ok:true,...check,level:1,destroyedFood};}
  canUpgrade(state,tile){
    const dev=tile?.development;if(!dev||!["housing","industry"].includes(dev.kind))return{ok:false,reason:"This development is not upgraded through colony construction."};const level=Math.max(1,Number(dev.level)||1);if(level>=MAX_LEVEL)return{ok:false,reason:`${this.label(dev.kind)} is already at L${MAX_LEVEL}.`,max:true};const nextLevel=level+1,cost=this.cost(state,tile,dev.kind,nextLevel),resourceReason=this.checkResources(state,cost);if(resourceReason)return{ok:false,reason:resourceReason,...cost,nextLevel};
    if(dev.kind==="housing"){const nextCapacity=state.colony.housingCapacity+HOUSING_PER_LEVEL;if(nextCapacity>(state.metrics.powerPopulationCap||nextCapacity))return{ok:false,reason:`Power Tech L${state.metrics.powerTech||1} supports up to ${state.metrics.powerPopulationCap} population.`,...cost,nextLevel};}
    else{const next=this.nextAggregateLevel(state,"industry",1);if(next>(state.metrics.powerIndustryCap||next))return{ok:false,reason:`Power Tech L${state.metrics.powerTech||1} supports Industry L${state.metrics.powerIndustryCap}.`,...cost,nextLevel};}
    return{ok:true,...cost,nextLevel};
  }
  upgrade(state,tile){const check=this.canUpgrade(state,tile);if(!check.ok)return check;this.inventory.consumeCategory(state,"build",check.build);state.company.cash-=check.cash;state.contract.localCosts=(state.contract.localCosts||0)+check.cash;tile.development.level=check.nextLevel;tile.development.investedBuild=(tile.development.investedBuild||0)+check.build;this.sync(state);return{ok:true,...check};}
  demolish(state,tile){
    const dev=tile?.development;if(!dev)return{ok:false,reason:"Nothing has been constructed on this tile."};const recover=Math.floor(Math.max(0,Number(dev.investedBuild)||0)*RECOVERY);if(recover)this.inventory.store(state,"build","fiber","Construction Fibre",recover);if(dev.kind==="extract"){tile.developed=false;tile.level=0;}tile.development=null;tile.resourceCovered=false;this.sync(state);return{ok:true,recover};
  }
}
