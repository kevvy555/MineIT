import { formatNumber } from "../core/utils.js";
import { playUiClick } from "../core/ui-sounds.js";
import { ResourceUIMixin } from "./resource-ui.js";
import { ColonyTechUIMixin } from "./colony-tech-ui.js";
import { ContractUIMixin } from "./contract-ui.js";
import { PortfolioUIMixin } from "./portfolio-ui.js";
import { UIEnhancementsMixin } from "./ui-enhancements.js";
import { DevelopmentTasksUIMixin } from "./development-tasks-ui.js";
import { SurvivalUIMixin } from "./survival-ui.js";
import { IndustryUIMixin } from "./industry-ui.js";
import { V55UIMixin } from "./v55-ui.js";
import { V55ContractLogUIMixin } from "./v55-contract-log-ui.js";
import { LandUIMixin } from "./land-ui.js";

export class UIController {
  constructor({state,repo,taskRepository,taskClipboard,taskPreferencesStorage,resources,inventory,collection,colony,portfolio,sites,technology,survey,contracts,world,icons,diagnostics,transport,gameLog,land,development,onHardReset,onNewContract,onSwitchColony,onRemoveColony,onMakeLiability,onRelocateColony,onRecalculate,onCapturePortfolio,onSelectLand,onPlaceDevelopment,onDemolishDevelopment,onContractDecisionResolved,onProcessPendingEvent,onDevelopmentTasksOpenChange}){
    Object.assign(this,{state,repo,taskRepository,taskClipboard,taskPreferencesStorage,resources,inventory,collection,colony,portfolio,sites,technology,survey,contracts,world,icons,diagnostics,transport,gameLog,land,development,onHardReset,onNewContract,onSwitchColony,onRemoveColony,onMakeLiability,onRelocateColony,onRecalculate,onCapturePortfolio,onSelectLand,onPlaceDevelopment,onDemolishDevelopment,onContractDecisionResolved,onProcessPendingEvent,onDevelopmentTasksOpenChange});
    this.tilePanel=document.querySelector("#tilePanel");this.modal=document.querySelector("#modal");this.toastEl=document.querySelector("#toast");this.errorBadge=document.querySelector("#errorBadge");this.boundClickElements=[];this.interactionPointers=new Map();this.interactionLastRelease=null;this.interactionRoot=null;this.interactionHandlers=null;this.interactionObserver=null;this.bind();this.bindInteractionDiagnostics();
  }
  bindClick(selector,handler){const element=document.querySelector(selector);if(!element)return null;element.onclick=handler;this.boundClickElements.push(element);return element;}
  bind(){
    this.bindClick("#companyBtn",()=>this.company());this.bindClick("#collectionBtn",()=>this.currentCollection());this.bindClick("#colonyBtn",()=>(this.colonyControl?.()??this.landColonyPanel()));this.bindClick("#coloniesBtn",()=>this.coloniesPanel());this.bindClick("#techBtn",()=>this.tech());this.bindClick("#goalsBtn",()=>this.goals());this.bindClick("#menuBtn",()=>this.menu());
    this.bindSpeedInputs();
    if(this.errorBadge){this.errorBadge.onclick=()=>this.diagnosticsPanel();this.boundClickElements.push(this.errorBadge);}this.diagnosticsUnsubscribe=this.diagnostics.subscribe(()=>this.updateErrorBadge());
  }
  bindSpeedInputs(){
    const controls=document.querySelector(".controls")||document.querySelector(".app-footer");
    if(!controls||this.speedInputBound)return;
    this.speedInputBound=true;this.speedControls=controls;
    this.speedClickHandler=event=>{
      const button=event.target.closest?.("[data-speed]");
      if(!button||!controls.contains(button))return;
      event.preventDefault();event.stopImmediatePropagation();this.setSpeed(+button.dataset.speed);
    };
    controls.addEventListener("click",this.speedClickHandler,true);
  }
  interactionControl(target){return target?.closest?.("button,[role='button']")||null;}
  interactionAction(control){
    if(!control)return"";if(control.id)return`#${control.id}`;
    const entries=Object.entries(control.dataset||{});if(entries.length)return entries.slice(0,3).map(([key,value])=>`${key}=${value||"1"}`).join(";");
    return control.getAttribute?.("role")==="button"?"role=button":control.tagName?.toLowerCase?.()||"control";
  }
  interactionDescriptor(control){
    if(!control)return{};return{target:this.interactionAction(control),text:String(control.textContent||"").trim().replace(/\s+/g," ").slice(0,80),connected:!!control.isConnected,disabled:"disabled" in control?!!control.disabled:false,modalTitle:this.modal?.querySelector(".panel-title strong")?.textContent?.trim()||null};
  }
  traceInteraction(stage,control=null,data={}){return this.diagnostics?.interaction?.(stage,{...this.interactionDescriptor(control),...data});}
  bindInteractionDiagnostics(){
    const root=document.querySelector("#app");if(!root||this.interactionRoot)return;this.interactionRoot=root;
    const down=event=>{const control=this.interactionControl(event.target);if(!control)return;const record={target:control,descriptor:this.interactionDescriptor(control),startX:event.clientX,startY:event.clientY,maxMove:0,startedAt:performance.now(),disconnected:false};this.interactionPointers.set(event.pointerId,record);this.traceInteraction("pointerdown",control,{pointerId:event.pointerId,pointerType:event.pointerType||"unknown"});};
    const move=event=>{const record=this.interactionPointers.get(event.pointerId);if(!record)return;record.maxMove=Math.max(record.maxMove,Math.hypot(event.clientX-record.startX,event.clientY-record.startY));};
    const up=event=>{const record=this.interactionPointers.get(event.pointerId),control=this.interactionControl(event.target);if(!record&&!control)return;this.traceInteraction("pointerup",control||record?.target,{pointerId:event.pointerId,pointerType:event.pointerType||"unknown",downTarget:record?.descriptor?.target||null,originalConnected:record?.target?.isConnected??null,sameTarget:!!record&&control===record.target,movePx:Number((record?.maxMove||0).toFixed(1))});if(record)this.interactionLastRelease={target:record.target,descriptor:record.descriptor,releasedAt:performance.now(),movePx:record.maxMove,connected:record.target.isConnected};this.interactionPointers.delete(event.pointerId);};
    const cancel=event=>{const record=this.interactionPointers.get(event.pointerId),control=this.interactionControl(event.target);if(!record&&!control)return;this.traceInteraction("pointercancel",control||record?.target,{pointerId:event.pointerId,pointerType:event.pointerType||"unknown",downTarget:record?.descriptor?.target||null,originalConnected:record?.target?.isConnected??null,movePx:Number((record?.maxMove||0).toFixed(1))});this.interactionPointers.delete(event.pointerId);};
    const clickCapture=event=>{const control=this.interactionControl(event.target);if(!control)return;const release=this.interactionLastRelease,age=release?performance.now()-release.releasedAt:null;this.traceInteraction("click-capture",control,{detail:event.detail,releaseAgeMs:age===null?null:Math.round(age),releaseTarget:release?.descriptor?.target||null,releaseConnected:release?.target?.isConnected??null,releaseMovePx:release?Number(release.movePx.toFixed(1)):null});};
    const clickBubble=event=>{const control=this.interactionControl(event.target);if(!control)return;if(control.tagName==="BUTTON"||control.getAttribute?.("role")==="button")playUiClick(control);this.traceInteraction("click-bubble",control,{detail:event.detail,connectedAfterHandler:!!control.isConnected,modalTitleAfterHandler:this.modal?.querySelector(".panel-title strong")?.textContent?.trim()||null});};
    this.interactionHandlers={down,move,up,cancel,clickCapture,clickBubble};
    root.addEventListener("pointerdown",down,true);root.addEventListener("pointermove",move,true);root.addEventListener("pointerup",up,true);root.addEventListener("pointercancel",cancel,true);root.addEventListener("click",clickCapture,true);root.addEventListener("click",clickBubble);
    this.interactionObserver=new MutationObserver(()=>{for(const [pointerId,record] of this.interactionPointers){if(record.disconnected||record.target.isConnected)continue;record.disconnected=true;this.traceInteraction("target-disconnected",record.target,{pointerId,downTarget:record.descriptor.target,heldMs:Math.round(performance.now()-record.startedAt),movePx:Number(record.maxMove.toFixed(1))});}});this.interactionObserver.observe(root,{childList:true,subtree:true});
  }
  releaseInteractionDiagnostics(){
    const root=this.interactionRoot,h=this.interactionHandlers;if(root&&h){root.removeEventListener("pointerdown",h.down,true);root.removeEventListener("pointermove",h.move,true);root.removeEventListener("pointerup",h.up,true);root.removeEventListener("pointercancel",h.cancel,true);root.removeEventListener("click",h.clickCapture,true);root.removeEventListener("click",h.clickBubble);}this.interactionObserver?.disconnect();this.interactionObserver=null;this.interactionHandlers=null;this.interactionRoot=null;this.interactionPointers.clear();this.interactionLastRelease=null;
  }
  dispose(){
    clearTimeout(this.toastTimer);this.toastTimer=null;if(this.developmentTasksSessionActive)this.closeDevelopmentTasks?.();
    if(this.speedControls&&this.speedClickHandler)this.speedControls.removeEventListener("click",this.speedClickHandler,true);
    this.speedControls=null;this.speedClickHandler=null;this.speedInputBound=false;this.releaseInteractionDiagnostics();
    for(const element of this.boundClickElements||[])element.onclick=null;
    this.boundClickElements=[];this.diagnosticsUnsubscribe?.();this.diagnosticsUnsubscribe=null;
  }
  setSpeed(next){
    if(this.state.status==="site-selection"){this.toast("Choose a landing site before starting time.");return false;}
    if(next>0&&(this.state.company?.pendingEvents?.length||this.state.trade?.active||this.state.status==="contract-decision")){this.toast("Resolve the pending corporate event before resuming time.");return false;}
    if(this.state.company?.gameOver){this.toast("All colonies have been lost.");return false;}
    this.state.speed=next;this.syncSpeed();return true;
  }
  updateErrorBadge(){this.errorBadge.textContent=`ERROR LOG (${this.diagnostics.errors})`;this.errorBadge.classList.toggle("hidden",this.diagnostics.errors===0);}
  syncSpeed(){document.querySelectorAll("[data-speed]").forEach(b=>b.classList.toggle("active",+b.dataset.speed===this.state.speed));}
  panelTitle(title,icon=""){return`<div class="panel-title"><div class="resource-title">${icon}<strong>${title}</strong></div><button class="close" data-close>✕</button></div>`;}
  open(title,body){const previousTitle=this.modal?.querySelector(".panel-title strong")?.textContent?.trim()||null;this.traceInteraction("ui-open-start",null,{title,previousTitle,activePointers:this.interactionPointers.size});this.modal.innerHTML=`${this.panelTitle(title)}<div class="modal-body">${body}</div>`;this.modal.classList.remove("hidden");this.modal.querySelector("[data-close]").onclick=()=>this.modal.classList.add("hidden");this.traceInteraction("ui-open-commit",null,{title,activePointers:this.interactionPointers.size});}
  toast(message){this.toastEl.textContent=message;this.toastEl.classList.remove("hidden");clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.toastEl.classList.add("hidden"),1900);}
  quality(q){const[label,cls]=this.resources.qualityBand(q);return`<span class="${cls}">Q${formatNumber(q)} • ${label}</span>`;}
  stockFor(tile){return tile?.resourceId?this.inventory.amountFor(this.state,tile.type,tile.resourceId):0;}
}

/**
 * Copy an entire mixin prototype chain, oldest ancestor first. Several MineIT
 * presentation adapters subclass a legacy mixin and override only one or two
 * methods. Copying only own properties silently dropped inherited helpers such
 * as company(), colonyStatus() and colonyDays(). Walking the chain makes the
 * composition behave like normal class inheritance while keeping later mixins
 * and child overrides authoritative.
 */
export function mix(target,source){
  const chain=[];let proto=source?.prototype;
  while(proto&&proto!==Object.prototype){chain.unshift(proto);proto=Object.getPrototypeOf(proto);}
  for(const level of chain){const descriptors=Object.getOwnPropertyDescriptors(level);delete descriptors.constructor;Object.defineProperties(target.prototype,descriptors);}
}
mix(UIController,ResourceUIMixin);mix(UIController,ColonyTechUIMixin);mix(UIController,ContractUIMixin);mix(UIController,PortfolioUIMixin);mix(UIController,UIEnhancementsMixin);mix(UIController,DevelopmentTasksUIMixin);mix(UIController,SurvivalUIMixin);mix(UIController,IndustryUIMixin);mix(UIController,V55UIMixin);mix(UIController,V55ContractLogUIMixin);mix(UIController,LandUIMixin);
