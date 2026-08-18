import { CONFIG } from "../core/config.js?v=5.0.0";
import { clamp } from "../core/utils.js";

export class ColonyService {
  constructor(inventoryService,technologyService){this.inventory=inventoryService;this.technology=technologyService;}
  buildStock(state){return this.inventory.amount(state,"build");}
  addLocalCost(state,amount){state.contract.localCosts=(state.contract.localCosts||0)+Math.max(0,amount||0);}
  housingBuildCost(state){return Math.round(70*Math.pow(1.42,Math.max(0,state.colony.housingLevel-1)));}
  housingCashCost(state){return Math.round(1800*Math.pow(1.28,Math.max(0,state.colony.housingLevel-1)));}
  industryBuildCost(state){return Math.round(95*Math.pow(1.48,Math.max(0,state.colony.industryLevel-1)));}
  industryCashCost(state){return Math.round(2600*Math.pow(1.34,Math.max(0,state.colony.industryLevel-1)));}
  canExpandHousing(state){const nextCap=state.colony.housingCapacity+160;if(nextCap>state.metrics.powerPopulationCap)return{ok:false,reason:`Power Tech L${state.metrics.powerTech} supports up to ${state.metrics.powerPopulationCap} population.`};const build=this.housingBuildCost(state),cash=this.housingCashCost(state);if(this.buildStock(state)<build)return{ok:false,reason:`Need ${build} Build materials.`};if(state.company.cash<cash)return{ok:false,reason:"Insufficient cash."};return{ok:true,build,cash,nextCap};}
  expandHousing(state){const check=this.canExpandHousing(state);if(!check.ok)return check;this.inventory.consumeCategory(state,"build",check.build);state.company.cash-=check.cash;this.addLocalCost(state,check.cash);state.colony.housingLevel++;state.colony.housingCapacity=check.nextCap;return{ok:true,...check};}
  canExpandIndustry(state){const next=state.colony.industryLevel+1;if(next>state.metrics.powerIndustryCap)return{ok:false,reason:`Power Tech L${state.metrics.powerTech} supports Industry L${state.metrics.powerIndustryCap}.`};const build=this.industryBuildCost(state),cash=this.industryCashCost(state);if(this.buildStock(state)<build)return{ok:false,reason:`Need ${build} Build materials.`};if(state.company.cash<cash)return{ok:false,reason:"Insufficient cash."};return{ok:true,build,cash,next};}
  expandIndustry(state){const check=this.canExpandIndustry(state);if(!check.ok)return check;this.inventory.consumeCategory(state,"build",check.build);state.company.cash-=check.cash;this.addLocalCost(state,check.cash);state.colony.industryLevel=check.next;return{ok:true,...check};}
  demand(state,activeSites=0){const powerDemand=state.pop*.08+state.colony.industryLevel*8+activeSites*1.5,capacity=state.metrics.powerCapacity||1,capacityFactor=clamp(capacity/Math.max(1,powerDemand),0,1),foodDemand=Math.max(1,state.pop*.055),fuelDemand=Math.max(.1,powerDemand*(state.metrics.fuelIntensity||.1)),oreDemand=Math.max(.1,state.colony.industryLevel*.75);return{powerDemand,capacity,capacityFactor,foodDemand,fuelDemand,oreDemand};}
  operatingCost(state,activeSites=0){const tier=1+.20*Math.max(0,(state.contract.colonyTier||1)-1),base=state.pop*.22+state.colony.industryLevel*4+state.colony.housingLevel*1.2+activeSites*1.5,mult=state.status==="liability"?CONFIG.LIABILITY_COST_MULTIPLIER:state.status==="holdover"?CONFIG.HOLDOVER_COST_MULTIPLIER:1;return Math.max(1,base*tier*mult);}
  relocationCost(state){return Math.round(CONFIG.RELOCATION_BASE_COST+state.pop*CONFIG.RELOCATION_PER_COLONIST+state.colony.industryLevel*CONFIG.RELOCATION_PER_INDUSTRY_LEVEL);}
  syntheticFoodRate(state){return state.contract.naturalFood===false?(state.metrics.syntheticFood||0):Math.max(0,(state.metrics.syntheticFood||0)*.35);}
}
