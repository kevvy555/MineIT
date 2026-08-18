import { formatMoney, formatNumber } from "../core/utils.js?v=5.0.0";
import { CONFIG } from "../core/config.js?v=5.0.0";

export class PortfolioUIMixin {
  colonyStatus(summary){
    if(summary.status==="liability")return{label:"LIABILITY",cls:"bad"};
    if(summary.status==="holdover")return{label:"HOLDOVER",cls:"warn"};
    if(summary.status==="deadline-missed")return{label:"ACTION REQUIRED",cls:"warn"};
    if(summary.status==="failed")return{label:"FAILED",cls:"bad"};
    if(summary.completed)return{label:"RENEWED",cls:"good"};
    return{label:`CONTRACT Y${summary.year}`,cls:"good"};
  }
  coloniesPanel(){
    const entries=this.portfolio.entries(this.state),active=this.state.portfolio.activeColonyId;
    const cards=entries.map(entry=>{const s=this.portfolio.summary(entry),st=this.colonyStatus(s);return`<button class="colony-card ${entry.id===active?"active":""}" data-colony-id="${entry.id}"><div class="colony-card-top"><strong>${s.name}</strong><span class="${st.cls}">${st.label}</span></div><div class="colony-card-env">T${s.tier} • ${s.environment}</div><div class="colony-card-grid"><span>POP<strong>${formatNumber(s.pop)}</strong></span><span>IND<strong>L${s.industryLevel}</strong></span><span>COST/D<strong>${formatMoney(s.operatingCost)}</strong></span><span>YEAR<strong>${s.year}</strong></span></div><div class="colony-card-stock"><span>F ${formatNumber(s.foodStock)}</span><span>FU ${formatNumber(s.fuelStock)}</span><span>O ${formatNumber(s.oreStock)}</span></div>${entry.id===active?`<div class="colony-active-tag">CURRENTLY VIEWING</div>`:""}</button>`}).join("");
    const canNew=this.contracts.canOpenAdditional(this.state);
    this.open(`Colonies — ${entries.length}`,`<div class="colony-grid">${cards}</div><button class="action" data-new-colony ${canNew?"":"disabled"}>OPEN NEW COLONY CONTRACT</button>${canNew?"":`<div class="requirement locked">Complete the first 10-year contract to unlock additional colonies.</div>`}`);
    this.modal.querySelectorAll("[data-colony-id]").forEach(button=>button.onclick=()=>{const id=button.dataset.colonyId;if(id===active){this.modal.classList.add("hidden");return;}this.onSwitchColony?.(id);});
    const newButton=this.modal.querySelector("[data-new-colony]");if(newButton)newButton.onclick=()=>this.contractBoard();
  }
  endContractDialog(){
    if(!this.state.contract.completed&&!this.state.contract.ended){this.open("End Contract",`<article class="card"><h3>CONTRACT STILL ACTIVE</h3><p>The colony can be returned or disposed of after its initial contract has completed.</p></article>`);return;}
    const health=this.contracts.resourceHealth(this.state),ratio=`${Math.round(health.ratio*100)}%`,remaining=this.state.portfolio.colonies.length>1;
    if(health.accepted&&!this.state.contract.ended){
      this.open("Return Colony",`<article class="card"><h3>CORPORATION WILL ACCEPT RETURN</h3><p>Known finite deposits retain ${ratio} of their surveyed reserves${health.renewable?` and ${health.renewable} renewable resource site${health.renewable===1?"":"s"} remain`:""}. The corporation is willing to take the colony back.</p><div class="effect">Population and infrastructure transfer with the colony.</div></article><button class="action" data-return ${remaining?"":"disabled"}>RETURN COLONY TO CORPORATION</button>${remaining?"":`<div class="requirement locked">Open another colony before returning your final colony.</div>`}`);
      const button=this.modal.querySelector("[data-return]");if(button)button.onclick=()=>this.onRemoveColony?.("corporate-return");return;
    }
    const relocation=this.colony.relocationCost(this.state),canRelocate=remaining&&this.state.company.cash>=relocation;
    this.open("Corporation Refuses Colony",`<article class="card"><h3 class="bad">RETURN REFUSED</h3><p>The known resource base is too depleted for the corporation to accept the colony. Finite reserve health is ${ratio} and no sufficient renewable resource base remains.</p><div class="effect warn">Ending the mining contract makes this a support-only liability colony. Extraction stops, but population, Food, Fuel, Ore and cash costs continue at a higher rate.</div></article><div class="grid2" style="margin-top:7px"><button data-liability>END CONTRACT<br><span class="tiny">KEEP COLONY RUNNING</span></button><button data-relocate ${canRelocate?"":"disabled"}>RELOCATE POPULATION<br><span class="tiny">${formatMoney(relocation)}</span></button></div>${remaining?"":`<div class="requirement locked">Open another colony before disposing of your final colony.</div>`}${this.state.company.cash<relocation?`<div class="requirement locked">Relocation requires ${formatMoney(relocation)}.</div>`:""}`);
    this.modal.querySelector("[data-liability]").onclick=()=>{this.onMakeLiability?.();this.colonyPanel();};
    const relocate=this.modal.querySelector("[data-relocate]");if(relocate)relocate.onclick=()=>this.onRelocateColony?.();
  }
}
