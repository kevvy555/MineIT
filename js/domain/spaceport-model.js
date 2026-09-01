import { CONFIG } from "../core/config.js";

const ENGINEERING_BERTH_STATUSES=new Set(["landed","commissioning"]);

const colonyEntry=(state,colonyId)=>state.portfolio?.colonies?.find(entry=>entry.id===colonyId)||null;
const colonyData=(state,colonyId)=>colonyId===state.colonyId?state:colonyEntry(state,colonyId)?.data||null;

export function engineeringDeployments(state){
  state.colony||={};
  state.colony.engineeringDeployments=Array.isArray(state.colony.engineeringDeployments)?state.colony.engineeringDeployments:[];
  return state.colony.engineeringDeployments;
}

export function ensureSpaceport(state){
  state.colony||={};
  const existing=state.colony.spaceport||{};
  state.colony.spaceport={
    level:Math.max(1,Math.floor(Number(existing.level)||1)),
    berthCapacity:Math.max(1,Math.floor(Number(existing.berthCapacity)||CONFIG.BASIC_SPACEPORT_BERTHS)),
    providedBy:existing.providedBy||"conglomerate",
    tile:{x:0,y:0}
  };
  engineeringDeployments(state);
  return state.colony.spaceport;
}

export function playerShipsAtColony(state,colonyId=state.colonyId){
  return (state.company?.expansion?.ships||[])
    .filter(ship=>ship?.status==="docked"&&ship.colonyId===colonyId);
}

// Kept for old callers that only need a yes/no answer.
export function playerShipOccupiesBerth(state){
  return playerShipsAtColony(state).length>0;
}

export function buyerShipOccupants(state,colonyId=state.colonyId){
  const contracts=Object.values(state.company?.buyers?.contracts||{});
  return contracts
    .filter(contract=>contract?.status==="active"&&contract.colonyId===colonyId&&contract.ship?.status==="docked")
    .map(contract=>({id:`buyer-ship:${contract.id}`,type:"buyer-collection-ship",owner:"buyer",label:contract.shipName||"Buyer Collection Ship",contractId:contract.id,offerId:contract.offerId,buyerId:contract.buyerId}));
}

export function berthOccupantsForColony(state,colonyId=state.colonyId){
  const local=colonyData(state,colonyId);
  if(!local)return[];
  const occupants=[];
  for(const ship of playerShipsAtColony(state,colonyId)){
    occupants.push({id:ship.id,type:"player-ship",owner:"player",label:ship.name||"Player Ship",shipId:ship.id,shipClassId:ship.shipClassId||null});
  }
  if(local.trade?.active)occupants.push({id:"corporate-trade-ship",type:"corporate-ship",owner:"conglomerate",label:"Corporate Ship"});
  for(const deployment of local.colony?.engineeringDeployments||[]){
    if(ENGINEERING_BERTH_STATUSES.has(deployment?.status))occupants.push({id:deployment.id,type:"engineering-ship",owner:"conglomerate",label:"Engineering Ship",deployment});
  }
  occupants.push(...buyerShipOccupants(state,colonyId));
  return occupants;
}

export function berthOccupants(state){
  ensureSpaceport(state);
  return berthOccupantsForColony(state,state.colonyId);
}

export function berthStatusForColony(state,colonyId=state.colonyId){
  const local=colonyData(state,colonyId);
  if(!local)return{level:0,capacity:0,used:0,free:0,occupants:[],full:true,missing:true};
  if(colonyId===state.colonyId)ensureSpaceport(state);
  const port=local.colony?.spaceport||{};
  const level=Math.max(1,Math.floor(Number(port.level)||1));
  const capacity=Math.max(1,Math.floor(Number(port.berthCapacity)||CONFIG.BASIC_SPACEPORT_BERTHS));
  const occupants=berthOccupantsForColony(state,colonyId);
  const used=occupants.length;
  return{level,capacity,used,free:Math.max(0,capacity-used),occupants,full:used>=capacity};
}

export function berthStatus(state){
  return berthStatusForColony(state,state.colonyId);
}

export function hasFreeBerth(state){return berthStatus(state).free>0;}
export function hasFreeBerthAtColony(state,colonyId){return berthStatusForColony(state,colonyId).free>0;}
