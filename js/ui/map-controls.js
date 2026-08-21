export const STATE_FILTERS=[["developed","DEVELOPED"],["notDeveloped","NOT DEVELOPED"],["locked","LOCKED"]];
export const TYPE_FILTERS=[["food","FOOD"],["build","BUILD"],["fuel","FUEL"],["ore","ORE"]];
export const SIZE_FILTERS=[["limited","LIMITED"],["established","ESTABLISHED"],["small","SMALL"],["modest","MODEST"],["large","LARGE"],["huge","HUGE"],["colossal","COLOSSAL"],["vast","VAST"],["legacy","LEGACY"]];

export class MapControls{
  constructor({host,state,land,resources,filters,typeFilters,sizeFilters,qualityFilters,onViewChange,onFilterChange}){
    Object.assign(this,{host,state,land,resources,filters,typeFilters,sizeFilters,qualityFilters,onViewChange,onFilterChange});
    this.filtersOpen=false;
    this.filterCategory=null;
    this.build();
    this.sync();
  }

  view(){return this.land?(this.state.colony?.land?.view||"land"):"resource";}

  disabledCount(){
    return [this.filters,this.typeFilters,this.sizeFilters,this.qualityFilters]
      .reduce((total,group)=>total+Object.values(group||{}).filter(value=>value===false).length,0);
  }

  build(){
    this.host.replaceChildren();
    this.host.classList.add("map-toolbar");

    const main=document.createElement("div");
    main.className="map-toolbar-main";
    const views=document.createElement("div");
    views.id="mapViewToggle";
    views.className="map-view-toggle";
    for(const [key,label] of [["land","LAND"],["resource","RESOURCES"]]){
      const button=document.createElement("button");
      button.type="button";
      button.dataset.mapView=key;
      button.textContent=label;
      button.onclick=()=>{
        if(!this.state.colony?.land)return;
        this.filtersOpen=false;
        this.filterCategory=null;
        this.onViewChange?.(key);
        this.sync();
      };
      views.appendChild(button);
    }
    const filter=document.createElement("button");
    filter.id="mapFilterToggle";
    filter.className="map-filter-toggle";
    filter.type="button";
    filter.onclick=()=>{
      if(this.view()!=="resource")return;
      this.filtersOpen=true;
      this.filterCategory=null;
      this.sync();
    };
    main.append(views,filter);

    const panel=document.createElement("div");
    panel.id="mapFilters";
    panel.className="map-filters hidden";
    panel.setAttribute("aria-label","Map tile filters");
    const back=document.createElement("button");
    back.type="button";
    back.className="map-filter-back";
    back.dataset.filterBack="1";
    back.onclick=()=>{
      if(this.filterCategory)this.filterCategory=null;
      else this.filtersOpen=false;
      this.sync();
    };
    panel.appendChild(back);

    const tabs=document.createElement("div");
    tabs.className="map-filter-tabs";
    for(const [key,label] of [["state","STATE"],["type","TYPE"],["size","SIZE"],["quality","QUALITY"]]){
      const button=document.createElement("button");
      button.type="button";
      button.className="map-filter-category";
      button.dataset.filterCategory=key;
      button.textContent=label;
      button.onclick=()=>{this.filterCategory=key;this.sync();};
      tabs.appendChild(button);
    }
    panel.appendChild(tabs);

    this.addGroup(panel,"state","mapFilter",STATE_FILTERS,this.filters);
    this.addGroup(panel,"type","mapType",TYPE_FILTERS,this.typeFilters);
    this.addGroup(panel,"size","mapSize",SIZE_FILTERS,this.sizeFilters);
    this.addGroup(panel,"quality","mapQuality",this.resources.qualityBands(),this.qualityFilters);

    this.host.append(main,panel);
    Object.assign(this,{main,views,filter,panel,back,tabs});
  }

  addGroup(panel,key,attribute,items,filters){
    const group=document.createElement("div");
    group.className="map-filter-group hidden";
    group.dataset.filterGroup=key;
    const options=document.createElement("div");
    options.className="map-filter-options";

    const bulk=(label,value)=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="map-filter-bulk";
      button.dataset.mapBulk=label.toLowerCase();
      button.textContent=label;
      button.onclick=()=>{
        for(const filterKey of Object.keys(filters))filters[filterKey]=value;
        this.sync();
        this.onFilterChange?.();
      };
      return button;
    };
    options.append(bulk("ALL",true),bulk("CLEAR",false));

    for(const item of items){
      const itemKey=item.key??item[0],itemText=item.label?.toUpperCase?.()??item[1],button=document.createElement("button");
      button.type="button";
      button.className=`map-filter active ${item.className||""}`;
      button.dataset[attribute]=itemKey;
      button.textContent=itemText;
      button.setAttribute("aria-pressed","true");
      if(item.min)button.title=`Q${item.min}–${item.max}`;
      button.onclick=()=>{
        filters[itemKey]=!filters[itemKey];
        this.sync();
        this.onFilterChange?.();
      };
      options.appendChild(button);
    }
    group.appendChild(options);
    panel.appendChild(group);
  }

  syncFilterButtons(){
    const sync=(selector,filters,key)=>this.panel.querySelectorAll(selector).forEach(button=>{
      const active=filters[button.dataset[key]]!==false;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    sync("[data-map-filter]",this.filters,"mapFilter");
    sync("[data-map-type]",this.typeFilters,"mapType");
    sync("[data-map-size]",this.sizeFilters,"mapSize");
    sync("[data-map-quality]",this.qualityFilters,"mapQuality");
  }

  sync(){
    const view=this.view(),selecting=this.state.status==="site-selection",hasLand=!!this.land,resource=view==="resource";
    if(!resource){this.filtersOpen=false;this.filterCategory=null;}
    const filtering=hasLand&&resource&&this.filtersOpen&&!selecting;
    this.host.dataset.mapMode=view;
    this.main.classList.toggle("hidden",filtering||selecting||!hasLand);
    this.panel.classList.toggle("hidden",!filtering);
    this.views.querySelectorAll("[data-map-view]").forEach(button=>button.classList.toggle("active",button.dataset.mapView===view));
    const off=this.disabledCount();
    this.filter.textContent=off?`FILTERS • ${off} OFF`:"FILTERS";
    this.filter.classList.toggle("active",filtering);
    this.filter.classList.toggle("hidden",!resource||selecting||!hasLand);

    const inGroup=!!this.filterCategory;
    this.tabs.classList.toggle("hidden",inGroup);
    this.panel.querySelectorAll("[data-filter-group]").forEach(group=>group.classList.toggle("hidden",!inGroup||group.dataset.filterGroup!==this.filterCategory));
    this.back.textContent=inGroup?"BACK":"DONE";
    this.syncFilterButtons();
  }
}
