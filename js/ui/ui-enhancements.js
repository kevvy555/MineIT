import { formatNumber } from "../core/utils.js";
import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates } from "../core/view-template.js";

const COLLECTION_COLUMNS=[["name","Resource"],["category","Category"],["rate","Rate"],["stock","Stock"],["remaining","Remaining"]];
const ENHANCEMENT_VIEWS={collection:"./views/current-collection.html",menu:"./views/game-menu.html"};
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

  menu(){
    const source=this.enhancementViewSource(ENHANCEMENT_VIEWS.menu,"game menu",()=>this.menu());if(!source)return false;this.open("Game",source);const body=this.modal.querySelector(".modal-body");if(!body)return false;
    body.querySelector("[data-save]").onclick=()=>this.toast(this.repo.save(this.state)?"Game saved.":"Save failed.");body.querySelector("[data-diagnostics]").onclick=()=>this.diagnosticsPanel();body.querySelector("[data-center]").onclick=()=>{this.state.camera={x:-4,y:-4};this.modal.classList.add("hidden");};body.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();body.querySelector("[data-help]").onclick=()=>this.help();body.querySelector("[data-development-tasks]").onclick=()=>this.developmentTasks();body.querySelector("[data-reset]").onclick=()=>this.onHardReset();return true;
  }
}
