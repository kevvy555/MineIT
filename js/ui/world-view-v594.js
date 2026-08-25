import { WorldView as V593WorldView } from "./world-view-v591.js?v=5.9.1&legacy=1";
import { artImage } from "./land-art-v591.js?v=5.9.1";

const SHIP_ART="./assets/art/colony-ship.webp?v=3";

/**
 * v5.9.7 map-art refinements:
 * - resource art is rendered directly from the preloaded 256px atlas;
 * - no runtime black-pixel/cutout processing is performed;
 * - SVG resource artwork is used only if the atlas genuinely fails;
 * - the colony ship remains a prominent diagonal tile asset.
 */
export class WorldView extends V593WorldView{
  drawResourceOverlay(c,tile,px,py,alpha=1){
    const size=this.cell*.60,x=px+(this.cell-size)/2,y=py+this.cell*.09;
    c.save();
    c.shadowColor="rgba(0,0,0,.55)";
    c.shadowBlur=Math.max(2,this.cell*.035);
    const drawn=this.icons.drawBackground?.(c,tile,x,y,size,alpha)===true;
    c.restore();
    if(drawn)return;

    // Do not flash the SVG while the atlas is in flight. The atlas is
    // preloaded from index.html and starts loading again from ResourceIcons
    // construction, so this should normally last no more than the first frame.
    if(this.icons.isImageLoading?.(tile))return;
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
