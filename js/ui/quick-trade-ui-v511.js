import { TradeUI as BaseTradeUI } from "./quick-trade-ui.js?v=5.9.0&legacy=1";
import { formatNumber } from "../core/utils.js?v=5.5.5";

export class TradeUI extends BaseTradeUI{
  constructor(opts){super(opts);opts.ui.corporateTradeUI=this;this.button.onclick=()=>opts.ui.shipExpansion?.();}
  render(){
    super.render();const expansion=this.ui?.expansion?.ensure?.(this.state),ship=expansion?.ship;if(!this.button||!ship)return;this.button.disabled=!!this.state.company?.gameOver;
    if(ship.status==="travelling"){const days=Math.max(0,(Number(ship.arrivalAbsoluteDay)||0)-this.ui.expansion.absoluteDay(this.state));this.button.textContent=`SHIP ${formatNumber(days)}d`;}
    else if(ship.status==="arrived")this.button.textContent="SHIP ARRIVED";
    else if(ship.status==="lost")this.button.textContent="SHIP LOST";
    else if(this.state.trade?.active)this.button.textContent="SHIP • TRADE!";
    else this.button.textContent="SHIP";
    this.button.classList.toggle("trade-live",!!this.state.trade?.active||ship.status==="arrived");
  }
}
