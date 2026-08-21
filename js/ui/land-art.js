const VERSION="5.5.2";

export const TERRAIN_ART={
  plain:["plains-01","plains-02","plains-03","plains-04"],
  hill:["hills-01","hills-02","hills-03","hills-04"],
  mountain:["mountains-01","mountains-02","mountains-03","mountains-04"],
  lake:["lakes-01","lakes-02","lakes-03","lakes-04"]
};

export const DEVELOPMENT_ART={
  housing:"housing",industry:"industry",quarry:"quarry",mine:"mine","deep-mine":"deep-mine",rig:"rig",farm:"farm",ranch:"ranch",bio:"bio-harvester",algae:"algae-facility"
};

const imageCache=new Map();
const terrainFolder={plain:"plains",hill:"hills",mountain:"mountains",lake:"lakes"};

export function terrainPath(terrain,variant=1){
  const folder=terrainFolder[terrain]||"plains",list=TERRAIN_ART[terrain]||TERRAIN_ART.plain,index=(Math.max(1,Number(variant)||1)-1)%list.length;
  return `./assets/art/terrain/${folder}/${list[index]}.webp?v=${VERSION}`;
}

export function developmentKind(dev){
  if(!dev)return null;
  const raw=dev.kind==="extract"?dev.family:dev.kind;
  return DEVELOPMENT_ART[raw]||raw;
}

export function developmentPath(dev){
  const kind=developmentKind(dev),level=Math.max(1,Math.min(5,Number(dev?.level)||1));
  return kind?`./assets/art/development/${kind}/${kind}-l${level}.webp?v=${VERSION}`:null;
}

export function artImage(src,onReady){
  if(!src||typeof Image==="undefined")return null;
  let entry=imageCache.get(src);
  if(!entry){
    const img=new Image();entry={img,state:"loading",listeners:new Set()};imageCache.set(src,entry);
    if(onReady)entry.listeners.add(onReady);
    img.decoding="async";
    img.onload=()=>{entry.state="ready";for(const fn of entry.listeners){try{fn()}catch{}}entry.listeners.clear();};
    img.onerror=()=>{entry.state="failed";entry.listeners.clear();};
    img.src=src;
  }else if(onReady&&entry.state==="loading")entry.listeners.add(onReady);
  return entry.state==="ready"&&entry.img.complete&&entry.img.naturalWidth>0?entry.img:null;
}

export function drawCover(ctx,img,x,y,w,h){
  if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return false;
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/scale,sh=h/scale,sx=(img.naturalWidth-sw)/2,sy=(img.naturalHeight-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);return true;
}

export function drawContain(ctx,img,x,y,w,h,scale=1){
  if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return false;
  const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight)*scale,dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;
  ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);return true;
}
