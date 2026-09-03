import { UIController as BaseUIController } from "./trade-reserve-ui.js";
import { formatNumber } from "../core/utils.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates } from "../core/view-template.js";

const ATLAS_COLUMNS=8;
const ATLAS_ROWS=5;
const UNDEVELOPED_RESOURCE_VIEW="./views/undeveloped-resource.html";
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
preloadViewTemplates([UNDEVELOPED_RESOURCE_VIEW]);

/** Task-first undeveloped-resource panel and development action. */
export class UIController extends BaseUIController{
  resourceAtlasStyle(tile){
    const index=this.icons?.frameIndex?.(tile),src=this.icons?.imagePath?.(tile);
    if(index===undefined||!src)return"";
    const column=index%ATLAS_COLUMNS,row=Math.floor(index/ATLAS_COLUMNS);
    const x=column?column*100/(ATLAS_COLUMNS-1):0,y=row?row*100/(ATLAS_ROWS-1):0;
    return `background-image:url('${src}');background-position:${x}% ${y}%`;
  }

  setResourceText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");return node;}

  undevelopedViewSource(tile){
    const source=getLoadedViewTemplate(UNDEVELOPED_RESOURCE_VIEW);if(source)return source;
    const revision=(this.undevelopedViewRevision||0)+1;this.undevelopedViewRevision=revision;
    loadViewTemplate(UNDEVELOPED_RESOURCE_VIEW).then(()=>{
      if(revision===this.undevelopedViewRevision&&this.activeUndevelopedTile===tile)this.renderUndevelopedResource(tile);
    }).catch(error=>{
      if(revision!==this.undevelopedViewRevision)return;
      this.diagnostics?.error?.("undeveloped resource view failed",error);this.toast("Unable to open resource details.");
    });
    return null;
  }

  populateResourceRequirements(root,items){
    const host=root.querySelector("[data-resource-requirements]"),template=root.querySelector("[data-resource-requirement-template]");if(!host||!template)return;
    const rows=document.createDocumentFragment();
    for(const item of items){
      const row=template.content.cloneNode(true),card=row.querySelector(".resource-requirement");
      card.classList.add(item.ready?"ready":"blocked");
      this.setResourceText(row,"[data-resource-requirement-label]",item.label);
      this.setResourceText(row,"[data-resource-requirement-value]",item.value);
      this.setResourceText(row,"[data-resource-requirement-current]",item.current);
      rows.append(row);
    }
    host.replaceChildren(rows);
  }

