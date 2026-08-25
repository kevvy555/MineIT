import { WorldView as V580WorldView } from "./world-view-v580.js?v=5.8.0&legacy=1";
import { clamp } from "../core/utils.js?v=5.5.5";
import { developmentAtlasPath,developmentKind,developmentLevel,artImage,drawDevelopmentFrame } from "./land-art-v591.js?v=5.9.1";

const VERSION="5.9.3";
const TYPE_COLOR={food:"#83e69a",build:"#a7d7e7",fuel:"#ffb27e",ore:"#d3b4ff"};

/**
 * High-resolution building art plus the compact v5.9.3 map tile language.
 * Terrain is always the base layer. Survey state, resources and buildings are
 * progressively layered on top so the geography never disappears.
 */
export class WorldView extends V580WorldView{
  levelBadgePath(level){return `./assets/art/Level/L${Math.max(1,Math.min(5,Number(level)||1))}.png?v=${VERSION}`;}

  drawBuildingFallback(c,dev,px,py){
    const kind=developmentKind(dev),cx=px+this.cell/2,cy=py+this.cell*.52,w=this.cell*.58,h=this.cell*.48;
    c.save();c.fillStyle="rgba(10,15,19,.90)";c.strokeStyle="#d9e4e8";c.lineWidth=Math.max(1,this.cell*.022);
    if(kind==="housing"){
      for(let i=-1;i<=1;i++){const bw=this.cell*.14,bh=this.cell*.36,x=cx+i*this.cell*.18-bw/2,y=cy-bh/2;c.fillRect(x,y,bw,bh);c.strokeRect(x,y,bw,bh);}
    }else if(kind==="industry"||dev?.kind==="power"){
      c.fillRect(cx-w/2,cy-h/2,w,h);c.strokeRect(cx-w/2,cy-h/2,w,h);
      if(dev?.kind==="power"){c.beginPath();c.moveTo(cx+this.cell*.04,cy-h*.28);c.lineTo(cx-this.cell*.07,cy);c.lineTo(cx+this.cell*.01,cy);c.lineTo(cx-this.cell*.05,cy+h*.28);c.stroke();}
    }else{
      c.beginPath();c.arc(cx,cy,this.cell*.25,0,Math.PI*2);c.fill();c.stroke();
    }
    c.restore();
  }

  drawDevelopment(c,tile,px,py){
    const dev=tile?.development||(tile?.developed?{kind:"extract",family:tile.family,level:tile.level||1}:null);if(!dev)return;
    const level=developmentLevel(dev);
    if(dev.kind==="power")this.drawBuildingFallback(c,dev,px,py);
    else{
      const src=developmentAtlasPath(dev),img=artImage(src,this.assetReady);
      if(!img||!drawDevelopmentFrame(c,img,level,px+1,py+1,this.cell-2,this.cell-2,.98))this.drawBuildingFallback(c,dev,px,py);
    }
    const closed=Math.max(0,Math.ceil(Number(tile?.accidentShutdownDays)||0));
    if(closed){
      c.save();const h=Math.max(10,this.cell*.16),y=py+this.cell*.72;c.fillStyle="rgba(120,10,10,.90)";c.fillRect(px+this.cell*.12,y,this.cell*.76,h);c.fillStyle="#fff";c.textAlign="center";c.textBaseline="middle";c.font=`bold ${Math.max(6,this.cell*.075)}px system-ui`;c.fillText(`CLOSED ${closed}D`,px+this.cell/2,y+h/2);c.restore();
    }
  }

  drawLevelBadge(c,level,px,py){
    level=Math.max(1,Math.min(5,Number(level)||1));const size=Math.max(15,this.cell*.22),x=px+this.cell-size-this.cell*.045,y=py+this.cell*.045,img=artImage(this.levelBadgePath(level),this.assetReady);
    c.save();
    if(img?.complete&&img.naturalWidth>0){
      try{c.drawImage(img,x,y,size,size);c.restore();return;}catch{}
    }
    c.fillStyle="rgba(4,6,8,.90)";c.fillRect(x,y,size,size);c.strokeStyle="rgba(255,255,255,.42)";c.lineWidth=1;c.strokeRect(x+.5,y+.5,size-1,size-1);c.fillStyle="#fff";c.textAlign="center";c.textBaseline="middle";c.shadowColor="#000";c.shadowBlur=3;c.font=`900 ${Math.max(8,size*.44)}px system-ui`;c.fillText(`L${level}`,x+size/2,y+size/2+.5);c.restore();
  }

