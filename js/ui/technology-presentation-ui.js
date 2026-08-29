import { UIController as LegacyUIController } from "./cash-policy-ui.js";
import { formatMoney,formatNumber } from "../core/utils.js";
import { loadViewTemplate } from "../core/view-template.js";
import { BUILDING_MODEL,SHIP_INFRASTRUCTURE,buildingCapacity,localBuildings,syncBuildingTotals } from "../domain/building-model.js";
import { berthStatus } from "../domain/spaceport-model.js";

const LOCAL_KINDS=["housing","power","industry"];
const TECH_LABELS={housing:"HOUSING",power:"POWER",food:"FOOD PRODUCTION",industry:"INDUSTRY",mining:"MINING / EXTRACTION",scanning:"SCANNING / PROSPECTING"};
const VIEW_PATHS={
  buildChoice:"./views/build-choice.html",
  localBuilding:"./views/local-building-panel.html",
  localInfrastructure:"./views/local-infrastructure-card.html",
  technology:"./views/corporate-technology.html",
  spaceport:"./views/spaceport-panel.html"
};
const findMetric=(root,label)=>[...root.querySelectorAll(".metric")].find(m=>m.querySelector("small")?.textContent.trim()===label)||null;

export class UIController extends LegacyUIController{
  localCost(req){return`${formatNumber(req?.build||0)} Build${(req?.ore||0)>0?` + ${formatNumber(req.ore)} Ore`:""}`;}
  capacityText(kind,value){return kind==="housing"?`${formatNumber(value)} housing`:kind==="power"?`${formatNumber(value)} power`:`${formatNumber(value)} Industry`;}
  setPresentationText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");}
  cloneViewTemplate(root,selector){return root?.querySelector(selector)?.content.cloneNode(true)||null;}
  async loadPresentationView(path,label){try{return await loadViewTemplate(path);}catch(error){this.diagnostics?.error?.(`${label} view failed`,error);this.toast(`Unable to open ${label}.`);return null;}}

  async buildChoice(tile){
    if(!tile?.revealed){this.toast("Survey this tile before construction.");return;}
    const source=await this.loadPresentationView(VIEW_PATHS.buildChoice,"construction choices");if(!source||!tile?.revealed)return;
    const covered=!!tile.resourceId,checks=Object.fromEntries(LOCAL_KINDS.map(kind=>[kind,this.development.canPlace(this.state,tile,kind)]));
    this.open(`Develop ${this.land.terrainLabel(tile.terrain)} Tile`,source);
    const body=this.modal.querySelector(".modal-body");if(!body)return;
    this.setPresentationText(body,"[data-build-choice-title]",covered?`${tile.name} • Q${formatNumber(tile.quality)}`:"CLEAR SURVEYED LAND");
    this.setPresentationText(body,"[data-build-choice-copy]",covered?(tile.type==="food"?"Building here permanently destroys this natural Food resource.":"Local infrastructure can be built here, but the known resource becomes inaccessible until the building is demolished."):"Choose an individual building. Multiple buildings stack; higher-level buildings provide more capacity per tile.");
    this.populateBuildChoices(body,checks);
    body.querySelectorAll("[data-place]").forEach(button=>button.onclick=()=>this.confirmBuildChoice(tile,button.dataset.place,covered));
  }
  populateBuildChoices(body,checks){
    const options=body.querySelector("[data-build-choice-options]"),requirements=body.querySelector("[data-build-choice-requirements]"),optionRows=document.createDocumentFragment(),requirementRows=document.createDocumentFragment();
    for(const kind of LOCAL_KINDS){
      const result=checks[kind],definition=BUILDING_MODEL[kind],option=this.cloneViewTemplate(body,"[data-build-choice-option-template]");if(!option)continue;
      const button=option.querySelector("[data-place]");button.dataset.place=kind;button.disabled=!result.ok;this.setPresentationText(option,"[data-build-choice-label]",`${definition.label.toUpperCase()} L1`);this.setPresentationText(option,"[data-build-choice-detail]",result.ok?`${this.localCost(result)} • +${formatNumber(result.capacity)} ${definition.unit}`:result.reason);optionRows.append(option);
      if(!result.ok){const requirement=this.cloneViewTemplate(body,"[data-build-choice-requirement-template]");if(requirement){this.setPresentationText(requirement,"[data-build-choice-requirement-label]",definition.label);this.setPresentationText(requirement,"[data-build-choice-requirement-reason]",result.reason);requirementRows.append(requirement);}}
    }
    options?.replaceChildren(optionRows);requirements?.replaceChildren(requirementRows);
  }
  confirmBuildChoice(tile,kind,covered){
    if(covered&&!confirm(tile.type==="food"?`Build ${this.development.label(kind)} over ${tile.name}? This Food resource will be permanently destroyed.`:`Build ${this.development.label(kind)} over ${tile.name}? The resource remains underground but cannot be exploited until the building is demolished.`))return;
    this.onPlaceDevelopment?.(tile,kind);
  }

