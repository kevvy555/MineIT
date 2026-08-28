import { UIController as ShipPreparationUIController } from "./ship-preparation-ui.js";
import { PLAYER_SHIP_CAPACITY,PLAYER_SHIP_CARGO_CAPACITY,PLAYER_SHIP_FOOD_CAPACITY,PLAYER_SHIP_FUEL_CAPACITY,PLAYER_SHIP_PASSENGERS } from "../domain/expansion-service.js";
import { formatMoney,formatNumber } from "../core/utils.js";

const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));
const SHIP_HIT_ID="__player_ship__";

/** Final feature-layer UI for the ship expansion gameplay batch. */
export class UIController extends ShipPreparationUIController{
  bind(){
    super.bind();
    this.bindClick?.("#starMapBtn",()=>this.starMap());
  }

  render(){
    super.render();
    this.checkCriticalResourceWarnings();
  }

  checkCriticalResourceWarnings(){
    if(this.state.company?.gameOver||this.state.status==="dead"||!this.modal?.classList.contains("hidden"))return;
    this.state.colony.criticalResourceWarnings||={};
    const pending=[];
    for(const [type,days] of [["food",this.state.metrics?.foodDays],["fuel",this.state.metrics?.fuelDays]]){
      const critical=days!==null&&days!==undefined&&Number(days)<=10;
      if(!critical){this.state.colony.criticalResourceWarnings[type]=false;continue;}
      if(this.state.colony.criticalResourceWarnings[type])continue;
      this.state.colony.criticalResourceWarnings[type]=true;
      pending.push({type,days:Math.max(0,Math.ceil(Number(days)||0))});
    }
    if(!pending.length)return;
    this.repo.save(this.state);
    queueMicrotask(()=>{
      if(!this.modal?.classList.contains("hidden"))return;
      const rows=pending.map(item=>`<div class="metric"><small>${item.type.toUpperCase()} REMAINING</small><strong>${formatNumber(item.days)} DAYS</strong></div>`).join("");
      this.open("Critical Resource Warning",`<article class="card critical-resource-warning"><div class="critical-resource-symbol">⚠</div><h3>CRITICAL SURVIVAL RESERVE</h3><p>${pending.map(item=>`${item.type.toUpperCase()} has approximately ${formatNumber(item.days)} days remaining`).join(" • ")}.</p><div class="grid2">${rows}</div><div class="effect warn">Secure more supply or reduce consumption immediately.</div></article>`);
    });
  }

  adjustHarvest(delta){
    const tile=this.selectedTile;
    if(Number(delta)>0&&tile){const check=this.colony.canAdjustHarvestIntensity(this.state,tile,delta);if(!check.ok){this.toast(check.reason);this.renderContext?.();return;}}
    return super.adjustHarvest(delta);
  }

  contextParts(tile){
    const parts=super.contextParts(tile);
    parts.actions=String(parts.actions||"").replace(/<button[^>]*data-context-action="trade-reserve"[^>]*>[\s\S]*?<\/button>/g,"");
    return parts;
  }

  async landColonyPanel(){
    const opened=await super.landColonyPanel();
    if(opened===false)return opened;
    const body=this.modal?.querySelector(".modal-body");if(!body||body.querySelector("[data-colony-trade-reserve]"))return opened;
    const reserve=Math.max(0,Math.floor(Number(this.state.colony?.tradeReserve)||0)),card=document.createElement("article");card.className="card colony-reserve-card";card.innerHTML=`<h3>COLONY STOCK RESERVE</h3><p>Keep this amount of every individual resource unsellable during Corporate Ship exports.</p><div class="metric"><small>RESERVE PER RESOURCE</small><strong>${formatNumber(reserve)}</strong></div><button data-colony-trade-reserve>SET COLONY RESERVE</button>`;
    const management=body.querySelector(".colony-management");if(management)management.before(card);else body.append(card);
    card.querySelector("[data-colony-trade-reserve]").onclick=()=>this.openColonyTradeReserve();
    return opened;
  }

