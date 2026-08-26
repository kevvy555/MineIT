import { TradeUI as BaseTradeUI } from "./v55-trade-ui.js";
import { formatMoney, formatNumber } from "../core/utils.js";
import { renderViewTemplate } from "../core/view-template.js";

const PAGE_SIZE=4,MAX_TRADE=100000,BUY_CATEGORIES=["Fuel","Food","Ore","Build"];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(value)||0)));

export class TradeUI extends BaseTradeUI{
  constructor(opts){
    super(opts);
    this.quickTab="sell";
    this.sellAmount=10000;
    this.buyAmount=10000;
    this.colonistAmount=100;
    this.sellPage=0;
    this.buyPage=0;
    this.buyCategory="Fuel";
    this.quickRenderRevision=0;
  }

  amountControl(kind,value){
    return `<div class="trade-quick-amount"><div class="trade-amount-main"><button data-qty-step="${kind}" data-delta="-1000">−</button><input data-qty-input="${kind}" type="number" min="1" max="${MAX_TRADE}" step="1" inputmode="numeric" value="${value}"><button data-qty-step="${kind}" data-delta="1000">+</button></div><div class="trade-amount-presets"><button data-qty-set="${kind}" data-value="100">100</button><button data-qty-set="${kind}" data-value="1000">1K</button><button data-qty-set="${kind}" data-value="10000">10K</button><button data-qty-set="${kind}" data-value="${MAX_TRADE}">MAX</button></div></div>`;
  }

  pager(kind,page,pages){
    if(pages<=1)return `<div class="trade-pager single"><span>1 / 1</span></div>`;
    return `<div class="trade-pager"><button data-page="${kind}" data-dir="-1" ${page<=0?"disabled":""}>‹</button><span>${page+1} / ${pages}</span><button data-page="${kind}" data-dir="1" ${page>=pages-1?"disabled":""}>›</button></div>`;
  }

  stockAmount(key){
    const entry=this.state.inventory?.[key];
    return entry?this.trade.inventory.syncEntry(entry).amount:0;
  }

  buyQuote(item,requested=this.buyAmount){
    const price=this.trade.buyPrice(item),cargo=this.trade.cargoRemaining(this.state),affordable=Math.floor(Math.max(0,this.state.company.cash)/Math.max(.0001,price)),qty=Math.min(MAX_TRADE,Math.max(0,Math.floor(requested||0)),cargo,affordable);
    return{qty,cost:qty*price,price};
  }

  open(selectedKey=null){
    if(!this.state.trade.active){this.status();return;}
    if(selectedKey){const selected=this.trade.catalog().find(x=>x.key===selectedKey);if(selected){this.buyCategory=selected.category;this.quickTab="buy";}}
    if((this.state.contract.ended||this.state.status==="liability")&&this.quickTab==="colonists")this.quickTab="sell";
    this.renderQuick();
  }

  async renderQuick(){
    if(!this.state.trade.active){this.status();return;}
    const revision=++this.quickRenderRevision,cash=this.state.company.cash,cargo=this.trade.cargoRemaining(this.state),exports=this.trade.exportRemaining(this.state),pax=this.trade.passengerRemaining(this.state),colonistsBlocked=this.state.contract.ended||this.state.status==="liability",tradeView=this.quickTab==="sell"?this.sellView():this.quickTab==="buy"?this.buyView():this.colonistView();
    let body;
    try{body=await renderViewTemplate("./views/quick-trade-shell.html",{CASH:formatMoney(cash),IMPORT:formatNumber(cargo),EXPORT:formatNumber(exports),PAX:colonistsBlocked?"—":formatNumber(pax),SELL_ACTIVE:this.quickTab==="sell"?"active":"",BUY_ACTIVE:this.quickTab==="buy"?"active":"",COLONISTS_ACTIVE:this.quickTab==="colonists"?"active":"",COLONISTS_DISABLED:colonistsBlocked?"disabled":"",TRADE_VIEW:tradeView});}
    catch(error){if(revision!==this.quickRenderRevision)return;this.ui.diagnostics?.error?.("quick trade template failed",error);this.ui.toast("Unable to open the corporate trade ship.");return;}
    if(revision!==this.quickRenderRevision||!this.state.trade.active)return;
    this.ui.open("Corporate Trade Ship — DOCKED",body);
    this.ui.modal.classList.add("trade-quick-modal");
    this.bindQuick();
  }

