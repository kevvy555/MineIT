import { ContractUIMixin } from "./contract-ui.js";
import { V55UIMixin } from "./v55-ui.js";
import { formatMoney,formatNumber } from "../core/utils.js";
import { renderViewTemplate } from "../core/view-template.js";

export class V55ContractLogUIMixin {
  contractLogOnce(type,message,data={}){const uid=this.state.contract?.uid;if(this.state.gameLog?.events?.some(e=>e.type===type&&e.data?.contractUid===uid&&e.data?.renewal===data.renewal&&e.data?.extension===data.extension))return;this.logEvent(type,message,{contractUid:uid,...data});this.repo.save(this.state);}
  wrapRenewButton(){const button=this.modal.querySelector("[data-renew]");if(!button||button.dataset.loggedContract55)return;button.dataset.loggedContract55="1";const original=button.onclick;button.onclick=e=>{const before=this.state.contract.renewals||0,cash=this.state.company.cash;original?.call(button,e);if((this.state.contract.renewals||0)>before)this.contractLogOnce("contract-renewed",`${this.state.contract.colonyName} renewed its contract for ${this.state.contract.renewals} renewal term(s).`,{renewal:this.state.contract.renewals,fee:cash-this.state.company.cash});};}
  colonyPanel(){V55UIMixin.prototype.colonyPanel.call(this);this.wrapRenewButton();}
  completionActions(title,score=null){ContractUIMixin.prototype.completionActions.call(this,title,score);this.wrapRenewButton();}

  async corporationContractFailed(){
    const fee=this.contracts.extensionFee(this.state),cash=this.state.company.cash,score=this.contracts.score(this.state),reason=`${this.state.contract.colonyName} missed its contract objectives and needed ${formatMoney(fee)} for the next extension, but only ${formatMoney(cash)} was available.`;
    this.contracts.failCorporationForContract(this.state,reason);this.contractLogOnce("corporation-contract-failed",`${this.state.contract.colonyName} defaulted after an unaffordable contract extension.`,{extension:this.state.contract.extUsed||0,fee,cash});this.repo.save(this.state);this.onContractDecisionResolved?.("corporation-failed");
    let body;try{body=await renderViewTemplate("./views/corporation-contract-failed.html",{REASON:reason,COLONY:this.state.contract.colonyName,POPULATION:formatNumber(this.state.pop),CASH:formatMoney(cash),PROFIT:formatMoney(score.profit),FOOD_SCORE:`${Math.round((score.ratios.food||0)*100)}%`,INDUSTRY_SCORE:`${Math.round((score.ratios.industry||0)*100)}%`,POPULATION_SCORE:`${Math.round((score.ratios.pop||0)*100)}%`,EXTENSION_FEE:formatMoney(fee)});}catch(error){this.diagnostics?.error?.("corporation contract failure view failed",error);this.gameOver?.();return;}
    this.open("Corporation Failed",body);this.modal.querySelector("[data-failed-colonies]")?.addEventListener("click",()=>this.coloniesPanel());this.modal.querySelector("[data-failed-reset]")?.addEventListener("click",()=>this.onHardReset?.());
  }

  deadline(kind){
    if(kind==="corporation-failed"){void this.corporationContractFailed();return;}
    ContractUIMixin.prototype.deadline.call(this,kind);
    if(kind==="complete"){const score=this.contracts.score(this.state);this.contractLogOnce("contract-complete",`${this.state.contract.colonyName} completed its contract with ${score.rating} performance.`,{rating:score.rating,profit:score.profit});return;}
    if(kind==="renewal-ended"){this.contractLogOnce("renewal-ended",`${this.state.contract.colonyName} entered holdover after its contract term ended.`,{renewal:this.state.contract.renewals||0});return;}
    if(kind==="failed"){this.contractLogOnce("contract-failed",`${this.state.contract.colonyName} exhausted its deadline extensions and became a liability colony.`,{extension:this.state.contract.extUsed||0});return;}
    if(kind==="extension"){this.contractLogOnce("contract-deadline-missed",`${this.state.contract.colonyName} missed its objectives and requires an extension decision.`,{extension:this.state.contract.extUsed||0});const button=this.modal.querySelector("[data-ext]");if(button){const original=button.onclick;button.onclick=e=>{const before=this.state.contract.extUsed||0,cash=this.state.company.cash;original?.call(button,e);if((this.state.contract.extUsed||0)>before)this.contractLogOnce("contract-extension",`${this.state.contract.colonyName} purchased extension ${this.state.contract.extUsed}/3 for ${formatMoney(cash-this.state.company.cash)}.`,{extension:this.state.contract.extUsed,fee:cash-this.state.company.cash});};}}
  }
}
