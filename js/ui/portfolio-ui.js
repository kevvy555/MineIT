import { renderViewTemplate } from "../core/view-template.js";
import { formatMoney, formatNumber } from "../core/utils.js";
import { SHIP_INFRASTRUCTURE,builtCapacity } from "../domain/building-model.js";

/** Canonical corporation portfolio presentation. */
export class PortfolioUIMixin {
  colonyStatus(summary){
    if(summary?.status==="contract-decision")return{label:"ACTION REQUIRED",cls:"warn"};
    if(summary.status==="dead")return{label:"DEAD",cls:"bad"};if(summary.emergencyMode)return{label:"EMERGENCY",cls:"warn"};if(summary.survivalSupply<.4)return{label:"COLLAPSE",cls:"bad"};if(summary.survivalSupply<.9)return{label:"STRAINED",cls:"warn"};if(summary.status==="liability")return{label:"LIABILITY",cls:"bad"};if(summary.status==="holdover")return{label:"HOLDOVER",cls:"warn"};if(summary.status==="deadline-missed")return{label:"ACTION REQUIRED",cls:"warn"};if(summary.status==="failed")return{label:"FAILED",cls:"bad"};if(summary.completed)return{label:"RENEWED",cls:"good"};return{label:`CONTRACT Y${summary.year}`,cls:"good"};
  }
  colonyDays(days){return days===null||days===undefined?"∞":days<=0?"0d":`${Math.max(1,Math.ceil(days))}d`;}
  async coloniesPanel(){
    const entries=this.portfolio.entries(this.state),active=this.state.portfolio.activeColonyId;
    let cards;
    try{
      cards=(await Promise.all(entries.map(entry=>{
        const s=this.portfolio.summary(entry,this.state),st=this.colonyStatus(s),wf=s.workforceRequired?Math.min(100,Math.round(s.workforceAvailable/s.workforceRequired*100)):100,data=entry.id===active?this.state:entry.data;
        const installed=SHIP_INFRASTRUCTURE.industry+builtCapacity(entry.data,"industry"),effective=Math.max(0,Number(entry.data?.metrics?.industry)||0),rawStaff=Number(entry.data?.metrics?.industryStaffFactor),staff=Math.round(Math.max(0,Math.min(1,Number.isFinite(rawStaff)?rawStaff:1))*100),shipWaiting=!!data?.trade?.active;
        return renderViewTemplate("./views/colony-card.html",{
          ACTIVE_CLASS:entry.id===active?"active":"",COLONY_ID:entry.id,NAME:s.name,STATUS_CLASS:st.cls,STATUS_LABEL:st.label,TIER:s.tier,ENVIRONMENT:s.environment,SUPPORT_LOAD:Number(s.supportLoad||1).toFixed(2),POPULATION:formatNumber(s.pop),INDUSTRY_EFFECTIVE:formatNumber(effective),INDUSTRY_INSTALLED:formatNumber(installed),STAFF_PERCENT:staff,WORKFORCE_PERCENT:wf,CONTRACT_YEAR:s.year,CONTRACT_DAY:s.day,
          FOOD:s.status==="dead"?formatNumber(s.foodStock):this.colonyDays(s.foodDays),FUEL:s.status==="dead"?formatNumber(s.fuelStock):this.colonyDays(s.fuelDays),ORE:s.status==="dead"?formatNumber(s.oreStock):this.colonyDays(s.oreDays),
          PENDING_TRANSPORT:s.pendingTransport?`<span>⇢ +${formatNumber(s.pendingTransport)}</span>`:"",ACTIVE_TAG:entry.id===active?`<div class="colony-active-tag">CURRENTLY VIEWING</div>`:"",SHIP_TAG:shipWaiting?`<div class="colony-active-tag warn" data-ship-waiting>CORPORATE SHIP DOCKED</div>`:""
        });
      }))).join("");
      const canNew=this.contracts.canOpenAdditional(this.state),living=entries.filter(entry=>entry.data?.status!=="dead").length;
      const body=await renderViewTemplate("./views/colonies.html",{YEAR:this.state.year,DAY:this.state.day,COLONY_CARDS:cards,NEW_DISABLED:canNew?"":"disabled",NEW_REQUIREMENT:canNew?"":`<div class="requirement locked">${this.state.company.gameOver?"Corporation operations have ended because all colonies were lost.":"Complete the first 10-year contract to unlock additional colonies."}</div>`});
      this.open(`Colonies — ${entries.length} (${living} active)`,body);
    }catch(error){this.diagnostics?.error?.("colony portfolio template failed",error);this.toast("Unable to open the colony portfolio.");return;}
    this.modal.querySelectorAll("[data-colony-id]").forEach(button=>button.onclick=()=>{const id=button.dataset.colonyId;if(id===active){this.modal.classList.add("hidden");return;}this.onSwitchColony?.(id);});const newButton=this.modal.querySelector("[data-new-colony]");if(newButton)newButton.onclick=()=>this.contractBoard();
  }
  async endContractDialog(){
    if(this.state.status==="dead"){this.colonyPanel();return;}
    try{
      if(!this.state.contract.completed&&!this.state.contract.ended){this.open("End Contract",await renderViewTemplate("./views/end-contract-active.html"));return;}
      const health=this.contracts.resourceHealth(this.state),ratio=`${Math.round(health.ratio*100)}%`,remaining=this.state.portfolio.colonies.length>1;
      if(health.accepted&&!this.state.contract.ended){
        const body=await renderViewTemplate("./views/return-colony.html",{RESERVE_RATIO:ratio,RENEWABLE_TEXT:health.renewable?` and ${health.renewable} renewable resource site${health.renewable===1?"":"s"} remain`:"",RETURN_DISABLED:remaining?"":"disabled",RETURN_REQUIREMENT:remaining?"":`<div class="requirement locked">Open another colony before returning your final colony.</div>`});
        this.open("Return Colony",body);const button=this.modal.querySelector("[data-return]");if(button)button.onclick=()=>this.onRemoveColony?.("corporate-return");return;
      }
      const relocation=this.colony.relocationCost(this.state),canRelocate=remaining&&this.state.company.cash>=relocation;
      const body=await renderViewTemplate("./views/refused-colony.html",{RESERVE_RATIO:ratio,RELOCATE_DISABLED:canRelocate?"":"disabled",RELOCATION_COST:formatMoney(relocation),FINAL_COLONY_REQUIREMENT:remaining?"":`<div class="requirement locked">Open another colony before disposing of your final colony.</div>`,CASH_REQUIREMENT:this.state.company.cash<relocation?`<div class="requirement locked">Relocation requires ${formatMoney(relocation)}.</div>`:""});
      this.open("Corporation Refuses Colony",body);
      this.modal.querySelector("[data-liability]").onclick=()=>{this.onMakeLiability?.();this.colonyPanel();};const relocate=this.modal.querySelector("[data-relocate]");if(relocate)relocate.onclick=()=>this.onRelocateColony?.();
    }catch(error){this.diagnostics?.error?.("contract return template failed",error);this.toast("Unable to open the contract decision.");}
  }
}
