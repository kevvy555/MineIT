import { TECH_TREES,TECHNOLOGIES } from "../data/technologies.js";
import { CONFIG } from "../core/config.js";
import { clamp } from "../core/utils.js";
import { syncBuildingTotals,MAX_BUILDING_LEVEL } from "./building-model.js";
import { ensureSpaceport,engineeringDeployments,hasFreeBerth } from "./spaceport-model.js";

const DEFAULT_TECH=Object.freeze({housing:1,power:1,food:1,industry:1,mining:1,scanning:1});
const BUILDING_TECHS=new Set(["housing","power","food","industry"]);
const FINAL_DEPLOYMENT_STATES=new Set(["complete","cancelled"]);

const normalizeTechMap=source=>{
  const tech=source&&typeof source==="object"?source:{};
  const mining=Math.max(1,Number(tech.mining)||1),hadScanning=Number.isFinite(Number(tech.scanning));
  for(const[key,value]of Object.entries(DEFAULT_TECH))if(!Number.isFinite(Number(tech[key]))||Number(tech[key])<1)tech[key]=value;
  tech.mining=mining;if(!hadScanning)tech.scanning=mining;
  return tech;
};

/** Migrate/normalise company access, colony-deployed capability, Engineering Deployments and the Basic Spaceport. */
export function normalizeTechnologyState(state){
  state.company||={};
  state.company.tech=normalizeTechMap(state.company.tech);
  state.colony||={};
  state.colony.tech=state.colony.tech&&typeof state.colony.tech==="object"?normalizeTechMap(state.colony.tech):{...state.company.tech};
  engineeringDeployments(state);
  ensureSpaceport(state);
  return state.colony.tech;
}

