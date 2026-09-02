import { CONFIG } from "../core/config.js";
import { formatMoney, formatNumber } from "../core/utils.js";
import { loadViewTemplate } from "../core/view-template.js";

const LAND_VIEW_PATHS={
  selection:"./views/landing-site-selection.html",
  resource:"./views/land-resource-details.html",
  colony:"./views/colony-land-panel.html"
};

export class LandUIMixin{
  setLandText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");}
  cloneLandTemplate(root,selector){return root?.querySelector(selector)?.content.cloneNode(true)||null;}
  landViewSnapshot(){return{body:this.modal?.querySelector(".modal-body")||null,hidden:this.modal?.classList.contains("hidden")??true,colonyId:this.state?.colonyId};}
  landViewStillCurrent(snapshot){return!!snapshot&&snapshot.body==(this.modal?.querySelector(".modal-body")||null)&&snapshot.hidden==(this.modal?.classList.contains("hidden")??true)&&snapshot.colonyId==this.state?.colonyId;}
  async loadLandView(path,label,snapshot){
    try{const source=await loadViewTemplate(path);return this.landViewStillCurrent(snapshot)?source:null;}
    catch(error){this.diagnostics?.error?.(`${label} view failed`,error);this.toast(`Unable to open ${label}.`);return null;}
  }

  async landSelection({abandon=false}={}){
    const land=this.land.ensure(this.state),snapshot=this.landViewSnapshot(),previousSpeed=this.state.speed;
    if(abandon){this.landReturnSpeed=previousSpeed;this.state.speed=0;this.syncSpeed();}
    const source=await this.loadLandView(LAND_VIEW_PATHS.selection,"landing-site selection",snapshot);
    if(!source){if(abandon){this.state.speed=this.landReturnSpeed??previousSpeed;this.syncSpeed();}return false;}
    this.open(abandon?"Choose a New Landing Site":"Choose Colony Landing Site",source);
    const body=this.modal.querySelector(".modal-body");if(!body)return false;
    this.setLandText(body,"[data-land-selection-title]",abandon?"ABANDON CURRENT SITE":"SELECT ONE OF 8 LOCATIONS");
    this.setLandText(body,"[data-land-selection-copy]",abandon?"The colony keeps its people, corporate technology and 25% of stored material. Buildings, mines, surveys and the rest of the local stock are left behind. The contract clock does not reset.":"Only the land is known before settlement. Resources remain hidden until each tile is surveyed.");
    this.populateLandingCandidates(body,land);
    const close=this.modal.querySelector("[data-close]");if(close&&!abandon)close.style.display="none";
    const cancel=body.querySelector("[data-land-cancel]");if(cancel){cancel.hidden=!abandon;cancel.onclick=()=>{this.state.speed=this.landReturnSpeed??1;this.syncSpeed();this.modal.classList.add("hidden");};}
    body.querySelectorAll("[data-land-choice]").forEach(button=>button.onclick=()=>this.onSelectLand?.(+button.dataset.landChoice,{abandon}));
    return true;
  }
  populateLandingCandidates(body,land){
    const host=body.querySelector("[data-land-candidates]"),rows=document.createDocumentFragment();
    land.candidates.forEach((candidate,index)=>{
      const fragment=this.cloneLandTemplate(body,"[data-land-candidate-template]");if(!fragment)return;
      const article=fragment.querySelector("[data-land-candidate]"),preview=fragment.querySelector("[data-land-preview]"),button=fragment.querySelector("[data-land-choice]");
      article?.classList.toggle("current",land.selectedIndex==index);
      const cells=document.createDocumentFragment();for(const cell of candidate.cells){const node=document.createElement("i");node.className=`terrain-${cell.terrain} v${cell.variant}`;node.title=this.land.terrainLabel(cell.terrain);cells.append(node);}preview?.replaceChildren(cells);
      if(button){button.dataset.landChoice=String(index);button.textContent=land.selectedIndex==index?"CHOOSE CURRENT SITE":`CHOOSE LOCATION ${index+1}`;}
      rows.append(fragment);
    });
    host?.replaceChildren(rows);
  }

