import { formatMoney, formatNumber } from "../core/utils.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates } from "../core/view-template.js";
import { OPERATING_MODES,operatingMode,riskExposure,accidentDetails,isAccidentShutdown,OVERDRIVE_RISK_PERIOD } from "../domain/extraction-overdrive.js";

export const RESOURCE_VIEW_PATHS={
  unsurveyed:"./views/resource-unsurveyed-panel.html",
  site:"./views/resource-site-panel.html",
  overdrive:"./views/resource-overdrive-card.html",
  company:"./views/corporation-summary.html"
};
preloadViewTemplates(Object.values(RESOURCE_VIEW_PATHS));

export class ResourceUIMixin {
  setResourceText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");return node;}
  resourceViewSource(path,label,retry){
    const source=getLoadedViewTemplate(path);if(source)return source;
    loadViewTemplate(path).then(()=>retry?.()).catch(error=>{this.diagnostics?.error?.(`${label} view failed`,error);this.toast(`Unable to open ${label}.`);});
    this.toast(`Loading ${label}...`);return null;
  }
  setResourcePanel(title,source,icon=""){const fragment=document.createRange().createContextualFragment(`${this.panelTitle(title,icon)}${source}`);this.tilePanel.replaceChildren(fragment);}
  showResourcePanel(){this.tilePanel.classList.remove("hidden");const close=this.tilePanel.querySelector("[data-close]");if(close)close.onclick=()=>this.tilePanel.classList.add("hidden");}
  setResourceQuality(root,quality){const host=root.querySelector("[data-resource-quality]");if(!host)return;const[label,cls]=this.resources.qualityBand(quality),span=document.createElement("span");span.className=cls;span.textContent=`Q${formatNumber(quality)} • ${label}`;host.replaceChildren(span);}

