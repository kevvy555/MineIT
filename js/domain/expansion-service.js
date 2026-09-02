import { CONFIG } from "../core/config.js";
import { CONTRACT_ARCHETYPES } from "../data/contracts.js";
import { hashString, seededRandom } from "../core/utils.js";
import { berthStatusForColony } from "./spaceport-model.js";
import { builtCapacity } from "./building-model.js";

export const EXPANSION_VERSION=3;
export const HOME_SYSTEM_ID="corporate-home";
export const FIRST_COLONY_SYSTEM_ID="koplin-frontier";
export const PROBE_UNLOCK_INDUSTRY_LEVEL=3;
export const PROBE_COST=Object.freeze({build:180,ore:120,fuel:60});

// Legacy starter-ship constants remain exported because existing UI/tests import them.
// Runtime capacity and performance now resolve from the selected player ship instance.
export const PLAYER_SHIP_CAPACITY=12000;
export const PLAYER_SHIP_CARGO_CAPACITY=8000;
export const PLAYER_SHIP_FOOD_CAPACITY=2000;
export const PLAYER_SHIP_FUEL_CAPACITY=2000;
export const PLAYER_SHIP_PASSENGERS=250;
export const PLAYER_SHIP_MIN_PASSENGERS=10;
export const PLAYER_SHIP_MIN_CREW=10;
export const CORPORATE_SERVICE_RADIUS_LY=4;
export const MIN_NEARBY_FRONTIER_SYSTEMS=2;
export const SHIP_SPEED_LY_PER_YEAR=5;
export const SHIP_FUEL_PER_LY=260;
export const PROBE_DAYS_PER_LY=32;

export const STARTER_SHIP_CLASS_ID="ship-class-asterion-pioneer-colony-transport";
export const STARTER_SHIP_ID="player-ship-1";

const clone=value=>JSON.parse(JSON.stringify(value));
const absoluteDay=state=>(Math.max(1,Number(state.year)||1)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,Number(state.day)||1);
const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const starTypes=["G-type yellow","K-type orange","F-type white","M-type red dwarf","A-type blue-white","Binary K/M"];
const names=["Aster","Borealis","Cinder","Draco","Erebus","Fornax","Gaia","Helios","Icarus","Juno","Kepler","Lyra","Meridian","Nysa","Orion","Pavo","Quillon","Rhea","Solis","Tethys","Umbra","Vega","Warden","Xanthe","Ymir","Zephyr"];
const archById=id=>CONTRACT_ARCHETYPES.find(a=>a.id===id)||CONTRACT_ARCHETYPES[0];

function bandRank(key){return["common","good","excellent","exceptional","rare","extraordinary"].indexOf(key);}
function syncEntry(entry){entry.qualityBands||={};entry.amount=Object.values(entry.qualityBands).reduce((sum,band)=>sum+Math.max(0,Number(band.amount)||0),0);return entry;}
function addBand(target,key,amount){if(amount<=0)return;target.qualityBands||={};target.qualityBands[key]||={amount:0};target.qualityBands[key].amount=Math.max(0,Number(target.qualityBands[key].amount)||0)+amount;syncEntry(target);}
function takeEntry(entry,requested){
  let remaining=Math.min(Math.max(0,Number(requested)||0),Math.max(0,Number(entry?.amount)||0)),taken=0;const bands={};
  const rows=Object.entries(entry?.qualityBands||{}).sort((a,b)=>bandRank(a[0])-bandRank(b[0]));
  for(const[key,band]of rows){if(remaining<=0)break;const qty=Math.min(Math.max(0,Number(band.amount)||0),remaining);if(qty<=0)continue;band.amount-=qty;remaining-=qty;taken+=qty;bands[key]={amount:qty};}
  syncEntry(entry);return{taken,bands};
}
function ensureCargoEntry(container,source){container[source.key]||={key:source.key,type:source.type,resourceId:source.resourceId,name:source.name,category:source.category,amount:0,qualityBands:{}};return container[source.key];}
function totalEntries(container){return Object.values(container||{}).reduce((sum,e)=>sum+Math.max(0,Number(syncEntry(e).amount)||0),0);}
function categoryAmount(container,type){return Object.values(container||{}).filter(e=>e.type===type).reduce((sum,e)=>sum+Math.max(0,Number(syncEntry(e).amount)||0),0);}
function consumeContainerCategory(container,type,requested){
  let remaining=Math.max(0,Number(requested)||0),consumed=0;const entries=Object.values(container||{}).filter(e=>e.type===type);
  for(const entry of entries){if(remaining<=0)break;const r=takeEntry(entry,remaining);remaining-=r.taken;consumed+=r.taken;}
  return{requested:Math.max(0,Number(requested)||0),consumed,ratio:requested>0?Math.min(1,consumed/requested):1};
}
function transferExact(sourceContainer,targetContainer,key,amount){
  const source=sourceContainer?.[key];if(!source)return 0;const r=takeEntry(source,amount);if(r.taken<=0)return 0;const target=ensureCargoEntry(targetContainer,source);for(const[bandKey,band]of Object.entries(r.bands))addBand(target,bandKey,band.amount);return r.taken;
}
function indicator(stars,random){const n=clamp(Math.round(Number(stars)||1)+(random()<.28?(random()<.5?-1:1):0),1,5);return["Very Low","Low","Moderate","High","Very High"][n-1];}
function finiteOr(value,fallback){return Number.isFinite(Number(value))?Number(value):fallback;}
function parseShipArgs(args,count){
  // Existing callers omit shipId. New fleet-aware callers may pass shipId first.
  if(args.length===count)return{shipId:null,values:args};
  return{shipId:args[0]??null,values:args.slice(1)};
}

export class ExpansionService{
  constructor(inventoryService=null,resourceService=null,contractService=null){this.inventory=inventoryService;this.resources=resourceService;this.contracts=contractService;}
  absoluteDay(state){return absoluteDay(state);}

  ensureGameOverAccessor(company){
    // Ship loss is no longer intrinsically corporation game-over in a fleet era.
    if(company.__shipGameOverAccessor)return;
    const existing=!!company.gameOver;
    Object.defineProperty(company,"_baseGameOver",{value:existing,writable:true,enumerable:false,configurable:true});
    Object.defineProperty(company,"gameOver",{enumerable:true,configurable:true,get(){return!!this._baseGameOver;},set(value){this._baseGameOver=!!value;}});
    Object.defineProperty(company,"__shipGameOverAccessor",{value:true,writable:true,enumerable:false,configurable:true});
  }

  starterShipSpec(){
    return{
      shipClassId:STARTER_SHIP_CLASS_ID,
      name:"Pioneer Colony Transport",
      source:"charter-issued",
      cargoCapacity:PLAYER_SHIP_CARGO_CAPACITY,
      foodCapacity:PLAYER_SHIP_FOOD_CAPACITY,
      fuelCapacity:PLAYER_SHIP_FUEL_CAPACITY,
      passengerCapacity:PLAYER_SHIP_PASSENGERS,
      minimumCrew:PLAYER_SHIP_MIN_CREW,
      maximumCrew:40,
      transitWeeksPerLightYear:CONFIG.DAYS_PER_YEAR/(SHIP_SPEED_LY_PER_YEAR*7),
      fuelUsePerLightYear:SHIP_FUEL_PER_LY,
      veCapable:true
    };
  }

