import { formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates,renderViewSource } from "../core/view-template.js";

const SURVIVAL_VIEWS={colonyLost:"./views/survival-colony-lost.html",corporationFailed:"./views/corporation-failed.html"};
preloadViewTemplates(Object.values(SURVIVAL_VIEWS));
let survivalManualSource="",survivalManualLoading=null;

export class SurvivalUIMixin {
  renderSurvivalView(path,slots,retry,isCurrent){
    const source=getLoadedViewTemplate(path);
    if(source)return renderViewSource(source,slots);
    const revision=(this.survivalViewRevision||0)+1;this.survivalViewRevision=revision;
    loadViewTemplate(path).then(()=>{if(this.survivalViewRevision===revision&&isCurrent())retry();}).catch(error=>{if(this.survivalViewRevision!==revision)return;this.diagnostics?.error?.("survival status template failed",error);this.toast("Unable to load the colony status screen.");});
    return null;
  }
  colonyLost(){
    const living=this.state.portfolio.colonies.filter(entry=>entry.data?.status!=="dead").length;
    const body=this.renderSurvivalView(SURVIVAL_VIEWS.colonyLost,{COLONY_NAME:this.state.contract.colonyName,COLONY_STATUS:living?`${living} other operating colon${living===1?"y":"ies"} remain. Switch to one of them to continue the corporation.`:"No operating colonies remain."},()=>this.colonyLost(),()=>this.state.status==="dead"&&!this.state.company.gameOver);
    if(!body)return false;
    this.open("Colony Lost",body);
    const button=this.modal.querySelector("[data-lost-colonies]");
    if(!living)button?.remove();else if(button)button.onclick=()=>this.coloniesPanel();
    return true;
  }
  gameOver(){this.state.company.gameOver=true;this.repo.save(this.state);return this.renderGameOver();}
  renderGameOver(){
    const body=this.renderSurvivalView(SURVIVAL_VIEWS.corporationFailed,{},()=>this.renderGameOver(),()=>!!this.state.company.gameOver);
    if(!body)return false;
    this.open("Corporation Failed",body);
    this.modal.querySelector("[data-gameover-colonies]").onclick=()=>this.coloniesPanel();
    this.modal.querySelector("[data-gameover-reset]").onclick=()=>this.onHardReset();
    return true;
  }
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
