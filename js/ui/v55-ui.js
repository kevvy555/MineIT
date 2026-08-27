import { CONFIG } from "../core/config.js";
import { clamp, formatMoney, formatNumber } from "../core/utils.js";
import { loadViewTemplate, renderViewTemplate } from "../core/view-template.js";
import { ContractUIMixin } from "./contract-ui.js";
import { IndustryUIMixin } from "./industry-ui.js";
import { UIEnhancementsMixin } from "./ui-enhancements.js";

const TECH_LABELS={power:"POWER",food:"FOOD PRODUCTION",mining:"MINING"};
const OPERATION_VIEWS={workforce:"./views/operational-workforce.html",transport:"./views/dedicated-colony-transport.html",renewable:"./views/renewable-harvest.html"};

export class V55UIMixin {
  logEvent(type,message,data={}){return this.gameLog?.event(this.state,type,message,data);}
  render(){ContractUIMixin.prototype.render.call(this);const elapsed=this.contracts.contractAgeDays(this.state),deadline=this.contracts.deadlineDays(this.state);document.querySelector("#timeBar").style.width=`${clamp(elapsed/Math.max(1,deadline)*100,0,100)}%`;document.querySelector("#dateText").textContent=`CORP Y${this.state.year} D${this.state.day}`;}
  colonyPanel(){
    IndustryUIMixin.prototype.colonyPanel.call(this);if(this.state.status==="dead")return;
    const body=this.modal.querySelector(".modal-body");if(!body)return;
    this.renderColonyOperationCards(body);this.bindColonyAuditActions(body);
  }
  bindColonyAuditActions(body){
    for(const selector of["[data-housing]","[data-industry]","[data-emergency]"]){
      const button=body.querySelector(selector);if(!button||button.dataset.logged55)continue;
      button.dataset.logged55="1";const original=button.onclick;
      button.onclick=e=>this.auditColonyAction(button,original,e);
    }
  }
  auditColonyAction(button,original,event){
    const before={housing:this.state.colony.housingLevel,industry:this.state.colony.industryLevel,emergency:this.state.colony.emergencyMode};
    original?.call(button,event);
    if(this.state.colony.housingLevel!==before.housing)this.logEvent("housing-expanded",`Housing expanded to level ${this.state.colony.housingLevel}.`,{housingLevel:this.state.colony.housingLevel,housingCapacity:this.state.colony.housingCapacity});
    if(this.state.colony.industryLevel!==before.industry)this.logEvent("industry-expanded",`Industry expanded to L${this.state.colony.industryLevel}.`,{industryLevel:this.state.colony.industryLevel});
    if(this.state.colony.emergencyMode!==before.emergency)this.logEvent("emergency-mode",`Emergency Mode ${this.state.colony.emergencyMode?"enabled":"disabled"}.`,{enabled:this.state.colony.emergencyMode});
    this.repo.save(this.state);
  }
  async renderColonyOperationCards(body){
    const revision=(this.colonyCardsRevision||0)+1;this.colonyCardsRevision=revision;
    try{
      const [workforce,transport]=await Promise.all([loadViewTemplate(OPERATION_VIEWS.workforce),loadViewTemplate(OPERATION_VIEWS.transport)]);
      if(!this.activeModalBody(body,revision))return;
      this.mountWorkforceCard(body,workforce);this.mountTransportCard(body,transport);
    }catch(error){if(this.activeModalBody(body,revision)){this.diagnostics?.error?.("colony operation views failed",error);this.toast("Unable to load colony operation details.");}}
  }
  activeModalBody(body,revision){return revision===this.colonyCardsRevision&&body.isConnected&&body===this.modal.querySelector(".modal-body");}
  viewFragment(source,selector){const fragment=document.createRange().createContextualFragment(source),root=fragment.querySelector(selector);return{fragment,root};}
  setViewText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");}
  mountWorkforceCard(body,source){
    const anchor=body.querySelector(".need-grid")?.previousElementSibling;if(!anchor)return;
    const {fragment,root}=this.viewFragment(source,"[data-operational-workforce-card]");if(!root)return;
    const m=this.state.metrics,shortfall=Math.max(0,Number(m.workforceShortfall)||0);
    this.setViewText(root,"[data-workforce-available]",formatNumber(Math.max(0,Number(m.workforceAvailable)||0)));this.setViewText(root,"[data-workforce-required]",formatNumber(Math.max(0,Number(m.workforceRequired)||0)));
    this.setViewText(root,"[data-workforce-free]",formatNumber(Math.max(0,Number(m.workforceFree)||0)));this.setViewText(root,"[data-contract-age]",`Y${this.contracts.contractYear(this.state)} D${this.contracts.contractDay(this.state)}`);
    this.setViewText(root,"[data-workforce-share]",Math.round(CONFIG.WORKFORCE_SHARE*100));root.querySelector("[data-workforce-shortfall]").hidden=shortfall<=0;anchor.after(fragment);
  }
  mountTransportCard(body,source){
    const anchor=body.querySelector(".colony-management");if(!anchor)return;
    const {fragment,root}=this.viewFragment(source,"[data-dedicated-transport-card]");if(!root)return;
    this.populateTransportCard(root);this.bindTransportCard(root);anchor.before(fragment);
  }
  populateTransportCard(card){
    const supported=this.transport?.availableCapacity(this.state)||0,orders=this.transport?.ensure(this.state)||[],blocked=this.state.contract.ended||this.state.status==="liability";
    this.setViewText(card,"[data-transport-days]",CONFIG.DEDICATED_TRANSPORT_DAYS);this.setViewText(card,"[data-transport-supported]",formatNumber(supported));this.setViewText(card,"[data-transport-pending]",formatNumber(this.transport.pendingPopulation(this.state)));
    this.populateTransportOrders(card,orders);card.querySelector("[data-transport-blocked]").hidden=!blocked;card.querySelector("[data-transport-controls]").hidden=blocked;
    if(!blocked)this.configureTransportControls(card,supported);
  }
  populateTransportOrders(card,orders){
    const host=card.querySelector("[data-transport-orders]"),template=card.querySelector("[data-transport-order-template]"),rows=document.createDocumentFragment();
    for(const order of orders){const row=template.content.cloneNode(true);this.setViewText(row,"[data-order-amount]",`+${formatNumber(order.amount)} colonists`);this.setViewText(row,"[data-order-eta]",`${formatNumber(this.transport.daysRemaining(this.state,order))}d ETA`);this.setViewText(row,"[data-order-cost]",formatMoney(order.cost));rows.append(row);}
    host.replaceChildren(rows);host.hidden=orders.length===0;card.querySelector("[data-transport-empty]").hidden=orders.length>0;
  }
  configureTransportControls(card,supported){
    for(const button of card.querySelectorAll("[data-transport]")){const amount=button.dataset.transport==="max"?1:+button.dataset.transport;button.disabled=supported<amount;}
    card.querySelector("[data-transport-custom]").max=String(Math.max(1,supported));
  }
  bindTransportCard(card){
    card.addEventListener("click",event=>{
      const button=event.target.closest?.("button");if(!button||!card.contains(button))return;
      if(button.matches("[data-transport]")){const qty=button.dataset.transport==="max"?this.transport.availableCapacity(this.state):+button.dataset.transport;this.requestTransport(qty);}
      else if(button.matches("[data-transport-request]"))this.requestTransport(+card.querySelector("[data-transport-custom]").value);
    });
  }
  requestTransport(amount){const r=this.transport.request(this.state,amount);if(!r.ok){this.toast(r.reason);return}this.logEvent("transport-ordered",`Dedicated transport ordered for ${formatNumber(r.amount)} colonists; ETA ${CONFIG.DEDICATED_TRANSPORT_DAYS} days.`,{quantity:r.amount,cost:r.cost,arrivalDay:r.arrivalDay});this.repo.save(this.state);this.toast(`${formatNumber(r.amount)} colonists ordered • ETA ${CONFIG.DEDICATED_TRANSPORT_DAYS}d • ${formatMoney(r.cost)}`);this.colonyPanel();}
  currentCollection(){IndustryUIMixin.prototype.currentCollection.call(this);const body=this.modal.querySelector(".modal-body"),m=this.state.metrics;if(!body)return;const wf=Math.min(m.workforceSurvivalFactor??1,m.workforceCommercialFactor??1);if(wf<.999)body.insertAdjacentHTML("afterbegin",`<div class="requirement locked">WORKFORCE SHORTAGE — resource operations are automatically prioritising Food/Fuel. Commercial extraction may be reduced.</div>`);}
  tile(tile){
    IndustryUIMixin.prototype.tile.call(this,tile);if(!tile?.revealed)return;
    const firstReq=this.tilePanel.querySelector(".requirement");if(!firstReq)return;
    this.insertTileOperationSummary(tile,firstReq);this.renderRenewableHarvestCard(tile,firstReq);this.bindTileAuditActions(tile);
  }
  insertTileOperationSummary(tile,firstReq){
    const developed=!!tile.developed,workers=this.colony.siteWorkforce(this.state,{...tile,level:Math.max(1,tile.level||1)}),nextWorkers=developed?this.colony.siteWorkforce(this.state,{...tile,level:(tile.level||1)+1}):workers,free=this.colony.freeWorkforce(this.state),fullRate=this.resources.sitePotentialRate({...tile,level:Math.max(1,tile.level||1)});
    firstReq.insertAdjacentHTML("afterend",`<div class="effect">Operational workforce: ${formatNumber(workers)}${developed?` • next level ${formatNumber(nextWorkers)} (${formatNumber(Math.max(0,nextWorkers-workers))} additional)`:""} • ${formatNumber(free)} currently free</div><div class="effect">Site-driven throughput: ${formatNumber(fullRate)}/day before workforce / Industry throttling. Quality affects sale value, not extraction speed.</div>`);
  }
  async renderRenewableHarvestCard(tile,anchor){
    if(!this.resources.isRenewable(tile)||!tile.developed||tile.renewableWiped)return;
    const revision=(this.renewableCardRevision||0)+1;this.renewableCardRevision=revision;
    try{const source=await loadViewTemplate(OPERATION_VIEWS.renewable);if(revision!==this.renewableCardRevision||!anchor.isConnected)return;this.mountRenewableHarvestCard(tile,anchor,source);}
    catch(error){if(revision===this.renewableCardRevision&&anchor.isConnected)this.diagnostics?.error?.("renewable harvest view failed",error);}
  }
  mountRenewableHarvestCard(tile,anchor,source){
    this.resources.ensureRenewable(tile);const {fragment,root}=this.viewFragment(source,"[data-renewable-harvest-card]");if(!root)return;
    const intensity=Math.round(tile.harvestIntensity*100),condition=this.resources.renewableCondition(tile),over=intensity>100;
    this.setViewText(root,"[data-harvest-intensity]",`${intensity}%`);this.setViewText(root,"[data-harvest-sustainable]",`${formatNumber(this.resources.sustainableRate(tile))}/d`);this.setViewText(root,"[data-harvest-condition]",condition.label);this.setViewText(root,"[data-harvest-potential]",`${formatNumber(this.resources.sitePotentialRate(tile))}/d`);
    root.querySelector("[data-harvest-over]").hidden=!over;this.setViewText(root,"[data-harvest-copy]",this.harvestGuidance(intensity));root.querySelector("[data-harvest-down]").disabled=intensity<=25;root.querySelector("[data-harvest-up]").disabled=intensity>=200;
    this.bindHarvestCard(root,tile);anchor.after(fragment);
  }
  harvestGuidance(intensity){if(intensity>100)return"Harvest above 100% degrades this resource over time. Continued pressure can reduce its size and eventually wipe it out permanently.";if(intensity<100)return"Harvesting below sustainable yield allows a previously damaged resource to recover slowly, up to its original surveyed size.";return"At 100% this site is harvesting at its sustainable yield.";}
  bindHarvestCard(card,tile){card.addEventListener("click",event=>{const button=event.target.closest?.("[data-harvest-down],[data-harvest-up]");if(!button||!card.contains(button))return;this.adjustRenewableHarvest(tile,button.matches("[data-harvest-down]")?-25:25);});}
  adjustRenewableHarvest(tile,delta){
    const result=this.resources.adjustHarvestIntensity(tile,delta);if(!result.ok)return;
    this.onRecalculate?.();this.logEvent("harvest-intensity",`${tile.name} harvest changed from ${result.before}% to ${result.after}%.`,{x:tile.x,y:tile.y,resource:tile.name,before:result.before,after:result.after,sustainableRate:result.sustainableRate});
    this.repo.save(this.state);this.tile(tile);
  }
  bindTileAuditActions(tile){
    for(const selector of["[data-develop]","[data-upgrade]"]){const button=this.tilePanel.querySelector(selector);if(!button||button.dataset.logged55)continue;button.dataset.logged55="1";const original=button.onclick;button.onclick=e=>this.auditTileAction(tile,button,original,e);}
  }
  auditTileAction(tile,button,original,event){
    const wasDeveloped=tile.developed,beforeLevel=tile.level,beforeCash=this.state.company.cash;original?.call(button,event);
    if(!wasDeveloped&&tile.developed)this.logEvent("site-developed",`${tile.name} site developed at ${tile.x},${tile.y}.`,{x:tile.x,y:tile.y,resource:tile.name,type:tile.type,quality:tile.quality,size:tile.depositScale||tile.abundanceLabel,workers:this.colony.siteWorkforce(this.state,tile),cashCost:beforeCash-this.state.company.cash});
    else if(tile.level>beforeLevel)this.logEvent("site-upgraded",`${tile.name} upgraded to L${tile.level}.`,{x:tile.x,y:tile.y,resource:tile.name,level:tile.level,workers:this.colony.siteWorkforce(this.state,tile),cashCost:beforeCash-this.state.company.cash});
    this.repo.save(this.state);
  }
  techEffect(category,tech){if(category==="power")return`Power ${formatNumber(tech.powerCapacity)} • Population cap ${formatNumber(tech.populationCap)} • Industry L${tech.industryCap} • Fuel intensity ${tech.fuelIntensity.toFixed(3)}×`;if(category==="food"){const efficiency=Math.max(.70,1-(tech.level-1)*.035);return`Natural Food workforce requirement ×${efficiency.toFixed(2)}${tech.syntheticFood?` • Synthetic food ${formatNumber(tech.syntheticFood)}/day`:""}`;}const efficiency=Math.max(.65,1-(tech.level-1)*.04),slots=clamp(1+Math.floor((tech.level-1)/2),1,5),unlocks=this.resources.catalog().filter(r=>r.miningLevel===tech.level&&!r.manufactured).map(r=>r.name);return`Extraction workforce ×${efficiency.toFixed(2)} • Survey slots ${slots}${unlocks.length?` • Unlocks: ${unlocks.join(", ")}`:""}`;}
  tech(){UIEnhancementsMixin.prototype.tech.call(this);this.modal.querySelectorAll("[data-tech-cat]").forEach(button=>{if(button.dataset.logged55)return;button.dataset.logged55="1";const original=button.onclick;button.onclick=e=>{const category=button.dataset.techCat,before=this.technology.level(this.state,category),cash=this.state.company.cash;original?.call(button,e);const after=this.technology.level(this.state,category);if(after>before){const tech=this.technology.current(this.state,category);this.logEvent("technology-purchased",`${TECH_LABELS[category]} technology advanced to L${after}: ${tech.name}.`,{category,level:after,name:tech.name,cost:cash-this.state.company.cash});this.repo.save(this.state);}};});}
  menu(){UIEnhancementsMixin.prototype.menu.call(this);const grid=this.modal.querySelector(".grid2");if(!grid)return;const button=document.createElement("button");button.textContent="GAME LOG";button.dataset.gameLog="1";grid.insertBefore(button,grid.querySelector("[data-reset]"));button.onclick=()=>this.gameLogPanel();}
  async gameLogPanel(){
    const events=[...(this.gameLog?.ensure(this.state).events||[])].slice(-250).reverse(),esc=v=>String(v??"").replace(/[&<>]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]));
    const eventRows=events.length?events.map(e=>`<div class="help-section"><div class="help-section-title"><h3>Y${e.year} D${e.day} • ${esc(e.type).toUpperCase()}</h3><span class="tiny">${esc(e.colonyName||"Corporation")}</span></div><p>${esc(e.message)}</p></div>`).join(""):`<article class="card"><p>No events have been recorded yet.</p></article>`;
    try{const body=await renderViewTemplate("./views/game-log.html",{TELEMETRY_DAYS:CONFIG.LOG_TELEMETRY_INTERVAL_DAYS,EVENT_COUNT:formatNumber(this.state.gameLog?.events?.length||0),TELEMETRY_COUNT:formatNumber(this.state.gameLog?.telemetry?.length||0),EVENT_ROWS:eventRows});this.open("Game Log",body);this.modal.querySelector("[data-download-log]").onclick=()=>this.downloadGameLog();}
    catch(error){this.diagnostics.error("game log template failed",error);this.toast("Unable to open the game log.");}
  }
  downloadGameLog(){try{this.onCapturePortfolio?.();const payload=this.gameLog.exportData(this.state,this.state.portfolio),blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`mineit-game-log-Y${this.state.year}-D${this.state.day}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);this.toast("Game log download started.");}catch(error){this.diagnostics.error("game log download failed",error);this.toast("Game log download failed.");}}
}
