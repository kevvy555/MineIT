import { formatNumber } from "../core/utils.js?v=5.4.0";
import { ColonyTechUIMixin } from "./colony-tech-ui.js?v=5.4.0";
import { ResourceUIMixin } from "./resource-ui.js?v=5.4.0";
import { UIEnhancementsMixin } from "./ui-enhancements.js?v=5.4.0";
import { SurvivalUIMixin } from "./survival-ui.js?v=5.4.0";

export class IndustryUIMixin {
  industryPct(value){return `${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`;}
  colonyPanel(){
    ColonyTechUIMixin.prototype.colonyPanel.call(this);if(this.state.status==="dead")return;
    const m=this.state.metrics,emergency=!!this.state.colony?.emergencyMode,capacity=Math.max(0,Number(m.industryCapacity)||0),load=Math.max(0,Number(m.industryLoad)||0),factor=m.industryCommercialFactor??1,bonus=Math.max(0,Number(m.processingBonus)||0),headroom=Math.max(0,capacity-load),body=this.modal.querySelector(".modal-body"),needs=body?.querySelector(".need-grid");if(!body||!needs)return;
    const overloaded=!emergency&&load>capacity+.001,status=emergency?`<span class="warn">— EMERGENCY SHUTDOWN</span>`:overloaded?`<span class="bad">— OVERLOADED</span>`:`<span class="good">— AVAILABLE</span>`;
    needs.insertAdjacentHTML("beforebegin",`<article class="card" style="margin-top:7px"><h3>INDUSTRIAL CAPACITY ${status}</h3><div class="grid2"><div class="metric"><small>Site load / capacity</small><strong>${formatNumber(load)} / ${formatNumber(capacity)}</strong></div><div class="metric"><small>Capacity headroom</small><strong>${overloaded?"0":formatNumber(headroom)}</strong></div><div class="metric"><small>Build/Ore extraction</small><strong>${this.industryPct(factor)}</strong></div><div class="metric"><small>Export processing</small><strong>+${Math.round(bonus*100)}%</strong></div></div><p>${emergency?`Emergency Mode has shut Industry and commercial extraction down. Food and Fuel remain prioritised for life support.`:overloaded?`Food and Fuel sites keep priority. Build and Ore extraction are automatically reduced to ${this.industryPct(factor)} until Industry capacity or staffing increases.`:`Developed sites consume Industrial Capacity. Food and Fuel are automatically prioritised; spare capacity runs Build and Ore operations.`}</p></article>`);
  }
  currentCollection(){
    UIEnhancementsMixin.prototype.currentCollection.call(this);if(this.state.colony?.emergencyMode)return;const factor=this.state.metrics.industryCommercialFactor??1;if(factor>=.999)return;const body=this.modal.querySelector(".modal-body");if(body)body.insertAdjacentHTML("afterbegin",`<div class="requirement locked">INDUSTRY OVERLOAD — Build/Ore collection is running at ${this.industryPct(factor)}. Food/Fuel extraction keeps priority.</div>`);
  }
  tile(tile){
    ResourceUIMixin.prototype.tile.call(this,tile);if(!tile?.revealed)return;const load=this.colony.siteIndustryLoad(tile),commercial=tile.type==="build"||tile.type==="ore",emergency=!!this.state.colony?.emergencyMode,factor=this.state.metrics.industryCommercialFactor??1,fullRate=this.resources.unthrottledCollectionRate(this.state,tile),effectiveRate=this.resources.collectionRate(this.state,tile),firstReq=this.tilePanel.querySelector(".requirement");if(!firstReq)return;
    const text=tile.developed?`Industrial load ${formatNumber(load)} capacity${commercial&&!emergency&&factor<.999?` • overload limits this site's rate to ${this.industryPct(factor)} (${formatNumber(effectiveRate)}/d vs ${formatNumber(fullRate)}/d full rate)`:""}`:`Development adds ${formatNumber(load)} Industrial Capacity load.`;
    firstReq.insertAdjacentHTML("afterend",`<div class="effect ${commercial&&!emergency&&factor<.999?"warn":""}">${text}</div>`);
  }
  help(){
    SurvivalUIMixin.prototype.help.call(this);const section=this.modal.querySelector("#help-industry");if(section)section.insertAdjacentHTML("beforeend",`<p><strong>Industry now has an operational purpose.</strong> Every developed site consumes Industrial Capacity. Site load rises as the site is upgraded. Food and Fuel sites always receive priority; when total load exceeds capacity, Build and Ore extraction is automatically reduced rather than hard-blocking sites.</p><p>Operational Capacity is based on Industry level and population staffing. Expanding Industry or bringing in enough colonists restores commercial extraction efficiency.</p><p>Industry also represents processing and beneficiation before shipment. Effective Industry raises export prices from +0% at about 100 Industry through roughly +5% at 200, +10% at 300, +20% at 500 and +35% at 1,000, capped at <strong>+50%</strong> around 2,000 effective Industry.</p><p>Advanced site upgrades require progressively stronger Industry: site L2 requires Industry L2, L3 requires I3, L4 requires I5, L5 requires I7, with later upgrades increasing further. This represents the machinery and logistics needed to build increasingly sophisticated extraction sites.</p>`);
  }
}
