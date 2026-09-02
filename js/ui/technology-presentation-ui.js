import { UIController as LegacyUIController } from "./cash-policy-ui.js";
import { CONFIG } from "../core/config.js";
import { formatMoney,formatNumber } from "../core/utils.js";
import { loadViewTemplate } from "../core/view-template.js";
import { BUILDING_MODEL,SHIP_INFRASTRUCTURE,buildingCapacity,localBuildings,syncBuildingTotals } from "../domain/building-model.js";
import { berthStatus } from "../domain/spaceport-model.js";

const LOCAL_KINDS=["housing","power","industry","headquarters"];
const TECH_CATEGORIES=["housing","power","food","industry","mining","scanning"];
const TECH_LABELS={housing:"HOUSING",power:"POWER",food:"FOOD PRODUCTION",industry:"INDUSTRY",mining:"MINING / EXTRACTION",scanning:"SCANNING / PROSPECTING"};
const TECH_SHORT_LABELS={housing:"HOUSING",power:"POWER",food:"FOOD",industry:"INDUSTRY",mining:"MINING",scanning:"SCANNING"};
const TECH_ICONS={housing:"⌂",power:"⚡",food:"✦",industry:"▦",mining:"⛏",scanning:"◎"};
const PACKAGE_CONTENTS={
  housing:[
    ["Habitat construction kit","Structural modules, seals, pressure systems and life-support integration hardware.",.38],
    ["Fabrication tooling","Jigs, moulds and specialist tools required to build the new housing standard locally.",.18],
    ["Control systems","Environmental, monitoring and safety-control hardware/software for the higher-density habitat.",.13],
    ["Commissioning team","Conglomerate engineers install, test and certify the new housing capability.",.12],
    ["Training & certification","Local operators are trained to build, maintain and safely operate the new housing class.",.09],
    ["Initial specialist spares","Critical components that cannot yet be manufactured locally.",.10]
  ],
  power:[
    ["Generation equipment set","Specialist generation, control and safety equipment for the new power class.",.42],
    ["Fuel / thermal systems","Feed, cooling, containment and conversion equipment specific to the power technology.",.16],
    ["Grid-control package","Power conditioning, load management and proprietary plant-control software.",.14],
    ["Commissioning team","Power engineers install, test and bring the first system to operational standard.",.11],
    ["Training & certification","Local plant operators receive operating, maintenance and emergency certification.",.08],
    ["Initial specialist spares","Critical imported components and replacement assemblies.",.09]
  ],
  food:[
    ["Production system hardware","Growing, nutrient, atmospheric and environmental-control equipment for the new food method.",.34],
    ["Biological / process package","Starter cultures, process standards and proprietary production parameters where required.",.18],
    ["Control & monitoring systems","Automation, yield monitoring and environmental-control software.",.17],
    ["Commissioning team","Agricultural/process specialists install and validate the production capability.",.12],
    ["Training & certification","Local teams learn operation, maintenance and quality-control procedures.",.10],
    ["Initial specialist consumables","Non-local specialist parts and startup consumables.",.09]
  ],
  industry:[
    ["Production machinery","Machine tools, automation equipment and specialist fabrication systems for the new industrial level.",.40],
    ["Precision tooling","Jigs, cutters, dies, metrology and calibration equipment required for higher-grade production.",.19],
    ["Automation & software","Proprietary control, scheduling, machine and material-utilisation systems.",.15],
    ["Commissioning team","Industrial engineers install, calibrate and validate the upgraded production capability.",.11],
    ["Training & certification","Local technicians are trained on the new machinery and process standards.",.07],
    ["Initial specialist spares","Imported replacement components for systems not yet locally manufacturable.",.08]
  ],
  mining:[
    ["Extraction machinery","Core excavation, drilling, pressure-control or separation equipment required by this extraction class.",.44],
    ["Specialist tooling","Cutters, heads, liners, pumps, containment and deposit-specific working equipment.",.19],
    ["Control & safety systems","Automation, monitoring, geological-control and safety systems for the extraction method.",.13],
    ["Commissioning team","Mining engineers install, calibrate and prove the equipment against operational standards.",.10],
    ["Operator training","Local mining crews are trained to use the equipment efficiently and safely.",.06],
    ["Initial specialist spares","High-wear imported parts and specialist replacements for the new equipment.",.08]
  ],
  scanning:[
    ["Sensor suite","Primary geophysical, spectral, seismic or quantum sensing hardware for this detection level.",.43],
    ["Calibration equipment","Reference instruments, emitters, receivers and calibration standards needed for accurate surveys.",.17],
    ["Analysis systems","Processing hardware plus proprietary signal-processing and interpretation software.",.16],
    ["Commissioning team","Survey engineers install the suite, align sensors and validate detection performance.",.10],
    ["Survey-team training","Local survey crews are trained to operate the equipment and interpret the new data products.",.07],
    ["Initial specialist spares","Imported sensor modules, precision components and replacement calibration hardware.",.07]
  ]
};
const FINAL_DEPLOYMENT_STATES=new Set(["complete","cancelled"]);
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
  capacityText(kind,value){return kind==="housing"?`${formatNumber(value)} housing`:kind==="power"?`${formatNumber(value)} power`:kind==="headquarters"?`${formatNumber(value)} command capacity`:`${formatNumber(value)} Industry`;}
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
    this.setPresentationText(card,"[data-local-housing]",`${formatNumber(this.state.pop)} / ${formatNumber(totals.housing)}`);this.setPresentationText(card,"[data-local-power]",`${formatNumber(m.powerDemand||0)} / ${formatNumber(totals.power)}`);this.setPresentationText(card,"[data-local-industry]",`${formatNumber(m.industry||0)} / ${formatNumber(totals.industry)}`);this.setPresentationText(card,"[data-ship-housing]",formatNumber(this.state.colony?.shipHousing||0));this.setPresentationText(card,"[data-ship-power]",SHIP_INFRASTRUCTURE.power);this.setPresentationText(card,"[data-ship-industry]",SHIP_INFRASTRUCTURE.industry);
    const management=body.querySelector(".colony-management");if(management)management.before(fragment);else body.appendChild(fragment);
  }
  colonyPanel(){if(this.state.status==="dead")return super.colonyPanel();return this.landColonyPanel();}

  company(){super.company();const body=this.modal.querySelector(".grid2");if(!body)return;for(const [label,cat] of [["Housing capability (colony)","housing"],["Industry capability (colony)","industry"],["Scanning capability (colony)","scanning"]])this.appendMetric(body,label,`L${this.technology.level(this.state,cat)}`);}
  techEffect(category,tech){
    if(category==="housing")return`Allows Housing buildings up to L${tech.level} • L${tech.level} provides ${formatNumber(buildingCapacity("housing",tech.level))} housing per building.`;
    if(category==="power")return`Allows Power buildings up to L${tech.level} • L${tech.level} generates ${formatNumber(buildingCapacity("power",tech.level))} Power • fuel intensity ${tech.fuelIntensity.toFixed(3)}×.`;
    if(category==="food")return`Allows Food facilities up to L${tech.level} • production ×${tech.productionMultiplier.toFixed(2)}${tech.syntheticFood?` • synthetic Food ${formatNumber(tech.syntheticFood)}/day`:""}.`;
    if(category==="industry")return`Allows Industry buildings up to L${tech.level} • L${tech.level} provides ${formatNumber(buildingCapacity("industry",tech.level))} Industry • workforce ×${tech.workforceEfficiency.toFixed(2)} • Ore use ×${tech.oreEfficiency.toFixed(2)} • processing ×${tech.processingEfficiency.toFixed(2)}.`;
    if(category==="scanning")return`Detects resources requiring Scanning L${tech.level} • ${tech.surveySlots} survey slot${tech.surveySlots===1?"":"s"} • first-survey time ×${tech.scanTimeFactor.toFixed(3)} • hint tier ${tech.hintTier} • eligible rescans take 50% of equivalent first-survey time.`;
    const unlocks=this.resources.catalog().filter(r=>r.miningLevel===tech.level&&!r.manufactured).map(r=>r.name);return`${unlocks.length?`Extraction equipment for: ${unlocks.join(", ")}`:"Advanced extraction equipment"} • mining workforce ×${tech.workforceEfficiency.toFixed(2)}.`;
  }
  technologyMetrics(category,tech){
    if(category==="housing")return[["PACKAGE",formatMoney(tech.cost)],["MAX BUILD",`L${tech.level}`],["HOUSING",formatNumber(buildingCapacity("housing",tech.level))],["ACTIVATION",tech.level===1?"INCLUDED":"SHIP"]];
    if(category==="power")return[["PACKAGE",formatMoney(tech.cost)],["MAX BUILD",`L${tech.level}`],["POWER",formatNumber(buildingCapacity("power",tech.level))],["FUEL",`${tech.fuelIntensity.toFixed(3)}×`]];
    if(category==="food")return[["PACKAGE",formatMoney(tech.cost)],["MAX FACILITY",`L${tech.level}`],["OUTPUT",`${tech.productionMultiplier.toFixed(2)}×`],["SYNTHETIC",`${formatNumber(tech.syntheticFood||0)}/d`]];
    if(category==="industry")return[["PACKAGE",formatMoney(tech.cost)],["MAX BUILD",`L${tech.level}`],["INDUSTRY",formatNumber(buildingCapacity("industry",tech.level))],["ORE USE",`${tech.oreEfficiency.toFixed(2)}×`]];
    if(category==="scanning")return[["PACKAGE",formatMoney(tech.cost)],["DETECTION",`L${tech.level}`],["SURVEYS",tech.surveySlots],["TIME",`${tech.scanTimeFactor.toFixed(3)}×`]];
    const unlocks=this.resources.catalog().filter(r=>r.miningLevel===tech.level&&!r.manufactured);return[["PACKAGE",formatMoney(tech.cost)],["UNLOCKS",`${unlocks.length} resource${unlocks.length===1?"":"s"}`],["WORKFORCE",`${tech.workforceEfficiency.toFixed(2)}×`],["ACTIVATION",tech.level===1?"INCLUDED":"SHIP"]];
  }
  packageCostBreakdown(category,total){
    const components=PACKAGE_CONTENTS[category]||[],cost=Math.max(0,Math.round(Number(total)||0)),rounding=cost>=1000?100:1;let allocated=0;
    return components.map((component,index)=>{const componentCost=index===components.length-1?Math.max(0,cost-allocated):Math.max(0,Math.round(cost*component[2]/rounding)*rounding);allocated+=componentCost;return{label:component[0],description:component[1],cost:componentCost};});
  }
  deploymentForUpgrade(category,level){
    return[...this.technology.deployments(this.state)].reverse().find(deployment=>deployment.upgrades?.some(upgrade=>upgrade.category===category&&Number(upgrade.level)===Number(level)))||null;
  }
  upgradeFromDeployment(deployment,category,level){return deployment?.upgrades?.find(upgrade=>upgrade.category===category&&Number(upgrade.level)===Number(level))||null;}
  absoluteDayText(value){
    const absolute=Math.max(1,Math.floor(Number(value)||1)),year=Math.floor((absolute-1)/CONFIG.DAYS_PER_YEAR)+1,day=(absolute-1)%CONFIG.DAYS_PER_YEAR+1;return`Y${year} D${day}`;
  }
  deploymentDisplayId(deployment,allDeployments){
    const chronological=[...allDeployments].sort((a,b)=>(Number(a.orderAbsoluteDay)||0)-(Number(b.orderAbsoluteDay)||0)),index=Math.max(0,chronological.indexOf(deployment));return`ENG-${String(index+1).padStart(3,"0")}`;
  }
  technologySelection(category,tech){
    const level=this.technology.level(this.state,category),companyLevel=this.technology.companyLevel(this.state,category),pending=this.technology.pendingForCategory(this.state,category),pendingUpgrade=this.upgradeFromDeployment(pending,category,tech.level),historical=this.deploymentForUpgrade(category,tech.level),historicalUpgrade=this.upgradeFromDeployment(historical,category,tech.level),ordered=!!pendingUpgrade,owned=tech.level<level,current=tech.level===level,next=tech.level===level+1,future=tech.level>level+1;
    return{level,companyLevel,pending,pendingUpgrade,historical,historicalUpgrade,ordered,owned,current,next,future};
  }
  selectedTechnology(category){
    const tree=this.technology.tree(category),level=this.technology.level(this.state,category),pending=this.technology.pendingForCategory(this.state,category),pendingLevel=pending?.upgrades?.find(upgrade=>upgrade.category===category)?.level||0,max=tree.length;
    let selected=Number(this.techSelectedLevel)||0;if(this.techSelectedCategory!==category||selected<1||selected>max)selected=pendingLevel||Math.min(max,level+1)||level;
    if(!this.showFutureTech&&selected>level+1&&selected!==pendingLevel)selected=Math.min(max,level+1)||level;
    this.techSelectedCategory=category;this.techSelectedLevel=selected;return tree[selected-1]||tree[level-1]||tree[0]||null;
  }

  async tech(){
    this.onRecalculate?.();if(this.showFutureTech===undefined)this.showFutureTech=true;if(!TECH_CATEGORIES.includes(this.techSelectedCategory))this.techSelectedCategory=this.technology.deployments(this.state,{activeOnly:true})[0]?.upgrades?.[0]?.category||"housing";
    const source=await this.loadPresentationView(VIEW_PATHS.technology,"corporate capability packages");if(!source)return;
    this.open("Corporate Capability Packages",source);const body=this.modal.querySelector(".modal-body");if(!body)return;
    body.addEventListener("click",event=>this.handleTechnologyClick(event));this.renderTechnologyScreen(body);
  }
  renderTechnologyScreen(body){
    if(!body?.isConnected||body!==this.modal.querySelector(".modal-body"))return;const access=this.technology.canAccessStore(this.state),category=this.techSelectedCategory||"housing",tech=this.selectedTechnology(category);
    this.setPresentationText(body,"[data-tech-access-title]",access?"CORPORATE ENGINEERING SUPPORT ONLINE":"CORPORATE ENGINEERING SUPPORT UNAVAILABLE");this.setPresentationText(body,"[data-tech-access-text]",this.technology.accessText(this.state));this.setPresentationText(body,"[data-tech-cash]",formatMoney(this.state.company.cash));this.setPresentationText(body,"[data-tech-toggle]",this.showFutureTech?"FUTURE: ON":"FUTURE: OFF");
    this.populateTechnologyCategories(body);this.populateTechnologyLevels(body,category);if(tech)this.renderTechnologyDetail(body,category,tech,access);this.populateEngineeringDeliveryLedger(body);
  }
  populateTechnologyCategories(body){
    const host=body.querySelector("[data-tech-categories]"),fragment=document.createDocumentFragment();
    for(const category of TECH_CATEGORIES){const row=this.cloneViewTemplate(body,"[data-tech-category-template]");if(!row)continue;const button=row.querySelector("[data-tech-category]");button.dataset.techCategory=category;button.classList.toggle("active",category===this.techSelectedCategory);button.setAttribute("aria-pressed",category===this.techSelectedCategory?"true":"false");this.setPresentationText(button,"[data-tech-category-icon]",TECH_ICONS[category]);this.setPresentationText(button,"[data-tech-category-label]",TECH_SHORT_LABELS[category]);this.setPresentationText(button,"[data-tech-category-level]",`L${this.technology.level(this.state,category)}`);fragment.append(row);}host?.replaceChildren(fragment);
  }
  populateTechnologyLevels(body,category){
    const tree=this.technology.tree(category),level=this.technology.level(this.state,category),pending=this.technology.pendingForCategory(this.state,category),pendingLevel=pending?.upgrades?.find(upgrade=>upgrade.category===category)?.level||0,host=body.querySelector("[data-tech-levels]"),fragment=document.createDocumentFragment();host?.classList.toggle("five",tree.length===5);
    for(const tech of tree){const owned=tech.level<level,current=tech.level===level,ordered=tech.level===pendingLevel,next=tech.level===level+1,future=tech.level>level+1&&!ordered;if(!this.showFutureTech&&future)continue;const row=this.cloneViewTemplate(body,"[data-tech-level-template]");if(!row)continue;const button=row.querySelector("[data-tech-level]");button.dataset.techLevel=String(tech.level);button.classList.add(ordered?"pending":owned?"owned":current?"current":next?"next":"future");button.classList.toggle("selected",tech.level===Number(this.techSelectedLevel));this.setPresentationText(button,"[data-tech-level-label]",`L${tech.level}`);fragment.append(row);}host?.replaceChildren(fragment);
    this.setPresentationText(body,"[data-tech-path-label]",TECH_LABELS[category]);this.setPresentationText(body,"[data-tech-path-level]",`Colony L${level} deployed • Corporation L${this.technology.companyLevel(this.state,category)} authorised`);
  }
  renderTechnologyDetail(body,category,tech,access){
    const state=this.technologySelection(category,tech),deployment=state.pending||state.historical,upgrade=state.pendingUpgrade||state.historicalUpgrade,packageCost=Math.max(0,Number(upgrade?.packageCost??tech.cost)||0),stateLabel=state.ordered?this.technology.deploymentStatusText(state.pending):state.owned?"DEPLOYED":state.current?"CURRENT DEPLOYED":state.next?"NEXT AVAILABLE":"FUTURE PACKAGE";
    this.setPresentationText(body,"[data-tech-detail-level]",`L${tech.level}`);this.setPresentationText(body,"[data-tech-detail-name]",tech.name);this.setPresentationText(body,"[data-tech-detail-description]",tech.description);this.setPresentationText(body,"[data-tech-detail-state]",stateLabel);this.setPresentationText(body,"[data-tech-effect]",this.techEffect(category,tech));this.setPresentationText(body,"[data-tech-package-intro]",tech.level===1?"This capability is included in the original conglomerate colony-start package.":`This is a physical ${TECH_SHORT_LABELS[category].toLowerCase()} capability package for this colony — not ownership of the conglomerate's underlying technology or intellectual property.`);
    this.populateTechnologyMetrics(body,category,tech);this.populateTechnologyPackageContents(body,category,packageCost);this.populateTechnologyCosts(body,category,tech,state,deployment,packageCost);this.configureTechnologyAction(body,category,tech,state,access);
  }
  populateTechnologyMetrics(body,category,tech){
    const host=body.querySelector("[data-tech-metrics]"),fragment=document.createDocumentFragment();for(const [label,value] of this.technologyMetrics(category,tech)){const row=this.cloneViewTemplate(body,"[data-tech-metric-template]");if(!row)continue;this.setPresentationText(row,"[data-tech-metric-label]",label);this.setPresentationText(row,"[data-tech-metric-value]",value);fragment.append(row);}host?.replaceChildren(fragment);
  }
  populateTechnologyPackageContents(body,category,packageCost){
    const host=body.querySelector("[data-tech-package-contents]"),fragment=document.createDocumentFragment(),breakdown=this.packageCostBreakdown(category,packageCost);for(const item of breakdown){const row=this.cloneViewTemplate(body,"[data-tech-package-item-template]");if(!row)continue;this.setPresentationText(row,"[data-tech-package-item-name]",item.label);this.setPresentationText(row,"[data-tech-package-item-description]",item.description);this.setPresentationText(row,"[data-tech-package-item-cost]",packageCost>0?formatMoney(item.cost):"INCLUDED");fragment.append(row);}host?.replaceChildren(fragment);
  }
  addTechnologyCostRow(body,host,label,value,kind=""){const row=this.cloneViewTemplate(body,"[data-tech-cost-row-template]");if(!row)return;const root=row.querySelector("[data-tech-cost-row]");if(kind)root.classList.add(kind);this.setPresentationText(root,"[data-tech-cost-label]",label);this.setPresentationText(root,"[data-tech-cost-value]",value);host.append(row);}
  populateTechnologyCosts(body,category,tech,state,deployment,packageCost){
    const host=body.querySelector("[data-tech-costs]");if(!host)return;host.replaceChildren();for(const item of this.packageCostBreakdown(category,packageCost))this.addTechnologyCostRow(body,host,item.label,packageCost>0?formatMoney(item.cost):"INCLUDED");this.addTechnologyCostRow(body,host,"Upgrade package subtotal",formatMoney(packageCost),"subtotal");
    if(tech.level===1){this.addTechnologyCostRow(body,host,"Engineering Ship transport","INCLUDED","transport");this.addTechnologyCostRow(body,host,"Colony-start support total",formatMoney(0),"total");return;}
    if(state.next&&!state.ordered){const quote=this.technology.quoteOrder(this.state,category);if(quote.ok){this.addTechnologyCostRow(body,host,"Engineering Ship transport",quote.joinsBatch?"£0 • SHARED":formatMoney(quote.transportCost),"transport");if(quote.joinsBatch)this.addTechnologyCostRow(body,host,"Shared-transport saving",`-${formatMoney(CONFIG.ENGINEERING_SHIP_TRANSPORT_COST)}`,"saving");this.addTechnologyCostRow(body,host,"Amount charged if ordered now",formatMoney(quote.total),"total");}else{this.addTechnologyCostRow(body,host,"Engineering Ship transport",formatMoney(CONFIG.ENGINEERING_SHIP_TRANSPORT_COST),"transport");this.addTechnologyCostRow(body,host,"Order total","UNAVAILABLE","total");}return;}
    if(deployment){this.addTechnologyCostRow(body,host,"Delivery package subtotal",formatMoney(deployment.packageSubtotal||0),"subtotal");this.addTechnologyCostRow(body,host,"Engineering Ship transport",formatMoney(deployment.transportCost||0),"transport");if((deployment.sharedTransportSaving||0)>0)this.addTechnologyCostRow(body,host,"Shared-transport saving",`-${formatMoney(deployment.sharedTransportSaving)}`,"saving");const net=Math.max(0,(Number(deployment.paidTotal)||0)-(Number(deployment.refund)||0));this.addTechnologyCostRow(body,host,deployment.status==="cancelled"?"Net cancellation cost":"Delivery total paid",formatMoney(net),"total");return;}
    this.addTechnologyCostRow(body,host,"Engineering Ship transport",formatMoney(CONFIG.ENGINEERING_SHIP_TRANSPORT_COST),"transport");this.addTechnologyCostRow(body,host,"Indicative package + ship total",formatMoney(packageCost+CONFIG.ENGINEERING_SHIP_TRANSPORT_COST),"total");
  }
  configureTechnologyAction(body,category,tech,state,access){
    const button=body.querySelector("[data-tech-order]"),requirement=body.querySelector("[data-tech-requirement]");if(!button||!requirement)return;button.dataset.techOrder=category;
    if(tech.level===1){button.disabled=true;button.textContent="INCLUDED";requirement.textContent="Included in the original conglomerate colony-start package.";return;}
    if(state.ordered){button.disabled=true;button.textContent="ORDERED";requirement.textContent=`Paid package is awaiting ${this.technology.deploymentStatusText(state.pending).toLowerCase()} and commissioning at this colony.`;return;}
    if(state.current||state.owned){button.disabled=true;button.textContent="DEPLOYED";requirement.textContent="Package delivered, commissioned and physically active at this colony.";return;}
    if(state.future){button.disabled=true;button.textContent="SEQUENTIAL";requirement.textContent=`Requires deployed ${TECH_LABELS[category]} L${tech.level-1} first.`;return;}
    const quote=this.technology.quoteOrder(this.state,category);button.disabled=!access||!quote.ok||this.state.company.cash<quote.total;button.textContent=quote.ok?`ORDER • ${formatMoney(quote.total)}${quote.joinsBatch?" • SHARED SHIP":""}`:quote.reason;requirement.textContent=!access?this.technology.accessText(this.state):quote.ok?(quote.joinsBatch?"Joins today's Engineering Ship batch • transport already paid.":`Creates a new Engineering Ship deployment • ${CONFIG.ENGINEERING_PREPARATION_DAYS}-day preparation before launch.`):quote.reason;
  }
  populateEngineeringDeliveryLedger(body){
    const deployments=this.technology.deployments(this.state),host=body.querySelector("[data-tech-deliveries]"),empty=body.querySelector("[data-tech-deliveries-empty]"),fragment=document.createDocumentFragment(),ordered=[...deployments].sort((a,b)=>(Number(b.orderAbsoluteDay)||0)-(Number(a.orderAbsoluteDay)||0)),active=deployments.filter(d=>!FINAL_DEPLOYMENT_STATES.has(d.status)).length,netSpend=deployments.reduce((sum,d)=>sum+Math.max(0,(Number(d.paidTotal)||0)-(Number(d.refund)||0)),0);
    this.setPresentationText(body,"[data-tech-delivery-summary]",`${deployments.length} ORDER${deployments.length===1?"":"S"} • ${active} ACTIVE • ${formatMoney(netSpend)} NET SPEND`);if(empty)empty.hidden=deployments.length>0;
    for(const deployment of ordered){const row=this.cloneViewTemplate(body,"[data-tech-delivery-template]");if(!row)continue;const card=row.querySelector("[data-tech-delivery]");card.classList.add(deployment.status||"unknown");this.setPresentationText(card,"[data-tech-delivery-id]",this.deploymentDisplayId(deployment,deployments));this.setPresentationText(card,"[data-tech-delivery-upgrades]",(deployment.upgrades||[]).map(upgrade=>`${TECH_SHORT_LABELS[upgrade.category]||upgrade.category} L${upgrade.level} ${formatMoney(upgrade.packageCost||0)}`).join(" • ")||"No upgrade packages");this.setPresentationText(card,"[data-tech-delivery-meta]",`Ordered ${this.absoluteDayText(deployment.orderAbsoluteDay)} • packages ${formatMoney(deployment.packageSubtotal||0)} • ship ${formatMoney(deployment.transportCost||0)}`);this.setPresentationText(card,"[data-tech-delivery-status]",this.technology.deploymentStatusText(deployment));const net=Math.max(0,(Number(deployment.paidTotal)||0)-(Number(deployment.refund)||0));this.setPresentationText(card,"[data-tech-delivery-total]",formatMoney(net));const cancel=card.querySelector("[data-engineering-cancel]");cancel.dataset.engineeringCancel=deployment.id;cancel.hidden=!["batching","preparing"].includes(deployment.status);fragment.append(row);}host?.replaceChildren(fragment);
  }
  handleTechnologyClick(event){
    const body=event.currentTarget;if(!body||body!==this.modal.querySelector(".modal-body"))return;const close=event.target.closest?.("[data-tech-close]");if(close){this.modal.classList.add("hidden");return;}
    const cancel=event.target.closest?.("[data-engineering-cancel]");if(cancel){const result=this.technology.cancelDeployment(this.state,cancel.dataset.engineeringCancel);if(result.ok){this.repo.save(this.state);this.toast(`Engineering Deployment cancelled • ${formatMoney(result.refund)} refunded.`);this.renderTechnologyScreen(body);}else this.toast(result.reason);return;}
    const toggle=event.target.closest?.("[data-tech-toggle]");if(toggle){this.showFutureTech=!this.showFutureTech;this.renderTechnologyScreen(body);return;}
    const categoryButton=event.target.closest?.("[data-tech-category]");if(categoryButton){this.techSelectedCategory=categoryButton.dataset.techCategory;this.techSelectedLevel=0;this.renderTechnologyScreen(body);return;}
    const levelButton=event.target.closest?.("[data-tech-level]");if(levelButton){this.techSelectedLevel=Number(levelButton.dataset.techLevel)||1;this.renderTechnologyScreen(body);return;}
    const order=event.target.closest?.("[data-tech-order]");if(!order||order.disabled)return;const result=this.technology.orderUpgrade(this.state,order.dataset.techOrder);if(result.ok){this.repo.save(this.state);this.toast(result.joinsBatch?`${result.tech.name} added to today's Engineering Ship deployment.`:`${result.tech.name} ordered • Engineering Ship preparation starts at day end.`);this.renderTechnologyScreen(body);}else this.toast(result.reason);
  }

  async spaceportPanel(){
    const source=await this.loadPresentationView(VIEW_PATHS.spaceport,"spaceport");if(!source)return false;const status=berthStatus(this.state);this.open(`${this.state.contract?.colonyName||"Colony"} — Spaceport`,source);const body=this.modal.querySelector(".modal-body");if(!body)return false;this.setPresentationText(body,"[data-spaceport-level]",`L${status.level}`);this.setPresentationText(body,"[data-spaceport-berths]",`${status.used} / ${status.capacity}`);this.setPresentationText(body,"[data-spaceport-free]",status.free);
    this.renderSpaceportShips(body,"[data-spaceport-landed]","[data-spaceport-landed-empty]",status.occupants.map(ship=>({name:ship.label,detail:ship.type==="engineering-ship"?this.technology.deploymentStatusText(ship.deployment):ship.type==="corporate-ship"?"Conglomerate trade/support visit":"Player-owned colony ship"})));
    const orbit=[];if(this.state.trade?.orbitalHolding)orbit.push({name:"Corporate Ship",detail:"ORBITAL HOLDING — waiting for Spaceport berth"});for(const deployment of this.technology.deployments(this.state,{activeOnly:true}).filter(d=>d.status==="orbital-holding"))orbit.push({name:"Engineering Ship",detail:`${this.technology.deploymentStatusText(deployment)} • ${(deployment.upgrades||[]).map(u=>`${TECH_LABELS[u.category]||u.category} L${u.level}`).join(", ")}`});this.renderSpaceportShips(body,"[data-spaceport-orbit]","[data-spaceport-orbit-empty]",orbit);
    const company=body.querySelector("[data-spaceport-company]");if(company)company.onclick=()=>this.company();const player=body.querySelector("[data-spaceport-player-ship]"),ship=this.state.company?.expansion?.ship,docked=ship?.status==="docked"&&ship.colonyId===this.state.colonyId;if(player){player.hidden=!docked;player.onclick=()=>this.playerShipPanel?.();}return true;
  }
  renderSpaceportShips(body,hostSelector,emptySelector,ships){const host=body.querySelector(hostSelector),empty=body.querySelector(emptySelector),fragment=document.createDocumentFragment();if(empty)empty.hidden=ships.length>0;for(const ship of ships){const row=this.cloneViewTemplate(body,"[data-spaceport-ship-template]");if(!row)continue;this.setPresentationText(row,"[data-spaceport-ship-name]",ship.name);this.setPresentationText(row,"[data-spaceport-ship-detail]",ship.detail);fragment.append(row);}host?.replaceChildren(fragment);}
}
