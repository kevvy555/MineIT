import { UIController as V582UIController } from "./ui-controller-v582.js?v=5.8.1&legacy=1";
import { formatNumber } from "../core/utils.js?v=5.5.5";

const MAX_RESERVE=1000000000;
const clampReserve=value=>Math.max(0,Math.min(MAX_RESERVE,Math.floor(Number(value)||0)));

/** v5.9 keeps ship trading fast by moving persistent stock reserves onto the colony map. */
export class UIController extends V582UIController{
  open(title,body){
    this.modal?.classList.remove("trade-quick-modal");
    super.open(title,body);
  }

  tradeReserveKey(tile){return tile?.resourceId?`${tile.type}:${tile.resourceId}`:null;}
  tradeReserve(tile){const key=this.tradeReserveKey(tile);return key?Math.max(0,Number(this.state.colony?.tradeReserves?.[key])||0):0;}

  contextParts(tile){
    const p=super.contextParts(tile);if(!tile?.revealed||!tile.resourceId)return p;
    const reserve=this.tradeReserve(tile),label=reserve>0?`RESERVE ${formatNumber(reserve)}`:"SET RESERVE";
    p.actions+=this.action(label,"trade-reserve");
    return p;
  }

  runContextAction(action,kind=null){
    if(action==="trade-reserve"){this.openTradeReserve();return;}
    super.runContextAction(action,kind);
  }

  openTradeReserve(){
    const tile=this.selectedTile;if(!tile?.resourceId){this.toast("Select a surveyed resource first.");return;}
    const key=this.tradeReserveKey(tile),entry=this.state.inventory?.[key],stock=entry?this.inventory.syncEntry(entry).amount:0,reserve=this.tradeReserve(tile);
    this.open(`${tile.name} Trade Reserve`,`<article class="card trade-reserve-editor"><h3>COLONY TRADE RESERVE</h3><p class="trade-reserve-note">The corporate ship will never sell below this amount. When exporting, higher-quality stock is sold first so the reserve keeps the lowest-value material for colony use.</p><div class="grid2"><div class="metric"><small>Current stock</small><strong>${formatNumber(stock)}</strong></div><div class="metric"><small>Current reserve</small><strong>${formatNumber(reserve)}</strong></div></div><div class="trade-amount-main"><button data-reserve-step="-1000">−</button><input data-reserve-input type="number" min="0" max="${MAX_RESERVE}" step="1" inputmode="numeric" value="${reserve}"><button data-reserve-step="1000">+</button></div><div class="trade-reserve-actions"><button data-reserve-set="0">NONE</button><button data-reserve-set="1000">1K</button><button data-reserve-set="10000">10K</button><button data-reserve-set="${Math.floor(stock)}">STOCK</button></div><button data-reserve-save class="trade-reserve-save">SAVE RESERVE</button></article>`);
    const input=this.modal.querySelector("[data-reserve-input]");
    this.modal.querySelectorAll("[data-reserve-step]").forEach(button=>button.onclick=()=>{input.value=clampReserve(Number(input.value)+Number(button.dataset.reserveStep));});
    this.modal.querySelectorAll("[data-reserve-set]").forEach(button=>button.onclick=()=>{input.value=clampReserve(button.dataset.reserveSet);});
    this.modal.querySelector("[data-reserve-save]").onclick=()=>{
      const amount=clampReserve(input.value);this.state.colony.tradeReserves||={};if(amount>0)this.state.colony.tradeReserves[key]=amount;else delete this.state.colony.tradeReserves[key];
      this.repo.save(this.state);this.toast(amount>0?`${tile.name} trade reserve set to ${formatNumber(amount)}.`:`${tile.name} trade reserve cleared.`);this.modal.classList.add("hidden");this.renderContext();
    };
  }

  help(){
    super.help();const intro=this.modal.querySelector("#help-index .card .effect");if(intro)intro.textContent="Rules current through v5.9.0. Corporate ship trading is now a no-scroll Sell / Buy / Colonists workflow. Set persistent stock reserves from a surveyed resource on the colony map; ship exports protect those reserves automatically.";
  }
}
