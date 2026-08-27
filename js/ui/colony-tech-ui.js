import { clamp, formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { loadViewTemplate } from "../core/view-template.js";

const COLONY_VIEW_PATHS={lost:"./views/colony-lost.html",goals:"./views/contract-goals.html"};

export class ColonyTechUIMixin {
  supplyDaysLabel(days){if(days===null||days===undefined)return"SURPLUS";if(days<=0)return"EMPTY";return`${Math.max(1,Math.ceil(days))}d`}
  supplyRiskClass(days,supply){if(supply<.4||days!==null&&days<=CONFIG.SUPPLY_CRITICAL_DAYS)return"bad";if(supply<.9||days!==null&&days<=CONFIG.SUPPLY_WARN_DAYS)return"warn";return"good";}
  colonyViewSnapshot(){return{body:this.modal?.querySelector(".modal-body")||null,hidden:this.modal?.classList.contains("hidden")??true,colonyId:this.state?.colonyId,status:this.state?.status};}
  colonyViewStillCurrent(snapshot){return!!snapshot&&snapshot.body==(this.modal?.querySelector(".modal-body")||null)&&snapshot.hidden==(this.modal?.classList.contains("hidden")??true)&&snapshot.colonyId==this.state?.colonyId&&snapshot.status==this.state?.status;}
  setColonyViewText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");}
  async loadColonyView(path,label,snapshot){try{const source=await loadViewTemplate(path);return this.colonyViewStillCurrent(snapshot)?source:null;}catch(error){this.diagnostics?.error?.(`${label} view failed`,error);this.toast(`Unable to open ${label}.`);return null;}}

  colonyPanel(){
    if(this.state.status!=="dead")return false;
    this.renderLostColony().catch(error=>{this.diagnostics?.error?.("lost colony view failed",error);this.toast("Unable to open lost colony details.");});
    return true;
  }
  async renderLostColony(){
    const snapshot=this.colonyViewSnapshot(),source=await this.loadColonyView(COLONY_VIEW_PATHS.lost,"lost colony",snapshot);if(!source||this.state.status!=="dead")return false;
    const s=this.state,m=s.metrics,c=s.colony,canAbandonDead=s.portfolio.colonies.length>1;
    this.open(`${s.contract.colonyName||"Colony"} — LOST`,source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    this.setColonyViewText(body,"[data-colony-death-date]",`Y${s.contract.deathYear||s.year} D${s.contract.deathDay||s.day}`);this.setColonyViewText(body,"[data-colony-final-industry]",`L${c.industryLevel}`);this.setColonyViewText(body,"[data-colony-food-stock]",formatNumber(m.foodStock||0));this.setColonyViewText(body,"[data-colony-fuel-stock]",formatNumber(m.fuelStock||0));
    const abandon=body.querySelector("[data-abandon-dead]");if(abandon){abandon.hidden=!canAbandonDead;abandon.onclick=()=>this.onRemoveColony?.("abandon-dead");}
    const all=body.querySelector("[data-all-colonies]");if(all)all.onclick=()=>this.coloniesPanel();
    return true;
  }

  async goals(){
    const snapshot=this.colonyViewSnapshot(),source=await this.loadColonyView(COLONY_VIEW_PATHS.goals,"contract goals",snapshot);if(!source)return false;
    const score=this.contracts.score(this.state),g=this.state.contract.goals,s=this.state;
    this.open("Contract Goals",source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    this.setColonyViewText(body,"[data-goals-title]",`${s.contract.colonyName} • COLONY TIER ${s.contract.colonyTier}`);this.setColonyViewText(body,"[data-goals-environment]",s.contract.environment);this.setColonyViewText(body,"[data-goals-hazard]",s.contract.hazard);
    this.setColonyViewText(body,"[data-goals-food]",`${formatNumber(s.metrics.food)} / ${formatNumber(g.food)}`);this.setColonyViewText(body,"[data-goals-industry]",`${formatNumber(s.metrics.industry)} / ${formatNumber(g.industry)}`);this.setColonyViewText(body,"[data-goals-population]",`${formatNumber(s.pop)} / ${formatNumber(g.pop)}`);this.setColonyViewText(body,"[data-goals-profit]",formatMoney(score.profit));this.setColonyViewText(body,"[data-goals-revenue]",formatMoney(score.revenue));this.setColonyViewText(body,"[data-goals-costs]",formatMoney(score.costs));
    this.setColonyViewText(body,"[data-goals-silver]",formatMoney(s.contract.bands.silver));this.setColonyViewText(body,"[data-goals-gold]",formatMoney(s.contract.bands.gold));this.setColonyViewText(body,"[data-goals-platinum]",formatMoney(s.contract.bands.plat));
    return true;
  }
}