  tile(tile){
    super.tile(tile);if(!tile?.revealed||!tile.resourceId)return;
    if(!tile.developed){const req=this.sites.developRequirements(this.state,tile),button=this.tilePanel.querySelector("[data-develop]");if(button)button.textContent=`DEVELOP • ${formatNumber(req.build||0)} BUILD`;return;}
    const req=this.sites.upgradeRequirements(this.state,tile),button=this.tilePanel.querySelector("[data-upgrade]");if(button&&!req.max)button.textContent=`UPGRADE TO L${tile.level+1} • ${this.localCost(req)}`;
    if(!req.max){const note=document.createElement("div");note.className=`effect ${req.ok?"good":"warn"}`;note.textContent=`Local upgrade requirements: ${formatNumber(req.industryRequired||0)} Industry • ${formatNumber(req.powerRequired||0)} Power • ${formatNumber(req.workforce||0)} additional workers${tile.type==="food"?` • Food Tech L${req.techRequired||tile.level+1}`:` • ${tile.requiredMiningTech||`Mining L${tile.requiredMiningLevel||1}`} unlock retained`}.`;this.tilePanel.appendChild(note);}
  }

  async localBuildingPanel(tile){
    const dev=tile?.development;if(!dev)return;
    const kind=dev.kind,level=Math.max(1,Number(dev.level)||1),source=await this.loadPresentationView(VIEW_PATHS.localBuilding,"building details");if(!source||tile.development?.kind!==kind)return;
    const current=buildingCapacity(kind,level),next=this.development.canUpgrade(this.state,tile),tech=this.development.techLevel(this.state,kind),terrain=this.land.terrainLabel(tile.terrain),covered=tile.resourceId?`${tile.name} • Q${formatNumber(tile.quality)} (covered)`:"No known surface resource",nextCapacity=level<5?buildingCapacity(kind,level+1):current;
    this.open(`${this.development.label(kind)} L${level}`,source);const body=this.modal.querySelector(".modal-body");if(!body)return;
    this.setPresentationText(body,"[data-local-terrain]",terrain);this.setPresentationText(body,"[data-local-contribution]",this.capacityText(kind,current));this.setPresentationText(body,"[data-local-tech-label]",`${TECH_LABELS[kind]} Tech`);this.setPresentationText(body,"[data-local-tech-level]",`L${tech}`);this.setPresentationText(body,"[data-local-geology]",covered);
    const upgradeBlock=body.querySelector("[data-local-upgrade-block]"),maxBlock=body.querySelector("[data-local-max-block]"),upgrade=body.querySelector("[data-local-upgrade]");
    if(level<5){maxBlock.hidden=true;upgradeBlock.hidden=false;upgradeBlock.classList.toggle("good",next.ok);upgradeBlock.classList.toggle("warn",!next.ok);this.setPresentationText(upgradeBlock,"[data-local-upgrade-copy]",next.ok?`L${level+1} provides ${this.capacityText(kind,nextCapacity)} (+${formatNumber(nextCapacity-current)}). Upgrade cost: ${this.localCost(next)}.`:next.reason);upgrade.disabled=!next.ok;this.setPresentationText(upgrade,"[data-local-upgrade-label]",`UPGRADE TO L${level+1}${next.ok?` • ${this.localCost(next)}`:""}`);}
    else{upgradeBlock.hidden=true;maxBlock.hidden=false;}
    if(upgrade)upgrade.onclick=()=>this.upgradeLocalBuilding(tile);
    body.querySelector("[data-demolish]").onclick=()=>{if(confirm(`Demolish ${this.development.label(kind)} L${level}?`))this.onDemolishDevelopment?.(tile);};
  }
  upgradeLocalBuilding(tile){const r=this.development.upgrade(this.state,tile);if(!r.ok){this.toast(r.reason);return;}this.onRecalculate?.();this.repo.save(this.state);this.toast(`${this.development.label(tile.development.kind)} upgraded to L${tile.development.level}.`);this.localBuildingPanel(tile);}

