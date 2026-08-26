import { UIController as V5100UIController } from "./adaptive-building-ui.js";
import { ExpansionService, HOME_SYSTEM_ID, PLAYER_SHIP_CAPACITY, PLAYER_SHIP_PASSENGERS } from "../domain/expansion-service.js";
import { formatMoney, formatNumber } from "../core/utils.js";

const PAGE_SIZE=4;
const CATEGORIES=["food","build","fuel","ore"];
const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

export class UIController extends V5100UIController{
  constructor(opts){super(opts);this.expansion=new ExpansionService(this.inventory,this.resources,this.contracts);this.expansion.ensure(this.state);this.starView={x:0,y:0,scale:18};this.expeditionCategory="food";this.expeditionPage=0;this.homeCategory="food";this.homePage=0;}

  contractBoard(){this.starMap();}

  menu(){
    super.menu();const grid=this.modal?.querySelector(".grid2");if(grid&&!grid.querySelector("[data-star-map]")){const b=document.createElement("button");b.dataset.starMap="1";b.textContent="STAR MAP / PLAYER SHIP";b.onclick=()=>this.starMap();grid.prepend(b);}
  }

  render(){
    super.render();this.expansion.ensure(this.state);const ex=this.state.company.expansion,ship=ex.ship,notice=ex.notice;
    if(this.state.company.pendingEvents?.length)return;
    if(ship.status==="arrived"&&ship.awaitingDestination&&ship.arrivalPromptedFor!==ship.systemId){ship.arrivalPromptedFor=ship.systemId;queueMicrotask(()=>this.openSystem(ship.systemId));return;}
    if(ship.status==="home"&&notice?.type==="home-arrival"&&!notice.prompted){notice.prompted=true;queueMicrotask(()=>this.homeworld());return;}
    if(notice?.type==="probe-complete"&&!notice.prompted){notice.prompted=true;const system=this.expansion.system(ex,notice.systemId);queueMicrotask(()=>this.toast(`Survey complete • ${system?.name||"system data received"}.`));}
  }

  gameOver(){const ship=this.expansion?.ship?.(this.state);if(ship?.status==="lost"){this.state.speed=0;this.syncSpeed();this.open("Corporation Lost",`<article class="card"><h3 class="bad">SOLE COLONY SHIP LOST</h3><p>${esc(ship.lostReason||"The player colony ship has been lost.")}</p><div class="effect warn">Without the colony ship the corporation can no longer sustain interstellar expansion or frontier logistics. Start a new corporation to continue.</div></article>`);return;}return super.gameOver?.();}

  shipExpansion(){const ship=this.expansion.ship(this.state);if(ship.status==="home")this.homeworld();else this.starMap();}

  shipLocation(){
    const ship=this.expansion.ship(this.state),ex=this.state.company.expansion;if(ship.status==="travelling"){const target=this.expansion.system(ex,ship.targetSystemId);return `IN TRANSIT → ${target?.name||"UNKNOWN"}`;}if(ship.status==="lost")return"SHIP LOST";const system=this.expansion.system(ex,ship.systemId);if(ship.status==="home")return"KOPLIN CORPORATE HOME";if(ship.status==="arrived")return`ARRIVED • ${system?.name||"SYSTEM"}`;const entry=this.state.portfolio?.colonies?.find(e=>e.id===ship.colonyId);return `${entry?.data?.contract?.colonyName||"DOCKED"} • ${system?.name||"SYSTEM"}`;
  }

  shipStatusMarkup(){
    const ship=this.expansion.ship(this.state),used=this.expansion.capacityUsed(this.state),fuel=this.expansion.fuelAmount(this.state),cargo=this.expansion.cargoAmount(this.state),target=ship.targetSystemId?this.expansion.system(this.state.company.expansion,ship.targetSystemId):null,days=ship.status==="travelling"?Math.max(0,(Number(ship.arrivalAbsoluteDay)||0)-this.expansion.absoluteDay(this.state)):null;
    return `<section class="exp-ship-strip"><div><small>PLAYER COLONY SHIP</small><strong>${esc(this.shipLocation())}</strong></div><div class="exp-ship-metrics"><span><small>CAPACITY</small><b>${formatNumber(used)} / ${formatNumber(PLAYER_SHIP_CAPACITY)}</b></span><span><small>FUEL</small><b>${formatNumber(fuel)}</b></span><span><small>CARGO</small><b>${formatNumber(cargo)}</b></span><span><small>PEOPLE</small><b>${formatNumber(ship.passengers)} / ${PLAYER_SHIP_PASSENGERS}</b></span>${days!==null?`<span><small>ARRIVAL</small><b>${formatNumber(days)}d</b></span>`:""}</div>${target?`<div class="exp-target">TARGET • <strong>${esc(target.name)}</strong></div>`:""}</section>`;
  }

