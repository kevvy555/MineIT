import { formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { loadViewTemplate,renderViewSource } from "../core/view-template.js";

const TECH_LABELS={power:"POWER",food:"FOOD PRODUCTION",mining:"MINING"};
let survivalManualSource="",survivalManualError=null;
try{survivalManualSource=await loadViewTemplate("./views/survival-manual.html");}catch(error){survivalManualError=error;}

export class SurvivalUIMixin {
  colonyLost(){const living=this.state.portfolio.colonies.filter(entry=>entry.data?.status!=="dead").length;this.open("Colony Lost",`<article class="card"><h3 class="bad">${this.state.contract.colonyName} HAS BEEN LOST</h3><p>The population reached zero after life-support failure. Extraction, Industry and the mining charter are permanently ended on this world.</p><div class="effect warn">${living?`${living} other operating colon${living===1?"y":"ies"} remain. Switch to one of them to continue the corporation.`:"No operating colonies remain."}</div></article>${living?`<button class="action" data-lost-colonies>VIEW SURVIVING COLONIES</button>`:""}`);const button=this.modal.querySelector("[data-lost-colonies]");if(button)button.onclick=()=>this.coloniesPanel();}
  gameOver(){this.state.company.gameOver=true;this.repo.save(this.state);this.open("Corporation Failed",`<article class="card"><h3 class="bad">ALL COLONIES LOST</h3><p>Your corporation has no surviving population on any world. Mining operations have ended.</p><div class="effect warn">A new corporation starts again with Contract 01. The old dead-colony records remain only until the reset is confirmed.</div></article><div class="grid2"><button data-gameover-colonies>VIEW COLONIES</button><button data-gameover-reset class="bad">START NEW CORPORATION</button></div>`);this.modal.querySelector("[data-gameover-colonies]").onclick=()=>this.coloniesPanel();this.modal.querySelector("[data-gameover-reset]").onclick=()=>this.onHardReset();}
  help(){
    if(!survivalManualSource){this.diagnostics?.error?.("survival help template failed",survivalManualError||new Error("Survival manual template unavailable"));this.toast("Unable to load the field manual.");return false;}
    const catalog=this.resources.catalog();
    const resources=["Food","Build","Fuel","Ore"].map(category=>{const items=catalog.filter(r=>r.category===category);return`<div class="help-resource-category"><h4 class="${category.toLowerCase()}">${category}</h4><div class="help-resource-table">${items.map(r=>`<div class="help-resource-row"><strong>${r.name}</strong><span>${r.rarity}</span><span>${r.manufactured?"Manufactured":r.renewable?"Renewable":"Finite"}</span><span>M${r.miningLevel||1}</span><span>${this.resources.baseSellPrice(r.type,r.id)<10?`£${this.resources.baseSellPrice(r.type,r.id).toFixed(2)}`:formatMoney(this.resources.baseSellPrice(r.type,r.id))}/u</span><small>${r.unlock||"Surface Recovery"}</small></div>`).join("")}</div></div>`;}).join("");
    const qualityRows=this.resources.qualityBands().map(b=>`<div class="help-data-row"><strong class="${b.className}">${b.label}</strong><span>Q${formatNumber(b.min)}–${formatNumber(b.max)}</span><span>×${b.multiplier.toFixed(2)} sale value</span></div>`).join("");
    const techRows=["power","food","mining"].map(cat=>`<div class="help-tech-block"><h4>${TECH_LABELS[cat]}</h4>${this.technology.tree(cat).map(t=>`<div class="help-tech-row"><strong>L${t.level} ${t.name}</strong><span>${t.level===1?"Starting technology":formatMoney(t.cost)}</span><small>${t.description}</small></div>`).join("")}</div>`).join("");
    const body=renderViewSource(survivalManualSource,{
      DEDICATED_TRANSPORT_DAYS:CONFIG.DEDICATED_TRANSPORT_DAYS,
      DEDICATED_TRANSPORT_BASE_COST:formatMoney(CONFIG.DEDICATED_TRANSPORT_BASE_COST),
      RESOURCES:resources,
      QUALITY_ROWS:qualityRows,
      SITE_OUTPUT_LEVELS:CONFIG.SITE_OUTPUT_LEVELS.slice(0,5).join(", "),
      TECH_ROWS:techRows,
      TRADE_INTERVAL_DAYS:CONFIG.TRADE_INTERVAL_DAYS,
      MAX_EXTENSIONS:CONFIG.MAX_EXTENSIONS,
      RENEWAL_YEARS:CONFIG.RENEWAL_YEARS
    });
    this.open("How to Play",body);this.modal.querySelectorAll("[data-help-target]").forEach(button=>button.onclick=()=>{const target=this.modal.querySelector(`#${button.dataset.helpTarget}`);target?.scrollIntoView({behavior:"smooth",block:"start"});});return true;
  }
}
