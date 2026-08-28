import { TradeUI as BaseTradeUI } from "./v55-trade-ui.js";
import { formatMoney, formatNumber } from "../core/utils.js";
import { loadViewTemplate,renderViewTemplate } from "../core/view-template.js";

const PAGE_SIZE=4,MAX_TRADE=100000,BUY_CATEGORIES=["Fuel","Food","Ore","Build"],SELL_CATEGORIES=["food","build","fuel","ore"];
const QUICK_VIEWS={sell:"./views/quick-trade-sell.html",buy:"./views/quick-trade-buy.html"};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(value)||0)));

export class TradeUI extends BaseTradeUI{
  constructor(opts){
    super(opts);
    this.quickTab="sell";
    this.sellAmount=10000;
    this.buyAmount=10000;
    this.colonistAmount=0;
    this.colonistVisit=null;
    this.sellPage=0;
    this.buyPage=0;
    this.buyCategory="Fuel";
    this.quickRenderRevision=0;
  }

  amountControl(kind,value){return renderViewTemplate("./views/quick-trade-amount.html",{KIND:kind,MAX_TRADE,VALUE:value});}
  viewFragment(source){return document.createRange().createContextualFragment(source);}
  cloneTradeTemplate(root,selector){return root?.querySelector(selector)?.content.cloneNode(true)||null;}
  setTradeText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");return node;}
  mountTradeAmount(root,source){root.querySelector("[data-trade-amount-host]")?.replaceChildren(this.viewFragment(source));}
  configurePager(root,page,pages){
    const pager=root.querySelector("[data-trade-pager]"),buttons=pager?.querySelectorAll("[data-page]")||[];if(!pager)return;
    pager.classList.toggle("single",pages<=1);this.setTradeText(pager,"[data-page-label]",`${page+1} / ${pages}`);
    for(const button of buttons){button.hidden=pages<=1;button.disabled=Number(button.dataset.dir)<0?page<=0:page>=pages-1;}
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

  async selectedTradeView(){if(this.quickTab==="sell")return this.sellView();if(this.quickTab==="buy")return this.buyView();return this.viewFragment(await this.colonistView());}
  async renderQuick(){
    if(!this.state.trade.active){this.status();return;}
    const revision=++this.quickRenderRevision,cash=this.state.company.cash,cargo=this.trade.cargoRemaining(this.state),exports=this.trade.exportRemaining(this.state),pax=this.trade.passengerRemaining(this.state),colonistsBlocked=this.state.contract.ended||this.state.status==="liability";
    let tradeView,body;
    try{
      [tradeView,body]=await Promise.all([this.selectedTradeView(),renderViewTemplate("./views/quick-trade-shell.html",{CASH:formatMoney(cash),IMPORT:formatNumber(cargo),EXPORT:formatNumber(exports),PAX:colonistsBlocked?"—":formatNumber(pax),SELL_ACTIVE:this.quickTab==="sell"?"active":"",BUY_ACTIVE:this.quickTab==="buy"?"active":"",COLONISTS_ACTIVE:this.quickTab==="colonists"?"active":"",COLONISTS_DISABLED:colonistsBlocked?"disabled":""})]);
    }catch(error){if(revision!==this.quickRenderRevision)return;this.ui.diagnostics?.error?.("quick trade template failed",error);this.ui.toast("Unable to open the corporate trade ship.");return;}
    if(revision!==this.quickRenderRevision||!this.state.trade.active)return;
    this.ui.open("Corporate Trade Ship — DOCKED",body);this.ui.modal.querySelector("[data-trade-view-host]")?.replaceChildren(tradeView);
    this.ui.modal.classList.add("trade-quick-modal");
    this.bindQuick();
  }

  async sellView(){
    const all=this.trade.sellableStock(this.state),pages=Math.max(1,Math.ceil(all.length/PAGE_SIZE));this.sellPage=clamp(this.sellPage,0,pages-1);const rows=all.slice(this.sellPage*PAGE_SIZE,(this.sellPage+1)*PAGE_SIZE),allQuote=this.trade.sellAllQuote(this.state),[source,amount]=await Promise.all([loadViewTemplate(QUICK_VIEWS.sell),this.amountControl("sell",this.sellAmount)]),fragment=this.viewFragment(source),root=fragment.querySelector("[data-trade-sell-view]");
    this.setTradeText(root,"[data-sell-total]",formatMoney(allQuote.revenue));this.mountTradeAmount(root,amount);root.querySelector("[data-sell-empty]").hidden=rows.length>0;this.populateSellRows(root,rows);this.populateCategorySellButtons(root);
    const sellAll=root.querySelector("[data-sell-all]");sellAll.disabled=allQuote.qty<=0;sellAll.textContent=`SELL ALL${allQuote.qty>0?` — ${formatMoney(allQuote.revenue)}`:""}`;this.configurePager(root,this.sellPage,pages);return fragment;
  }
  populateCategorySellButtons(root){for(const type of SELL_CATEGORIES){const button=root.querySelector(`[data-sell-category="${type}"]`);if(!button)continue;const quote=this.trade.sellCategoryQuote(this.state,type);button.disabled=quote.qty<=0;button.textContent=`SELL ALL ${type.toUpperCase()}${quote.qty>0?` — ${formatMoney(quote.revenue)}`:""}`;}}
  populateSellRows(root,rows){
    const host=root.querySelector("[data-sell-rows]"),rendered=document.createDocumentFragment();
    for(const entry of rows){const q=this.trade.quoteSell(this.state,entry.key,this.sellAmount),reserve=this.trade.tradeReserve(this.state,entry.key),fragment=this.cloneTradeTemplate(root,"[data-sell-row-template]");if(!fragment)continue;const button=fragment.querySelector("[data-sell-key]"),reserveNode=fragment.querySelector("[data-sell-reserve]");this.setTradeText(fragment,"[data-sell-name]",entry.name);this.setTradeText(fragment,"[data-sell-stock]",`${formatNumber(entry.amount)} stock`);reserveNode.hidden=reserve<=0;if(reserve>0)reserveNode.textContent=` • ${formatNumber(reserve)} colony reserve`;this.setTradeText(fragment,"[data-sell-available]",` • ${formatNumber(entry.sellableAmount)} sellable`);button.dataset.sellKey=entry.key;button.disabled=q.qty<=0;this.setTradeText(button,"[data-sell-label]",q.qty>0?`SELL ${formatNumber(q.qty)}`:"SELL");const revenue=button.querySelector("[data-sell-revenue]");revenue.hidden=q.qty<=0;if(q.qty>0)revenue.textContent=formatMoney(q.revenue);rendered.append(fragment);}host.replaceChildren(rendered);
  }

  async buyView(){
    const category=this.buyCategory,catalog=this.trade.catalog().filter(item=>item.category===category).map(item=>{const stock=this.stockAmount(item.key),reserve=this.trade.tradeReserve(this.state,item.key),shortfall=Math.max(0,reserve-stock);return{...item,stock,reserve,shortfall};}).sort((a,b)=>(b.shortfall>0)-(a.shortfall>0)||b.shortfall-a.shortfall||a.name.localeCompare(b.name)),pages=Math.max(1,Math.ceil(catalog.length/PAGE_SIZE));this.buyPage=clamp(this.buyPage,0,pages-1);const rows=catalog.slice(this.buyPage*PAGE_SIZE,(this.buyPage+1)*PAGE_SIZE),reserveTarget=catalog.find(x=>x.shortfall>0),[source,amount]=await Promise.all([loadViewTemplate(QUICK_VIEWS.buy),this.amountControl("buy",this.buyAmount)]),fragment=this.viewFragment(source),root=fragment.querySelector("[data-trade-buy-view]");
    this.setTradeText(root,"[data-buy-cargo]",`${formatNumber(this.trade.cargoRemaining(this.state))} cargo`);this.mountTradeAmount(root,amount);this.populateBuyCategories(root,category);this.populateBuyRows(root,rows);const reserveBuy=root.querySelector("[data-buy-reserve]");reserveBuy.dataset.buyReserve=reserveTarget?.key||"";reserveBuy.disabled=!reserveTarget;reserveBuy.textContent=reserveTarget?`BUY ${reserveTarget.name.toUpperCase()} TO RESERVE`:"NO RESERVE SHORTAGE";this.configurePager(root,this.buyPage,pages);return fragment;
  }
  populateBuyCategories(root,category){
    const host=root.querySelector("[data-buy-categories]"),rendered=document.createDocumentFragment();for(const name of BUY_CATEGORIES){const fragment=this.cloneTradeTemplate(root,"[data-buy-category-template]");if(!fragment)continue;const button=fragment.querySelector("[data-buy-category]");button.dataset.buyCategory=name;button.classList.toggle("active",name===category);button.textContent=name.toUpperCase();rendered.append(fragment);}host.replaceChildren(rendered);
  }
  populateBuyRows(root,rows){
    const host=root.querySelector("[data-buy-rows]"),rendered=document.createDocumentFragment();for(const item of rows){const q=this.buyQuote(item),fragment=this.cloneTradeTemplate(root,"[data-buy-row-template]");if(!fragment)continue;const button=fragment.querySelector("[data-buy-key]"),reserve=fragment.querySelector("[data-buy-reserve-copy]");this.setTradeText(fragment,"[data-buy-name]",item.name);this.setTradeText(fragment,"[data-buy-stock]",`${formatNumber(item.stock)} stock`);reserve.hidden=item.reserve<=0;if(item.reserve>0)reserve.textContent=` • ${formatNumber(item.reserve)} reserve${item.shortfall>0?` • SHORT ${formatNumber(item.shortfall)}`:""}`;this.setTradeText(fragment,"[data-buy-price]",` • ${this.price(q.price)}/u`);button.dataset.buyKey=item.key;button.disabled=q.qty<=0;this.setTradeText(button,"[data-buy-label]",q.qty>0?`BUY ${formatNumber(q.qty)}`:"BUY");const cost=button.querySelector("[data-buy-cost]");cost.hidden=q.qty<=0;if(q.qty>0)cost.textContent=formatMoney(q.cost);rendered.append(fragment);}host.replaceChildren(rendered);
  }

  colonistHardMax(){return Math.max(0,Math.min(250,this.trade.colonistCapacity(this.state),this.trade.passengerRemaining(this.state)));}
  syncColonistDefault(){const visit=Number(this.state.trade?.visits)||0;if(this.colonistVisit===visit)return;this.colonistVisit=visit;this.colonistAmount=Math.min(this.colonistHardMax(),this.trade.colonistSafeCapacity(this.state));}
  async colonistView(){
    this.syncColonistDefault();const supported=Math.max(0,Math.floor(Math.min(Number(this.state.colony.housingCapacity)||0,Number(this.state.metrics.powerPopulationCap)||Number(this.state.colony.housingCapacity)||0))),available=Math.max(0,Math.floor(this.trade.colonistCapacity(this.state))),pax=Math.max(0,Math.floor(this.trade.passengerRemaining(this.state))),hardMax=this.colonistHardMax(),safeMax=Math.min(hardMax,this.trade.colonistSafeCapacity(this.state)),qty=clamp(this.colonistAmount,0,hardMax);this.colonistAmount=qty;const cost=qty?this.trade.colonistTransferCost(this.state,qty):0,foodMargin=this.trade.colonistFoodSurplusAfter(this.state,qty),powerMargin=(Number(this.state.metrics.powerCapacity)||0)-(Number(this.state.metrics.powerDemand)||0),can=qty?this.trade.canTransferColonists(this.state,qty):{ok:false};
    return renderViewTemplate("./views/quick-trade-colonists.html",{MAX:formatNumber(safeMax),POPULATION:formatNumber(this.state.pop),SUPPORTED:formatNumber(supported),HOUSING_FREE:formatNumber(available),PAX:formatNumber(pax),FOOD_CLASS:foodMargin<0?"bad":"good",FOOD_MARGIN:`${foodMargin>=0?"+":""}${formatNumber(foodMargin)}`,POWER_CLASS:powerMargin<0?"bad":"good",POWER_MARGIN:`${powerMargin>=0?"+":""}${formatNumber(powerMargin)}`,MIN_DISABLED:qty<=0?"disabled":"",INPUT_MAX:Math.max(0,hardMax),QUANTITY:qty,MAX_DISABLED:qty>=hardMax?"disabled":"",SAFE_MAX_DISABLED:safeMax<=0?"disabled":"",COST:formatMoney(cost),AFTER_POPULATION:formatNumber(Number(this.state.pop)+qty),BUY_DISABLED:can.ok?"":"disabled",BUY_LABEL:qty>0?`BUY ${formatNumber(qty)} COLONISTS`:"SELECT COLONISTS"});
  }

  afterSale(result,kind,label){if(!result.ok){this.ui.toast(result.reason||"Nothing could be exported.");return;}this.log(kind,`${label} sold ${formatNumber(result.qty)} units for ${formatMoney(result.revenue)} while protecting the colony reserve.`,{quantity:result.qty,revenue:result.revenue,exportRemaining:result.exportRemaining});this.repo.save(this.state);this.ui.render?.();this.ui.toast(`Sold ${formatNumber(result.qty)} units for ${formatMoney(result.revenue)}.`);this.renderQuick();}
  bindQuick(){
    const modal=this.ui.modal;
    modal.querySelectorAll("[data-trade-tab]").forEach(button=>button.onclick=()=>{this.quickTab=button.dataset.tradeTab;if(this.quickTab==="sell")this.sellPage=0;if(this.quickTab==="buy")this.buyPage=0;this.renderQuick();});
    modal.querySelectorAll("[data-qty-step]").forEach(button=>button.onclick=()=>{const kind=button.dataset.qtyStep,prop=kind==="sell"?"sellAmount":"buyAmount";this[prop]=clamp(this[prop]+Number(button.dataset.delta),1,MAX_TRADE);this.renderQuick();});
    modal.querySelectorAll("[data-qty-set]").forEach(button=>button.onclick=()=>{const prop=button.dataset.qtySet==="sell"?"sellAmount":"buyAmount";this[prop]=clamp(button.dataset.value,1,MAX_TRADE);this.renderQuick();});
    modal.querySelectorAll("[data-qty-input]").forEach(input=>input.onchange=()=>{const prop=input.dataset.qtyInput==="sell"?"sellAmount":"buyAmount";this[prop]=clamp(input.value,1,MAX_TRADE);this.renderQuick();});
    modal.querySelectorAll("[data-page]").forEach(button=>button.onclick=()=>{const prop=button.dataset.page==="sell"?"sellPage":"buyPage";this[prop]=Math.max(0,this[prop]+Number(button.dataset.dir));this.renderQuick();});
    modal.querySelectorAll("[data-buy-category]").forEach(button=>button.onclick=()=>{this.buyCategory=button.dataset.buyCategory;this.buyPage=0;this.renderQuick();});
    modal.querySelectorAll("[data-sell-key]").forEach(button=>button.onclick=()=>{const key=button.dataset.sellKey,entry=this.state.inventory[key],r=this.trade.sell(this.state,key,this.sellAmount);if(!r.ok){this.ui.toast(r.reason);return;}this.log("trade-sale",`Sold ${formatNumber(r.qty)} ${entry?.name||"resource"} for ${formatMoney(r.revenue)}.`,{resource:entry?.name,resourceId:entry?.resourceId,quantity:r.qty,revenue:r.revenue,exportRemaining:r.exportRemaining});this.repo.save(this.state);this.ui.render?.();this.ui.toast(`Sold ${formatNumber(r.qty)} for ${formatMoney(r.revenue)}.`);this.renderQuick();});
    const sellAll=modal.querySelector("[data-sell-all]");if(sellAll)sellAll.onclick=()=>this.afterSale(this.trade.sellAll(this.state),"trade-sell-all","Bulk export");
    modal.querySelectorAll("[data-sell-category]").forEach(button=>button.onclick=()=>{const type=button.dataset.sellCategory;this.afterSale(this.trade.sellCategory(this.state,type),`trade-sell-${type}`,`${type.toUpperCase()} export`);});
    modal.querySelectorAll("[data-buy-key]").forEach(button=>button.onclick=()=>this.buyResource(button.dataset.buyKey,this.buyAmount));
    const reserveBuy=modal.querySelector("[data-buy-reserve]");if(reserveBuy&&reserveBuy.dataset.buyReserve)reserveBuy.onclick=()=>{const key=reserveBuy.dataset.buyReserve,shortfall=this.trade.reserveShortfall(this.state,key);if(shortfall<=0){this.ui.toast("That reserve is already met.");return;}this.buyResource(key,shortfall);};
    modal.querySelectorAll("[data-colonist-step]").forEach(button=>button.onclick=()=>{const max=this.colonistHardMax();this.colonistAmount=clamp(this.colonistAmount+Number(button.dataset.colonistStep),0,max);this.renderQuick();});
    const maxSafe=modal.querySelector("[data-colonist-max]");if(maxSafe)maxSafe.onclick=()=>{this.colonistAmount=Math.min(this.colonistHardMax(),this.trade.colonistSafeCapacity(this.state));this.renderQuick();};
    const colonistInput=modal.querySelector("[data-colonist-input]");if(colonistInput)colonistInput.onchange=()=>{this.colonistAmount=clamp(colonistInput.value,0,this.colonistHardMax());this.renderQuick();};
    const colonists=modal.querySelector("[data-buy-colonists]");if(colonists)colonists.onclick=()=>{const r=this.trade.transferColonists(this.state,this.colonistAmount);if(!r.ok){this.ui.toast(r.reason);return;}this.log("colonists-arrived",`${formatNumber(r.qty)} colonists arrived on the corporate trade ship.`,{quantity:r.qty,cost:r.cost,source:"trade-ship",population:r.pop});this.ui.onRecalculate?.();this.repo.save(this.state);this.ui.render?.();this.ui.toast(`${formatNumber(r.qty)} colonists transferred to the colony.`);this.renderQuick();};
    const depart=modal.querySelector("[data-depart]");if(depart)depart.onclick=()=>{this.trade.depart(this.state);this.log("ship-departed",`Corporate ship departed ${this.state.contract.colonyName}.`,{visit:this.state.trade.visits,nextArrivalDay:this.state.trade.nextArrivalDay,exportUsed:this.state.trade.exportUsed,cargoUsed:this.state.trade.cargoUsed});modal.classList.remove("trade-quick-modal");modal.classList.add("hidden");this.render();this.repo.save(this.state);this.onDepart?.();};
  }

  buyResource(key,amount){
    const item=this.trade.catalog().find(x=>x.key===key),r=this.trade.buy(this.state,key,amount);if(!r.ok){this.ui.toast(r.reason);return;}this.log("trade-purchase",`Bought ${formatNumber(r.qty)} ${r.entry.name} for ${formatMoney(r.cost)}.`,{resource:r.entry.name,resourceId:r.entry.resourceId,quantity:r.qty,cost:r.cost,cargoRemaining:r.cargoRemaining});this.ui.onRecalculate?.();this.repo.save(this.state);this.ui.render?.();this.ui.toast(`Bought ${formatNumber(r.qty)} ${item?.name||r.entry.name} • ${formatNumber(r.cargoRemaining)} cargo left.`);this.renderQuick();
  }
}
