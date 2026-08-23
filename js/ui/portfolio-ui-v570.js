import { PortfolioUIMixin as LegacyPortfolioUIMixin } from "./portfolio-ui.js?v=5.5.5&legacy=1";
import { SHIP_INFRASTRUCTURE,builtCapacity } from "../domain/building-model.js?v=5.7.0";
import { formatNumber } from "../core/utils.js?v=5.5.5";

/** v5.7 portfolio presentation: show physical/effective Industry, not aggregate levels. */
export class PortfolioUIMixin extends LegacyPortfolioUIMixin{
  coloniesPanel(){
    super.coloniesPanel();
    const entries=this.portfolio.entries(this.state);
    for(const card of this.modal.querySelectorAll("[data-colony-id]")){
      const entry=entries.find(item=>item.id===card.dataset.colonyId);if(!entry)continue;
      const installed=SHIP_INFRASTRUCTURE.industry+builtCapacity(entry.data,"industry"),effective=Math.max(0,Number(entry.data?.metrics?.industry)||0),staff=Math.round(Math.max(0,Math.min(1,Number(entry.data?.metrics?.industryStaffFactor)??1))*100),grid=card.querySelector(".colony-card-grid"),industry=grid?.children?.[1]?.querySelector("strong");
      if(industry)industry.textContent=`${formatNumber(effective)} / ${formatNumber(installed)} • ${staff}%`;
    }
  }
  endContractDialog(){
    super.endContractDialog();
    for(const node of this.modal.querySelectorAll(".effect.warn")){
      if(/cash costs continue|higher rate/i.test(node.textContent))node.textContent="Ending the mining contract makes this a support-only liability colony. Extraction stops, but population still requires Food, Fuel and Power until relocation. There is no generic daily corporate cash charge.";
    }
  }
}
