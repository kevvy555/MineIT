import { TECH_TREES,TECHNOLOGIES } from "../data/technologies-v570.js?v=5.7.0";
import { clamp } from "../core/utils.js?v=5.5.5";
import { syncBuildingTotals,MAX_BUILDING_LEVEL } from "./building-model.js?v=5.7.0";

const DEFAULT_TECH=Object.freeze({housing:1,power:1,food:1,industry:1,mining:1});
const BUILDING_TECHS=new Set(["housing","power","food","industry"]);

/** Canonical corporation technology rules. */
export class TechnologyService{
  ensure(state){state.company||={};state.company.tech=Object.assign({},DEFAULT_TECH,state.company.tech||{});return state.company.tech;}
  get(id){return TECHNOLOGIES.find(t=>t.id===id)||null;}
  tree(category){return TECH_TREES[category]||[];}
  level(state,category){this.ensure(state);const tree=this.tree(category),max=Math.max(1,tree.length||1);return clamp(Number(state.company.tech?.[category])||1,1,max);}
  current(state,category){return this.tree(category)[this.level(state,category)-1]||null;}
  next(state,category){return this.tree(category)[this.level(state,category)]||null;}
  accessMode(state){return state.contract?.techAccess||"direct";}
  canAccessStore(state){return this.accessMode(state)==="direct"||!!state.trade?.active;}
  accessText(state){return this.canAccessStore(state)?(this.accessMode(state)==="direct"?"Corporate link online":"Corporate trade ship link online"):"Technology purchases on this deep-reach claim require a docked corporate trade ship.";}
  maxBuildingLevel(state,category){return BUILDING_TECHS.has(category)?Math.min(MAX_BUILDING_LEVEL,this.level(state,category)):0;}
  canBuildLevel(state,category,level){return Math.max(1,Number(level)||1)<=this.maxBuildingLevel(state,category);}
  canExploit(state,tile){return this.level(state,"mining")>=Math.max(1,Number(tile?.requiredMiningLevel)||1);}
  maxSiteLevel(state,tile){if(tile?.type==="food")return Math.min(MAX_BUILDING_LEVEL,this.level(state,"food"));return this.canExploit(state,tile)?MAX_BUILDING_LEVEL:0;}
  canUpgradeSite(state,tile,nextLevel){return Math.max(1,Number(nextLevel)||1)<=this.maxSiteLevel(state,tile);}
  siteUpgradeTechRequirement(tile,nextLevel){return tile?.type==="food"?Math.max(1,Number(nextLevel)||1):Math.max(1,Number(tile?.requiredMiningLevel)||1);}
  meetsRequirements(state,required={}){return Object.entries(required||{}).every(([key,level])=>!TECH_TREES[key]||this.level(state,key)>=(Number(level)||1));}
  buy(state,category){this.ensure(state);const next=this.next(state,category);if(!next)return{ok:false,reason:"Maximum technology level reached."};if(!this.canAccessStore(state))return{ok:false,reason:this.accessText(state)};if(state.company.cash<next.cost)return{ok:false,reason:"Insufficient cash."};state.company.cash-=next.cost;state.company.tech[category]=next.level;this.recompute(state);return{ok:true,tech:next};}
  recompute(state){
    this.ensure(state);const totals=syncBuildingTotals(state),power=this.current(state,"power"),food=this.current(state,"food"),industry=this.current(state,"industry"),mining=this.current(state,"mining"),ml=this.level(state,"mining"),fl=this.level(state,"food"),il=this.level(state,"industry"),slots=clamp(1+Math.floor((ml-1)/2),1,5),scan=Math.max(.72,1-(ml-1)*.025),hint=clamp(Math.floor((ml-1)/3),0,3);
    const foodWorkforceEfficiency=Math.max(.70,1-(fl-1)*.06),miningWorkforceEfficiency=mining?.workforceEfficiency??Math.max(.65,1-(ml-1)*.04),industryWorkforceEfficiency=industry?.workforceEfficiency??1,industryOreEfficiency=industry?.oreEfficiency??1,industryProcessingEfficiency=industry?.processingEfficiency??1;
    Object.assign(state.metrics,{
      housingTech:this.level(state,"housing"),powerTech:this.level(state,"power"),foodTech:fl,industryTech:il,miningTech:ml,
      powerCapacity:totals.power,powerPopulationCap:totals.housing,powerIndustryCap:Number.MAX_SAFE_INTEGER,
      fuelIntensity:power?.fuelIntensity??.1,foodProductionMultiplier:food?.productionMultiplier??1,foodWorkforceEfficiency,miningWorkforceEfficiency,industryWorkforceEfficiency,industryOreEfficiency,industryProcessingEfficiency,
      syntheticFood:food?.syntheticFood??0,foodMult:1,miningMult:1,fm:1,im:1,sl:ml,sf:scan,hint,slots
    });
    return state.metrics;
  }
}
