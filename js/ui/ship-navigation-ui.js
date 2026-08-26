import { UIController as PlayerShipUIController } from "./player-ship-ui.js";
import { HOME_SYSTEM_ID, PROBE_UNLOCK_INDUSTRY_LEVEL, PROBE_COST } from "../domain/expansion-service.js";
import { formatNumber } from "../core/utils.js";

const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));

/** Full-screen deterministic player-ship navigation, system selection and demolition confirmation. */
export class UIController extends PlayerShipUIController{
  constructor(opts){super(opts);this._shipNavActive=false;this.selectedStarSystemId=null;}

  dispose(){super.dispose?.();}

  open(title,body){
    this.modal.className="panel modal hidden";
    super.open(title,body);
    const close=this.modal.querySelector("[data-close]");
    if(close){close.classList.add("danger-close");close.onclick=()=>{this._shipNavActive=false;this.modal.classList.add("hidden");};}
    if(this._shipNavActive&&title!=="Player Colony Ship"){
      const bar=this.modal.querySelector(".panel-title");if(bar&&close){const back=document.createElement("button");back.type="button";back.className="ship-panel-back";back.dataset.shipBack="1";back.textContent="‹ BACK";back.onclick=()=>{this._shipNavActive=false;this.playerShipPanel();};bar.insertBefore(back,close);}
    }
  }

  playerShipPanel(){
    this._shipNavActive=false;
    if(!this.playerShipHere()){this.toast("The player ship is not landed at this colony.");return;}
    const actions=[
      ["TECHNOLOGY","Research and licences","tech"],
      ["STAR MAP","Systems, probes and routes","star-map"],
      ["COLONIES","All colony operations","colonies"],
      ["CARGO BAY","Load ship, fuel and colonists","cargo"],
      ["COLONY SUMMARY","Current colony status","colony-summary"],
      ["CORPORATION","Corporate overview","corporation"]
    ];
    this.open("Player Colony Ship",`<div class="ship-action-shell">${this.shipStatusMarkup?.()||""}<div class="ship-action-grid">${actions.map(([title,sub,action])=>`<button class="ship-action-tile" data-player-ship-action="${action}"><strong>${title}</strong><small>${sub}</small></button>`).join("")}</div></div>`);
    this.modal.classList.add("player-ship-menu-modal");
    this.modal.querySelectorAll("[data-player-ship-action]").forEach(button=>button.onclick=()=>{
      this._shipNavActive=true;const action=button.dataset.playerShipAction;
      if(action==="tech")this.tech();
      else if(action==="star-map")this.starMap();
      else if(action==="colonies")this.coloniesPanel();
      else if(action==="cargo")this.shipPrep();
      else if(action==="colony-summary")this.landColonyPanel();
      else if(action==="corporation")this.company();
    });
  }

  shipPrep(){
    super.shipPrep();
    if(this.modal?.querySelector(".exp-shell.prep"))this.modal.classList.add("ship-prep-modal","full-screen-panel");
  }

  selectedSystem(){
    const ex=this.expansion.ensure(this.state),ship=ex.ship;
    let system=this.selectedStarSystemId?this.expansion.system(ex,this.selectedStarSystemId):null;
    if(!system){const id=ship.targetSystemId||ship.systemId||ship.sourceSystemId||HOME_SYSTEM_ID;system=this.expansion.system(ex,id)||ex.systems.find(s=>!s.home)||ex.systems[0];}
    if(system)this.selectedStarSystemId=system.id;return system;
  }

  systemStateLabel(system){
    if(system.home)return"CORPORATE HOME";
    if(system.surveyed)return this.expansion.coloniesInSystem(this.state,system.id).length?"COLONISED":"SURVEYED";
    return this.expansion.probeFor(this.state,system.id)?"PROBE EN ROUTE":"UNKNOWN";
  }