  renderUndevelopedResource(tile){
    const panel=this.tilePanel;if(!panel)return false;this.activeUndevelopedTile=tile;
    const source=this.undevelopedViewSource(tile);if(!source){panel.classList.add("hidden");return false;}
    const renewable=this.resources.isRenewable(tile),category=this.resources.categoryName(tile.type),rarity=tile.resourceRarity||"Resource",size=renewable?(tile.abundanceLabel||"Renewable"):(tile.depositScale||"Finite"),remaining=renewable?"RENEWABLE":formatNumber(tile.reserve||0),stock=formatNumber(this.stockFor(tile)),rate=this.resources.collectionRate(this.state,tile),req=this.sites.developRequirements(this.state,tile),requiredLevel=tile.requiredMiningLevel||req.requiredLevel||1,currentMining=this.technology.level(this.state,"mining"),techReady=this.technology.canExploit(this.state,tile),buildStock=this.inventory.amount(this.state,"build"),freeWorkforce=this.colony.freeWorkforce(this.state),buildReady=buildStock>=(req.build||0),workforceReady=freeWorkforce>=(req.workforce||0),family=this.land.extractionFamily(tile),building=FAMILY_LABELS[family]||`${String(family||"SITE").replace(/-/g," ").toUpperCase()} L1`,artStyle=this.resourceAtlasStyle(tile),stateText=req.ok?"READY TO DEVELOP":req.reason||"DEVELOPMENT BLOCKED";
    const fragment=document.createRange().createContextualFragment(source),root=fragment.querySelector("[data-undeveloped-resource-view]");if(!root)return false;
    const art=root.querySelector("[data-resource-art]");if(art){art.setAttribute("aria-label",tile.name);art.style.cssText=artStyle;}
    this.setResourceText(root,"[data-resource-title]",tile.name);
    this.setResourceText(root,"[data-resource-category]",category.toUpperCase());
    const rarityBadge=this.setResourceText(root,"[data-resource-rarity]",String(rarity).toUpperCase());if(rarityBadge)rarityBadge.className=`resource-badge ${String(rarity).toLowerCase()}`;
    this.setResourceText(root,"[data-resource-quality]",`Q${formatNumber(tile.quality||0)}`);
    this.setResourceText(root,"[data-resource-size-label]",renewable?"ABUNDANCE":"DEPOSIT SIZE");
    this.setResourceText(root,"[data-resource-size]",String(size).toUpperCase());
    this.setResourceText(root,"[data-resource-remaining-label]",renewable?"RESOURCE":"REMAINING");
    this.setResourceText(root,"[data-resource-remaining]",remaining);
    this.setResourceText(root,"[data-resource-stock]",stock);
    this.populateResourceRequirements(root,[
      {label:"MINING TECH",value:`L${requiredLevel}`,current:`Current L${currentMining}`,ready:techReady},
      {label:"BUILD",value:formatNumber(req.build||0),current:`${formatNumber(buildStock)} available`,ready:buildReady},
      {label:"WORKFORCE",value:formatNumber(req.workforce||0),current:`${formatNumber(freeWorkforce)} free`,ready:workforceReady}
    ]);
    const readyState=this.setResourceText(root,"[data-resource-ready-state]",stateText);if(readyState)readyState.className=`resource-ready-state ${req.ok?"ready":"blocked"}`;
    this.setResourceText(root,"[data-resource-building]",building);
    this.setResourceText(root,"[data-resource-output]",`+${formatNumber(rate)} ${category.toUpperCase()} / DAY`);
    const develop=root.querySelector("[data-resource-develop]");if(develop)develop.disabled=!req.ok;

    panel.classList.remove("building-detail-panel","adaptive-building-panel");panel.classList.add("resource-detail-panel");panel.replaceChildren(fragment);panel.classList.remove("hidden");
    panel.querySelector("[data-resource-close]").onclick=()=>{this.activeUndevelopedTile=null;panel.classList.add("hidden");};
    const action=panel.querySelector("[data-resource-develop]");
    if(action&&req.ok)action.onclick=()=>{
      const result=this.sites.develop(this.state,tile);
      if(!result.ok){this.toast(result.reason);this.renderUndevelopedResource(tile);return;}
      this.land.syncExtraction(tile,result.build);
      this.onRecalculate?.();
      this.logEvent?.("site-developed",`${tile.name} site developed at ${tile.x},${tile.y}.`,{x:tile.x,y:tile.y,resource:tile.name,type:tile.type,quality:tile.quality,level:tile.level,buildCost:result.build});
      this.repo.save(this.state);
      this.toast(`${tile.name} developed.`);
      this.renderContext?.();
      this.activeUndevelopedTile=null;
      this.tile(tile);
    };
    return true;
  }

  appendDepletedDemolish(tile){
    const panel=this.tilePanel;if(!tile?.depleted||tile.development?.kind!=="extract"||!panel||panel.classList.contains("hidden"))return false;
    if(panel.querySelector("[data-depleted-demolish]"))return true;
    const demolish=document.createElement("button");demolish.className="bad";demolish.dataset.depletedDemolish="1";demolish.textContent="DEMOLISH DEPLETED SITE";panel.appendChild(demolish);
    demolish.onclick=()=>{if(typeof this.demolitionPanel==="function")this.demolitionPanel(tile);else this.onDemolishDevelopment?.(tile);};
    return true;
  }

  tile(tile){
    this.tilePanel?.classList.remove("resource-detail-panel");
    if(tile?.revealed&&tile.resourceId&&!tile.developed&&!tile.development){this.activeUndevelopedTile=tile;this.renderUndevelopedResource(tile);return;}
    this.activeUndevelopedTile=null;super.tile(tile);this.appendDepletedDemolish(tile);
  }
}
