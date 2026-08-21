import { CONFIG } from "../core/config.js?v=5.5.1";

const MAX_SITE_LEVEL=5;
export class SiteService {
  constructor(contractService,technologyService,inventoryService,colonyService=null,resourceService=null){this.contracts=contractService;this.technology=technologyService;this.inventory=inventoryService;this.colony=colonyService;this.resources=resourceService;}
  distance(tile){return Math.hypot(tile.x,tile.y);}
  extractionTerrainCost(tile){if(tile.terrain==="mountain"&&tile.type==="ore")return .90;if(tile.terrain==="hill"&&tile.type==="build")return .90;if(tile.terrain==="plain"&&tile.type==="food")return .94;if(tile.terrain==="lake"&&tile.type==="food")return .92;return 1;}
  addLocalCost(state,amount){state.contract.localCosts=(state.contract.localCosts||0)+Math.max(0,amount||0);}
  complexity(tile){const level=Math.max(1,Math.min(10,Math.round(Number(tile.requiredMiningLevel)||1)));return CONFIG.SITE_COMPLEXITY_COSTS[level-1]||1;}
  sizeCost(tile){if(this.resources?.isRenewable(tile)){const label=String(tile.abundanceLabel||"Established").toLowerCase();return({limited:1.12,established:1,large:.90,vast:.80})[label]||1;}return this.resources?.finiteCostFactor(tile)||1;}
  developCashCost(state,tile){const a=this.contracts.archetype(state.contract),distance=1+this.distance(tile)*.022;return Math.round(CONFIG.SITE_DEVELOP_BASE_CASH*distance*a.cost*this.complexity(tile)*this.sizeCost(tile)*this.extractionTerrainCost(tile));}
  developBuildCost(state,tile){const a=this.contracts.archetype(state.contract),distance=1+this.distance(tile)*.012,complexity=.70+.30*this.complexity(tile);return Math.round(CONFIG.SITE_DEVELOP_BASE_BUILD*distance*a.cost*complexity*this.sizeCost(tile)*this.extractionTerrainCost(tile));}
  upgradeCashCost(state,tile){return Math.round(this.developCashCost(state,tile)*Math.pow(2.10,Math.max(1,Number(tile.level)||1)));}
  upgradeBuildCost(state,tile){return Math.round(this.developBuildCost(state,tile)*Math.pow(1.60,Math.max(1,Number(tile.level)||1)));}
  developCost(state,tile){return this.developCashCost(state,tile);}
  upgradeCost(state,tile){return this.upgradeCashCost(state,tile);}
  developRequirements(state,tile){
    if(!tile?.resourceId)return{ok:false,cash:0,build:0,requiredLevel:0,workforce:0,freeWorkforce:this.colony?.freeWorkforce(state)??Infinity,reason:"No exploitable surface resource on this tile."};
    const cash=this.developCashCost(state,tile),build=this.developBuildCost(state,tile),requiredLevel=tile.requiredMiningLevel||1,techOk=this.technology.canExploit(state,tile),workforce=this.colony?.siteWorkforce(state,{...tile,level:1})||0,freeWorkforce=this.colony?.freeWorkforce(state)??Infinity;
    if(state.contract.ended)return{ok:false,cash,build,requiredLevel,workforce,freeWorkforce,reason:"Mining contract ended. This colony is support-only."};
    if(!tile.revealed||tile.developed||tile.depleted||tile.resourceCovered)return{ok:false,cash,build,requiredLevel,workforce,freeWorkforce,reason:tile.resourceCovered?"The resource is covered by another development.":"Site unavailable."};
    if(!techOk)return{ok:false,cash,build,requiredLevel,workforce,freeWorkforce,reason:`Requires Mining L${requiredLevel}: ${tile.requiredMiningTech||"Extraction technology"}.`};
    if(freeWorkforce<workforce)return{ok:false,cash,build,requiredLevel,workforce,freeWorkforce,reason:`Need ${workforce} free operational workers; only ${Math.floor(freeWorkforce)} are available.`};
    if(this.inventory.amount(state,"build")<build)return{ok:false,cash,build,requiredLevel,workforce,freeWorkforce,reason:`Need ${build} Build materials.`};
    if(state.company.cash<cash)return{ok:false,cash,build,requiredLevel,workforce,freeWorkforce,reason:"Insufficient cash."};
    return{ok:true,cash,build,requiredLevel,workforce,freeWorkforce};
  }
  develop(state,tile){const r=this.developRequirements(state,tile);if(!r.ok)return r;this.inventory.consumeCategory(state,"build",r.build);state.company.cash-=r.cash;this.addLocalCost(state,r.cash);tile.developed=true;tile.level=1;if(this.resources?.isRenewable(tile))this.resources.ensureRenewable(tile);return{ok:true,...r};}
  upgradeRequirements(state,tile){
    const level=Math.max(1,Number(tile?.level)||1),nextLevel=level+1,currentWorkers=this.colony?.siteWorkforce(state,tile)||0,nextWorkers=this.colony?.siteWorkforce(state,{...tile,level:nextLevel})||0,workforce=Math.max(0,nextWorkers-currentWorkers),freeWorkforce=this.colony?.freeWorkforce(state)??Infinity;
    if(level>=MAX_SITE_LEVEL)return{ok:false,cash:0,build:0,industryRequired:0,techRequired:0,workforce,freeWorkforce,max:true,reason:`Extraction site is already at L${MAX_SITE_LEVEL}.`};
    const cash=this.upgradeCashCost(state,tile),build=this.upgradeBuildCost(state,tile),industryRequired=this.colony?.siteUpgradeIndustryRequirement(nextLevel)||1,techRequired=this.technology.siteUpgradeTechRequirement(tile,nextLevel);
    if(state.contract.ended)return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:"Mining contract ended. This colony is support-only."};
    if(!tile.developed||tile.depleted||tile.resourceCovered)return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:tile.resourceCovered?"The resource is covered by another development.":"Site unavailable."};
    if(!this.technology.canUpgradeSite(state,tile,nextLevel))return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:`Site L${nextLevel} requires Mining L${techRequired}.`};
    if((state.colony?.industryLevel||1)<industryRequired)return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:`Upgrade to site L${nextLevel} requires Industry L${industryRequired}.`};
    if(freeWorkforce<workforce)return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:`Upgrade needs ${workforce} additional operational workers; only ${Math.floor(freeWorkforce)} are free.`};
    if(this.inventory.amount(state,"build")<build)return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:`Need ${build} Build materials.`};
    if(state.company.cash<cash)return{ok:false,cash,build,industryRequired,techRequired,workforce,freeWorkforce,reason:"Insufficient cash."};
    return{ok:true,cash,build,industryRequired,techRequired,workforce,freeWorkforce,nextLevel};
  }
  upgrade(state,tile){const r=this.upgradeRequirements(state,tile);if(!r.ok)return r;this.inventory.consumeCategory(state,"build",r.build);state.company.cash-=r.cash;this.addLocalCost(state,r.cash);tile.level=r.nextLevel;return{ok:true,...r};}
}
