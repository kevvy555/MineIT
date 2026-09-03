import { UIController as LegacyUIController } from "./technology-presentation-ui.js";
import { formatNumber } from "../core/utils.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates } from "../core/view-template.js";
import { buildingCapacity,syncBuildingTotals } from "../domain/building-model.js";
import { supportsOverdrive } from "../domain/extraction-overdrive.js";

const LOCAL_KINDS=new Set(["housing","power","industry","headquarters"]);
const RESOURCE_LABEL={food:"FOOD",build:"BUILD",fuel:"FUEL",ore:"ORE"};
const MAP_FIRST_HELP_VIEW="./views/map-first-help-controls.html";
const cap=(v,min=0,max=1)=>Math.max(min,Math.min(max,Number(v)||0));
preloadViewTemplates([MAP_FIRST_HELP_VIEW]);

/** Routine colony play through the persistent HUD and tile context bar. */
export class UIController extends LegacyUIController{
  constructor(options){
    super(options);this.selectedTile=null;this.currentAttention=null;this.onMapFocus=options.onMapFocus;
    this.attentionElement=document.querySelector("#attentionStrip");
    this.attentionClickHandler=()=>this.runAttentionAction();
    this.attentionElement?.addEventListener("click",this.attentionClickHandler);
  }
  dispose(){
    this.attentionElement?.removeEventListener("click",this.attentionClickHandler);
    this.attentionClickHandler=null;this.attentionElement=null;
    super.dispose?.();
  }
  render(){super.render();this.renderMapFirstHud();this.renderContext();}
  selectMapTile(x,y){
    if(!Number.isFinite(x)||!Number.isFinite(y))return;this.activeUndevelopedTile=null;this.selectedTile=this.world.get(this.state,x,y);this.renderContext();
  }
  focusMap(mode="all"){this.onMapFocus?.(mode);}
  daysText(days){return days===null||days===undefined?"SURPLUS":days<=0?"EMPTY":`${Math.max(1,Math.ceil(days))}d`;}
  setText(id,text){const el=document.querySelector(`#${id}`);if(el)el.textContent=text;}
  setState(id,state){const el=document.querySelector(`#${id}`);if(!el)return;el.classList.remove("good","warn","bad");if(state)el.classList.add(state);}
  renderMapFirstHud(){
    if(this.state.status==="site-selection")return;
    const s=this.state,m=s.metrics||{},totals=syncBuildingTotals(s),housing=Math.max(0,totals.housing),power=Math.max(0,totals.power),industry=Math.max(0,totals.industry),free=Math.max(0,Math.floor(Number(m.workforceFree)||0));
    this.setText("housingHud",`${formatNumber(s.pop)} / ${formatNumber(housing)}`);this.setText("powerHud",`${formatNumber(m.powerDelivered||m.powerFactor*(m.powerDemand||0)||0)} / ${formatNumber(m.powerFuelLimitedGeneration??power)} • ${formatNumber(m.powerDemand||0)} req`);this.setText("industryHud",`${formatNumber(m.industry||0)} / ${formatNumber(industry)}`);this.setText("workforceHud",`${formatNumber(free)} FREE`);
    this.setState("housingOp",housing>0&&s.pop/housing>.9?"warn":"good");this.setState("powerOp",(m.powerFactor??1)<.9?"bad":(m.powerFactor??1)<.98?"warn":"good");this.setState("industryOp",(m.industryCommercialFactor??1)<.8?"bad":(m.industryCommercialFactor??1)<.999?"warn":"good");this.setState("workforceOp",(m.workforceShortfall||0)>0?"bad":free<10?"warn":"good");
    this.setText("foodDaysHud",this.daysText(m.foodDays));this.setText("fuelDaysHud",this.daysText(m.fuelDays));this.setText("oreDaysHud",this.daysText(m.oreDays));
    const g=s.contract?.goals||{};for(const [id,value,target] of [["food",m.food,g.food],["ind",m.industry,g.industry],["pop",s.pop,g.pop]]){const pct=target?Math.round(cap(value/target)*100):100;this.setText(`${id}Val`,`${pct}%`);this.setText(`${id}Goal`,`${formatNumber(value||0)} / ${formatNumber(target||0)}`);}
    this.currentAttention=this.attentionStatus();const strip=document.querySelector("#attentionStrip");if(strip){strip.className=`attention-strip ${this.currentAttention.level||"good"}`;this.setText("attentionTitle",this.currentAttention.title);this.setText("attentionDetail",this.currentAttention.detail);this.setText("attentionAction",this.currentAttention.label||"VIEW ›");}
  }
  attentionStatus(){
    const s=this.state,m=s.metrics||{},totals=syncBuildingTotals(s),foodDays=m.foodDays,fuelDays=m.fuelDays,oreDays=m.oreDays;
    if(s.status==="dead")return{level:"bad",title:"COLONY LOST",detail:"Population has reached zero.",label:"OPEN COLONY",action:"colony"};
    if(s.trade?.active)return{level:"warn",title:"CORPORATE SHIP DOCKED",detail:"Resolve trade before corporation time can continue.",label:"OPEN SHIP ›",action:"ship"};
    if((m.foodSupply??1)<.9||foodDays!==null&&foodDays!==undefined&&foodDays<=30)return{level:(m.foodSupply??1)<.5||foodDays<=10?"bad":"warn",title:`FOOD LOW — ${this.daysText(foodDays)}`,detail:"Food demand is consuming reserves faster than production.",label:"SHOW FOOD ›",focus:"food"};
    if((m.powerFactor??1)<.95||Number(m.powerDemand||0)>Number(totals.power||0))return{level:(m.powerFactor??1)<.6?"bad":"warn",title:"POWER SHORTAGE",detail:`Demand ${formatNumber(m.powerDemand||0)} • delivered ${formatNumber(m.powerDelivered||0)} • Fuel-limited ${formatNumber((m.powerFuelLimitedGeneration??totals.power??0))}.`,label:"SHOW POWER ›",focus:"power"};
    if((m.fuelSupply??1)<.9||fuelDays!==null&&fuelDays!==undefined&&fuelDays<=30)return{level:(m.fuelSupply??1)<.5||fuelDays<=10?"bad":"warn",title:`FUEL LOW — ${this.daysText(fuelDays)}`,detail:"Power demand is drawing Fuel reserves down.",label:"SHOW FUEL ›",focus:"fuel"};
    if((m.workforceShortfall||0)>0)return{level:"warn",title:"WORKFORCE SHORTAGE",detail:`${formatNumber(m.workforceRequired||0)} required • ${formatNumber(m.workforceAvailable||0)} available.`,label:"COLONY ›",action:"colony"};
    if((m.industryCommercialFactor??1)<.999)return{level:"warn",title:"INDUSTRY OVERLOAD",detail:`Build/Ore operations are running at ${Math.round((m.industryCommercialFactor??1)*100)}%.`,label:"SHOW INDUSTRY ›",focus:"industry"};
    if(totals.housing>0&&(Number(s.pop)||0)/totals.housing>.9)return{level:"warn",title:"HOUSING NEAR CAPACITY",detail:`${formatNumber(Math.max(0,totals.housing-s.pop))} spaces remain.`,label:"SHOW HOUSING ›",focus:"housing"};
    if(oreDays!==null&&oreDays!==undefined&&oreDays<=20)return{level:"warn",title:`ORE LOW — ${this.daysText(oreDays)}`,detail:"Industry is consuming Ore reserves faster than replacement.",label:"SHOW ORE ›",focus:"ore"};
    return{level:"good",title:"COLONY STABLE",detail:"No immediate operational constraint needs attention.",label:"PROBLEMS ›",focus:"problems"};
  }
  runAttentionAction(){const a=this.currentAttention||this.attentionStatus();if(a.focus){this.focusMap(a.focus);return;}if(a.action==="ship"){document.querySelector("#tradeBtn")?.click();return;}if(a.action==="colony"){(this.colonyControl?.()??this.landColonyPanel());}}
  action(label,action,{disabled=false,kind=null,cls=""}={}){return`<button class="context-action ${cls}" data-context-action="${action}"${kind?` data-context-kind="${kind}"`:""}${disabled?" disabled":""}>${label}</button>`;}
  contextParts(tile){
    const totals=syncBuildingTotals(this.state);
    if(!tile)return{title:"COLONY MAP",sub:"Tap a surveyed tile to see its actions. Tap an unsurveyed tile to survey it.",actions:"",requirement:""};
    if(this.land.isShipTile(tile.x,tile.y)){const ship=this.expansion.ship(this.state),accommodation=Math.max(0,Number(ship?.accommodationCapacity)||0),industry=this.state.colony?.shipIndustry||0;return{title:"LANDED SHIP",sub:`${formatNumber(accommodation)} accommodation • 0 colony Power • ${formatNumber(industry)} Industry while docked`,actions:this.action("CORPORATION","company")+this.action("COLONY SUMMARY","colony"),requirement:""};}
    const dev=tile.development;
    if(dev&&LOCAL_KINDS.has(dev.kind)){
      const kind=dev.kind,level=Math.max(1,Number(dev.level)||1),current=buildingCapacity(kind,level),next=this.development.canUpgrade(this.state,tile),unit=kind==="housing"?"housing":kind==="power"?"Power":kind==="headquarters"?"command":"Industry",gain=level<5?buildingCapacity(kind,level+1)-current:0;
      let actions=level<5?this.action(`UPGRADE L${level+1}${gain?` • +${formatNumber(gain)}`:""}`,"local-upgrade",{disabled:!next.ok,cls:kind==="headquarters"?"":"primary"}):this.action("MAX LEVEL","noop",{disabled:true});
      actions+=this.action(kind==="headquarters"?"COLONY CONTROL":"DETAILS","details",{cls:kind==="headquarters"?"primary":""});
      if(!next.ok&&/Tech/i.test(next.reason||""))actions+=this.action("TECH","tech");else if(!next.ok&&/Build/i.test(next.reason||""))actions+=this.action("SHOW BUILD","focus",{kind:"build"});
      return{title:`${this.development.label(kind).toUpperCase()} L${level} • ${formatNumber(current)} ${unit}`,sub:kind==="headquarters"?"Tap the Headquarters tile or Colony Control to open the command surface.":`This building contributes directly to colony ${unit.toLowerCase()} capacity.`,actions,requirement:level>=5?"Maximum building level reached.":next.ok?`Upgrade ready • ${this.localCost(next)}`:next.reason};
    }
    if(tile.resourceId){
      const label=RESOURCE_LABEL[tile.type]||"RESOURCE",size=this.resources.isRenewable(tile)?tile.abundanceLabel||"Renewable":tile.depositScale||"Finite";
      if(tile.developed){
        const level=Math.max(1,Number(tile.level)||1),rate=this.resources.collectionRate(this.state,tile),r=this.sites.upgradeRequirements(this.state,tile),family=this.land.extractionFamily(tile).replace(/-/g," ").toUpperCase();let actions="";
        if(level<5)actions+=this.action(`UPGRADE L${level+1}`,"site-upgrade",{disabled:!r.ok,cls:"primary"});else actions+=this.action("MAX LEVEL","noop",{disabled:true});
        if(supportsOverdrive(tile))actions+=this.action(`${String(tile.overdriveMode||"normal").toUpperCase()} ▾`,"mode",{cls:"warn"});actions+=this.action("DETAILS","details");
        if(!r.ok&&Number(totals.power)<Number(r.powerRequired||0))actions+=this.action("SHOW POWER","focus",{kind:"power"});else if(!r.ok&&Number(totals.industry)<Number(r.industryRequired||0))actions+=this.action("SHOW INDUSTRY","focus",{kind:"industry"});else if(!r.ok&&/Build/i.test(r.reason||""))actions+=this.action("SHOW BUILD","focus",{kind:"build"});
        return{title:`${family} L${level} • ${tile.name}`,sub:`${formatNumber(rate)}/day • ${formatNumber(this.colony.siteWorkforce(this.state,tile))} workers • ${size}`,actions,requirement:r.max?"Maximum site development reached.":r.ok?`Upgrade ready • ${formatNumber(r.build||0)} Build${r.ore?` + ${formatNumber(r.ore)} Ore`:""}`:r.reason};
      }
      const unlocked=this.technology.canExploit(this.state,tile),family=this.land.extractionFamily(tile).replace(/-/g," ").toUpperCase(),r=this.sites.developRequirements(this.state,tile);let actions=unlocked?this.action(`DEVELOP ${family}`,"site-develop",{disabled:!r.ok,cls:"primary"}):this.action(`GET MINING TECH L${tile.requiredMiningLevel||1}`,"tech",{cls:"warn"});actions+=this.action("DETAILS","details");if(!r.ok&&/Build/i.test(r.reason||""))actions+=this.action("SHOW BUILD","focus",{kind:"build"});
      return{title:`${tile.name} • ${label}`,sub:`${size} • Q${formatNumber(tile.quality||0)}${unlocked?"":" • technology locked"}`,actions,requirement:unlocked?(r.ok?`Ready to develop • ${formatNumber(r.build||0)} Build`:r.reason):`Requires Mining L${tile.requiredMiningLevel||1}: ${tile.requiredMiningTech||"Extraction technology"}.`};
    }
    if(tile.revealed){
      const checks=Object.fromEntries([...LOCAL_KINDS].map(k=>[k,this.development.canPlace(this.state,tile,k)])),actions=[...LOCAL_KINDS].map(kind=>this.action(`${kind.toUpperCase()} L1`,"build",{kind,disabled:!checks[kind].ok,cls:"primary"})).join(""),blocked=[...LOCAL_KINDS].filter(k=>!checks[k].ok).map(k=>`${this.development.label(k)}: ${checks[k].reason}`).join(" • ");
      return{title:`CLEAR ${this.land.terrainLabel(tile.terrain).toUpperCase()} LAND`,sub:"Choose a building. Multiple buildings stack and upgrades increase density.",actions,requirement:blocked};
    }
    return{title:"UNSURVEYED TILE",sub:"Tap once to add this tile to the survey queue.",actions:"",requirement:""};
  }
  renderContext(){
    const bar=document.querySelector("#contextBar");if(!bar)return;if(this.state.status==="site-selection"){bar.classList.add("hidden");return;}bar.classList.remove("hidden");const p=this.contextParts(this.selectedTile);this.setText("contextTitle",p.title);this.setText("contextSub",p.sub);const host=document.querySelector("#contextActions");if(host){host.innerHTML=p.actions;host.querySelectorAll("[data-context-action]").forEach(b=>b.onclick=()=>this.runContextAction(b.dataset.contextAction,b.dataset.contextKind));}this.setText("contextRequirement",p.requirement||"");
  }
  runContextAction(action,kind=null){
    const tile=this.selectedTile;if(action==="noop")return;if(action==="focus"){this.focusMap(kind||"all");return;}if(action==="tech"){this.tech();return;}if(action==="company"){this.company();return;}if(action==="colony"){(this.colonyControl?.()??this.landColonyPanel());return;}if(action==="details"){if(!tile)return;if(this.land.isShipTile(tile.x,tile.y))this.company();else if(tile.development&&LOCAL_KINDS.has(tile.development.kind))this.localBuildingPanel(tile);else if(tile.resourceId)this.tile(tile);else this.landTile(tile);return;}if(action==="mode"){this.tile(tile);return;}
    if(action==="build"){this.onPlaceDevelopment?.(tile,kind);this.renderContext();return;}
    if(action==="local-upgrade"){
      const before=tile.development?.level||1,r=this.development.upgrade(this.state,tile);if(!r.ok){this.toast(r.reason);this.renderContext();return;}this.onRecalculate?.();this.logEvent?.("land-development-upgraded",`${this.development.label(tile.development.kind)} at ${tile.x},${tile.y} upgraded to L${tile.development.level}.`,{x:tile.x,y:tile.y,kind:tile.development.kind,fromLevel:before,level:tile.development.level,buildCost:r.build,oreCost:r.ore||0});this.repo.save(this.state);this.toast(`${this.development.label(tile.development.kind)} upgraded to L${tile.development.level}.`);this.render();return;
    }
    if(action==="site-develop"){
      const r=this.sites.develop(this.state,tile);if(!r.ok){this.toast(r.reason);this.renderContext();return;}this.land.syncExtraction(tile,r.build);this.onRecalculate?.();this.logEvent?.("site-developed",`${tile.name} site developed at ${tile.x},${tile.y}.`,{x:tile.x,y:tile.y,resource:tile.name,type:tile.type,quality:tile.quality,level:tile.level,buildCost:r.build});this.repo.save(this.state);this.toast(`${tile.name} developed.`);this.render();return;
    }
    if(action==="site-upgrade"){
      const before=tile.level,r=this.sites.upgrade(this.state,tile);if(!r.ok){this.toast(r.reason);this.renderContext();return;}this.land.syncExtraction(tile,r.build);this.onRecalculate?.();this.logEvent?.("site-upgraded",`${tile.name} upgraded to L${tile.level}.`,{x:tile.x,y:tile.y,resource:tile.name,fromLevel:before,level:tile.level,buildCost:r.build,oreCost:r.ore||0});this.repo.save(this.state);this.toast(`${tile.name} upgraded to L${tile.level}.`);this.render();
    }
  }
  help(){
    super.help();
    const intro=this.modal.querySelector("#help-index .card .effect");if(intro)intro.textContent="Rules current through v5.8.0. MineIT now uses one unified colony map, an always-visible operational HUD and contextual tile actions so the challenge is solving colony problems rather than finding controls.";
    const section=this.modal.querySelector("#help-controls");if(section)this.mountMapFirstHelp(section);
  }
  mountMapFirstHelp(section){
    const source=getLoadedViewTemplate(MAP_FIRST_HELP_VIEW);if(source){this.replaceMapFirstHelp(section,source);return;}
    const revision=(this.mapFirstHelpRevision||0)+1;this.mapFirstHelpRevision=revision;
    loadViewTemplate(MAP_FIRST_HELP_VIEW).then(loaded=>{
      if(revision!==this.mapFirstHelpRevision||!section.isConnected||section!==this.modal.querySelector("#help-controls"))return;
      this.replaceMapFirstHelp(section,loaded);
    }).catch(error=>{if(revision===this.mapFirstHelpRevision&&section.isConnected)this.diagnostics?.error?.("map-first help view failed",error);});
  }
  replaceMapFirstHelp(section,source){
    const head=section.querySelector(".help-section-title");if(!head)return;
    while(section.lastChild&&section.lastChild!==head)section.removeChild(section.lastChild);
    section.append(document.createRange().createContextualFragment(source));
  }
}
