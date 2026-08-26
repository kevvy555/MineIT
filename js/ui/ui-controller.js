import { formatNumber } from "../core/utils.js?v=5.5.5";
import { ResourceUIMixin } from "./resource-ui.js?v=5.6.2";
import { ColonyTechUIMixin } from "./colony-tech-ui.js?v=5.5.5";
import { ContractUIMixin } from "./contract-ui.js?v=5.5.5";
import { PortfolioUIMixin } from "./portfolio-ui.js?v=5.5.5";
import { UIEnhancementsMixin } from "./ui-enhancements.js?v=5.5.5";
import { SurvivalUIMixin } from "./survival-ui.js?v=5.5.5";
import { IndustryUIMixin } from "./industry-ui.js?v=5.5.5";
import { V55UIMixin } from "./v55-ui.js?v=5.5.5";
import { V55ContractLogUIMixin } from "./v55-contract-log-ui.js?v=5.5.5";
import { LandUIMixin } from "./land-ui.js?v=5.5.5";

export class UIController {
  constructor({state,repo,resources,inventory,collection,colony,portfolio,sites,technology,survey,contracts,world,icons,diagnostics,transport,gameLog,land,development,onHardReset,onNewContract,onSwitchColony,onRemoveColony,onMakeLiability,onRelocateColony,onRecalculate,onCapturePortfolio,onSelectLand,onPlaceDevelopment,onDemolishDevelopment,onContractDecisionResolved,onProcessPendingEvent}){
    Object.assign(this,{state,repo,resources,inventory,collection,colony,portfolio,sites,technology,survey,contracts,world,icons,diagnostics,transport,gameLog,land,development,onHardReset,onNewContract,onSwitchColony,onRemoveColony,onMakeLiability,onRelocateColony,onRecalculate,onCapturePortfolio,onSelectLand,onPlaceDevelopment,onDemolishDevelopment,onContractDecisionResolved,onProcessPendingEvent});
    this.tilePanel=document.querySelector("#tilePanel");this.modal=document.querySelector("#modal");this.toastEl=document.querySelector("#toast");this.errorBadge=document.querySelector("#errorBadge");this.bind();
  }
  bind(){
    document.querySelector("#companyBtn").onclick=()=>this.company();document.querySelector("#collectionBtn").onclick=()=>this.currentCollection();document.querySelector("#colonyBtn").onclick=()=>this.landColonyPanel();document.querySelector("#coloniesBtn").onclick=()=>this.coloniesPanel();document.querySelector("#techBtn").onclick=()=>this.tech();document.querySelector("#goalsBtn").onclick=()=>this.goals();document.querySelector("#menuBtn").onclick=()=>this.menu();
    this.bindSpeedInputs();
    this.errorBadge.onclick=()=>this.diagnosticsPanel();this.diagnostics.subscribe(()=>this.updateErrorBadge());
  }
  bindSpeedInputs(){
    const controls=document.querySelector(".controls")||document.querySelector(".app-footer");
    if(!controls||this.speedInputBound)return;
    this.speedInputBound=true;
    controls.addEventListener("click",event=>{
      const button=event.target.closest?.("[data-speed]");
      if(!button||!controls.contains(button))return;
      event.preventDefault();event.stopImmediatePropagation();this.setSpeed(+button.dataset.speed);
    },true);
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
  open(title,body){this.modal.innerHTML=`${this.panelTitle(title)}<div class="modal-body">${body}</div>`;this.modal.classList.remove("hidden");this.modal.querySelector("[data-close]").onclick=()=>this.modal.classList.add("hidden");}
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
mix(UIController,ResourceUIMixin);mix(UIController,ColonyTechUIMixin);mix(UIController,ContractUIMixin);mix(UIController,PortfolioUIMixin);mix(UIController,UIEnhancementsMixin);mix(UIController,SurvivalUIMixin);mix(UIController,IndustryUIMixin);mix(UIController,V55UIMixin);mix(UIController,V55ContractLogUIMixin);mix(UIController,LandUIMixin);
