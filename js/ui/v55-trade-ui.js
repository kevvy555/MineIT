import { TradeUI as BaseTradeUI } from "./trade-ui.js";
import { CONFIG } from "../core/config.js";
import { formatMoney, formatNumber } from "../core/utils.js";

export class TradeUI extends BaseTradeUI {
  constructor(opts){super(opts);this.onDepart=opts.onDepart;this.gameLog=opts.gameLog;}
  render(){super.render();document.querySelectorAll("[data-speed]").forEach(button=>{button.disabled=(+button.dataset.speed>0&&(this.state.company?.pendingEvents?.length||this.state.trade.active))||!!this.state.company?.gameOver;button.classList.toggle("active",+button.dataset.speed===this.state.speed);});}
  status(){
    if(this.state.status==="dead"||(this.state.contract.ended&&this.state.status!=="liability")){this.ui.open("Corporate Trade Ship",`<article class="card"><h3>NO SCHEDULED SERVICE</h3><p>${this.state.status==="dead"?"This colony has been lost.":"The mining charter has ended and this colony no longer receives corporate service."}</p></article>`);return;}
    this.ui.open(this.state.status==="liability"?"Corporate Support Ship":"Corporate Trade Ship",`<article class="card"><h3>NEXT VISIT IN ${formatNumber(this.trade.daysUntilArrival(this.state))} DAYS</h3><p>${this.state.status==="liability"?"Support ships continue to visit liability colonies so the corporation can import limited life-support supplies while deciding whether to relocate the population.":`A corporate vessel arrives every ${CONFIG.TRADE_INTERVAL_DAYS} corporation days. All colonies share the same clock and any ship arrival pauses the corporation.`}</p><div class="grid2"><div class="metric"><small>Stored stock value</small><strong>${formatMoney(this.trade.stockValue(this.state))}</strong></div><div class="metric"><small>Next import capacity</small><strong>${formatNumber(this.trade.cargoCapacity(this.state))}</strong></div><div class="metric"><small>Next export capacity</small><strong>${formatNumber(this.trade.exportCapacity(this.state))}</strong></div><div class="metric"><small>Passenger berths</small><strong>${this.state.status==="liability"?"—":CONFIG.TRADE_PASSENGER_CAPACITY}</strong></div></div></article>`);
  }
  log(type,message,data={}){this.gameLog?.event(this.state,type,message,data);}
}