  bindStarMap(){
    const canvas=this.modal?.querySelector("#starMapCanvas");if(!canvas)return;const ctx=canvas.getContext("2d"),pointers=new Map();let moved=false,lastPinch=null;
    const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);this.drawStarMap(canvas,ctx);};
    const point=e=>({x:e.clientX,y:e.clientY});
    canvas.onpointerdown=e=>{canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,point(e));moved=false;if(pointers.size===2){const a=[...pointers.values()];lastPinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}};
    canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId),next=point(e);pointers.set(e.pointerId,next);if(pointers.size===1){const dx=next.x-prev.x,dy=next.y-prev.y;if(Math.hypot(dx,dy)>1)moved=true;this.starView.x-=dx/this.starView.scale;this.starView.y+=dy/this.starView.scale;}else if(pointers.size===2){const a=[...pointers.values()],pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(lastPinch){this.starView.scale=clamp(this.starView.scale*(pinch/lastPinch),7,55);moved=true;}lastPinch=pinch;}this.drawStarMap(canvas,ctx);};
    canvas.onpointerup=e=>{const pos=point(e);pointers.delete(e.pointerId);lastPinch=null;if(!moved){const hit=this.starHit(canvas,pos);if(hit)this.openSystem(hit.id);}};
    canvas.onpointercancel=e=>pointers.delete(e.pointerId);
    canvas.onwheel=e=>{e.preventDefault();this.starView.scale=clamp(this.starView.scale*(e.deltaY<0?1.12:.89),7,55);this.drawStarMap(canvas,ctx);};
    new ResizeObserver(resize).observe(canvas);resize();
  }

  starScreen(canvas,system){const r=canvas.getBoundingClientRect(),v=this.starView;return{x:r.width/2+(system.x-v.x)*v.scale,y:r.height/2-(system.y-v.y)*v.scale};}
  starHit(canvas,pos){const r=canvas.getBoundingClientRect(),x=pos.x-r.left,y=pos.y-r.top,systems=this.state.company.expansion.systems;let best=null,bestD=16;for(const system of systems){const p=this.starScreen(canvas,system),d=Math.hypot(p.x-x,p.y-y);if(d<bestD){best=system;bestD=d;}}return best;}

  drawStarMap(canvas,ctx){
    const r=canvas.getBoundingClientRect(),ex=this.state.company.expansion,systems=ex.systems,ship=ex.ship;ctx.clearRect(0,0,r.width,r.height);ctx.fillStyle="#030608";ctx.fillRect(0,0,r.width,r.height);
    ctx.save();ctx.strokeStyle="rgba(80,220,170,.25)";ctx.lineWidth=1;const home=this.expansion.system(ex,HOME_SYSTEM_ID),hp=this.starScreen(canvas,home);ctx.beginPath();ctx.arc(hp.x,hp.y,ex.serviceRadiusLy*this.starView.scale,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(const system of systems){const p=this.starScreen(canvas,system),colonies=this.expansion.coloniesInSystem(this.state,system.id),probe=this.expansion.probeFor(this.state,system.id),playerHere=ship.systemId===system.id&&ship.status!=="travelling",corpHere=(this.state.portfolio?.colonies||[]).some(e=>e.data?.contract?.systemId===system.id&&e.data?.trade?.active);let fill=system.home?"#55e6af":system.surveyed?"#9ed7ff":"#7b8790";if(probe)fill="#f3cc67";ctx.fillStyle=fill;ctx.beginPath();ctx.arc(p.x,p.y,system.home?6:system.surveyed?4.5:3.5,0,Math.PI*2);ctx.fill();if(colonies.length){ctx.strokeStyle="#58e3ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}if(playerHere){ctx.fillStyle="#ffffff";ctx.beginPath();ctx.moveTo(p.x+12,p.y);ctx.lineTo(p.x+19,p.y-5);ctx.lineTo(p.x+19,p.y+5);ctx.closePath();ctx.fill();}if(corpHere){ctx.fillStyle="#ffcc66";ctx.fillRect(p.x-16,p.y-3,6,6);}ctx.fillStyle="rgba(235,244,248,.78)";ctx.font="11px system-ui";ctx.fillText(system.name,p.x+8,p.y-8);}
    if(ship.status==="travelling"){const from=this.expansion.system(ex,ship.sourceSystemId),to=this.expansion.system(ex,ship.targetSystemId);if(from&&to){const a=this.starScreen(canvas,from),b=this.starScreen(canvas,to),total=Math.max(1,(ship.arrivalAbsoluteDay||0)-(ship.departedAbsoluteDay||0)),left=Math.max(0,(ship.arrivalAbsoluteDay||0)-this.expansion.absoluteDay(this.state)),t=clamp(1-left/total,0,1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;ctx.strokeStyle="rgba(255,255,255,.28)";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(x+7,y);ctx.lineTo(x-5,y-4);ctx.lineTo(x-5,y+4);ctx.closePath();ctx.fill();}}
  }

  foundPlanet(systemId,planetId){const contract=this.expansion.makePlanetContract(this.state,systemId,planetId);if(!contract){this.toast("Planet data unavailable.");return;}if(!this.technology.meetsRequirements(this.state,contract.requiredTech)){this.toast("Technology requirements not met for this planet.");return;}if(this.expansion.ship(this.state).passengers<=0){this.toast("Load colonists before founding a colony.");return;}try{this.onNewContract?.(contract);}catch(error){this.diagnostics?.error?.("expedition colony creation failed",error);this.toast(error.message||"Colony could not be established.");}}
  cargoPages(){return Math.max(1,Math.ceil(this.cargoEntries().length/PAGE_SIZE));}

  passengerLoader(){const ship=this.expansion.ship(this.state);return `<section class="exp-section"><div class="exp-section-head"><h3>COLONISTS</h3><span>People leave this colony as soon as they board.</span></div><div class="exp-passengers"><div><small>COLONY</small><strong>${formatNumber(this.state.pop)}</strong></div><div><small>ABOARD</small><strong>${formatNumber(ship.passengers)} / ${PLAYER_SHIP_PASSENGERS}</strong></div><button data-load-pax="10">+10</button><button data-load-pax="50">+50</button><button data-load-pax="max">MAX</button><button data-unload-pax ${ship.passengers<=0?"disabled":""}>UNLOAD ALL</button></div></section>`;}

  pager(kind,page,pages){return `<div class="exp-pager"><button data-exp-page="-1" ${page<=0?"disabled":""}>‹</button><span>${page+1} / ${pages}</span><button data-exp-page="1" ${page>=pages-1?"disabled":""}>›</button></div>`;}

  bindPrep(){
    const m=this.modal;m.querySelectorAll("[data-exp-category]").forEach(b=>b.onclick=()=>{this.expeditionCategory=b.dataset.expCategory;this.expeditionPage=0;this.shipPrep();});m.querySelectorAll("[data-exp-page]").forEach(b=>b.onclick=()=>{this.expeditionPage=Math.max(0,this.expeditionPage+Number(b.dataset.expPage));this.shipPrep();});
    const qty=(button,available)=>button.dataset.qty==="max"?available:Number(button.dataset.qty);
    m.querySelectorAll("[data-load-cargo]").forEach(b=>b.onclick=()=>{const e=this.state.inventory?.[b.dataset.loadCargo],r=this.expansion.loadCargo(this.state,b.dataset.loadCargo,qty(b,e?.amount||0));this.afterManifestChange(r);});m.querySelectorAll("[data-unload-cargo]").forEach(b=>b.onclick=()=>this.afterManifestChange(this.expansion.unloadCargo(this.state,b.dataset.unloadCargo)));
    m.querySelectorAll("[data-load-fuel]").forEach(b=>b.onclick=()=>{const e=this.state.inventory?.[b.dataset.loadFuel],r=this.expansion.loadFuel(this.state,b.dataset.loadFuel,qty(b,e?.amount||0));this.afterManifestChange(r);});m.querySelectorAll("[data-unload-fuel]").forEach(b=>b.onclick=()=>this.afterManifestChange(this.expansion.unloadFuel(this.state,b.dataset.unloadFuel)));
    m.querySelectorAll("[data-load-pax]").forEach(b=>b.onclick=()=>{const amount=b.dataset.loadPax==="max"?Math.min(this.state.pop,this.expansion.passengerRemaining(this.state)):Number(b.dataset.loadPax);this.afterManifestChange(this.expansion.loadPassengers(this.state,amount));});m.querySelector("[data-unload-pax]")?.addEventListener("click",()=>this.afterManifestChange(this.expansion.unloadPassengers(this.state)));
    m.querySelector("[data-back-map]").onclick=()=>this.starMap();const launch=m.querySelector("[data-launch-player]");if(launch&&!launch.disabled)launch.onclick=()=>{const r=this.expansion.launch(this.state);if(!r.ok){this.toast(r.reason);this.shipPrep();return;}this.onCapturePortfolio?.();this.repo.save(this.state);this.gameLog?.event?.(this.state,"player-ship-launched",`Player colony ship launched for ${r.profile.target.name}.`,{targetSystemId:r.profile.target.id,distanceLy:r.profile.distanceLy,journeyDays:r.profile.days,passengers:this.expansion.ship(this.state).passengers});this.modal.classList.add("hidden");this.toast(`Ship launched • arrival in ${formatNumber(r.profile.days)} days.`);};
  }

  afterManifestChange(result){if(!result?.ok){this.toast(result?.reason||"Unable to change the manifest.");return;}this.onRecalculate?.();this.onCapturePortfolio?.();this.repo.save(this.state);this.shipPrep();}

  homeworld(){
    const ship=this.expansion.ship(this.state);if(ship.status!=="home"){this.starMap();return;}const catalog=(this.expansion.homeCatalog()||[]).filter(x=>x&&CATEGORIES.includes(x.type)),rows=catalog.filter(x=>x.type===this.homeCategory).sort((a,b)=>a.name.localeCompare(b.name)),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));this.homePage=Math.min(this.homePage,pages-1);const visible=rows.slice(this.homePage*PAGE_SIZE,(this.homePage+1)*PAGE_SIZE),cargoValue=this.homeCargoValue();
    this.open("Koplin Corporate Home",`<div class="exp-shell home">${this.shipStatusMarkup()}<section class="exp-system-summary"><div><small>CASH</small><strong>${formatMoney(this.state.company.cash)}</strong></div><div><small>RETURN CARGO</small><strong>${formatMoney(cargoValue)}</strong></div><div><small>CAPACITY FREE</small><strong>${formatNumber(this.expansion.capacityRemaining(this.state))}</strong></div><div><small>PASSENGERS</small><strong>${formatNumber(ship.passengers)}</strong></div></section><button class="action" data-sell-home ${this.expansion.cargoAmount(this.state)>0?"":"disabled"}>SELL ALL RETURN CARGO • ${formatMoney(cargoValue)}</button><section class="exp-section"><div class="exp-section-head"><h3>CORPORATE SUPPLY</h3><span>Buy supplies here, then physically haul them to frontier colonies.</span></div><div class="exp-tabs">${CATEGORIES.map(c=>`<button data-home-category="${c}" class="${this.homeCategory===c?"active":""}">${c.toUpperCase()}</button>`).join("")}</div><div class="exp-load-list">${visible.map(item=>`<div class="exp-load-row"><span><strong>${esc(item.name)}</strong><small>${formatMoney((this.resources.sellPrice(item.type,item.id)||0)*1.5)} / unit</small></span><div>${item.type==="fuel"?`<button data-home-fuel="${item.type}:${item.id}" data-qty="100">TANK +100</button><button data-home-fuel="${item.type}:${item.id}" data-qty="1000">TANK +1K</button>`:""}<button data-home-buy="${item.type}:${item.id}" data-qty="100">CARGO +100</button><button data-home-buy="${item.type}:${item.id}" data-qty="1000">CARGO +1K</button></div></div>`).join("")}</div>${this.pager("home",this.homePage,pages)}</section><div class="exp-prep-actions"><button data-back-map>STAR MAP</button></div></div>`);this.modal.classList.add("ship-prep-modal");
    this.modal.querySelector("[data-sell-home]")?.addEventListener("click",()=>{const r=this.expansion.sellCargoAtHome(this.state);if(!r.ok){this.toast(r.reason);return;}this.repo.save(this.state);this.toast(`Returned cargo sold for ${formatMoney(r.revenue)}.`);this.homeworld();});this.modal.querySelectorAll("[data-home-category]").forEach(b=>b.onclick=()=>{this.homeCategory=b.dataset.homeCategory;this.homePage=0;this.homeworld();});this.modal.querySelectorAll("[data-exp-page]").forEach(b=>b.onclick=()=>{this.homePage=Math.max(0,this.homePage+Number(b.dataset.expPage));this.homeworld();});
    const buy=(b,toFuelTank)=>{const[type,id]=b.dataset[toFuelTank?"homeFuel":"homeBuy"].split(":"),r=this.expansion.buyAtHome(this.state,type,id,Number(b.dataset.qty),{toFuelTank});if(!r.ok){this.toast(r.reason);return;}this.repo.save(this.state);this.toast(`Loaded ${formatNumber(r.qty)} ${r.entry.name}.`);this.homeworld();};this.modal.querySelectorAll("[data-home-buy]").forEach(b=>b.onclick=()=>buy(b,false));this.modal.querySelectorAll("[data-home-fuel]").forEach(b=>b.onclick=()=>buy(b,true));this.modal.querySelector("[data-back-map]").onclick=()=>this.starMap();
  }

  homeCargoValue(){let value=0;for(const entry of Object.values(this.expansion.ship(this.state).cargo||{}))for(const[bandKey,band]of Object.entries(entry.qualityBands||{}))value+=Math.max(0,Number(band.amount)||0)*(this.resources.sellPrice(entry.type,entry.resourceId,bandKey)||0);return value;}
}
