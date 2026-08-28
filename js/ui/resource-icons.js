const PATHS={
  food:`<path d="M16 27V10M16 15c-6 0-9-3-9-8 6 0 9 3 9 8Zm0 3c6 0 9-3 9-8-6 0-9 3-9 8Z"/>`,
  fungal:`<path d="M8 18c2-6 14-6 16 0H8Zm8-1v8m-5 0h10M10 13c1-4 11-4 12 0"/>`,
  herd:`<path d="M9 13c-4-2-5-6-4-9m18 9c4-2 5-6 4-9M9 13c1-5 13-5 14 0v7c-2 6-12 6-14 0v-7Z"/><circle cx="12" cy="17" r="1"/><circle cx="20" cy="17" r="1"/>`,
  build:`<path d="M5 22 10 9l10-4 7 9-4 13H10L5 22Z"/><path d="m10 9 7 7 10-2M17 16l6 11"/>`,
  stone:`<path d="M5 22 10 9l10-4 7 9-4 13H10L5 22Z"/><path d="m10 9 7 7 10-2M17 16l6 11"/>`,
  clay:`<path d="M6 9h20M8 14h16M6 19h20M10 24h12"/>`,
  silica:`<path d="m16 3 8 8-8 17-8-17 8-8Z"/><path d="m8 11 8 5 8-5"/>`,
  fuel:`<path d="M17 3c1 7-5 8-2 13 2-3 5-4 6-8 5 6 6 13 1 18-4 4-12 3-15-2-4-7 2-12 10-21Z"/>`,
  biomass:`<path d="M16 27V10M16 15c-6 0-9-3-9-8 6 0 9 3 9 8Zm0 3c6 0 9-3 9-8-6 0-9 3-9 8Z"/>`,
  peat:`<path d="M6 9h20M8 14h16M6 19h20M10 24h12"/>`,
  coal:`<path d="M6 9h20M8 14h16M6 19h20M10 24h12"/>`,
  oil:`<path d="M16 4c4 6 7 9 7 13a7 7 0 1 1-14 0c0-4 3-7 7-13Z"/>`,
  gas:`<path d="M8 24h16M10 20c2-2 2-4 0-6m6 6c2-2 2-4 0-6m6 6c2-2 2-4 0-6"/>`,
  ore:`<path d="M6 18 11 7l10-2 5 8-4 12-11 2-5-9Z"/><path d="M11 7l5 7 5-9M16 14l6 11"/>`,
  iron:`<path d="M6 18 11 7l10-2 5 8-4 12-11 2-5-9Z"/><path d="M11 7l5 7 5-9M16 14l6 11"/>`,
  copper:`<circle cx="16" cy="16" r="10"/><path d="M10 19c4-6 8-6 12-1M13 10l6 12"/>`,
  gold:`<path d="M8 10h16l3 12H5l3-12Z"/><path d="M11 10l2-5h6l2 5M10 17h12"/>`,
  silver:`<path d="m16 4 8 8-8 16-8-16 8-8Z"/><path d="m8 12 8 4 8-4"/>`,
  gems:`<path d="m9 17 5-8 5 8-5 8-5-8Z"/><path d="m17 12 4-6 5 7-5 7-4-8Z"/>`,
  diamond:`<path d="M7 11 12 5h8l5 6-9 16L7 11Z"/><path d="m7 11 9 4 9-4M12 5l4 10 4-10"/>`,
  exotic:`<path d="m16 3 7 5 4 8-5 9-10 3-7-8 3-10 8-7Z"/><path d="m16 3 0 13 11 0M16 16l-4 12"/>`
};
const ID_ALIAS={flora:"food",nutrient:"food",protein:"fungal",thermal:"food",fiber:"food",limestone:"stone",structural:"build",ceramic:"silica",fissile:"ore",brine:"oil","exotic-fuel":"exotic","surface-iron":"iron",reactive:"ore",conductive:"ore",platinum:"silver",palladium:"silver",sapphire:"gems",ruby:"gems",emerald:"gems",magnetic:"ore",crystal:"exotic",advanced:"exotic"};

const ATLAS_PATH="./assets/art/resources/resource-atlas-256.webp?v=5.9.7";
const FRAME=256,COLS=8;
const ATLAS_IDS=[
  "fungal","flora","herd","nutrient","protein","thermal","synthetic",
  "fiber","stone","clay","silica","limestone","structural","ceramic",
  "biomass","peat","coal","oil","gas","fissile","brine","exotic-fuel",
  "surface-iron","iron","copper","reactive","conductive","magnetic","exotic","advanced",
  "silver","gold","gems","platinum","palladium","sapphire","ruby","emerald","diamond","crystal"
];
const ATLAS_INDEX=new Map(ATLAS_IDS.map((id,index)=>[id,index]));