  sellView(){
    const all=this.trade.sellableStock(this.state),pages=Math.max(1,Math.ceil(all.length/PAGE_SIZE));this.sellPage=clamp(this.sellPage,0,pages-1);const rows=all.slice(this.sellPage*PAGE_SIZE,(this.sellPage+1)*PAGE_SIZE),allQuote=this.trade.sellAllQuote(this.state);
    return `<section class="trade-view-panel"><div class="trade-view-head"><div><strong>SELL COLONY STOCK</strong><small>Highest quality is sold first. Colony reserves are protected.</small></div><b>${formatMoney(allQuote.revenue)}</b></div>${this.amountControl("sell",this.sellAmount)}<div class="trade-quick-list">${rows.length?rows.map(entry=>{const q=this.trade.quoteSell(this.state,entry.key,this.sellAmount),reserve=this.trade.tradeReserve(this.state,entry.key);return`<div class="trade-quick-row"><div class="trade-row-copy"><strong>${entry.name}</strong><small>${formatNumber(entry.amount)} stock${reserve>0?` • <span class="reserve">${formatNumber(reserve)} reserve</span>`:""} • ${formatNumber(entry.sellableAmount)} sellable</small></div><button data-sell-key="${entry.key}" ${q.qty<=0?"disabled":""}>${q.qty>0?`SELL ${formatNumber(q.qty)}<span>${formatMoney(q.revenue)}</span>`:"SELL"}</button></div>`}).join(""):`<div class="trade-empty">No stock is available above your colony reserves.</div>`}</div><div class="trade-view-footer"><button data-sell-all class="trade-primary" ${allQuote.qty<=0?"disabled":""}>SELL ALL${allQuote.qty>0?` — ${formatMoney(allQuote.revenue)}`:""}</button>${this.pager("sell",this.sellPage,pages)}</div></section>`;
  }

  buyView(){
    const category=this.buyCategory,catalog=this.trade.catalog().filter(item=>item.category===category).map(item=>{const stock=this.stockAmount(item.key),reserve=this.trade.tradeReserve(this.state,item.key),shortfall=Math.max(0,reserve-stock);return{...item,stock,reserve,shortfall};}).sort((a,b)=>(b.shortfall>0)-(a.shortfall>0)||b.shortfall-a.shortfall||a.name.localeCompare(b.name)),pages=Math.max(1,Math.ceil(catalog.length/PAGE_SIZE));this.buyPage=clamp(this.buyPage,0,pages-1);const rows=catalog.slice(this.buyPage*PAGE_SIZE,(this.buyPage+1)*PAGE_SIZE),reserveTarget=catalog.find(x=>x.shortfall>0);
    return `<section class="trade-view-panel buy-view"><div class="trade-view-head"><div><strong>BUY FROM CORPORATION</strong><small>Choose an amount once, then tap resources to buy.</small></div><b>${formatNumber(this.trade.cargoRemaining(this.state))} cargo</b></div>${this.amountControl("buy",this.buyAmount)}<div class="trade-buy-categories">${BUY_CATEGORIES.map(c=>`<button data-buy-category="${c}" class="${c===category?"active":""}">${c.toUpperCase()}</button>`).join("")}</div><div class="trade-quick-list buy-list">${rows.map(item=>{const q=this.buyQuote(item);return`<div class="trade-quick-row"><div class="trade-row-copy"><strong>${item.name}</strong><small>${formatNumber(item.stock)} stock${item.reserve>0?` • <span class="reserve">${formatNumber(item.reserve)} reserve${item.shortfall>0?` • SHORT ${formatNumber(item.shortfall)}`:""}</span>`:""} • ${this.price(q.price)}/u</small></div><button data-buy-key="${item.key}" ${q.qty<=0?"disabled":""}>${q.qty>0?`BUY ${formatNumber(q.qty)}<span>${formatMoney(q.cost)}</span>`:"BUY"}</button></div>`}).join("")}</div><div class="trade-view-footer"><button data-buy-reserve="${reserveTarget?.key||""}" class="trade-secondary" ${!reserveTarget?"disabled":""}>${reserveTarget?`BUY ${reserveTarget.name.toUpperCase()} TO RESERVE`:"NO RESERVE SHORTAGE"}</button>${this.pager("buy",this.buyPage,pages)}</div></section>`;
  }