  drawResourceBadge(c,tile,px,py){
    if(!tile?.resourceId)return;const size=Math.max(15,this.cell*.22),x=px+this.cell*.045,y=py+this.cell*.045;
    c.save();c.fillStyle="rgba(4,6,8,.90)";c.fillRect(x,y,size,size);c.strokeStyle=TYPE_COLOR[tile.type]||"#fff";c.lineWidth=1;c.strokeRect(x+.5,y+.5,size-1,size-1);c.restore();
    if(!this.icons.drawBackground?.(c,tile,x+1,y+1,size-2,1))this.icons.draw(c,tile,x+size/2,y+size/2,size*.72);
  }

  drawResourceOverlay(c,tile,px,py,alpha=1){
    const size=this.cell*.60,x=px+(this.cell-size)/2,y=py+this.cell*.09;
    c.save();c.shadowColor="rgba(0,0,0,.75)";c.shadowBlur=Math.max(2,this.cell*.04);const drawn=this.icons.drawBackground?.(c,tile,x,y,size,alpha)===true;c.restore();
    if(!drawn)this.icons.draw(c,tile,px+this.cell/2,py+this.cell*.38,this.cell*.43);
  }

  drawQuality(c,tile,px,py,yRatio=.12){
    if(tile?.quality==null)return;c.save();c.fillStyle="#fff";c.textAlign="center";c.textBaseline="middle";c.shadowColor="rgba(0,0,0,.98)";c.shadowBlur=Math.max(3,this.cell*.055);c.shadowOffsetY=1;c.font=`900 ${Math.max(8,this.cell*.12)}px system-ui`;c.fillText(`Q${Math.round(tile.quality)}`,px+this.cell/2,py+this.cell*yRatio,this.cell*.50);c.restore();
  }

  drawResourceInfo(c,tile,px,py){
    const col=TYPE_COLOR[tile.type]||"#fff";
    c.save();const grad=c.createLinearGradient(0,py+this.cell*.55,0,py+this.cell);grad.addColorStop(0,"rgba(0,0,0,0)");grad.addColorStop(1,"rgba(0,0,0,.68)");c.fillStyle=grad;c.fillRect(px+1,py+this.cell*.52,this.cell-2,this.cell*.48-1);
    c.textAlign="center";c.textBaseline="middle";c.shadowColor="rgba(0,0,0,.95)";c.shadowBlur=3;c.fillStyle="#fff";c.font=`900 ${Math.max(8,this.cell*.12)}px system-ui`;c.fillText(`Q${Math.round(tile.quality)}`,px+this.cell/2,py+this.cell*.67,this.cell*.82);c.fillStyle=col;c.font=`800 ${Math.max(6,this.cell*.082)}px system-ui`;c.fillText(this.depositText(tile),px+this.cell/2,py+this.cell*.80,this.cell*.88);c.restore();
  }

  drawRemainingBar(c,tile,px,py){
    if(!tile?.developed||!tile.resourceId)return;const renewable=this.resources.isRenewable(tile),pct=renewable?clamp((tile.renewableHealth||1)/Math.max(1,(tile.renewableOriginalRank||0)+1),0,1):clamp((tile.reserve||0)/Math.max(1,tile.initialReserve||1),0,1),x=px+this.cell*.055,w=this.cell*.89,h=Math.max(4,this.cell*.045),y=py+this.cell-h-this.cell*.04;
    c.save();c.fillStyle="rgba(0,0,0,.92)";c.fillRect(x-2,y-2,w+4,h+4);c.strokeStyle="rgba(230,240,244,.68)";c.lineWidth=1;c.strokeRect(x-1.5,y-1.5,w+3,h+3);c.fillStyle="#14191c";c.fillRect(x,y,w,h);c.fillStyle=TYPE_COLOR[tile.type]||"#67e66d";c.fillRect(x,y,w*pct,h);c.restore();
  }