  openColonyTradeReserve(){
    const current=Math.max(0,Math.floor(Number(this.state.colony?.tradeReserve)||0));
    this.open("Colony Stock Reserve",`<article class="card"><h3>GLOBAL COLONY RESERVE</h3><p>The same reserve is protected for every Food, Build, Fuel and Ore resource when selling to the Corporate Ship.</p><input data-colony-reserve-input type="number" min="0" max="1000000000" step="1" inputmode="numeric" value="${current}"><div class="trade-buy-buttons"><button data-colony-reserve-step="-1000">−1K</button><button data-colony-reserve-step="-100">−100</button><button data-colony-reserve-step="100">+100</button><button data-colony-reserve-step="1000">+1K</button></div><button class="action" data-colony-reserve-save>SAVE RESERVE</button></article>`);
    const input=this.modal.querySelector("[data-colony-reserve-input]"),clamp=value=>Math.max(0,Math.min(1000000000,Math.floor(Number(value)||0)));
    this.modal.querySelectorAll("[data-colony-reserve-step]").forEach(button=>button.onclick=()=>{input.value=String(clamp(Number(input.value)+Number(button.dataset.colonyReserveStep)));});
    this.modal.querySelector("[data-colony-reserve-save]").onclick=()=>{const amount=clamp(input.value);this.state.colony.tradeReserve=amount;delete this.state.colony.tradeReserves;this.repo.save(this.state);this.toast(`Colony reserve set to ${formatNumber(amount)} per resource.`);this.landColonyPanel();};
  }

  manifestOverview(profile){
    const used=this.expansion.capacityUsed(this.state),cargo=this.expansion.cargoAmount(this.state),foodStore=this.expansion.foodAmount(this.state),cargoFood=this.expansion.cargoCategory(this.state,"food"),fuel=this.expansion.fuelAmount(this.state),transitFood=foodStore+cargoFood,fuelNeed=Math.max(0,Number(profile?.fuelRequired)||0),foodNeed=Math.max(0,Number(profile?.foodRequired)||0);
    return `<section class="exp-load-overview"><div class="exp-section-head"><h3>SHIP LOAD</h3><span>12,000 total • 8,000 general hold • 2,000 Food • 2,000 Fuel.</span></div>${this.loadBar("TOTAL PHYSICAL LOAD",used,PLAYER_SHIP_CAPACITY,`${formatNumber(Math.max(0,PLAYER_SHIP_CAPACITY-used))} physical capacity free`)}${this.loadBar("GENERAL HOLD",cargo,PLAYER_SHIP_CARGO_CAPACITY,`${formatNumber(Math.max(0,PLAYER_SHIP_CARGO_CAPACITY-cargo))} hold free`)}${this.loadBar("TRANSIT FOOD STORE",foodStore,PLAYER_SHIP_FOOD_CAPACITY,`${formatNumber(cargoFood)} additional Food in general hold`)}${this.loadBar("FUEL TANK",fuel,PLAYER_SHIP_FUEL_CAPACITY,`${formatNumber(Math.max(0,PLAYER_SHIP_FUEL_CAPACITY-fuel))} tank capacity free`)}${profile?this.loadBar("ROUTE FUEL",Math.min(fuel,fuelNeed),fuelNeed,fuel>=fuelNeed?"Journey fuel covered":"More Fuel required",fuel>=fuelNeed?"ready":"blocked"):""}${profile?this.loadBar("ROUTE FOOD",Math.min(transitFood,foodNeed),foodNeed,transitFood>=foodNeed?"Journey Food covered — dedicated store is consumed first":"More Food required",transitFood>=foodNeed?"ready":"blocked"):""}</section>`;
  }

