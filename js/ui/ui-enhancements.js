import { formatMoney, formatNumber } from "../core/utils.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates } from "../core/view-template.js";

const TECH_LABELS={power:"POWER",food:"FOOD PRODUCTION",mining:"MINING"};
const COLLECTION_COLUMNS=[["name","Resource"],["category","Category"],["rate","Rate"],["stock","Stock"],["remaining","Remaining"]];
const ENHANCEMENT_VIEWS={collection:"./views/current-collection.html",menu:"./views/game-menu.html",technology:"./views/legacy-technology.html"};
preloadViewTemplates(Object.values(ENHANCEMENT_VIEWS));

export class UIEnhancementsMixin {
  enhancementViewSource(path,label,retry){
    const source=getLoadedViewTemplate(path);if(source)return source;
    loadViewTemplate(path).then(()=>retry?.()).catch(error=>{this.diagnostics?.error?.(`${label} view failed`,error);this.toast(`Unable to open ${label}.`);});
    this.toast(`Loading ${label}...`);return null;
  }
  setEnhancementText(root,selector,value){const node=root?.querySelector(selector);if(node)node.textContent=String(value??"");return node;}
  cloneEnhancementTemplate(root,selector){return root?.querySelector(selector)?.content.cloneNode(true)||null;}

  collectionSortValue(row,key){if(key==="name"||key==="category")return String(row[key]||"").toLowerCase();if(key==="remaining")return row.renewable?Number.POSITIVE_INFINITY:Number(row.remaining)||0;return Number(row[key])||0;}
  sortedCollectionRows(rows){
    const sort=this.collectionSort;return[...rows].sort((a,b)=>{const av=this.collectionSortValue(a,sort.key),bv=this.collectionSortValue(b,sort.key);let cmp=typeof av==="string"?av.localeCompare(bv):av-bv;if(!Number.isFinite(cmp))cmp=av===bv?0:av>bv?1:-1;if(cmp===0)cmp=String(a.name).localeCompare(String(b.name));return cmp*sort.dir;});
  }
  populateCollectionHeaders(body){
    const host=body.querySelector("[data-collection-head]"),headers=document.createDocumentFragment();
    for(const [key,label] of COLLECTION_COLUMNS){const fragment=this.cloneEnhancementTemplate(body,"[data-collection-header-template]");if(!fragment)continue;const button=fragment.querySelector("[data-collection-sort]");button.dataset.collectionSort=key;button.classList.toggle("active",this.collectionSort.key===key);this.setEnhancementText(fragment,"[data-collection-label]",label);this.setEnhancementText(fragment,"[data-collection-arrow]",this.collectionSort.key===key?(this.collectionSort.dir>0?"▲":"▼"):"↕");headers.append(fragment);}host?.replaceChildren(headers);
  }
  populateCollectionRows(body,rows){
    const host=body.querySelector("[data-collection-rows]"),rendered=document.createDocumentFragment();
    for(const row of rows){const fragment=this.cloneEnhancementTemplate(body,"[data-collection-row-template]");if(!fragment)continue;this.setEnhancementText(fragment,"[data-collection-name]",`${row.name}${row.sites>1?` ×${row.sites}`:""}`);this.setEnhancementText(fragment,"[data-collection-category]",row.category);this.setEnhancementText(fragment,"[data-collection-rate]",`${formatNumber(row.rate)}/d`);this.setEnhancementText(fragment,"[data-collection-stock]",formatNumber(row.stock));this.setEnhancementText(fragment,"[data-collection-remaining]",row.renewable?"Sustainable":formatNumber(row.remaining));rendered.append(fragment);}host?.replaceChildren(rendered);
  }
  bindCollectionSort(body){body.addEventListener("click",event=>{const button=event.target.closest?.("[data-collection-sort]");if(!button||!body.contains(button))return;const key=button.dataset.collectionSort;if(this.collectionSort.key===key)this.collectionSort.dir*=-1;else this.collectionSort={key,dir:1};this.currentCollection();});}
  currentCollection(){
    const source=this.enhancementViewSource(ENHANCEMENT_VIEWS.collection,"current collection",()=>this.currentCollection());if(!source)return false;
    const rows=this.collection.current(this.state);this.collectionSort||={key:"name",dir:1};this.open("Current Collection",source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    const empty=body.querySelector("[data-collection-empty]"),table=body.querySelector("[data-collection-table]");empty.hidden=rows.length>0;table.hidden=rows.length===0;
    if(!rows.length){this.setEnhancementText(empty,"[data-collection-empty-copy]",this.state.contract.ended?"This colony's mining contract has ended.":"Survey a resource tile and develop it to begin collection.");return true;}
    this.populateCollectionHeaders(body);this.populateCollectionRows(body,this.sortedCollectionRows(rows));this.bindCollectionSort(body);return true;
  }

  legacyTechnologyAction(category,tech,{owned,current,next},access){
    const node=document.createElement(next?"button":"span");
    if(next){node.dataset.techCat=category;node.disabled=!access||this.state.company.cash<tech.cost;node.textContent=formatMoney(tech.cost);}
    else node.textContent=current?"ACTIVE":owned?"✓":"🔒";
    return node;
  }
  buildLegacyTechnologyCard(body,category,tech,level,access){
    const fragment=this.cloneEnhancementTemplate(body,"[data-tech-card-template]");if(!fragment)return null;const card=fragment.querySelector("[data-tech-card]"),owned=tech.level<level,current=tech.level===level,next=tech.level===level+1,future=tech.level>level+1,stateClass=owned?"owned":current?"current":next?"next":"future",stateLabel=owned?"OWNED":current?"CURRENT":next?"NEXT":"LOCKED";
    card.classList.add(stateClass);this.setEnhancementText(card,"[data-tech-card-level]",`L${tech.level}`);this.setEnhancementText(card,"[data-tech-card-name]",tech.name);this.setEnhancementText(card,"[data-tech-card-state]",stateLabel);this.setEnhancementText(card,"[data-tech-card-description]",tech.description);this.setEnhancementText(card,"[data-tech-card-effect]",this.techEffect(category,tech));const requirement=card.querySelector("[data-tech-card-requirement]");requirement.hidden=!future;if(future)requirement.textContent=`Requires ${TECH_LABELS[category]} L${tech.level-1}`;card.querySelector("[data-tech-card-action]").replaceChildren(this.legacyTechnologyAction(category,tech,{owned,current,next},access));return card;
  }
  populateLegacyTechnology(body,categories,access){
    const host=body.querySelector("[data-tech-tree]"),paths=document.createDocumentFragment();
    for(const category of categories){const level=this.technology.level(this.state,category),items=this.technology.tree(category).filter(tech=>(this.showOldTech||tech.level>=level)&&(this.showFutureTech||tech.level<=Math.min(10,level+1))),fragment=this.cloneEnhancementTemplate(body,"[data-tech-path-template]");if(!fragment)continue;const path=fragment.querySelector("[data-tech-path]"),roadmap=path.querySelector("[data-tech-roadmap]"),cards=document.createDocumentFragment();this.setEnhancementText(path,"[data-tech-path-label]",TECH_LABELS[category]);this.setEnhancementText(path,"[data-tech-path-level]",`L${level}/10`);for(const tech of items){const card=this.buildLegacyTechnologyCard(body,category,tech,level,access);if(card)cards.append(card);}roadmap.replaceChildren(cards);paths.append(fragment);}host?.replaceChildren(paths);
  }
  bindLegacyTechnology(body){body.addEventListener("click",event=>{const button=event.target.closest?.("button");if(!button||!body.contains(button))return;if(button.matches("[data-tech-future-toggle]")){this.showFutureTech=!this.showFutureTech;this.tech();return;}if(button.matches("[data-tech-old-toggle]")){this.showOldTech=!this.showOldTech;this.tech();return;}if(!button.matches("[data-tech-cat]"))return;const result=this.technology.buy(this.state,button.dataset.techCat);if(result.ok){this.onRecalculate?.();this.repo.save(this.state);this.toast(`${result.tech.name} licensed permanently.`);this.tech();}else this.toast(result.reason);});}
  tech(){
    const source=this.enhancementViewSource(ENHANCEMENT_VIEWS.technology,"legacy technology",()=>this.tech());if(!source)return false;
    this.onRecalculate?.();if(this.showFutureTech===undefined)this.showFutureTech=true;if(this.showOldTech===undefined)this.showOldTech=true;const access=this.technology.canAccessStore(this.state),categories=["power","food","mining"];
    this.open("Corporate Technology",source);const body=this.modal.querySelector(".modal-body");if(!body)return false;this.setEnhancementText(body,"[data-tech-access-title]",access?"CORPORATE SYSTEMS ONLINE":"CORPORATE SYSTEMS UNAVAILABLE");this.setEnhancementText(body,"[data-tech-access-text]",this.technology.accessText(this.state));this.setEnhancementText(body,"[data-tech-future-toggle]",this.showFutureTech?"HIDE FUTURE TECH":"SHOW FUTURE TECH");this.setEnhancementText(body,"[data-tech-old-toggle]",this.showOldTech?"HIDE OLD TECH":"SHOW OLD TECH");this.populateLegacyTechnology(body,categories,access);this.bindLegacyTechnology(body);return true;
  }

  menu(){
    const source=this.enhancementViewSource(ENHANCEMENT_VIEWS.menu,"game menu",()=>this.menu());if(!source)return false;this.open("Game",source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    body.querySelector("[data-save]").onclick=()=>this.toast(this.repo.save(this.state)?"Game saved.":"Save failed.");body.querySelector("[data-diagnostics]").onclick=()=>this.diagnosticsPanel();body.querySelector("[data-center]").onclick=()=>{this.state.camera={x:-4,y:-4};this.modal.classList.add("hidden");};body.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();body.querySelector("[data-help]").onclick=()=>this.help();body.querySelector("[data-reset]").onclick=()=>this.onHardReset();return true;
  }
}
