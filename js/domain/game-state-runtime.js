import * as Base from "./game-state.js";
import { ExpansionService } from "./expansion-service.js";

const expansion=new ExpansionService();

export const COLONY_STATE_KEYS=Base.COLONY_STATE_KEYS;
export const starterInventory=Base.starterInventory;
export const createColonyState=Base.createColonyState;
export const cloneColonyState=Base.cloneColonyState;

/** Runtime state factory: base schema/migrations plus persisted interstellar expansion state. */
export function createGameState(contract){
  const state=Base.createGameState(contract);
  expansion.ensure(state);
  state.version=9;
  return state;
}

export function normalizeState(state){
  const normalized=Base.normalizeState(state);
  expansion.ensure(normalized);
  normalized.version=9;
  return normalized;
}
