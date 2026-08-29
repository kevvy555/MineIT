import * as Base from "./game-state.js";
import { ExpansionService } from "./expansion-service.js";
import { normalizeTechnologyState } from "./technology-service.js";

const expansion=new ExpansionService();

export const COLONY_STATE_KEYS=Base.COLONY_STATE_KEYS;
export const starterInventory=Base.starterInventory;
export const createColonyState=Base.createColonyState;
export const cloneColonyState=Base.cloneColonyState;

function normalizeRequiredTech(required){
  if(!required||typeof required!=="object")return required;
  if(!Number.isFinite(Number(required.scanning)))required.scanning=Math.max(1,Number(required.mining)||1);
  return required;
}
function normalizeLocalTechnology(state){normalizeTechnologyState(state);normalizeRequiredTech(state.contract?.requiredTech);return state;}
function normalizeTechnologyAcrossPortfolio(state){
  normalizeLocalTechnology(state);
  for(const entry of state.portfolio?.colonies||[]){if(!entry?.data)continue;entry.data.colony||={};normalizeTechnologyState({company:state.company,colony:entry.data.colony});normalizeRequiredTech(entry.data.contract?.requiredTech);}
  for(const system of state.company?.expansion?.systems||[])for(const planet of system.planets||[])normalizeRequiredTech(planet.requiredTech);
  return state;
}
function clearLegacyUnresolved(tile,scanLevel){
  Object.assign(tile,{revealed:true,lastScannedAtLevel:scanLevel,unresolved:false,unresolvedScanningLevel:0,requiredScanningLevel:0,empty:true,type:null,family:null,resourceId:null,name:"Clear Land",quality:null,resourceRarity:null,resourceMult:null,requiredMiningLevel:0,requiredMiningTech:null,sustainability:null,reserve:null,initialReserve:null,renewableOriginalRank:null,renewableHealth:null,renewableWiped:false,harvestIntensity:null,depleted:false,resourceCovered:false});
}
function normalizeSurveyHistory(data){
  if(!data)return data;const scanLevel=Math.max(1,Number(data.colony?.tech?.scanning)||1);
  for(const tile of Object.values(data.tiles||{})){
    const wasScanned=!!tile.revealed||!!tile.unresolved;
    if(tile.unresolved)clearLegacyUnresolved(tile,scanLevel);
    else tile.lastScannedAtLevel=wasScanned?Math.max(1,Number(tile.lastScannedAtLevel)||scanLevel):Math.max(0,Number(tile.lastScannedAtLevel)||0);
    delete tile.deepResource;delete tile.deepRevealed;
    if(tile.resourceId&&tile.development)tile.resourceCovered=true;
  }
  for(const scan of data.scans||[]){if(!Number.isFinite(Number(scan.scanningLevel)))scan.scanningLevel=scanLevel;scan.resurvey=!!scan.resurvey;}
  return data;
}
function normalizeSurveyHistoryAcrossPortfolio(state){
  normalizeSurveyHistory(state);
  for(const entry of state.portfolio?.colonies||[])normalizeSurveyHistory(entry?.data);
  return state;
}

/** Runtime state factory: base schema/migrations plus persisted interstellar expansion, deployed capability and scan-history state. */
export function createGameState(contract){
  const state=Base.createGameState(contract);
  expansion.ensure(state);
  normalizeTechnologyAcrossPortfolio(state);
  normalizeSurveyHistoryAcrossPortfolio(state);
  state.version=11;
  return state;
}

export function normalizeState(state){
  const normalized=Base.normalizeState(state);
  expansion.ensure(normalized);
  normalizeTechnologyAcrossPortfolio(normalized);
  normalizeSurveyHistoryAcrossPortfolio(normalized);
  normalized.version=11;
  return normalized;
}
