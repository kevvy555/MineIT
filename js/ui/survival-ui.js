import { formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { loadViewTemplate,renderViewSource } from "../core/view-template.js";

let survivalManualSource="",survivalManualLoading=null;

export class SurvivalUIMixin {
  colonyLost(){const living=this.state.portfolio.colonies.filter(entry=>entry.data?.status!=="dead").length;this.open("Colony Lost",`<article class="card"><h3 class="bad">${this.state.contract.colonyName} HAS BEEN LOST</h3><p>The population reached zero after life-support failure. Extraction, Industry and the mining charter are permanently ended on this world.</p><div class="effect warn">${living?`${living} other operating colon${living===1?"y":"ies"} remain. Switch to one of them to continue the corporation.`:"No operating colonies remain."}</div></article>${living?`<button class="action" data-lost-colonies>VIEW SURVIVING COLONIES</button>`:""}`);const button=this.modal.querySelector("[data-lost-colonies]");if(button)button.onclick=()=>this.coloniesPanel();}
  gameOver(){this.state.company.gameOver=true;this.repo.save(this.state);this.open("Corporation Failed",`<article class="card"><h3 class="bad">ALL COLONIES LOST</h3><p>Your corporation has no surviving population on any world. Mining operations have ended.</p><div class="effect warn">A new corporation starts again with Contract 01. The old dead-colony records remain only until the reset is confirmed.</div></article><div class="grid2"><button data-gameover-colonies>VIEW COLONIES</button><button data-gameover-reset class="bad">START NEW CORPORATION</button></div>`);this.modal.querySelector("[data-gameover-colonies]").onclick=()=>this.coloniesPanel();this.modal.querySelector("[data-gameover-reset]").onclick=()=>this.onHardReset();}
  help(){
    if(!survivalManualSource){
      if(!survivalManualLoading){
        survivalManualLoading=loadViewTemplate("./views/survival-manual.html").then(source=>{
          survivalManualSource=source;survivalManualLoading=null;this.help();
        }).catch(error=>{
          survivalManualLoading=null;this.diagnostics?.error?.("survival help template failed",error);this.toast("Unable to load the field manual.");
        });
      }
      return false;
    }
    const catalog=this.resources.catalog();
    const resources=["Food","Build","Fuel","Ore"].map(category=>{const items=catalog.filter(r=>r.category===category);return`<div class="help-resource-category"><h4 class="${category.toLowerCase()}">${category}</h4><div class="help-resource-table">${items.map(r=>`<div class="help-resource-row"><strong>${r.name}</strong><span>${r.rarity}</span><span>${r.manufactured?"Manufactured":r.renewable?"Renewable":"Finite"}</span><span>M${r.miningLevel||1}</span><span>${this.resources.baseSellPrice(r.type,r.id)<10?`£${this.resources.baseSellPrice(r.type,r.id).toFixed(2)}`:formatMoney(this.resources.baseSellPrice(r.type,r.id))}/u</span><small>${r.unlock||"Surface Recovery"}</small></div>`).join("")}</div></div>`;}).join("");
    const body=renderViewSource(survivalManualSource,{
      DEDICATED_TRANSPORT_DAYS:CONFIG.DEDICATED_TRANSPORT_DAYS,
      DEDICATED_TRANSPORT_BASE_COST:formatMoney(CONFIG.DEDICATED_TRANSPORT_BASE_COST),
      RESOURCES:resources,
      WORKFORCE_SHARE_PCT:Math.round(CONFIG.WORKFORCE_SHARE*100),
      SITE_OUTPUT_PROGRESS:CONFIG.SITE_OUTPUT_LEVELS.slice(0,6).map((value,index)=>`L${index+1} ${value}/d`).join(" • "),
      INDUSTRY_PROCESSING_MAX_BONUS_PCT:Math.round(CONFIG.INDUSTRY_PROCESSING_MAX_BONUS*100),
      TRADE_INTERVAL_DAYS:CONFIG.TRADE_INTERVAL_DAYS,
      TRADE_BASE_EXPORT_CARGO:formatNumber(CONFIG.TRADE_BASE_EXPORT_CARGO),
      TRADE_PASSENGER_CAPACITY:CONFIG.TRADE_PASSENGER_CAPACITY,
      MAX_EXTENSIONS:CONFIG.MAX_EXTENSIONS,
      RENEWAL_YEARS:CONFIG.RENEWAL_YEARS,
      LOG_TELEMETRY_INTERVAL_DAYS:CONFIG.LOG_TELEMETRY_INTERVAL_DAYS
    });
    this.open("How to Play",body);this.modal.querySelectorAll("[data-help-target]").forEach(button=>button.onclick=()=>{const target=this.modal.querySelector(`#${button.dataset.helpTarget}`);target?.scrollIntoView({behavior:"smooth",block:"start"});});return true;
  }
}
