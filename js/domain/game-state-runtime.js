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

/** Runtime state factory: base schema/migrations plus persisted interstellar expansion and deployed corporate capability state. */
export function createGameState(contract){
  const state=Base.createGameState(contract);
  expansion.ensure(state);
  normalizeTechnologyAcrossPortfolio(state);
  state.version=10;
  return state;
}

export function normalizeState(state){
  const normalized=Base.normalizeState(state);
  expansion.ensure(normalized);
  normalizeTechnologyAcrossPortfolio(normalized);
  normalized.version=10;
  return normalized;
}
