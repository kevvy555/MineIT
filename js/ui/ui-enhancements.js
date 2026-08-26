import { formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { renderViewTemplate } from "../core/view-template.js";

const TECH_LABELS={power:"POWER",food:"FOOD PRODUCTION",mining:"MINING"};
const CATEGORY_HELP={
  Food:"Food keeps colonists alive. Population consumes it every day. Natural Food sites are renewable; advanced Food technology can also create synthetic food.",
  Build:"Build materials are construction stock. They are spent on resource-site development and upgrades, housing and Industry expansion. They have no normal daily consumption.",
  Fuel:"Fuel is consumed to turn your Power technology into usable colony power. Better Power technology reduces fuel intensity.",
  Ore:"Ore feeds Industry every day. It also contains the valuable metals, gemstones and exotic materials that can become major trade earners."
};

export class UIEnhancementsMixin {
  collectionSortValue(row,key){if(key==="name"||key==="category")return String(row[key]||"").toLowerCase();if(key==="remaining")return row.renewable?Number.POSITIVE_INFINITY:Number(row.remaining)||0;return Number(row[key])||0;}
  currentCollection(){
    const rows=this.collection.current(this.state);if(!rows.length){this.open("Current Collection",`<article class="card"><h3>No active collection sites</h3><p>${this.state.contract.ended?"This colony's mining contract has ended.":"Survey a resource tile and develop it to begin collection."}</p></article>`);return;}
    this.collectionSort||={key:"name",dir:1};const sort=this.collectionSort,columns=[["name","Resource"],["category","Category"],["rate","Rate"],["stock","Stock"],["remaining","Remaining"]],sorted=[...rows].sort((a,b)=>{const av=this.collectionSortValue(a,sort.key),bv=this.collectionSortValue(b,sort.key);let cmp=typeof av==="string"?av.localeCompare(bv):av-bv;if(!Number.isFinite(cmp))cmp=av===bv?0:av>bv?1:-1;if(cmp===0)cmp=String(a.name).localeCompare(String(b.name));return cmp*sort.dir;});
    const head=columns.map(([key,label])=>`<button class="collection-sort ${sort.key===key?"active":""}" data-collection-sort="${key}"><span>${label}</span><b>${sort.key===key?(sort.dir>0?"▲":"▼"):"↕"}</b></button>`).join("");
    this.open("Current Collection",`<div class="collection-table"><div class="collection-row collection-head">${head}</div>${sorted.map(r=>`<div class="collection-row"><strong>${r.name}${r.sites>1?` ×${r.sites}`:""}</strong><span>${r.category}</span><span>${formatNumber(r.rate)}/d</span><span>${formatNumber(r.stock)}</span><span>${r.renewable?"Sustainable":formatNumber(r.remaining)}</span></div>`).join("")}</div>`);
    this.modal.querySelectorAll("[data-collection-sort]").forEach(button=>button.onclick=()=>{const key=button.dataset.collectionSort;if(this.collectionSort.key===key)this.collectionSort.dir*=-1;else this.collectionSort={key,dir:1};this.currentCollection();});
  }

  tech(){
    this.onRecalculate?.();if(this.showFutureTech===undefined)this.showFutureTech=true;if(this.showOldTech===undefined)this.showOldTech=true;const access=this.technology.canAccessStore(this.state),cats=["power","food","mining"];
    const paths=cats.map(cat=>{const level=this.technology.level(this.state,cat),items=this.technology.tree(cat).filter(t=>(this.showOldTech||t.level>=level)&&(this.showFutureTech||t.level<=Math.min(10,level+1)));return`<section class="tech-path"><div class="tech-path-header"><strong>${TECH_LABELS[cat]}</strong><span>L${level}/10</span></div><div class="tech-roadmap">${items.map(t=>{const owned=t.level<level,current=t.level===level,next=t.level===level+1,future=t.level>level+1,stateClass=owned?"owned":current?"current":next?"next":"future",stateLabel=owned?"OWNED":current?"CURRENT":next?"NEXT":"LOCKED";return`<article class="tech-roadmap-card ${stateClass}"><div class="tech-roadmap-level">L${t.level}</div><div class="tech-roadmap-copy"><div class="tech-roadmap-title"><strong>${t.name}</strong><span>${stateLabel}</span></div><p>${t.description}</p><div class="effect">${this.techEffect(cat,t)}</div>${future?`<div class="requirement">Requires ${TECH_LABELS[cat]} L${t.level-1}</div>`:""}</div><div class="tech-roadmap-action">${next?`<button data-tech-cat="${cat}" ${!access||this.state.company.cash<t.cost?"disabled":""}>${formatMoney(t.cost)}</button>`:current?`<span>ACTIVE</span>`:owned?`<span>✓</span>`:`<span>🔒</span>`}</div></article>`;}).join("")}</div></section>`;}).join("");
    this.open("Corporate Technology",`<div class="tech-toolbar enhanced"><article class="card"><h3>${access?"CORPORATE SYSTEMS ONLINE":"CORPORATE SYSTEMS UNAVAILABLE"}</h3><p>${this.technology.accessText(this.state)}</p><div class="effect warn">Advanced licences are corporation-scale investments. The next purchasable tier is always shown even when future technology is hidden.</div></article><div class="tech-toggle-row"><button data-tech-toggle data-tech-future-toggle>${this.showFutureTech?"HIDE FUTURE TECH":"SHOW FUTURE TECH"}</button><button data-tech-old-toggle>${this.showOldTech?"HIDE OLD TECH":"SHOW OLD TECH"}</button></div></div><div class="tech-tree">${paths}</div>`);
    this.modal.querySelector("[data-tech-future-toggle]").onclick=()=>{this.showFutureTech=!this.showFutureTech;this.tech()};this.modal.querySelector("[data-tech-old-toggle]").onclick=()=>{this.showOldTech=!this.showOldTech;this.tech()};this.modal.querySelectorAll("[data-tech-cat]").forEach(b=>b.onclick=()=>{const r=this.technology.buy(this.state,b.dataset.techCat);if(r.ok){this.onRecalculate?.();this.repo.save(this.state);this.toast(`${r.tech.name} licensed permanently.`);this.tech()}else this.toast(r.reason)});
  }

  menu(){this.open("Game",`<div class="grid2"><button data-save>Save now</button><button data-diagnostics>Diagnostics</button><button data-help>How to play</button><button data-center>Centre on ship</button><button data-colonies>All colonies</button><button data-reset class="bad">HARD RESET ALL MINEIT DATA</button></div>`);this.modal.querySelector("[data-save]").onclick=()=>this.toast(this.repo.save(this.state)?"Game saved.":"Save failed.");this.modal.querySelector("[data-diagnostics]").onclick=()=>this.diagnosticsPanel();this.modal.querySelector("[data-center]").onclick=()=>{this.state.camera={x:-4,y:-4};this.modal.classList.add("hidden")};this.modal.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();this.modal.querySelector("[data-help]").onclick=()=>this.help();this.modal.querySelector("[data-reset]").onclick=()=>this.onHardReset();}

  async help(){
    const bands=this.resources.qualityBands(),catalog=this.resources.catalog(),price=v=>v<10?`£${Number(v).toFixed(2)}`:formatMoney(v);
    const resources=["Food","Build","Fuel","Ore"].map(category=>{const items=catalog.filter(r=>r.category===category);return`<div class="help-resource-category"><h4 class="${category.toLowerCase()}">${category}</h4><p>${CATEGORY_HELP[category]}</p><div class="help-resource-table">${items.map(r=>`<div class="help-resource-row"><strong>${r.name}</strong><span>${r.rarity}</span><span>${r.manufactured?"Manufactured":r.renewable?"Renewable":"Finite"}</span><span>M${r.miningLevel||1}</span><span>${price(this.resources.baseSellPrice(r.type,r.id))}/u</span><small>${r.unlock||"Surface Recovery"}</small></div>`).join("")}</div></div>`;}).join("");
    const qualityRows=bands.map(b=>`<div class="help-data-row"><strong class="${b.className}">${b.label}</strong><span>Q${formatNumber(b.min)}–${formatNumber(b.max)}</span><span>×${b.multiplier.toFixed(2)} sale value</span></div>`).join("");
    const techRows=["power","food","mining"].map(cat=>`<div class="help-tech-block"><h4>${TECH_LABELS[cat]}</h4>${this.technology.tree(cat).map(t=>`<div class="help-tech-row"><strong>L${t.level} ${t.name}</strong><span>${t.level===1?"Starting technology":formatMoney(t.cost)}</span><small>${this.techEffect(cat,t)}</small></div>`).join("")}</div>`).join("");
    const indexItems=[["overview","Objective"],["controls","Screen & controls"],["survey","Surveying"],["map","Map, tiles & filters"],["resources","All resources"],["quality","Quality & value"],["deposits","Deposit size & depletion"],["sites","Developing sites"],["colony","Colony economy & survival"],["tech","Technology"],["trade","Corporate trade ship"],["contracts","Contracts & scoring"],["portfolio","Multiple colonies"],["liability","Returns & liability colonies"],["save","Saving & diagnostics"]].map(([id,label])=>`<button data-help-target="help-${id}">${label}</button>`).join("");
    let body;
    try{
      body=await renderViewTemplate("./views/help-manual.html",{
        INDEX_ITEMS:indexItems,RESOURCES:resources,QUALITY_ROWS:qualityRows,TECH_ROWS:techRows,
        HOLDOVER_COST_MULTIPLIER:CONFIG.HOLDOVER_COST_MULTIPLIER.toFixed(2),LIABILITY_COST_MULTIPLIER:CONFIG.LIABILITY_COST_MULTIPLIER.toFixed(2),
        FIRST_TRADE_DAY:CONFIG.FIRST_TRADE_DAY,TRADE_INTERVAL_DAYS:CONFIG.TRADE_INTERVAL_DAYS,CORPORATE_BUY_MARKUP:CONFIG.CORPORATE_BUY_MARKUP.toFixed(2),
        MAX_EXTENSIONS:CONFIG.MAX_EXTENSIONS,RENEWAL_YEARS:CONFIG.RENEWAL_YEARS,RETURN_MIN_RESOURCE_RATIO_PCT:Math.round(CONFIG.RETURN_MIN_RESOURCE_RATIO*100),
        RELOCATION_BASE_COST:formatMoney(CONFIG.RELOCATION_BASE_COST),RELOCATION_PER_COLONIST:formatMoney(CONFIG.RELOCATION_PER_COLONIST),RELOCATION_PER_INDUSTRY_LEVEL:formatMoney(CONFIG.RELOCATION_PER_INDUSTRY_LEVEL)
      });
    }catch(error){this.diagnostics?.error?.("help template failed",error);this.toast("Unable to load the field manual.");return;}
    this.open("How to Play — Field Manual",body);this.modal.querySelectorAll("[data-help-target]").forEach(button=>button.onclick=()=>{const target=this.modal.querySelector(`#${button.dataset.helpTarget}`);target?.scrollIntoView({behavior:"smooth",block:"start"});});
  }
}
