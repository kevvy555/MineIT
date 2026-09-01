export class CorporateEventService{
  constructor(contracts,trade,buyers=null){this.contracts=contracts;this.trade=trade;this.buyers=buyers;}
  ensure(company){
    company.pendingEvents=Array.isArray(company.pendingEvents)?company.pendingEvents:[];
    company.nextEventSequence=Math.max(1,Number(company.nextEventSequence)||1);
    if(company.eventReturnColonyId===undefined)company.eventReturnColonyId=null;
    if(!Number.isFinite(Number(company.eventResumeSpeed)))company.eventResumeSpeed=1;
    return company.pendingEvents;
  }
  priority(event){if((event?.type==="ship"||event?.type==="buyer")&&event?.recovered)return 0;if(event?.type==="buyer")return 1;if(event?.type==="contract")return 2;if(event?.type==="ship")return 3;return 9;}
  key(event){if(event?.type==="buyer")return`buyer:${event?.colonyId||"none"}:${event?.contractId||"none"}`;return`${event?.type||"unknown"}:${event?.colonyId||"none"}:${event?.type==="contract"?event?.kind||"unknown":""}`;}
  sort(company){this.ensure(company);company.pendingEvents.sort((a,b)=>this.priority(a)-this.priority(b)||(Number(a.sequence)||0)-(Number(b.sequence)||0));return company.pendingEvents;}
  enqueue(company,event){
    this.ensure(company);const key=this.key(event),existing=company.pendingEvents.find(e=>this.key(e)===key);
    if(existing){if(event.recovered)existing.recovered=true;Object.assign(existing,{attemptIndex:event.attemptIndex??existing.attemptIndex,dueAbsoluteDay:event.dueAbsoluteDay??existing.dueAbsoluteDay});this.sort(company);return existing;}
    const queued={...event,sequence:company.nextEventSequence++};company.pendingEvents.push(queued);this.sort(company);return queued;
  }
  queueShip(local,colonyName,{recovered=false}={}){return this.enqueue(local.company,{type:"ship",colonyId:local.colonyId,colonyName:colonyName||local.contract?.colonyName||"Colony",recovered:!!recovered});}
  queueBuyer(local,colonyName,buyerEvent,{recovered=false}={}){if(!buyerEvent?.contractId)return null;return this.enqueue(local.company,{...buyerEvent,type:"buyer",colonyId:local.colonyId,colonyName:colonyName||local.contract?.colonyName||"Colony",recovered:!!recovered});}
  queueContract(local,colonyName,kind,{recovered=false}={}){
    if(!kind)return null;local.contract||={};local.contract.pendingDecision=kind;
    if(local.status!=="contract-decision")local.contract.pendingDecisionPreviousStatus=local.status;
    local.status="contract-decision";
    return this.enqueue(local.company,{type:"contract",colonyId:local.colonyId,colonyName:colonyName||local.contract?.colonyName||"Colony",kind,recovered:!!recovered});
  }
  remove(company,event){this.ensure(company);const key=this.key(event),before=company.pendingEvents.length;company.pendingEvents=company.pendingEvents.filter(e=>this.key(e)!==key);return before-company.pendingEvents.length;}
  removeForColony(company,colonyId,type=null){this.ensure(company);const before=company.pendingEvents.length;company.pendingEvents=company.pendingEvents.filter(e=>e.colonyId!==colonyId||(type&&e.type!==type));return before-company.pendingEvents.length;}
  sanitize(company,validColonyIds){
    this.ensure(company);const valid=new Set(validColonyIds||[]),seen=new Set(),buyerContracts=company.buyers?.contracts||{};company.pendingEvents=company.pendingEvents.filter(event=>{
      if(!event||!valid.has(event.colonyId)||!["ship","contract","buyer"].includes(event.type))return false;
      if(event.type==="buyer"){const contract=buyerContracts[event.contractId];if(!contract||contract.status!=="active"||contract.colonyId!==event.colonyId)return false;}
      const key=this.key(event);if(seen.has(key))return false;seen.add(key);if(!Number.isFinite(Number(event.sequence)))event.sequence=company.nextEventSequence++;return true;
    });this.sort(company);return company.pendingEvents;
  }
  legacyPendingDecision(local){if(local?.status==="deadline-missed")return"extension";if(local?.status==="failed")return"failed";return null;}
  shipDueWhileDecisionPending(local){
    if(local?.status!=="contract-decision")return this.trade.shouldArrive(local);
    const current=local.status,previous=local.contract?.pendingDecisionPreviousStatus||"playing";local.status=previous;
    try{return this.trade.shouldArrive(local);}finally{local.status=current;}
  }
  recoverLocal(local,colonyName){
    const results=[],existingDecision=local.contract?.pendingDecision||this.legacyPendingDecision(local),deadline=existingDecision?null:this.contracts.deadlineState(local),wasDocked=!!local.trade?.active,shipDue=!wasDocked&&this.shipDueWhileDecisionPending(local);
    if(wasDocked)results.push(this.queueShip(local,colonyName,{recovered:true}));
    if(existingDecision)results.push(this.queueContract(local,colonyName,existingDecision,{recovered:true}));
    else if(deadline)results.push(this.queueContract(local,colonyName,deadline,{recovered:true}));
    if(shipDue){this.trade.arrive(local);results.push(this.queueShip(local,colonyName,{recovered:false}));}
    if(this.contracts.isOperating(local))for(const buyerEvent of this.buyers?.recoverEvents?.(local)||[])results.push(this.queueBuyer(local,colonyName,buyerEvent,{recovered:true}));
    return results.filter(Boolean);
  }
}
