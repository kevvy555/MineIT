import { UIController as BaseUIController } from "./operational-controls-ui.js";

const CONTRACT_LABEL={complete:"INITIAL CONTRACT COMPLETE",extension:"CONTRACT DEADLINE MISSED","renewal-ended":"RENEWAL TERM COMPLETE",failed:"CONTRACT FAILED"};

/** Keeps cross-colony contract and corporate-ship events visible until resolved. */
export class UIController extends BaseUIController{
  attentionStatus(){
    const event=this.state.company?.pendingEvents?.[0];
    if(event?.type==="contract")return{level:event.kind==="failed"?"bad":"warn",title:`${event.colonyName||"COLONY"} — ${CONTRACT_LABEL[event.kind]||"CONTRACT ACTION"}`,detail:"Corporation time is paused until this decision is resolved.",label:"OPEN DECISION ›",action:"event"};
    if(event?.type==="ship"&&event.colonyId!==this.state.colonyId)return{level:"warn",title:`SHIP WAITING — ${event.colonyName||"COLONY"}`,detail:"A corporate ship is docked at another colony.",label:"OPEN SHIP ›",action:"event"};
    return super.attentionStatus();
  }
  runAttentionAction(){
    const a=this.currentAttention||this.attentionStatus();
    if(a.action==="event"){this.onProcessPendingEvent?.();return;}
    super.runAttentionAction();
  }
  help(){
    super.help();const intro=this.modal.querySelector("#help-index .card .effect");if(intro)intro.textContent="Rules current through v5.8.1. Ship arrivals and contract decisions from any colony pause the shared corporation clock, switch you to the affected colony, and remain visible until resolved.";
  }
}
