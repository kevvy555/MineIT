import { UIController as BaseUIController } from "./building-details-ui.js";
import { formatNumber } from "../core/utils.js";

const ATLAS_COLUMNS=8;
const ATLAS_ROWS=5;
const FAMILY_LABELS={
  quarry:"QUARRY L1",
  mine:"MINE L1",
  "deep-mine":"DEEP MINE L1",
  rig:"EXTRACTION RIG L1",
  farm:"FARM L1",
  ranch:"RANCH L1",
  bio:"BIO HARVESTER L1",
  "bio-harvester":"BIO HARVESTER L1",
  algae:"ALGAE FACILITY L1",
  "algae-facility":"ALGAE FACILITY L1"
};

/** Task-first undeveloped-resource panel and development action. */
export class UIController extends BaseUIController{
  resourceAtlasStyle(tile){
    const index=this.icons?.frameIndex?.(tile),src=this.icons?.imagePath?.(tile);
    if(index===undefined||!src)return"";
    const column=index%ATLAS_COLUMNS,row=Math.floor(index/ATLAS_COLUMNS);
    const x=column?column*100/(ATLAS_COLUMNS-1):0,y=row?row*100/(ATLAS_ROWS-1):0;
    return `background-image:url('${src}');background-position:${x}% ${y}%`;
  }

  requirementCard(label,value,current,ready){
    return `<div class="resource-requirement ${ready?"ready":"blocked"}"><small>${label}</small><strong>${value}</strong><span>${current}</span></div>`;
  }

  renderUndevelopedResource(tile){
    const panel=this.tilePanel;if(!panel)return;
    const renewable=this.resources.isRenewable(tile),category=this.resources.categoryName(tile.type),rarity=tile.resourceRarity||"Resource",size=renewable?(tile.abundanceLabel||"Renewable"):(tile.depositScale||"Finite"),remaining=renewable?"RENEWABLE":formatNumber(tile.reserve||0),stock=formatNumber(this.stockFor(tile)),rate=this.resources.collectionRate(this.state,tile),req=this.sites.developRequirements(this.state,tile),requiredLevel=tile.requiredMiningLevel||req.requiredLevel||1,currentMining=this.technology.level(this.state,"mining"),techReady=this.technology.canExploit(this.state,tile),buildStock=this.inventory.amount(this.state,"build"),freeWorkforce=this.colony.freeWorkforce(this.state),buildReady=buildStock>=(req.build||0),workforceReady=freeWorkforce>=(req.workforce||0),family=this.land.extractionFamily(tile),building=FAMILY_LABELS[family]||`${String(family||"SITE").replace(/-/g," ").toUpperCase()} L1`,artStyle=this.resourceAtlasStyle(tile);
    const stateText=req.ok?"READY TO DEVELOP":req.reason||"DEVELOPMENT BLOCKED";

    panel.classList.remove("building-detail-panel");
    panel.classList.add("resource-detail-panel");
    panel.innerHTML=`<div class="resource-detail-shell">
      <section class="resource-detail-hero">
        <div class="resource-detail-art" role="img" aria-label="${tile.name}" style="${artStyle}"></div>
        <div class="resource-detail-copy">
          <div class="resource-detail-kicker">SURVEYED RESOURCE</div>
          <strong class="resource-detail-title">${tile.name}</strong>
          <div class="resource-detail-badges"><span class="resource-badge accent">UNDEVELOPED</span><span class="resource-badge">${category.toUpperCase()}</span><span class="resource-badge ${rarity.toLowerCase()}">${String(rarity).toUpperCase()}</span></div>
        </div>
      </section>

      <section class="resource-detail-facts">
        <div class="resource-fact"><small>QUALITY</small><strong class="accent">Q${formatNumber(tile.quality||0)}</strong></div>
        <div class="resource-fact"><small>${renewable?"ABUNDANCE":"DEPOSIT SIZE"}</small><strong>${String(size).toUpperCase()}</strong></div>
        <div class="resource-fact"><small>${renewable?"RESOURCE":"REMAINING"}</small><strong>${remaining}</strong></div>
        <div class="resource-fact"><small>IN STOCK</small><strong>${stock}</strong></div>
      </section>

      <section class="resource-detail-section">
        <div class="resource-section-title"><span>DEVELOPMENT REQUIREMENTS</span><i></i></div>
        <div class="resource-requirements">
          ${this.requirementCard("MINING TECH",`L${requiredLevel}`,`Current L${currentMining}`,techReady)}
          ${this.requirementCard("BUILD",formatNumber(req.build||0),`${formatNumber(buildStock)} available`,buildReady)}
          ${this.requirementCard("WORKFORCE",formatNumber(req.workforce||0),`${formatNumber(freeWorkforce)} free`,workforceReady)}
        </div>
        <div class="resource-ready-state ${req.ok?"ready":"blocked"}">${stateText}</div>
      </section>

      <section class="resource-detail-section">
        <div class="resource-section-title"><span>WHEN DEVELOPED</span><i></i></div>
        <div class="resource-developed-result">
          <div><small>BUILDING</small><strong>${building}</strong></div>
          <div><small>OUTPUT</small><strong>+${formatNumber(rate)} ${category.toUpperCase()} / DAY</strong></div>
        </div>
      </section>

      <div class="resource-detail-actions">
        <button class="action resource-develop" data-resource-develop ${req.ok?"":"disabled"}>DEVELOP SITE</button>
        <button class="resource-close" data-resource-close>CLOSE</button>
      </div>
    </div>`;
    panel.classList.remove("hidden");

    panel.querySelector("[data-resource-close]").onclick=()=>panel.classList.add("hidden");
    const develop=panel.querySelector("[data-resource-develop]");
    if(develop&&req.ok)develop.onclick=()=>{
      const result=this.sites.develop(this.state,tile);
      if(!result.ok){this.toast(result.reason);this.renderUndevelopedResource(tile);return;}
      this.land.syncExtraction(tile,result.build);
      this.onRecalculate?.();
      this.logEvent?.("site-developed",`${tile.name} site developed at ${tile.x},${tile.y}.`,{x:tile.x,y:tile.y,resource:tile.name,type:tile.type,quality:tile.quality,level:tile.level,buildCost:result.build});
      this.repo.save(this.state);
      this.toast(`${tile.name} developed.`);
      this.renderContext?.();
      this.tile(tile);
    };
  }

  tile(tile){
    this.tilePanel?.classList.remove("resource-detail-panel");
    if(tile?.revealed&&tile.resourceId&&!tile.developed){this.renderUndevelopedResource(tile);return;}
    super.tile(tile);
  }
}
