import { CONFIG } from "../core/config.js";
import { CONTRACT_ARCHETYPES } from "../data/contracts.js";
import { hashString, seededRandom } from "../core/utils.js";

export const EXPANSION_VERSION=1;
export const HOME_SYSTEM_ID="corporate-home";
export const FIRST_COLONY_SYSTEM_ID="koplin-frontier";
export const PROBE_UNLOCK_INDUSTRY_LEVEL=3;
export const PROBE_COST=Object.freeze({build:180,ore:120,fuel:60});
export const PLAYER_SHIP_CAPACITY=10000;
export const PLAYER_SHIP_PASSENGERS=250;
export const CORPORATE_SERVICE_RADIUS_LY=4;
export const SHIP_SPEED_LY_PER_YEAR=5;
export const SHIP_FUEL_PER_LY=260;
export const PROBE_DAYS_PER_LY=32;

const clone=value=>JSON.parse(JSON.stringify(value));
const absoluteDay=state=>(Math.max(1,Number(state.year)||1)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,Number(state.day)||1);
const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const starTypes=["G-type yellow","K-type orange","F-type white","M-type red dwarf","A-type blue-white","Binary K/M"];
const names=["Aster","Borealis","Cinder","Draco","Erebus","Fornax","Gaia","Helios","Icarus","Juno","Kepler","Lyra","Meridian","Nysa","Orion","Pavo","Quillon","Rhea","Solis","Tethys","Umbra","Vega","Warden","Xanthe","Ymir","Zephyr"];
const archById=id=>CONTRACT_ARCHETYPES.find(a=>a.id===id)||CONTRACT_ARCHETYPES[0];

function bandRank(key){return ["common","good","excellent","exceptional","rare","extraordinary"].indexOf(key);}
function syncEntry(entry){entry.qualityBands||={};entry.amount=Object.values(entry.qualityBands).reduce((sum,band)=>sum+Math.max(0,Number(band.amount)||0),0);return entry;}
function addBand(target,key,amount){if(amount<=0)return;target.qualityBands||={};target.qualityBands[key]||={amount:0};target.qualityBands[key].amount=Math.max(0,Number(target.qualityBands[key].amount)||0)+amount;syncEntry(target);}
function takeEntry(entry,requested){
  let remaining=Math.min(Math.max(0,Number(requested)||0),Math.max(0,Number(entry?.amount)||0)),taken=0;const bands={};
  const rows=Object.entries(entry?.qualityBands||{}).sort((a,b)=>bandRank(a[0])-bandRank(b[0]));
  for(const [key,band] of rows){if(remaining<=0)break;const qty=Math.min(Math.max(0,Number(band.amount)||0),remaining);if(qty<=0)continue;band.amount-=qty;remaining-=qty;taken+=qty;bands[key]={amount:qty};}
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
  const source=sourceContainer?.[key];if(!source)return 0;const r=takeEntry(source,amount);if(r.taken<=0)return 0;const target=ensureCargoEntry(targetContainer,source);for(const [bandKey,band] of Object.entries(r.bands))addBand(target,bandKey,band.amount);return r.taken;
}
function indicator(stars,random){const n=clamp(Math.round(Number(stars)||1)+(random()<.28?(random()<.5?-1:1):0),1,5);return["Very Low","Low","Moderate","High","Very High"][n-1];}

