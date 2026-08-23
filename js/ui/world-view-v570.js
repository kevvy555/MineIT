import { WorldView as LegacyWorldView } from "./world-view-v56.js?v=5.6.2&legacy=1";

const LOCAL_BUILDINGS=new Set(["housing","power","industry"]);
export class WorldView extends LegacyWorldView{
  constructor(options){
    const appTap=options.onTap,inspect=options.onInspect,state=options.state,world=options.world;
    super({...options,onTap:(x,y)=>{const tile=world.get(state,x,y);if(LOCAL_BUILDINGS.has(tile?.development?.kind)){inspect?.(x,y);return;}appTap?.(x,y);}});
  }
  drawDevelopment(ctx,tile,px,py){
    if(tile?.development?.kind!=="power"){super.drawDevelopment(ctx,tile,px,py);return;}
    const level=Math.max(1,Math.min(5,Number(tile.development.level)||1)),c=this.cell;
    ctx.save();
    ctx.fillStyle="rgba(12,18,22,.9)";ctx.fillRect(px+c*.13,py+c*.28,c*.74,c*.52);
    ctx.fillStyle="rgba(70,82,90,.95)";ctx.fillRect(px+c*.20,py+c*.16,c*.14,c*.28);ctx.fillRect(px+c*.42,py+c*.11,c*.14,c*.33);if(level>=3)ctx.fillRect(px+c*.64,py+c*.18,c*.12,c*.26);
    ctx.strokeStyle="#f4d35e";ctx.lineWidth=Math.max(2,c*.035);ctx.beginPath();ctx.moveTo(px+c*.53,py+c*.37);ctx.lineTo(px+c*.43,py+c*.55);ctx.lineTo(px+c*.54,py+c*.55);ctx.lineTo(px+c*.46,py+c*.71);ctx.stroke();
    const badge=`P L${level}`,h=Math.max(10,c*.17),w=Math.min(c*.72,c*.48),x=px+(c-w)/2,y=py+c-h-c*.04;ctx.fillStyle="rgba(4,8,11,.76)";ctx.fillRect(x,y,w,h);ctx.fillStyle="#fff";ctx.font=`bold ${Math.max(6,c*.09)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(badge,px+c/2,y+h/2);ctx.restore();
  }
}