  async landTile(tile){
    if(LOCAL_KINDS.includes(tile?.development?.kind))return this.localBuildingPanel(tile);
    const rendered=await super.landTile(tile);
    if(!rendered||!tile?.revealed||!tile.resourceId||tile.developed||tile.development)return rendered;
    const existing=this.modal.querySelector("[data-cover]");if(!existing)return rendered;const grid=existing.parentElement,power=this.development.canPlace(this.state,tile,"power"),button=document.createElement("button");button.dataset.cover="power";button.textContent="POWER";button.disabled=!power.ok;grid.appendChild(button);if(!power.ok){const note=document.createElement("div");note.className="requirement locked";note.textContent=`Power: ${power.reason}`;grid.closest("article")?.insertAdjacentElement("afterend",note);}button.onclick=()=>{if(confirm(tile.type==="food"?`Build Power Plant over ${tile.name}? This Food resource will be destroyed.`:`Cover ${tile.name} with a Power Plant?`))this.onPlaceDevelopment?.(tile,"power");};
    return true;
  }

  async landColonyPanel(){
    const rendered=await super.landColonyPanel();if(!rendered||this.state.status==="dead"||this.state.status==="site-selection")return rendered;const totals=syncBuildingTotals(this.state),m=this.state.metrics;
    const industry=findMetric(this.modal,"Industry");if(industry){industry.querySelector("small").textContent="Industry effective / installed";industry.querySelector("strong").textContent=`${formatNumber(m.industry||0)} / ${formatNumber(totals.industry)}`;}
    const grid=this.modal.querySelector(".grid2"),powerPlants=localBuildings(this.state,"power").length;if(grid)this.appendMetric(grid,"Power plants",powerPlants);
    const body=this.modal.querySelector(".modal-body");if(body)this.renderLocalInfrastructureCard(body,totals,m);
    for(const node of this.modal.querySelectorAll("p,.effect"))node.textContent=node.textContent.replace(/Housing or Industry/g,"Housing, Power or Industry");
    return true;
  }
  appendMetric(host,label,value){const metric=document.createElement("div"),small=document.createElement("small"),strong=document.createElement("strong");metric.className="metric";small.textContent=label;strong.textContent=String(value);metric.append(small,strong);host.appendChild(metric);return metric;}
  async renderLocalInfrastructureCard(body,totals,m){
    const source=await this.loadPresentationView(VIEW_PATHS.localInfrastructure,"local infrastructure");if(!source||!body.isConnected||body!==this.modal.querySelector(".modal-body"))return;
    const fragment=document.createRange().createContextualFragment(source),card=fragment.querySelector("[data-local-infrastructure-card]");if(!card)return;
    this.setPresentationText(card,"[data-local-housing]",`${formatNumber(this.state.pop)} / ${formatNumber(totals.housing)}`);this.setPresentationText(card,"[data-local-power]",`${formatNumber(m.powerDemand||0)} / ${formatNumber(totals.power)}`);this.setPresentationText(card,"[data-local-industry]",`${formatNumber(m.industry||0)} / ${formatNumber(totals.industry)}`);this.setPresentationText(card,"[data-ship-housing]",SHIP_INFRASTRUCTURE.housing);this.setPresentationText(card,"[data-ship-power]",SHIP_INFRASTRUCTURE.power);this.setPresentationText(card,"[data-ship-industry]",SHIP_INFRASTRUCTURE.industry);
    const management=body.querySelector(".colony-management");if(management)management.before(fragment);else body.appendChild(fragment);
  }
  colonyPanel(){if(this.state.status==="dead")return super.colonyPanel();return this.landColonyPanel();}

