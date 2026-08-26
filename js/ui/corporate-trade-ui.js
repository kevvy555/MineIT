import { TradeUI as QuickTradeUI } from "./quick-trade-ui.js";
import { formatNumber } from "../core/utils.js";

/** Footer adapter for the scheduled external corporate trade ship. */
export class TradeUI extends QuickTradeUI{
  constructor(opts){
    super(opts);
    opts.ui.corporateTradeUI=this;
    this.button.onclick=()=>{if(this.state.trade?.active)this.open();};
  }
  render(){
    super.render();
    if(!this.button)return;
    const active=!!this.state.trade?.active,service=this.trade.serviceAvailable?.(this.state)!==false,blocked=this.state.status==="dead"||!!this.state.company?.gameOver;
    this.button.disabled=blocked||!active;
    this.button.classList.toggle("trade-live",active);
    if(active)this.button.textContent="CORP SHIP • TRADE!";
    else if(!service)this.button.textContent="CORP SHIP —";
    else this.button.textContent=`CORP SHIP ${formatNumber(this.trade.daysUntilArrival(this.state))}d`;
  }
}