  foodEntries(){
    const ship=this.expansion.ship(this.state),inventory=this.state.inventory||{},keys=new Set([...Object.keys(inventory).filter(key=>inventory[key]?.type==="food"),...Object.keys(ship.foodLots||{})]);
    return [...keys].map(key=>({key,colony:inventory[key],store:ship.foodLots?.[key]})).filter(row=>(Number(row.colony?.amount)||0)>0||(Number(row.store?.amount)||0)>0).sort((a,b)=>String(a.colony?.name||a.store?.name).localeCompare(String(b.colony?.name||b.store?.name)));
  }

  createLoadRow({key,name,stored,loaded,loadedLabel,kind}){
    const template=this.modal.querySelector("[data-ship-load-row-template]"),row=template.content.firstElementChild.cloneNode(true),loadKey=kind==="fuel"?"loadFuel":kind==="food"?"loadFood":"loadCargo",unloadKey=kind==="fuel"?"unloadFuel":kind==="food"?"unloadFood":"unloadCargo";
    row.querySelector("[data-ship-load-name]").textContent=name;row.querySelector("[data-ship-load-detail]").textContent=`${formatNumber(stored)} colony • ${formatNumber(loaded)} ${loadedLabel}`;row.querySelector("[data-ship-load-progress]").style.width=`${loaded+stored>0?Math.min(100,loaded/(loaded+stored)*100):0}%`;
    row.querySelectorAll("[data-ship-load-quantity]").forEach(button=>{button.dataset[loadKey]=key;button.disabled=stored<=0;});
    row.querySelectorAll("[data-ship-unload-quantity]").forEach(button=>{button.dataset[unloadKey]=key;button.disabled=loaded<=0;});
    return row;
  }

  renderFoodRows(){const rows=this.foodEntries(),host=this.modal.querySelector("[data-ship-food-rows]");this.renderLoadRows(host,rows,row=>{const entry=row.colony||row.store,stored=Math.max(0,Number(row.colony?.amount)||0),loaded=Math.max(0,Number(row.store?.amount)||0);return this.createLoadRow({key:row.key,name:entry.name,stored,loaded,loadedLabel:"transit store",kind:"food"});},"No Food stock at this colony or in the transit Food store.");}
  renderFuelRows(){const rows=this.fuelEntries(),host=this.modal.querySelector("[data-ship-fuel-rows]");this.renderLoadRows(host,rows,row=>{const entry=row.colony||row.tank,stored=Math.max(0,Number(row.colony?.amount)||0),loaded=Math.max(0,Number(row.tank?.amount)||0);return this.createLoadRow({key:row.key,name:entry.name,stored,loaded,loadedLabel:"fuel tank",kind:"fuel"});},"No Fuel stock at this colony or in the ship tank.");}
  renderCargoRows(){const rows=this.visibleCargoEntries(),host=this.modal.querySelector("[data-ship-cargo-rows]");this.renderLoadRows(host,rows,row=>{const entry=row.colony||row.aboard,stored=Math.max(0,Number(row.colony?.amount)||0),loaded=Math.max(0,Number(row.aboard?.amount)||0);return this.createLoadRow({key:row.key,name:entry.name,stored,loaded,loadedLabel:"general hold",kind:"cargo"});},`No ${this.expeditionCategory.toUpperCase()} stock at this colony or in the general hold.`);}
  renderManifestRows(hasCargo){this.renderFuelRows();this.renderFoodRows();if(hasCargo)this.renderCargoRows();}
  manifestQuantity(button,available){return["max","all"].includes(button.dataset.qty)?Math.max(0,Number(available)||0):Math.max(0,Number(button.dataset.qty)||0);}

