import { TradeUI as BaseTradeUI } from "./trade-ui.js";
import { CONFIG } from "../core/config.js";
import { renderViewTemplate } from "../core/view-template.js";
import { formatMoney, formatNumber } from "../core/utils.js";

export class TradeUI extends BaseTradeUI {
  constructor(opts){super(opts);this.onDepart=opts.onDepart;this.gameLog=opts.gameLog;}
  render(){super.render();document.querySelectorAll("[data-speed]").forEach(button=>{button.disabled=(+button.dataset.speed>0&&(this.state.company?.pendingEvents?.length||this.state.trade.active))||!!this.state.company?.gameOver;button.classList.toggle("active",+button.dataset.speed===this.state.speed);});}
  async status(){
    try{
      if(this.state.status==="dead"||(this.state.contract.ended&&this.state.status!=="liability")){
        const reason=this.state.status==="dead"?"This colony has been lost.":"The mining charter has ended and this colony no longer receives corporate service.";
        this.ui.open("Corporate Trade Ship",await renderViewTemplate("./views/trade-service-unavailable.html",{REASON:reason}));return;
      }
      const liability=this.state.status==="liability",description=liability?"Support ships continue to visit liability colonies so the corporation can import limited life-support supplies while deciding whether to relocate the population.":`A corporate vessel arrives every ${CONFIG.TRADE_INTERVAL_DAYS} corporation days. All colonies share the same clock and any ship arrival pauses the corporation.`;
      const body=await renderViewTemplate("./views/trade-service-status.html",{DAYS:formatNumber(this.trade.daysUntilArrival(this.state)),DESCRIPTION:description,STOCK_VALUE:formatMoney(this.trade.stockValue(this.state)),IMPORT_CAPACITY:formatNumber(this.trade.cargoCapacity(this.state)),EXPORT_CAPACITY:formatNumber(this.trade.exportCapacity(this.state)),PASSENGER_BERTHS:liability?"—":CONFIG.TRADE_PASSENGER_CAPACITY});
      this.ui.open(liability?"Corporate Support Ship":"Corporate Trade Ship",body);
    }catch(error){this.ui?.diagnostics?.error?.("trade service template failed",error);this.ui?.toast?.("Unable to open corporate ship status.");}
  }
  log(type,message,data={}){this.gameLog?.event(this.state,type,message,data);}
}
