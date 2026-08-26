import { formatMoney, formatNumber } from "../core/utils.js";

/** Minimal base for the active quick corporate-trade presentation. */
export class TradeUI{
  constructor({state,trade,repo,ui}){
    Object.assign(this,{state,trade,repo,ui});
    this.button=document.querySelector("#tradeBtn");
    this.button.onclick=()=>state.trade.active?this.open():this.status();
    document.querySelectorAll("[data-speed]").forEach(button=>{button.onclick=()=>{if(state.status==="dead"){ui.toast("This colony has been lost. Switch colonies or reset the corporation.");return}if(state.trade.active&&+button.dataset.speed>0){ui.toast("Corporate ship is docked. Depart before resuming time.");return}state.speed=+button.dataset.speed;ui.syncSpeed();this.render()}});
  }
  price(v){return v<10?`£${v.toFixed(2)}`:formatMoney(v);}
  qualityRange(band){return `${formatNumber(band.min)}–${formatNumber(band.max)}`;}
  render(){
    const stockValue=document.querySelector("#income");if(stockValue)stockValue.textContent=formatMoney(this.trade.stockValue(this.state));
    this.button.classList.toggle("trade-live",this.state.trade.active);
    this.button.disabled=this.state.status==="dead";
    this.button.textContent=this.state.status==="dead"?"SHIP —":this.state.trade.active?"TRADE!":`SHIP ${formatNumber(this.trade.daysUntilArrival(this.state))}d`;
    document.querySelectorAll("[data-speed]").forEach(button=>button.disabled=(this.state.trade.active&&+button.dataset.speed>0)||this.state.status==="dead");
  }
}