  handleManifestAction(button){
    const ship=this.expansion.ship(this.state);
    if("loadCargo" in button.dataset){const entry=this.state.inventory?.[button.dataset.loadCargo];this.afterManifestChange(this.expansion.loadCargo(this.state,button.dataset.loadCargo,this.manifestQuantity(button,entry?.amount)));return true;}
    if("unloadCargo" in button.dataset){const entry=ship.cargo?.[button.dataset.unloadCargo];this.afterManifestChange(this.expansion.unloadCargo(this.state,button.dataset.unloadCargo,this.manifestQuantity(button,entry?.amount)));return true;}
    if("loadFood" in button.dataset){const entry=this.state.inventory?.[button.dataset.loadFood];this.afterManifestChange(this.expansion.loadFood(this.state,button.dataset.loadFood,this.manifestQuantity(button,entry?.amount)));return true;}
    if("unloadFood" in button.dataset){const entry=ship.foodLots?.[button.dataset.unloadFood];this.afterManifestChange(this.expansion.unloadFood(this.state,button.dataset.unloadFood,this.manifestQuantity(button,entry?.amount)));return true;}
    if("loadFuel" in button.dataset){const entry=this.state.inventory?.[button.dataset.loadFuel];this.afterManifestChange(this.expansion.loadFuel(this.state,button.dataset.loadFuel,this.manifestQuantity(button,entry?.amount)));return true;}
    if("unloadFuel" in button.dataset){const entry=ship.fuelLots?.[button.dataset.unloadFuel];this.afterManifestChange(this.expansion.unloadFuel(this.state,button.dataset.unloadFuel,this.manifestQuantity(button,entry?.amount)));return true;}
    return false;
  }

  handlePassengerAction(button){
    if("unloadPaxStep" in button.dataset){const amount=button.dataset.unloadPaxStep==="all"?this.expansion.ship(this.state).passengers:Number(button.dataset.unloadPaxStep);this.afterManifestChange(this.expansion.unloadPassengers(this.state,amount));return true;}
    return super.handlePassengerAction(button);
  }

  shipRouteDetails(profile,fuel){return super.shipRouteDetails(profile,fuel,this.expansion.transitFoodAmount(this.state));}

  renderAdaptiveBuilding(tile){
    super.renderAdaptiveBuilding(tile);const check=this.colony.canStopProduction(tile);if(!check.ok||!this.tilePanel)return;
    const existing=this.tilePanel.querySelector("[data-production-toggle]");existing?.remove();const stopped=tile.development?.kind==="extract"?tile.productionStopped===true:tile.development?.productionStopped===true,button=document.createElement("button");button.className=`ship-production-toggle ${stopped?"stopped":""}`;button.dataset.productionToggle="1";button.textContent=stopped?"START PRODUCTION":"STOP PRODUCTION";
    const demolish=this.tilePanel.querySelector("[data-adaptive-demolish]");if(demolish)demolish.before(button);else this.tilePanel.append(button);
    button.onclick=()=>{const result=this.colony.setProductionStopped(this.state,tile,!stopped);if(!result.ok){this.toast(result.reason);return;}this.onRecalculate?.();this.repo.save(this.state);this.logEvent?.("production-toggle",`${tile.name||tile.development?.kind||"Building"} production ${result.stopped?"stopped":"started"}.`,{x:tile.x,y:tile.y,stopped:result.stopped});this.toast(result.stopped?"Production stopped. Workers and operating load released.":"Production started.");this.render();this.renderAdaptiveBuilding(tile);};
  }

