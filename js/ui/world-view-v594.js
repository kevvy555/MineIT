import { WorldView as V593WorldView } from "./world-view-v591.js?v=5.9.1&legacy=1";
import { artImage } from "./land-art-v591.js?v=5.9.1";

const SHIP_ART="./assets/art/colony-ship.webp?v=3";
const RESOURCE_ART_IDS=[
  "fungal","flora","herd","nutrient","protein","thermal","synthetic",
  "fiber","stone","clay","silica","limestone","structural","ceramic",
  "biomass","peat","coal","oil","gas","fissile","brine","exotic-fuel",
  "surface-iron","iron","copper","reactive","conductive","magnetic","exotic","advanced",
  "silver","gold","gems","platinum","palladium","sapphire","ruby","emerald","diamond","crystal"
];

/**
 * v5.9.6 map-art refinements:
 * - preload resource raster art before the first scheduled canvas draw;
 * - remove only edge-connected neutral black backgrounds from resource art;
 * - do not flash the SVG fallback while a raster image is already loading;
 * - keep the colony ship as a prominent diagonal tile asset.
 */
export class WorldView extends V593WorldView{
  constructor(options){
    super(options);
    this.resourceCutoutCache=new Map();
    this.preloadResourceArt();
  }

  preloadResourceArt(){
    if(!this.icons||typeof document==="undefined")return;
    const head=document.head;
    for(const id of RESOURCE_ART_IDS){
      const tile={resourceId:id,type:"ore"},path=this.icons.imagePath?.(tile);
      if(!path)continue;
      if(head&&!head.querySelector(`link[data-mineit-resource-preload="${id}"]`)){
        const link=document.createElement("link");
        link.rel="preload";link.as="image";link.type="image/webp";link.href=path;
        link.fetchPriority="high";link.dataset.mineitResourcePreload=id;head.appendChild(link);
      }
      const entry=this.icons.imageEntry?.(tile);
      if(entry?.image){entry.image.decoding="sync";try{entry.image.fetchPriority="high";}catch{}}
    }
  }

  resourceCutout(img){
    if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return img;
    const key=img.currentSrc||img.src||img;
    if(this.resourceCutoutCache.has(key))return this.resourceCutoutCache.get(key);
    if(typeof document==="undefined")return img;

    const w=img.naturalWidth,h=img.naturalHeight,canvas=document.createElement("canvas");
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    if(!ctx){this.resourceCutoutCache.set(key,img);return img;}
    try{ctx.drawImage(img,0,0,w,h);}catch{this.resourceCutoutCache.set(key,img);return img;}

    let pixels;
    try{pixels=ctx.getImageData(0,0,w,h);}catch{this.resourceCutoutCache.set(key,img);return img;}
    const data=pixels.data,count=w*h,seen=new Uint8Array(count),queue=new Int32Array(count);let qh=0,qt=0;
    const neutralDark=index=>{
      const i=index*4,a=data[i+3];if(a<=8)return true;
      const r=data[i],g=data[i+1],b=data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
      return max<=82&&(max-min)<=40;
    };
    const push=index=>{if(index<0||index>=count||seen[index]||!neutralDark(index))return;seen[index]=1;queue[qt++]=index;};

    // Only remove darkness connected to an outer edge. Interior black ore,
    // shadows and linework therefore remain untouched.
    for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}
    for(let y=1;y<h-1;y++){push(y*w);push(y*w+w-1);}
    while(qh<qt){
      const p=queue[qh++],x=p%w,y=Math.floor(p/w),i=p*4;data[i+3]=0;
      if(x>0)push(p-1);if(x<w-1)push(p+1);if(y>0)push(p-w);if(y<h-1)push(p+w);
    }

    // If no dark edge background was found, keep the original image exactly.
    if(qt===0){this.resourceCutoutCache.set(key,img);return img;}
    ctx.clearRect(0,0,w,h);ctx.putImageData(pixels,0,0);this.resourceCutoutCache.set(key,canvas);return canvas;
  }

  drawResourceOverlay(c,tile,px,py,alpha=1){
    const size=this.cell*.60,x=px+(this.cell-size)/2,y=py+this.cell*.09,entry=this.icons.imageEntry?.(tile);
    if(entry?.status==="ready"&&entry.image?.complete&&entry.image.naturalWidth>0){
      const source=this.resourceCutout(entry.image),iw=source.naturalWidth||source.width,ih=source.naturalHeight||source.height;
      if(iw&&ih){
        const ratio=Math.min(size/iw,size/ih),w=iw*ratio,h=ih*ratio;
        c.save();c.globalAlpha=alpha;c.shadowColor="rgba(0,0,0,.55)";c.shadowBlur=Math.max(2,this.cell*.035);
        try{c.drawImage(source,x+(size-w)/2,y+(size-h)/2,w,h);c.restore();return;}catch{c.restore();}
      }
    }

    // A raster image exists and is already being fetched: leave the terrain
    // visible for this frame instead of flashing an SVG that is replaced later.
    if(entry?.status==="loading")return;
    this.icons.draw(c,tile,px+this.cell/2,py+this.cell*.38,this.cell*.43);
  }

  drawShip(c,px,py){
    const img=artImage(SHIP_ART,this.assetReady);
    if(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0){
      const angle=Math.PI*0.155,cos=Math.abs(Math.cos(angle)),sin=Math.abs(Math.sin(angle));
      const boundW=img.naturalWidth*cos+img.naturalHeight*sin,boundH=img.naturalWidth*sin+img.naturalHeight*cos;
      const scale=Math.min((this.cell*.94)/boundW,(this.cell*.94)/boundH),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
      c.save();
      c.translate(px+this.cell/2,py+this.cell/2);
      c.rotate(angle);
      c.shadowColor="rgba(0,0,0,.88)";
      c.shadowBlur=Math.max(2,this.cell*.065);
      c.shadowOffsetY=Math.max(1,this.cell*.02);
      try{
        c.drawImage(img,-w/2,-h/2,w,h);
        c.restore();
        return true;
      }catch{}
      c.restore();
    }

    c.save();
    c.fillStyle="rgba(4,8,11,.68)";
    c.fillRect(px+this.cell*.18,py+this.cell*.69,this.cell*.64,this.cell*.2);
    c.fillStyle="#fff";
    c.font=`bold ${Math.max(8,this.cell*.12)}px system-ui`;
    c.textAlign="center";
    c.textBaseline="middle";
    c.fillText("SHIP",px+this.cell/2,py+this.cell*.79);
    c.restore();
    return false;
  }

  drawResourceTile(c,tile,x,y,px,py,active,queued,selected){
    if(this.isShipTile(x,y)){
      this.drawTerrain(c,tile,px,py,.10);
      this.drawShip(c,px,py);
      this.drawTileSelectionAndFocus(c,tile,x,y,px,py);
      return;
    }
    super.drawResourceTile(c,tile,x,y,px,py,active,queued,selected);
  }
}
