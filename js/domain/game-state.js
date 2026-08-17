import { CONFIG } from "../core/config.js";

export function createGameState(contract){
  return {
    version:1,
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
  return state;
}
