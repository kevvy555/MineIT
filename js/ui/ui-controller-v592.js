import { UIController as V590UIController } from "./ui-controller-v590.js?v=5.9.0&legacy=1";
import { formatMoney, formatNumber } from "../core/utils.js?v=5.5.5";
import { developmentKind, developmentLevel, developmentOriginalPath } from "./land-art-v591.js?v=5.9.1";

const FAMILY_LABELS={
  housing:"Housing",
  industry:"Industry",
  quarry:"Quarry",
  mine:"Mine",
  "deep-mine":"Deep Mine",
  rig:"Extraction Rig",
  farm:"Farm",
  ranch:"Ranch",
  "bio-harvester":"Bio Harvester",
  "algae-facility":"Algae Facility"
};

function familyLabel(dev){const kind=developmentKind(dev);return FAMILY_LABELS[kind]||kind||"Building";}
function costText(req){
  const parts=[];
  if((req?.cash||0)>0)parts.push(formatMoney(req.cash));
  if((req?.build||0)>0)parts.push(`${formatNumber(req.build)} BUILD`);
  if((req?.ore||0)>0)parts.push(`${formatNumber(req.ore)} ORE`);
  return parts.join(" + ")||"NO MATERIAL COST";
}

/** v5.9.2 makes building details visual, compact and task-first. */
export class UIController extends V590UIController{
  open(title,body){
    this.modal?.classList.remove("building-detail-modal");
    super.open(title,body);
  }

  buildingHero(dev,{eyebrow="COLONY BUILDING",title=familyLabel(dev),subtitle=""}={}){
    const level=developmentLevel(dev),src=developmentOriginalPath(dev);
    return `<section class="building-detail-hero">
      <div class="building-art-frame">${src?`<img src="${src}" alt="${title} level ${level}" decoding="async">`:""}</div>
      <div class="building-hero-copy">
        <div class="building-kicker">${eyebrow}</div>
        <div class="building-name-row"><strong>${title}</strong><span class="building-level-badge">L${level}</span></div>
        ${subtitle?`<small>${subtitle}</small>`:""}
      </div>
    </section>`;
  }

  openColonyBuilding(tile){
    const dev=tile?.development;if(!dev)return;
    const kind=dev.kind,level=developmentLevel(dev),label=this.development.label(kind),terrain=this.land.terrainLabel(tile.terrain),capacity=this.development.contribution(kind,level),next=this.development.canUpgrade(this.state,tile),covered=tile.resourceId?`${tile.name} • Q${formatNumber(tile.quality)}`:null,total=kind==="housing"?this.state.colony?.housingCapacity:this.state.metrics?.industryInstalled;
    const capacityLabel=kind==="housing"?"Housing capacity":"Industry capacity";
    const totalLabel=kind==="housing"?"Colony housing":"Colony industry";
    const body=`<div class="building-detail-shell">
      ${this.buildingHero(dev,{title:label,subtitle:`${terrain}${covered?" • resource covered":""}`})}
      <div class="building-stat-grid">
        <div class="building-stat"><small>${capacityLabel}</small><strong>+${formatNumber(capacity)}</strong></div>
        <div class="building-stat"><small>${totalLabel}</small><strong>${formatNumber(total||0)}</strong></div>
        ${covered?`<div class="building-stat building-stat-wide warn"><small>Covered resource</small><strong>${covered}</strong></div>`:""}
      </div>
      <section class="building-upgrade-strip ${next.ok?"ready":next.max?"max":"locked"}">
        <div><small>${next.ok?"NEXT UPGRADE":next.max?"DEVELOPMENT":"UPGRADE BLOCKED"}</small><strong>${next.ok?`L${level} → L${next.nextLevel}`:next.max?"MAX LEVEL":next.reason}</strong></div>
        ${next.ok?`<span>${costText(next)}</span>`:""}
      </section>
      <div class="building-detail-actions">
        <button class="action" data-building-upgrade ${next.ok?"":"disabled"}>${next.ok?`UPGRADE TO L${next.nextLevel}`:next.max?"MAX LEVEL":"UPGRADE LOCKED"}</button>
        <button class="bad" data-building-demolish>DEMOLISH</button>
      </div>
    </div>`;
    this.open(`${label} L${level}`,body);this.modal.classList.add("building-detail-modal");
    const upgrade=this.modal.querySelector("[data-building-upgrade]");
    if(upgrade&&next.ok)upgrade.onclick=()=>{const r=this.development.upgrade(this.state,tile);if(!r.ok){this.toast(r.reason);this.openColonyBuilding(tile);return;}this.onRecalculate?.();this.repo.save(this.state);this.toast(`${label} upgraded to L${tile.development.level}.`);this.openColonyBuilding(tile);};
    this.modal.querySelector("[data-building-demolish]").onclick=()=>{if(confirm(`Demolish ${label} L${level}?`))this.onDemolishDevelopment?.(tile);};
  }

