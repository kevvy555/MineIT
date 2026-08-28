import { CONFIG } from "../core/config.js";
import { clamp } from "../core/utils.js";
import { terrainPath, artImage, drawCover } from "./land-art.js";

const SIZE_FILTERS=[["limited","LIMITED"],["established","ESTABLISHED"],["small","SMALL"],["modest","MODEST"],["large","LARGE"],["huge","HUGE"],["colossal","COLOSSAL"],["vast","VAST"],["legacy","LEGACY"]];
const TYPE_FILTERS=[["food","FOOD"],["build","BUILD"],["fuel","FUEL"],["ore","ORE"]];
const TERRAIN_COLORS={plain:["#314c2a","#668852"],hill:["#4b4328","#8a7545"],mountain:["#34383b","#7b858b"],lake:["#163f53","#3f819b"]};
const SHORT={housing:"H",industry:"I",mine:"M",quarry:"Q","deep-mine":"DM",rig:"R",farm:"F",ranch:"RA",bio:"B",algae:"A"};
const SHIP_ART="./assets/art/colony-ship.webp?v=2";

export class WorldView {
  constructor({state,world,survey,resources,technology,icons,diagnostics,land,onTap,onMulti,onInspect}){
    Object.assign(this,{state,world,survey,resources,technology,icons,diagnostics,land,onTap,onMulti,onInspect});
    this.canvas=document.querySelector("#world");
    this.shell=document.querySelector("#worldViewport")||document.querySelector("#worldShell");
    this.filterHost=document.querySelector("#mapFilterHost")||this.shell;
    this.ctx=this.canvas.getContext("2d");
    this.selection=new Map();
    this.filters={developed:true,notDeveloped:true,locked:true};
    this.typeFilters=Object.fromEntries(TYPE_FILTERS.map(([key])=>[key,true]));
    this.sizeFilters=Object.fromEntries(SIZE_FILTERS.map(([key])=>[key,true]));
    this.qualityFilters=Object.fromEntries(this.resources.qualityBands().map(b=>[b.key,true]));
    this.filtersOpen=false;this.filterCategory="type";
    this.drawQueued=false;this.drawCount=0;this.assetReady=()=>this.safeDraw();this.icons.setOnReady?.(this.assetReady);
    this.bindViewToggle();this.bindFilters();this.bindInput();
    new ResizeObserver(()=>this.resize()).observe(this.shell);this.resize();
  }
  view(){return this.land?(this.state.colony?.land?.view||"land"):"resource";}
  isShipTile(x,y){return this.land?.isShipTile?this.land.isShipTile(x,y):x===0&&y===0;}
  bindViewToggle(){
    const host=document.querySelector("#mapViewHost")||this.shell,old=document.querySelector("#mapViewToggle"),oldFilter=document.querySelector("#mapFilterToggle");if(old)old.remove();if(oldFilter)oldFilter.remove();
    const wrap=document.createElement("div");wrap.id="mapViewToggle";wrap.className="map-view-toggle";
    for(const[key,label]of[["land","LAND"],["resource","RESOURCES"]]){const b=document.createElement("button");b.type="button";b.dataset.mapView=key;b.textContent=label;b.onclick=()=>{if(!this.state.colony?.land)return;this.state.colony.land.view=key;this.filtersOpen=false;this.syncView();this.resize();this.safeDraw();};wrap.appendChild(b);}
    const filter=document.createElement("button");filter.id="mapFilterToggle";filter.className="map-filter-toggle";filter.type="button";filter.onclick=()=>{this.filtersOpen=!this.filtersOpen;this.syncView();this.resize();};
    host.appendChild(wrap);host.appendChild(filter);this.viewToggle=wrap;this.filterToggle=filter;this.syncView();
  }
  filterDisabledCount(){return[this.filters,this.typeFilters,this.sizeFilters,this.qualityFilters].reduce((total,group)=>total+Object.values(group||{}).filter(value=>value===false).length,0);}
  syncView(){const view=this.view(),selecting=this.state.status==="site-selection",resource=view==="resource",off=this.filterDisabledCount();this.viewToggle?.querySelectorAll("[data-map-view]").forEach(b=>b.classList.toggle("active",b.dataset.mapView===view));this.viewToggle?.classList.toggle("hidden",selecting||!this.land);if(this.filterToggle){this.filterToggle.textContent=off?`FILTERS • ${off} OFF`:"FILTERS";this.filterToggle.classList.toggle("active",this.filtersOpen);this.filterToggle.classList.toggle("hidden",!resource||selecting||!this.land);}this.filterHost?.classList.toggle("hidden",!resource||selecting||!this.filtersOpen);}
  bindFilters(){
    const existing=this.filterHost.querySelector("#mapFilters");if(existing)existing.remove();const bar=document.createElement("div");bar.id="mapFilters";bar.className="map-filters";bar.setAttribute("aria-label","Map tile filters");
    const tabs=document.createElement("div");tabs.className="map-filter-tabs";for(const[key,label]of[["state","STATE"],["type","TYPE"],["size","SIZE"],["quality","QUALITY"]]){const button=document.createElement("button");button.type="button";button.className="map-filter-category";button.dataset.filterCategory=key;button.textContent=label;button.onclick=()=>{this.filterCategory=key;this.syncFilters();};tabs.appendChild(button);}bar.appendChild(tabs);
    const addGroup=(key,label,attribute,items,filters)=>{const row=document.createElement("div");row.className="map-filter-group";row.dataset.filterGroup=key;row.innerHTML=`<span class="map-filter-label">${label}</span><div class="map-filter-options"><button type="button" class="map-filter-bulk" data-map-bulk="all">ALL</button><button type="button" class="map-filter-bulk" data-map-bulk="clear">CLEAR</button></div>`;const options=row.querySelector(".map-filter-options");for(const item of items){const itemKey=item.key??item[0],itemText=item.label?.toUpperCase?.()??item[1],button=document.createElement("button");button.type="button";button.className=`map-filter active ${item.className||""}`;button.dataset[attribute]=itemKey;button.textContent=itemText;button.setAttribute("aria-pressed","true");if(item.min)button.title=`Q${item.min}–${item.max}`;button.onclick=()=>{filters[itemKey]=!filters[itemKey];this.syncFilters();this.safeDraw();};options.appendChild(button);}row.querySelector('[data-map-bulk="all"]').onclick=()=>{for(const key of Object.keys(filters))filters[key]=true;this.syncFilters();this.safeDraw();};row.querySelector('[data-map-bulk="clear"]').onclick=()=>{for(const key of Object.keys(filters))filters[key]=false;this.syncFilters();this.safeDraw();};bar.appendChild(row);};
    addGroup("state","STATE","mapFilter",[["developed","DEVELOPED"],["notDeveloped","NOT DEVELOPED"],["locked","LOCKED"]],this.filters);
    addGroup("type","TYPE","mapType",TYPE_FILTERS,this.typeFilters);
    addGroup("size","SIZE","mapSize",SIZE_FILTERS,this.sizeFilters);
    addGroup("quality","QUALITY","mapQuality",this.resources.qualityBands(),this.qualityFilters);
    this.filterHost.appendChild(bar);this.filterBar=bar;this.syncFilters();this.syncView();
  }
  syncFilters(){if(!this.filterBar)return;const sync=(selector,filters,key)=>this.filterBar.querySelectorAll(selector).forEach(button=>{const active=filters[button.dataset[key]]!==false;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});sync("[data-map-filter]",this.filters,"mapFilter");sync("[data-map-type]",this.typeFilters,"mapType");sync("[data-map-size]",this.sizeFilters,"mapSize");sync("[data-map-quality]",this.qualityFilters,"mapQuality");this.filterBar.querySelectorAll("[data-filter-category]").forEach(button=>button.classList.toggle("active",button.dataset.filterCategory===this.filterCategory));this.filterBar.querySelectorAll("[data-filter-group]").forEach(group=>group.classList.toggle("hidden",group.dataset.filterGroup!==this.filterCategory));if(this.filterToggle){const off=this.filterDisabledCount();this.filterToggle.textContent=off?`FILTERS • ${off} OFF`:"FILTERS";}}
  tileFilterBucket(tile){if(!tile?.revealed||tile.resourceId===null)return null;const locked=!tile.developed&&!tile.depleted&&!tile.resourceCovered&&!this.technology.canExploit(this.state,tile);if(locked)return"locked";if(tile.developed)return"developed";return"notDeveloped";}
  tileSizeKey(tile){if(!tile?.revealed||tile.resourceId===null||!this.resources)return null;const renewable=this.resources.isRenewable(tile),label=renewable?(tile.abundanceLabel||"Established"):(tile.depositScale||"Legacy"),key=String(label).toLowerCase().replace(/[^a-z]+/g,"");if(key.startsWith("legacy"))return"legacy";return SIZE_FILTERS.some(([k])=>k===key)?key:"legacy";}
  tileQualityKey(tile){return tile?.resourceId!==null&&this.resources?.qualityBandDetails&&tile?.quality!=null?this.resources.qualityBandDetails(tile.quality).key:null;}
  isTileVisible(tile,x,y){if(this.view()==="land"||this.isShipTile(x,y)||tile?.resourceId===null)return true;const bucket=this.tileFilterBucket(tile);if(bucket&&this.filters[bucket]===false)return false;if(tile?.type&&this.typeFilters?.[tile.type]===false)return false;const size=this.tileSizeKey(tile);if(size&&this.sizeFilters?.[size]===false)return false;const quality=this.tileQualityKey(tile);if(quality&&this.qualityFilters?.[quality]===false)return false;return true;}
  compactAmount(value){const n=Math.max(0,Number(value)||0),fmt=(v,s)=>`${v>=100?Math.round(v):v>=10?v.toFixed(1):v.toFixed(2)}`.replace(/\.0+$|(?<=\.[0-9])0+$/g,"")+s;if(n>=1e9)return fmt(n/1e9,"B");if(n>=1e6)return fmt(n/1e6,"M");if(n>=1e3)return fmt(n/1e3,"K");return String(Math.round(n));}
  depositText(tile){if(tile?.resourceId===null)return"CLEAR";if(this.resources.isRenewable(tile))return`${String(tile.renewableWiped?"Wiped Out":tile.abundanceLabel||"Renewable").toUpperCase()} • ∞`;const amount=tile.initialReserve??tile.reserve??0;return`${String(tile.depositScale||"Finite").toUpperCase()} • ${this.compactAmount(amount)}`;}
  resize(){const r=this.shell.getBoundingClientRect(),header=document.querySelector(".app-header")?.getBoundingClientRect().height||0,footer=document.querySelector(".app-footer")?.getBoundingClientRect().height||0,viewport=window.visualViewport?.height||window.innerHeight||0,width=Math.max(1,r.width||window.innerWidth||320),fallbackHeight=Math.max(120,viewport-header-footer),height=r.height>=2?r.height:fallbackHeight,dpr=Math.min(2,Math.max(1,devicePixelRatio||1));this.canvas.width=Math.max(1,Math.round(width*dpr));this.canvas.height=Math.max(1,Math.round(height*dpr));this.canvas.style.width=`${width}px`;this.canvas.style.height=`${height}px`;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.width=width;this.height=height;this.cell=Math.max(1,Math.min(this.width,this.height)/CONFIG.GRID_SIZE);this.safeDraw();}
  safeDraw(){if(this.drawQueued)return;this.drawQueued=true;const schedule=typeof requestAnimationFrame==="function"?requestAnimationFrame:fn=>setTimeout(fn,0);schedule(()=>{this.drawQueued=false;try{this.drawCount++;this.draw();}catch(e){this.diagnostics.error("world render failed",e);}}); }
  coords(e){const r=this.canvas.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,ox=(this.width-this.cell*CONFIG.GRID_SIZE)/2,oy=(this.height-this.cell*CONFIG.GRID_SIZE)/2,gx=clamp(Math.floor((px-ox)/this.cell),0,CONFIG.GRID_SIZE-1),gy=clamp(Math.floor((py-oy)/this.cell),0,CONFIG.GRID_SIZE-1);if(this.land)return{x:this.land.start+gx,y:this.land.start+gy};return{x:(this.state.camera?.x||0)+gx,y:(this.state.camera?.y||0)+gy};}
  bindInput(){
    let pointer=null,selecting=false,last=null,longTimer=null,longFired=false,suppressClick=false;
    this.canvas.addEventListener("pointerdown",event=>{
      if(this.state.status==="site-selection")return;
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
      last=this.coords(event);longFired=false;suppressClick=false;
      this.canvas.setPointerCapture?.(event.pointerId);
      longTimer=setTimeout(()=>{if(!pointer||selecting)return;longFired=true;suppressClick=true;this.onInspect?.(last.x,last.y);},2000);
    });
    this.canvas.addEventListener("pointermove",event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      const moved=Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>7;
      if(moved)pointer.moved=true;
      if(!moved&&!selecting)return;
      clearTimeout(longTimer);
      const cell=this.coords(event);
      if(!selecting&&this.survey.surveyable(this.state,last.x,last.y)){selecting=true;suppressClick=true;this.selection.clear();this.addSelection(last);}
      if(selecting){this.selectLine(last,cell);last=cell;this.safeDraw();}
    });
    this.canvas.addEventListener("pointerup",event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      clearTimeout(longTimer);
      if(selecting){const cells=[...this.selection.values()];this.selection.clear();selecting=false;suppressClick=true;this.onMulti?.(cells);}
      else if(longFired||pointer.moved||Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>7)suppressClick=true;
      pointer=null;this.safeDraw();
    });
    this.canvas.addEventListener("pointercancel",()=>{
      clearTimeout(longTimer);pointer=null;selecting=false;suppressClick=false;this.selection.clear();this.safeDraw();
    });
    this.canvas.addEventListener("click",event=>{
      if(this.state.status==="site-selection")return;
      if(suppressClick){suppressClick=false;return;}
      const cell=this.coords(event),tile=this.world.get(this.state,cell.x,cell.y);
      if(this.isTileVisible(tile,cell.x,cell.y))this.onTap?.(cell.x,cell.y);
    });
  }
  addSelection(c){if(this.survey.surveyable(this.state,c.x,c.y))this.selection.set(`${c.x},${c.y}`,c);}
  selectLine(a,b){let x0=a.x,y0=a.y,x1=b.x,y1=b.y,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){this.addSelection({x:x0,y:y0});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}}
  colors(type){return{food:["#15321f","#83e69a","#6bd986"],build:["#172a31","#a7d7e7","#8ec5d9"],fuel:["#352017","#ffb27e","#ff9f5f"],ore:["#291b35","#d3b4ff","#c7a0ff"]}[type]||["#252515","#ffc76b","#f0b65d"];}
  drawTerrain(c,tile,px,py,dim=0){
    const src=terrainPath(tile.terrain||"plain",tile.terrainVariant||1),img=artImage(src,this.assetReady);
    if(img&&drawCover(c,img,px+1,py+1,this.cell-2,this.cell-2)){if(dim){c.fillStyle=`rgba(0,0,0,${dim})`;c.fillRect(px+1,py+1,this.cell-2,this.cell-2);}return true;}
    const palette=TERRAIN_COLORS[tile.terrain]||TERRAIN_COLORS.plain,v=(tile.terrainVariant||1)-2.5;c.save();c.fillStyle=palette[0];c.fillRect(px+1,py+1,this.cell-2,this.cell-2);c.globalAlpha=.36-dim*.16;c.strokeStyle=palette[1];c.lineWidth=Math.max(1,this.cell*.025);const cx=px+this.cell/2,cy=py+this.cell/2,r=this.cell*.28;if(tile.terrain==="mountain"){c.beginPath();c.moveTo(cx-r,cy+r*.65);c.lineTo(cx,cy-r);c.lineTo(cx+r,cy+r*.65);c.stroke();c.beginPath();c.moveTo(cx-r*.15,cy-r*.72);c.lineTo(cx,cy-r);c.lineTo(cx+r*.18,cy-r*.66);c.stroke();}else if(tile.terrain==="hill"){c.beginPath();c.arc(cx-r*.35,cy+r*.25,r*.62,Math.PI,Math.PI*2);c.arc(cx+r*.35,cy+r*.28,r*.50,Math.PI,Math.PI*2);c.stroke();}else if(tile.terrain==="lake"){for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(cx-r,cy+i*this.cell*.12);c.quadraticCurveTo(cx-r*.3,cy+i*this.cell*.12-3-v,cx+r*.25,cy+i*this.cell*.12);c.quadraticCurveTo(cx+r*.65,cy+i*this.cell*.12+3+v,cx+r,cy+i*this.cell*.12);c.stroke();}}else{for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(cx+i*this.cell*.15,cy+r*.55);c.lineTo(cx+i*this.cell*.15-2,cy-r*.15-v);c.stroke();}}c.restore();if(dim){c.fillStyle=`rgba(0,0,0,${dim})`;c.fillRect(px+1,py+1,this.cell-2,this.cell-2);}return false;
  }
  drawShip(c,px,py){const img=artImage(SHIP_ART,this.assetReady);if(!img){c.save();c.fillStyle="#fff";c.font=`bold ${Math.max(8,this.cell*.12)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText("SHIP",px+this.cell/2,py+this.cell/2);c.restore();return false;}const maxW=this.cell*.92,maxH=this.cell*.62,ratio=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight),w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;c.save();c.shadowColor="rgba(0,0,0,.75)";c.shadowBlur=Math.max(2,this.cell*.055);c.shadowOffsetY=Math.max(1,this.cell*.015);c.drawImage(img,px+(this.cell-w)/2,py+(this.cell-h)/2,w,h);c.restore();return true;}
  drawDevelopment(c,tile,px,py){const dev=tile.development;if(!dev)return;const kind=dev.kind==="extract"?dev.family:dev.kind,label=SHORT[kind]||kind.slice(0,2).toUpperCase(),cx=px+this.cell/2,cy=py+this.cell*.48;c.save();c.fillStyle="rgba(4,8,11,.70)";c.strokeStyle="#e6f4f8";c.lineWidth=Math.max(1,this.cell*.025);if(kind==="housing"){for(let i=-1;i<=1;i++){const w=this.cell*.14,h=this.cell*(.18+.03*dev.level),x=cx+i*this.cell*.17-w/2,y=cy-h/2;c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);}}else if(kind==="industry"){const w=this.cell*.5,h=this.cell*.27;c.fillRect(cx-w/2,cy-h/2,w,h);c.strokeRect(cx-w/2,cy-h/2,w,h);c.beginPath();c.moveTo(cx-w*.28,cy-h/2);c.lineTo(cx-w*.08,cy-h*.9);c.lineTo(cx+w*.08,cy-h/2);c.stroke();}else{c.beginPath();c.arc(cx,cy,this.cell*.22,0,Math.PI*2);c.fill();c.stroke();}c.fillStyle="#fff";c.textAlign="center";c.textBaseline="middle";c.font=`bold ${Math.max(7,this.cell*.11)}px system-ui`;c.fillText(`${label} L${dev.level}`,cx,cy);c.restore();}
  drawLandTile(c,tile,x,y,px,py,selected){this.drawTerrain(c,tile,px,py);this.drawDevelopment(c,tile,px,py);c.strokeStyle=selected?"#59d4ff":"rgba(235,245,248,.20)";c.lineWidth=selected?2:1;c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);c.textAlign="center";c.textBaseline="middle";if(this.isShipTile(x,y)){this.drawShip(c,px,py);return;}if(!tile.revealed){c.fillStyle="rgba(0,0,0,.55)";c.beginPath();c.arc(px+this.cell*.14,py+this.cell*.14,this.cell*.09,0,Math.PI*2);c.fill();c.fillStyle="#dce9ee";c.font=`bold ${Math.max(7,this.cell*.1)}px system-ui`;c.fillText("?",px+this.cell*.14,py+this.cell*.14);}if(tile.depleted){c.fillStyle="rgba(0,0,0,.55)";c.fillRect(px+1,py+this.cell*.78,this.cell-2,this.cell*.2);c.fillStyle="#bcc7cb";c.font=`bold ${Math.max(6,this.cell*.08)}px system-ui`;c.fillText("DEPLETED",px+this.cell/2,py+this.cell*.88);}}
  drawResourceTile(c,tile,x,y,px,py,active,queued,selected){
    const col=this.colors(tile.type);if(this.isShipTile(x,y)){this.drawTerrain(c,tile,px,py,.12);this.drawShip(c,px,py);return;}
    if(!tile.revealed){c.fillStyle=active?"#0b2c45":queued?"#091c2a":"#020304";c.fillRect(px+1,py+1,this.cell-2,this.cell-2);c.strokeStyle=selected?"#59d4ff":"#172028";c.lineWidth=selected?2:1;c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);c.fillStyle=selected?"#70dbff":"#637681";c.font=`bold ${Math.max(14,this.cell*.29)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText(selected?"✓":active?"SCAN":queued?"Q":"?",px+this.cell/2,py+this.cell*.46);return;}
    if(tile.resourceId===null){this.drawTerrain(c,tile,px,py,.38);c.strokeStyle="#52646c";c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);c.fillStyle="#eef6f8";c.font=`bold ${Math.max(7,this.cell*.105)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText("CLEAR",px+this.cell/2,py+this.cell*.82);return;}
    const techLocked=!tile.developed&&!tile.depleted&&!tile.resourceCovered&&!this.technology.canExploit(this.state,tile);c.fillStyle=tile.depleted?"#11161a":techLocked?"#0b0e10":col[0];c.fillRect(px+1,py+1,this.cell-2,this.cell-2);const imageDrawn=!tile.depleted&&this.icons.drawBackground?.(c,tile,px+1,py+1,this.cell-2,techLocked?.34:tile.resourceCovered?.42:1)===true;if(imageDrawn){c.save();c.fillStyle=techLocked?"rgba(0,0,0,.55)":tile.resourceCovered?"rgba(0,0,0,.50)":"rgba(0,0,0,.14)";c.fillRect(px+1,py+1,this.cell-2,this.cell-2);const scrim=c.createLinearGradient(0,py+this.cell*.38,0,py+this.cell);scrim.addColorStop(0,"rgba(0,0,0,0)");scrim.addColorStop(.45,"rgba(0,0,0,.28)");scrim.addColorStop(1,"rgba(0,0,0,.72)");c.fillStyle=scrim;c.fillRect(px+1,py+this.cell*.34,this.cell-2,this.cell*.66-1);c.restore();}
    c.strokeStyle=selected?"#59d4ff":techLocked?"#535b60":imageDrawn?col[2]:"#172028";c.lineWidth=selected?2:1;c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);c.textAlign="center";c.textBaseline="middle";c.save();if(techLocked)c.globalAlpha=.72;c.shadowColor="rgba(0,0,0,.95)";c.shadowBlur=Math.max(2,this.cell*.045);c.shadowOffsetY=1;if(tile.depleted){c.fillStyle="#9aa7ad";c.font=`${Math.max(16,this.cell*.28)}px system-ui`;c.fillText("×",px+this.cell/2,py+this.cell*.31);}else if(!imageDrawn)this.icons.draw(c,tile,px+this.cell/2,py+this.cell*.27,this.cell*.33);c.fillStyle=imageDrawn?"#f4fbff":col[1];c.font=`bold ${Math.max(8,this.cell*.13)}px system-ui`;c.fillText(`Q${Math.round(tile.quality)}`,px+this.cell/2,py+this.cell*.56);c.fillStyle=imageDrawn?"#ecf3f6":"#b6c4ca";c.font=`bold ${Math.max(6,this.cell*.09)}px system-ui`;c.fillText(this.depositText(tile),px+this.cell/2,py+this.cell*.70,this.cell*.86);if(tile.developed&&!tile.depleted){const renewable=this.resources.isRenewable(tile),pct=renewable?clamp((tile.renewableHealth||1)/Math.max(1,(tile.renewableOriginalRank||0)+1),0,1):clamp((tile.reserve||0)/Math.max(1,tile.initialReserve||1),0,1);c.shadowBlur=0;c.fillStyle="rgba(8,14,18,.88)";c.fillRect(px+this.cell*.13,py+this.cell*.86,this.cell*.74,3);c.fillStyle=col[2];c.fillRect(px+this.cell*.13,py+this.cell*.86,this.cell*.74*pct,3);c.shadowColor="rgba(0,0,0,.95)";c.shadowBlur=Math.max(2,this.cell*.04);c.fillStyle="#f4f8fa";c.font=`bold ${Math.max(7,this.cell*.1)}px system-ui`;c.fillText(`L${tile.level}`,px+this.cell*.79,py+this.cell*.16);}c.restore();if(tile.resourceCovered){c.fillStyle="rgba(0,0,0,.74)";c.fillRect(px+this.cell*.12,py+this.cell*.08,this.cell*.76,this.cell*.17);c.fillStyle="#ffd166";c.font=`bold ${Math.max(6,this.cell*.085)}px system-ui`;c.fillText("COVERED",px+this.cell/2,py+this.cell*.165);}else if(techLocked){c.fillStyle="#d3dadd";c.font=`bold ${Math.max(7,this.cell*.095)}px system-ui`;c.fillText(`LOCK • M${tile.requiredMiningLevel||1}`,px+this.cell/2,py+this.cell*.84,this.cell*.88);}
  }
  draw(){
    const c=this.ctx,size=this.cell*CONFIG.GRID_SIZE,ox=(this.width-size)/2,oy=(this.height-size)/2;c.clearRect(0,0,this.width,this.height);c.fillStyle="#000";c.fillRect(0,0,this.width,this.height);this.syncView();
    if(this.state.status==="site-selection"){c.fillStyle="#dce8ed";c.font=`bold ${Math.max(14,this.cell*.2)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText("CHOOSE A LANDING SITE",this.width/2,this.height/2);return;}
    const startX=this.land?this.land.start:(this.state.camera?.x||0),startY=this.land?this.land.start:(this.state.camera?.y||0);
    for(let gy=0;gy<CONFIG.GRID_SIZE;gy++)for(let gx=0;gx<CONFIG.GRID_SIZE;gx++){const x=startX+gx,y=startY+gy,tile=this.world.get(this.state,x,y),active=this.survey.isActive(this.state,x,y),queued=this.survey.isQueued(this.state,x,y),selected=this.selection.has(`${x},${y}`),px=ox+gx*this.cell,py=oy+gy*this.cell;if(!this.isTileVisible(tile,x,y)){c.fillStyle="#020304";c.fillRect(px+1,py+1,this.cell-2,this.cell-2);c.strokeStyle="#172028";c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);continue;}if(this.view()==="land")this.drawLandTile(c,tile,x,y,px,py,selected);else this.drawResourceTile(c,tile,x,y,px,py,active,queued,selected);}
    document.querySelector("#cameraText").textContent=this.land?`${this.view()==="land"?"LAND":"RESOURCE"} VIEW • 8×8`:`Sector ${startX},${startY}`;
  }
}
