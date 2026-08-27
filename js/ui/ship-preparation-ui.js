import { UIController as ShipNavigationUIController } from "./ship-navigation-ui.js";
import { PLAYER_SHIP_CAPACITY, PLAYER_SHIP_PASSENGERS } from "../domain/expansion-service.js";
import { formatNumber } from "../core/utils.js";
import { renderViewTemplate } from "../core/view-template.js";

const CATEGORIES=["food","build","fuel","ore"];
const BAND_ORDER={"Very Low":1,"Low":2,"Moderate":3,"High":4,"Very High":5,"Extreme":1,"Hostile":2,"Marginal":3,"Manageable":4,"Favourable":5};
const PLANET_COLUMNS=[["name","PLANET"],["environment","ENVIRONMENT"],["food","FOOD"],["build","BUILD"],["fuel","FUEL"],["ore","ORE"],["habitability","HABITABILITY"],["confidence","CONF."],["tech","TECH"],["colony","COLONY"]];
const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));
const pct=(value,max)=>max>0?Math.max(0,Math.min(100,(Number(value)||0)/max*100)):0;

/** Sortable planetary survey data and dense, load-focused player-ship preparation. */
export class UIController extends ShipNavigationUIController{
  constructor(opts){super(opts);this.planetSort={key:"name",dir:1};this.shipPrepRevision=0;this.prepClickHandler=null;this.planetClickHandler=null;}

  open(title,body){this.releasePrepActions();this.releasePlanetActions();super.open(title,body);}

  dispose(){this.releasePrepActions();this.releasePlanetActions();super.dispose?.();}

  releasePrepActions(){
    if(!this.prepClickHandler)return;
    this.modal?.removeEventListener("click",this.prepClickHandler);
    this.prepClickHandler=null;
  }

  releasePlanetActions(){
    if(!this.planetClickHandler)return;
    this.modal?.removeEventListener("click",this.planetClickHandler);
    this.planetClickHandler=null;
  }

  planetSortValue(planet,key,system){
    if(key==="name")return planet.name||"";
    if(key==="environment")return planet.environment||"";
    if(["food","build","fuel","ore","habitability"].includes(key))return BAND_ORDER[planet.indicators?.[key]]||0;
    if(key==="confidence")return Number(planet.surveyConfidence)||0;
    if(key==="tech"){const t=planet.requiredTech||{};return Math.max(Number(t.power)||0,Number(t.food)||0,Number(t.mining)||0)*100+(Number(t.power)||0)+(Number(t.food)||0)+(Number(t.mining)||0);}
    if(key==="colony")return this.expansion.coloniesInSystem(this.state,system.id).filter(c=>c.planetId===planet.id).map(c=>c.name).join(" ");
    return"";
  }

