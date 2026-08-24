import { WorldView as V580WorldView } from "./world-view-v580.js?v=5.8.0&legacy=1";
import { developmentAtlasPath,developmentKind,developmentLevel,artImage,drawDevelopmentFrame } from "./land-art-v591.js?v=5.9.1";

const DEVELOPMENT_LABELS={
  housing:"H",industry:"I",quarry:"Q",mine:"M","deep-mine":"DM",rig:"R",farm:"F",ranch:"RA","bio-harvester":"B","algae-facility":"A"
};

/** v5.9.1 high-resolution building artwork layer. */
export class WorldView extends V580WorldView{
  drawDevelopment(ctx,tile,px,py){
    const dev=tile?.development;
    if(!dev)return;
    if(dev.kind==="power"){super.drawDevelopment(ctx,tile,px,py);return;}

    const src=developmentAtlasPath(dev),img=artImage(src,this.assetReady),level=developmentLevel(dev),kind=developmentKind(dev),label=DEVELOPMENT_LABELS[kind]||String(kind||"?").slice(0,2).toUpperCase();
    if(!img||!drawDevelopmentFrame(ctx,img,level,px+1,py+1,this.cell-2,this.cell-2)){
      super.drawDevelopment(ctx,tile,px,py);
      return;
    }

    ctx.save();
    const badge=`${label} L${level}`;
    ctx.font=`bold ${Math.max(6,this.cell*.09)}px system-ui`;
    const badgeWidth=Math.min(this.cell*.72,ctx.measureText(badge).width+this.cell*.12),badgeHeight=Math.max(10,this.cell*.17),x=px+(this.cell-badgeWidth)/2,y=py+this.cell-badgeHeight-this.cell*.04;
    ctx.fillStyle="rgba(4,8,11,.72)";
    ctx.fillRect(x,y,badgeWidth,badgeHeight);
    ctx.fillStyle="#fff";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(badge,px+this.cell/2,y+badgeHeight/2);
    ctx.restore();

    const closed=Math.max(0,Math.ceil(Number(tile?.accidentShutdownDays)||0));
    if(closed){
      ctx.save();
      const h=Math.max(11,this.cell*.2),y=py+this.cell*.05;
      ctx.fillStyle="rgba(120,10,10,.88)";
      ctx.fillRect(px+this.cell*.08,y,this.cell*.84,h);
      ctx.fillStyle="#fff";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.font=`bold ${Math.max(6,this.cell*.085)}px system-ui`;
      ctx.fillText(`CLOSED ${closed}D`,px+this.cell/2,y+h/2);
      ctx.restore();
    }
  }
}
