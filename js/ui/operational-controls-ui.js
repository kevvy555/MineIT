import { UIController as BaseUIController } from "./map-first-ui.js";
import { operatingMode,riskExposure,supportsOverdrive } from "../domain/extraction-overdrive.js";
import { formatNumber } from "../core/utils.js";
import { renderViewTemplate } from "../core/view-template.js";

const NEXT_MODE={normal:"pushed",pushed:"hard",hard:"normal"};
const displayDays=days=>days===null||days===undefined?"SAFE":`${Math.max(0,Math.floor(Number(days)||0))} DAYS`;
const FLOW_EPSILON=.0001;
const RESOURCE_FLOW_METRICS={
  food:{production:"food",consumption:"foodDemand"},
  build:{production:"buildProduction",consumption:"buildDemand"},
  fuel:{production:"fuelProduction",consumption:"fuelDemand"},
  ore:{production:"oreProduction",consumption:"oreDemand"}
};

/** Direct renewable harvest, extraction operating-mode, critical warnings and contextual map controls. */
export class UIController extends BaseUIController{
  constructor(options){
    super(options);this.attentionElement=document.querySelector("#attentionStrip");this.criticalResourceWarnings={food:false,fuel:false,shipFood:false};this.criticalWarningRevision=0;
    this.attentionKeydownHandler=event=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();this.runAttentionAction();};
    this.attentionElement?.addEventListener("keydown",this.attentionKeydownHandler);
  }
  dispose(){this.attentionElement?.removeEventListener("keydown",this.attentionKeydownHandler);this.attentionElement=null;this.attentionKeydownHandler=null;this.criticalWarningRevision++;super.dispose?.();}
  renderContext(){if(this.selectedTile&&Number.isFinite(this.selectedTile.x)&&Number.isFinite(this.selectedTile.y))this.selectedTile=this.world.get(this.state,this.selectedTile.x,this.selectedTile.y);super.renderContext();}
  contextParts(tile){
    const p=super.contextParts(tile);if(!tile)return p;
    if(tile.developed&&this.resources.isRenewable(tile)&&!tile.renewableWiped){this.resources.ensureRenewable(tile);const intensity=Math.round((Number(tile.harvestIntensity)||1)*100),condition=this.resources.renewableCondition(tile);p.sub=`${p.sub} • harvest ${intensity}% • ${condition.label}`;const down=this.action("HARVEST −25%","harvest-down",{disabled:intensity<=25});const up=this.action("HARVEST +25%","harvest-up",{disabled:intensity>=200,cls:intensity>=100?"warn":""});p.actions=down+up+p.actions;if(intensity>100)p.requirement=`Over-harvesting is degrading this renewable resource. ${p.requirement||""}`.trim();}
    if(tile.developed&&supportsOverdrive(tile)){const mode=operatingMode(tile),risk=riskExposure(tile);p.sub=`${p.sub} • ${mode.toUpperCase()} • risk ${risk.toFixed(1)}/30`;}
    const requirement=String(p.requirement||"");if(/\bOre\b/i.test(requirement)&&!p.actions.includes('data-context-kind="ore"'))p.actions+=this.action("SHOW ORE","focus",{kind:"ore"});if(/worker|workforce/i.test(requirement)&&!p.actions.includes('data-context-action="colony"'))p.actions+=this.action("COLONY","colony");if(/Build/i.test(requirement)&&!p.actions.includes('data-context-kind="build"'))p.actions+=this.action("SHOW BUILD","focus",{kind:"build"});return p;
  }
  adjustHarvest(delta){
    const tile=this.selectedTile;if(!tile||!tile.developed||!this.resources.isRenewable(tile)||tile.renewableWiped)return;
    if(Number(delta)>0){const check=this.colony.canAdjustHarvestIntensity(this.state,tile,delta);if(!check.ok){this.toast(check.reason);this.renderContext();return;}}
    const result=this.resources.adjustHarvestIntensity(tile,delta);if(!result.ok){this.toast(result.reason);return;}const {before,after,sustainableRate}=result;this.onRecalculate?.();this.logEvent?.("harvest-intensity",`${tile.name} harvest changed from ${before}% to ${after}%.`,{x:tile.x,y:tile.y,resource:tile.name,before,after,sustainableRate});this.repo.save(this.state);this.toast(`${tile.name} harvest set to ${after}%.`);this.render();
  }
  cycleOperatingMode(){const tile=this.selectedTile;if(!tile||!supportsOverdrive(tile))return;const before=operatingMode(tile),next=NEXT_MODE[before]||"normal",r=this.collection.setOperatingMode(this.state,tile,next);if(!r.ok){this.toast(r.reason);this.renderContext();return;}this.onRecalculate?.();this.logEvent?.("site-operating-mode",`${tile.name} changed from ${before.toUpperCase()} to ${next.toUpperCase()} operation.`,{x:tile.x,y:tile.y,resource:tile.name,before,after:next,riskExposure:riskExposure(tile)});this.repo.save(this.state);this.toast(`${tile.name}: ${r.profile.label} • ${Math.round(r.profile.workforce*100)}% staff • ${Math.round(r.profile.output*100)}% output.`);this.render();}
  runContextAction(action,kind=null){if(action==="harvest-down"){this.adjustHarvest(-25);return;}if(action==="harvest-up"){this.adjustHarvest(25);return;}if(action==="mode"){this.cycleOperatingMode();return;}super.runContextAction(action,kind);}

  resourceFlow(type){
    const metrics=this.state.metrics||{},keys=RESOURCE_FLOW_METRICS[type]||{},stock=Math.max(0,Number(this.inventory.amount(this.state,type))||0),production=Math.max(0,Number(metrics[keys.production])||0),consumption=Math.max(0,Number(metrics[keys.consumption])||0),surplus=production-consumption,declining=surplus<-FLOW_EPSILON,days=declining?stock/Math.abs(surplus):null;return{stock,production,consumption,surplus,declining,days};
  }
  resourceFlowText(flow){const sign=flow.surplus>FLOW_EPSILON?"+":flow.surplus<-FLOW_EPSILON?"-":"";return`${formatNumber(flow.stock)} +${formatNumber(flow.production)} -${formatNumber(flow.consumption)} S${sign}${formatNumber(Math.abs(flow.surplus))}`;}
  resourceDaysText(days){return days===null||days===undefined?"∞d":`${Math.max(0,Math.floor(Number(days)||0))}d`;}
  shipResourceFlow(type,ship){
    const foodStatus=type==="food"?this.expansion.shipResidentFoodStatus(this.state).rows.find(row=>row.shipId===ship.id):null,stock=type==="food"?this.expansion.transitFoodAmount(this.state,ship.id):type==="fuel"?this.expansion.fuelAmount(this.state,ship.id):this.expansion.cargoCategory(this.state,type,ship.id),production=0,consumption=foodStatus?.consumption||0,surplus=production-consumption,declining=surplus<-FLOW_EPSILON,days=declining?stock/Math.abs(surplus):null;
    return{stock,production,consumption,surplus,declining,days};
  }
  renderFlowRow(type,scope,flow,tone){
    const value=document.querySelector(`#${type}${scope}Stock`),days=document.querySelector(`#${type}${scope}DaysHud`),row=document.querySelector(`#${type}${scope}Row`);
    if(value)value.textContent=this.resourceFlowText(flow);if(days)days.textContent=this.resourceDaysText(flow.days);if(row){row.hidden=false;row.classList.toggle("good",tone==="good");row.classList.toggle("bad",tone==="bad");}
  }
  renderResourceFlowHud(){
    const ship=this.expansion.hudShip(this.state);
    for(const type of Object.keys(RESOURCE_FLOW_METRICS)){
      const flow=this.resourceFlow(type),colonyRow=document.querySelector(`#${type}ColonyRow`),value=document.querySelector(`#${type}Stock`),days=document.querySelector(`#${type}DaysHud`),card=document.querySelector(`#${type}ResourceHud`);if(value)value.textContent=this.resourceFlowText(flow);if(days)days.textContent=this.resourceDaysText(flow.days);if(colonyRow){colonyRow.classList.toggle("good",!flow.declining);colonyRow.classList.toggle("bad",flow.declining);}const shipRow=document.querySelector(`#${type}ShipRow`);if(ship){const shipFlow=this.shipResourceFlow(type,ship),tone=shipFlow.days===null||shipFlow.days>=10?"good":"bad";this.renderFlowRow(type,"Ship",shipFlow,tone);if(card)card.title=`SHIP: ${formatNumber(shipFlow.stock)} stock • ${this.resourceDaysText(shipFlow.days)}. COLONY: ${formatNumber(flow.stock)} stock • Production +${formatNumber(flow.production)}/d • Consumed -${formatNumber(flow.consumption)}/d • Surplus ${flow.surplus>=0?"+":"-"}${formatNumber(Math.abs(flow.surplus))}/d`;}else{if(shipRow)shipRow.hidden=true;if(card)card.removeAttribute("title");}
    }
  }

  async checkCriticalResourceWarnings(){
    if(this.state.company?.gameOver||this.state.status==="dead"||!this.modal?.classList.contains("hidden"))return;
    const shipFood=this.expansion.shipResidentFoodStatus(this.state),shipDays=shipFood.shortestDays,critical=[];let cleared=false;for(const [type,days] of [["food",this.state.metrics?.foodDays],["fuel",this.state.metrics?.fuelDays],["shipFood",shipDays]]){const isCritical=days!==null&&days!==undefined&&(type==="shipFood"?Number(days)<10:Number(days)<=10);if(!isCritical){cleared=cleared||this.criticalResourceWarnings[type];this.criticalResourceWarnings[type]=false;continue;}if(!this.criticalResourceWarnings[type]){this.criticalResourceWarnings[type]=true;critical.push(type);}}
    if(cleared)this.criticalWarningRevision++;if(!critical.length)return;const revision=++this.criticalWarningRevision,colonyId=this.state.colonyId,foodDays=this.state.metrics?.foodDays,fuelDays=this.state.metrics?.fuelDays,summary=critical.map(type=>type==="shipFood"?"SHIP FOOD has less than 10 days remaining":`${type.toUpperCase()} has 10 days or less remaining`).join(" • ");
    let body;try{body=await renderViewTemplate("./views/critical-resource-warning.html",{SUMMARY:summary,SHIP_HIDDEN:shipFood.shortest?"":"hidden",SHIP_CLASS:shipDays!==null&&shipDays<10?"bad":"good",SHIP_DAYS:displayDays(shipDays),SHIP_NAME:shipFood.shortest?.shipName||"No occupied ship",FOOD_CLASS:foodDays!==null&&foodDays!==undefined&&foodDays<=10?"bad":"good",FOOD_DAYS:displayDays(foodDays),FUEL_CLASS:fuelDays!==null&&fuelDays!==undefined&&fuelDays<=10?"bad":"good",FUEL_DAYS:displayDays(fuelDays)});}catch(error){if(revision===this.criticalWarningRevision)this.diagnostics?.error?.("critical resource warning view failed",error);return;}
    if(revision!==this.criticalWarningRevision||this.state.colonyId!==colonyId||!this.modal?.classList.contains("hidden"))return;this.open("Critical Resource Warning",body);
  }

  renderMapFirstHud(){super.renderMapFirstHud();this.renderResourceFlowHud();this.checkCriticalResourceWarnings();}
}
