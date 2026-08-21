import { TECH_TREES, TECHNOLOGIES } from "../data/technologies.js?v=5.5.3";
import { clamp } from "../core/utils.js?v=5.5.3";

export class TechnologyService {
  get(id){return TECHNOLOGIES.find(t=>t.id===id)||null;}
  tree(category){return TECH_TREES[category]||[];}
  level(state,category){return clamp(Number(state.company.tech?.[category])||1,1,10);}
  current(state,category){return this.tree(category)[this.level(state,category)-1];}
  next(state,category){return this.tree(category)[this.level(state,category)]||null;}
  accessMode(state){return state.contract?.techAccess||"direct";}
  canAccessStore(state){return this.accessMode(state)==="direct"||!!state.trade?.active;}
  accessText(state){return this.canAccessStore(state)?(this.accessMode(state)==="direct"?"Corporate link online":"Corporate trade ship link online"):"Technology purchases on this deep-reach claim require a docked corporate trade ship.";}
  canExploit(state,tile){return this.level(state,"mining")>=((tile.requiredMiningLevel)||1);}
  maxSiteLevel(state,tile){return Math.max(0,1+this.level(state,"mining")-Math.max(1,Number(tile?.requiredMiningLevel)||1));}
  canUpgradeSite(state,tile,nextLevel){return Math.max(1,Number(nextLevel)||1)<=this.maxSiteLevel(state,tile);}
  siteUpgradeTechRequirement(tile,nextLevel){return Math.max(1,Number(tile?.requiredMiningLevel)||1)+Math.max(0,Math.max(1,Number(nextLevel)||1)-1);}
  meetsRequirements(state,required={}){return["power","food","mining"].every(k=>this.level(state,k)>=(required[k]||1));}
  buy(state,category){const next=this.next(state,category);if(!next)return{ok:false,reason:"Maximum technology level reached."};if(!this.canAccessStore(state))return{ok:false,reason:this.accessText(state)};if(state.company.cash<next.cost)return{ok:false,reason:"Insufficient cash."};state.company.cash-=next.cost;state.company.tech[category]=next.level;this.recompute(state);return{ok:true,tech:next};}
  recompute(state){const power=this.current(state,"power"),food=this.current(state,"food"),mining=this.current(state,"mining"),ml=this.level(state,"mining"),fl=this.level(state,"food"),slots=clamp(1+Math.floor((ml-1)/2),1,5),scan=Math.max(.72,1-(ml-1)*.025),hint=clamp(Math.floor((ml-1)/3),0,3),foodWorkforceEfficiency=Math.max(.70,1-(fl-1)*.035),miningWorkforceEfficiency=Math.max(.65,1-(ml-1)*.04);Object.assign(state.metrics,{powerTech:power.level,foodTech:food.level,miningTech:mining.level,powerCapacity:power.powerCapacity,powerPopulationCap:power.populationCap,powerIndustryCap:power.industryCap,fuelIntensity:power.fuelIntensity,foodMult:1,miningMult:1,foodWorkforceEfficiency,miningWorkforceEfficiency,syntheticFood:food.syntheticFood,fm:1,im:1,sl:ml,sf:scan,hint,slots});}
}
