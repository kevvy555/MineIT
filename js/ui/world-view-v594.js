import { WorldView as V593WorldView } from "./world-view-v591.js?v=5.9.1&legacy=1";
import { artImage } from "./land-art-v591.js?v=5.9.1";

const SHIP_ART="./assets/art/colony-ship.webp?v=2";

/**
 * v5.9.4: render the colony ship from a direct raster asset.
 * The previous SVG wrapper embedded a WebP data URI and could silently fail
 * when decoded as a canvas Image. Keep a visible fallback so the ship tile
 * can never become blank while the asset is loading or if decoding fails.
 */
export class WorldView extends V593WorldView{
  drawShip(c,px,py){
    const img=artImage(SHIP_ART,this.assetReady);
    if(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0){
      const maxW=this.cell*.96,maxH=this.cell*.62,ratio=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight),w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;
      c.save();
      c.shadowColor="rgba(0,0,0,.80)";
      c.shadowBlur=Math.max(2,this.cell*.055);
      c.shadowOffsetY=Math.max(1,this.cell*.015);
      try{
        c.drawImage(img,px+(this.cell-w)/2,py+(this.cell-h)/2,w,h);
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