  company(){super.company();const body=this.modal.querySelector(".grid2");if(!body)return;for(const [label,cat] of [["Housing capability (colony)","housing"],["Industry capability (colony)","industry"],["Scanning capability (colony)","scanning"]])this.appendMetric(body,label,`L${this.technology.level(this.state,cat)}`);}
  techEffect(category,tech){
    if(category==="housing")return`Allows Housing buildings up to L${tech.level} • L${tech.level} provides ${formatNumber(buildingCapacity("housing",tech.level))} housing per building`;
    if(category==="power")return`Allows Power buildings up to L${tech.level} • L${tech.level} generates ${formatNumber(buildingCapacity("power",tech.level))} • fuel intensity ${tech.fuelIntensity.toFixed(3)}×`;
    if(category==="food")return`Allows Food facilities up to L${tech.level} • production ×${tech.productionMultiplier.toFixed(2)}${tech.syntheticFood?` • synthetic food ${formatNumber(tech.syntheticFood)}/day`:""}`;
    if(category==="industry")return`Allows Industry buildings up to L${tech.level} • L${tech.level} provides ${formatNumber(buildingCapacity("industry",tech.level))} Industry • Ore use ×${tech.oreEfficiency.toFixed(2)}`;
    if(category==="scanning")return`Detects resources requiring Scanning L${tech.level} • ${tech.surveySlots} survey slot${tech.surveySlots===1?"":"s"} • survey time ×${tech.scanTimeFactor.toFixed(3)} • hint tier ${tech.hintTier}`;
    const unlocks=this.resources.catalog().filter(r=>r.miningLevel===tech.level&&!r.manufactured).map(r=>r.name);return`${unlocks.length?`Extraction equipment for: ${unlocks.join(", ")}`:"Advanced extraction equipment"} • mining workforce ×${tech.workforceEfficiency.toFixed(2)}`;
  }

