import { ColonyService as LegacyColonyService } from "./colony-service-v563.js?v=5.6.3&legacy=1";
import { CONFIG } from "../core/config.js?v=5.5.5";
import { clamp } from "../core/utils.js?v=5.5.5";
import { syncBuildingTotals } from "./building-model.js?v=5.7.0";

const SITE_POWER=[1,2,4,7,11];
export class ColonyService extends LegacyColonyService{
  totals(state){return syncBuildingTotals(state);}
  populationCapacity(state){return Math.max(0,this.totals(state).housing);}
  industryPopulationRequirement(installedOrState){const installed=typeof installedOrState==="object"?this.totals(installedOrState).industry:Math.max(0,Number(installedOrState)||0);return Math.max(40,Math.round(installed*.8));}
  industryPopulationFactor(state){const installed=this.totals(state).industry,required=this.industryPopulationRequirement(installed);return clamp((Number(state.pop)||0)/Math.max(1,required),0,1);}
  industryOperationalCapacity(state){if(state.status==="dead"||state.colony?.emergencyMode)return 0;const installed=this.totals(state).industry;return Math.max(0,installed*this.industryPopulationFactor(state));}
  processingBonus(industryValue,state=null){const efficiency=state?.metrics?.industryProcessingEfficiency||1;return Math.min(CONFIG.INDUSTRY_PROCESSING_MAX_BONUS,super.processingBonus(Math.max(0,Number(industryValue)||0))*efficiency);}
  processingMultiplier(state){return 1+this.processingBonus(state.metrics?.industry||0,state);}
  siteUpgradeIndustryRequirement(siteLevel){return [0,0,150,300,550,900][Math.max(1,Math.min(5,Number(siteLevel)||1))]||0;}
  sitePowerDemand(tile){const level=Math.max(1,Math.min(5,Math.round(Number(tile?.level)||1)));return SITE_POWER[level-1];}
  demand(state){
    const totals=this.totals(state);if(state.status==="dead")return{powerDemand:0,capacity:totals.power,capacityFactor:1,foodDemand:0,fuelDemand:0,oreDemand:0,staffFactor:0,populationRequired:this.industryPopulationRequirement(totals.industry),supportLoad:this.supportLoad(state)};
    const emergency=!!state.colony?.emergencyMode,supportLoad=this.supportLoad(state),staffFactor=this.industryPopulationFactor(state),populationRequired=this.industryPopulationRequirement(totals.industry),lifeSupport=(Number(state.pop)||0)*CONFIG.LIFE_SUPPORT_POWER_PER_COLONIST*supportLoad*(emergency?CONFIG.EMERGENCY_LIFE_SUPPORT_MULTIPLIER:1),staffedIndustry=emergency?0:totals.industry*staffFactor,industryPower=staffedIndustry*(CONFIG.INDUSTRY_POWER_PER_LEVEL/100),activeSites=this.workforceSites(state),sitePower=activeSites.reduce((sum,tile)=>sum+this.sitePowerDemand(tile),0),powerDemand=Math.max(.1,lifeSupport+industryPower+sitePower),capacity=Math.max(0,totals.power),capacityFactor=clamp(capacity/Math.max(.1,powerDemand),0,1),foodDemand=Math.max(.1,(Number(state.pop)||0)*CONFIG.FOOD_PER_COLONIST),fuelDemand=Math.max(.05,powerDemand*(state.metrics.fuelIntensity||.1)),oreEfficiency=state.metrics.industryOreEfficiency||1,oreDemand=emergency?0:Math.max(.05,staffedIndustry*(CONFIG.ORE_PER_INDUSTRY_LEVEL/100)*oreEfficiency);
    return{powerDemand,capacity,capacityFactor,foodDemand,fuelDemand,oreDemand,staffFactor,populationRequired,supportLoad,installedIndustry:totals.industry};
  }
  relocationCost(state){const totals=this.totals(state);return Math.round(CONFIG.RELOCATION_BASE_COST+(Number(state.pop)||0)*CONFIG.RELOCATION_PER_COLONIST+totals.industry*(CONFIG.RELOCATION_PER_INDUSTRY_LEVEL/100));}
  canExpandHousing(){return{ok:false,reason:"Housing is constructed as individual map buildings."};}
  canExpandIndustry(){return{ok:false,reason:"Industry is constructed as individual map buildings."};}
  expandHousing(){return this.canExpandHousing();}
  expandIndustry(){return this.canExpandIndustry();}
}
