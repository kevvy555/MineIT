import { renderViewTemplate } from "../core/view-template.js";
import { UIController as BaseUIController } from "./corporate-events-ui.js";
import { formatNumber } from "../core/utils.js";

const MAX_RESERVE=1000000000;
const clampReserve=value=>Math.max(0,Math.min(MAX_RESERVE,Math.floor(Number(value)||0)));

/** Colony-wide stock-reserve controls used by Corporate Ship exports. */
export class UIController extends BaseUIController{
  open(title,body){
    this.modal?.classList.remove("trade-quick-modal");
    super.open(title,body);
  }

  async landColonyPanel(){
    const colonyId=this.state.colonyId,opened=await super.landColonyPanel();
    if(opened===false||this.state.colonyId!==colonyId||this.modal?.classList.contains("hidden"))return opened;
    const body=this.modal?.querySelector(".modal-body");if(!body||body.querySelector("[data-colony-trade-reserve-card]"))return opened;
    let markup;
    try{markup=await renderViewTemplate("./views/colony-trade-reserve-card.html",{RESERVE:formatNumber(this.trade.colonyTradeReserve(this.state))});}
    catch(error){this.diagnostics.error("colony trade reserve card failed",error);return opened;}
    if(this.state.colonyId!==colonyId||this.modal?.classList.contains("hidden")||body!==this.modal?.querySelector(".modal-body"))return opened;
    const fragment=document.createRange().createContextualFragment(markup),card=fragment.querySelector("[data-colony-trade-reserve-card]"),management=body.querySelector(".colony-management");
    if(!card)return opened;if(management)management.before(fragment);else body.append(fragment);
    body.querySelector("[data-open-colony-trade-reserve]")?.addEventListener("click",()=>this.openTradeReserve());
    return opened;
  }

  async openTradeReserve(){
    const reserve=this.trade.colonyTradeReserve(this.state),colonyId=this.state.colonyId;let body;
    try{body=await renderViewTemplate("./views/trade-reserve.html",{RESERVE:formatNumber(reserve),MAX_RESERVE,RESERVE_RAW:reserve});}
    catch(error){this.diagnostics.error("trade reserve template failed",error);this.toast("Unable to open the colony reserve editor.");return;}
    if(this.state.colonyId!==colonyId)return;
    this.open("Colony Stock Reserve",body);
    const input=this.modal.querySelector("[data-reserve-input]");
    this.modal.querySelectorAll("[data-reserve-step]").forEach(button=>button.onclick=()=>{input.value=String(clampReserve(Number(input.value)+Number(button.dataset.reserveStep)));});
    this.modal.querySelectorAll("[data-reserve-set]").forEach(button=>button.onclick=()=>{input.value=String(clampReserve(button.dataset.reserveSet));});
    this.modal.querySelector("[data-reserve-save]").onclick=()=>{
      const amount=this.trade.setColonyTradeReserve(this.state,input.value);this.repo.save(this.state);this.toast(`Colony reserve set to ${formatNumber(amount)} per resource.`);this.landColonyPanel();
    };
  }

  help(){
    super.help();const intro=this.modal.querySelector("#help-index .card .effect");if(intro)intro.textContent="Corporate ship trading uses a no-scroll Sell / Buy / Colonists workflow. Set one colony stock reserve from Colony Summary; every individual resource keeps that protected amount during exports.";
  }
}