  playerShipPanel(){
    const ship=this.expansion.ship(this.state);if(ship.status==="lost"){this.starMap();return;}if(this.playerShipHere())return super.playerShipPanel();
    this._shipNavActive=false;const cargoAvailable=ship.status==="docked"&&this.expansion.isAtActiveColony(this.state),actions=[["TECHNOLOGY","Research and licences","tech"],["STAR MAP","Systems, probes and routes","star-map"],["COLONIES","All colony operations","colonies"],["CARGO BAY",cargoAvailable?"Load ship, fuel, Food and colonists":"Available while docked at a colony","cargo"],["COLONY SUMMARY","Current colony status","colony-summary"],["CORPORATION","Corporate overview","corporation"]];
    this.open("Player Colony Ship",`<div class="ship-action-shell">${this.shipStatusMarkup()}<div class="ship-action-grid">${actions.map(([title,sub,action])=>`<button class="ship-action-tile" data-player-ship-action="${action}" ${action==="cargo"&&!cargoAvailable?"disabled":""}><strong>${title}</strong><small>${sub}</small></button>`).join("")}</div></div>`);this.modal.classList.add("player-ship-menu-modal");
    this.modal.querySelectorAll("[data-player-ship-action]").forEach(button=>button.onclick=()=>{this._shipNavActive=true;const action=button.dataset.playerShipAction;if(action==="tech")this.tech();else if(action==="star-map")this.starMap();else if(action==="colonies")this.coloniesPanel();else if(action==="cargo")this.shipPrep();else if(action==="colony-summary")this.landColonyPanel();else if(action==="corporation")this.company();});
  }

  starHit(canvas,pos){
    const position=this.expansion.shipPosition(this.state);if(position){const rect=canvas.getBoundingClientRect(),x=pos.x-rect.left,y=pos.y-rect.top,p=this.starScreen(canvas,position);if(Math.hypot(p.x-x,p.y-y)<20)return{id:SHIP_HIT_ID};}
    return super.starHit(canvas,pos);
  }
  openSystem(systemId){if(systemId===SHIP_HIT_ID){this.playerShipPanel();return;}return super.openSystem(systemId);}

