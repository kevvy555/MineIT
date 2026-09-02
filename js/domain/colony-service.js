import { CONFIG } from "../core/config.js";
import { clamp } from "../core/utils.js";
import {
  syncBuildingTotals, localBuildings, buildingCapacity, buildingLevel,
  HEADQUARTERS_CAPACITY, HEADQUARTERS_MINIMUM_STAFF, HEADQUARTERS_POWER_DEMAND,
  HEADQUARTERS_BONUS_PER_LEVEL, HEADQUARTERS_BONUS_CAP,
  HEADQUARTERS_OVERLOAD_PENALTY_CAP, HEADQUARTERS_OVERLOAD_PENALTY_PER_RATIO,
  HEADQUARTERS_COMMAND_LOAD, BASIC_SPACEPORT_POWER, HOUSING_FIXED_POWER,
  INDUSTRY_IDLE_POWER, INDUSTRY_VARIABLE_POWER_PER_CAPACITY, FACILITY_POWER_DEMAND
} from "./building-model.js";
import { supportsOverdrive,workforceMultiplier,isAccidentShutdown } from "./extraction-overdrive.js";

const SITE_POWER=[1,2,4,7,11];
const stableKey=tile=>String(tile?.id||tile?.key||`${tile?.x??0},${tile?.y??0}`);
const familyFor=tile=>{
  if(tile?.development?.family)return tile.development.family;
  if(tile?.type==="food"){if(tile.resourceId==="herd")return"ranch";if(tile.resourceId==="thermal")return"algae";if(["fungal","protein"].includes(tile.resourceId))return"bio";return"farm";}
  if(tile?.type==="fuel"&&["oil","gas","brine"].includes(tile.resourceId))return"rig";
  if(tile?.type==="build")return"quarry";
  if(tile?.type==="ore"&&["diamond","exotic","crystal","advanced"].includes(tile.resourceId))return"deep-mine";
  return"mine";
};
const tileId=(state,tile)=>Object.entries(state?.tiles||{}).find(([,value])=>value===tile)?.[0]||stableKey(tile);
const tierValue=(table,level)=>table[Math.max(1,Math.min(5,Math.round(Number(level)||1)))-1]||0;