export class ExpansionService{
  constructor(inventoryService=null,resourceService=null,contractService=null){this.inventory=inventoryService;this.resources=resourceService;this.contracts=contractService;}
  absoluteDay(state){return absoluteDay(state);}
  ensureGameOverAccessor(company){
    if(company.__shipGameOverAccessor)return;
    const existing=!!company.gameOver;Object.defineProperty(company,"_baseGameOver",{value:existing,writable:true,enumerable:false,configurable:true});
    Object.defineProperty(company,"gameOver",{enumerable:true,configurable:true,get(){return !!this._baseGameOver||this.expansion?.ship?.status==="lost";},set(value){this._baseGameOver=!!value;}});
    Object.defineProperty(company,"__shipGameOverAccessor",{value:true,writable:true,enumerable:false,configurable:true});
  }
  ensure(state){
    state.company||={};
    const company=state.company,seed=Math.abs(Number(state.portfolio?.colonies?.[0]?.data?.seed)||Number(state.seed)||hashString("MineIT galaxy"));
    if(!company.expansion||company.expansion.version!==EXPANSION_VERSION){
      const previous=company.expansion||{},systems=previous.systems?.length?previous.systems:this.generateGalaxy(seed,state);
      company.expansion={version:EXPANSION_VERSION,seed,serviceRadiusLy:CORPORATE_SERVICE_RADIUS_LY,probeUnlockIndustryLevel:PROBE_UNLOCK_INDUSTRY_LEVEL,systems,probes:Array.isArray(previous.probes)?previous.probes:[],ship:previous.ship||this.initialShip(state),lastProcessedAbsoluteDay:Number(previous.lastProcessedAbsoluteDay)||0,notice:previous.notice||null};
    }
    this.ensureFirstColonyLocation(state);this.ensureGameOverAccessor(company);return company.expansion;
  }
  initialShip(state){return{status:"docked",systemId:FIRST_COLONY_SYSTEM_ID,colonyId:state.colonyId||state.portfolio?.activeColonyId||null,targetSystemId:null,departedAbsoluteDay:null,arrivalAbsoluteDay:null,sourceSystemId:null,sourceColonyId:null,cargo:{},fuelLots:{},passengers:0,hasLaunched:false,awaitingDestination:false,arrivalPromptedFor:null,lostReason:null};}
  ensureFirstColonyLocation(state){
    const expansion=state.company.expansion,entries=state.portfolio?.colonies||[];
    entries.forEach((entry,index)=>{if(!entry?.data?.contract)return;let systemId=entry.data.contract.systemId;if(!systemId){systemId=index===0?FIRST_COLONY_SYSTEM_ID:(expansion.systems.filter(s=>!s.home)[Math.min(index,expansion.systems.length-2)]?.id||FIRST_COLONY_SYSTEM_ID);entry.data.contract.systemId=systemId;}const system=this.system(expansion,systemId);if(system){system.surveyed=true;system.status="colonized";let planetId=entry.data.contract.planetId;if(!planetId){planetId=index===0?"frontier-1":`legacy-${index+1}`;entry.data.contract.planetId=planetId;if(!system.planets.some(p=>p.id===planetId)){const a=archById(entry.data.contract.arch),random=seededRandom(hashString(`${expansion.seed}|legacy|${index}`));system.planets.push(this.makePlanet(planetId,`${system.name} ${this.roman(system.planets.length+1)}`,a.id,random,system.planets.length));system.planetCount=system.planets.length;}}entry.data.contract.distanceLy??=this.distanceFromHome(expansion,systemId);}});
    const active=entries.find(e=>e.id===state.colonyId);if(state.contract&&active?.data?.contract){state.contract.systemId||=active.data.contract.systemId;state.contract.planetId||=active.data.contract.planetId;state.contract.distanceLy??=active.data.contract.distanceLy;}
    const firstSystem=this.system(expansion,FIRST_COLONY_SYSTEM_ID);if(firstSystem){firstSystem.surveyed=true;firstSystem.status="colonized";}const home=this.system(expansion,HOME_SYSTEM_ID);if(home){home.surveyed=true;home.status="home";}
  }
  generateGalaxy(seed,state){
    const random=seededRandom(hashString(`${seed}|galaxy-v1`)),systems=[
      {id:HOME_SYSTEM_ID,name:"Koplin Corporate Home",x:0,y:0,starType:"G-type yellow",planetCount:1,surveyed:true,status:"home",home:true,planets:[]},
      {id:FIRST_COLONY_SYSTEM_ID,name:"Koplin Frontier",x:1.25,y:.65,starType:"K-type orange",planetCount:3,surveyed:true,status:"colonized",planets:[this.makePlanet("frontier-1","Koplin Frontier I","temperate",random,0),this.makePlanet("frontier-2","Koplin Frontier II","arid",random,1),this.makePlanet("frontier-3","Koplin Frontier III","barren",random,2)]}
    ];
    for(let i=0;i<18;i++){
      const radius=2.8+random()*18.5,angle=random()*Math.PI*2,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius,planetCount=2+Math.floor(random()*7),id=`system-${String(i+1).padStart(2,"0")}`,name=`${names[i%names.length]} ${17+i}`,planets=[];
      for(let p=0;p<planetCount;p++){const tierBias=radius<6?random()*.45:radius<12?.25+random()*.55:.48+random()*.52,index=Math.min(CONTRACT_ARCHETYPES.length-1,Math.floor(tierBias*CONTRACT_ARCHETYPES.length));planets.push(this.makePlanet(`${id}-p${p+1}`,`${name} ${this.roman(p+1)}`,CONTRACT_ARCHETYPES[index].id,random,p));}
      systems.push({id,name,x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),starType:starTypes[Math.floor(random()*starTypes.length)],planetCount,surveyed:false,status:"unknown",planets});
    }
    return systems;
  }
  roman(n){return["I","II","III","IV","V","VI","VII","VIII","IX","X"][Math.max(0,n-1)]||String(n);}
  makePlanet(id,name,archId,random,index){const a=archById(archId);return{id,name,arch:archId,environment:a.environment,supportSystem:a.supportSystem,supportLoad:a.supportLoad,requiredTech:{...a.requiredTech},naturalFood:a.naturalFood,indicators:{food:indicator(a.stars.food,random),build:indicator(a.stars.build,random),fuel:indicator(a.stars.fuel,random),ore:indicator(a.stars.ore,random),habitability:["Extreme","Hostile","Marginal","Manageable","Favourable"][clamp(5-Math.round(a.supportLoad*2)+(random()<.3?1:0),1,5)-1]},surveyConfidence:Math.round(62+random()*28),index};}
  system(expansionOrState,id){const expansion=expansionOrState?.company?.expansion||expansionOrState;return expansion?.systems?.find(s=>s.id===id)||null;}
  home(state){return this.system(this.ensure(state),HOME_SYSTEM_ID);}
  ship(state){return this.ensure(state).ship;}
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
  travelProfile(state,targetSystemId,passengers=null){const ship=this.ship(state),from=ship.systemId,target=this.system(this.ensure(state),targetSystemId);if(!from||!target)return null;const d=this.systemDistance(state,from,targetSystemId),days=Math.max(7,Math.ceil(d/SHIP_SPEED_LY_PER_YEAR*CONFIG.DAYS_PER_YEAR)),pax=Math.max(0,Math.floor(passengers===null?ship.passengers:passengers)),fuel=Math.ceil(d*SHIP_FUEL_PER_LY),food=Math.ceil(days*pax*CONFIG.FOOD_PER_COLONIST);return{distanceLy:d,days,passengers:pax,fuelRequired:fuel,foodRequired:food,arrivalAbsoluteDay:this.absoluteDay(state)+days,target};}
  fuelAmount(state){return totalEntries(this.ship(state).fuelLots);}
  cargoAmount(state){return totalEntries(this.ship(state).cargo);}
  cargoCategory(state,type){return categoryAmount(this.ship(state).cargo,type);}
  capacityUsed(state){return this.fuelAmount(state)+this.cargoAmount(state);}
  capacityRemaining(state){return Math.max(0,PLAYER_SHIP_CAPACITY-this.capacityUsed(state));}
  passengerRemaining(state){return Math.max(0,PLAYER_SHIP_PASSENGERS-this.ship(state).passengers);}
  isAtActiveColony(state){const ship=this.ship(state);return ship.status==="docked"&&ship.colonyId===state.colonyId;}
  loadCargo(state,key,amount){if(!this.isAtActiveColony(state))return{ok:false,reason:"The player ship is not docked at this colony."};const room=this.capacityRemaining(state),qty=Math.min(room,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:"No ship cargo capacity remains."};const moved=transferExact(state.inventory,this.ship(state).cargo,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"No stock available."};}
  unloadCargo(state,key,amount=Infinity){if(!this.isAtActiveColony(state))return{ok:false,reason:"The player ship is not docked at this colony."};const ship=this.ship(state),entry=ship.cargo?.[key];if(!entry)return{ok:false,reason:"That resource is not aboard."};const qty=Math.min(Math.max(0,Number(entry.amount)||0),Number.isFinite(amount)?Math.max(0,Number(amount)||0):Infinity),moved=transferExact(ship.cargo,state.inventory,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"Nothing to unload."};}
  loadFuel(state,key,amount){if(!this.isAtActiveColony(state))return{ok:false,reason:"The player ship is not docked at this colony."};const entry=state.inventory?.[key];if(entry?.type!=="fuel")return{ok:false,reason:"Only Fuel resources can be loaded into the ship fuel tank."};const room=this.capacityRemaining(state),qty=Math.min(room,Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:"No ship capacity remains."};const moved=transferExact(state.inventory,this.ship(state).fuelLots,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"No fuel stock available."};}
  unloadFuel(state,key,amount=Infinity){if(!this.isAtActiveColony(state))return{ok:false,reason:"The player ship is not docked at this colony."};const ship=this.ship(state),entry=ship.fuelLots?.[key];if(!entry)return{ok:false,reason:"That fuel is not in the tank."};const qty=Math.min(Math.max(0,Number(entry.amount)||0),Number.isFinite(amount)?Math.max(0,Number(amount)||0):Infinity),moved=transferExact(ship.fuelLots,state.inventory,key,qty);return moved>0?{ok:true,qty:moved}:{ok:false,reason:"Nothing to unload."};}
  loadPassengers(state,amount){if(!this.isAtActiveColony(state))return{ok:false,reason:"The player ship is not docked at this colony."};const ship=this.ship(state),qty=Math.min(Math.max(0,Math.floor(Number(amount)||0)),Math.floor(Number(state.pop)||0),this.passengerRemaining(state));if(qty<=0)return{ok:false,reason:"No passengers can be loaded."};state.pop=Math.max(0,Number(state.pop)-qty);ship.passengers+=qty;return{ok:true,qty};}
  unloadPassengers(state,amount=Infinity){if(!this.isAtActiveColony(state))return{ok:false,reason:"The player ship is not docked at this colony."};const ship=this.ship(state),qty=Math.min(ship.passengers,Number.isFinite(amount)?Math.max(0,Math.floor(Number(amount)||0)):Infinity);if(qty<=0)return{ok:false,reason:"No passengers aboard."};state.pop=Number(state.pop||0)+qty;ship.passengers-=qty;return{ok:true,qty};}
  setTarget(state,systemId){const ship=this.ship(state),system=this.system(this.ensure(state),systemId);if(!system)return{ok:false,reason:"Unknown star system."};if(ship.status!=="docked"&&ship.status!=="home")return{ok:false,reason:"The ship must be docked before choosing a destination."};if(systemId===ship.systemId)return{ok:false,reason:"The ship is already in that system."};if(!system.home&&!system.surveyed)return{ok:false,reason:"Survey the system before committing the colony ship."};ship.targetSystemId=systemId;return{ok:true,target:system};}
  canLaunch(state){const ship=this.ship(state);if(!["docked","home"].includes(ship.status))return{ok:false,reason:"The ship is not ready to launch."};if(ship.status==="docked"&&!this.isAtActiveColony(state))return{ok:false,reason:"Switch to the colony where the ship is docked."};if(!ship.targetSystemId)return{ok:false,reason:"Select a destination system first."};const p=this.travelProfile(state,ship.targetSystemId);if(!p)return{ok:false,reason:"Route unavailable."};if(this.fuelAmount(state)<p.fuelRequired)return{ok:false,reason:`Load at least ${p.fuelRequired} Fuel into the tank.`};if(ship.passengers>0&&this.cargoCategory(state,"food")<p.foodRequired)return{ok:false,reason:`Load at least ${p.foodRequired} Food for the journey.`};return{ok:true,profile:p};}
  launch(state){const r=this.canLaunch(state);if(!r.ok)return r;const ship=this.ship(state),p=r.profile;ship.status="travelling";ship.sourceSystemId=ship.systemId;ship.sourceColonyId=ship.colonyId;ship.systemId=null;ship.colonyId=null;ship.departedAbsoluteDay=this.absoluteDay(state);ship.arrivalAbsoluteDay=p.arrivalAbsoluteDay;ship.hasLaunched=true;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;return{ok:true,profile:p};}
  processDay(state){
    const ex=this.ensure(state),today=this.absoluteDay(state);if(ex.lastProcessedAbsoluteDay===today)return{probeArrivals:[],shipArrived:false,shipLost:false};ex.lastProcessedAbsoluteDay=today;const probeArrivals=[];
    for(const probe of ex.probes){if(probe.status==="travelling"&&today>=probe.arrivalAbsoluteDay){probe.status="complete";probe.completedAbsoluteDay=today;const system=this.system(ex,probe.systemId);if(system){system.surveyed=true;system.status=this.coloniesInSystem(state,system.id).length?"colonized":"surveyed";}probeArrivals.push(probe);}}
    if(probeArrivals.length)ex.notice={type:"probe-complete",systemId:probeArrivals.at(-1).systemId,absoluteDay:today,prompted:false};
    const ship=ex.ship;if(ship.status!=="travelling")return{probeArrivals,shipArrived:false,shipLost:false};
    const target=ship.targetSystemId,p=this.travelProfileFromStored(state,ship);if(!p)return{probeArrivals,shipArrived:false,shipLost:false};const dailyFuel=p.fuelRequired/Math.max(1,p.days),fuel=consumeContainerCategory(ship.fuelLots,"fuel",dailyFuel);if(fuel.ratio<.999)return{...this.loseShip(state,"Fuel exhausted during interstellar transit."),probeArrivals};
    if(ship.passengers>0){const food=consumeContainerCategory(ship.cargo,"food",ship.passengers*CONFIG.FOOD_PER_COLONIST);if(food.ratio<.999)return{...this.loseShip(state,"Food stores exhausted during interstellar transit."),probeArrivals};}
    if(today<ship.arrivalAbsoluteDay)return{probeArrivals,shipArrived:false,shipLost:false};
    ship.status=target===HOME_SYSTEM_ID?"home":"arrived";ship.systemId=target;ship.targetSystemId=null;ship.departedAbsoluteDay=null;ship.arrivalAbsoluteDay=null;ship.awaitingDestination=target!==HOME_SYSTEM_ID;ship.arrivalPromptedFor=null;state.speed=0;ex.notice={type:target===HOME_SYSTEM_ID?"home-arrival":"ship-arrival",systemId:target,absoluteDay:today};return{probeArrivals,shipArrived:true,shipLost:false};
  }
  travelProfileFromStored(state,ship){const from=ship.sourceSystemId,target=ship.targetSystemId,a=this.system(this.ensure(state),from),b=this.system(this.ensure(state),target);if(!a||!b)return null;const d=distance(a,b),days=Math.max(7,Math.ceil(d/SHIP_SPEED_LY_PER_YEAR*CONFIG.DAYS_PER_YEAR));return{distanceLy:d,days,fuelRequired:Math.ceil(d*SHIP_FUEL_PER_LY)};}
  loseShip(state,reason="Player colony ship lost."){const ship=this.ship(state);ship.status="lost";ship.lostReason=reason;ship.systemId=null;ship.colonyId=null;ship.targetSystemId=null;ship.cargo={};ship.fuelLots={};ship.passengers=0;state.speed=0;state.company.gameOver=true;state.company.expansion.notice={type:"ship-lost",reason,absoluteDay:this.absoluteDay(state)};return{shipLost:true,shipArrived:false,reason};}
  onColonyDied(state){const ship=this.ship(state);if(ship.status==="docked"&&ship.colonyId===state.colonyId)return this.loseShip(state,`${state.contract?.colonyName||"The colony"} collapsed while the sole colony ship was docked.`);return{shipLost:false};}
  coloniesInSystem(state,systemId){return(state.portfolio?.colonies||[]).filter(entry=>entry?.data?.contract?.systemId===systemId).map(entry=>({id:entry.id,name:entry.data.contract.colonyName||entry.name,planetId:entry.data.contract.planetId,status:entry.data.status||"playing"}));}
  dockAtColony(state,colonyId){const ship=this.ship(state),entry=state.portfolio?.colonies?.find(e=>e.id===colonyId);if(!entry)return{ok:false,reason:"Colony not found."};if(entry.data.contract?.systemId!==ship.systemId)return{ok:false,reason:"That colony is in another system."};ship.status="docked";ship.colonyId=colonyId;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;return{ok:true,entry};}
  makePlanetContract(state,systemId,planetId){const system=this.system(this.ensure(state),systemId),planet=system?.planets?.find(p=>p.id===planetId);if(!system||!planet)return null;const a=archById(planet.arch),progress=Math.max(1,Number(state.company.wins)||1)+1,base=this.contracts?.make?this.contracts.make(a,progress,planet.index||0):{arch:a.id,colonyTier:a.colonyTier,name:a.name,environment:a.environment,hazard:a.hazard,supportSystem:a.supportSystem,supportLoad:a.supportLoad,techAccess:a.techAccess,requiredTech:{...a.requiredTech},naturalFood:a.naturalFood,years:10,ext:0,extUsed:0,renewals:0,completed:false,completionAwarded:false,ended:false,goals:{food:120,industry:520,pop:1050},bands:{silver:450000,gold:1000000,plat:2200000},localRevenue:0,localCosts:0};base.uid=`exp-${systemId}-${planetId}-${Date.now()}`;base.name=`${planet.name} Mining Charter`;base.advance=0;base.systemId=systemId;base.systemName=system.name;base.planetId=planetId;base.planetName=planet.name;base.distanceLy=this.distanceFromHome(state,systemId);base.expeditionArrival=true;return base;}
  expeditionManifest(state){const ship=this.ship(state);return{passengers:Math.max(0,Math.floor(ship.passengers)),cargo:clone(ship.cargo)};}
  consumeManifestForNewColony(state,newColonyId){const ship=this.ship(state),manifest=this.expeditionManifest(state),system=this.system(this.ensure(state),ship.systemId);ship.cargo={};ship.passengers=0;ship.status="docked";ship.colonyId=newColonyId;ship.awaitingDestination=false;ship.arrivalPromptedFor=null;if(system){system.surveyed=true;system.status="colonized";}return manifest;}
  sellCargoAtHome(state){const ship=this.ship(state);if(ship.status!=="home")return{ok:false,reason:"The ship is not at the corporate homeworld."};let revenue=0,qty=0;for(const entry of Object.values(ship.cargo||{})){for(const [bandKey,band] of Object.entries(entry.qualityBands||{})){const amount=Math.max(0,Number(band.amount)||0);if(!amount)continue;const unit=this.resources?.sellPrice?.(entry.type,entry.resourceId,bandKey)||0;revenue+=amount*unit;qty+=amount;}}ship.cargo={};state.company.cash=Number(state.company.cash||0)+revenue;state.company.earn=Number(state.company.earn||0)+revenue;return{ok:qty>0,qty,revenue,reason:qty>0?null:"No cargo to sell."};}
  homeCatalog(){return this.resources?.catalog?.()||[];}
  buyAtHome(state,type,resourceId,amount,{toFuelTank=false}={}){const ship=this.ship(state);if(ship.status!=="home")return{ok:false,reason:"The ship is not at the corporate homeworld."};const def=this.resources?.get?.(type,resourceId);if(!def)return{ok:false,reason:"Unknown resource."};if(toFuelTank&&type!=="fuel")return{ok:false,reason:"Only Fuel can enter the fuel tank."};const qty=Math.min(this.capacityRemaining(state),Math.max(0,Math.floor(Number(amount)||0)));if(qty<=0)return{ok:false,reason:"No ship capacity remains."};const unit=(this.resources?.sellPrice?.(type,resourceId)||0)*CONFIG.CORPORATE_BUY_MARKUP,affordable=Math.floor(Math.max(0,Number(state.company.cash)||0)/Math.max(.001,unit)),buy=Math.min(qty,affordable);if(buy<=0)return{ok:false,reason:"Insufficient cash."};const key=`${type}:${resourceId}`,container=toFuelTank?ship.fuelLots:ship.cargo,entry=container[key]||={key,type,resourceId,name:def.name,category:def.category||type,amount:0,qualityBands:{}};addBand(entry,"excellent",buy);const cost=buy*unit;state.company.cash-=cost;return{ok:true,qty:buy,cost,entry};}
}