  async tech(){
    this.onRecalculate?.();if(this.showFutureTech===undefined)this.showFutureTech=true;const source=await this.loadPresentationView(VIEW_PATHS.technology,"corporate capability packages");if(!source)return;
    const access=this.technology.canAccessStore(this.state),cats=["housing","power","food","industry","mining","scanning"];
    this.open("Corporate Capability Packages",source);const body=this.modal.querySelector(".modal-body");if(!body)return;
    this.setPresentationText(body,"[data-tech-access-title]",access?"CORPORATE ENGINEERING SUPPORT ONLINE":"CORPORATE ENGINEERING SUPPORT UNAVAILABLE");this.setPresentationText(body,"[data-tech-access-text]",this.technology.accessText(this.state));this.setPresentationText(body,"[data-tech-toggle]",this.showFutureTech?"HIDE FUTURE TECH":"SHOW FUTURE TECH");
    this.populateEngineeringDeployments(body);this.populateTechnologyPaths(body,cats,access);body.addEventListener("click",event=>this.handleTechnologyClick(event));
  }
  populateEngineeringDeployments(body){
    const deployments=this.technology.deployments(this.state,{activeOnly:true}),host=body.querySelector("[data-engineering-deployments]"),empty=body.querySelector("[data-engineering-empty]"),fragment=document.createDocumentFragment();this.setPresentationText(body,"[data-engineering-count]",deployments.length?`${deployments.length} ACTIVE`:"NONE");if(empty)empty.hidden=deployments.length>0;
    for(const deployment of deployments){const row=this.cloneViewTemplate(body,"[data-engineering-deployment-template]");if(!row)continue;const card=row.querySelector("[data-engineering-deployment]");this.setPresentationText(card,"[data-engineering-title]",`ENGINEERING SHIP • ${deployment.upgrades?.length||0} UPGRADE${deployment.upgrades?.length===1?"":"S"}`);this.setPresentationText(card,"[data-engineering-status]",this.technology.deploymentStatusText(deployment));this.setPresentationText(card,"[data-engineering-upgrades]",(deployment.upgrades||[]).map(upgrade=>`${TECH_LABELS[upgrade.category]||upgrade.category} L${upgrade.level} — ${upgrade.name}`).join(" • "));this.setPresentationText(card,"[data-engineering-packages]",formatMoney(deployment.packageSubtotal||0));this.setPresentationText(card,"[data-engineering-transport]",formatMoney(deployment.transportCost||0));this.setPresentationText(card,"[data-engineering-total]",formatMoney(deployment.paidTotal||0));const saving=card.querySelector("[data-engineering-saving]");if(saving)saving.textContent=(deployment.sharedTransportSaving||0)>0?`Shared Engineering Ship transport saved ${formatMoney(deployment.sharedTransportSaving)} versus separate deployments.`:`Additional upgrades ordered today can share this Engineering Ship's transport charge.`;const cancel=card.querySelector("[data-engineering-cancel]");cancel.dataset.engineeringCancel=deployment.id;cancel.hidden=!["batching","preparing"].includes(deployment.status);fragment.append(row);}
    host?.replaceChildren(fragment);
  }
  populateTechnologyPaths(body,cats,access){
    const host=body.querySelector("[data-tech-tree]"),paths=document.createDocumentFragment();
    for(const cat of cats){
      const tree=this.technology.tree(cat),level=this.technology.level(this.state,cat),pending=this.technology.pendingForCategory(this.state,cat),pendingLevel=pending?.upgrades?.find(upgrade=>upgrade.category===cat)?.level||0,items=tree.filter(t=>this.showFutureTech||t.level<=level||t.level===pendingLevel),path=this.cloneViewTemplate(body,"[data-tech-path-template]");if(!path)continue;
      const section=path.querySelector("[data-tech-path]");this.setPresentationText(section,"[data-tech-path-label]",TECH_LABELS[cat]);this.setPresentationText(section,"[data-tech-path-level]",`DEPLOYED L${level}/${tree.length}`);const roadmap=section.querySelector("[data-tech-roadmap]"),cards=document.createDocumentFragment();
      for(const tech of items){const card=this.buildTechnologyCard(body,cat,tech,level,access,pending);if(card)cards.append(card);}roadmap.replaceChildren(cards);paths.append(path);
    }
    host?.replaceChildren(paths);
  }
  buildTechnologyCard(body,category,tech,level,access,pending){
    const fragment=this.cloneViewTemplate(body,"[data-tech-card-template]");if(!fragment)return null;const card=fragment.querySelector("[data-tech-card]"),pendingUpgrade=pending?.upgrades?.find(upgrade=>upgrade.category===category&&upgrade.level===tech.level),ordered=!!pendingUpgrade,owned=tech.level<level,current=tech.level===level,next=tech.level===level+1,future=tech.level>level+1,stateClass=ordered?"next":owned?"owned":current?"current":next?"next":"future",stateLabel=ordered?this.technology.deploymentStatusText(pending):owned?"DEPLOYED":current?"ACTIVE":next?"AVAILABLE":"LOCKED";
    card.classList.add(stateClass);this.setPresentationText(card,"[data-tech-card-level]",`L${tech.level}`);this.setPresentationText(card,"[data-tech-card-name]",tech.name);this.setPresentationText(card,"[data-tech-card-state]",stateLabel);this.setPresentationText(card,"[data-tech-card-description]",tech.description);this.setPresentationText(card,"[data-tech-card-effect]",this.techEffect(category,tech));
    const requirement=card.querySelector("[data-tech-card-requirement]");requirement.hidden=!future&&!ordered;if(future)requirement.textContent=`Requires deployed ${TECH_LABELS[category]} L${tech.level-1}`;else if(ordered)requirement.textContent="Paid package is awaiting Engineering Ship delivery and commissioning at this colony.";
    const action=card.querySelector("[data-tech-card-action]");action.replaceChildren(this.technologyAction(category,tech,{owned,current,next,ordered,access}));return fragment;
  }
  technologyAction(category,tech,{owned,current,next,ordered,access}){const actionable=next&&!ordered,node=document.createElement(actionable?"button":"span");if(actionable){const quote=this.technology.quoteOrder(this.state,category);node.dataset.techCat=category;node.disabled=!access||!quote.ok||this.state.company.cash<quote.total;node.textContent=quote.ok?`ORDER • ${formatMoney(quote.total)}${quote.joinsBatch?" • SHARED SHIP":""}`:quote.reason;}else node.textContent=ordered?"ORDERED":current?"ACTIVE":owned?"✓":"🔒";return node;}
  handleTechnologyClick(event){
    const cancel=event.target.closest?.("[data-engineering-cancel]");if(cancel&&this.modal.contains(cancel)){const result=this.technology.cancelDeployment(this.state,cancel.dataset.engineeringCancel);if(result.ok){this.repo.save(this.state);this.toast(`Engineering Deployment cancelled • ${formatMoney(result.refund)} refunded.`);this.tech();}else this.toast(result.reason);return;}
    const toggle=event.target.closest?.("[data-tech-toggle]");if(toggle){this.showFutureTech=!this.showFutureTech;this.tech();return;}
    const button=event.target.closest?.("[data-tech-cat]");if(!button||!this.modal.contains(button))return;const result=this.technology.orderUpgrade(this.state,button.dataset.techCat);if(result.ok){this.repo.save(this.state);this.toast(result.joinsBatch?`${result.tech.name} added to today's Engineering Ship deployment.`:`${result.tech.name} ordered • Engineering Ship preparation starts at day end.`);this.tech();}else this.toast(result.reason);
  }

