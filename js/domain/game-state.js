import { CONFIG } from "../core/config.js?v=5.0.0";
import { RESOURCE_TYPES, CATEGORY_NAMES } from "../data/resources.js?v=4.0.1";

export const COLONY_STATE_KEYS=Object.freeze(["colonyId","seed","contract","day","year","pop","speed","status","camera","tiles","scans","scanQueue","inventory","trade","colony","metrics"]);
const clone=value=>JSON.parse(JSON.stringify(value)),QUALITY_KEYS=new Set(["common","good","excellent","exceptional","rare","extraordinary"]),DEFAULT_QUALITY="excellent";
function nextTradeDay(state){const absolute=(Math.max(1,state.year)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,state.day);if(absolute<CONFIG.FIRST_TRADE_DAY)return CONFIG.FIRST_TRADE_DAY;const visits=Math.floor((absolute-CONFIG.FIRST_TRADE_DAY)/CONFIG.TRADE_INTERVAL_DAYS)+1;return CONFIG.FIRST_TRADE_DAY+visits*CONFIG.TRADE_INTERVAL_DAYS;}
function qualityBands(amount=0){const qty=Math.max(0,Number(amount)||0);return qty?{[DEFAULT_QUALITY]:{amount:qty}}:{};}
function starterEntry(key,type,resourceId,name,category,amount){return{key,type,resourceId,name,category,amount,qualityBands:qualityBands(amount)};}
export function starterInventory(){return{
  "food:fungal":starterEntry("food:fungal","food","fungal","Fungal Shelf","Food",650),
  "build:fiber":starterEntry("build:fiber","build","fiber","Construction Fibre","Build",850),
  "fuel:biomass":starterEntry("fuel:biomass","fuel","biomass","Biomass","Fuel",700),
  "ore:surface-iron":starterEntry("ore:surface-iron","ore","surface-iron","Surface Iron Nodules","Ore",300)
};}
function defaultMetrics(){return{food:0,industry:100,stockValue:0,foodStock:650,buildStock:850,fuelStock:700,oreStock:300,foodDemand:0,fuelDemand:0,oreDemand:0,foodSupply:1,fuelSupply:1,oreSupply:1,powerDemand:0,powerCapacity:30,powerFactor:1,foodMult:1,miningMult:1,syntheticFood:0,powerTech:1,foodTech:1,miningTech:1,powerPopulationCap:250,powerIndustryCap:2,fuelIntensity:.1,operatingCost:0,totalOperatingCost:0,sl:1,sf:1,hint:0,slots:1};}
export function createColonyState(contract){
  const colonyId=contract.uid||`colony-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;contract.uid=colonyId;
  contract.localRevenue=Number(contract.localRevenue)||0;contract.localCosts=Number(contract.localCosts)||0;contract.renewals=Number(contract.renewals)||0;contract.completed=!!contract.completed;contract.completionAwarded=!!contract.completionAwarded;contract.ended=!!contract.ended;
  return{colonyId,seed:(Math.random()*0x7fffffff)|0,contract,day:1,year:1,pop:CONFIG.START_POPULATION,speed:1,status:"playing",camera:{x:-4,y:-4},tiles:{},scans:[],scanQueue:[],inventory:starterInventory(),trade:{active:false,nextArrivalDay:CONFIG.FIRST_TRADE_DAY,visits:0,returnSpeed:1,arrivedAt:null},colony:{housingCapacity:CONFIG.START_HOUSING,housingLevel:1,industryLevel:CONFIG.START_INDUSTRY_LEVEL},metrics:defaultMetrics()};
}
export function cloneColonyState(state){const data={};for(const key of COLONY_STATE_KEYS)data[key]=clone(state[key]);return data;}
function migrateType(type,id){if(type==="food")return{type:"food",id};if(type==="valuable")return{type:"ore",id};if(type==="industry"){if(id==="carbon")return{type:"fuel",id:"coal"};if(id==="bulk")return{type:"build",id:"stone"};return{type:"ore",id};}return{type,id};}
function migrateInventory(source){
  const migrated={};for(const entry of Object.values(source||{})){const m=migrateType(entry.type,entry.resourceId),key=`${m.type}:${m.id}`,def=RESOURCE_TYPES[m.type]?.find(x=>x.id===m.id);migrated[key]||={key,type:m.type,resourceId:m.id,name:def?.name||entry.name,category:CATEGORY_NAMES[m.type]||m.type,amount:0,qualityBands:{}};const target=migrated[key];
    if(entry.qualityBands&&typeof entry.qualityBands==="object"){for(const [rawKey,rawBand] of Object.entries(entry.qualityBands)){const bandKey=QUALITY_KEYS.has(rawKey)?rawKey:DEFAULT_QUALITY,qty=Math.max(0,Number(rawBand?.amount)||0);target.qualityBands[bandKey]||={amount:0};target.qualityBands[bandKey].amount+=qty;}}
    else{const qty=Math.max(0,Number(entry.amount)||0);if(qty){target.qualityBands[DEFAULT_QUALITY]||={amount:0};target.qualityBands[DEFAULT_QUALITY].amount+=qty;}}
  }
  for(const entry of Object.values(migrated))entry.amount=Object.values(entry.qualityBands).reduce((s,b)=>s+Math.max(0,Number(b.amount)||0),0);return migrated;
}
export function createGameState(contract){
  const local=createColonyState(contract),company={cash:CONFIG.START_CASH,rep:0,wins:0,earn:0,licenses:[],tech:{power:1,food:1,mining:1},nextColonyNumber:2};
  contract.colonyName||="Colony 01";
  const state={version:6,company,portfolio:{activeColonyId:local.colonyId,colonies:[]},...local};
  state.portfolio.colonies.push({id:local.colonyId,name:contract.colonyName,createdAt:Date.now(),data:cloneColonyState(state)});
  return state;
}
export function normalizeState(state){
  const previousVersion=state.version||0;
  state.company=Object.assign({cash:CONFIG.START_CASH,rep:0,wins:0,earn:0,licenses:[],tech:{power:1,food:1,mining:1},nextColonyNumber:2},state.company||{});state.company.tech=Object.assign({power:1,food:1,mining:1},state.company.tech||{});
  if((state.version||0)<4&&Array.isArray(state.company.licenses)){const food=state.company.licenses.filter(x=>String(x).startsWith("food-")).length,mining=state.company.licenses.filter(x=>String(x).startsWith("industry-")||String(x).startsWith("survey-")).length;state.company.tech.food=Math.max(state.company.tech.food,Math.min(10,1+food));state.company.tech.mining=Math.max(state.company.tech.mining,Math.min(10,1+mining));}
  state.metrics=Object.assign(defaultMetrics(),state.metrics||{});state.contract.colonyTier||=1;state.contract.environment||="Temperate / breathable";state.contract.hazard||="Minimal environmental support required.";state.contract.supportSystem||="Open Habitat";state.contract.techAccess||="direct";state.contract.requiredTech||={power:1,food:1,mining:1};if(state.contract.naturalFood===undefined)state.contract.naturalFood=true;state.contract.localRevenue=Number(state.contract.localRevenue)||Math.max(0,previousVersion<5?(state.company.earn||0)-(state.contract.startEarn||0):0);state.contract.localCosts=Number(state.contract.localCosts)||0;state.contract.renewals=Number(state.contract.renewals)||0;state.contract.completed=!!state.contract.completed;state.contract.completionAwarded=!!state.contract.completionAwarded;state.contract.ended=!!state.contract.ended;state.contract.colonyName||="Colony 01";
  state.colonyId||=state.contract.uid||`legacy-${Date.now()}`;state.contract.uid=state.colonyId;state.camera||={x:-4,y:-4};state.tiles||={};state.scans||=[];state.scanQueue||=[];state.inventory=migrateInventory(state.inventory||{});state.colony=Object.assign({housingCapacity:CONFIG.START_HOUSING,housingLevel:1,industryLevel:1},state.colony||{});state.trade=Object.assign({active:false,nextArrivalDay:nextTradeDay(state),visits:0,returnSpeed:1,arrivedAt:null},state.trade||{});if(!Number.isFinite(state.trade.nextArrivalDay))state.trade.nextArrivalDay=nextTradeDay(state);state.status||="playing";if(![0,1,2,4].includes(state.speed))state.speed=1;if(!Object.keys(state.inventory).length)state.inventory=starterInventory();
  for(const tile of Object.values(state.tiles)){if(!tile.revealed)continue;const m=migrateType(tile.type,tile.resourceId);tile.type=m.type;tile.family=m.type;tile.resourceId=m.id;const def=RESOURCE_TYPES[m.type]?.find(x=>x.id===m.id);if(def){tile.name=def.name;tile.resourceRarity=def.rarity;tile.resourceMult=def.multiplier;tile.requiredMiningLevel=def.miningLevel;tile.requiredMiningTech=def.unlock;}if(tile.type==="food"||tile.resourceId==="biomass"||tile.resourceId==="fiber"){tile.sustainability="renewable";tile.reserve=null;tile.initialReserve=null;tile.abundance||=1;tile.abundanceLabel||="Established";}else{tile.sustainability="finite";if(!Number.isFinite(tile.reserve))tile.reserve=0;if(!Number.isFinite(tile.initialReserve))tile.initialReserve=tile.reserve;tile.depositScale||="Legacy deposit";}tile.requiredMiningLevel||=1;}
  if(!state.portfolio||!Array.isArray(state.portfolio.colonies)){state.portfolio={activeColonyId:state.colonyId,colonies:[]};}
  state.portfolio.activeColonyId||=state.colonyId;
  if(!state.portfolio.colonies.length)state.portfolio.colonies.push({id:state.colonyId,name:state.contract.colonyName,createdAt:Date.now(),data:cloneColonyState(state)});
  for(const entry of state.portfolio.colonies){if(entry?.data)entry.data.inventory=migrateInventory(entry.data.inventory||{});}
  state.company.nextColonyNumber=Math.max(Number(state.company.nextColonyNumber)||2,state.portfolio.colonies.length+1);
  state.version=6;return state;
}
