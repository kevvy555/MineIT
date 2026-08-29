import { CONFIG } from "../core/config.js";

const ENGINEERING_BERTH_STATUSES=new Set(["landed","commissioning"]);

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

export function playerShipOccupiesBerth(state){
  const ship=state.company?.expansion?.ship;
  return !!ship&&ship.status==="docked"&&ship.colonyId===state.colonyId;
}

export function berthOccupants(state){
  const port=ensureSpaceport(state),occupants=[];
  if(playerShipOccupiesBerth(state))occupants.push({id:"player-colony-ship",type:"player-ship",owner:"player",label:"Colony Ship"});
  if(state.trade?.active)occupants.push({id:"corporate-trade-ship",type:"corporate-ship",owner:"conglomerate",label:"Corporate Ship"});
  for(const deployment of engineeringDeployments(state))if(ENGINEERING_BERTH_STATUSES.has(deployment.status))occupants.push({id:deployment.id,type:"engineering-ship",owner:"conglomerate",label:"Engineering Ship",deployment});
  return occupants.slice(0,Math.max(port.berthCapacity,occupants.length));
}

export function berthStatus(state){
  const spaceport=ensureSpaceport(state),occupants=berthOccupants(state),used=occupants.length,capacity=spaceport.berthCapacity;
  return{level:spaceport.level,capacity,used,free:Math.max(0,capacity-used),occupants,full:used>=capacity};
}

export function hasFreeBerth(state){return berthStatus(state).free>0;}
