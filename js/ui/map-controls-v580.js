import { STATE_FILTERS, SIZE_FILTERS } from "./map-filter-definitions.js?v=5.6.0";

const QUICK_FILTERS=[
  ["all","ALL"],["problems","PROBLEMS"],["buildings","BUILDINGS"],["upgradeable","UPGRADE"],
  ["food","FOOD"],["build","BUILD"],["fuel","FUEL"],["ore","ORE"]
];

/** v5.8 single-map controls. Quick filters answer gameplay questions; advanced filters remain available. */
export class MapControls{
  constructor({host,state,resources,filters,typeFilters,sizeFilters,qualityFilters,onFilterChange}){
    Object.assign(this,{host,state,resources,filters,typeFilters,sizeFilters,qualityFilters,onFilterChange});
    this.filtersOpen=false;this.filterCategory=null;this.focusMode=state.colony?.land?.focusMode||"all";
    this.build();this.sync();
  }
  disabledCount(){return[this.filters,this.typeFilters,this.sizeFilters,this.qualityFilters].reduce((n,g)=>n+Object.values(g||{}).filter(v=>v===false).length,0);}
  setFocus(mode="all"){
    this.focusMode=mode;this.state.colony?.land&&(this.state.colony.land.focusMode=mode);
    document.dispatchEvent(new CustomEvent("mineit:map-focus",{detail:{mode}}));this.sync();this.onFilterChange?.();
  }
  build(){
    this.host.replaceChildren();this.host.classList.add("map-toolbar");
    const main=document.createElement("div");main.className="map-toolbar-main";
    const views=document.createElement("div");views.id="mapViewToggle";views.className="map-view-toggle";
    const mapLabel=document.createElement("button");mapLabel.type="button";mapLabel.dataset.mapView="unified";mapLabel.className="active";mapLabel.textContent="COLONY MAP";mapLabel.onclick=()=>this.setFocus("all");views.appendChild(mapLabel);
    const problems=document.createElement("button");problems.type="button";problems.id="mapProblemsToggle";problems.className="map-problems-toggle";problems.textContent="PROBLEMS";problems.onclick=()=>this.setFocus(this.focusMode==="problems"?"all":"problems");
    const filter=document.createElement("button");filter.type="button";filter.id="mapFilterToggle";filter.className="map-filter-toggle";filter.textContent="FILTERS";filter.onclick=()=>{this.filtersOpen=true;this.filterCategory=null;this.sync();};
    main.append(views,problems,filter);

    const panel=document.createElement("div");panel.id="mapFilters";panel.className="map-filters hidden";panel.setAttribute("aria-label","Unified map filters");
    const back=document.createElement("button");back.type="button";back.className="map-filter-back";back.dataset.filterBack="1";back.onclick=()=>{if(this.filterCategory)this.filterCategory=null;else this.filtersOpen=false;this.sync();};panel.appendChild(back);
    const tabs=document.createElement("div");tabs.className="map-filter-tabs";
    for(const [key,label] of QUICK_FILTERS){const button=document.createElement("button");button.type="button";button.className="map-filter-category map-quick-filter";button.dataset.mapFocus=key;button.textContent=label;button.onclick=()=>this.setFocus(key);tabs.appendChild(button);}
    for(const [key,label] of [["state","STATE"],["size","SIZE"],["quality","QUALITY"]]){const button=document.createElement("button");button.type="button";button.className="map-filter-category";button.dataset.filterCategory=key;button.textContent=label;button.onclick=()=>{this.filterCategory=key;this.sync();};tabs.appendChild(button);}panel.appendChild(tabs);
    this.addGroup(panel,"state","mapFilter",STATE_FILTERS,this.filters);
    this.addGroup(panel,"size","mapSize",SIZE_FILTERS,this.sizeFilters);
    this.addGroup(panel,"quality","mapQuality",this.resources.qualityBands(),this.qualityFilters);
    this.host.append(main,panel);Object.assign(this,{main,views,problems,filter,panel,back,tabs});
  }
  addGroup(panel,key,attribute,items,filters){
    const group=document.createElement("div");group.className="map-filter-group hidden";group.dataset.filterGroup=key;
    const options=document.createElement("div");options.className="map-filter-options";
    const bulk=(label,value)=>{const b=document.createElement("button");b.type="button";b.className="map-filter-bulk";b.textContent=label;b.onclick=()=>{for(const k of Object.keys(filters))filters[k]=value;this.sync();this.onFilterChange?.();};return b;};options.append(bulk("ALL",true),bulk("CLEAR",false));
    for(const item of items){const itemKey=item.key??item[0],text=item.label?.toUpperCase?.()??item[1],b=document.createElement("button");b.type="button";b.className=`map-filter active ${item.className||""}`;b.dataset[attribute]=itemKey;b.textContent=text;b.setAttribute("aria-pressed","true");if(item.min)b.title=`Q${item.min}–${item.max}`;b.onclick=()=>{filters[itemKey]=!filters[itemKey];this.sync();this.onFilterChange?.();};options.appendChild(b);}group.appendChild(options);panel.appendChild(group);
  }
  syncFilterButtons(){
    const sync=(selector,filters,key)=>this.panel.querySelectorAll(selector).forEach(b=>{const active=filters[b.dataset[key]]!==false;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
    sync("[data-map-filter]",this.filters,"mapFilter");sync("[data-map-size]",this.sizeFilters,"mapSize");sync("[data-map-quality]",this.qualityFilters,"mapQuality");
  }
  sync(){
    const selecting=this.state.status==="site-selection",filtering=this.filtersOpen&&!selecting;
    this.main.classList.toggle("hidden",filtering||selecting);this.panel.classList.toggle("hidden",!filtering);
    this.problems.classList.toggle("active",this.focusMode==="problems");
    const off=this.disabledCount(),focus=this.focusMode!=="all"?` • ${this.focusMode.toUpperCase()}`:"";this.filter.textContent=off?`FILTERS • ${off} OFF${focus}`:`FILTERS${focus}`;
    const inGroup=!!this.filterCategory;this.tabs.classList.toggle("hidden",inGroup);this.panel.querySelectorAll("[data-filter-group]").forEach(g=>g.classList.toggle("hidden",!inGroup||g.dataset.filterGroup!==this.filterCategory));this.back.textContent=inGroup?"BACK":"DONE";
    this.panel.querySelectorAll("[data-map-focus]").forEach(b=>b.classList.toggle("active",b.dataset.mapFocus===this.focusMode));this.syncFilterButtons();
  }
}
