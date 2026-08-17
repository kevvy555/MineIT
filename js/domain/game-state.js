import { CONFIG } from "../core/config.js";

export function createGameState(contract){
  return {
    version:2,
    seed:(Math.random()*0x7fffffff)|0,
    company:{cash:CONFIG.START_CASH,rep:0,wins:0,earn:0,licenses:[]},
    contract,
    day:1,year:1,pop:CONFIG.START_POPULATION,speed:1,status:"playing",
    camera:{x:-4,y:-4},
    tiles:{},scans:[],scanQueue:[],offers:[],offerSig:"",
    metrics:{food:0,industry:0,fm:1,im:1,pm:1,sl:1,sf:1,hint:0,income:0,slots:1}
  };
}

export function normalizeState(state){
  state.company = Object.assign({cash:CONFIG.START_CASH,rep:0,wins:0,earn:0,licenses:[]},state.company||{});
  state.metrics = Object.assign({food:0,industry:0,fm:1,im:1,pm:1,sl:1,sf:1,hint:0,income:0,slots:1},state.metrics||{});
  state.camera ||= {x:-4,y:-4};
  state.tiles ||= {};
  state.scans ||= [];
  state.scanQueue ||= [];
  state.offers ||= [];
  state.offerSig ||= "";
  state.status ||= "playing";
  if(![0,1,2,4].includes(state.speed)) state.speed=1;

  for(const tile of Object.values(state.tiles)){
    if(!tile.revealed) continue;
    if(tile.type==="food"){
      tile.sustainability="renewable";
      tile.abundance ||= 1;
      tile.abundanceLabel ||= "Established";
      tile.reserve=null;
      tile.initialReserve=null;
      if(tile.depleted&&tile.level>0){tile.depleted=false;tile.developed=true;}
    }else{
      tile.sustainability="finite";
      tile.abundance ||= 1;
      if(!Number.isFinite(tile.reserve)) tile.reserve=0;
      if(!Number.isFinite(tile.initialReserve)) tile.initialReserve=tile.reserve;
      tile.depositScale ||= "Legacy deposit";
    }
  }
  state.version=2;
  return state;
}
