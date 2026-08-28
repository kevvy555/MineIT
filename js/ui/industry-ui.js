import { formatNumber } from "../core/utils.js";
import { getLoadedViewTemplate, loadViewTemplate, preloadViewTemplates } from "../core/view-template.js";
import { ColonyTechUIMixin } from "./colony-tech-ui.js";
import { ResourceUIMixin } from "./resource-ui.js";
import { UIEnhancementsMixin } from "./ui-enhancements.js";

const INDUSTRY_CAPACITY_VIEW="./views/industry-capacity-card.html";
preloadViewTemplates([INDUSTRY_CAPACITY_VIEW]);

export class IndustryUIMixin {
  industryPct(value){return `${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`;}
  setIndustryText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");return node;}
  industryCapacityViewSource(body,needs){
    const source=getLoadedViewTemplate(INDUSTRY_CAPACITY_VIEW);if(source)return source;
    loadViewTemplate(INDUSTRY_CAPACITY_VIEW).then(loaded=>{if(body.isConnected&&needs.isConnected&&body===this.modal.querySelector(".modal-body")&&this.state.status!=="dead")this.mountIndustryCapacity(body,needs,loaded);}).catch(error=>{if(body.isConnected&&body===this.modal.querySelector(".modal-body")){this.diagnostics?.error?.("industry capacity view failed",error);this.toast("Unable to load Industry capacity details.");}});
    return null;
  }
  mountIndustryCapacity(body,needs,source){
    if(!body?.isConnected||!needs?.isConnected||body!==this.modal.querySelector(".modal-body"))return false;
    const m=this.state.metrics,emergency=!!this.state.colony?.emergencyMode,capacity=Math.max(0,Number(m.industryCapacity)||0),load=Math.max(0,Number(m.industryLoad)||0),factor=m.industryCommercialFactor??1,bonus=Math.max(0,Number(m.processingBonus)||0),headroom=Math.max(0,capacity-load),overloaded=!emergency&&load>capacity+.001,fragment=document.createRange().createContextualFragment(source),card=fragment.querySelector("[data-industry-capacity-card]");if(!card)return false;
    const status=card.querySelector("[data-industry-status]");status.className=emergency?"warn":overloaded?"bad":"good";status.textContent=emergency?"— EMERGENCY SHUTDOWN":overloaded?"— OVERLOADED":"— AVAILABLE";
    this.setIndustryText(card,"[data-industry-load]",`${formatNumber(load)} / ${formatNumber(capacity)}`);this.setIndustryText(card,"[data-industry-headroom]",overloaded?"0":formatNumber(headroom));this.setIndustryText(card,"[data-industry-extraction]",this.industryPct(factor));this.setIndustryText(card,"[data-industry-processing]",`+${Math.round(bonus*100)}%`);
    this.setIndustryText(card,"[data-industry-copy]",emergency?"Emergency Mode has shut Industry and commercial extraction down. Food and Fuel remain prioritised for life support.":overloaded?`Food and Fuel sites keep priority. Build and Ore extraction are automatically reduced to ${this.industryPct(factor)} until Industry capacity or staffing increases.`:"Developed sites consume Industrial Capacity. Food and Fuel are automatically prioritised; spare capacity runs Build and Ore operations.");
    needs.before(fragment);return true;
  }
  colonyPanel(){ColonyTechUIMixin.prototype.colonyPanel.call(this);if(this.state.status==="dead")return;const body=this.modal.querySelector(".modal-body"),needs=body?.querySelector(".need-grid");if(!body||!needs)return;const source=this.industryCapacityViewSource(body,needs);if(source)this.mountIndustryCapacity(body,needs,source);}
  currentCollection(){UIEnhancementsMixin.prototype.currentCollection.call(this);if(this.state.colony?.emergencyMode)return;const factor=this.state.metrics.industryCommercialFactor??1;if(factor>=.999)return;const body=this.modal.querySelector(".modal-body");if(body)body.insertAdjacentHTML("afterbegin",`<div class="requirement locked">INDUSTRY OVERLOAD — Build/Ore collection is running at ${this.industryPct(factor)}. Food/Fuel extraction keeps priority.</div>`);}
  tile(tile){ResourceUIMixin.prototype.tile.call(this,tile);if(!tile?.revealed)return;const load=this.colony.siteIndustryLoad(tile),commercial=tile.type==="build"||tile.type==="ore",emergency=!!this.state.colony?.emergencyMode,factor=this.state.metrics.industryCommercialFactor??1,fullRate=this.resources.unthrottledCollectionRate(this.state,tile),effectiveRate=this.resources.collectionRate(this.state,tile),firstReq=this.tilePanel.querySelector(".requirement");if(!firstReq)return;const text=tile.developed?`Industrial load ${formatNumber(load)} capacity${commercial&&!emergency&&factor<.999?` • overload limits this site's rate to ${this.industryPct(factor)} (${formatNumber(effectiveRate)}/d vs ${formatNumber(fullRate)}/d full rate)`:""}`:`Development adds ${formatNumber(load)} Industrial Capacity load.`;firstReq.insertAdjacentHTML("afterend",`<div class="effect ${commercial&&!emergency&&factor<.999?"warn":""}">${text}</div>`);}
}