  sortedPlanets(system){
    const sort=this.planetSort||{key:"name",dir:1},dir=sort.dir<0?-1:1;
    return [...(system.planets||[])].sort((a,b)=>{const av=this.planetSortValue(a,sort.key,system),bv=this.planetSortValue(b,sort.key,system);if(typeof av==="number"&&typeof bv==="number")return(av-bv)*dir;return String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:"base"})*dir;});
  }

  planetSortIndicator(key){
    if(this.planetSort?.key!==key)return"↕";
    return this.planetSort.dir<0?"▼":"▲";
  }

  planetTemplate(selector){
    const template=this.modal.querySelector(selector);
    if(!template)throw new Error(`Missing planet table template ${selector}`);
    return template.content.firstElementChild.cloneNode(true);
  }

  planetSortHeader([key,label]){
    const cell=this.planetTemplate("[data-planet-sort-template]"),button=cell.querySelector("[data-planet-sort]");
    button.dataset.planetSort=key;
    button.classList.toggle("active",this.planetSort?.key===key);
    button.prepend(document.createTextNode(label));
    button.querySelector("[data-planet-sort-arrow]").textContent=this.planetSortIndicator(key);
    return cell;
  }

  renderPlanetHeaders(){
    const host=this.modal.querySelector("[data-planet-table-head]"),fragment=document.createDocumentFragment();
    for(const column of PLANET_COLUMNS)fragment.append(this.planetSortHeader(column));
    fragment.append(this.planetTemplate("[data-planet-action-header-template]"));
    host.replaceChildren(fragment);
  }

  planetFoundState(occupied,passengers,meets){
    if(occupied)return{enabled:false,label:"COLONY EXISTS"};
    if(passengers<=0)return{enabled:false,label:"NO COLONISTS"};
    if(!meets)return{enabled:false,label:"TECH LOCKED"};
    return{enabled:true,label:"FOUND COLONY"};
  }

  setPlanetCell(row,selector,value){
    const cell=row.querySelector(selector);
    if(cell)cell.textContent=value;
  }

  renderPlanetColonies(host,colonies){
    if(!colonies.length){host.textContent="—";return;}
    const fragment=document.createDocumentFragment();
    colonies.forEach((colony,index)=>{const name=this.planetTemplate("[data-planet-colony-template]");name.querySelector("[data-planet-colony-name]").textContent=colony.name;fragment.append(name);if(index<colonies.length-1)fragment.append(document.createElement("br"));});
    host.replaceChildren(fragment);
  }

  createDockAction(colony){
    const button=this.planetTemplate("[data-planet-dock-template]");
    button.dataset.dockColony=colony.id;
    button.textContent=`DOCK ${colony.name}`;
    return button;
  }

  createFoundAction(planet,occupied,passengers,meets){
    const button=this.planetTemplate("[data-planet-found-template]"),state=this.planetFoundState(occupied,passengers,meets);
    button.dataset.foundPlanet=planet.id;
    button.disabled=!state.enabled;
    button.textContent=state.label;
    return button;
  }

  renderPlanetActions(host,{arrived,living,planet,occupied,passengers,meets}){
    const fragment=document.createDocumentFragment();
    if(!arrived)fragment.append(document.createTextNode("—"));
    else if(living.length)for(const colony of living)fragment.append(this.createDockAction(colony));
    else fragment.append(this.createFoundAction(planet,occupied,passengers,meets));
    host.replaceChildren(fragment);
  }

  createPlanetRow(planet,system,arrived,owned,ship){
    const row=this.planetTemplate("[data-planet-row-template]"),colonies=owned.filter(c=>c.planetId===planet.id),living=colonies.filter(c=>c.status!=="dead"),meets=this.technology.meetsRequirements(this.state,planet.requiredTech),i=planet.indicators||{},t=planet.requiredTech||{};
    this.setPlanetCell(row,"[data-planet-name]",planet.name);
    this.setPlanetCell(row,"[data-planet-environment]",planet.environment);
    for(const key of["food","build","fuel","ore","habitability"])this.setPlanetCell(row,`[data-planet-${key}]`,i[key]||"");
    this.setPlanetCell(row,"[data-planet-confidence]",`${formatNumber(planet.surveyConfidence)}%`);
    this.setPlanetCell(row,"[data-planet-tech]",`P${t.power||0} / F${t.food||0} / M${t.mining||0}`);
    this.renderPlanetColonies(row.querySelector("[data-planet-colonies]"),colonies);
    this.renderPlanetActions(row.querySelector("[data-planet-actions]"),{arrived,living,planet,occupied:colonies.length>0,passengers:ship.passengers,meets});
    return row;
  }

  renderPlanetRows(system,arrived){
    const host=this.modal.querySelector("[data-planet-table-body]"),owned=this.expansion.coloniesInSystem(this.state,system.id),ship=this.expansion.ship(this.state),fragment=document.createDocumentFragment();
    for(const planet of this.sortedPlanets(system))fragment.append(this.createPlanetRow(planet,system,arrived,owned,ship));
    host.replaceChildren(fragment);
  }

  renderPlanetTable(system){
    const host=this.modal?.querySelector(".exp-planet-table-wrap[data-planet-table]");
    if(!host||!system)return false;
    const ship=this.expansion.ship(this.state),arrived=ship.status==="arrived"&&ship.systemId===system.id;
    this.renderPlanetHeaders();this.renderPlanetRows(system,arrived);
    return true;
  }

  planetTable(){return renderViewTemplate("./views/planet-table.html");}

  changePlanetSort(key){
    if(this.planetSort?.key===key)this.planetSort.dir*=-1;
    else this.planetSort={key,dir:1};
    this.starMap();
  }

  bindPlanetActions(){
    this.releasePlanetActions();
    this.planetClickHandler=event=>{const button=event.target.closest?.("button[data-planet-sort]");if(!button||!this.modal.contains(button))return;this.changePlanetSort(button.dataset.planetSort);};
    this.modal.addEventListener("click",this.planetClickHandler);
  }

  bindStarMapDetailActions(system){
    const rendered=this.renderPlanetTable(system);
    super.bindStarMapDetailActions(system);
    if(rendered)this.bindPlanetActions();
  }

  availableCargoCategories(){
    const ship=this.expansion.ship(this.state),has=(container,type)=>Object.values(container||{}).some(entry=>entry?.type===type&&(Number(entry.amount)||0)>0);
    return CATEGORIES.filter(type=>has(this.state.inventory,type)||has(ship.cargo,type));
  }

  cargoEntries(){
    const ship=this.expansion.ship(this.state),keys=new Set([...Object.keys(this.state.inventory||{}),...Object.keys(ship.cargo||{})]);
    return [...keys].map(key=>({key,colony:this.state.inventory?.[key],aboard:ship.cargo?.[key]})).filter(row=>{const type=row.colony?.type||row.aboard?.type,colony=Math.max(0,Number(row.colony?.amount)||0),aboard=Math.max(0,Number(row.aboard?.amount)||0);return type===this.expeditionCategory&&(colony>0||aboard>0);}).sort((a,b)=>String(a.colony?.name||a.aboard?.name).localeCompare(String(b.colony?.name||b.aboard?.name)));
  }

  loadBar(label,value,max,detail="",cls=""){
    return `<div class="exp-load-meter ${cls}"><div class="exp-load-meter-head"><small>${label}</small><strong>${formatNumber(value)}${max>0?` / ${formatNumber(max)}`:""}</strong></div><div class="exp-load-meter-track"><i style="width:${pct(value,max)}%"></i></div>${detail?`<span>${detail}</span>`:""}</div>`;
  }

  manifestOverview(profile){
    const used=this.expansion.capacityUsed(this.state),shipFuel=this.expansion.fuelAmount(this.state),foodTotal=this.expansion.cargoCategory(this.state,"food"),transitFuelNeed=Math.max(0,Number(profile?.fuelRequired)||0),transitFoodNeed=Math.max(0,Number(profile?.foodRequired)||0),transitFuel=Math.min(shipFuel,transitFuelNeed),transitFood=Math.min(foodTotal,transitFoodNeed),cargoFood=Math.max(0,foodTotal-transitFood);
    return `<section class="exp-load-overview"><div class="exp-section-head"><h3>SHIP LOAD</h3><span>Transit reserves are shown separately from usable cargo.</span></div>${this.loadBar("TOTAL CAPACITY",used,PLAYER_SHIP_CAPACITY,`${formatNumber(Math.max(0,PLAYER_SHIP_CAPACITY-used))} free`)}${this.loadBar("SHIP FUEL TANK",shipFuel,PLAYER_SHIP_CAPACITY,"All fuel physically in the dedicated tank")}${profile?this.loadBar("TRANSIT FUEL",transitFuel,transitFuelNeed,transitFuel>=transitFuelNeed?"Journey fuel covered":"More tank fuel required",transitFuel>=transitFuelNeed?"ready":"blocked"):this.loadBar("TRANSIT FUEL",0,0,"Select a destination to calculate requirement")}${profile?this.loadBar("TRANSIT FOOD",transitFood,transitFoodNeed,transitFood>=transitFoodNeed?"Journey food covered":"More food cargo required",transitFood>=transitFoodNeed?"ready":"blocked"):this.loadBar("TRANSIT FOOD",0,0,"Select a destination to calculate requirement")}${this.loadBar("CARGO FOOD",cargoFood,PLAYER_SHIP_CAPACITY,"Food remaining after the transit reserve")}</section>`;
  }

  visibleCargoEntries(){
    const start=this.expeditionPage*4;
    return this.cargoEntries().slice(start,start+4);
  }

  fuelEntries(){
    const ship=this.expansion.ship(this.state),inventory=this.state.inventory||{};
    const keys=new Set([...Object.keys(inventory).filter(key=>inventory[key]?.type==="fuel"),...Object.keys(ship.fuelLots||{})]);
    return [...keys].map(key=>({key,colony:inventory[key],tank:ship.fuelLots?.[key]}))
      .filter(row=>(Number(row.colony?.amount)||0)>0||(Number(row.tank?.amount)||0)>0)
      .sort((a,b)=>String(a.colony?.name||a.tank?.name).localeCompare(String(b.colony?.name||b.tank?.name)));
  }

  createLoadRow({key,name,stored,loaded,loadedLabel,kind,allowMax}){
    const template=this.modal.querySelector("[data-ship-load-row-template]");
    const row=template.content.firstElementChild.cloneNode(true),loadKey=kind==="fuel"?"loadFuel":"loadCargo",unloadKey=kind==="fuel"?"unloadFuel":"unloadCargo";
    row.querySelector("[data-ship-load-name]").textContent=name;
    row.querySelector("[data-ship-load-detail]").textContent=`${formatNumber(stored)} colony • ${formatNumber(loaded)} ${loadedLabel}`;
    row.querySelector("[data-ship-load-progress]").style.width=`${pct(loaded,stored+loaded)}%`;
    row.querySelectorAll("[data-ship-load-quantity]").forEach(button=>{if(button.dataset.shipLoadQuantity==="max"&&!allowMax){button.remove();return;}button.dataset[loadKey]=key;});
    const unload=row.querySelector("[data-ship-unload]");unload.dataset[unloadKey]=key;unload.disabled=loaded<=0;
    return row;
  }

  createEmptyRow(message){
    const template=this.modal.querySelector("[data-ship-empty-template]");
    const row=template.content.firstElementChild.cloneNode(true);
    row.querySelector("[data-ship-empty-message]").textContent=message;
    return row;
  }

  renderLoadRows(host,rows,createRow,emptyMessage){
    if(!host)return;
    const fragment=document.createDocumentFragment();
    if(rows.length)for(const row of rows)fragment.append(createRow(row));
    else fragment.append(this.createEmptyRow(emptyMessage));
    host.replaceChildren(fragment);
  }

  renderCargoRows(){
    const rows=this.visibleCargoEntries(),host=this.modal.querySelector("[data-ship-cargo-rows]");
    this.renderLoadRows(host,rows,row=>{const entry=row.colony||row.aboard,stored=Math.max(0,Number(row.colony?.amount)||0),loaded=Math.max(0,Number(row.aboard?.amount)||0);return this.createLoadRow({key:row.key,name:entry.name,stored,loaded,loadedLabel:"aboard",kind:"cargo",allowMax:true});},`No ${this.expeditionCategory.toUpperCase()} stock at this colony or aboard.`);
  }

  renderFuelRows(){
    const rows=this.fuelEntries(),host=this.modal.querySelector("[data-ship-fuel-rows]");
    this.renderLoadRows(host,rows,row=>{const entry=row.colony||row.tank,stored=Math.max(0,Number(row.colony?.amount)||0),loaded=Math.max(0,Number(row.tank?.amount)||0);return this.createLoadRow({key:row.key,name:entry.name,stored,loaded,loadedLabel:"tank",kind:"fuel",allowMax:false});},"No Fuel stock at this colony or in the ship tank.");
  }

  renderManifestRows(hasCargo){
    this.renderFuelRows();
    if(hasCargo)this.renderCargoRows();
  }

  manifestQuantity(button,available){return button.dataset.qty==="max"?available:Number(button.dataset.qty);}

  handleManifestAction(button){
    if("loadCargo" in button.dataset){const entry=this.state.inventory?.[button.dataset.loadCargo];this.afterManifestChange(this.expansion.loadCargo(this.state,button.dataset.loadCargo,this.manifestQuantity(button,entry?.amount||0)));return true;}
    if("unloadCargo" in button.dataset){this.afterManifestChange(this.expansion.unloadCargo(this.state,button.dataset.unloadCargo));return true;}
    if("loadFuel" in button.dataset){const entry=this.state.inventory?.[button.dataset.loadFuel];this.afterManifestChange(this.expansion.loadFuel(this.state,button.dataset.loadFuel,this.manifestQuantity(button,entry?.amount||0)));return true;}
    if("unloadFuel" in button.dataset){this.afterManifestChange(this.expansion.unloadFuel(this.state,button.dataset.unloadFuel));return true;}
    return false;
  }

  handlePassengerAction(button){
    if("loadPax" in button.dataset){const amount=button.dataset.loadPax==="max"?Math.min(this.state.pop,this.expansion.passengerRemaining(this.state)):Number(button.dataset.loadPax);this.afterManifestChange(this.expansion.loadPassengers(this.state,amount));return true;}
    if(button.hasAttribute("data-unload-pax")){this.afterManifestChange(this.expansion.unloadPassengers(this.state));return true;}
    return false;
  }

  launchPreparedShip(){
    const result=this.expansion.launch(this.state);
    if(!result.ok){this.toast(result.reason);this.shipPrep();return;}
    this.onCapturePortfolio?.();this.repo.save(this.state);
    const ship=this.expansion.ship(this.state),profile=result.profile;
    this.gameLog?.event?.(this.state,"player-ship-launched",`Player colony ship launched for ${profile.target.name}.`,{targetSystemId:profile.target.id,distanceLy:profile.distanceLy,journeyDays:profile.days,passengers:ship.passengers});
    this.modal.classList.add("hidden");this.toast(`Ship launched • arrival in ${formatNumber(profile.days)} days.`);
  }

  handlePrepAction(button){
    if("expCategory" in button.dataset){this.expeditionCategory=button.dataset.expCategory;this.expeditionPage=0;this.shipPrep();return;}
    if("expPage" in button.dataset){this.expeditionPage=Math.max(0,this.expeditionPage+Number(button.dataset.expPage));this.shipPrep();return;}
    if(this.handleManifestAction(button)||this.handlePassengerAction(button))return;
    if(button.hasAttribute("data-back-map")){this.starMap();return;}
    if(button.hasAttribute("data-launch-player"))this.launchPreparedShip();
  }

  bindPrep(){
    this.releasePrepActions();
    this.prepClickHandler=event=>{const button=event.target.closest?.("button");if(!button||button.disabled||!this.modal.contains(button))return;this.handlePrepAction(button);};
    this.modal.addEventListener("click",this.prepClickHandler);
  }

  shipRouteDetails(profile,fuel,food){
    if(!profile)return Promise.resolve("");
    return renderViewTemplate("./views/player-ship-route.html",{DISTANCE:profile.distanceLy.toFixed(1),JOURNEY_DAYS:formatNumber(profile.days),FUEL_CLASS:fuel>=profile.fuelRequired?"good":"bad",FUEL_AMOUNT:formatNumber(fuel),FUEL_REQUIRED:formatNumber(profile.fuelRequired),FOOD_CLASS:food>=profile.foodRequired?"good":"bad",FOOD_AMOUNT:formatNumber(food),FOOD_REQUIRED:formatNumber(profile.foodRequired)});
  }

  passengerLoader(){
    const ship=this.expansion.ship(this.state);
    return renderViewTemplate("./views/player-ship-passengers.html",{COLONY_POPULATION:formatNumber(this.state.pop),PASSENGERS:formatNumber(ship.passengers),PASSENGER_CAPACITY:PLAYER_SHIP_PASSENGERS,UNLOAD_DISABLED:ship.passengers<=0?"disabled":""});
  }

  async shipPrep(){
    const revision=++this.shipPrepRevision,ship=this.expansion.ship(this.state);if(ship.status==="travelling"){this.starMap();return;}if(ship.status==="arrived"){this.openSystem(ship.systemId);return;}if(ship.status==="home"){this.homeworld();return;}
    if(!this.expansion.isAtActiveColony(this.state)){const entry=this.state.portfolio?.colonies?.find(e=>e.id===ship.colonyId);this.open("Prepare Player Ship",`<div class="exp-shell">${this.shipStatusMarkup()}<article class="exp-message"><strong>SHIP IS AT ANOTHER COLONY</strong><span>Switch to ${esc(entry?.data?.contract?.colonyName||"the ship colony")} to load or unload resources and people.</span><button data-switch-ship-colony>GO TO SHIP COLONY</button></article><button data-back-map>STAR MAP</button></div>`);this.modal.querySelector("[data-switch-ship-colony]").onclick=()=>{if(this.onSwitchColony?.(ship.colonyId))this.shipPrep();};this.modal.querySelector("[data-back-map]").onclick=()=>this.starMap();return;}
    const target=ship.targetSystemId?this.expansion.system(this.state.company.expansion,ship.targetSystemId):null,profile=target?this.expansion.travelProfile(this.state,target.id):null,canLaunch=this.expansion.canLaunch(this.state),fuel=this.expansion.fuelAmount(this.state),food=this.expansion.cargoCategory(this.state,"food"),categories=this.availableCargoCategories();
    if(categories.length&&!categories.includes(this.expeditionCategory)){this.expeditionCategory=categories[0];this.expeditionPage=0;}
    const pages=this.cargoPages(),page=Math.min(this.expeditionPage,pages-1);this.expeditionPage=page;
    const tabs=categories.length?`<div class="exp-tabs compact-tabs">${categories.map(c=>`<button data-exp-category="${c}" class="${this.expeditionCategory===c?"active":""}">${c.toUpperCase()}</button>`).join("")}</div>`:`<div class="exp-empty">No cargo resources are currently held by this colony or aboard the ship.</div>`;
    const cargoPager=categories.length?this.pager("exp",page,pages):"";
    let body;
    try{const[routeDetails,passengerLoader]=await Promise.all([this.shipRouteDetails(profile,fuel,food),this.passengerLoader()]);body=await renderViewTemplate("./views/player-ship-prep.html",{SHIP_STATUS:this.shipStatusMarkup(),DESTINATION:target?esc(target.name):"NOT SELECTED",ROUTE_DETAILS:routeDetails,MANIFEST_OVERVIEW:this.manifestOverview(profile),PASSENGER_LOADER:passengerLoader,CARGO_TABS:tabs,CARGO_PAGER:cargoPager,LAUNCH_DISABLED:canLaunch.ok?"":"disabled",LAUNCH_LABEL:canLaunch.ok?`LAUNCH • ${formatNumber(profile?.days||0)} DAYS`:esc(canLaunch.reason)});}catch(error){if(revision!==this.shipPrepRevision)return;this.diagnostics?.error?.("ship preparation template failed",error);this.toast("Unable to open player ship preparation.");return;}
    if(revision!==this.shipPrepRevision)return;
    this.open("Prepare Player Ship",body);
    this.modal.classList.add("ship-prep-modal","full-screen-panel","compact-ship-prep");this.renderManifestRows(categories.length>0);this.bindPrep();
  }
}