  normalizeShip(ship,state,index=0){
    const starter=this.starterShipSpec(),current=ship||this.initialShip(state,index),legacyStarter=current.shipClassId==="ship-class-koplin-colony-ship";
    current.id=current.id||`player-ship-${index+1}`;
    current.shipClassId=!current.shipClassId||legacyStarter?starter.shipClassId:current.shipClassId;
    if(!current.name||(legacyStarter&&current.name==="Colony Ship"))current.name=starter.name;
    current.source=current.source||starter.source;
    current.cargo||={};current.fuelLots||={};current.foodLots||={};
    current.crew=Math.max(0,Math.floor(Number(current.crew)||0));
    current.passengers=Math.max(0,Math.floor(Number(current.passengers)||0));
    current.cargoCapacity=Math.max(0,Math.floor(finiteOr(current.cargoCapacity,starter.cargoCapacity)));
    current.foodCapacity=Math.max(0,Math.floor(finiteOr(current.foodCapacity,starter.foodCapacity)));
    current.fuelCapacity=Math.max(0,Math.floor(finiteOr(current.fuelCapacity,starter.fuelCapacity)));
    current.passengerCapacity=Math.max(0,Math.floor(finiteOr(current.passengerCapacity,starter.passengerCapacity)));
    current.minimumCrew=Math.max(0,Math.floor(finiteOr(current.minimumCrew,starter.minimumCrew)));
    current.maximumCrew=Math.max(current.minimumCrew,Math.floor(finiteOr(current.maximumCrew,starter.maximumCrew)));
    current.accommodationCapacity=Math.max(0,Math.floor(finiteOr(current.accommodationCapacity,current.passengerCapacity+current.maximumCrew)));
    current.transitWeeksPerLightYear=Math.max(.01,finiteOr(current.transitWeeksPerLightYear,starter.transitWeeksPerLightYear));
    current.fuelUsePerLightYear=Math.max(0,finiteOr(current.fuelUsePerLightYear,starter.fuelUsePerLightYear));
    current.veCapable=current.veCapable!==false;
    current.targetColonyId=current.targetColonyId||null;
    current.deliveryOrderId=current.deliveryOrderId||null;
    current.routeStartX=Number.isFinite(current.routeStartX)?current.routeStartX:null;
    current.routeStartY=Number.isFinite(current.routeStartY)?current.routeStartY:null;
    current.routeEndX=Number.isFinite(current.routeEndX)?current.routeEndX:null;
    current.routeEndY=Number.isFinite(current.routeEndY)?current.routeEndY:null;
    current.routeStartAbsoluteDay=Number.isFinite(current.routeStartAbsoluteDay)?current.routeStartAbsoluteDay:null;
    return current;
  }

  attachLegacyShipAccessor(expansion){
    const descriptor=Object.getOwnPropertyDescriptor(expansion,"ship");
    if(descriptor?.get)return;
    const stale=descriptor&&"value"in descriptor?descriptor.value:null;
    if(stale&&!expansion.ships?.length)expansion.ships=[this.normalizeShip(stale,{colonyId:stale.colonyId},0)];
    try{delete expansion.ship;}catch{}
    Object.defineProperty(expansion,"ship",{
      enumerable:false,configurable:true,
      get(){
        const active=this.ships?.find(ship=>ship.id===this.activeShipId);
        return active||this.ships?.[0]||null;
      },
      set(value){
        if(!value)return;
        const index=this.ships?.findIndex(ship=>ship.id===value.id);
        if(index>=0)this.ships[index]=value;
      }
    });
  }

  ensure(state){
    state.company||={};
    const company=state.company,seed=Math.abs(Number(state.portfolio?.colonies?.[0]?.data?.seed)||Number(state.seed)||hashString("MineIT galaxy"));
    const previous=company.expansion||{};
    const systems=previous.systems?.length?previous.systems:this.generateGalaxy(seed,state);
    const legacyShip=previous.ship;
    if(legacyShip&&previous.version<3&&legacyShip.crew===undefined){
      const legacyPeople=Math.max(0,Math.floor(Number(legacyShip.passengers)||0));
      legacyShip.crew=Math.min(PLAYER_SHIP_MIN_CREW,legacyPeople);
      legacyShip.passengers=Math.max(0,legacyPeople-legacyShip.crew);
    }
    let ships=Array.isArray(previous.ships)?previous.ships:[];
    if(!ships.length&&legacyShip)ships=[legacyShip];
    if(!ships.length)ships=[this.initialShip(state,0)];
    ships=ships.map((ship,index)=>this.normalizeShip(ship,state,index));
    const activeShipId=ships.some(ship=>ship.id===previous.activeShipId)?previous.activeShipId:ships[0].id;

    if(!company.expansion||company.expansion.version!==EXPANSION_VERSION){
      company.expansion={
        version:EXPANSION_VERSION,
        seed,
        serviceRadiusLy:CORPORATE_SERVICE_RADIUS_LY,
        probeUnlockIndustryLevel:PROBE_UNLOCK_INDUSTRY_LEVEL,
        systems,
        probes:Array.isArray(previous.probes)?previous.probes:[],
        ships,
        activeShipId,
        lastProcessedAbsoluteDay:Number(previous.lastProcessedAbsoluteDay)||0,
        notice:previous.notice||null
      };
    }else{
      company.expansion.ships=ships;
      company.expansion.activeShipId=activeShipId;
    }
    this.attachLegacyShipAccessor(company.expansion);
    this.ensureFirstColonyLocation(state);
    this.normalizeAccommodationAcrossPortfolio(state);
    this.ensureGameOverAccessor(company);
    return company.expansion;
  }

  initialShip(state,index=0){
    const spec=this.starterShipSpec();
    return{
      id:index===0?STARTER_SHIP_ID:`player-ship-${index+1}`,
      shipClassId:spec.shipClassId,name:spec.name,source:spec.source,
      cargoCapacity:spec.cargoCapacity,foodCapacity:spec.foodCapacity,fuelCapacity:spec.fuelCapacity,passengerCapacity:spec.passengerCapacity,accommodationCapacity:spec.passengerCapacity+spec.maximumCrew,
      minimumCrew:spec.minimumCrew,maximumCrew:spec.maximumCrew,transitWeeksPerLightYear:spec.transitWeeksPerLightYear,fuelUsePerLightYear:spec.fuelUsePerLightYear,veCapable:spec.veCapable,
      status:"docked",systemId:FIRST_COLONY_SYSTEM_ID,colonyId:state.colonyId||state.portfolio?.activeColonyId||null,targetSystemId:null,targetColonyId:null,
      departedAbsoluteDay:null,arrivalAbsoluteDay:null,sourceSystemId:null,sourceColonyId:null,routeStartX:null,routeStartY:null,routeEndX:null,routeEndY:null,routeStartAbsoluteDay:null,
      cargo:{},foodLots:{},fuelLots:{},crew:0,passengers:0,hasLaunched:false,awaitingDestination:false,arrivalPromptedFor:null,lostReason:null,deliveryOrderId:null
    };
  }

  createPurchasedShip(state,classRecord,{id=null,name=null,colonyId=null,orderId=null,purchase=null,status="docked"}={}){
    const ex=this.ensure(state),capacity=classRecord?.capacity||classRecord?.capacities||{},crew=classRecord?.crew||{},performance=classRecord?.performance||{},transit=classRecord?.transit||{};
    const nextId=id||`player-ship-${Math.max(1,Number(state.company?.nextShipSequence)||ex.ships.length+1)}`;
    state.company.nextShipSequence=Math.max(ex.ships.length+2,Number(state.company.nextShipSequence)||ex.ships.length+2);
    const ship=this.normalizeShip({
      id:nextId,
      shipClassId:classRecord?.id||classRecord?.shipClassId||null,
      name:name||classRecord?.name||classRecord?.model||"Purchased Ship",
      source:"manufacturer-direct",
      purchase:purchase?clone(purchase):null,
      cargoCapacity:capacity.cargo??classRecord?.cargoCapacity,
      fuelCapacity:capacity.fuel??classRecord?.fuelCapacity,
      foodCapacity:capacity.food??classRecord?.foodCapacity,
      passengerCapacity:capacity.colonists??capacity.passengers??classRecord?.colonistCapacity??classRecord?.passengerCapacity,
      accommodationCapacity:capacity.accommodation??classRecord?.accommodationCapacity,
      minimumCrew:crew.minimum??classRecord?.minimumCrew,
      maximumCrew:crew.maximum??classRecord?.maximumCrew,
      transitWeeksPerLightYear:performance.transitWeeksPerLightYear??transit.weeksPerLightYear??classRecord?.transitWeeksPerLightYear,
      fuelUsePerLightYear:performance.fuelUsePerLightYear??transit.fuelUsePerLightYear??classRecord?.fuelUsePerLightYear,
      veCapable:classRecord?.veCapable??performance.veCapable,
      status,
      systemId:colonyId?state.portfolio?.colonies?.find(entry=>entry.id===colonyId)?.data?.contract?.systemId:null,
      colonyId,
      targetSystemId:null,targetColonyId:null,
      cargo:{},foodLots:{},fuelLots:{},crew:0,passengers:0,
      hasLaunched:false,awaitingDestination:false,arrivalPromptedFor:null,lostReason:null,deliveryOrderId:orderId
    },state,ex.ships.length);
    ex.ships.push(ship);
    ex.activeShipId=ship.id;
    return ship;
  }