  async landTile(tile){
    if(this.land.isShipTile(tile.x,tile.y)){this.company();return true;}
    const terrain=this.land.terrainLabel(tile.terrain),deep=tile.deepResource?"Deep geology signal stored for future deep surveying.":"No deep survey data yet.";
    if(!tile.revealed){this.open(`${terrain} • ${tile.x},${tile.y}`,`<article class="card"><h3>UNSURVEYED</h3><p>${this.world.hint(this.state,tile.x,tile.y)}</p><div class="effect">Land can only be developed after surveying.</div></article>`);return true;}
    const dev=tile.development;
    if(dev?.kind=="extract"||tile.developed){
      this.tile(tile);const panel=this.tilePanel,heading=panel?.querySelector(".panel-title");if(!panel||panel.classList.contains("hidden"))return false;
      const terrainInfo=document.createElement("div");terrainInfo.className="effect";terrainInfo.textContent=`Terrain: ${terrain} • ${deep}`;heading?.insertAdjacentElement("afterend",terrainInfo);
      if(tile.depleted){this.appendDepletedDemolish?.(tile);return true;}
      const demolish=document.createElement("button");demolish.className="bad";demolish.dataset.landDemolish="1";demolish.textContent="DEMOLISH EXTRACTION SITE";panel.appendChild(demolish);demolish.onclick=()=>{if(confirm(`Demolish the ${tile.name} extraction site? The resource remains.`))this.onDemolishDevelopment?.(tile);};return true;
    }
    if(tile.resourceId)return this.openLandResourceDetails(tile,terrain);
    return this.buildChoice(tile);
  }
  async openLandResourceDetails(tile,terrain){
    const snapshot=this.landViewSnapshot(),resourceId=tile.resourceId,source=await this.loadLandView(LAND_VIEW_PATHS.resource,"resource details",snapshot);
    if(!source||!tile.revealed||tile.resourceId!=resourceId||tile.developed||tile.development)return false;
    const req=this.sites.developRequirements(this.state,tile),housing=this.development.canPlace(this.state,tile,"housing"),industry=this.development.canPlace(this.state,tile,"industry");
    this.open(`${tile.name} • Q${formatNumber(tile.quality)}`,source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    this.setLandText(body,"[data-land-resource-terrain]",terrain);this.setLandText(body,"[data-land-resource-category]",this.resources.categoryName(tile.type));this.setLandText(body,"[data-land-resource-mining]",`L${tile.requiredMiningLevel||1}`);this.setLandText(body,"[data-land-resource-deposit]",this.resources.isRenewable(tile)?tile.abundanceLabel||"Sustainable":formatNumber(tile.reserve));this.setLandText(body,"[data-land-resource-workers]",`${formatNumber(req.workforce||0)} required`);this.setLandText(body,"[data-land-resource-free-workforce]",formatNumber(req.freeWorkforce||0));
    const effect=body.querySelector("[data-land-resource-development]");if(effect){effect.classList.toggle("good",req.ok);effect.classList.toggle("warn",!req.ok);effect.textContent=req.ok?`Tap this tile to develop the resource: ${formatMoney(req.cash)} + ${formatNumber(req.build)} Build.`:req.reason;}
    this.setLandText(body,"[data-land-resource-cover-copy]",tile.type=="food"?"This natural Food resource will be permanently destroyed.":"The deposit remains, but becomes inaccessible until the building is demolished.");
    for(const [kind,result] of [["housing",housing],["industry",industry]]){const button=body.querySelector(`[data-cover="${kind}"]`);if(button)button.disabled=!result.ok;}
    body.querySelectorAll("[data-cover]").forEach(button=>button.onclick=()=>{if(confirm(tile.type=="food"?`Build over ${tile.name}? This Food resource will be destroyed.`:`Cover ${tile.name} with ${button.dataset.cover}?`))this.onPlaceDevelopment?.(tile,button.dataset.cover);});
    return true;
  }

  async landColonyPanel(){
    if(this.state.status=="site-selection")return this.landSelection();
    if(this.state.status=="dead"){this.colonyPanel();return false;}
    const snapshot=this.landViewSnapshot(),source=await this.loadLandView(LAND_VIEW_PATHS.colony,"colony land",snapshot);if(!source||this.state.status=="site-selection"||this.state.status=="dead")return false;
    this.onRecalculate?.();const s=this.state,m=s.metrics,land=this.land.ensure(s),housingTiles=this.development.developments(s,"housing").length,industryTiles=this.development.developments(s,"industry").length,extractTiles=this.development.developments(s,"extract").length,available=Math.max(0,Number(m.workforceAvailable)||0),required=Math.max(0,Number(m.workforceRequired)||0),free=Math.max(0,Number(m.workforceFree)||0),shortfall=Math.max(0,Number(m.workforceShortfall)||0),orders=this.transport?.ensure(s)||[],supported=this.transport?.availableCapacity(s)||0,network=this.transport?.networkStatus(s)||{networkAvailable:true},blocked=s.contract.ended||s.status=="liability"||!network.networkAvailable,blockedReason=!network.networkAvailable?"Conglomerate network offline — existing transports continue, but new requests require an operational Primary Headquarters.":"This colony cannot receive new colonists.",completed=s.contract.completed&&!s.contract.ended,relocation=this.colony.relocationCost(s),ageY=this.contracts.contractYear(s),ageD=this.contracts.contractDay(s),pct=v=>`${Math.round(Math.max(0,Math.min(1,Number(v)||0))*100)}%`;
    this.open(`${s.contract.colonyName} — Colony Land`,source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    this.setLandText(body,"[data-land-location]",`LOCATION ${Number(land.selectedIndex)+1} OF 8`);this.setLandText(body,"[data-land-environment]",s.contract.environment);this.setLandText(body,"[data-land-date]",`Corporation date Y${s.year} D${s.day} • contract age Y${ageY} D${ageD}`);
    this.setLandText(body,"[data-land-pop-housing]",`${formatNumber(s.pop)} / ${formatNumber(s.colony.housingCapacity)}`);this.setLandText(body,"[data-land-industry]",`L${s.colony.industryLevel} • ${formatNumber(m.industry)}`);this.setLandText(body,"[data-land-housing-tiles]",housingTiles);this.setLandText(body,"[data-land-industry-tiles]",industryTiles);this.setLandText(body,"[data-land-extraction-sites]",extractTiles);this.setLandText(body,"[data-land-relocations]",land.moves||0);
    this.setLandText(body,"[data-land-food]",formatNumber(m.foodStock||0));this.setLandText(body,"[data-land-fuel]",formatNumber(m.fuelStock||0));this.setLandText(body,"[data-land-ore]",formatNumber(m.oreStock||0));this.setLandText(body,"[data-land-power]",`${formatNumber(m.powerDemand||0)} / ${formatNumber(m.powerCapacity||0)}`);
    const shortfallNode=body.querySelector("[data-workforce-shortfall]");if(shortfallNode)shortfallNode.hidden=shortfall<=0;this.setLandText(body,"[data-workforce-available]",formatNumber(available));this.setLandText(body,"[data-workforce-required]",formatNumber(required));this.setLandText(body,"[data-workforce-free]",formatNumber(free));this.setLandText(body,"[data-workforce-commercial]",pct(m.workforceCommercialFactor??1));
    this.setLandText(body,"[data-industry-load]",`${formatNumber(m.industryLoad||0)} / ${formatNumber(m.industryCapacity||0)}`);this.setLandText(body,"[data-industry-commercial]",pct(m.industryCommercialFactor??1));this.setLandText(body,"[data-processing-bonus]",`+${Math.round((m.processingBonus||0)*100)}%`);this.setLandText(body,"[data-survival-supply]",pct(m.survivalSupply??1));
    this.setLandText(body,"[data-transport-days]",CONFIG.DEDICATED_TRANSPORT_DAYS);this.populatePendingTransports(body,orders,s);this.setLandText(body,"[data-supported-places]",formatNumber(supported));this.setLandText(body,"[data-pending-colonists]",formatNumber(this.transport.pendingPopulation(s)));this.configureTransportControls(body,{supported,blocked,blockedReason});
    this.configureEmergencyCard(body,s);this.configureColonyManagement(body,{s,completed,relocation});this.bindColonyLandActions(body,{s,supported,relocation});
    return true;
  }
  populatePendingTransports(body,orders,state){
    const host=body.querySelector("[data-pending-transports]"),rows=document.createDocumentFragment();for(const order of orders){const fragment=this.cloneLandTemplate(body,"[data-pending-transport-template]");if(!fragment)continue;this.setLandText(fragment,"[data-pending-amount]",`+${formatNumber(order.amount)} colonists`);this.setLandText(fragment,"[data-pending-eta]",`${formatNumber(this.transport.daysRemaining(state,order))}d ETA`);this.setLandText(fragment,"[data-pending-cost]",formatMoney(order.cost));rows.append(fragment);}host?.replaceChildren(rows);const empty=body.querySelector("[data-no-pending-transports]");if(empty)empty.hidden=orders.length>0;
  }
  configureTransportControls(body,{supported,blocked,blockedReason}){
    const blockedNote=body.querySelector("[data-transport-blocked]"),controls=body.querySelector("[data-transport-controls]");if(blockedNote){blockedNote.hidden=!blocked;blockedNote.textContent=blockedReason;}if(controls)controls.hidden=blocked;
    for(const amount of [100,500,1000]){const button=body.querySelector(`[data-land-transport="${amount}"]`);if(button)button.disabled=supported<amount;}const max=body.querySelector('[data-land-transport="max"]');if(max)max.disabled=supported<1;const input=body.querySelector("[data-land-transport-custom]");if(input)input.max=String(Math.max(1,supported));
  }
  configureEmergencyCard(body,state){
    this.setLandText(body,"[data-emergency-title]",state.colony.emergencyMode?"EMERGENCY MODE ACTIVE":"EMERGENCY MODE");this.setLandText(body,"[data-emergency-copy]",state.colony.emergencyMode?"Industry and Build/Ore extraction are shut down while Food and Fuel remain prioritised.":"Use this when survival stocks are collapsing.");const button=body.querySelector("[data-emergency]");if(button){button.classList.toggle("warn",state.colony.emergencyMode);button.textContent=state.colony.emergencyMode?"EXIT EMERGENCY MODE":"ENTER EMERGENCY MODE";}
  }
  configureColonyManagement(body,{s,completed,relocation}){
    const renew=body.querySelector("[data-renew]");if(renew){renew.hidden=s.status!="holdover";this.setLandText(renew,"[data-renew-years]",CONFIG.RENEWAL_YEARS);this.setLandText(renew,"[data-renew-fee]",formatMoney(this.contracts.renewalFee(s)));}const end=body.querySelector("[data-end]");if(end)end.hidden=!completed;const open=body.querySelector("[data-new]");if(open)open.hidden=!this.contracts.canOpenAdditional(s);const relocate=body.querySelector("[data-relocate]");if(relocate){relocate.hidden=s.status!="liability";relocate.disabled=!(s.company.cash>=relocation&&s.portfolio.colonies.length>1);this.setLandText(relocate,"[data-relocate-cost]",formatMoney(relocation));}
  }
  bindColonyLandActions(body,{s}){
    const request=amount=>{const result=this.transport.request(s,amount);if(!result.ok){this.toast(result.reason);return;}this.logEvent?.("transport-ordered",`Dedicated transport ordered for ${formatNumber(result.amount)} colonists; ETA ${CONFIG.DEDICATED_TRANSPORT_DAYS} days.`,{quantity:result.amount,cost:result.cost,arrivalDay:result.arrivalDay});this.repo.save(s);this.toast(`${formatNumber(result.amount)} colonists ordered • ETA ${CONFIG.DEDICATED_TRANSPORT_DAYS}d • ${formatMoney(result.cost)}`);this.landColonyPanel();};
    body.querySelectorAll("[data-land-transport]").forEach(button=>button.onclick=()=>request(button.dataset.landTransport=="max"?this.transport.availableCapacity(s):+button.dataset.landTransport));const custom=body.querySelector("[data-land-transport-request]");if(custom)custom.onclick=()=>request(+body.querySelector("[data-land-transport-custom]").value);
    const emergency=body.querySelector("[data-emergency]");if(emergency)emergency.onclick=()=>{s.colony.emergencyMode=!s.colony.emergencyMode;this.onRecalculate?.();this.logEvent?.("emergency-mode",`Emergency Mode ${s.colony.emergencyMode?"enabled":"disabled"}.`,{enabled:s.colony.emergencyMode});this.repo.save(s);this.toast(s.colony.emergencyMode?"Emergency Mode active.":"Emergency Mode ended.");this.landColonyPanel();};
    const renew=body.querySelector("[data-renew]");if(renew)renew.onclick=()=>{const before=s.contract.renewals||0,cash=s.company.cash,result=this.contracts.renew(s);if(result.ok){this.logEvent?.("contract-renewed",`${s.contract.colonyName} renewed its contract for ${s.contract.renewals} renewal term(s).`,{renewal:s.contract.renewals,fee:cash-s.company.cash,before});this.onRecalculate?.();this.repo.save(s);this.toast(`Contract renewed for ${result.years} years.`);this.landColonyPanel();}else this.toast(result.reason);};
    const end=body.querySelector("[data-end]");if(end)end.onclick=()=>this.endContractDialog();const newColony=body.querySelector("[data-new]");if(newColony)newColony.onclick=()=>this.contractBoard();const all=body.querySelector("[data-all-colonies]");if(all)all.onclick=()=>this.coloniesPanel();const relocate=body.querySelector("[data-relocate]");if(relocate)relocate.onclick=()=>this.onRelocateColony?.();const reselect=body.querySelector("[data-reselect]");if(reselect)reselect.onclick=()=>this.landSelection({abandon:true});
  }
}