/** Canonical colony rules. Mutable data lives in game state; this service owns calculations/actions only. */
export class ColonyService{
  constructor(inventoryService,technologyService){this.inventory=inventoryService;this.technology=technologyService;}
  buildStock(state){return this.inventory.amount(state,"build");}
  addLocalCost(state,amount){state.contract.localCosts=(state.contract.localCosts||0)+Math.max(0,amount||0);}
  supportLoad(state){return Math.max(.5,Number(state.contract?.supportLoad)||1);}
  totals(state){return syncBuildingTotals(state);}
  planetaryResidentCount(state){const assignments=state.colony?.shipAccommodation||{};const aboard=Object.values(assignments).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0);return Math.max(0,(Number(state.pop)||0)-aboard);}
  populationCapacity(state){return Math.max(0,this.totals(state).housing);}
  industryPopulationRequirement(installedOrState){const isState=installedOrState&&typeof installedOrState==="object",installed=isState?this.totals(installedOrState).industry:Math.max(0,Number(installedOrState)||0),efficiency=isState?(installedOrState.metrics?.industryWorkforceEfficiency||1):1;return Math.max(40,Math.round(installed*.8*efficiency));}
  industryPopulationFactor(state){const required=this.industryPopulationRequirement(state);return clamp(this.planetaryResidentCount(state)/Math.max(1,required),0,1);}
  siteIndustryLoad(tile){const level=Math.max(1,Math.round(Number(tile?.level)||1));return Math.round(CONFIG.INDUSTRY_SITE_LOAD_BASE*Math.pow(CONFIG.INDUSTRY_SITE_LOAD_GROWTH,level-1));}
  industryOperationalCapacity(state){if(state.status==="dead"||state.colony?.emergencyMode)return 0;const installed=this.totals(state).industry;return Math.max(0,installed*this.industryPopulationFactor(state));}
  industryNetwork(state,sites=[]){const capacity=this.industryOperationalCapacity(state);let survivalLoad=0,commercialLoad=0;for(const tile of sites){const load=this.siteIndustryLoad(tile);if(tile.type==="food"||tile.type==="fuel")survivalLoad+=load;else commercialLoad+=load;}const survivalFactor=survivalLoad>0?clamp(capacity/survivalLoad,0,1):1,remaining=Math.max(0,capacity-survivalLoad),commercialFactor=state.colony?.emergencyMode?0:commercialLoad>0?clamp(remaining/commercialLoad,0,1):1,totalLoad=survivalLoad+commercialLoad;return{industryCapacity:capacity,industryLoad:totalLoad,industrySurvivalLoad:survivalLoad,industryCommercialLoad:commercialLoad,industrySurvivalFactor:survivalFactor,industryCommercialFactor:commercialFactor,industryOverloaded:totalLoad>capacity+.001};}
  baseWorkforceAvailable(state){if(state.status==="dead"||Math.max(0,Number(state.colony?.foodStarvationDays)||0)>0)return 0;return Math.max(0,Math.floor(this.planetaryResidentCount(state)*CONFIG.WORKFORCE_SHARE));}
  headquartersRows(state){return localBuildings(state,"headquarters").map(tile=>{const id=tileId(state,tile),level=buildingLevel(tile.development),requiredStaff=tierValue(HEADQUARTERS_MINIMUM_STAFF,level);return{id,tile,level,capacity:tierValue(HEADQUARTERS_CAPACITY,level),requiredStaff,requiredPower:tierValue(HEADQUARTERS_POWER_DEMAND,level),constructed:tile.development?.constructionComplete!==false};}).sort((a,b)=>a.id.localeCompare(b.id));}
  headquartersStaffing(state){
    state.colony||={};const rows=this.headquartersRows(state),available=this.baseWorkforceAvailable(state),stored=state.colony.primaryHeadquartersId;
    const primary=rows.find(row=>row.id===stored);
    if(stored&&!primary)state.colony.primaryHeadquartersId=null;
    const candidate=primary||(!state.colony.primaryHeadquartersEver?rows[0]:null);
    const ordered=[...(candidate?[candidate]:[]),...rows.filter(row=>row.id!==candidate?.id).sort((a,b)=>b.level-a.level||a.id.localeCompare(b.id))];
    let remaining=available,reserved=0;
    for(const row of rows)row.staffed=false,row.staff=0;
    for(const row of ordered){if(!row.constructed||remaining<row.requiredStaff)continue;row.staffed=true;row.staff=row.requiredStaff;remaining-=row.requiredStaff;reserved+=row.requiredStaff;if(!state.colony.primaryHeadquartersId&&!state.colony.primaryHeadquartersEver){state.colony.primaryHeadquartersId=row.id;state.colony.primaryHeadquartersEver=true;}}
    return{rows,available,reserved,remaining,primaryId:state.colony.primaryHeadquartersId||null};
  }
  headquartersBonus(rows){const active=[...rows].filter(row=>row.staffed&&row.powered).sort((a,b)=>b.level-a.level||a.id.localeCompare(b.id));let sum=0;for(let i=0;i<active.length;i++){const diminishing=i===0?1:i===1?.5:i===2?.25:.125;sum+=diminishing*active[i].level*HEADQUARTERS_BONUS_PER_LEVEL;}return Math.min(HEADQUARTERS_BONUS_CAP,sum);}
  commandLoad(state){
    let load=0;for(const tile of Object.values(state.tiles||{})){const dev=tile.development;if(!dev||tile.depleted||dev.kind==="headquarters")continue;let weight=0;if(dev.kind==="housing")weight=HEADQUARTERS_COMMAND_LOAD.housing;else if(dev.kind==="power")weight=HEADQUARTERS_COMMAND_LOAD.power;else if(dev.kind==="industry")weight=HEADQUARTERS_COMMAND_LOAD.industry;else if(dev.kind==="extract")weight=tile.type==="ore"?HEADQUARTERS_COMMAND_LOAD.ore:(HEADQUARTERS_COMMAND_LOAD[tile.type]||2);load+=weight*tierValue([1,2,3,4,5],dev.level);}
    return load;
  }
  commandCapableShips(state){const ships=state.company?.expansion?.ships||[];return ships.filter(ship=>ship.status==="docked"&&ship.colonyId===state.colonyId&&ship.commandCapable===true&&Number(ship.crew||0)>=Math.max(0,Number(ship.minimumCrew)||0));}
  powerDemandBreakdown(state){
    const totals=this.totals(state),staffFactor=this.industryPopulationFactor(state),planetary=this.planetaryResidentCount(state),supportLoad=this.supportLoad(state),emergency=!!state.colony?.emergencyMode,activeSites=this.workforceSites(state),industryNetwork=this.industryNetwork(state,activeSites);
    const hq=this.headquartersRows(state).filter(row=>row.constructed).map(row=>({id:row.id,tile:row.tile,level:row.level,requested:row.requiredPower,priority:"headquarters",binary:true}));
    const housing=localBuildings(state,"housing").filter(tile=>!tile.development?.productionStopped).map(tile=>({id:tileId(state,tile),tile,requested:tierValue(HOUSING_FIXED_POWER,tile.development.level),priority:"life-support",binary:false}));
    const lifeSupport=Math.max(0,planetary)*CONFIG.LIFE_SUPPORT_POWER_PER_COLONIST*supportLoad*(emergency?CONFIG.EMERGENCY_LIFE_SUPPORT_MULTIPLIER:1);
    const industry=[];for(const tile of localBuildings(state,"industry")){if(tile.development?.productionStopped)continue;const level=buildingLevel(tile.development),idle=tierValue(INDUSTRY_IDLE_POWER,level),capacity=buildingCapacity("industry",level),variable=emergency?0:capacity*staffFactor*INDUSTRY_VARIABLE_POWER_PER_CAPACITY;industry.push({id:tileId(state,tile),tile,requested:idle+variable,idle,variable,binary:false});}
    if(totals.shipIndustry>0&&!emergency){const variable=totals.shipIndustry*staffFactor*INDUSTRY_VARIABLE_POWER_PER_CAPACITY;industry.push({id:"founding-ship-industry",tile:null,requested:variable,idle:0,variable,binary:false});}
    const operationalIndustry=Math.max(0,industryNetwork.industryCapacity),survivalIndustry=Math.min(operationalIndustry,industryNetwork.industrySurvivalLoad),survivalIndustryShare=operationalIndustry>0?survivalIndustry/operationalIndustry:0;
    const industrySurvival=industry.map(row=>({...row,id:`${row.id}:survival`,sourceId:row.id,requested:row.requested*survivalIndustryShare,priority:"survival"})).filter(row=>row.requested>0);
    const industryCommercial=industry.map(row=>({...row,id:`${row.id}:commercial`,sourceId:row.id,requested:row.requested*(1-survivalIndustryShare),priority:"commercial"})).filter(row=>row.requested>0);
    const sites=[];for(const tile of activeSites){const requested=tierValue(FACILITY_POWER_DEMAND[familyFor(tile)]||FACILITY_POWER_DEMAND.mine,tile.level);sites.push({id:tileId(state,tile),tile,requested,priority:["food","fuel"].includes(tile.type)?"survival":"commercial",binary:false});}
    return{totals,headquarters:hq,lifeSupport:lifeSupport+housing.reduce((s,row)=>s+row.requested,0),housing,industry,industrySurvival,industryCommercial,sites,spaceport:{id:"spaceport",requested:BASIC_SPACEPORT_POWER,priority:"spaceport",binary:true},planetaryResidents:planetary,staffFactor,requested:hq.reduce((s,r)=>s+r.requested,0)+lifeSupport+housing.reduce((s,r)=>s+r.requested,0)+industry.reduce((s,r)=>s+r.requested,0)+sites.reduce((s,r)=>s+r.requested,0)+BASIC_SPACEPORT_POWER};
  }
  powerNetwork(state,{fuelStock=null}={}){
    const b=this.powerDemandBreakdown(state),onlineCapacity=Math.max(0,b.totals.power),intensity=Math.max(.001,Number(state.metrics?.fuelIntensity)||.1),fullFuelBurn=onlineCapacity*intensity,storedFuel=fuelStock===null?(this.inventory?.amount(state,"fuel")||0):Math.max(0,Number(fuelStock)||0),fuelRatio=fullFuelBurn>0?clamp(storedFuel/fullFuelBurn,0,1):0,available=onlineCapacity*fuelRatio,delivered={headquarters:0,"life-support":0,survival:0,spaceport:0,commercial:0},rows=[];
    const allocateProportional=(band,items,capacity)=>{const total=items.reduce((s,r)=>s+r.requested,0),factor=total>0?clamp(capacity/total,0,1):1;for(const row of items){row.delivered=row.requested*factor;row.factor=factor;rows.push({id:row.id,priority:band,requested:row.requested,delivered:row.delivered,factor});}delivered[band]+=Math.min(capacity,total);return{used:Math.min(capacity,total),factor,total};};
    let remaining=available;
    const staffing=this.headquartersStaffing(state),primaryId=staffing.primaryId,staffById=new Map(staffing.rows.map(row=>[row.id,row])),hqRows=[...b.headquarters].sort((a,z)=>(a.id===primaryId?-1:z.id===primaryId?1:z.level-a.level||a.id.localeCompare(z.id)));let headquartersConnected=this.commandCapableShips(state).length>0;for(const row of hqRows){const staffed=staffById.get(row.id)?.staffed===true;if(!staffed||(row.id!==primaryId&&!headquartersConnected)){row.delivered=0;row.factor=0;continue;}row.delivered=remaining>=row.requested?row.requested:0;row.factor=row.delivered>0?1:0;if(row.delivered)remaining-=row.delivered;rows.push({id:row.id,priority:"headquarters",requested:row.requested,delivered:row.delivered,factor:row.factor});delivered.headquarters+=row.delivered;if(row.id===primaryId&&row.factor===1)headquartersConnected=true;}
    const life=allocateProportional("life-support",[...b.housing,{id:"resident-life-support",requested:Math.max(0,b.lifeSupport-b.housing.reduce((s,r)=>s+r.requested,0)),tile:null}],remaining);remaining-=life.used;
    const survival=allocateProportional("survival",[...b.sites.filter(row=>row.priority==="survival"),...b.industrySurvival],remaining);remaining-=survival.used;
    const space= b.spaceport;space.delivered=remaining>=space.requested?space.requested:0;space.factor=space.delivered?1:0;rows.push({id:space.id,priority:"spaceport",requested:space.requested,delivered:space.delivered,factor:space.factor});delivered.spaceport+=space.delivered;remaining-=space.delivered;
    const commercial=allocateProportional("commercial",[...b.industryCommercial,...b.sites.filter(row=>row.priority==="commercial")],remaining);remaining-=commercial.used;
    for(const row of b.headquarters){const assigned=rows.find(item=>item.id===row.id);row.delivered=assigned?.delivered||0;row.factor=assigned?.factor||0;row.powered=row.delivered>=row.requested&&row.requested>0;}
    const demand=rows.reduce((sum,row)=>sum+row.requested,0),unused=Math.max(0,remaining),totalDelivered=available-unused,bandRows=["headquarters","life-support","survival","spaceport","commercial"].map(priority=>{const requested=rows.filter(row=>row.priority===priority).reduce((s,r)=>s+r.requested,0),got=rows.filter(row=>row.priority===priority).reduce((s,r)=>s+r.delivered,0);return{priority,requested,delivered:got,shortage:Math.max(0,requested-got),factor:requested>0?got/requested:1};}),industryRows=rows.filter(row=>row.id.endsWith(":survival")||row.id.endsWith(":commercial")),industryRequested=industryRows.reduce((sum,row)=>sum+row.requested,0),industryDelivered=industryRows.reduce((sum,row)=>sum+row.delivered,0),limitingCause=onlineCapacity<=0?"No online Power Plant":fuelRatio<1?"Stored Fuel limits generation":totalDelivered+0.001<demand?"Online generation is below demand":"None";
    return{...b,onlineCapacity,fuelRatio,fullFuelBurn,fuelLimitedGeneration:available,availableGeneration:available,deliveredGeneration:totalDelivered,unusedGeneration:unused,shortage:Math.max(0,demand-totalDelivered),rows,bandRows,demand,generated:totalDelivered,lifeSupportPowerFactor:bandRows.find(row=>row.priority==="life-support")?.factor??1,industryPowerFactor:industryRequested>0?industryDelivered/industryRequested:1,limitingCause};
  }
  headquartersNetwork(state,{fuelStock=null}={}){
    const staffing=this.headquartersStaffing(state),power=this.powerNetwork(state,{fuelStock}),rows=staffing.rows.map(row=>{const delivered=power.headquarters.find(item=>item.id===row.id)?.delivered||0;return{...row,eligibleForPrimary:row.constructed&&row.staffed,powered:row.constructed&&delivered>=row.requiredPower&&row.requiredPower>0};});
    const primary=rows.find(row=>row.id===state.colony?.primaryHeadquartersId),primaryOperational=!!primary?.constructed&&primary.staffed&&primary.powered;
    const ship=this.commandCapableShips(state).find(item=>item.id===state.colony?.commandShipId)||this.commandCapableShips(state)[0]||null;
    const source=primaryOperational?{type:"headquarters",id:primary.id}:ship?{type:"ship",id:ship.id}:null;
    if(!source)for(const row of rows){if(row.id===primary?.id)continue;row.staffed=false;row.staff=0;}
    const reserved=rows.reduce((sum,row)=>sum+(row.staffed?row.staff:0),0),remaining=Math.max(0,staffing.available-reserved);
    const active=source?[...rows].filter(row=>row.staffed&&row.powered):[];
    const hqCapacity=source?.type==="ship"?16+active.filter(row=>row.id!==primary?.id).reduce((s,row)=>s+tierValue(HEADQUARTERS_CAPACITY,row.level),0):active.reduce((s,row)=>s+tierValue(HEADQUARTERS_CAPACITY,row.level),0);
    const bonus=source?.type==="ship"?this.headquartersBonus(active.filter(row=>row.id!==primary?.id)):this.headquartersBonus(active),load=this.commandLoad(state),overload= hqCapacity>0?Math.max(0,load/hqCapacity-1):load>0?1:0,penalty=Math.min(HEADQUARTERS_OVERLOAD_PENALTY_CAP,overload*HEADQUARTERS_OVERLOAD_PENALTY_PER_RATIO),efficiency=clamp(1+bonus-penalty,0,.15+1);
    return{...staffing,rows,reserved,remaining,power,primary,primaryOperational,source,activeHeadquarters:active,capacity:hqCapacity,load,overloadRatio:overload,overloadPenalty:penalty,bonus,efficiency,commandEfficiency:efficiency,disconnected:!source};
  }
  commandStatus(state,options={}){return this.headquartersNetwork(state,options);}
  setPrimaryHeadquarters(state,tile){
    const id=tileId(state,tile),staffing=this.headquartersStaffing(state),row=staffing.rows.find(item=>item.id===id);
    if(!row?.constructed||!row.staffed)return{ok:false,reason:"Primary Headquarters must be fully constructed and staffed."};
    state.colony.primaryHeadquartersId=id;state.colony.primaryHeadquartersEver=true;return{ok:true,id};
  }
  workforceAvailable(state){return Math.max(0,this.baseWorkforceAvailable(state)-this.headquartersNetwork(state).reserved);}
  baseSiteWorkforce(state,tile,levelOverride=null){const level=Math.max(1,Math.round(Number(levelOverride??tile?.level)||1)),miningLevel=Math.max(1,Number(tile?.requiredMiningLevel)||1),complexity=1+.18*(miningLevel-1),efficiency=tile?.type==="food"?(state.metrics.foodWorkforceEfficiency||1):(state.metrics.miningWorkforceEfficiency||1),intensity=tile?.sustainability==="renewable"||tile?.type==="food"||tile?.resourceId==="biomass"||tile?.resourceId==="fiber"?clamp(Number(tile?.harvestIntensity)||1,.25,2):1,intensityFactor=.5+.5*intensity;return Math.max(1,Math.ceil(CONFIG.SITE_WORKFORCE_BASE*Math.pow(CONFIG.SITE_WORKFORCE_GROWTH,level-1)*complexity*efficiency*intensityFactor));}
  siteWorkforce(state,tile,levelOverride=null,modeOverride=null){const base=this.baseSiteWorkforce(state,tile,levelOverride);return supportsOverdrive(tile)?Math.max(1,Math.ceil(base*workforceMultiplier(tile,modeOverride))):base;}
  workforceSites(state){if(state.contract?.ended||state.status==="dead")return[];let sites=Object.values(state.tiles||{}).filter(tile=>tile.developed&&!tile.depleted&&!tile.productionStopped&&!isAccidentShutdown(tile));if(state.colony?.emergencyMode)sites=sites.filter(tile=>tile.type==="food"||tile.type==="fuel");return sites;}
  workforceNetwork(state,sites=this.workforceSites(state)){const available=this.workforceAvailable(state);let survivalRequired=0,commercialRequired=0;for(const tile of sites){const required=this.siteWorkforce(state,tile);if(tile.type==="food"||tile.type==="fuel")survivalRequired+=required;else commercialRequired+=required;}const survivalFactor=survivalRequired>0?clamp(available/survivalRequired,0,1):1,remaining=Math.max(0,available-survivalRequired),commercialFactor=state.colony?.emergencyMode?0:commercialRequired>0?clamp(remaining/commercialRequired,0,1):1,required=survivalRequired+commercialRequired;return{workforceAvailable:available,workforceRequired:required,workforceSurvivalRequired:survivalRequired,workforceCommercialRequired:commercialRequired,workforceSurvivalFactor:survivalFactor,workforceCommercialFactor:commercialFactor,workforceFree:Math.max(0,available-required),workforceShortfall:Math.max(0,required-available)};}
  freeWorkforce(state){return this.workforceNetwork(state).workforceFree;}
  canAdjustHarvestIntensity(state,tile,deltaPercent){if((Number(deltaPercent)||0)<=0)return{ok:true,additionalWorkforce:0};const before=clamp(Number(tile?.harvestIntensity)||1,.25,2),after=clamp(before+(Number(deltaPercent)||0)/100,.25,2);if(after<=before)return{ok:true,additionalWorkforce:0};const current=this.siteWorkforce(state,tile),next=this.siteWorkforce(state,{...tile,harvestIntensity:after}),additional=Math.max(0,next-current),free=this.freeWorkforce(state);if(additional>free)return{ok:false,reason:`Need ${additional} more workforce; only ${free} is free.`,additionalWorkforce:additional,freeWorkforce:free};return{ok:true,additionalWorkforce:additional,freeWorkforce:free};}
  canStopProduction(tile){const kind=tile?.development?.kind;if(kind==="extract")return{ok:true};if(kind==="power"||kind==="industry")return{ok:true};return{ok:false,reason:"This building has no production process to stop."};}
  setProductionStopped(state,tile,stopped=true){if(state.status==="dead")return{ok:false,reason:"This colony has been lost."};const check=this.canStopProduction(tile);if(!check.ok)return check;const value=!!stopped;if(tile.development.kind==="extract")tile.productionStopped=value;else tile.development.productionStopped=value;return{ok:true,stopped:value};}
  baseProcessingBonus(industryValue){const value=Math.max(0,Number(industryValue)||0),points=[[100,0],[200,.05],[300,.10],[500,.20],[1000,.35],[2000,CONFIG.INDUSTRY_PROCESSING_MAX_BONUS]];if(value<=points[0][0])return 0;for(let i=1;i<points.length;i++){const [hi,bonus]=points[i],[lo,loBonus]=points[i-1];if(value<=hi){const t=(value-lo)/(hi-lo);return loBonus+t*(bonus-loBonus);}}return CONFIG.INDUSTRY_PROCESSING_MAX_BONUS;}
  processingBonus(industryValue,state=null){const efficiency=state?.metrics?.industryProcessingEfficiency||1,command=state?.metrics?.commandEfficiency||1;return Math.min(CONFIG.INDUSTRY_PROCESSING_MAX_BONUS,this.baseProcessingBonus(Math.max(0,Number(industryValue)||0))*efficiency*command);}
  processingMultiplier(state){return 1+this.processingBonus(state.metrics?.industry||0,state);}
  siteUpgradeIndustryRequirement(siteLevel){return[0,0,150,300,550,900][Math.max(1,Math.min(5,Number(siteLevel)||1))]||0;}
  sitePowerDemand(tile){const level=Math.max(1,Math.min(5,Math.round(Number(tile?.level)||1)));return tierValue(FACILITY_POWER_DEMAND[familyFor(tile)]||SITE_POWER,level);}
  housingBuildCost(state){return Math.round(CONFIG.HOUSING_BASE_BUILD*Math.pow(1.55,Math.max(0,(state.colony?.housingLevel||1)-1)));}
  housingCashCost(){return 0;}
  industryBuildCost(state){return Math.round(CONFIG.INDUSTRY_BASE_BUILD*Math.pow(1.55,Math.max(0,(state.colony?.industryLevel||1)-1)));}
  industryCashCost(){return 0;}
  canExpandHousing(){return{ok:false,reason:"Housing is constructed as individual map buildings."};}
  canExpandIndustry(){return{ok:false,reason:"Industry is constructed as individual map buildings."};}
  expandHousing(){return this.canExpandHousing();}
  expandIndustry(){return this.canExpandIndustry();}
  foodDemandForPopulation(state,population=null){const residents=population===null?this.planetaryResidentCount(state):Math.max(0,Number(population)||0);return state.status==="dead"||residents<=0?0:Math.max(.1,residents*CONFIG.FOOD_PER_COLONIST);}
  foodForecast(state,{additionalPopulation=0,population=null,production=state.metrics?.food,stock=null}={}){const projectedPopulation=Math.max(0,Number(population??this.planetaryResidentCount(state))||0)+Math.max(0,Number(additionalPopulation)||0),foodStock=stock===null?(this.inventory?.amount(state,"food")||0):Math.max(0,Number(stock)||0),foodProduction=Math.max(0,Number(production)||0),foodDemand=this.foodDemandForPopulation(state,projectedPopulation),net=foodProduction-foodDemand;return{population:projectedPopulation,stock:foodStock,production:foodProduction,demand:foodDemand,net,daysRemaining:this.supplyDays(foodStock,foodProduction,foodDemand)};}
  demand(state,{fuelStock=null}={}){const network=this.powerNetwork(state,{fuelStock}),totals=network.totals,staffFactor=this.industryPopulationFactor(state),populationRequired=this.industryPopulationRequirement(state),fuelDemand=network.fullFuelBurn,oreEfficiency=state.metrics.industryOreEfficiency||1,staffedIndustry=state.colony?.emergencyMode?0:totals.industry*staffFactor;return{powerDemand:network.demand,capacity:totals.power,capacityFactor:network.availableGeneration>0?clamp(network.deliveredGeneration/Math.max(.1,network.demand),0,1):0,foodDemand:this.foodDemandForPopulation(state),fuelDemand,oreDemand:state.colony?.emergencyMode?0:Math.max(.05,staffedIndustry*(CONFIG.ORE_PER_INDUSTRY_LEVEL/100)*oreEfficiency),staffFactor,populationRequired,supportLoad:this.supportLoad(state),installedIndustry:totals.industry,powerNetwork:network,fullFuelBurn:network.fullFuelBurn,fuelLimitedGeneration:network.fuelLimitedGeneration,deliveredGeneration:network.deliveredGeneration};}
  operatingCost(){return 0;}
  supplyDays(stock,production,demand){const deficit=Math.max(0,(Number(demand)||0)-(Number(production)||0));return deficit<=.0001?null:Math.max(0,(Number(stock)||0)/deficit);}
  relocationCost(state){const totals=this.totals(state);return Math.round(CONFIG.RELOCATION_BASE_COST+(Number(state.pop)||0)*CONFIG.RELOCATION_PER_COLONIST+totals.industry*(CONFIG.RELOCATION_PER_INDUSTRY_LEVEL/100));}
  syntheticFoodRate(state){return state.contract.naturalFood===false?(state.metrics.syntheticFood||0):Math.max(0,(state.metrics.syntheticFood||0)*.35);}
}