  colonistView(){
    const supported=Math.max(0,Math.floor(Math.min(Number(this.state.colony.housingCapacity)||0,Number(this.state.metrics.powerPopulationCap)||Number(this.state.colony.housingCapacity)||0))),available=Math.max(0,Math.floor(this.trade.colonistCapacity(this.state))),pax=Math.max(0,Math.floor(this.trade.passengerRemaining(this.state))),max=Math.min(250,available,pax),qty=max>0?clamp(this.colonistAmount,1,max):0;this.colonistAmount=qty;const cost=qty?this.trade.colonistTransferCost(this.state,qty):0,foodMargin=(Number(this.state.metrics.food)||0)-(Number(this.state.metrics.foodDemand)||0),powerMargin=(Number(this.state.metrics.powerCapacity)||0)-(Number(this.state.metrics.powerDemand)||0),can=qty?this.trade.canTransferColonists(this.state,qty):{ok:false};
    return `<section class="trade-view-panel colonist-view"><div class="trade-view-head"><div><strong>COLONIST TRANSFER</strong><small>Choose any supported quantity from 1–250.</small></div><b>${formatNumber(max)} max</b></div><div class="trade-colony-metrics"><div class="trade-qmetric"><small>POPULATION</small><strong>${formatNumber(this.state.pop)}</strong></div><div class="trade-qmetric"><small>SUPPORTED</small><strong>${formatNumber(supported)}</strong></div><div class="trade-qmetric"><small>HOUSING FREE</small><strong>${formatNumber(available)}</strong></div><div class="trade-qmetric"><small>PAX</small><strong>${formatNumber(pax)}</strong></div><div class="trade-qmetric"><small>FOOD MARGIN</small><strong class="${foodMargin<0?"bad":"good"}">${foodMargin>=0?"+":""}${formatNumber(foodMargin)}/d</strong></div><div class="trade-qmetric"><small>POWER MARGIN</small><strong class="${powerMargin<0?"bad":"good"}">${powerMargin>=0?"+":""}${formatNumber(powerMargin)}</strong></div></div><div class="trade-colonist-picker"><div class="trade-colonist-buttons"><button data-colonist-step="-10" ${qty<=1?"disabled":""}>−10</button><button data-colonist-step="-1" ${qty<=1?"disabled":""}>−1</button><input data-colonist-input type="number" min="1" max="${Math.max(1,max)}" inputmode="numeric" value="${qty}"><button data-colonist-step="1" ${qty>=max?"disabled":""}>+1</button><button data-colonist-step="10" ${qty>=max?"disabled":""}>+10</button></div><div class="trade-colonist-projection"><div><small>COST</small><strong>${formatMoney(cost)}</strong></div><div><small>AFTER TRANSFER</small><strong>${formatNumber(Number(this.state.pop)+qty)} / ${formatNumber(supported)}</strong></div></div></div><button data-buy-colonists class="trade-primary colonist-buy" ${can.ok?"":"disabled"}>${qty>0?`BUY ${formatNumber(qty)} COLONISTS`:"NO SUPPORTED CAPACITY"}</button></section>`;
  }

