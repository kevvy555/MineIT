import { formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates,renderViewSource } from "../core/view-template.js";

const SURVIVAL_VIEWS={colonyLost:"./views/survival-colony-lost.html",corporationFailed:"./views/corporation-failed.html"};
const HELP_VIEWS={manual:"./views/survival-manual.html",resourceCatalog:"./views/survival-resource-catalog.html"};
preloadViewTemplates(Object.values(SURVIVAL_VIEWS));
let survivalManualSource="",survivalResourceCatalogSource="",survivalManualLoading=null;

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
  setHelpResourceText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");}
  populateHelpResourceCatalog(){
    const host=this.modal.querySelector("[data-help-resource-catalog]"),categoryTemplate=this.modal.querySelector("[data-help-resource-category-template]"),rowTemplate=this.modal.querySelector("[data-help-resource-row-template]");
    if(!host||!categoryTemplate||!rowTemplate)return;
    const catalog=this.resources.catalog(),categories=document.createDocumentFragment();
    for(const category of["Food","Build","Fuel","Ore"]){
      const categoryNode=categoryTemplate.content.firstElementChild.cloneNode(true),heading=categoryNode.querySelector("[data-help-resource-category-name]"),rows=categoryNode.querySelector("[data-help-resource-rows]"),rowFragment=document.createDocumentFragment();
      heading.className=category.toLowerCase();heading.textContent=category;
      for(const resource of catalog.filter(item=>item.category===category)){
        const row=rowTemplate.content.firstElementChild.cloneNode(true),price=this.resources.baseSellPrice(resource.type,resource.id);
        this.setHelpResourceText(row,"[data-help-resource-name]",resource.name);this.setHelpResourceText(row,"[data-help-resource-rarity]",resource.rarity);this.setHelpResourceText(row,"[data-help-resource-kind]",resource.manufactured?"Manufactured":resource.renewable?"Renewable":"Finite");this.setHelpResourceText(row,"[data-help-resource-mining]",`M${resource.miningLevel||1}`);this.setHelpResourceText(row,"[data-help-resource-price]",`${price<10?`£${price.toFixed(2)}`:formatMoney(price)}/u`);this.setHelpResourceText(row,"[data-help-resource-unlock]",resource.unlock||"Surface Recovery");rowFragment.append(row);
      }
      rows.replaceChildren(rowFragment);categories.append(categoryNode);
    }
    host.replaceChildren(categories);
  }
  help(){
    if(!survivalManualSource||!survivalResourceCatalogSource){
      if(!survivalManualLoading){
        survivalManualLoading=Promise.all([loadViewTemplate(HELP_VIEWS.manual),loadViewTemplate(HELP_VIEWS.resourceCatalog)]).then(([manual,resourceCatalog])=>{
          survivalManualSource=manual;survivalResourceCatalogSource=resourceCatalog;survivalManualLoading=null;this.help();
        }).catch(error=>{
          survivalManualLoading=null;this.diagnostics?.error?.("survival help template failed",error);this.toast("Unable to load the field manual.");
        });
      }
      return false;
    }
    const body=renderViewSource(survivalManualSource,{
      DEDICATED_TRANSPORT_DAYS:CONFIG.DEDICATED_TRANSPORT_DAYS,
      DEDICATED_TRANSPORT_BASE_COST:formatMoney(CONFIG.DEDICATED_TRANSPORT_BASE_COST),
      RESOURCES:survivalResourceCatalogSource,
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
    this.open("How to Play",body);this.populateHelpResourceCatalog();this.modal.querySelectorAll("[data-help-target]").forEach(button=>button.onclick=()=>{const target=this.modal.querySelector(`#${button.dataset.helpTarget}`);target?.scrollIntoView({behavior:"smooth",block:"start"});});return true;
  }
}