  async spaceportPanel(){
    const source=await this.loadPresentationView(VIEW_PATHS.spaceport,"spaceport");if(!source)return false;const status=berthStatus(this.state);this.open(`${this.state.contract?.colonyName||"Colony"} — Spaceport`,source);const body=this.modal.querySelector(".modal-body");if(!body)return false;this.setPresentationText(body,"[data-spaceport-level]",`L${status.level}`);this.setPresentationText(body,"[data-spaceport-berths]",`${status.used} / ${status.capacity}`);this.setPresentationText(body,"[data-spaceport-free]",status.free);
    this.renderSpaceportShips(body,"[data-spaceport-landed]","[data-spaceport-landed-empty]",status.occupants.map(ship=>({name:ship.label,detail:ship.type==="engineering-ship"?this.technology.deploymentStatusText(ship.deployment):ship.type==="corporate-ship"?"Conglomerate trade/support visit":"Player-owned colony ship"})));
    const orbit=[];if(this.state.trade?.orbitalHolding)orbit.push({name:"Corporate Ship",detail:"ORBITAL HOLDING — waiting for Spaceport berth"});for(const deployment of this.technology.deployments(this.state,{activeOnly:true}).filter(d=>d.status==="orbital-holding"))orbit.push({name:"Engineering Ship",detail:`${this.technology.deploymentStatusText(deployment)} • ${(deployment.upgrades||[]).map(u=>`${TECH_LABELS[u.category]||u.category} L${u.level}`).join(", ")}`});this.renderSpaceportShips(body,"[data-spaceport-orbit]","[data-spaceport-orbit-empty]",orbit);
    const company=body.querySelector("[data-spaceport-company]");if(company)company.onclick=()=>this.company();const player=body.querySelector("[data-spaceport-player-ship]"),ship=this.state.company?.expansion?.ship,docked=ship?.status==="docked"&&ship.colonyId===this.state.colonyId;if(player){player.hidden=!docked;player.onclick=()=>this.playerShipPanel?.();}return true;
  }
  renderSpaceportShips(body,hostSelector,emptySelector,ships){const host=body.querySelector(hostSelector),empty=body.querySelector(emptySelector),fragment=document.createDocumentFragment();if(empty)empty.hidden=ships.length>0;for(const ship of ships){const row=this.cloneViewTemplate(body,"[data-spaceport-ship-template]");if(!row)continue;this.setPresentationText(row,"[data-spaceport-ship-name]",ship.name);this.setPresentationText(row,"[data-spaceport-ship-detail]",ship.detail);fragment.append(row);}host?.replaceChildren(fragment);}
}
