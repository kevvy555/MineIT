import { TradeUI as V511TradeUI } from "./quick-trade-ui-v511.js?v=5.11.0&legacy=1";
import { formatNumber } from "../core/utils.js?v=5.5.5";

/** v5.11.1 reserves the footer ship button for the scheduled corporate trade ship only. */
export class TradeUI extends V511TradeUI{
  constructor(opts){
    super(opts);this.button.onclick=()=>{if(this.state.trade?.active)this.open();};
  }
  render(){
    super.render();if(!this.button)return;
    const active=!!this.state.trade?.active,service=this.trade.serviceAvailable?.(this.state)!==false,blocked=this.state.status==="dead"||!!this.state.company?.gameOver;
    this.button.disabled=blocked||!active;this.button.classList.toggle("trade-live",active);
    if(active)this.button.textContent="CORP SHIP • TRADE!";
    else if(!service)this.button.textContent="CORP SHIP —";
    else this.button.textContent=`CORP SHIP ${formatNumber(this.trade.daysUntilArrival(this.state))}d`;
  }
}
