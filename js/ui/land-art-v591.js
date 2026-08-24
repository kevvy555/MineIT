import { artImage, developmentKind, developmentLevel } from "./land-art.js?v=5.6.1";

const VERSION="5.9.1";
const FRAMES=5;
const MIN_FRAME_SIZE=128;

export { artImage, developmentKind, developmentLevel };

export function developmentOriginalPath(dev){
  const kind=developmentKind(dev),level=developmentLevel(dev);
  return kind?`./assets/art/development/${kind}/originals/${kind}-l${level}.png?v=${VERSION}`:null;
}

export function developmentAtlasPath(dev){
  const kind=developmentKind(dev);
  return kind?`./assets/art/development/${kind}/${kind}-levels-256.webp?v=${VERSION}`:null;
}

export function drawDevelopmentFrame(ctx,img,level,x,y,w,h,scale=.96){
  if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return false;
  const frameWidth=img.naturalWidth/FRAMES,frameHeight=img.naturalHeight;
  if(!Number.isInteger(frameWidth)||frameWidth<MIN_FRAME_SIZE||frameHeight<MIN_FRAME_SIZE)return false;
  const index=Math.max(1,Math.min(FRAMES,Number(level)||1))-1;
  const ratio=Math.min(w/frameWidth,h/frameHeight)*scale,dw=frameWidth*ratio,dh=frameHeight*ratio;
  ctx.drawImage(img,frameWidth*index,0,frameWidth,frameHeight,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  return true;
}