  compactExtractionPanel(tile){
    const panel=this.tilePanel;if(!panel||panel.classList.contains("hidden")||!tile?.developed)return;
    const dev=tile.development||{kind:"extract",family:tile.family,level:tile.level||1},kind=developmentKind(dev),family=familyLabel(dev),terrain=this.land.terrainLabel(tile.terrain),workers=this.colony.siteWorkforce(this.state,tile),category=this.resources.categoryName(tile.type),level=developmentLevel(dev);
    panel.classList.add("building-detail-panel");
    const title=panel.querySelector(".panel-title");
    if(title&&!panel.querySelector(".building-detail-hero"))title.insertAdjacentHTML("afterend",this.buildingHero(dev,{eyebrow:`${category.toUpperCase()} FACILITY`,title:family,subtitle:`${tile.name} • ${terrain}`}));

    const metrics=[...panel.querySelectorAll(":scope > .grid3 > .metric")];
    const remove=new Set(["Category","Rarity","Capacity","Deposit","Est. life"]);
    for(const metric of metrics){const label=metric.querySelector("small")?.textContent?.trim();if(remove.has(label))metric.remove();}
    const grid=panel.querySelector(":scope > .grid3");
    if(grid){grid.classList.add("building-key-grid");if(!grid.querySelector("[data-building-workers]")){const worker=document.createElement("div");worker.className="metric";worker.dataset.buildingWorkers="1";worker.innerHTML=`<small>Workers</small><strong>${formatNumber(workers)}</strong>`;grid.appendChild(worker);}}
    for(const req of [...panel.querySelectorAll(":scope > .requirement")]){if(req.textContent.trim().startsWith("Mining requirement:"))req.remove();}

    const upgrade=panel.querySelector("[data-upgrade]");
    if(upgrade){const req=this.sites.upgradeRequirements(this.state,tile);upgrade.innerHTML=req.ok?`UPGRADE TO L${req.nextLevel}<span class="building-action-cost">${costText(req)}</span>`:req.max?"MAX LEVEL":`UPGRADE LOCKED<span class="building-action-cost">${req.reason}</span>`;}
    if(!panel.querySelector("[data-building-demolish]")){
      const actions=document.createElement("div");actions.className="building-detail-actions extraction-actions";
      if(upgrade)actions.appendChild(upgrade);
      const demolish=document.createElement("button");demolish.className="bad";demolish.dataset.buildingDemolish="1";demolish.textContent="DEMOLISH";actions.appendChild(demolish);panel.appendChild(actions);
      demolish.onclick=()=>{if(confirm(`Demolish the ${family} L${level}? The resource remains.`))this.onDemolishDevelopment?.(tile);};
    }
  }

  tile(tile){
    this.tilePanel?.classList.remove("building-detail-panel");
    super.tile(tile);
    if(tile?.developed)this.compactExtractionPanel(tile);
  }

  landTile(tile){
    const dev=tile?.development;
    if(dev?.kind==="housing"||dev?.kind==="industry"){this.openColonyBuilding(tile);return;}
    if(dev?.kind==="extract"||tile?.developed){this.tile(tile);return;}
    super.landTile(tile);
  }
}