  tile(tile){
    if(!tile.revealed){this.renderUnsurveyedTile(tile);return;}
    this.renderResourceTile(tile);
  }
  renderUnsurveyedTile(tile){
    const source=this.resourceViewSource(RESOURCE_VIEW_PATHS.unsurveyed,"survey details",()=>this.tile(tile));if(!source)return;
    const days=this.survey.days(this.state,tile.x,tile.y),active=this.survey.isActive(this.state,tile.x,tile.y),queued=this.survey.isQueued(this.state,tile.x,tile.y);
    this.setResourcePanel(`Unsurveyed sector ${tile.x},${tile.y}`,source);this.setResourceText(this.tilePanel,"[data-survey-hint]",this.world.hint(this.state,tile.x,tile.y));this.setResourceText(this.tilePanel,"[data-survey-time]",`${days} days`);this.setResourceText(this.tilePanel,"[data-survey-slots]",`${this.state.scans.length}/${this.survey.slots(this.state)}`);
    const scan=this.tilePanel.querySelector("[data-scan]");scan.disabled=active||queued||this.state.contract.ended;scan.textContent=this.state.contract.ended?"CONTRACT ENDED":active?"SURVEY ACTIVE":queued?"QUEUED":"QUEUE SURVEY";
    this.showResourcePanel();scan.onclick=()=>{const result=this.survey.enqueue(this.state,tile.x,tile.y);if(result.ok){this.tilePanel.classList.add("hidden");this.toast(result.active?"Survey started.":"Added to survey queue.");}};
  }
  renderResourceTile(tile){
    const source=this.resourceViewSource(RESOURCE_VIEW_PATHS.site,"resource details",()=>this.tile(tile));if(!source)return;
    const nominalRate=this.resources.collectionRate(this.state,tile),paused=!!this.state.colony?.emergencyMode&&tile.developed&&!tile.depleted&&tile.type!=="food"&&tile.type!=="fuel",rate=paused?0:nominalRate,category=this.resources.categoryName(tile.type),cls=tile.type,renewable=this.resources.isRenewable(tile),life=tile.developed?this.resources.estimatedLifeYears(this.state,tile):null,remaining=renewable?"Sustainable":formatNumber(tile.reserve),lifeText=paused?"Paused":life===null?"—":renewable?"Permanent":life>=100?`${Math.round(life)}y`:`${life.toFixed(1)}y`,scale=renewable?(tile.abundanceLabel||"Sustainable"):(tile.depositScale||"Finite"),icon=this.icons.svg(tile.resourceId,this.icons.colorFor(tile),30,tile.type),required=tile.requiredMiningLevel||1,techOk=this.technology.canExploit(this.state,tile),stock=this.stockFor(tile);
    this.setResourcePanel(tile.depleted?`${tile.name} — DEPLETED`:tile.name,source,icon);const panel=this.tilePanel;
    const categoryNode=this.setResourceText(panel,"[data-resource-category]",category);categoryNode?.classList.add(cls);this.setResourceText(panel,"[data-resource-rarity]",tile.resourceRarity);this.setResourceQuality(panel,tile.quality);const rateNode=this.setResourceText(panel,"[data-resource-rate]",paused?"PAUSED":`${formatNumber(rate)}/day`);rateNode?.classList.add(cls);this.setResourceText(panel,"[data-resource-stock]",formatNumber(stock));this.setResourceText(panel,"[data-resource-remaining]",remaining);this.setResourceText(panel,"[data-resource-scale-label]",renewable?"Capacity":"Deposit");this.setResourceText(panel,"[data-resource-scale]",scale);this.setResourceText(panel,"[data-resource-life]",lifeText);this.setResourceText(panel,"[data-resource-level]",tile.developed?`L${tile.level}`:"Undeveloped");
    const mining=panel.querySelector("[data-mining-requirement]");mining.textContent=`Mining requirement: L${required} • ${tile.requiredMiningTech||this.resources.unlockName(tile)} ${techOk?"✓":"LOCKED"}`;mining.classList.toggle("locked",!techOk);
    const emergency=panel.querySelector("[data-emergency-pause]");emergency.hidden=!paused;if(paused)emergency.textContent=`Emergency Mode: Build/Ore extraction is paused. Normal rate would be ${formatNumber(nominalRate)}/day.`;
    const unavailable=panel.querySelector("[data-resource-unavailable]");const unavailableText=this.state.status==="dead"?"This colony has been lost. Extraction is permanently disabled.":this.state.contract.ended?"This colony's mining contract has ended. Extraction is disabled.":"";unavailable.hidden=!unavailableText;if(unavailableText)unavailable.textContent=unavailableText;
    this.configureSiteAction(tile);this.showResourcePanel();this.bindSiteActions(tile);this.appendOverdriveCard(tile);
  }
  configureSiteAction(tile){
    const panel=this.tilePanel,develop=panel.querySelector("[data-develop]"),upgrade=panel.querySelector("[data-upgrade]"),developReason=panel.querySelector("[data-develop-reason]"),upgradeReason=panel.querySelector("[data-upgrade-reason]");develop.hidden=true;upgrade.hidden=true;developReason.hidden=true;upgradeReason.hidden=true;
    if(!tile.depleted&&!tile.developed){const req=this.sites.developRequirements(this.state,tile);develop.hidden=false;develop.disabled=!req.ok;develop.textContent=`DEVELOP • ${formatMoney(req.cash)} + ${formatNumber(req.build)} BUILD`;developReason.hidden=req.ok;if(!req.ok)developReason.textContent=req.reason;return;}
    if(tile.developed){const req=this.sites.upgradeRequirements(this.state,tile);upgrade.hidden=false;upgrade.disabled=!req.ok;upgrade.textContent=`UPGRADE TO L${tile.level+1} • ${formatMoney(req.cash)} + ${formatNumber(req.build)} BUILD`;upgradeReason.hidden=req.ok;if(!req.ok)upgradeReason.textContent=req.reason;}
  }
  bindSiteActions(tile){
    const develop=this.tilePanel.querySelector("[data-develop]");if(develop&&!develop.hidden)develop.onclick=()=>{const result=this.sites.develop(this.state,tile);if(result.ok){this.onRecalculate?.();this.repo.save(this.state);this.toast("Site developed and collection started.");this.tile(tile);}else this.toast(result.reason);};
    const upgrade=this.tilePanel.querySelector("[data-upgrade]");if(upgrade&&!upgrade.hidden)upgrade.onclick=()=>{const result=this.sites.upgrade(this.state,tile);if(result.ok){this.onRecalculate?.();this.repo.save(this.state);this.toast(`Collection upgraded to L${tile.level}.`);this.tile(tile);}else this.toast(result.reason);};
  }

