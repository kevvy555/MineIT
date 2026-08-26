import { CONFIG } from "../core/config.js?v=5.5.5";
import { clamp } from "../core/utils.js?v=5.5.5";
import { syncBuildingTotals } from "./building-model.js?v=5.7.0";
import { supportsOverdrive,workforceMultiplier,isAccidentShutdown } from "./extraction-overdrive.js?v=5.6.2";

const SITE_POWER=[1,2,4,7,11];

/** Canonical colony rules. Mutable data lives in game state; this service owns calculations/actions only. */
export class ColonyService{
  constructor(inventoryService,technologyService){this.inventory=inventoryService;this.technology=technologyService;}
  buildStock(state){return this.inventory.amount(state,"build");}
  addLocalCost(state,amount){state.contract.localCosts=(state.contract.localCosts||0)+Math.max(0,amount||0);}
  supportLoad(state){return Math.max(.5,Number(state.contract?.supportLoad)||1);}
  totals(state){return syncBuildingTotals(state);}
  populationCapacity(state){return Math.max(0,this.totals(state).housing);}
  industryPopulationRequirement(installedOrState){const isState=installedOrState&&typeof installedOrState==="object",installed=isState?this.totals(installedOrState).industry:Math.max(0,Number(installedOrState)||0),efficiency=isState?(installedOrState.metrics?.industryWorkforceEfficiency||1):1;return Math.max(40,Math.round(installed*.8*efficiency));}
  industryPopulationFactor(state){const required=this.industryPopulationRequirement(state);return clamp((Number(state.pop)||0)/Math.max(1,required),0,1);}
  siteIndustryLoad(tile){const level=Math.max(1,Math.round(Number(tile?.level)||1));return Math.round(CONFIG.INDUSTRY_SITE_LOAD_BASE*Math.pow(CONFIG.INDUSTRY_SITE_LOAD_GROWTH,level-1));}
  industryOperationalCapacity(state){if(state.status==="dead"||state.colony?.emergencyMode)return 0;const installed=this.totals(state).industry;return Math.max(0,installed*this.industryPopulationFactor(state));}
  industryNetwork(state,sites=[]){const capacity=this.industryOperationalCapacity(state);let survivalLoad=0,commercialLoad=0;for(const tile of sites){const load=this.siteIndustryLoad(tile);if(tile.type==="food"||tile.type==="fuel")survivalLoad+=load;else commercialLoad+=load;}const remaining=Math.max(0,capacity-survivalLoad),commercialFactor=state.colony?.emergencyMode?0:commercialLoad>0?clamp(remaining/commercialLoad,0,1):1,totalLoad=survivalLoad+commercialLoad;return{industryCapacity:capacity,industryLoad:totalLoad,industrySurvivalLoad:survivalLoad,industryCommercialLoad:commercialLoad,industryCommercialFactor:commercialFactor,industryOverloaded:totalLoad>capacity+.001};}
  workforceAvailable(state){return state.status==="dead"?0:Math.max(0,Math.floor((Number(state.pop)||0)*CONFIG.WORKFORCE_SHARE));}
  baseSiteWorkforce(state,tile,levelOverride=null){const level=Math.max(1,Math.round(Number(levelOverride??tile?.level)||1)),miningLevel=Math.max(1,Number(tile?.requiredMiningLevel)||1),complexity=1+.18*(miningLevel-1),efficiency=tile?.type==="food"?(state.metrics.foodWorkforceEfficiency||1):(state.metrics.miningWorkforceEfficiency||1),intensity=tile?.sustainability==="renewable"||tile?.type==="food"||tile?.resourceId==="biomass"||tile?.resourceId==="fiber"?clamp(Number(tile?.harvestIntensity)||1,.25,2):1,intensityFactor=.5+.5*intensity;return Math.max(1,Math.ceil(CONFIG.SITE_WORKFORCE_BASE*Math.pow(CONFIG.SITE_WORKFORCE_GROWTH,level-1)*complexity*efficiency*intensityFactor));}
  siteWorkforce(state,tile,levelOverride=null,modeOverride=null){const base=this.baseSiteWorkforce(state,tile,levelOverride);return supportsOverdrive(tile)?Math.max(1,Math.ceil(base*workforceMultiplier(tile,modeOverride))):base;}
  workforceSites(state){if(state.contract?.ended||state.status==="dead")return[];let sites=Object.values(state.tiles||{}).filter(tile=>tile.developed&&!tile.depleted&&!isAccidentShutdown(tile));if(state.colony?.emergencyMode)sites=sites.filter(tile=>tile.type==="food"||tile.type==="fuel");return sites;}
  workforceNetwork(state,sites=this.workforceSites(state)){const available=this.workforceAvailable(state);let survivalRequired=0,commercialRequired=0;for(const tile of sites){const required=this.siteWorkforce(state,tile);if(tile.type==="food"||tile.type==="fuel")survivalRequired+=required;else commercialRequired+=required;}const survivalFactor=survivalRequired>0?clamp(available/survivalRequired,0,1):1,remaining=Math.max(0,available-survivalRequired),commercialFactor=state.colony?.emergencyMode?0:commercialRequired>0?clamp(remaining/commercialRequired,0,1):1,required=survivalRequired+commercialRequired;return{workforceAvailable:available,workforceRequired:required,workforceSurvivalRequired:survivalRequired,workforceCommercialRequired:commercialRequired,workforceSurvivalFactor:survivalFactor,workforceCommercialFactor:commercialFactor,workforceFree:Math.max(0,available-required),workforceShortfall:Math.max(0,required-available)};}
  freeWorkforce(state){return this.workforceNetwork(state).workforceFree;}
  baseProcessingBonus(industryValue){const value=Math.max(0,Number(industryValue)||0),points=[[100,0],[200,.05],[300,.10],[500,.20],[1000,.35],[2000,CONFIG.INDUSTRY_PROCESSING_MAX_BONUS]];if(value<=points[0][0])return 0;for(let i=1;i<points.length;i++){const [hi,bonus]=points[i],[lo,loBonus]=points[i-1];if(value<=hi){const t=(value-lo)/(hi-lo);return loBonus+t*(bonus-loBonus);}}return CONFIG.INDUSTRY_PROCESSING_MAX_BONUS;}
  processingBonus(industryValue,state=null){const efficiency=state?.metrics?.industryProcessingEfficiency||1;return Math.min(CONFIG.INDUSTRY_PROCESSING_MAX_BONUS,this.baseProcessingBonus(Math.max(0,Number(industryValue)||0))*efficiency);}
  processingMultiplier(state){return 1+this.processingBonus(state.metrics?.industry||0,state);}
  siteUpgradeIndustryRequirement(siteLevel){return[0,0,150,300,550,900][Math.max(1,Math.min(5,Number(siteLevel)||1))]||0;}
  sitePowerDemand(tile){const level=Math.max(1,Math.min(5,Math.round(Number(tile?.level)||1)));return SITE_POWER[level-1];}
  housingBuildCost(state){return Math.round(CONFIG.HOUSING_BASE_BUILD*Math.pow(1.55,Math.max(0,(state.colony?.housingLevel||1)-1)));}
  housingCashCost(){return 0;}
  industryBuildCost(state){return Math.round(CONFIG.INDUSTRY_BASE_BUILD*Math.pow(1.55,Math.max(0,(state.colony?.industryLevel||1)-1)));}
  industryCashCost(){return 0;}
  canExpandHousing(){return{ok:false,reason:"Housing is constructed as individual map buildings."};}
  canExpandIndustry(){return{ok:false,reason:"Industry is constructed as individual map buildings."};}
  expandHousing(){return this.canExpandHousing();}
  expandIndustry(){return this.canExpandIndustry();}
  demand(state){const totals=this.totals(state);if(state.status==="dead")return{powerDemand:0,capacity:totals.power,capacityFactor:1,foodDemand:0,fuelDemand:0,oreDemand:0,staffFactor:0,populationRequired:this.industryPopulationRequirement(state),supportLoad:this.supportLoad(state)};const emergency=!!state.colony?.emergencyMode,supportLoad=this.supportLoad(state),staffFactor=this.industryPopulationFactor(state),populationRequired=this.industryPopulationRequirement(state),lifeSupport=(Number(state.pop)||0)*CONFIG.LIFE_SUPPORT_POWER_PER_COLONIST*supportLoad*(emergency?CONFIG.EMERGENCY_LIFE_SUPPORT_MULTIPLIER:1),staffedIndustry=emergency?0:totals.industry*staffFactor,industryPower=staffedIndustry*(CONFIG.INDUSTRY_POWER_PER_LEVEL/100),activeSites=this.workforceSites(state),sitePower=activeSites.reduce((sum,tile)=>sum+this.sitePowerDemand(tile),0),powerDemand=Math.max(.1,lifeSupport+industryPower+sitePower),capacity=Math.max(0,totals.power),capacityFactor=clamp(capacity/Math.max(.1,powerDemand),0,1),foodDemand=Math.max(.1,(Number(state.pop)||0)*CONFIG.FOOD_PER_COLONIST),fuelDemand=Math.max(.05,powerDemand*(state.metrics.fuelIntensity||.1)),oreEfficiency=state.metrics.industryOreEfficiency||1,oreDemand=emergency?0:Math.max(.05,staffedIndustry*(CONFIG.ORE_PER_INDUSTRY_LEVEL/100)*oreEfficiency);return{powerDemand,capacity,capacityFactor,foodDemand,fuelDemand,oreDemand,staffFactor,populationRequired,supportLoad,installedIndustry:totals.industry};}
  operatingCost(){return 0;}
  supplyDays(stock,production,demand){const deficit=Math.max(0,(Number(demand)||0)-(Number(production)||0));return deficit<=.0001?null:Math.max(0,(Number(stock)||0)/deficit);}
  relocationCost(state){const totals=this.totals(state);return Math.round(CONFIG.RELOCATION_BASE_COST+(Number(state.pop)||0)*CONFIG.RELOCATION_PER_COLONIST+totals.industry*(CONFIG.RELOCATION_PER_INDUSTRY_LEVEL/100));}
  syntheticFoodRate(state){return state.contract.naturalFood===false?(state.metrics.syntheticFood||0):Math.max(0,(state.metrics.syntheticFood||0)*.35);}
}