  planetTable(system,arrived){
    const owned=this.expansion.coloniesInSystem(this.state,system.id),ship=this.expansion.ship(this.state);
    const rows=system.planets.map(planet=>{
      const colonies=owned.filter(c=>c.planetId===planet.id),living=colonies.filter(c=>c.status!=="dead"),occupied=colonies.length>0,meets=this.technology.meetsRequirements(this.state,planet.requiredTech),canFound=arrived&&!occupied&&ship.passengers>0&&meets;
      let actions="—";
      if(arrived&&living.length)actions=living.map(c=>`<button data-dock-colony="${esc(c.id)}">DOCK ${esc(c.name)}</button>`).join("");
      else if(arrived)actions=`<button data-found-planet="${esc(planet.id)}" ${canFound?"":"disabled"}>${occupied?"COLONY EXISTS":ship.passengers<=0?"NO COLONISTS":!meets?"TECH LOCKED":"FOUND COLONY"}</button>`;
      const colonyNames=colonies.length?colonies.map(c=>esc(c.name)).join("<br>"):"—";
      return `<tr><td><strong>${esc(planet.name)}</strong></td><td>${esc(planet.environment)}</td><td>${esc(planet.indicators.food)}</td><td>${esc(planet.indicators.build)}</td><td>${esc(planet.indicators.fuel)}</td><td>${esc(planet.indicators.ore)}</td><td>${esc(planet.indicators.habitability)}</td><td>${formatNumber(planet.surveyConfidence)}%</td><td>P${planet.requiredTech.power} / F${planet.requiredTech.food} / M${planet.requiredTech.mining}</td><td>${colonyNames}</td><td class="exp-planet-actions">${actions}</td></tr>`;
    }).join("");
    return `<div class="exp-planet-table-wrap"><table class="exp-planet-table"><thead><tr><th>PLANET</th><th>ENVIRONMENT</th><th>FOOD</th><th>BUILD</th><th>FUEL</th><th>ORE</th><th>HABITABILITY</th><th>CONF.</th><th>TECH</th><th>COLONY</th><th>ACTION</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  starSystemDetailMarkup(system){
    if(!system)return`<div class="exp-empty">Tap a star system to inspect it.</div>`;
    const ship=this.expansion.ship(this.state),probe=this.expansion.probeFor(this.state,system.id),arrived=ship.status==="arrived"&&ship.systemId===system.id,distance=this.expansion.distanceFromHome(this.state,system.id),stateLabel=this.systemStateLabel(system);
    let content=`<div class="star-system-detail-head"><div><small>SELECTED SYSTEM</small><h3>${esc(system.name)}</h3></div><strong>${esc(stateLabel)}</strong></div><div class="exp-system-summary"><div><small>STAR</small><strong>${esc(system.starType)}</strong></div><div><small>PLANETS</small><strong>${formatNumber(system.planetCount)}</strong></div><div><small>HOME DISTANCE</small><strong>${Number(distance).toFixed(1)} ly</strong></div><div><small>STATUS</small><strong>${esc(stateLabel)}</strong></div></div>`;
    if(!system.surveyed&&!system.home){
      const check=this.expansion.canLaunchProbe(this.state,system.id),eta=probe?Math.max(0,probe.arrivalAbsoluteDay-this.expansion.absoluteDay(this.state)):null;
      content+=probe?`<div class="exp-message compact"><strong>SURVEY PROBE EN ROUTE</strong><span>Data return in ${formatNumber(eta)} days.</span></div>`:`<div class="exp-message compact"><strong>PLANET DATA NOT YET AVAILABLE</strong><span>Survey this system to reveal broad planetary Food, Build, Fuel, Ore and habitability indicators.</span><small>Industry L${PROBE_UNLOCK_INDUSTRY_LEVEL} • ${PROBE_COST.build} Build • ${PROBE_COST.ore} Ore • ${PROBE_COST.fuel} Fuel</small><button data-launch-probe ${check.ok?"":"disabled"}>${check.ok?"BUILD + LAUNCH SURVEY PROBE":esc(check.reason)}</button></div>`;
    }else if(system.home){
      content+=`<div class="exp-message compact"><strong>KOPLIN CORPORATE LOGISTICS HUB</strong><span>Return exports here, buy corporate supplies and prepare frontier resupply runs.</span></div>`;
    }else{
      content+=`<div class="star-system-planets"><div class="exp-section-head"><h3>PLANETS</h3><span>Broad survey data only — exact deposits require local surveying.</span></div>${this.planetTable(system,arrived)}</div>`;
    }
    const canTarget=["docked","home"].includes(ship.status)&&ship.systemId!==system.id&&(system.home||system.surveyed);
    if(canTarget)content+=`<button class="action exp-destination" data-set-destination>SET ${esc(system.name.toUpperCase())} AS DESTINATION</button>`;
    if(ship.status==="home"&&system.home)content+=`<button class="action" data-open-home>OPEN CORPORATE LOGISTICS</button>`;
    if(arrived)content+=`<div class="effect warn">PLAYER SHIP ARRIVED • Choose a planet, dock at an existing colony, or retain enough supplies for another journey.</div>`;
    return `<section class="star-system-detail">${content}</section>`;
  }

  starMap(){
    const ex=this.expansion.ensure(this.state),ship=ex.ship;if(ship.status==="lost"){super.starMap();return;}
    const selected=this.selectedSystem(),corporate=this.state.trade?.active?`<button class="exp-corporate-trade" data-corporate-trade>CORPORATE TRADE SHIP DOCKED • OPEN TRADE</button>`:"",cargoAvailable=ship.status==="docked"&&this.expansion.isAtActiveColony(this.state);
    this.open("Corporation Star Map",`<div class="star-map-screen">${this.shipStatusMarkup()}${corporate}<div class="star-system-detail-host" id="starSystemDetail">${this.starSystemDetailMarkup(selected)}</div><div class="exp-map-wrap"><canvas id="starMapCanvas" aria-label="Corporation star map"></canvas><div class="exp-map-help">Drag to pan • pinch / wheel to zoom • tap a star to inspect</div></div><div class="exp-map-footer"><span>○ Corporate service radius ${ex.serviceRadiusLy.toFixed(1)} ly</span><button data-ship-prep ${cargoAvailable?"":"disabled"}>CARGO BAY</button></div></div>`);
    this.modal.classList.add("star-map-modal","full-screen-panel");this.bindStarMapDetailActions(selected);
    this.modal.querySelector("[data-corporate-trade]")?.addEventListener("click",()=>this.corporateTradeUI?.open());
    this.modal.querySelector("[data-ship-prep]")?.addEventListener("click",()=>this.shipPrep());
    requestAnimationFrame(()=>this.bindStarMap());
  }

  openSystem(systemId){this.selectedStarSystemId=systemId;this.starMap();}

  bindStarMapDetailActions(system){
    if(!system)return;
    const launch=this.modal.querySelector("[data-launch-probe]");if(launch&&!launch.disabled)launch.onclick=()=>{const r=this.expansion.launchProbe(this.state,system.id);if(!r.ok){this.toast(r.reason);return;}this.onRecalculate?.();this.onCapturePortfolio?.();this.repo.save(this.state);this.toast(`Survey probe launched • ${formatNumber(r.days)} days to data return.`);this.starMap();};
    this.modal.querySelector("[data-set-destination]")?.addEventListener("click",()=>{const r=this.expansion.setTarget(this.state,system.id);if(!r.ok){this.toast(r.reason);return;}this.repo.save(this.state);this.toast(`${system.name} selected as ship destination.`);this.starMap();});
    this.modal.querySelectorAll("[data-dock-colony]").forEach(button=>button.onclick=()=>{const id=button.dataset.dockColony;if(this.onSwitchColony?.(id)){this.expansion.dockAtColony(this.state,id);this.repo.save(this.state);this.toast(`Player ship docked at ${this.state.contract.colonyName}.`);this.playerShipPanel();}});
    this.modal.querySelectorAll("[data-found-planet]").forEach(button=>button.onclick=()=>this.foundPlanet(system.id,button.dataset.foundPlanet));
    this.modal.querySelector("[data-open-home]")?.addEventListener("click",()=>this.homeworld());
  }

  drawStarMap(canvas,ctx){
    super.drawStarMap(canvas,ctx);const system=this.selectedStarSystemId?this.expansion.system(this.state.company.expansion,this.selectedStarSystemId):null;if(!system)return;const p=this.starScreen(canvas,system);ctx.save();ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#59d4ff";ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  renderAdaptiveBuilding(tile){
    super.renderAdaptiveBuilding(tile);const button=this.tilePanel?.querySelector("[data-adaptive-demolish]");if(button)button.onclick=()=>this.demolitionPanel(tile);
  }

  demolitionPanel(tile){
    const dev=tile?.development;if(!dev)return;const extract=dev.kind==="extract",label=extract?this.buildingLabel(dev):this.development.label(dev.kind),level=Math.max(1,Number(dev.level??tile.level)||1),investedBuild=Math.max(0,Math.floor(Number(dev.investedBuild)||0)),investedOre=Math.max(0,Math.floor(Number(dev.investedOre)||0)),recoverBuild=Math.floor(investedBuild*.25),recoverOre=Math.floor(investedOre*.25);
    let impact="The tile will be cleared for redevelopment.";
    if(extract)impact=tile.depleted||tile.renewableWiped?"The exhausted extraction site will be removed. The tile can be redeveloped.":"The extraction facility will be removed; the underlying resource remains available for future development.";
    else if(tile.resourceCovered&&tile.resourceId)impact=`The covered ${tile.name} resource will become accessible again.`;
    else if(tile.destroyedResource?.type==="food")impact="The natural Food resource previously destroyed by construction will not return.";
    this.open("Confirm Demolition",`<div class="demolition-confirm"><div class="demolition-title"><small>YOU ARE ABOUT TO DEMOLISH</small><strong>${esc(label)} L${level}</strong><span>Map tile ${tile.x}, ${tile.y}</span></div><div class="demolition-breakdown"><div><small>INVESTED BUILD</small><strong>${formatNumber(investedBuild)}</strong></div><div class="recovery"><small>BUILD RETURNED</small><strong>+${formatNumber(recoverBuild)}</strong></div><div><small>INVESTED ORE</small><strong>${formatNumber(investedOre)}</strong></div><div class="recovery"><small>ORE RETURNED</small><strong>+${formatNumber(recoverOre)}</strong></div></div><div class="demolition-impact"><small>AFTER DEMOLITION</small><strong>${esc(impact)}</strong><span>Recovery is 25% of the materials invested in this building.</span></div><div class="demolition-actions"><button class="demolition-yes" data-demolish-yes>YES • DEMOLISH</button><button class="demolition-no" data-demolish-no>NO • KEEP BUILDING</button></div></div>`);
    this.modal.classList.add("demolition-confirm-modal");
    this.modal.querySelector("[data-demolish-no]").onclick=()=>this.modal.classList.add("hidden");
    this.modal.querySelector("[data-demolish-yes]").onclick=()=>this.onDemolishDevelopment?.(tile);
  }
}
