import { WorldView } from "./world-view.js?v=5.5.5";

const STYLE_ID="map-layout-hotfix-556";
if(typeof document!=="undefined"&&!document.getElementById(STYLE_ID)){
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
#worldShell{grid-template-rows:30px minmax(0,1fr)!important;overflow:hidden!important}
#mapViewHost{height:30px!important;min-height:30px!important;display:flex!important;align-items:center!important;gap:4px!important;overflow:hidden!important}
#mapFilterHost{display:none!important}
#worldViewport{position:relative!important;min-height:0!important;overflow:hidden!important}
#world{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.map-filter-toggle{margin-left:auto;flex:0 0 auto;min-height:25px;padding:3px 8px;font-size:7px;font-weight:900;letter-spacing:.04em}
.map-filters{display:flex;align-items:center;gap:2px;width:100%;height:25px;min-width:0;overflow:hidden;padding:0;background:#05080a}
.map-filter-back{flex:0 0 auto;min-height:21px;padding:2px 6px;font-size:6px;font-weight:900;background:#111a20;border-color:#31414c;color:#c9d8df}
.map-filter-tabs{display:flex;flex:1 1 auto;gap:2px;min-width:0;overflow-x:auto;scrollbar-width:none}
.map-filter-tabs::-webkit-scrollbar,.map-filter-options::-webkit-scrollbar{display:none}
.map-filter-category{flex:1 0 auto;min-height:21px;padding:2px 7px;font-size:6.2px;font-weight:900}
.map-filter-group{display:flex;flex:1 1 auto;min-width:0;overflow:hidden}
.map-filter-options{display:flex;flex:1 1 auto;flex-wrap:nowrap;gap:2px;min-width:0;overflow-x:auto;scrollbar-width:none}
.map-filter,.map-filter-bulk{flex:0 0 auto;min-height:21px}
@media(max-width:370px){#worldShell{grid-template-rows:28px minmax(0,1fr)!important}#mapViewHost{height:28px!important;min-height:28px!important}.map-filter-toggle{padding:2px 6px;font-size:6.2px}.map-filter-category{padding:2px 6px;font-size:5.8px}.map-filter,.map-filter-bulk{font-size:5.6px;padding:2px 4px;min-height:20px}}
`;
  document.head.appendChild(style);
}

const STATE_FILTERS=[["developed","DEVELOPED"],["notDeveloped","NOT DEVELOPED"],["locked","LOCKED"]];
const TYPE_FILTERS=[["food","FOOD"],["build","BUILD"],["fuel","FUEL"],["ore","ORE"]];
const SIZE_FILTERS=[["limited","LIMITED"],["established","ESTABLISHED"],["small","SMALL"],["modest","MODEST"],["large","LARGE"],["huge","HUGE"],["colossal","COLOSSAL"],["vast","VAST"],["legacy","LEGACY"]];

WorldView.prototype.bindViewToggle=function(){
  const host=document.querySelector("#mapViewHost")||this.shell;
  document.querySelector("#mapViewToggle")?.remove();
  document.querySelector("#mapFilterToggle")?.remove();
  document.querySelector("#mapFilters")?.remove();
  this.toolbarHost=host;
  this.filtersOpen=false;
  this.filterCategory=null;
  const wrap=document.createElement("div");
  wrap.id="mapViewToggle";
  wrap.className="map-view-toggle";
  for(const[key,label]of[["land","LAND"],["resource","RESOURCES"]]){
    const button=document.createElement("button");
    button.type="button";
    button.dataset.mapView=key;
    button.textContent=label;
    button.onclick=()=>{
      if(!this.state.colony?.land)return;
      this.state.colony.land.view=key;
      this.filtersOpen=false;
      this.filterCategory=null;
      this.syncView();
      this.safeDraw();
    };
    wrap.appendChild(button);
  }
  const filter=document.createElement("button");
  filter.id="mapFilterToggle";
  filter.className="map-filter-toggle";
  filter.type="button";
  filter.onclick=()=>{
    if(this.view()!=="resource")return;
    this.filtersOpen=true;
    this.filterCategory=null;
    this.syncFilters();
    this.syncView();
  };
  host.appendChild(wrap);
  host.appendChild(filter);
  this.viewToggle=wrap;
  this.filterToggle=filter;
  this.syncView();
};

WorldView.prototype.syncView=function(){
  const view=this.view(),selecting=this.state.status==="site-selection",resource=view==="resource",off=this.filterDisabledCount(),filtering=resource&&this.filtersOpen&&!selecting&&!!this.land;
  this.viewToggle?.querySelectorAll("[data-map-view]").forEach(button=>button.classList.toggle("active",button.dataset.mapView===view));
  this.viewToggle?.classList.toggle("hidden",filtering||selecting||!this.land);
  if(this.filterToggle){
    this.filterToggle.textContent=off?`FILTERS • ${off} OFF`:"FILTERS";
    this.filterToggle.classList.toggle("active",filtering);
    this.filterToggle.classList.toggle("hidden",filtering||!resource||selecting||!this.land);
  }
  this.filterBar?.classList.toggle("hidden",!filtering);
  this.filterHost?.classList.add("hidden");
};

WorldView.prototype.bindFilters=function(){
  document.querySelector("#mapFilters")?.remove();
  const bar=document.createElement("div");
  bar.id="mapFilters";
  bar.className="map-filters hidden";
  bar.setAttribute("aria-label","Map tile filters");
  const back=document.createElement("button");
  back.type="button";
  back.className="map-filter-back";
  back.dataset.filterBack="1";
  back.onclick=()=>{
    if(this.filterCategory){this.filterCategory=null;this.syncFilters();}
    else{this.filtersOpen=false;this.syncView();}
  };
  bar.appendChild(back);
  const tabs=document.createElement("div");
  tabs.className="map-filter-tabs";
  for(const[key,label]of[["state","STATE"],["type","TYPE"],["size","SIZE"],["quality","QUALITY"]]){
    const button=document.createElement("button");
    button.type="button";
    button.className="map-filter-category";
    button.dataset.filterCategory=key;
    button.textContent=label;
    button.onclick=()=>{this.filterCategory=key;this.syncFilters();};
    tabs.appendChild(button);
  }
  bar.appendChild(tabs);
  const addGroup=(key,attribute,items,filters)=>{
    const row=document.createElement("div");
    row.className="map-filter-group hidden";
    row.dataset.filterGroup=key;
    const options=document.createElement("div");
    options.className="map-filter-options";
    const all=document.createElement("button");all.type="button";all.className="map-filter-bulk";all.textContent="ALL";
    const clear=document.createElement("button");clear.type="button";clear.className="map-filter-bulk";clear.textContent="CLEAR";
    all.onclick=()=>{for(const k of Object.keys(filters))filters[k]=true;this.syncFilters();this.safeDraw();};
    clear.onclick=()=>{for(const k of Object.keys(filters))filters[k]=false;this.syncFilters();this.safeDraw();};
    options.append(all,clear);
    for(const item of items){
      const itemKey=item.key??item[0],itemText=item.label?.toUpperCase?.()??item[1],button=document.createElement("button");
      button.type="button";
      button.className=`map-filter active ${item.className||""}`;
      button.dataset[attribute]=itemKey;
      button.textContent=itemText;
      button.setAttribute("aria-pressed","true");
      if(item.min)button.title=`Q${item.min}–${item.max}`;
      button.onclick=()=>{filters[itemKey]=!filters[itemKey];this.syncFilters();this.safeDraw();};
      options.appendChild(button);
    }
    row.appendChild(options);
    bar.appendChild(row);
  };
  addGroup("state","mapFilter",STATE_FILTERS,this.filters);
  addGroup("type","mapType",TYPE_FILTERS,this.typeFilters);
  addGroup("size","mapSize",SIZE_FILTERS,this.sizeFilters);
  addGroup("quality","mapQuality",this.resources.qualityBands(),this.qualityFilters);
  (this.toolbarHost||document.querySelector("#mapViewHost")||this.shell).appendChild(bar);
  this.filterBar=bar;
  this.filterBack=back;
  this.filterTabs=tabs;
  this.syncFilters();
  this.syncView();
};

WorldView.prototype.syncFilters=function(){
  if(!this.filterBar)return;
  const sync=(selector,filters,key)=>this.filterBar.querySelectorAll(selector).forEach(button=>{const active=filters[button.dataset[key]]!==false;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
  sync("[data-map-filter]",this.filters,"mapFilter");
  sync("[data-map-type]",this.typeFilters,"mapType");
  sync("[data-map-size]",this.sizeFilters,"mapSize");
  sync("[data-map-quality]",this.qualityFilters,"mapQuality");
  const inGroup=!!this.filterCategory;
  this.filterTabs?.classList.toggle("hidden",inGroup);
  this.filterBar.querySelectorAll("[data-filter-group]").forEach(group=>group.classList.toggle("hidden",!inGroup||group.dataset.filterGroup!==this.filterCategory));
  if(this.filterBack)this.filterBack.textContent=inGroup?"BACK":"DONE";
  if(this.filterToggle){const off=this.filterDisabledCount();this.filterToggle.textContent=off?`FILTERS • ${off} OFF`:"FILTERS";}
};

WorldView.prototype.resize=function(){
  const r=this.shell.getBoundingClientRect(),header=document.querySelector(".app-header")?.getBoundingClientRect().height||0,footer=document.querySelector(".app-footer")?.getBoundingClientRect().height||0,viewport=window.visualViewport?.height||window.innerHeight||0,width=Math.max(1,r.width||window.innerWidth||320),fallbackHeight=Math.max(1,viewport-header-footer),height=Math.max(1,r.height||fallbackHeight),dpr=Math.min(2,Math.max(1,devicePixelRatio||1));
  this.canvas.width=Math.max(1,Math.round(width*dpr));
  this.canvas.height=Math.max(1,Math.round(height*dpr));
  this.canvas.style.removeProperty("width");
  this.canvas.style.removeProperty("height");
  this.ctx.setTransform(dpr,0,0,dpr,0,0);
  this.width=width;
  this.height=height;
  this.cell=Math.max(1,Math.min(this.width,this.height)/8);
  this.safeDraw();
};
