import { WorldView as LegacyWorldView } from "./world-view-v570.js?v=5.7.0&legacy=1";

const LOCAL_BUILDINGS=new Set(["housing","power","industry"]);
const RESOURCE_TAG={food:"F",build:"B",fuel:"FU",ore:"O"};
const RESOURCE_COLOR={food:"#83e69a",build:"#a7d7e7",fuel:"#ffb27e",ore:"#d3b4ff"};

/** v5.8 map-first presentation. One map always shows terrain, resources and developments together. */
export class WorldView extends LegacyWorldView{
  constructor(options){
    const originalTap=options.onTap,state=options.state,world=options.world,land=options.land;
    const select=(x,y)=>{
      const tile=world.get(state,x,y);
      if(!tile?.revealed&&!land?.isShipTile?.(x,y)){originalTap?.(x,y);return;}
      document.dispatchEvent(new CustomEvent("mineit:tile-selected",{detail:{x,y}}));
    };
    super({...options,onTap:select,onInspect:select});
    this.selectedKey=null;this.focusMode=state.colony?.land?.focusMode||"all";
    document.addEventListener("mineit:tile-selected",e=>{const{x,y}=e.detail||{};this.selectedKey=`${x},${y}`;this.safeDraw();});
    document.addEventListener("mineit:map-focus",e=>{this.focusMode=e.detail?.mode||"all";this.safeDraw();});
  }
  view(){return"resource";}
  isUpgradeable(tile){
    if(!tile?.development)return false;
    const level=Math.max(1,Number(tile.development.level??tile.level)||1);if(level>=5)return false;
    if(LOCAL_BUILDINGS.has(tile.development.kind))return this.technology.level(this.state,tile.development.kind)>level;
    if(tile.type==="food")return this.technology.level(this.state,"food")>level;
    return this.technology.canExploit(this.state,tile);
  }
  hasProblem(tile){
    if(!tile?.revealed)return false;
    if(tile.accidentShutdownDays>0||tile.depleted||tile.renewableWiped)return true;
    if(this.resources.isRenewable(tile)&&tile.developed&&(Number(tile.harvestIntensity)||1)>1)return true;
    if(tile.development?.kind==="power"&&(this.state.metrics?.powerFactor??1)<.95)return true;
    if(tile.development?.kind==="housing"){
      const cap=Math.max(1,Number(this.state.colony?.housingCapacity)||1);if((Number(this.state.pop)||0)/cap>.9)return true;
    }
    if(tile.developed&&(tile.type==="build"||tile.type==="ore"))return(this.state.metrics?.industryCommercialFactor??1)<.999||(this.state.metrics?.workforceCommercialFactor??1)<.999;
    if(tile.developed&&(tile.type==="food"||tile.type==="fuel"))return(this.state.metrics?.workforceSurvivalFactor??1)<.999;
    return false;
  }
  matchesFocus(tile,x,y){
    const mode=this.focusMode||"all";if(mode==="all")return true;if(mode==="problems")return this.hasProblem(tile);if(mode==="buildings")return!!tile?.development||this.isShipTile(x,y);if(mode==="upgradeable")return this.isUpgradeable(tile);
    if(["food","build","fuel","ore"].includes(mode))return tile?.type===mode;
    if(mode==="power")return tile?.development?.kind==="power"||tile?.revealed&&tile.resourceId===null&&!tile.development&&!this.isShipTile(x,y);
    if(mode==="housing")return tile?.development?.kind==="housing"||tile?.revealed&&tile.resourceId===null&&!tile.development&&!this.isShipTile(x,y);
    if(mode==="industry")return tile?.development?.kind==="industry"||tile?.revealed&&tile.resourceId===null&&!tile.development&&!this.isShipTile(x,y);
    return true;
  }
  drawResourceTag(c,tile,px,py){
    if(!tile?.resourceId||!tile.development)return;const tag=RESOURCE_TAG[tile.type]||"R",size=Math.max(12,this.cell*.18);
    c.save();c.fillStyle="rgba(4,8,11,.84)";c.fillRect(px+this.cell*.04,py+this.cell*.04,size,size);c.strokeStyle=RESOURCE_COLOR[tile.type]||"#fff";c.lineWidth=1;c.strokeRect(px+this.cell*.04+.5,py+this.cell*.04+.5,size-1,size-1);c.fillStyle=RESOURCE_COLOR[tile.type]||"#fff";c.font=`bold ${Math.max(6,this.cell*.075)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText(tag,px+this.cell*.04+size/2,py+this.cell*.04+size/2);c.restore();
  }
  drawProblemBadge(c,px,py){
    const r=Math.max(7,this.cell*.09),x=px+this.cell-r-4,y=py+r+4;c.save();c.fillStyle="#d9534f";c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.fillStyle="#fff";c.font=`bold ${Math.max(8,r*1.35)}px system-ui`;c.textAlign="center";c.textBaseline="middle";c.fillText("!",x,y+.5);c.restore();
  }
  drawResourceTile(c,tile,x,y,px,py,active,queued,selected){
    super.drawResourceTile(c,tile,x,y,px,py,active,queued,selected);
    if(tile?.development)this.drawDevelopment(c,tile,px,py);
    this.drawResourceTag(c,tile,px,py);
    if(!this.matchesFocus(tile,x,y)){c.save();c.fillStyle="rgba(0,0,0,.67)";c.fillRect(px+1,py+1,this.cell-2,this.cell-2);c.restore();}
    if(this.hasProblem(tile))this.drawProblemBadge(c,px,py);
    if(this.selectedKey===`${x},${y}`){c.save();c.strokeStyle="#ffffff";c.lineWidth=Math.max(2,this.cell*.035);c.strokeRect(px+2,py+2,this.cell-4,this.cell-4);c.strokeStyle="#59d4ff";c.lineWidth=1;c.strokeRect(px+4,py+4,this.cell-8,this.cell-8);c.restore();}
  }
  draw(){super.draw();const label=document.querySelector("#cameraText");if(label)label.textContent="COLONY MAP • 8×8";}
}
