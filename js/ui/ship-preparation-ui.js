import { UIController as ShipNavigationUIController } from "./ship-navigation-ui.js";
import { PLAYER_SHIP_CAPACITY } from "../domain/expansion-service.js";
import { formatNumber } from "../core/utils.js";
import { renderViewTemplate } from "../core/view-template.js";

const CATEGORIES=["food","build","fuel","ore"];
const BAND_ORDER={"Very Low":1,"Low":2,"Moderate":3,"High":4,"Very High":5,"Extreme":1,"Hostile":2,"Marginal":3,"Manageable":4,"Favourable":5};
const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));
const pct=(value,max)=>max>0?Math.max(0,Math.min(100,(Number(value)||0)/max*100)):0;

/** Sortable planetary survey data and dense, load-focused player-ship preparation. */
export class UIController extends ShipNavigationUIController{
  constructor(opts){super(opts);this.planetSort={key:"name",dir:1};this.shipPrepRevision=0;}

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

  planetSortHeader(key,label){const active=this.planetSort?.key===key,arrow=active?(this.planetSort.dir<0?"▼":"▲"):"↕";return`<th><button class="exp-planet-sort${active?" active":""}" data-planet-sort="${key}">${label}<span>${arrow}</span></button></th>`;}

  planetTable(system,arrived){
    const owned=this.expansion.coloniesInSystem(this.state,system.id),ship=this.expansion.ship(this.state),rows=this.sortedPlanets(system).map(planet=>{
      const colonies=owned.filter(c=>c.planetId===planet.id),living=colonies.filter(c=>c.status!=="dead"),occupied=colonies.length>0,meets=this.technology.meetsRequirements(this.state,planet.requiredTech),canFound=arrived&&!occupied&&ship.passengers>0&&meets;
      let actions="—";
      if(arrived&&living.length)actions=living.map(c=>`<button data-dock-colony="${esc(c.id)}">DOCK ${esc(c.name)}</button>`).join("");
      else if(arrived)actions=`<button data-found-planet="${esc(planet.id)}" ${canFound?"":"disabled"}>${occupied?"COLONY EXISTS":ship.passengers<=0?"NO COLONISTS":!meets?"TECH LOCKED":"FOUND COLONY"}</button>`;
      const colonyNames=colonies.length?colonies.map(c=>esc(c.name)).join("<br>"):"—",i=planet.indicators||{},t=planet.requiredTech||{};
      return `<tr><td><strong>${esc(planet.name)}</strong></td><td>${esc(planet.environment)}</td><td>${esc(i.food)}</td><td>${esc(i.build)}</td><td>${esc(i.fuel)}</td><td>${esc(i.ore)}</td><td>${esc(i.habitability)}</td><td>${formatNumber(planet.surveyConfidence)}%</td><td>P${t.power||0} / F${t.food||0} / M${t.mining||0}</td><td>${colonyNames}</td><td class="exp-planet-actions">${actions}</td></tr>`;
    }).join("");
    return `<div class="exp-planet-table-wrap"><table class="exp-planet-table"><thead><tr>${this.planetSortHeader("name","PLANET")}${this.planetSortHeader("environment","ENVIRONMENT")}${this.planetSortHeader("food","FOOD")}${this.planetSortHeader("build","BUILD")}${this.planetSortHeader("fuel","FUEL")}${this.planetSortHeader("ore","ORE")}${this.planetSortHeader("habitability","HABITABILITY")}${this.planetSortHeader("confidence","CONF.")}${this.planetSortHeader("tech","TECH")}${this.planetSortHeader("colony","COLONY")}<th>ACTION</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  bindStarMapDetailActions(system){
    super.bindStarMapDetailActions(system);
    this.modal?.querySelectorAll("[data-planet-sort]").forEach(button=>button.onclick=()=>{const key=button.dataset.planetSort;if(this.planetSort?.key===key)this.planetSort.dir*=-1;else this.planetSort={key,dir:1};this.starMap();});
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

  cargoRows(){
    const rows=this.cargoEntries().slice(this.expeditionPage*4,(this.expeditionPage+1)*4);if(!rows.length)return`<div class="exp-empty">No ${this.expeditionCategory.toUpperCase()} stock at this colony or aboard.</div>`;
    return `<div class="exp-load-list">${rows.map(row=>{const e=row.colony||row.aboard,colony=Math.max(0,Number(row.colony?.amount)||0),aboard=Math.max(0,Number(row.aboard?.amount)||0),available=colony+aboard;return`<div class="exp-load-row compact"><span><strong>${esc(e.name)}</strong><small>${formatNumber(colony)} colony • ${formatNumber(aboard)} aboard</small><div class="exp-resource-load"><i style="width:${pct(aboard,available)}%"></i></div></span><div><button data-load-cargo="${row.key}" data-qty="100">+100</button><button data-load-cargo="${row.key}" data-qty="1000">+1K</button><button data-load-cargo="${row.key}" data-qty="max">MAX</button><button data-unload-cargo="${row.key}" ${aboard<=0?"disabled":""}>UNLOAD</button></div></div>`;}).join("")}</div>`;
  }

  fuelLoader(){
    const ship=this.expansion.ship(this.state),keys=new Set([...Object.keys(this.state.inventory||{}).filter(k=>this.state.inventory[k]?.type==="fuel"),...Object.keys(ship.fuelLots||{})]),rows=[...keys].map(key=>({key,colony:this.state.inventory?.[key],tank:ship.fuelLots?.[key]})).filter(row=>(Number(row.colony?.amount)||0)>0||(Number(row.tank?.amount)||0)>0).sort((a,b)=>String(a.colony?.name||a.tank?.name).localeCompare(String(b.colony?.name||b.tank?.name)));
    return `<section class="exp-section compact-section"><div class="exp-section-head"><h3>SHIP FUEL TANK</h3><span>Dedicated tank • counts against ship capacity</span></div><div class="exp-load-list">${rows.length?rows.map(row=>{const e=row.colony||row.tank,c=Math.max(0,Number(row.colony?.amount)||0),t=Math.max(0,Number(row.tank?.amount)||0),available=c+t;return`<div class="exp-load-row compact"><span><strong>${esc(e.name)}</strong><small>${formatNumber(c)} colony • ${formatNumber(t)} tank</small><div class="exp-resource-load"><i style="width:${pct(t,available)}%"></i></div></span><div><button data-load-fuel="${row.key}" data-qty="100">+100</button><button data-load-fuel="${row.key}" data-qty="1000">+1K</button><button data-unload-fuel="${row.key}" ${t<=0?"disabled":""}>UNLOAD</button></div></div>`;}).join(""):`<div class="exp-empty">No Fuel stock at this colony or in the ship tank.</div>`}</div></section>`;
  }

  async shipPrep(){
    const revision=++this.shipPrepRevision,ship=this.expansion.ship(this.state);if(ship.status==="travelling"){this.starMap();return;}if(ship.status==="arrived"){this.openSystem(ship.systemId);return;}if(ship.status==="home"){this.homeworld();return;}
    if(!this.expansion.isAtActiveColony(this.state)){const entry=this.state.portfolio?.colonies?.find(e=>e.id===ship.colonyId);this.open("Prepare Player Ship",`<div class="exp-shell">${this.shipStatusMarkup()}<article class="exp-message"><strong>SHIP IS AT ANOTHER COLONY</strong><span>Switch to ${esc(entry?.data?.contract?.colonyName||"the ship colony")} to load or unload resources and people.</span><button data-switch-ship-colony>GO TO SHIP COLONY</button></article><button data-back-map>STAR MAP</button></div>`);this.modal.querySelector("[data-switch-ship-colony]").onclick=()=>{if(this.onSwitchColony?.(ship.colonyId))this.shipPrep();};this.modal.querySelector("[data-back-map]").onclick=()=>this.starMap();return;}
    const target=ship.targetSystemId?this.expansion.system(this.state.company.expansion,ship.targetSystemId):null,profile=target?this.expansion.travelProfile(this.state,target.id):null,canLaunch=this.expansion.canLaunch(this.state),fuel=this.expansion.fuelAmount(this.state),food=this.expansion.cargoCategory(this.state,"food"),categories=this.availableCargoCategories();
    if(categories.length&&!categories.includes(this.expeditionCategory)){this.expeditionCategory=categories[0];this.expeditionPage=0;}
    const pages=this.cargoPages(),page=Math.min(this.expeditionPage,pages-1);this.expeditionPage=page;
    const tabs=categories.length?`<div class="exp-tabs compact-tabs">${categories.map(c=>`<button data-exp-category="${c}" class="${this.expeditionCategory===c?"active":""}">${c.toUpperCase()}</button>`).join("")}</div>`:`<div class="exp-empty">No cargo resources are currently held by this colony or aboard the ship.</div>`;
    const routeDetails=profile?`<div><small>DISTANCE</small><strong>${profile.distanceLy.toFixed(1)} ly</strong></div><div><small>JOURNEY</small><strong>${formatNumber(profile.days)} days</strong></div><div><small>TRANSIT FUEL</small><strong class="${fuel>=profile.fuelRequired?"good":"bad"}">${formatNumber(fuel)} / ${formatNumber(profile.fuelRequired)}</strong></div><div><small>TRANSIT FOOD</small><strong class="${food>=profile.foodRequired?"good":"bad"}">${formatNumber(food)} / ${formatNumber(profile.foodRequired)}</strong></div>`:"";
    const cargoContent=categories.length?`${this.cargoRows()}${this.pager("exp",page,pages)}`:"";
    let body;
    try{body=await renderViewTemplate("./views/player-ship-prep.html",{SHIP_STATUS:this.shipStatusMarkup(),DESTINATION:target?esc(target.name):"NOT SELECTED",ROUTE_DETAILS:routeDetails,MANIFEST_OVERVIEW:this.manifestOverview(profile),FUEL_LOADER:this.fuelLoader(),PASSENGER_LOADER:this.passengerLoader(),CARGO_TABS:tabs,CARGO_CONTENT:cargoContent,LAUNCH_DISABLED:canLaunch.ok?"":"disabled",LAUNCH_LABEL:canLaunch.ok?`LAUNCH • ${formatNumber(profile?.days||0)} DAYS`:esc(canLaunch.reason)});}catch(error){if(revision!==this.shipPrepRevision)return;this.diagnostics?.error?.("ship preparation template failed",error);this.toast("Unable to open player ship preparation.");return;}
    if(revision!==this.shipPrepRevision)return;
    this.open("Prepare Player Ship",body);
    this.modal.classList.add("ship-prep-modal","full-screen-panel","compact-ship-prep");this.bindPrep();
  }
}