/** Canonical resource artwork service: atlas-backed map art with SVG fallback icons. */
export class ResourceIcons{
  constructor(){this.assetReadyCallback=null;this.atlasImage=null;this.atlasStatus="idle";this.loadAtlas();}
  setOnReady(callback){this.assetReadyCallback=typeof callback==="function"?callback:null;if(this.atlasStatus==="ready"&&this.assetReadyCallback)queueMicrotask(()=>this.assetReadyCallback?.());}
  colorFor(tile){if(tile.type==="food")return"#79e09a";if(tile.type==="build")return"#9ad0e2";if(tile.type==="fuel")return"#ff9f5f";return"#c7a0ff";}
  markup(id,type="ore"){return PATHS[id]||PATHS[ID_ALIAS[id]]||PATHS[type]||PATHS.ore;}
  svg(id,color="#eaf4f8",size=32,type="ore"){return`<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${this.markup(id,type)}</svg>`;}
  frameIndex(tile){return ATLAS_INDEX.get(tile?.resourceId);}
  hasAtlasFrame(tile){return this.frameIndex(tile)!==undefined;}
  imagePath(tile){return this.hasAtlasFrame(tile)?ATLAS_PATH:null;}
  loadAtlas(){
    if(this.atlasImage||typeof Image==="undefined")return this.atlasImage;
    const image=new Image();this.atlasImage=image;this.atlasStatus="loading";image.decoding="sync";
    try{image.fetchPriority="high";}catch{}
    image.onload=()=>{this.atlasStatus=image.naturalWidth>=FRAME&&image.naturalHeight>=FRAME?"ready":"error";if(this.atlasStatus==="ready")this.assetReadyCallback?.();};
    image.onerror=()=>{this.atlasStatus="error";};image.src=ATLAS_PATH;return image;
  }
  imageEntry(tile){if(!this.hasAtlasFrame(tile))return null;const image=this.loadAtlas();return image?{image,status:this.atlasStatus}:null;}
  isImageLoading(tile){return this.hasAtlasFrame(tile)&&this.atlasStatus==="loading";}
  drawBackground(ctx,tile,x,y,size,alpha=1){
    const index=this.frameIndex(tile);if(index===undefined)return false;const image=this.loadAtlas();if(this.atlasStatus!=="ready"||!image?.complete||image.naturalWidth<=0)return false;
    const sx=(index%COLS)*FRAME,sy=Math.floor(index/COLS)*FRAME;ctx.save();ctx.globalAlpha=alpha;
    try{ctx.drawImage(image,sx,sy,FRAME,FRAME,x,y,size,size);}catch{this.atlasStatus="error";ctx.restore();return false;}ctx.restore();return true;
  }
  compiled(id,type){this.cache||={};const k=`${type}:${id}`;if(this.cache[k])return this.cache[k];const markup=this.markup(id,type),shapes=[];if(typeof Path2D!=="undefined"){const pathRe=/<path d="([^"]+)"\/>/g;let m;while((m=pathRe.exec(markup))!==null){try{shapes.push({kind:"path",value:new Path2D(m[1])})}catch{}}}const circleRe=/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"\/>/g;let c;while((c=circleRe.exec(markup))!==null)shapes.push({kind:"circle",cx:+c[1],cy:+c[2],r:+c[3]});return this.cache[k]=shapes;}
  fallback(ctx,tile,cx,cy,size){ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=this.colorFor(tile);ctx.lineWidth=Math.max(1.4,size*.075);const r=size*.34;ctx.beginPath();if(tile.type==="food"){ctx.moveTo(0,r);ctx.bezierCurveTo(-r,-r*.1,-r*.8,-r*.9,0,-r);ctx.bezierCurveTo(r*.8,-r*.9,r,-r*.1,0,r);}else if(tile.type==="fuel"){ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.9,-r*.1,r*.6,r*.8,0,r);ctx.bezierCurveTo(-r*.8,r*.6,-r*.7,-r*.2,0,-r);}else{ctx.moveTo(-r*.8,r*.55);ctx.lineTo(-r*.45,-r*.7);ctx.lineTo(r*.35,-r);ctx.lineTo(r*.85,-r*.15);ctx.lineTo(r*.5,r*.75);ctx.lineTo(-r*.35,r);ctx.closePath();}ctx.stroke();ctx.restore();}
  draw(ctx,tile,cx,cy,size){const shapes=this.compiled(tile.resourceId||tile.type,tile.type);if(!shapes.length){this.fallback(ctx,tile,cx,cy,size);return;}ctx.save();const scale=size/32;ctx.translate(cx-size/2,cy-size/2);ctx.scale(scale,scale);ctx.strokeStyle=this.colorFor(tile);ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";try{for(const s of shapes){if(s.kind==="path")ctx.stroke(s.value);else{ctx.beginPath();ctx.arc(s.cx,s.cy,s.r,0,Math.PI*2);ctx.stroke();}}}catch{ctx.restore();this.fallback(ctx,tile,cx,cy,size);return;}ctx.restore();}
}
