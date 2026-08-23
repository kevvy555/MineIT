import { SiteService as LegacySiteService } from "./site-service-v563.js?v=5.6.3&legacy=1";
import { isAccidentShutdown } from "./extraction-overdrive.js?v=5.6.2";

const MAX_SITE_LEVEL=5;
const INDUSTRY_REQ={food:[0,0,100,230,420,700],industrial:[0,0,150,300,550,900]};
const POWER_REQ={food:[0,0,45,90,160,260],industrial:[0,0,60,120,220,360]};
const ORE_COST={food:[0,0,5,15,35,65],industrial:[0,0,10,30,70,130]};

function siteFamily(tile){if(tile?.type==="food"){if(tile.resourceId==="herd")return"ranch";if(tile.resourceId==="thermal")return"algae";if(["fungal","protein"].includes(tile.resourceId))return"bio";return"farm";}if(tile?.type==="fuel"&&["oil","gas","brine"].includes(tile.resourceId))return"rig";if(tile?.type==="build")return"quarry";if(tile?.type==="ore"&&["diamond","exotic","crystal","advanced"].includes(tile.resourceId))return"deep-mine";return"mine";}

export class SiteService extends LegacySiteService{
  profile(tile){return tile?.type==="food"?"food":"industrial";}
  syncDevelopment(tile){if(!tile?.developed)return;const existing=tile.development?.kind==="extract"?tile.development:{kind:"extract",family:siteFamily(tile),level:tile.level||1,investedBuild:0,investedOre:0};existing.family=siteFamily(tile);existing.level=Math.max(1,Math.min(MAX_SITE_LEVEL,Number(tile.level)||1));tile.development=existing;}
  upgradeOreCost(tile,nextLevel){return ORE_COST[this.profile(tile)][Math.max(1,Math.min(MAX_SITE_LEVEL,Number(nextLevel)||1))]||0;}
  upgradeIndustryRequirement(tile,nextLevel){return INDUSTRY_REQ[this.profile(tile)][Math.max(1,Math.min(MAX_SITE_LEVEL,Number(nextLevel)||1))]||0;}
  upgradePowerRequirement(tile,nextLevel){return POWER_REQ[this.profile(tile)][Math.max(1,Math.min(MAX_SITE_LEVEL,Number(nextLevel)||1))]||0;}
  develop(state,tile){const result=super.develop(state,tile);if(result.ok)this.syncDevelopment(tile);return result;}
  upgradeRequirements(state,tile){
    const level=Math.max(1,Number(tile?.level)||1),nextLevel=level+1,currentWorkers=this.colony?.siteWorkforce(state,tile)||0,nextWorkers=this.colony?.siteWorkforce(state,{...tile,level:nextLevel})||0,workforce=Math.max(0,nextWorkers-currentWorkers),freeWorkforce=this.colony?.freeWorkforce(state)??Infinity;
    if(isAccidentShutdown(tile))return{ok:false,cash:0,build:0,ore:0,industryRequired:0,powerRequired:0,workforce,freeWorkforce,reason:`Facility is closed after an accident for ${Math.max(1,Math.ceil(Number(tile.accidentShutdownDays)||0))} more day${Math.ceil(Number(tile.accidentShutdownDays)||0)===1?"":"s"}.`};
    if(level>=MAX_SITE_LEVEL)return{ok:false,cash:0,build:0,ore:0,industryRequired:0,powerRequired:0,workforce,freeWorkforce,max:true,reason:`Extraction site is already at L${MAX_SITE_LEVEL}.`};
    const build=this.upgradeBuildCost(state,tile),ore=this.upgradeOreCost(tile,nextLevel),industryRequired=this.upgradeIndustryRequirement(tile,nextLevel),powerRequired=this.upgradePowerRequirement(tile,nextLevel),totals=this.colony?.totals?.(state)||{industry:state.metrics?.industryInstalled||0,power:state.metrics?.powerCapacity||0};
    if(state.contract.ended)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:"Mining contract ended. This colony is support-only."};
    if(!tile.developed||tile.depleted||tile.resourceCovered)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:tile.resourceCovered?"The resource is covered by another development.":"Site unavailable."};
    if(!this.technology.canExploit(state,tile))return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:`Requires Mining L${tile.requiredMiningLevel||1}: ${tile.requiredMiningTech||"Extraction technology"}.`};
    if(tile.type==="food"&&this.technology.level(state,"food")<nextLevel)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,techRequired:nextLevel,reason:`Food Production Tech L${nextLevel} is required to upgrade this ${tile.development?.family||"food facility"} to L${nextLevel}.`};
    if((totals.industry||0)<industryRequired)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:`Site L${nextLevel} needs ${industryRequired} installed Industry; colony has ${Math.round(totals.industry||0)}.`};
    if((totals.power||0)<powerRequired)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:`Site L${nextLevel} needs ${powerRequired} Power capacity; colony has ${Math.round(totals.power||0)}.`};
    if(freeWorkforce<workforce)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:`Upgrade needs ${workforce} additional operational workers; only ${Math.floor(freeWorkforce)} are free.`};
    if(this.inventory.amount(state,"build")<build)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:`Need ${build} Build materials.`};
    if(ore>0&&this.inventory.amount(state,"ore")<ore)return{ok:false,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,reason:`Need ${ore} Ore.`};
    return{ok:true,cash:0,build,ore,industryRequired,powerRequired,workforce,freeWorkforce,nextLevel,techRequired:tile.type==="food"?nextLevel:tile.requiredMiningLevel||1};
  }
  upgrade(state,tile){const r=this.upgradeRequirements(state,tile);if(!r.ok)return r;this.inventory.consumeCategory(state,"build",r.build);if(r.ore)this.inventory.consumeCategory(state,"ore",r.ore);tile.level=r.nextLevel;this.syncDevelopment(tile);return{ok:true,...r};}
}