/** Canonical corporate-capability rules, including colony deployment by Engineering Ship. */
export class TechnologyService{
  constructor(colonyService=null){this.colonyService=colonyService;}
  networkStatus(state){if(!this.colonyService?.headquartersContinuity)return{networkAvailable:true};return this.colonyService.headquartersContinuity(state);}
  ensure(state){return normalizeTechnologyState(state);}
  absoluteDay(state){return(Math.max(1,Number(state.year)||1)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,Number(state.day)||1);}
  get(id){return TECHNOLOGIES.find(t=>t.id===id)||null;}
  tree(category){return TECH_TREES[category]||[];}
  level(state,category){this.ensure(state);const tree=this.tree(category),max=Math.max(1,tree.length||1);return clamp(Number(state.colony.tech?.[category])||1,1,max);}
  companyLevel(state,category){this.ensure(state);const tree=this.tree(category),max=Math.max(1,tree.length||1);return clamp(Number(state.company.tech?.[category])||1,1,max);}
  current(state,category){return this.tree(category)[this.level(state,category)-1]||null;}
  next(state,category){return this.tree(category)[this.level(state,category)]||null;}
  accessMode(){return"engineering";}
  canAccessStore(state){return state.status!=="dead"&&!state.contract?.ended&&this.networkStatus(state).networkAvailable;}
  accessText(state){if(state.status==="dead"||state.contract?.ended)return"Corporate engineering support is unavailable for this colony.";if(!this.networkStatus(state).networkAvailable)return"Conglomerate network offline: restore the Primary Headquarters before ordering a new Engineering Deployment.";return"Corporate engineering support online. Capability packages prepare for five days, then arrive by dedicated Engineering Ship.";}
  maxBuildingLevel(state,category){return BUILDING_TECHS.has(category)?Math.min(MAX_BUILDING_LEVEL,this.level(state,category)):0;}
  canBuildLevel(state,category,level){return Math.max(1,Number(level)||1)<=this.maxBuildingLevel(state,category);}
  canExploit(state,tile){return this.level(state,"mining")>=Math.max(1,Number(tile?.requiredMiningLevel)||1);}
  maxSiteLevel(state,tile){if(tile?.type==="food")return Math.min(MAX_BUILDING_LEVEL,this.level(state,"food"));return this.canExploit(state,tile)?MAX_BUILDING_LEVEL:0;}
  canUpgradeSite(state,tile,nextLevel){return Math.max(1,Number(nextLevel)||1)<=this.maxSiteLevel(state,tile);}
  siteUpgradeTechRequirement(tile,nextLevel){return tile?.type==="food"?Math.max(1,Number(nextLevel)||1):Math.max(1,Number(tile?.requiredMiningLevel)||1);}
  meetsRequirements(state,required={}){return Object.entries(required||{}).every(([key,level])=>!TECH_TREES[key]||this.companyLevel(state,key)>=(Number(level)||1));}
  deployments(state,{activeOnly=false}={}){this.ensure(state);const rows=engineeringDeployments(state);return activeOnly?rows.filter(d=>!FINAL_DEPLOYMENT_STATES.has(d.status)):rows;}
  pendingForCategory(state,category){return this.deployments(state,{activeOnly:true}).find(d=>d.upgrades?.some(u=>u.category===category))||null;}
  openBatch(state){const today=this.absoluteDay(state);return this.deployments(state,{activeOnly:true}).find(d=>d.status==="batching"&&d.orderAbsoluteDay===today)||null;}
  quoteOrder(state,category){
    this.ensure(state);const tech=this.next(state,category);if(!tech)return{ok:false,reason:"Maximum capability level reached."};if(!this.canAccessStore(state))return{ok:false,reason:this.accessText(state)};const pending=this.pendingForCategory(state,category);if(pending)return{ok:false,reason:`${tech.category} upgrade already has an Engineering Deployment in progress.`,deployment:pending};
    const batch=this.openBatch(state),transportCost=batch?0:CONFIG.ENGINEERING_SHIP_TRANSPORT_COST,packageCost=Math.max(0,Number(tech.cost)||0),total=transportCost+packageCost;
    return{ok:true,tech,batch,joinsBatch:!!batch,transportCost,packageCost,total};
  }
  orderUpgrade(state,category){
    const quote=this.quoteOrder(state,category);if(!quote.ok)return quote;if((Number(state.company.cash)||0)<quote.total)return{...quote,ok:false,reason:"Insufficient cash."};
    const today=this.absoluteDay(state),newDeployment=!quote.batch,deployment=quote.batch||{id:`engineering-${state.colonyId}-${today}-${Math.random().toString(36).slice(2,7)}`,colonyId:state.colonyId,colonyName:state.contract?.colonyName||"Colony",status:"batching",orderAbsoluteDay:today,preparationDaysRemaining:null,transportCost:CONFIG.ENGINEERING_SHIP_TRANSPORT_COST,packageSubtotal:0,paidTotal:0,upgrades:[],distanceLy:Math.max(0,Number(state.contract?.distanceLy)||0)};
    if(newDeployment)engineeringDeployments(state).push(deployment);
    const upgrade={category,level:quote.tech.level,techId:quote.tech.id,name:quote.tech.name,packageCost:quote.packageCost};deployment.upgrades.push(upgrade);deployment.packageSubtotal+=quote.packageCost;deployment.paidTotal+=quote.total;deployment.sharedTransportSaving=Math.max(0,(deployment.upgrades.length-1)*CONFIG.ENGINEERING_SHIP_TRANSPORT_COST);
    state.company.cash-=quote.total;state.contract.localCosts=(Number(state.contract.localCosts)||0)+quote.total;
    return{ok:true,tech:quote.tech,upgrade,deployment,cost:quote.total,transportCost:quote.transportCost,packageCost:quote.packageCost,joinsBatch:quote.joinsBatch};
  }
  cancelQuote(deployment){const paid=Math.max(0,Number(deployment?.paidTotal)||0),fee=Math.min(paid,CONFIG.ENGINEERING_CANCELLATION_FEE);return{paid,fee,refund:Math.max(0,paid-fee)};}
  cancelDeployment(state,id){
    this.ensure(state);const deployment=engineeringDeployments(state).find(d=>d.id===id);if(!deployment)return{ok:false,reason:"Engineering Deployment not found."};if(!["batching","preparing"].includes(deployment.status))return{ok:false,reason:"This Engineering Ship has already launched and cannot be cancelled."};const quote=this.cancelQuote(deployment);deployment.status="cancelled";deployment.cancelledAbsoluteDay=this.absoluteDay(state);deployment.cancellationFee=quote.fee;deployment.refund=quote.refund;state.company.cash=(Number(state.company.cash)||0)+quote.refund;state.contract.localCosts=Math.max(0,(Number(state.contract.localCosts)||0)-quote.refund);return{ok:true,deployment,...quote};
  }
  engineeringTravelDays(state,deployment){const distance=Math.max(0,Number(deployment?.distanceLy??state.contract?.distanceLy)||0);return Math.max(CONFIG.ENGINEERING_MIN_TRAVEL_DAYS,Math.ceil(distance/CONFIG.ENGINEERING_SHIP_SPEED_LY_PER_YEAR*CONFIG.DAYS_PER_YEAR));}
  landOrHold(state,deployment,today,events){if(hasFreeBerth(state)){deployment.status="landed";deployment.landedAbsoluteDay=today;events.push({type:"engineering-landed",deployment});}else{deployment.status="orbital-holding";deployment.orbitalSinceAbsoluteDay??=today;events.push({type:"engineering-orbital-holding",deployment});}}
  activateDeployment(state,deployment,today){for(const upgrade of deployment.upgrades||[]){state.colony.tech[upgrade.category]=Math.max(this.level(state,upgrade.category),upgrade.level);state.company.tech[upgrade.category]=Math.max(this.companyLevel(state,upgrade.category),upgrade.level);}deployment.status="complete";deployment.completedAbsoluteDay=today;return deployment;}
  processDay(state){
    this.ensure(state);if(state.status==="dead")return[];const today=this.absoluteDay(state),events=[];
    for(const deployment of engineeringDeployments(state)){
      if(FINAL_DEPLOYMENT_STATES.has(deployment.status)||deployment.lastProcessedAbsoluteDay===today)continue;deployment.lastProcessedAbsoluteDay=today;
      if(deployment.status==="batching"){deployment.status="preparing";deployment.preparationDaysRemaining=CONFIG.ENGINEERING_PREPARATION_DAYS;deployment.preparationStartedAbsoluteDay=today+1;events.push({type:"engineering-preparing",deployment});continue;}
      if(deployment.status==="preparing"){
        deployment.preparationDaysRemaining=Math.max(0,Math.floor(Number(deployment.preparationDaysRemaining)||0)-1);
        if(deployment.preparationDaysRemaining<=0){deployment.status="in-transit";deployment.departedAbsoluteDay=today;deployment.travelDays=this.engineeringTravelDays(state,deployment);deployment.travelDaysRemaining=deployment.travelDays;events.push({type:"engineering-dispatched",deployment});}
        continue;
      }
      if(deployment.status==="in-transit"){
        deployment.travelDaysRemaining=Math.max(0,Math.floor(Number(deployment.travelDaysRemaining)||0)-1);if(deployment.travelDaysRemaining<=0){deployment.arrivedAbsoluteDay=today;this.landOrHold(state,deployment,today,events);}continue;
      }
      if(deployment.status==="orbital-holding"){if(hasFreeBerth(state))this.landOrHold(state,deployment,today,events);continue;}
      if(deployment.status==="landed"){deployment.status="commissioning";deployment.commissionDaysRemaining=CONFIG.ENGINEERING_COMMISSION_DAYS;deployment.commissionStartedAbsoluteDay=today;events.push({type:"engineering-commissioning",deployment});continue;}
      if(deployment.status==="commissioning"){
        deployment.commissionDaysRemaining=Math.max(0,Math.floor(Number(deployment.commissionDaysRemaining)||0)-1);if(deployment.commissionDaysRemaining<=0){this.activateDeployment(state,deployment,today);events.push({type:"engineering-complete",deployment});}continue;
      }
    }
    return events;
  }
  deploymentStatusText(deployment){
    if(!deployment)return"";if(deployment.status==="batching")return"ORDERED — BATCH OPEN";if(deployment.status==="preparing")return`PREPARING — ${Math.max(0,Number(deployment.preparationDaysRemaining)||0)}d TO DISPATCH`;if(deployment.status==="in-transit")return`IN TRANSIT — ${Math.max(0,Number(deployment.travelDaysRemaining)||0)}d`;if(deployment.status==="orbital-holding")return"ORBITAL HOLDING — WAITING FOR SPACEPORT BERTH";if(deployment.status==="landed")return"LANDED — ENGINEERING TEAM READY";if(deployment.status==="commissioning")return`COMMISSIONING — ${Math.max(0,Number(deployment.commissionDaysRemaining)||0)}d`;if(deployment.status==="complete")return"COMPLETE";if(deployment.status==="cancelled")return"CANCELLED";return String(deployment.status||"").toUpperCase();
  }
  recompute(state){
    this.ensure(state);state.metrics||={};const totals=syncBuildingTotals(state),power=this.current(state,"power"),food=this.current(state,"food"),industry=this.current(state,"industry"),mining=this.current(state,"mining"),scanning=this.current(state,"scanning"),ml=this.level(state,"mining"),sl=this.level(state,"scanning"),fl=this.level(state,"food"),il=this.level(state,"industry"),slots=clamp(Number(scanning?.surveySlots)||1,1,5),scan=Math.max(.5,Number(scanning?.scanTimeFactor)||1),hint=clamp(Number(scanning?.hintTier)||0,0,3);
    const foodWorkforceEfficiency=Math.max(.70,1-(fl-1)*.06),miningWorkforceEfficiency=mining?.workforceEfficiency??Math.max(.65,1-(ml-1)*.04),industryWorkforceEfficiency=industry?.workforceEfficiency??1,industryOreEfficiency=industry?.oreEfficiency??1,industryProcessingEfficiency=industry?.processingEfficiency??1;
    Object.assign(state.metrics,{
      housingTech:this.level(state,"housing"),powerTech:this.level(state,"power"),foodTech:fl,industryTech:il,miningTech:ml,scanningTech:sl,
      powerCapacity:totals.power,powerPopulationCap:totals.housing,powerIndustryCap:Number.MAX_SAFE_INTEGER,
      fuelIntensity:power?.fuelIntensity??.1,foodProductionMultiplier:food?.productionMultiplier??1,foodWorkforceEfficiency,miningWorkforceEfficiency,industryWorkforceEfficiency,industryOreEfficiency,industryProcessingEfficiency,
      syntheticFood:food?.syntheticFood??0,foodMult:1,miningMult:1,fm:1,im:1,sl,sf:scan,hint,slots
    });
    return state.metrics;
  }
  buy(state,category){return this.orderUpgrade(state,category);}
}
