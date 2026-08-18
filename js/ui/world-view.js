import { CONFIG } from "../core/config.js?v=4.0.2";
import { clamp } from "../core/utils.js?v=4.0.2";

export class WorldView {
  constructor({state,world,survey,resources,technology,icons,diagnostics,onTap,onMulti}){
    Object.assign(this,{state,world,survey,resources,technology,icons,diagnostics,onTap,onMulti});
    this.canvas=document.querySelector("#world");
    this.shell=document.querySelector("#worldShell");
    this.ctx=this.canvas.getContext("2d");
    this.selection=new Map();
    this.bindInput();
    new ResizeObserver(()=>this.resize()).observe(this.shell);
    this.resize();
  }

  resize(){
    const r=this.shell.getBoundingClientRect(),dpr=Math.max(1,devicePixelRatio||1);
    this.canvas.width=r.width*dpr;this.canvas.height=r.height*dpr;
    this.canvas.style.width=`${r.width}px`;this.canvas.style.height=`${r.height}px`;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.width=r.width;this.height=r.height;
    this.cell=Math.min(this.width,this.height)/CONFIG.GRID_SIZE;
    this.safeDraw();
  }

  safeDraw(){try{this.draw()}catch(e){this.diagnostics.error("world render failed",e)}}

  coords(e){
    const r=this.canvas.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,
      ox=(this.width-this.cell*CONFIG.GRID_SIZE)/2,oy=(this.height-this.cell*CONFIG.GRID_SIZE)/2;
    return{x:this.state.camera.x+Math.floor((px-ox)/this.cell),y:this.state.camera.y+Math.floor((py-oy)/this.cell)};
  }

  bindInput(){
    let p=null,t=null,sel=false,last=null;
    this.canvas.addEventListener("pointerdown",e=>{
      p={id:e.pointerId,x:e.clientX,y:e.clientY,camera:{...this.state.camera}};last=this.coords(e);
      this.canvas.setPointerCapture(e.pointerId);
      t=setTimeout(()=>{if(this.survey.surveyable(this.state,last.x,last.y)){sel=true;this.selection.clear();this.addSelection(last)}},360);
    });
    this.canvas.addEventListener("pointermove",e=>{
      if(!p||p.id!==e.pointerId)return;
      const dx=e.clientX-p.x,dy=e.clientY-p.y;
      if(sel){const cell=this.coords(e);this.selectLine(last,cell);last=cell;this.safeDraw();return;}
      if(Math.hypot(dx,dy)>7){clearTimeout(t);this.state.camera.x=p.camera.x-Math.round(dx/this.cell);this.state.camera.y=p.camera.y-Math.round(dy/this.cell);this.safeDraw();}
    });
    this.canvas.addEventListener("pointerup",e=>{
      if(!p||p.id!==e.pointerId)return;clearTimeout(t);
      if(sel){const a=[...this.selection.values()];this.selection.clear();sel=false;this.onMulti(a);}
      else if(Math.hypot(e.clientX-p.x,e.clientY-p.y)<=7){const c=this.coords(e);this.onTap(c.x,c.y);}
      p=null;this.safeDraw();
    });
    this.canvas.addEventListener("pointercancel",()=>{clearTimeout(t);p=null;sel=false;this.selection.clear();this.safeDraw()});
  }

  addSelection(c){if(this.survey.surveyable(this.state,c.x,c.y))this.selection.set(`${c.x},${c.y}`,c)}

  selectLine(a,b){
    let x0=a.x,y0=a.y,x1=b.x,y1=b.y,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;
    for(;;){this.addSelection({x:x0,y:y0});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
  }

  colors(type){return{food:["#15321f","#83e69a","#6bd986"],build:["#172a31","#a7d7e7","#8ec5d9"],fuel:["#352017","#ffb27e","#ff9f5f"],ore:["#291b35","#d3b4ff","#c7a0ff"]}[type]||["#252515","#ffc76b","#f0b65d"]}

  draw(){
    const c=this.ctx,size=this.cell*CONFIG.GRID_SIZE,ox=(this.width-size)/2,oy=(this.height-size)/2;
    c.clearRect(0,0,this.width,this.height);c.fillStyle="#000";c.fillRect(0,0,this.width,this.height);

    for(let gy=0;gy<CONFIG.GRID_SIZE;gy++)for(let gx=0;gx<CONFIG.GRID_SIZE;gx++){
      const x=this.state.camera.x+gx,y=this.state.camera.y+gy,tile=this.world.get(this.state,x,y),
        active=this.survey.isActive(this.state,x,y),queued=this.survey.isQueued(this.state,x,y),
        selected=this.selection.has(`${x},${y}`),px=ox+gx*this.cell,py=oy+gy*this.cell,col=this.colors(tile.type),
        techLocked=tile.revealed&&!tile.depleted&&!this.technology.canExploit(this.state,tile);

      c.fillStyle=tile.revealed?(tile.depleted?"#11161a":techLocked?"#0b0e10":col[0]):active?"#0b2c45":queued?"#091c2a":"#020304";
      c.fillRect(px+1,py+1,this.cell-2,this.cell-2);
      c.strokeStyle=selected?"#59d4ff":techLocked?"#293038":"#172028";c.lineWidth=selected?2:1;c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);
      c.textAlign="center";c.textBaseline="middle";

      if(x===0&&y===0){c.fillStyle="#eaf4f8";c.font=`${Math.max(12,this.cell*.23)}px system-ui`;c.fillText("SHIP",px+this.cell/2,py+this.cell/2);continue;}
      if(!tile.revealed){c.fillStyle=selected?"#70dbff":"#637681";c.font=`bold ${Math.max(14,this.cell*.29)}px system-ui`;c.fillText(selected?"✓":active?"SCAN":queued?"Q":"?",px+this.cell/2,py+this.cell*.46);continue;}

      c.save();
      if(techLocked)c.globalAlpha=.26;
      if(tile.depleted){c.fillStyle="#9aa7ad";c.font=`${Math.max(16,this.cell*.28)}px system-ui`;c.fillText("×",px+this.cell/2,py+this.cell*.35);}
      else this.icons.draw(c,tile,px+this.cell/2,py+this.cell*.30,this.cell*.36);
      c.fillStyle=col[1];c.font=`bold ${Math.max(8,this.cell*.13)}px system-ui`;c.fillText(`Q${Math.round(tile.quality)}`,px+this.cell/2,py+this.cell*.62);
      if(tile.developed&&!tile.depleted){
        const renewable=this.resources.isRenewable(tile),pct=renewable?1:clamp((tile.reserve||0)/Math.max(1,tile.initialReserve||1),0,1);
        c.fillStyle="#162027";c.fillRect(px+this.cell*.13,py+this.cell*.82,this.cell*.74,3);c.fillStyle=col[2];c.fillRect(px+this.cell*.13,py+this.cell*.82,this.cell*.74*pct,3);
        c.fillStyle="#d9e3e8";c.font=`${Math.max(7,this.cell*.1)}px system-ui`;c.fillText(`L${tile.level}`,px+this.cell*.78,py+this.cell*.72);
      }
      c.restore();

      if(techLocked){
        c.fillStyle="#9aa4aa";c.font=`bold ${Math.max(7,this.cell*.095)}px system-ui`;
        c.fillText(`LOCK • M${tile.requiredMiningLevel||1}`,px+this.cell/2,py+this.cell*.78);
      }
    }
    document.querySelector("#cameraText").textContent=`Sector ${this.state.camera.x},${this.state.camera.y}`;
  }
}
