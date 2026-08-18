import { cloneColonyState, createColonyState, COLONY_STATE_KEYS } from "./game-state.js?v=5.1.0";

const clone=value=>JSON.parse(JSON.stringify(value));
export class PortfolioService {
  ensure(state){
    state.portfolio||={activeColonyId:state.colonyId,colonies:[]};state.portfolio.colonies||=[];
    if(!state.portfolio.colonies.length)this.captureActive(state,true);
    if(!state.portfolio.activeColonyId)state.portfolio.activeColonyId=state.colonyId||state.portfolio.colonies[0]?.id;
    return state.portfolio;
  }
  activeEntry(state){this.ensure(state);return state.portfolio.colonies.find(c=>c.id===state.portfolio.activeColonyId)||null;}
  captureActive(state,createIfMissing=false){
    this.ensureShallow(state);const id=state.colonyId||state.contract?.uid||state.portfolio.activeColonyId;let entry=state.portfolio.colonies.find(c=>c.id===id);
    if(!entry&&createIfMissing){entry={id,name:state.contract?.colonyName||state.contract?.name||"Colony",createdAt:Date.now(),data:{}};state.portfolio.colonies.push(entry);}
    if(!entry)return null;entry.id=id;entry.name=state.contract?.colonyName||entry.name||state.contract?.name||"Colony";entry.data=cloneColonyState(state);state.portfolio.activeColonyId=id;return entry;
  }
  ensureShallow(state){state.portfolio||={activeColonyId:state.colonyId,colonies:[]};state.portfolio.colonies||=[];}
  apply(state,entry){
    const company=state.company,portfolio=state.portfolio,version=state.version;for(const key of COLONY_STATE_KEYS)delete state[key];Object.assign(state,clone(entry.data));state.company=company;state.portfolio=portfolio;state.version=version;state.portfolio.activeColonyId=entry.id;state.colonyId=entry.id;return state;
  }
  switchTo(state,id){this.captureActive(state,true);const entry=state.portfolio.colonies.find(c=>c.id===id);if(!entry)return false;this.apply(state,entry);return true;}
  addColony(state,contract){
    this.captureActive(state,true);const number=Math.max(1,Number(state.company.nextColonyNumber)||state.portfolio.colonies.length+1);state.company.nextColonyNumber=number+1;contract.colonyName=`Colony ${String(number).padStart(2,"0")}`;contract.localRevenue=0;contract.localCosts=0;const local=createColonyState(contract),entry={id:local.colonyId,name:contract.colonyName,createdAt:Date.now(),data:clone(local)};state.portfolio.colonies.push(entry);state.company.cash+=contract.advance||0;this.apply(state,entry);return entry;
  }
  entries(state){this.captureActive(state,true);return state.portfolio.colonies;}
  runtimeState(root,entry){return{version:root.version,company:root.company,...clone(entry.data)};}
  simulateInactive(root,callback){
    this.captureActive(root,true);for(const entry of root.portfolio.colonies){if(entry.id===root.portfolio.activeColonyId)continue;const temp=this.runtimeState(root,entry);callback(temp,entry);entry.name=temp.contract?.colonyName||entry.name;entry.data=cloneColonyState(temp);}
  }
  removeActive(state){
    this.captureActive(state,true);if(state.portfolio.colonies.length<=1)return{ok:false,reason:"Open another colony before disposing of your final colony."};const id=state.portfolio.activeColonyId,index=state.portfolio.colonies.findIndex(c=>c.id===id);if(index<0)return{ok:false,reason:"Active colony not found."};state.portfolio.colonies.splice(index,1);const next=state.portfolio.colonies[Math.min(index,state.portfolio.colonies.length-1)];this.apply(state,next);return{ok:true,removedId:id,nextId:next.id};
  }
  summary(entry){
    const d=entry.data||{},m=d.metrics||{},c=d.contract||{};return{id:entry.id,name:c.colonyName||entry.name,contractName:c.name,environment:c.environment,tier:c.colonyTier||1,status:d.status||"playing",year:d.year||1,day:d.day||1,pop:d.pop||0,industryLevel:d.colony?.industryLevel||1,industry:m.industry||0,operatingCost:m.operatingCost||0,foodStock:m.foodStock||0,fuelStock:m.fuelStock||0,oreStock:m.oreStock||0,completed:!!c.completed,ended:!!c.ended};
  }
}
