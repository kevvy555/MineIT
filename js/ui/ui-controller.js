import { formatNumber } from "../core/utils.js?v=5.3.0";
import { ResourceUIMixin } from "./resource-ui.js?v=5.3.0";
import { ColonyTechUIMixin } from "./colony-tech-ui.js?v=5.3.0";
import { ContractUIMixin } from "./contract-ui.js?v=5.3.0";
import { PortfolioUIMixin } from "./portfolio-ui.js?v=5.3.0";
import { UIEnhancementsMixin } from "./ui-enhancements.js?v=5.3.0";
import { SurvivalUIMixin } from "./survival-ui.js?v=5.3.0";

export class UIController {
  constructor({state,repo,resources,inventory,collection,colony,portfolio,sites,technology,survey,contracts,world,icons,diagnostics,onHardReset,onNewContract,onSwitchColony,onRemoveColony,onMakeLiability,onRelocateColony,onRecalculate}){
    Object.assign(this,{state,repo,resources,inventory,collection,colony,portfolio,sites,technology,survey,contracts,world,icons,diagnostics,onHardReset,onNewContract,onSwitchColony,onRemoveColony,onMakeLiability,onRelocateColony,onRecalculate});
    this.tilePanel=document.querySelector("#tilePanel");this.modal=document.querySelector("#modal");this.toastEl=document.querySelector("#toast");this.errorBadge=document.querySelector("#errorBadge");this.bind();
  }
  bind(){
    document.querySelector("#companyBtn").onclick=()=>this.company();document.querySelector("#collectionBtn").onclick=()=>this.currentCollection();document.querySelector("#colonyBtn").onclick=()=>this.colonyPanel();document.querySelector("#coloniesBtn").onclick=()=>this.coloniesPanel();document.querySelector("#techBtn").onclick=()=>this.tech();document.querySelector("#goalsBtn").onclick=()=>this.goals();document.querySelector("#menuBtn").onclick=()=>this.menu();
    document.querySelectorAll("[data-speed]").forEach(button=>button.onclick=()=>{this.state.speed=+button.dataset.speed;this.syncSpeed()});this.errorBadge.onclick=()=>this.diagnosticsPanel();this.diagnostics.subscribe(()=>this.updateErrorBadge());
  }
  updateErrorBadge(){this.errorBadge.textContent=`ERROR LOG (${this.diagnostics.errors})`;this.errorBadge.classList.toggle("hidden",this.diagnostics.errors===0);}
  syncSpeed(){document.querySelectorAll("[data-speed]").forEach(b=>b.classList.toggle("active",+b.dataset.speed===this.state.speed));}
  panelTitle(title,icon=""){return`<div class="panel-title"><div class="resource-title">${icon}<strong>${title}</strong></div><button class="close" data-close>✕</button></div>`;}
  open(title,body){this.modal.innerHTML=`${this.panelTitle(title)}<div class="modal-body">${body}</div>`;this.modal.classList.remove("hidden");this.modal.querySelector("[data-close]").onclick=()=>this.modal.classList.add("hidden");}
  toast(message){this.toastEl.textContent=message;this.toastEl.classList.remove("hidden");clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.toastEl.classList.add("hidden"),1900);}
  quality(q){const[label,cls]=this.resources.qualityBand(q);return`<span class="${cls}">Q${formatNumber(q)} • ${label}</span>`;}
  stockFor(tile){return this.inventory.amountFor(this.state,tile.type,tile.resourceId);}
}
function mix(target,source){const descriptors=Object.getOwnPropertyDescriptors(source.prototype);delete descriptors.constructor;Object.defineProperties(target.prototype,descriptors);}
mix(UIController,ResourceUIMixin);mix(UIController,ColonyTechUIMixin);mix(UIController,ContractUIMixin);mix(UIController,PortfolioUIMixin);mix(UIController,UIEnhancementsMixin);mix(UIController,SurvivalUIMixin);