  bindQuick(){
    const modal=this.ui.modal;
    modal.querySelectorAll("[data-trade-tab]").forEach(button=>button.onclick=()=>{this.quickTab=button.dataset.tradeTab;if(this.quickTab==="sell")this.sellPage=0;if(this.quickTab==="buy")this.buyPage=0;this.renderQuick();});
    modal.querySelectorAll("[data-qty-step]").forEach(button=>button.onclick=()=>{const kind=button.dataset.qtyStep,prop=kind==="sell"?"sellAmount":"buyAmount";this[prop]=clamp(this[prop]+Number(button.dataset.delta),1,MAX_TRADE);this.renderQuick();});
    modal.querySelectorAll("[data-qty-set]").forEach(button=>button.onclick=()=>{const prop=button.dataset.qtySet==="sell"?"sellAmount":"buyAmount";this[prop]=clamp(button.dataset.value,1,MAX_TRADE);this.renderQuick();});
    modal.querySelectorAll("[data-qty-input]").forEach(input=>input.onchange=()=>{const prop=input.dataset.qtyInput==="sell"?"sellAmount":"buyAmount";this[prop]=clamp(input.value,1,MAX_TRADE);this.renderQuick();});
    modal.querySelectorAll("[data-page]").forEach(button=>button.onclick=()=>{const prop=button.dataset.page==="sell"?"sellPage":"buyPage";this[prop]=Math.max(0,this[prop]+Number(button.dataset.dir));this.renderQuick();});
    modal.querySelectorAll("[data-buy-category]").forEach(button=>button.onclick=()=>{this.buyCategory=button.dataset.buyCategory;this.buyPage=0;this.renderQuick();});
    modal.querySelectorAll("[data-sell-key]").forEach(button=>button.onclick=()=>{const key=button.dataset.sellKey,entry=this.state.inventory[key],r=this.trade.sell(this.state,key,this.sellAmount);if(!r.ok){this.ui.toast(r.reason);return;}this.log("trade-sale",`Sold ${formatNumber(r.qty)} ${entry?.name||"resource"} for ${formatMoney(r.revenue)}.`,{resource:entry?.name,resourceId:entry?.resourceId,quantity:r.qty,revenue:r.revenue,exportRemaining:r.exportRemaining});this.repo.save(this.state);this.ui.render?.();this.ui.toast(`Sold ${formatNumber(r.qty)} for ${formatMoney(r.revenue)}.`);this.renderQuick();});
    const sellAll=modal.querySelector("[data-sell-all]");if(sellAll)sellAll.onclick=()=>{const r=this.trade.sellAll(this.state);if(!r.ok){this.ui.toast(r.reason||"Nothing could be exported.");return;}this.log("trade-sell-all",`Bulk export sold ${formatNumber(r.qty)} units for ${formatMoney(r.revenue)} while protecting colony reserves.`,{quantity:r.qty,revenue:r.revenue,exportRemaining:r.exportRemaining});this.repo.save(this.state);this.ui.render?.();this.ui.toast(`Sold ${formatNumber(r.qty)} units for ${formatMoney(r.revenue)}.`);this.renderQuick();};
    modal.querySelectorAll("[data-buy-key]").forEach(button=>button.onclick=()=>this.buyResource(button.dataset.buyKey,this.buyAmount));
    const reserveBuy=modal.querySelector("[data-buy-reserve]");if(reserveBuy&&reserveBuy.dataset.buyReserve)reserveBuy.onclick=()=>{const key=reserveBuy.dataset.buyReserve,shortfall=this.trade.reserveShortfall(this.state,key);if(shortfall<=0){this.ui.toast("That reserve is already met.");return;}this.buyResource(key,shortfall);};
    modal.querySelectorAll("[data-colonist-step]").forEach(button=>button.onclick=()=>{const max=Math.min(250,this.trade.colonistCapacity(this.state),this.trade.passengerRemaining(this.state));this.colonistAmount=clamp(this.colonistAmount+Number(button.dataset.colonistStep),1,Math.max(1,max));this.renderQuick();});
    const colonistInput=modal.querySelector("[data-colonist-input]");if(colonistInput)colonistInput.onchange=()=>{const max=Math.min(250,this.trade.colonistCapacity(this.state),this.trade.passengerRemaining(this.state));this.colonistAmount=clamp(colonistInput.value,1,Math.max(1,max));this.renderQuick();};
    const colonists=modal.querySelector("[data-buy-colonists]");if(colonists)colonists.onclick=()=>{const r=this.trade.transferColonists(this.state,this.colonistAmount);if(!r.ok){this.ui.toast(r.reason);return;}this.log("colonists-arrived",`${formatNumber(r.qty)} colonists arrived on the corporate trade ship.`,{quantity:r.qty,cost:r.cost,source:"trade-ship",population:r.pop});this.ui.onRecalculate?.();this.repo.save(this.state);this.ui.render?.();this.ui.toast(`${formatNumber(r.qty)} colonists transferred to the colony.`);this.renderQuick();};
    const depart=modal.querySelector("[data-depart]");if(depart)depart.onclick=()=>{this.trade.depart(this.state);this.log("ship-departed",`Corporate ship departed ${this.state.contract.colonyName}.`,{visit:this.state.trade.visits,nextArrivalDay:this.state.trade.nextArrivalDay,exportUsed:this.state.trade.exportUsed,cargoUsed:this.state.trade.cargoUsed});modal.classList.remove("trade-quick-modal");modal.classList.add("hidden");this.render();this.repo.save(this.state);this.onDepart?.();};
  }

  buyResource(key,amount){
    const item=this.trade.catalog().find(x=>x.key===key),r=this.trade.buy(this.state,key,amount);if(!r.ok){this.ui.toast(r.reason);return;}this.log("trade-purchase",`Bought ${formatNumber(r.qty)} ${r.entry.name} for ${formatMoney(r.cost)}.`,{resource:r.entry.name,resourceId:r.entry.resourceId,quantity:r.qty,cost:r.cost,cargoRemaining:r.cargoRemaining});this.ui.onRecalculate?.();this.repo.save(this.state);this.ui.render?.();this.ui.toast(`Bought ${formatNumber(r.qty)} ${item?.name||r.entry.name} • ${formatNumber(r.cargoRemaining)} cargo left.`);this.renderQuick();
  }
}