  drawStarMap(canvas,ctx){
    super.drawStarMap(canvas,ctx);const ship=this.expansion.ship(this.state);if(ship.status!=="travelling")return;const position=this.expansion.shipPosition(this.state);if(!position)return;const p=this.starScreen(canvas,position);ctx.save();ctx.fillStyle="#fff";ctx.strokeStyle="rgba(89,212,255,.9)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+9,p.y);ctx.lineTo(p.x-6,p.y-5);ctx.lineTo(p.x-6,p.y+5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }

  async starSystemDetailMarkup(system){
    let markup=await super.starSystemDetailMarkup(system);if(!system)return markup;const ship=this.expansion.ship(this.state),mayRetarget=["travelling","arrived"].includes(ship.status)&&(system.home||system.surveyed)&&!(ship.status==="travelling"&&ship.targetSystemId===system.id)&&!(ship.status==="arrived"&&ship.systemId===system.id);
    if(mayRetarget&&!markup.includes("data-set-destination")){const button=`<button class="action exp-destination" data-set-destination>SET ${esc(system.name.toUpperCase())} AS DESTINATION</button>`;markup=markup.replace(/<\/section>\s*$/,`${button}</section>`);}return markup;
  }

  homeworld(){
    super.homeworld();if(this.expansion.ship(this.state).status!=="home"||this.homeCategory!=="food")return;this.modal.querySelectorAll("[data-home-buy]").forEach(cargoButton=>{const key=cargoButton.dataset.homeBuy,row=cargoButton.closest(".exp-load-row")?.querySelector("div:last-child");if(!row||row.querySelector(`[data-home-food="${key}"]`))return;for(const qty of[100,1000]){const button=document.createElement("button");button.dataset.homeFood=key;button.dataset.qty=String(qty);button.textContent=`FOOD ${qty===100?"+100":"+1K"}`;button.onclick=()=>{const[type,id]=key.split(":"),result=this.expansion.buyAtHome(this.state,type,id,qty,{toFoodStore:true});if(!result.ok){this.toast(result.reason);return;}this.repo.save(this.state);this.toast(`Loaded ${formatNumber(result.qty)} ${result.entry.name} into transit Food.`);this.homeworld();};row.prepend(button);}});
  }

  deadline(kind=null){
    const resolved=kind||this.contracts.deadlineState(this.state)||this.state.contract?.pendingDecision;if(resolved!=="corporation-failed")return super.deadline(kind);
    this.state.speed=0;this.syncSpeed();const result=this.contracts.failCorporationForContract(this.state);this.repo.save(this.state);this.renderContractFailureReport(result.reason,result.score);
  }

  gameOver(){if(this.state.contract?.failedByContract)return this.renderContractFailureReport(this.state.contract.failureReason,this.contracts.score(this.state));return super.gameOver();}

  renderContractFailureReport(reason,score=this.contracts.score(this.state)){
    const s=this.state,m=s.metrics||{},profit=score?.profit??((s.contract.localRevenue||0)-(s.contract.localCosts||0));this.state.speed=0;this.syncSpeed();
    const body=`<div class="colony-failed-report"><div class="colony-failed-visual"><svg viewBox="0 0 360 150" role="img" aria-label="Failed colony"><defs><linearGradient id="failSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0d12"/><stop offset="1" stop-color="#561510"/></linearGradient></defs><rect width="360" height="150" fill="url(#failSky)"/><circle cx="300" cy="28" r="18" fill="#d04435" opacity=".7"/><path d="M0 118 L48 86 L92 110 L145 72 L206 116 L254 88 L360 120 L360 150 L0 150Z" fill="#17191b"/><path d="M130 118 L164 82 L202 118Z" fill="#050607" stroke="#8a312b" stroke-width="3"/><path d="M165 83 L190 70 L209 113" fill="none" stroke="#b03b31" stroke-width="3"/><path d="M175 83 L187 101 L173 101 L190 126" fill="none" stroke="#ffd94a" stroke-width="4"/></svg></div><h2 class="failure-title">COLONY FAILED</h2><article class="card critical-resource-warning"><h3>${esc(s.contract.colonyName||"COLONY")} — CORPORATION TERMINATED</h3><p>${esc(reason||"The contract failed and the corporation can no longer continue.")}</p><div class="effect warn">The sole operating colony missed its contract obligations and the corporation could not fund an extension.</div></article><div class="colony-failed-stats"><div class="metric"><small>DATE</small><strong>Y${formatNumber(s.year)} D${formatNumber(s.day)}</strong></div><div class="metric"><small>POPULATION</small><strong>${formatNumber(s.pop)}</strong></div><div class="metric"><small>CASH</small><strong>${formatMoney(s.company.cash)}</strong></div><div class="metric"><small>CONTRACT PROFIT</small><strong>${formatMoney(profit)}</strong></div><div class="metric"><small>FOOD STOCK</small><strong>${formatNumber(this.inventory.amount(s,"food"))}</strong></div><div class="metric"><small>FUEL STOCK</small><strong>${formatNumber(this.inventory.amount(s,"fuel"))}</strong></div><div class="metric"><small>ORE STOCK</small><strong>${formatNumber(this.inventory.amount(s,"ore"))}</strong></div><div class="metric"><small>INDUSTRY</small><strong>${formatNumber(m.industry||0)}</strong></div><div class="metric"><small>FOOD GOAL</small><strong>${Math.round((score?.ratios?.food||0)*100)}%</strong></div><div class="metric"><small>INDUSTRY GOAL</small><strong>${Math.round((score?.ratios?.industry||0)*100)}%</strong></div><div class="metric"><small>POPULATION GOAL</small><strong>${Math.round((score?.ratios?.pop||0)*100)}%</strong></div><div class="metric"><small>STARVATION</small><strong>${formatNumber(s.colony?.foodStarvationDays||0)}d</strong></div></div><button class="bad action" data-failure-reset>START NEW CORPORATION</button></div>`;
    this.open("Colony Failed",body);this.modal.classList.add("full-screen-panel","colony-failed-modal");const close=this.modal.querySelector("[data-close]");if(close)close.style.display="none";this.modal.querySelector("[data-failure-reset]").onclick=()=>this.onHardReset?.();return true;
  }
}