  appendOverdriveCard(tile){
    if(!tile?.developed||!this.collection.supportsOverdrive(tile)||!this.tilePanel||this.tilePanel.classList.contains("hidden"))return;
    const source=this.resourceViewSource(RESOURCE_VIEW_PATHS.overdrive,"operating load",()=>this.tile(tile));if(!source)return;
    const fragment=document.createRange().createContextualFragment(source),card=fragment.querySelector("[data-overdrive-card]");if(!card)return;const mode=operatingMode(tile),profile=OPERATING_MODES[mode],exposure=riskExposure(tile),shutdown=isAccidentShutdown(tile),accident=accidentDetails(tile),workers=this.colony.siteWorkforce(this.state,tile),last=tile.lastAccident,shutdownBlock=card.querySelector("[data-overdrive-shutdown]"),activeBlock=card.querySelector("[data-overdrive-active]");shutdownBlock.hidden=!shutdown;activeBlock.hidden=shutdown;
    if(shutdown)this.populateShutdownCard(card,tile,last,accident);else this.populateOperatingCard(card,{tile,mode,profile,exposure,workers,last});
    this.tilePanel.appendChild(fragment);if(!shutdown)card.querySelectorAll("[data-site-mode]").forEach(button=>button.onclick=()=>{const result=this.collection.setOperatingMode(this.state,tile,button.dataset.siteMode);if(!result.ok){this.toast(result.reason);return;}this.onRecalculate?.();this.repo.save(this.state);this.toast(`${tile.name}: ${result.profile.label} operation selected.`);this.tile(tile);});
  }
  populateShutdownCard(card,tile,last,accident){const days=Math.max(1,Math.ceil(Number(tile.accidentShutdownDays)||0)),outcome=last?.outcome==="fatalities"?`${last.deaths} colonist${last.deaths===1?"":"s"} killed`:"machinery damaged";this.setResourceText(card,"[data-overdrive-accident-name]",last?.name||accident?.name||"Extraction Accident");this.setResourceText(card,"[data-overdrive-reopens]",`${days} day${days===1?"":"s"}`);this.setResourceText(card,"[data-overdrive-shutdown-copy]",`${outcome}. The facility is automatically reset to NORMAL operation and cannot restart until the three-day safety shutdown is complete.`);}
  populateOperatingCard(card,{tile,mode,profile,exposure,workers,last}){
    this.setResourceText(card,"[data-overdrive-mode]",profile.label);this.setResourceText(card,"[data-overdrive-workers]",workers);this.setResourceText(card,"[data-overdrive-risk]",`${exposure.toFixed(1)} / ${OVERDRIVE_RISK_PERIOD}`);
    const host=card.querySelector("[data-site-mode-buttons]"),template=card.querySelector("[data-site-mode-template]"),buttons=document.createDocumentFragment();for(const option of Object.values(OPERATING_MODES)){const row=template.content.cloneNode(true),button=row.querySelector("[data-site-mode]");button.dataset.siteMode=option.key;button.classList.toggle("active",option.key===mode);this.setResourceText(row,"[data-site-mode-label]",option.label);this.setResourceText(row,"[data-site-mode-details]",`${Math.round(option.workforce*100)}% staff • ${Math.round(option.output*100)}% output${option.key==="normal"?"":` • ${option.risk} risk`}`);buttons.append(row);}host.replaceChildren(buttons);
    const effect=card.querySelector("[data-overdrive-effect]");effect.classList.toggle("warn",mode==="hard");effect.classList.toggle("good",mode==="normal");effect.textContent=mode==="normal"?"Normal operation reduces accumulated risk exposure by 1 day per operating day.":mode==="pushed"?"Pushed operation adds 0.3 risk-days per operating day, reaching a 25% accident check after about 100 continuous operating days.":"Hard operation adds 1 risk-day per operating day. Each 30 risk-days triggers a 25% accident check.";
    const lastNode=card.querySelector("[data-last-accident]");lastNode.hidden=!last;if(last)lastNode.textContent=`Last accident: ${last.name} • ${last.outcome==="fatalities"?`${last.deaths} fatalities`:"machinery damage"} • Y${last.year} D${last.day}`;
  }

  company(){
    const source=this.resourceViewSource(RESOURCE_VIEW_PATHS.company,"corporation summary",()=>this.company());if(!source)return;const c=this.state.company,t=c.tech,colonies=this.portfolio.entries(this.state),living=colonies.filter(entry=>entry.data?.status!=="dead").length,daily=colonies.reduce((sum,entry)=>sum+(entry.data?.metrics?.operatingCost||0),0);
    this.open("Mining Corporation",source);const body=this.modal.querySelector(".modal-body");if(!body)return;this.setResourceText(body,"[data-company-cash]",formatMoney(c.cash));this.setResourceText(body,"[data-company-earnings]",formatMoney(c.earn));this.setResourceText(body,"[data-company-wins]",c.wins);this.setResourceText(body,"[data-company-reputation]",c.rep);this.setResourceText(body,"[data-company-colonies]",`${living} operating / ${colonies.length} records`);this.setResourceText(body,"[data-company-operating-cost]",`${formatMoney(daily)}/d`);this.setResourceText(body,"[data-company-power-tech]",`L${t.power}`);this.setResourceText(body,"[data-company-food-tech]",`L${t.food}`);this.setResourceText(body,"[data-company-mining-tech]",`L${t.mining}`);this.setResourceText(body,"[data-company-current-colony]",this.state.contract.colonyName);body.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();
  }
}