  ships(state){return this.ensure(state).ships;}
  ship(state,shipId=null){
    const ex=this.ensure(state);
    if(shipId)return ex.ships.find(ship=>ship.id===shipId)||null;
    return ex.ships.find(ship=>ship.id===ex.activeShipId)||ex.ships[0]||null;
  }
  selectShip(state,shipId){
    const ex=this.ensure(state),ship=ex.ships.find(item=>item.id===shipId);
    if(!ship)return{ok:false,reason:"Player ship not found."};
    ex.activeShipId=ship.id;
    return{ok:true,ship};
  }
  shipsAtColony(state,colonyId=state.colonyId){return this.ships(state).filter(ship=>ship.status==="docked"&&ship.colonyId===colonyId);}
  shipsInSystem(state,systemId){return this.ships(state).filter(ship=>ship.systemId===systemId||ship.targetSystemId===systemId);}

  accommodationAssignments(state){state.colony||={};state.colony.shipAccommodation=state.colony.shipAccommodation&&typeof state.colony.shipAccommodation==="object"?state.colony.shipAccommodation:{};return state.colony.shipAccommodation;}
  planetaryAccommodationResidentCount(state){state.colony||={};state.colony.planetaryAccommodationResidents=Math.max(0,Math.floor(Number(state.colony.planetaryAccommodationResidents)||0));return state.colony.planetaryAccommodationResidents;}
  accommodationCapacity(state,shipId=null){return Math.max(0,Number(this.ship(state,shipId)?.accommodationCapacity)||0);}
  shipResidentCount(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,Math.floor(Number(this.accommodationAssignments(state)[ship?.id])||0));}
  totalShipResidents(state){return Object.values(this.accommodationAssignments(state)).reduce((sum,value)=>sum+Math.max(0,Math.floor(Number(value)||0)),0);}
  planetaryResidentCount(state){return Math.max(0,Math.floor(Number(state.pop)||0)-this.totalShipResidents(state));}
  planetaryHousingCapacity(state){return Math.max(0,Math.floor(Number(state.colony?.housingBuildingCapacity)||0));}
  homelessCount(state){return Math.max(0,this.planetaryResidentCount(state)-this.planetaryAccommodationResidentCount(state));}
  normalizeAccommodationForLocal(root,local,colonyId,{assignLegacy=true}={}){
    if(!local)return;local.colony||={};const hadAssignments=local.colony.shipAccommodation&&typeof local.colony.shipAccommodation==="object",hadPlanetary=Number.isFinite(Number(local.colony.planetaryAccommodationResidents)),assignments=hadAssignments?local.colony.shipAccommodation:{};local.colony.shipAccommodation=assignments;
    const docked=(root.company?.expansion?.ships||[]).filter(ship=>ship.status==="docked"&&ship.colonyId===colonyId),valid=new Map(docked.map(ship=>[ship.id,Math.max(0,Math.floor(Number(ship.accommodationCapacity)||0))]));let remaining=Math.max(0,Math.floor(Number(local.pop)||0));
    for(const id of Object.keys(assignments)){const qty=Math.min(remaining,valid.get(id)||0,Math.max(0,Math.floor(Number(assignments[id])||0)));if(qty>0){assignments[id]=qty;remaining-=qty;}else delete assignments[id];}
    if(!hadAssignments&&assignLegacy)for(const ship of docked){const qty=Math.min(remaining,valid.get(ship.id)||0);if(qty<=0)continue;assignments[ship.id]=qty;remaining-=qty;}
    const planetaryCapacity=Math.max(0,Math.floor(builtCapacity(local,"housing")));local.colony.housingBuildingCapacity=planetaryCapacity;local.colony.planetaryAccommodationResidents=Math.min(remaining,planetaryCapacity,hadPlanetary?Math.max(0,Math.floor(Number(local.colony.planetaryAccommodationResidents)||0)):remaining);
  }
  normalizeAccommodationAcrossPortfolio(state){
    for(const entry of state.portfolio?.colonies||[])this.normalizeAccommodationForLocal(state,entry?.data,entry?.id);
    this.normalizeAccommodationForLocal(state,state,state.colonyId);
  }
  moveResidentsAboard(state,shipId,amount){const ship=this.ship(state,shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const assignments=this.accommodationAssignments(state),room=Math.max(0,this.accommodationCapacity(state,ship.id)-this.shipResidentCount(state,ship.id)),qty=Math.min(room,this.planetaryResidentCount(state),Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:room<=0?"Ship accommodation is full.":"No colony residents can be moved aboard."};const fromPlanetaryAccommodation=Math.max(0,qty-this.homelessCount(state));state.colony.planetaryAccommodationResidents=Math.max(0,this.planetaryAccommodationResidentCount(state)-fromPlanetaryAccommodation);assignments[ship.id]=this.shipResidentCount(state,ship.id)+qty;return{ok:true,qty,aboard:assignments[ship.id]};}
  moveResidentsAshore(state,shipId,amount,{confirmed=false}={}){const ship=this.ship(state,shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const assignments=this.accommodationAssignments(state),aboard=this.shipResidentCount(state,ship.id),free=Math.max(0,this.planetaryHousingCapacity(state)-this.planetaryAccommodationResidentCount(state)),qty=Math.min(aboard,free,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:free<=0?"No planetary accommodation is available.":"No colony residents are assigned to this ship."};const capacity=Math.max(0,Number(state.colony?.powerCapacity)||0);if(capacity<=0)return{ok:false,reason:"Build and power a colony Power Plant before moving residents into habitats."};const currentResidents=this.planetaryResidentCount(state),supportLoad=Math.max(.5,Number(state.contract?.supportLoad)||1),projectedSupport=(currentResidents+qty)*CONFIG.LIFE_SUPPORT_POWER_PER_COLONIST*supportLoad,available=Number(state.metrics?.powerFuelLimitedGeneration??capacity)||capacity;if(projectedSupport>available&& !confirmed)return{ok:false,warning:true,requiresConfirmation:true,reason:`Power shortage warning: ${qty} residents will raise life-support demand to ${projectedSupport.toFixed(1)} against ${available.toFixed(1)} available Power. Transfer anyway?`};const next=aboard-qty;if(next>0)assignments[ship.id]=next;else delete assignments[ship.id];state.colony.planetaryAccommodationResidents=this.planetaryAccommodationResidentCount(state)+qty;return{ok:true,qty,aboard:next,shortage:projectedSupport>available};}
  releaseShipAccommodation(state,shipId){const assignments=this.accommodationAssignments(state),residents=Math.max(0,Math.floor(Number(assignments[shipId])||0));delete assignments[shipId];return residents;}
  travelResidentCount(state){return Math.max(0,Math.floor(Number(state.pop)||0));}
  removeResidentsForTravel(state,shipId,amount){const qty=Math.min(this.travelResidentCount(state),Math.max(0,Math.floor(Number(amount)||0))),assignments=this.accommodationAssignments(state),homelessBefore=this.homelessCount(state);let remaining=qty;for(const id of[shipId,...Object.keys(assignments).filter(id=>id!==shipId)]){if(remaining<=0)break;const aboard=Math.max(0,Math.floor(Number(assignments[id])||0)),take=Math.min(aboard,remaining),next=aboard-take;remaining-=take;if(next>0)assignments[id]=next;else delete assignments[id];}const fromPlanetaryAccommodation=Math.max(0,remaining-homelessBefore);state.colony.planetaryAccommodationResidents=Math.max(0,this.planetaryAccommodationResidentCount(state)-fromPlanetaryAccommodation);state.pop=Math.max(0,Number(state.pop)-qty);return qty;}

  emergencyFoodState(state){state.colony||={};const current=state.colony.emergencyShipFood;if(!current||typeof current!=="object")state.colony.emergencyShipFood={shipId:null,status:"none"};return state.colony.emergencyShipFood;}
  clearEmergencyFood(state){state.colony.emergencyShipFood={shipId:null,status:"none"};return state.colony.emergencyShipFood;}
  emergencyFoodShips(state){return this.shipsAtColony(state).filter(ship=>this.transitFoodAmount(state,ship.id)>.0001);}
  emergencyFoodDecision(state){
    const decision=this.emergencyFoodState(state),ship=decision.shipId?this.ship(state,decision.shipId):null;
    if(decision.status!=="none"&&(!ship||!this.isAtActiveColony(state,ship.id)||this.transitFoodAmount(state,ship.id)<=.0001))return this.clearEmergencyFood(state);
    return decision;
  }
  requestEmergencyFood(state){const current=this.emergencyFoodDecision(state);if(current.status!=="none")return{requested:false,decision:current};const ship=this.emergencyFoodShips(state)[0];if(!ship)return{requested:false,decision:current};const decision={shipId:ship.id,status:"pending"};state.colony.emergencyShipFood=decision;return{requested:true,decision,ship,amount:this.transitFoodAmount(state,ship.id)};}
  authorizeEmergencyFood(state,shipId){const ship=this.ship(state,shipId),current=this.emergencyFoodDecision(state);if(!ship||!this.isAtActiveColony(state,ship.id)||this.transitFoodAmount(state,ship.id)<=.0001)return{ok:false,reason:"That ship can no longer supply Food."};if(current.status!=="pending"||current.shipId!==ship.id)return{ok:false,reason:"The emergency Food request is no longer pending."};state.colony.emergencyShipFood={shipId:ship.id,status:"authorized"};return{ok:true,ship};}
  declineEmergencyFood(state,shipId){const current=this.emergencyFoodDecision(state);if(current.status!=="pending"||current.shipId!==shipId)return{ok:false,reason:"The emergency Food request is no longer pending."};state.colony.emergencyShipFood={shipId,status:"declined"};return{ok:true};}
  consumeEmergencyFood(state,requested){const decision=this.emergencyFoodDecision(state);if(decision.status!=="authorized")return{requested,consumed:0,ratio:requested>0?0:1};return this.consumeTransitFood(state,requested,decision.shipId);}

  ensureFirstColonyLocation(state){
    const expansion=state.company.expansion,entries=state.portfolio?.colonies||[];
    entries.forEach((entry,index)=>{if(!entry?.data?.contract)return;let systemId=entry.data.contract.systemId;if(!systemId){systemId=index===0?FIRST_COLONY_SYSTEM_ID:(expansion.systems.filter(s=>!s.home)[Math.min(index,expansion.systems.length-2)]?.id||FIRST_COLONY_SYSTEM_ID);entry.data.contract.systemId=systemId;}const system=this.system(expansion,systemId);if(system){system.surveyed=true;system.status="colonized";let planetId=entry.data.contract.planetId;if(!planetId){planetId=index===0?"frontier-1":`legacy-${index+1}`;entry.data.contract.planetId=planetId;if(!system.planets.some(p=>p.id===planetId)){const a=archById(entry.data.contract.arch),random=seededRandom(hashString(`${expansion.seed}|legacy|${index}`));system.planets.push(this.makePlanet(planetId,`${system.name} ${this.roman(system.planets.length+1)}`,a.id,random,system.planets.length));system.planetCount=system.planets.length;}}entry.data.contract.distanceLy??=this.distanceFromHome(expansion,systemId);}});
    const active=entries.find(e=>e.id===state.colonyId);if(state.contract&&active?.data?.contract){state.contract.systemId||=active.data.contract.systemId;state.contract.planetId||=active.data.contract.planetId;state.contract.distanceLy??=active.data.contract.distanceLy;}
    const firstSystem=this.system(expansion,FIRST_COLONY_SYSTEM_ID);if(firstSystem){firstSystem.surveyed=true;firstSystem.status="colonized";}const home=this.system(expansion,HOME_SYSTEM_ID);if(home){home.surveyed=true;home.status="home";}
  }

  generateGalaxy(seed,state){
    const random=seededRandom(hashString(`${seed}|galaxy-v2`)),systems=[
      {id:HOME_SYSTEM_ID,name:"Koplin Corporate Home",x:0,y:0,starType:"G-type yellow",planetCount:1,surveyed:true,status:"home",home:true,planets:[]},
      {id:FIRST_COLONY_SYSTEM_ID,name:"Koplin Frontier",x:1.25,y:.65,starType:"K-type orange",planetCount:3,surveyed:true,status:"colonized",planets:[this.makePlanet("frontier-1","Koplin Frontier I","temperate",random,0),this.makePlanet("frontier-2","Koplin Frontier II","arid",random,1),this.makePlanet("frontier-3","Koplin Frontier III","barren",random,2)]}
    ];
    for(let i=0;i<18;i++){
      const nearby=i<MIN_NEARBY_FRONTIER_SYSTEMS,radius=nearby?2.55+random()*(CORPORATE_SERVICE_RADIUS_LY-2.7):4.2+random()*17.1,angle=random()*Math.PI*2,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius,planetCount=2+Math.floor(random()*7),id=`system-${String(i+1).padStart(2,"0")}`,name=`${names[i%names.length]} ${17+i}`,planets=[];
      for(let p=0;p<planetCount;p++){const tierBias=radius<6?random()*.45:radius<12?.25+random()*.55:.48+random()*.52,index=Math.min(CONTRACT_ARCHETYPES.length-1,Math.floor(tierBias*CONTRACT_ARCHETYPES.length));planets.push(this.makePlanet(`${id}-p${p+1}`,`${name} ${this.roman(p+1)}`,CONTRACT_ARCHETYPES[index].id,random,p));}
      systems.push({id,name,x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),starType:starTypes[Math.floor(random()*starTypes.length)],planetCount,surveyed:false,status:"unknown",planets});
    }
    return systems;
  }
  roman(n){return["I","II","III","IV","V","VI","VII","VIII","IX","X"][Math.max(0,n-1)]||String(n);}
  makePlanet(id,name,archId,random,index){const a=archById(archId);return{id,name,arch:archId,environment:a.environment,supportSystem:a.supportSystem,supportLoad:a.supportLoad,requiredTech:{...a.requiredTech},naturalFood:a.naturalFood,indicators:{food:indicator(a.stars.food,random),build:indicator(a.stars.build,random),fuel:indicator(a.stars.fuel,random),ore:indicator(a.stars.ore,random),habitability:["Extreme","Hostile","Marginal","Manageable","Favourable"][clamp(5-Math.round(a.supportLoad*2)+(random()<.3?1:0),1,5)-1]},surveyConfidence:Math.round(62+random()*28),index};}
  system(expansionOrState,id){const expansion=expansionOrState?.company?.expansion||expansionOrState;return expansion?.systems?.find(s=>s.id===id)||null;}
  home(state){return this.system(this.ensure(state),HOME_SYSTEM_ID);}
  systemDistance(state,fromId,toId){const ex=this.ensure(state),a=this.system(ex,fromId),b=this.system(ex,toId);return a&&b?distance(a,b):Infinity;}
  distanceFromHome(expansionOrState,systemId){const ex=expansionOrState?.company?.expansion||expansionOrState,a=this.system(ex,HOME_SYSTEM_ID),b=this.system(ex,systemId);return a&&b?distance(a,b):Infinity;}
  corporateServiceAvailable(state){this.ensure(state);const d=Number(state.contract?.distanceLy);return Number.isFinite(d)?d<=state.company.expansion.serviceRadiusLy:true;}
  probeUnlocked(state){return Math.max(1,Number(state.company?.tech?.industry)||1)>=PROBE_UNLOCK_INDUSTRY_LEVEL;}
  probeCost(){return{...PROBE_COST};}
  canLaunchProbe(state,systemId){
    const ex=this.ensure(state),system=this.system(ex,systemId);if(!system||system.home)return{ok:false,reason:"That system does not require a survey."};if(system.surveyed)return{ok:false,reason:"System already surveyed."};if(ex.probes.some(p=>p.systemId===systemId&&p.status==="travelling"))return{ok:false,reason:"Survey probe already en route."};if(!this.probeUnlocked(state))return{ok:false,reason:`Industry L${PROBE_UNLOCK_INDUSTRY_LEVEL} required.`};
    const missing=Object.entries(PROBE_COST).filter(([type,qty])=>(this.inventory?.amount(state,type)||0)<qty);if(missing.length)return{ok:false,reason:`Need ${missing.map(([t,q])=>`${q} ${t.toUpperCase()}`).join(" • ")}.`};return{ok:true,cost:this.probeCost()};
  }
  launchProbe(state,systemId){const r=this.canLaunchProbe(state,systemId);if(!r.ok)return r;for(const[type,qty]of Object.entries(PROBE_COST))this.inventory.consumeCategory(state,type,qty);const ex=this.ensure(state),system=this.system(ex,systemId),days=Math.max(30,Math.ceil(this.distanceFromHome(ex,systemId)*PROBE_DAYS_PER_LY)),probe={id:`probe-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,systemId,status:"travelling",launchedAbsoluteDay:this.absoluteDay(state),arrivalAbsoluteDay:this.absoluteDay(state)+days,durationDays:days};ex.probes.push(probe);system.status="probe-en-route";return{ok:true,probe,days};}
  probeFor(state,systemId){return this.ensure(state).probes.find(p=>p.systemId===systemId&&p.status==="travelling")||null;}

  shipTotalCapacity(ship){return Math.max(0,Number(ship?.cargoCapacity)||0)+Math.max(0,Number(ship?.foodCapacity)||0)+Math.max(0,Number(ship?.fuelCapacity)||0);}
  shipPeople(ship){return Math.max(0,Number(ship?.crew)||0)+Math.max(0,Number(ship?.passengers)||0);}
  profileBetween(state,from,targetSystemId,passengers=null,shipId=null){
    const target=this.system(this.ensure(state),targetSystemId),ship=this.ship(state,shipId);if(!from||!target||!ship)return null;
    const d=distance(from,target),days=Math.max(1,Math.ceil(d*Math.max(.01,Number(ship.transitWeeksPerLightYear)||1)*7)),pax=Math.max(0,Math.floor(passengers===null?this.shipPeople(ship):passengers)),fuel=Math.ceil(d*Math.max(0,Number(ship.fuelUsePerLightYear)||0)),food=Math.ceil(days*pax*CONFIG.FOOD_PER_COLONIST);
    return{distanceLy:d,days,passengers:pax,fuelRequired:fuel,foodRequired:food,arrivalAbsoluteDay:this.absoluteDay(state)+days,target};
  }
  travelProfile(state,targetSystemId,passengers=null,shipId=null){const ship=this.ship(state,shipId),from=this.system(this.ensure(state),ship?.systemId);return this.profileBetween(state,from,targetSystemId,passengers,ship?.id);}

  fuelAmount(state,shipId=null){return totalEntries(this.ship(state,shipId)?.fuelLots);}
  foodAmount(state,shipId=null){return totalEntries(this.ship(state,shipId)?.foodLots);}
  cargoAmount(state,shipId=null){return totalEntries(this.ship(state,shipId)?.cargo);}
  cargoCategory(state,type,shipId=null){return categoryAmount(this.ship(state,shipId)?.cargo,type);}
  transitFoodAmount(state,shipId=null){return this.foodAmount(state,shipId)+this.cargoCategory(state,"food",shipId);}
  capacityUsed(state,shipId=null){return this.fuelAmount(state,shipId)+this.foodAmount(state,shipId)+this.cargoAmount(state,shipId);}
  capacityRemaining(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,this.shipTotalCapacity(ship)-this.capacityUsed(state,shipId));}
  cargoCapacityRemaining(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,(Number(ship?.cargoCapacity)||0)-this.cargoAmount(state,shipId));}
  foodCapacityRemaining(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,(Number(ship?.foodCapacity)||0)-this.foodAmount(state,shipId));}
  fuelCapacityRemaining(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,(Number(ship?.fuelCapacity)||0)-this.fuelAmount(state,shipId));}
  passengerRemaining(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,(Number(ship?.passengerCapacity)||0)-(Number(ship?.passengers)||0));}
  crewRemaining(state,shipId=null){const ship=this.ship(state,shipId);return Math.max(0,(Number(ship?.maximumCrew)||0)-(Number(ship?.crew)||0));}
  isAtActiveColony(state,shipId=null){const ship=this.ship(state,shipId);return!!ship&&ship.status==="docked"&&ship.colonyId===state.colonyId;}
  spaceportServicesAvailable(state){if(this.colonyService?.powerNetwork){const network=this.colonyService.powerNetwork(state,{fuelStock:this.inventory?.amount?.(state,"fuel")||0}),row=network.bandRows?.find(item=>item.priority==="spaceport");return !row||row.delivered>=row.requested;}return Number(state.metrics?.powerCapacity||0)>=10&&(state.metrics?.powerFactor??1)>=.999;}
  spaceportServiceFailure(state){return this.spaceportServicesAvailable(state)?null:"Basic Spaceport services are offline: provide its full 10 Power before loading or transferring.";}

  loadCargo(state,...args){const parsed=parseShipArgs(args,2),[key,amount]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const room=this.cargoCapacityRemaining(state,ship.id),qty=Math.min(room,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:"No general cargo capacity remains."};const moved=transferExact(state.inventory,ship.cargo,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"No stock available."};}
  unloadCargo(state,...args){const parsed=parseShipArgs(args,2),[key,amount=Infinity]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const entry=ship.cargo?.[key];if(!entry)return{ok:false,reason:"That resource is not aboard."};const qty=Math.min(Math.max(0,Number(entry.amount)||0),Number.isFinite(amount)?Math.max(0,Number(amount)||0):Infinity),moved=transferExact(ship.cargo,state.inventory,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"Nothing to unload."};}
  loadFood(state,...args){const parsed=parseShipArgs(args,2),[key,amount]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const entry=state.inventory?.[key];if(entry?.type!=="food")return{ok:false,reason:"Only Food can be loaded into the transit food store."};const room=this.foodCapacityRemaining(state,ship.id),qty=Math.min(room,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:"The transit food store is full."};const moved=transferExact(state.inventory,ship.foodLots,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"No food stock available."};}
  unloadFood(state,...args){const parsed=parseShipArgs(args,2),[key,amount=Infinity]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const entry=ship.foodLots?.[key];if(!entry)return{ok:false,reason:"That food is not in the transit store."};const qty=Math.min(Math.max(0,Number(entry.amount)||0),Number.isFinite(amount)?Math.max(0,Number(amount)||0):Infinity),moved=transferExact(ship.foodLots,state.inventory,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"Nothing to unload."};}
  loadFuel(state,...args){const parsed=parseShipArgs(args,2),[key,amount]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const entry=state.inventory?.[key];if(entry?.type!=="fuel")return{ok:false,reason:"Only Fuel resources can be loaded into the ship fuel tank."};const room=this.fuelCapacityRemaining(state,ship.id),qty=Math.min(room,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:"The ship fuel tank is full."};const moved=transferExact(state.inventory,ship.fuelLots,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"No fuel stock available."};}
  unloadFuel(state,...args){const parsed=parseShipArgs(args,2),[key,amount=Infinity]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const entry=ship.fuelLots?.[key];if(!entry)return{ok:false,reason:"That fuel is not in the tank."};const qty=Math.min(Math.max(0,Number(entry.amount)||0),Number.isFinite(amount)?Math.max(0,Number(amount)||0):Infinity),moved=transferExact(ship.fuelLots,state.inventory,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"Nothing to unload."};}

  loadCrew(state,...args){const parsed=parseShipArgs(args,1),[amount]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const qty=Math.min(Math.max(0,Math.floor(Number(amount)||0)),this.travelResidentCount(state,ship.id),this.crewRemaining(state,ship.id));if(qty<=0)return{ok:false,reason:"No crew can be loaded."};this.removeResidentsForTravel(state,ship.id,qty);ship.crew+=qty;return{ok:true,qty};}
  unloadCrew(state,...args){const parsed=parseShipArgs(args,1),[amount=Infinity]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const room=Math.max(0,this.accommodationCapacity(state,ship.id)-this.shipResidentCount(state,ship.id)),qty=Math.min(ship.crew,room,Number.isFinite(amount)?Math.max(0,Math.floor(Number(amount)||0)):Infinity);if(qty<=0)return{ok:false,reason:room<=0?"Ship accommodation is full.":"No crew aboard."};state.pop=Number(state.pop||0)+qty;ship.crew-=qty;this.accommodationAssignments(state)[ship.id]=this.shipResidentCount(state,ship.id)+qty;return{ok:true,qty};}
  loadPassengers(state,...args){const parsed=parseShipArgs(args,1),[amount]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const qty=Math.min(Math.max(0,Math.floor(Number(amount)||0)),this.travelResidentCount(state,ship.id),this.passengerRemaining(state,ship.id));if(qty<=0)return{ok:false,reason:"No passengers can be loaded."};this.removeResidentsForTravel(state,ship.id,qty);ship.passengers+=qty;return{ok:true,qty};}
  unloadPassengers(state,...args){const parsed=parseShipArgs(args,1),[amount=Infinity]=parsed.values,ship=this.ship(state,parsed.shipId);if(!ship||!this.isAtActiveColony(state,ship.id))return{ok:false,reason:"The selected player ship is not docked at this colony."};const room=Math.max(0,this.accommodationCapacity(state,ship.id)-this.shipResidentCount(state,ship.id)),qty=Math.min(ship.passengers,room,Number.isFinite(amount)?Math.max(0,Math.floor(Number(amount)||0)):Infinity);if(qty<=0)return{ok:false,reason:room<=0?"Ship accommodation is full.":"No passengers aboard."};state.pop=Number(state.pop||0)+qty;ship.passengers-=qty;this.accommodationAssignments(state)[ship.id]=this.shipResidentCount(state,ship.id)+qty;return{ok:true,qty};}

  shipPosition(state,shipId=null){
    const ship=this.ship(state,shipId),ex=this.ensure(state);if(!ship)return null;if(ship.status!=="travelling"){const system=this.system(ex,ship.systemId);return system?{x:system.x,y:system.y}:null;}
    const start=Number(ship.routeStartAbsoluteDay??ship.departedAbsoluteDay),end=Number(ship.arrivalAbsoluteDay),sx=Number(ship.routeStartX),sy=Number(ship.routeStartY),tx=Number(ship.routeEndX),ty=Number(ship.routeEndY);
    if([start,end,sx,sy,tx,ty].every(Number.isFinite)&&end>start){const t=clamp((this.absoluteDay(state)-start)/(end-start),0,1);return{x:sx+(tx-sx)*t,y:sy+(ty-sy)*t};}
    const a=this.system(ex,ship.sourceSystemId),b=this.system(ex,ship.targetSystemId);if(!a||!b)return null;const total=Math.max(1,end-start),left=Math.max(0,end-this.absoluteDay(state)),t=clamp(1-left/total,0,1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  }

  routeCanBeSupplied(state,profile,shipId=null){if(!profile)return{ok:false,reason:"Route unavailable."};if(this.fuelAmount(state,shipId)<profile.fuelRequired)return{ok:false,reason:`Need ${profile.fuelRequired} Fuel for that route; ${Math.floor(this.fuelAmount(state,shipId))} remains.`};if(this.transitFoodAmount(state,shipId)<profile.foodRequired)return{ok:false,reason:`Need ${profile.foodRequired} Food for that route; ${Math.floor(this.transitFoodAmount(state,shipId))} remains.`};return{ok:true};}

  startTravel(state,profile,{reroute=false,shipId=null,targetColonyId=null}={}){
    const ship=this.ship(state,shipId),position=this.shipPosition(state,ship?.id)||this.system(this.ensure(state),ship?.systemId);if(!ship||!position)return{ok:false,reason:"Ship position unavailable."};const today=this.absoluteDay(state);
    const displacedResidents=ship.status==="docked"?this.releaseShipAccommodation(state,ship.id):0;if(this.emergencyFoodState(state).shipId===ship.id)this.clearEmergencyFood(state);
    ship.status="travelling";ship.sourceSystemId=reroute?ship.sourceSystemId:ship.systemId;ship.sourceColonyId=reroute?ship.sourceColonyId:ship.colonyId;ship.systemId=null;ship.colonyId=null;ship.targetSystemId=profile.target.id;ship.targetColonyId=targetColonyId||null;ship.departedAbsoluteDay=today;ship.routeStartAbsoluteDay=today;ship.routeStartX=position.x;ship.routeStartY=position.y;ship.routeEndX=profile.target.x;ship.routeEndY=profile.target.y;ship.arrivalAbsoluteDay=today+profile.days;ship.hasLaunched=true;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;return{ok:true,profile,rerouted:reroute,shipId:ship.id,displacedResidents};
  }

  setTarget(state,systemId,colonyId=null,shipId=null){
    const ship=this.ship(state,shipId),system=this.system(this.ensure(state),systemId);if(!ship)return{ok:false,reason:"Player ship not found."};if(!system)return{ok:false,reason:"Unknown star system."};if(!system.home&&!system.surveyed)return{ok:false,reason:"Survey the system before committing the ship."};
    if(["docked","home"].includes(ship.status)){if(systemId===ship.systemId)return{ok:false,reason:"The ship is already in that system."};ship.targetSystemId=systemId;ship.targetColonyId=colonyId||null;return{ok:true,target:system};}
    if(["arrived","travelling","orbiting"].includes(ship.status)){
      if(ship.crew<ship.minimumCrew)return{ok:false,reason:`At least ${ship.minimumCrew} crew must remain aboard to continue the journey.`};if(ship.status==="travelling"&&systemId===ship.targetSystemId)return{ok:false,reason:"The ship is already travelling to that system."};if(["arrived","orbiting"].includes(ship.status)&&systemId===ship.systemId)return{ok:false,reason:"The ship is already in that system."};
      const from=this.shipPosition(state,ship.id),profile=this.profileBetween(state,from,systemId,null,ship.id),supplied=this.routeCanBeSupplied(state,profile,ship.id);if(!supplied.ok)return supplied;return this.startTravel(state,profile,{reroute:true,shipId:ship.id,targetColonyId:colonyId});
    }
    return{ok:false,reason:"The ship cannot change destination in its current state."};
  }

  headquartersLaunchAssessment(state,ship=null){
    ship=ship||this.ship(state);
    const foundingId=state.colony?.foundingShipId||ship?.id;const pending=!!state.colony&&!state.colony.commandHandoverComplete&&ship?.status==="docked"&&ship?.id===foundingId;
    if(!pending)return{required:false,ok:true,failures:[]};
    const colony=this.colonyService,failures=[];
    if(!colony)return{required:true,ok:false,failures:["Primary Headquarters status is unavailable."]};
    const rows=colony.headquartersRows(state),primaryId=state.colony.primaryHeadquartersId,row=rows.find(item=>item.id===primaryId);
    if(!row)failures.push("No Primary Headquarters is designated.");
    else{
      if(!row.constructed)failures.push("Primary Headquarters is not fully constructed.");
      const staffing=colony.headquartersStaffing(state),staffed=staffing.rows.find(item=>item.id===row.id);
      if(!staffed?.staffed)failures.push(`Primary Headquarters requires ${row.requiredStaff} staff; ${staffed?.staff||0} assigned.`);
    }
    return{required:true,ok:failures.length===0,failures,reason:failures.length?failures.join(" "):null,primaryId};
  }

  canLaunch(state,shipId=null){const ship=this.ship(state,shipId);if(!ship)return{ok:false,launchEnabled:false,reason:"Player ship not found."};if(!["docked","home"].includes(ship.status))return{ok:false,launchEnabled:false,reason:"The ship is not ready to launch."};if(ship.status==="docked"&&!this.isAtActiveColony(state,ship.id))return{ok:false,launchEnabled:false,reason:"Switch to the colony where the ship is docked."};if(ship.crew<ship.minimumCrew)return{ok:false,launchEnabled:false,reason:`Load at least ${ship.minimumCrew} crew before launch.`};if(!ship.targetSystemId)return{ok:false,launchEnabled:false,reason:"Select a destination system first."};const p=this.travelProfile(state,ship.targetSystemId,null,ship.id);if(!p)return{ok:false,launchEnabled:false,reason:"Route unavailable."};const supplied=this.routeCanBeSupplied(state,p,ship.id);if(!supplied.ok)return{ok:false,launchEnabled:false,reason:supplied.reason};const headquarters=this.headquartersLaunchAssessment(state,ship);if(!headquarters.ok)return{ok:false,launchEnabled:true,headquarters,profile:p,reason:`DEPARTURE BLOCKED • ${headquarters.reason}`};return{ok:true,launchEnabled:true,profile:p,headquarters};}
  launch(state,shipId=null){const r=this.canLaunch(state,shipId);if(!r.ok){return r;}const ship=this.ship(state,shipId),result=this.startTravel(state,r.profile,{shipId:ship.id,targetColonyId:ship.targetColonyId});if(result.ok&&r.headquarters?.required){state.colony.commandHandoverComplete=true;}return result;}

  consumeTransitFood(state,requested,shipId=null){const ship=this.ship(state,shipId),first=consumeContainerCategory(ship?.foodLots,"food",requested),remaining=Math.max(0,requested-first.consumed);if(remaining<=0)return{requested,consumed:first.consumed,ratio:1};const second=consumeContainerCategory(ship?.cargo,"food",remaining),consumed=first.consumed+second.consumed;return{requested,consumed,ratio:requested>0?Math.min(1,consumed/requested):1};}

  colonyHasFreeBerth(state,colonyId){return berthStatusForColony(state,colonyId).free>0;}
  tryAutoDock(state,ship){
    if(!ship?.targetColonyId)return false;
    const entry=state.portfolio?.colonies?.find(item=>item.id===ship.targetColonyId);
    if(!entry||entry.data?.status==="dead"||entry.data?.contract?.systemId!==ship.systemId)return false;
    if(!this.colonyHasFreeBerth(state,ship.targetColonyId))return false;
    ship.status="docked";ship.colonyId=ship.targetColonyId;ship.targetColonyId=null;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;return true;
  }

  processDay(state){
    const ex=this.ensure(state),today=this.absoluteDay(state);if(ex.lastProcessedAbsoluteDay===today)return{probeArrivals:[],shipArrived:false,shipLost:false,shipArrivals:[],shipLosses:[]};ex.lastProcessedAbsoluteDay=today;const probeArrivals=[],shipArrivals=[],shipLosses=[];
    for(const probe of ex.probes){if(probe.status==="travelling"&&today>=probe.arrivalAbsoluteDay){probe.status="complete";probe.completedAbsoluteDay=today;const system=this.system(ex,probe.systemId);if(system){system.surveyed=true;system.status=this.coloniesInSystem(state,system.id).length?"colonized":"surveyed";}probeArrivals.push(probe);}}
    if(probeArrivals.length)ex.notice={type:"probe-complete",systemId:probeArrivals.at(-1).systemId,absoluteDay:today,prompted:false};

    for(const ship of ex.ships){
      if(ship.status==="orbiting"){
        if(this.tryAutoDock(state,ship))shipArrivals.push({shipId:ship.id,type:"docked",systemId:ship.systemId,colonyId:ship.colonyId});
        continue;
      }
      if(ship.status!=="travelling")continue;
      const target=ship.targetSystemId,p=this.travelProfileFromStored(state,ship);if(!p)continue;
      const dailyFuel=p.fuelRequired/Math.max(1,p.days),fuel=consumeContainerCategory(ship.fuelLots,"fuel",dailyFuel);if(fuel.ratio<.999){const lost=this.loseShip(state,"Fuel exhausted during interstellar transit.",ship.id);shipLosses.push({shipId:ship.id,...lost});continue;}
      const people=this.shipPeople(ship);if(people>0){const food=this.consumeTransitFood(state,people*CONFIG.FOOD_PER_COLONIST,ship.id);if(food.ratio<.999){const lost=this.loseShip(state,"Food stores exhausted during interstellar transit.",ship.id);shipLosses.push({shipId:ship.id,...lost});continue;}}
      if(today<ship.arrivalAbsoluteDay)continue;

      ship.systemId=target;ship.departedAbsoluteDay=null;ship.arrivalAbsoluteDay=null;ship.sourceSystemId=null;ship.sourceColonyId=null;ship.routeStartAbsoluteDay=null;ship.routeStartX=null;ship.routeStartY=null;ship.routeEndX=null;ship.routeEndY=null;ship.targetSystemId=null;ship.arrivalPromptedFor=null;
      if(target===HOME_SYSTEM_ID){ship.status="home";ship.targetColonyId=null;ship.awaitingDestination=false;}
      else if(ship.targetColonyId){
        ship.status="orbiting";ship.awaitingDestination=false;
        this.tryAutoDock(state,ship);
      }else{ship.status="arrived";ship.awaitingDestination=true;}
      shipArrivals.push({shipId:ship.id,type:ship.status,systemId:target,colonyId:ship.colonyId||ship.targetColonyId||null});
      state.speed=0;ex.notice={type:target===HOME_SYSTEM_ID?"home-arrival":"ship-arrival",shipId:ship.id,systemId:target,absoluteDay:today};
    }
    return{probeArrivals,shipArrived:shipArrivals.length>0,shipLost:shipLosses.length>0,shipArrivals,shipLosses};
  }

  travelProfileFromStored(state,ship){const target=this.system(this.ensure(state),ship.targetSystemId),from=Number.isFinite(ship.routeStartX)&&Number.isFinite(ship.routeStartY)?{x:ship.routeStartX,y:ship.routeStartY}:this.system(this.ensure(state),ship.sourceSystemId);if(!from||!target)return null;const d=distance(from,target),days=Math.max(1,Math.round((Number(ship.arrivalAbsoluteDay)||0)-(Number(ship.routeStartAbsoluteDay??ship.departedAbsoluteDay)||0)))||Math.max(1,Math.ceil(d*Math.max(.01,Number(ship.transitWeeksPerLightYear)||1)*7));return{distanceLy:d,days,fuelRequired:Math.ceil(d*Math.max(0,Number(ship.fuelUsePerLightYear)||0)),foodRequired:Math.ceil(days*this.shipPeople(ship)*CONFIG.FOOD_PER_COLONIST),target};}

  loseShip(state,reason="Player ship lost.",shipId=null){const ship=this.ship(state,shipId);if(!ship)return{shipLost:false,shipArrived:false,reason:"Player ship not found."};if(ship.status==="docked"&&ship.colonyId===state.colonyId)this.releaseShipAccommodation(state,ship.id);if(this.emergencyFoodState(state).shipId===ship.id)this.clearEmergencyFood(state);ship.status="lost";ship.lostReason=reason;ship.systemId=null;ship.colonyId=null;ship.targetSystemId=null;ship.targetColonyId=null;ship.cargo={};ship.foodLots={};ship.fuelLots={};ship.crew=0;ship.passengers=0;state.speed=0;state.company.expansion.notice={type:"ship-lost",shipId:ship.id,reason,absoluteDay:this.absoluteDay(state)};return{shipLost:true,shipArrived:false,reason,shipId:ship.id};}
  onColonyDied(state){const lost=[];for(const ship of this.ships(state).filter(item=>item.status==="docked"&&item.colonyId===state.colonyId)){lost.push(this.loseShip(state,`${state.contract?.colonyName||"The colony"} collapsed while ${ship.name||"a player ship"} was docked.`,ship.id));}return{shipLost:lost.length>0,losses:lost};}

  coloniesInSystem(state,systemId){return(state.portfolio?.colonies||[]).filter(entry=>entry?.data?.contract?.systemId===systemId).map(entry=>({id:entry.id,name:entry.data.contract.colonyName||entry.name,planetId:entry.data.contract.planetId,status:entry.data.status||"playing"}));}
  dockAtColony(state,colonyId,shipId=null){const ship=this.ship(state,shipId),entry=state.portfolio?.colonies?.find(e=>e.id===colonyId);if(!ship)return{ok:false,reason:"Player ship not found."};if(!entry)return{ok:false,reason:"Colony not found."};if(entry.data.contract?.systemId!==ship.systemId)return{ok:false,reason:"That colony is in another system."};if(!this.colonyHasFreeBerth(state,colonyId)){ship.status="orbiting";ship.targetColonyId=colonyId;ship.colonyId=null;return{ok:false,orbiting:true,reason:"No free berth. Ship is holding in orbit."};}ship.status="docked";ship.colonyId=colonyId;ship.targetColonyId=null;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;return{ok:true,entry};}

  makePlanetContract(state,systemId,planetId){const system=this.system(this.ensure(state),systemId),planet=system?.planets?.find(p=>p.id===planetId);if(!system||!planet)return null;const a=archById(planet.arch),progress=Math.max(1,Number(state.company.wins)||1)+1,base=this.contracts?.make?this.contracts.make(a,progress,planet.index||0):{arch:a.id,colonyTier:a.colonyTier,name:a.name,environment:a.environment,hazard:a.hazard,supportSystem:a.supportSystem,supportLoad:a.supportLoad,techAccess:a.techAccess,requiredTech:{...a.requiredTech},naturalFood:a.naturalFood,years:10,ext:0,extUsed:0,renewals:0,completed:false,completionAwarded:false,ended:false,goals:{food:120,industry:520,pop:1050},bands:{silver:450000,gold:1000000,plat:2200000},localRevenue:0,localCosts:0};base.uid=`exp-${systemId}-${planetId}-${Date.now()}`;base.name=`${planet.name} Mining Charter`;base.advance=0;base.systemId=systemId;base.systemName=system.name;base.planetId=planetId;base.planetName=planet.name;base.distanceLy=this.distanceFromHome(state,systemId);base.expeditionArrival=true;return base;}
  expeditionManifest(state,shipId=null){const ship=this.ship(state,shipId);return{passengers:Math.max(0,Math.floor(Number(ship?.passengers)||0)),crew:Math.max(0,Math.floor(Number(ship?.crew)||0)),cargo:clone(ship?.cargo||{})};}
  consumeManifestForNewColony(state,newColonyId,shipId=null){const ship=this.ship(state,shipId),manifest=this.expeditionManifest(state,ship?.id),system=this.system(this.ensure(state),ship?.systemId);ship.cargo=Object.fromEntries(Object.entries(ship.cargo||{}).filter(([,entry])=>entry?.type==="food"));ship.crew=0;ship.passengers=0;ship.status="docked";ship.colonyId=newColonyId;ship.targetColonyId=null;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;if(system){system.surveyed=true;system.status="colonized";}return manifest;}

  sellCargoAtHome(state,shipId=null){const ship=this.ship(state,shipId);if(!ship||ship.status!=="home")return{ok:false,reason:"The ship is not at the corporate homeworld."};let revenue=0,qty=0;for(const entry of Object.values(ship.cargo||{})){for(const[bandKey,band]of Object.entries(entry.qualityBands||{})){const amount=Math.max(0,Number(band.amount)||0);if(!amount)continue;const unit=this.resources?.sellPrice?.(entry.type,entry.resourceId,bandKey)||0;revenue+=amount*unit;qty+=amount;}}ship.cargo={};state.company.cash=Number(state.company.cash||0)+revenue;state.company.earn=Number(state.company.earn||0)+revenue;return{ok:qty>0,qty,revenue,reason:qty>0?null:"No cargo to sell."};}
  homeCatalog(){return this.resources?.catalog?.()||[];}
  buyAtHome(state,type,resourceId,amount,{toFuelTank=false,toFoodStore=false,shipId=null}={}){const ship=this.ship(state,shipId);if(!ship||ship.status!=="home")return{ok:false,reason:"The ship is not at the corporate homeworld."};const def=this.resources?.get?.(type,resourceId);if(!def)return{ok:false,reason:"Unknown resource."};if(toFuelTank&&type!=="fuel")return{ok:false,reason:"Only Fuel can enter the fuel tank."};if(toFoodStore&&type!=="food")return{ok:false,reason:"Only Food can enter the transit food store."};const room=toFuelTank?this.fuelCapacityRemaining(state,ship.id):toFoodStore?this.foodCapacityRemaining(state,ship.id):this.cargoCapacityRemaining(state,ship.id),qty=Math.min(room,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:toFuelTank?"The fuel tank is full.":toFoodStore?"The transit food store is full.":"No general cargo capacity remains."};const unit=(this.resources?.sellPrice?.(type,resourceId)||0)*CONFIG.CORPORATE_BUY_MARKUP,affordable=Math.floor(Math.max(0,Number(state.company.cash)||0)/Math.max(.001,unit)),buy=Math.min(qty,affordable);if(buy<=0)return{ok:false,reason:"Insufficient cash."};const key=`${type}:${resourceId}`,container=toFuelTank?ship.fuelLots:toFoodStore?ship.foodLots:ship.cargo,entry=container[key]||={key,type,resourceId,name:def.name,category:def.category||type,amount:0,qualityBands:{}};addBand(entry,"excellent",buy);const cost=buy*unit;state.company.cash-=cost;return{ok:true,qty:buy,cost,entry};}
}
