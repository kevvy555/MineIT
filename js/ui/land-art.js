const VERSION="5.6.1";

export const TERRAIN_ART={
  plain:["plains-01","plains-02","plains-03","plains-04"],
  hill:["hills-01","hills-02","hills-03","hills-04"],
  mountain:["mountains-01","mountains-02","mountains-03","mountains-04"],
  lake:["lakes-01","lakes-02","lakes-03","lakes-04"]
};

export const DEVELOPMENT_ART={
  housing:"housing",industry:"industry",quarry:"quarry",mine:"mine","deep-mine":"deep-mine",rig:"rig",farm:"farm",ranch:"ranch",bio:"bio-harvester",algae:"algae-facility"
};

export const DEVELOPMENT_ROWS={
  housing:0,industry:1,quarry:2,mine:3,"deep-mine":4,rig:5,farm:6,ranch:7,"bio-harvester":8,"algae-facility":9
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

export function developmentLevel(dev){
  return Math.max(1,Math.min(5,Number(dev?.level)||1));
}

// Retained for compatibility with the original individual-file art contract.
export function developmentPath(dev){
  const kind=developmentKind(dev),level=developmentLevel(dev);
  return kind?`./assets/art/development/${kind}/${kind}-l${level}.webp?v=${VERSION}`:null;
}

// Runtime uses one compact atlas: 10 development-family rows x 5 level columns.
export function developmentAtlasPath(dev){
  const kind=developmentKind(dev);
  return kind!=null&&DEVELOPMENT_ROWS[kind]!=null?`./assets/art/development/buildings-levels.webp?v=${VERSION}`:null;
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

export function drawDevelopmentFrame(ctx,img,kind,level,x,y,w,h,scale=.94){
  if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return false;
  const columns=5,rows=10,row=DEVELOPMENT_ROWS[kind];
  if(row==null)return false;
  const frameWidth=img.naturalWidth/columns,frameHeight=img.naturalHeight/rows,column=Math.max(1,Math.min(columns,Number(level)||1))-1;
  const ratio=Math.min(w/frameWidth,h/frameHeight)*scale,dw=frameWidth*ratio,dh=frameHeight*ratio;
  ctx.drawImage(img,frameWidth*column,frameHeight*row,frameWidth,frameHeight,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  return true;
}
