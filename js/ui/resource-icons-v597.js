import { ResourceIcons as LegacyResourceIcons } from "./resource-icons.js?v=5.5.5&legacy=1";

const ATLAS_PATH="./assets/art/resources/resource-atlas-256.webp?v=5.9.7";
const FRAME=256;
const COLS=8;
const ATLAS_IDS=[
  "fungal","flora","herd","nutrient","protein","thermal","synthetic",
  "fiber","stone","clay","silica","limestone","structural","ceramic",
  "biomass","peat","coal","oil","gas","fissile","brine","exotic-fuel",
  "surface-iron","iron","copper","reactive","conductive","magnetic","exotic","advanced",
  "silver","gold","gems","platinum","palladium","sapphire","ruby","emerald","diamond","crystal"
];
const ATLAS_INDEX=new Map(ATLAS_IDS.map((id,index)=>[id,index]));

/**
 * v5.9.7 resource artwork loader.
 *
 * All map resource art comes from one 2048x1280 WebP atlas containing forty
 * transparent 256x256 frames. The atlas request starts as soon as the icon
 * service is constructed; index.html also preloads the same URL so normal
 * map rendering does not flash SVG artwork before the raster art arrives.
 */
export class ResourceIcons extends LegacyResourceIcons{
  constructor(){
    super();
    this.atlasImage=null;
    this.atlasStatus="idle";
    this.loadAtlas();
  }

  setOnReady(callback){
    super.setOnReady(callback);
    if(this.atlasStatus==="ready"&&this.assetReadyCallback)queueMicrotask(()=>this.assetReadyCallback?.());
  }

  frameIndex(tile){return ATLAS_INDEX.get(tile?.resourceId);}
  hasAtlasFrame(tile){return this.frameIndex(tile)!==undefined;}
  imagePath(tile){return this.hasAtlasFrame(tile)?ATLAS_PATH:null;}

  loadAtlas(){
    if(this.atlasImage||typeof Image==="undefined")return this.atlasImage;
    const image=new Image();
    this.atlasImage=image;
    this.atlasStatus="loading";
    image.decoding="sync";
    try{image.fetchPriority="high";}catch{}
    image.onload=()=>{
      this.atlasStatus=image.naturalWidth>=FRAME&&image.naturalHeight>=FRAME?"ready":"error";
      if(this.atlasStatus==="ready")this.assetReadyCallback?.();
    };
    image.onerror=()=>{this.atlasStatus="error";};
    image.src=ATLAS_PATH;
    return image;
  }

  imageEntry(tile){
    if(!this.hasAtlasFrame(tile))return null;
    const image=this.loadAtlas();
    return image?{image,status:this.atlasStatus}:null;
  }

  isImageLoading(tile){return this.hasAtlasFrame(tile)&&this.atlasStatus==="loading";}

  drawBackground(ctx,tile,x,y,size,alpha=1){
    const index=this.frameIndex(tile);
    if(index===undefined)return false;
    const image=this.loadAtlas();
    if(this.atlasStatus!=="ready"||!image?.complete||image.naturalWidth<=0)return false;
    const sx=(index%COLS)*FRAME,sy=Math.floor(index/COLS)*FRAME;
    ctx.save();ctx.globalAlpha=alpha;
    try{ctx.drawImage(image,sx,sy,FRAME,FRAME,x,y,size,size);}catch{this.atlasStatus="error";ctx.restore();return false;}
    ctx.restore();return true;
  }
}
