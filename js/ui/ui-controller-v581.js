import { UIController as V580UIController } from "./ui-controller-v580.js?v=5.8.0&legacy=1";
import { operatingMode,riskExposure,supportsOverdrive } from "../domain/extraction-overdrive.js?v=5.6.2";
import { clamp } from "../core/utils.js?v=5.5.5";

const NEXT_MODE={normal:"pushed",pushed:"hard",hard:"normal"};

/** v5.8 flow refinements: direct site controls, synchronized selection and clearer shortcuts. */
export class UIController extends V580UIController{
  constructor(options){
    super(options);
    const attention=document.querySelector("#attentionStrip");
    if(attention)attention.addEventListener("keydown",event=>{
      if(event.key!=="Enter"&&event.key!==" ")return;
      event.preventDefault();this.runAttentionAction();
    });
  }
  renderContext(){
    if(this.selectedTile&&Number.isFinite(this.selectedTile.x)&&Number.isFinite(this.selectedTile.y))this.selectedTile=this.world.get(this.state,this.selectedTile.x,this.selectedTile.y);
    super.renderContext();
  }
  contextParts(tile){
    const p=super.contextParts(tile);if(!tile)return p;
    if(tile.developed&&this.resources.isRenewable(tile)&&!tile.renewableWiped){
      this.resources.ensureRenewable(tile);
      const intensity=Math.round((Number(tile.harvestIntensity)||1)*100),condition=this.resources.renewableCondition(tile);
      p.sub=`${p.sub} • harvest ${intensity}% • ${condition.label}`;
      const down=this.action("HARVEST −25%","harvest-down",{disabled:intensity<=25});
      const up=this.action("HARVEST +25%","harvest-up",{disabled:intensity>=200,cls:intensity>=100?"warn":""});
      p.actions=down+up+p.actions;
      if(intensity>100)p.requirement=`Over-harvesting is degrading this renewable resource. ${p.requirement||""}`.trim();
    }
    if(tile.developed&&supportsOverdrive(tile)){
      const mode=operatingMode(tile),risk=riskExposure(tile);
      p.sub=`${p.sub} • ${mode.toUpperCase()} • risk ${risk.toFixed(1)}/30`;
    }
    const requirement=String(p.requirement||"");
    if(/\bOre\b/i.test(requirement)&&!p.actions.includes('data-context-kind="ore"'))p.actions+=this.action("SHOW ORE","focus",{kind:"ore"});
    if(/worker|workforce/i.test(requirement)&&!p.actions.includes('data-context-action="colony"'))p.actions+=this.action("COLONY","colony");
    if(/Build/i.test(requirement)&&!p.actions.includes('data-context-kind="build"'))p.actions+=this.action("SHOW BUILD","focus",{kind:"build"});
    return p;
  }
  adjustHarvest(delta){
    const tile=this.selectedTile;if(!tile||!tile.developed||!this.resources.isRenewable(tile)||tile.renewableWiped)return;
    this.resources.ensureRenewable(tile);
    const before=Math.round((Number(tile.harvestIntensity)||1)*100),after=clamp(before+delta,25,200);
    tile.harvestIntensity=after/100;this.onRecalculate?.();
    this.logEvent?.("harvest-intensity",`${tile.name} harvest changed from ${before}% to ${after}%.`,{x:tile.x,y:tile.y,resource:tile.name,before,after,sustainableRate:this.resources.sustainableRate(tile)});
    this.repo.save(this.state);this.toast(`${tile.name} harvest set to ${after}%.`);this.render();
  }
  cycleOperatingMode(){
    const tile=this.selectedTile;if(!tile||!supportsOverdrive(tile))return;
    const before=operatingMode(tile),next=NEXT_MODE[before]||"normal",r=this.collection.setOperatingMode(this.state,tile,next);
    if(!r.ok){this.toast(r.reason);this.renderContext();return;}
    this.onRecalculate?.();this.logEvent?.("site-operating-mode",`${tile.name} changed from ${before.toUpperCase()} to ${next.toUpperCase()} operation.`,{x:tile.x,y:tile.y,resource:tile.name,before,after:next,riskExposure:riskExposure(tile)});this.repo.save(this.state);
    this.toast(`${tile.name}: ${r.profile.label} • ${Math.round(r.profile.workforce*100)}% staff • ${Math.round(r.profile.output*100)}% output.`);this.render();
  }
  runContextAction(action,kind=null){
    if(action==="harvest-down"){this.adjustHarvest(-25);return;}
    if(action==="harvest-up"){this.adjustHarvest(25);return;}
    if(action==="mode"){this.cycleOperatingMode();return;}
    super.runContextAction(action,kind);
  }
  renderMapFirstHud(){
    super.renderMapFirstHud();
    const setDaysState=(id,days)=>{const el=document.querySelector(`#${id}`);if(!el)return;el.classList.remove("warn");if(days!==null&&days!==undefined&&days<=30)el.classList.add("warn");};
    setDaysState("foodDaysHud",this.state.metrics?.foodDays);setDaysState("fuelDaysHud",this.state.metrics?.fuelDays);setDaysState("oreDaysHud",this.state.metrics?.oreDays);
  }
  help(){
    super.help();const intro=this.modal.querySelector("#help-index .card .effect");if(intro)intro.textContent="Rules current through v5.8.0. The map-first interface keeps routine colony actions on the main screen, including renewable harvest controls and direct Normal/Pushed/Hard extraction changes.";
  }
}
