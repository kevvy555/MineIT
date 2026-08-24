export class CorporateEventService{
  constructor(contracts,trade){this.contracts=contracts;this.trade=trade;}
  ensure(company){
    company.pendingEvents=Array.isArray(company.pendingEvents)?company.pendingEvents:[];
    company.nextEventSequence=Math.max(1,Number(company.nextEventSequence)||1);
    if(company.eventReturnColonyId===undefined)company.eventReturnColonyId=null;
    if(!Number.isFinite(Number(company.eventResumeSpeed)))company.eventResumeSpeed=1;
    return company.pendingEvents;
  }
  priority(event){if(event?.type==="ship"&&event?.recovered)return 0;if(event?.type==="contract")return 1;if(event?.type==="ship")return 2;return 9;}
  key(event){return`${event?.type||"unknown"}:${event?.colonyId||"none"}:${event?.type==="contract"?event?.kind||"unknown":""}`;}
  sort(company){this.ensure(company);company.pendingEvents.sort((a,b)=>this.priority(a)-this.priority(b)||(Number(a.sequence)||0)-(Number(b.sequence)||0));return company.pendingEvents;}
  enqueue(company,event){
    this.ensure(company);const key=this.key(event),existing=company.pendingEvents.find(e=>this.key(e)===key);
    if(existing){if(event.recovered)existing.recovered=true;return existing;}
    const queued={...event,sequence:company.nextEventSequence++};company.pendingEvents.push(queued);this.sort(company);return queued;
  }
  queueShip(local,colonyName,{recovered=false}={}){return this.enqueue(local.company,{type:"ship",colonyId:local.colonyId,colonyName:colonyName||local.contract?.colonyName||"Colony",recovered:!!recovered});}
  queueContract(local,colonyName,kind,{recovered=false}={}){
    if(!kind)return null;local.contract||={};local.contract.pendingDecision=kind;
    if(local.status!=="contract-decision")local.contract.pendingDecisionPreviousStatus=local.status;
    local.status="contract-decision";
    return this.enqueue(local.company,{type:"contract",colonyId:local.colonyId,colonyName:colonyName||local.contract?.colonyName||"Colony",kind,recovered:!!recovered});
  }
  remove(company,event){this.ensure(company);const key=this.key(event),before=company.pendingEvents.length;company.pendingEvents=company.pendingEvents.filter(e=>this.key(e)!==key);return before-company.pendingEvents.length;}
  removeForColony(company,colonyId,type=null){this.ensure(company);const before=company.pendingEvents.length;company.pendingEvents=company.pendingEvents.filter(e=>e.colonyId!==colonyId||(type&&e.type!==type));return before-company.pendingEvents.length;}
  sanitize(company,validColonyIds){
    this.ensure(company);const valid=new Set(validColonyIds||[]),seen=new Set();company.pendingEvents=company.pendingEvents.filter(event=>{
      if(!event||!valid.has(event.colonyId)||!["ship","contract"].includes(event.type))return false;
      const key=this.key(event);if(seen.has(key))return false;seen.add(key);if(!Number.isFinite(Number(event.sequence)))event.sequence=company.nextEventSequence++;return true;
    });this.sort(company);return company.pendingEvents;
  }
  recoverLocal(local,colonyName){
    const results=[];const existingDecision=local.contract?.pendingDecision||null;
    const deadline=existingDecision?null:this.contracts.deadlineState(local);
    const wasDocked=!!local.trade?.active;
    const shipDue=!wasDocked&&this.trade.shouldArrive(local);
    if(wasDocked)results.push(this.queueShip(local,colonyName,{recovered:true}));
    if(existingDecision)results.push(this.queueContract(local,colonyName,existingDecision,{recovered:true}));
    else if(deadline)results.push(this.queueContract(local,colonyName,deadline,{recovered:true}));
    if(shipDue){this.trade.arrive(local);results.push(this.queueShip(local,colonyName,{recovered:false}));}
    return results.filter(Boolean);
  }
}
