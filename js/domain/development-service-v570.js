import { BUILDING_MODEL,MAX_BUILDING_LEVEL,buildingCapacity,buildingCost,buildingTechCategory,localBuildings,syncBuildingTotals } from "./building-model.js?v=5.7.0";

const RECOVERY=.25;
export class DevelopmentService{
  constructor(inventoryService,landService){this.inventory=inventoryService;this.land=landService;}
  label(kind){return BUILDING_MODEL[kind]?.label||kind;}
  developments(state,kind=null){return localBuildings(state,kind).concat(kind&&BUILDING_MODEL[kind]?[]:Object.values(state.tiles||{}).filter(t=>t.development?.kind==="extract"&&(!kind||kind==="extract")));}
  levels(state,kind){return localBuildings(state,kind).reduce((sum,t)=>sum+Math.max(0,Number(t.development?.level)||0),0);}
  sync(state){return syncBuildingTotals(state);}
  terrainMultiplier(tile,kind){
    if(tile?.terrain==="lake")return Infinity;
    if(kind==="power")return tile?.terrain==="mountain"?1.15:tile?.terrain==="hill"?.95:1;
    return this.land.terrainCostMultiplier(tile?.terrain,kind);
  }
  cost(state,tile,kind,nextLevel=1){const terrain=this.terrainMultiplier(tile,kind);if(!Number.isFinite(terrain))return{build:Infinity,ore:Infinity,cash:0};return buildingCost(kind,nextLevel,terrain);}
  techLevel(state,kind){const category=buildingTechCategory(kind);return Math.max(1,Number(state.company?.tech?.[category])||1);}
  checkResources(state,cost){if(this.inventory.amount(state,"build")<cost.build)return`Need ${cost.build} Build materials.`;if((cost.ore||0)>0&&this.inventory.amount(state,"ore")<cost.ore)return`Need ${cost.ore} Ore.`;return null;}
  contribution(kind,level){return buildingCapacity(kind,level);}
  canPlace(state,tile,kind){
    if(!BUILDING_MODEL[kind])return{ok:false,reason:"Unknown development type."};
    if(state.status==="dead")return{ok:false,reason:"This colony has been lost."};
    if(state.contract?.ended)return{ok:false,reason:"The mining contract has ended."};
    if(!tile?.revealed)return{ok:false,reason:"Survey this tile before construction."};
    if(this.land.isShipTile(tile.x,tile.y))return{ok:false,reason:"The landing ship occupies this tile."};
    if(tile.development||tile.developed)return{ok:false,reason:"Demolish the existing development first."};
    if(tile.terrain==="lake")return{ok:false,reason:`Standard ${this.label(kind)} cannot be built on lakes.`};
    const cost=this.cost(state,tile,kind,1),resourceReason=this.checkResources(state,cost);if(resourceReason)return{ok:false,reason:resourceReason,...cost,nextLevel:1};
    if(this.techLevel(state,kind)<1)return{ok:false,reason:`Requires ${this.label(kind)} technology L1.`,...cost,nextLevel:1};
    return{ok:true,...cost,nextLevel:1,capacity:buildingCapacity(kind,1),coversResource:!!tile.resourceId};
  }
  place(state,tile,kind){
    const check=this.canPlace(state,tile,kind);if(!check.ok)return check;
    this.inventory.consumeCategory(state,"build",check.build);if(check.ore)this.inventory.consumeCategory(state,"ore",check.ore);
    tile.development={kind,level:1,investedBuild:check.build,investedOre:check.ore||0};
    let destroyedFood=false;if(tile.resourceId){if(tile.type==="food"){destroyedFood=true;tile.destroyedResource={type:tile.type,resourceId:tile.resourceId,name:tile.name,quality:tile.quality};Object.assign(tile,{type:null,family:null,resourceId:null,name:"Developed Land",quality:null,resourceRarity:null,resourceMult:null,requiredMiningLevel:0,requiredMiningTech:null,sustainability:null,reserve:null,initialReserve:null,empty:true,resourceCovered:false});}else tile.resourceCovered=true;}
    this.sync(state);return{ok:true,...check,level:1,destroyedFood};
  }
  canUpgrade(state,tile){
    const dev=tile?.development,kind=dev?.kind;if(!BUILDING_MODEL[kind])return{ok:false,reason:"This development is not upgraded through colony construction."};
    if(state.status==="dead")return{ok:false,reason:"This colony has been lost."};if(state.contract?.ended)return{ok:false,reason:"The mining contract has ended."};
    const level=Math.max(1,Number(dev.level)||1);if(level>=MAX_BUILDING_LEVEL)return{ok:false,reason:`${this.label(kind)} is already at L${MAX_BUILDING_LEVEL}.`,max:true};
    const nextLevel=level+1,cost=this.cost(state,tile,kind,nextLevel),tech=this.techLevel(state,kind),resourceReason=this.checkResources(state,cost);
    if(tech<nextLevel)return{ok:false,reason:`Requires ${this.label(kind)} Tech L${nextLevel}; corporation has L${tech}.`,...cost,nextLevel,techRequired:nextLevel};
    if(resourceReason)return{ok:false,reason:resourceReason,...cost,nextLevel,techRequired:nextLevel};
    return{ok:true,...cost,nextLevel,techRequired:nextLevel,currentCapacity:buildingCapacity(kind,level),capacity:buildingCapacity(kind,nextLevel)};
  }
  upgrade(state,tile){const check=this.canUpgrade(state,tile);if(!check.ok)return check;this.inventory.consumeCategory(state,"build",check.build);if(check.ore)this.inventory.consumeCategory(state,"ore",check.ore);tile.development.level=check.nextLevel;tile.development.investedBuild=(tile.development.investedBuild||0)+check.build;tile.development.investedOre=(tile.development.investedOre||0)+(check.ore||0);this.sync(state);return{ok:true,...check};}
  demolish(state,tile){
    const dev=tile?.development;if(!dev)return{ok:false,reason:"Nothing has been constructed on this tile."};
    const recoverBuild=Math.floor(Math.max(0,Number(dev.investedBuild)||0)*RECOVERY),recoverOre=Math.floor(Math.max(0,Number(dev.investedOre)||0)*RECOVERY);
    if(recoverBuild)this.inventory.store(state,"build","fiber","Construction Fibre",recoverBuild);if(recoverOre)this.inventory.store(state,"ore","surface-iron","Surface Iron Nodules",recoverOre);
    if(dev.kind==="extract"){tile.developed=false;tile.level=0;}tile.development=null;tile.resourceCovered=false;this.sync(state);return{ok:true,recover:recoverBuild,recoverBuild,recoverOre};
  }
}
