import { PortfolioUIMixin as V570PortfolioUIMixin } from "./portfolio-ui-v570.js?v=5.7.0&legacy=1";

/** v5.8.1 portfolio states for corporation-wide events. */
export class PortfolioUIMixin extends V570PortfolioUIMixin{
  colonyStatus(summary){
    if(summary?.status==="contract-decision")return{label:"ACTION REQUIRED",cls:"warn"};
    return super.colonyStatus(summary);
  }
  coloniesPanel(){
    super.coloniesPanel();
    const entries=this.portfolio.entries(this.state);
    for(const card of this.modal.querySelectorAll("[data-colony-id]")){
      const entry=entries.find(item=>item.id===card.dataset.colonyId);if(!entry)continue;
      const data=entry.id===this.state.portfolio.activeColonyId?this.state:entry.data;
      if(data?.trade?.active&&!card.querySelector("[data-ship-waiting]")){
        const tag=document.createElement("div");tag.className="colony-active-tag warn";tag.dataset.shipWaiting="true";tag.textContent="CORPORATE SHIP DOCKED";card.appendChild(tag);
      }
    }
  }
}