  drawSurveyState(c,tile,px,py,active,queued,selected){
    this.drawTerrain(c,tile,px,py);
    c.save();c.fillStyle=active?"rgba(0,24,43,.22)":queued?"rgba(0,15,28,.18)":"rgba(0,0,0,.10)";c.fillRect(px+1,py+1,this.cell-2,this.cell-2);c.fillStyle=selected?"#70dbff":"rgba(255,255,255,.82)";c.textAlign="center";c.textBaseline="middle";c.shadowColor="rgba(0,0,0,.95)";c.shadowBlur=Math.max(3,this.cell*.05);c.font=`900 ${Math.max(23,this.cell*.46)}px system-ui`;c.fillText("?",px+this.cell/2,py+this.cell*.48);
    if(active||queued){c.font=`900 ${Math.max(6,this.cell*.07)}px system-ui`;c.fillStyle=active?"#70dbff":"#b6c8d2";c.fillText(active?"SCANNING":"QUEUED",px+this.cell/2,py+this.cell*.84,this.cell*.80);}
    c.shadowBlur=0;c.strokeStyle=selected?"#59d4ff":"rgba(235,245,248,.24)";c.lineWidth=selected?2:1;c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);c.restore();
  }

  drawTileSelectionAndFocus(c,tile,x,y,px,py){
    if(!this.matchesFocus(tile,x,y)){c.save();c.fillStyle="rgba(0,0,0,.67)";c.fillRect(px+1,py+1,this.cell-2,this.cell-2);c.restore();}
    if(this.hasProblem(tile))this.drawProblemBadge(c,px,py);
    if(this.selectedKey===`${x},${y}`){c.save();c.strokeStyle="#ffffff";c.lineWidth=Math.max(2,this.cell*.035);c.strokeRect(px+2,py+2,this.cell-4,this.cell-4);c.strokeStyle="#59d4ff";c.lineWidth=1;c.strokeRect(px+4,py+4,this.cell-8,this.cell-8);c.restore();}
  }

  drawResourceTile(c,tile,x,y,px,py,active,queued,selected){
    if(this.isShipTile(x,y)){
      this.drawTerrain(c,tile,px,py,.10);c.save();c.fillStyle="rgba(4,8,11,.68)";c.fillRect(px+this.cell*.18,py+this.cell*.69,this.cell*.64,this.cell*.2);c.fillStyle="#fff";c.font=`bold ${Math.max(8,this.cell*.12)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText("SHIP",px+this.cell/2,py+this.cell*.79);c.restore();this.drawTileSelectionAndFocus(c,tile,x,y,px,py);return;
    }
    if(!tile?.revealed){this.drawSurveyState(c,tile,px,py,active,queued,selected);this.drawTileSelectionAndFocus(c,tile,x,y,px,py);return;}

    this.drawTerrain(c,tile,px,py);
    const hasResource=tile.resourceId!==null&&tile.resourceId!==undefined,dev=tile.development||(tile.developed?{kind:"extract",family:tile.family,level:tile.level||1}:null),hasBuilding=!!dev;

    if(!hasBuilding){
      if(hasResource){
        const techLocked=!tile.depleted&&!this.technology.canExploit(this.state,tile),alpha=techLocked?.48:tile.depleted?.30:.92;this.drawResourceOverlay(c,tile,px,py,alpha);this.drawResourceInfo(c,tile,px,py);
        if(techLocked){c.save();c.fillStyle="rgba(0,0,0,.62)";c.fillRect(px+this.cell*.13,py+this.cell*.05,this.cell*.74,this.cell*.15);c.fillStyle="#fff";c.font=`800 ${Math.max(6,this.cell*.075)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText(`LOCK • M${tile.requiredMiningLevel||1}`,px+this.cell/2,py+this.cell*.125,this.cell*.68);c.restore();}
        if(tile.depleted){c.save();c.fillStyle="rgba(0,0,0,.70)";c.fillRect(px+this.cell*.13,py+this.cell*.05,this.cell*.74,this.cell*.15);c.fillStyle="#c8d0d4";c.font=`800 ${Math.max(6,this.cell*.075)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText("DEPLETED",px+this.cell/2,py+this.cell*.125);c.restore();}
      }
    }else{
      this.drawDevelopment(c,{...tile,development:dev},px,py);
      if(hasResource)this.drawResourceBadge(c,tile,px,py);
      if(hasResource&&(dev.kind==="extract"||tile.developed))this.drawQuality(c,tile,px,py,.12);
      this.drawLevelBadge(c,developmentLevel(dev),px,py);
      if(hasResource&&(dev.kind==="extract"||tile.developed))this.drawRemainingBar(c,tile,px,py);
    }

    c.save();c.strokeStyle=selected?"#59d4ff":"rgba(235,245,248,.24)";c.lineWidth=selected?2:1;c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);c.restore();
    this.drawTileSelectionAndFocus(c,tile,x,y,px,py);
  }
}
