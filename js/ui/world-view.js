import { CONFIG } from "../core/config.js";
import { clamp } from "../core/utils.js";

export class WorldView {
  constructor({state,world,survey,resources,icons,diagnostics,onTap,onMulti}){
    this.state=state;this.world=world;this.survey=survey;this.resources=resources;this.icons=icons;
    this.diagnostics=diagnostics;this.onTap=onTap;this.onMulti=onMulti;
    this.canvas=document.querySelector("#world");
    this.shell=document.querySelector("#worldShell");
    this.ctx=this.canvas.getContext("2d");
    this.selection=new Map();
    this.bindInput();
    new ResizeObserver(()=>this.resize()).observe(this.shell);
    this.resize();
  }

  resize(){
    const rect=this.shell.getBoundingClientRect();
    const dpr=Math.max(1,devicePixelRatio||1);
    this.canvas.width=rect.width*dpr;this.canvas.height=rect.height*dpr;
    this.canvas.style.width=`${rect.width}px`;this.canvas.style.height=`${rect.height}px`;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.width=rect.width;this.height=rect.height;
    this.cell=Math.min(this.width,this.height)/CONFIG.GRID_SIZE;
    this.safeDraw();
  }

  safeDraw(){
    try{ this.draw(); }
    catch(error){ this.diagnostics.error("world render failed",error); }
  }

  coords(event){
    const rect=this.canvas.getBoundingClientRect();
    const px=event.clientX-rect.left,py=event.clientY-rect.top;
    const ox=(this.width-this.cell*CONFIG.GRID_SIZE)/2;
    const oy=(this.height-this.cell*CONFIG.GRID_SIZE)/2;
    return {
      x:this.state.camera.x+Math.floor((px-ox)/this.cell),
      y:this.state.camera.y+Math.floor((py-oy)/this.cell)
    };
  }

  bindInput(){
    let pointer=null,holdTimer=null,selecting=false,lastCell=null;

    this.canvas.addEventListener("pointerdown",event=>{
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,camera:{...this.state.camera}};
      lastCell=this.coords(event);
      this.canvas.setPointerCapture(event.pointerId);
      holdTimer=setTimeout(()=>{
        if(this.survey.surveyable(this.state,lastCell.x,lastCell.y)){
          selecting=true;this.selection.clear();this.addSelection(lastCell);
        }
      },360);
    });

    this.canvas.addEventListener("pointermove",event=>{
      if(!pointer||pointer.id!==event.pointerId) return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(selecting){
        const cell=this.coords(event);
        this.selectLine(lastCell,cell);lastCell=cell;this.safeDraw();return;
      }
      if(Math.hypot(dx,dy)>7){
        clearTimeout(holdTimer);
        this.state.camera.x=pointer.camera.x-Math.round(dx/this.cell);
        this.state.camera.y=pointer.camera.y-Math.round(dy/this.cell);
        this.safeDraw();
      }
    });

    this.canvas.addEventListener("pointerup",event=>{
      if(!pointer||pointer.id!==event.pointerId) return;
      clearTimeout(holdTimer);
      if(selecting){
        const selected=[...this.selection.values()];
        this.selection.clear();selecting=false;
        this.onMulti(selected);
      }else{
        const moved=Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y);
        if(moved<=7){ const cell=this.coords(event);this.onTap(cell.x,cell.y); }
      }
      pointer=null;this.safeDraw();
    });

    this.canvas.addEventListener("pointercancel",()=>{
      clearTimeout(holdTimer);pointer=null;selecting=false;this.selection.clear();this.safeDraw();
    });
  }

  addSelection(cell){
    if(this.survey.surveyable(this.state,cell.x,cell.y)) this.selection.set(`${cell.x},${cell.y}`,cell);
  }

  selectLine(a,b){
    let x0=a.x,y0=a.y,x1=b.x,y1=b.y;
    const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
    let err=dx+dy;
    for(;;){
      this.addSelection({x:x0,y:y0});
      if(x0===x1&&y0===y1) break;
      const e2=2*err;
      if(e2>=dy){err+=dy;x0+=sx}
      if(e2<=dx){err+=dx;y0+=sy}
    }
  }

  draw(){
    const c=this.ctx,size=this.cell*CONFIG.GRID_SIZE;
    const ox=(this.width-size)/2,oy=(this.height-size)/2;
    c.clearRect(0,0,this.width,this.height);
    c.fillStyle="#000";c.fillRect(0,0,this.width,this.height);

    for(let gy=0;gy<CONFIG.GRID_SIZE;gy++){
      for(let gx=0;gx<CONFIG.GRID_SIZE;gx++){
        const x=this.state.camera.x+gx,y=this.state.camera.y+gy;
        const tile=this.world.get(this.state,x,y);
        const active=this.survey.isActive(this.state,x,y),queued=this.survey.isQueued(this.state,x,y);
        const selected=this.selection.has(`${x},${y}`);
        const px=ox+gx*this.cell,py=oy+gy*this.cell;

        c.fillStyle=tile.revealed
          ? tile.depleted?"#11161a":tile.type==="food"?"#15321f":tile.type==="valuable"?"#281733":"#352515"
          : active?"#0b2c45":queued?"#091c2a":"#020304";
        c.fillRect(px+1,py+1,this.cell-2,this.cell-2);
        c.strokeStyle=selected?"#59d4ff":"#172028";
        c.lineWidth=selected?2:1;
        c.strokeRect(px+.5,py+.5,this.cell-1,this.cell-1);

        c.textAlign="center";c.textBaseline="middle";

        if(x===0&&y===0){
          c.fillStyle="#eaf4f8";c.font=`${Math.max(12,this.cell*.23)}px system-ui`;
          c.fillText("SHIP",px+this.cell/2,py+this.cell/2);continue;
        }

        if(!tile.revealed){
          c.fillStyle=selected?"#70dbff":"#637681";c.font=`bold ${Math.max(14,this.cell*.29)}px system-ui`;
          c.fillText(selected?"✓":active?"SCAN":queued?"Q":"?",px+this.cell/2,py+this.cell*.46);
          continue;
        }

        if(tile.depleted){
          c.fillStyle="#9aa7ad";c.font=`${Math.max(16,this.cell*.28)}px system-ui`;
          c.fillText("×",px+this.cell/2,py+this.cell*.35);
        }else{
          this.icons.draw(c,tile,px+this.cell/2,py+this.cell*.30,this.cell*.36);
        }

        c.fillStyle=tile.type==="food"?"#83e69a":tile.type==="valuable"?"#d8a8ff":"#ffc76b";
        c.font=`bold ${Math.max(8,this.cell*.13)}px system-ui`;
        c.fillText(`Q${Math.round(tile.quality)}`,px+this.cell/2,py+this.cell*.62);

        if(tile.developed&&!tile.depleted){
          const pct=clamp(tile.reserve/tile.initialReserve,0,1);
          c.fillStyle="#162027";c.fillRect(px+this.cell*.13,py+this.cell*.82,this.cell*.74,3);
          c.fillStyle=tile.type==="food"?"#6bd986":tile.type==="valuable"?"#d59cff":"#f0b65d";
          c.fillRect(px+this.cell*.13,py+this.cell*.82,this.cell*.74*pct,3);
          c.fillStyle="#d9e3e8";c.font=`${Math.max(7,this.cell*.1)}px system-ui`;
          c.fillText(`L${tile.level}`,px+this.cell*.78,py+this.cell*.72);
        }
      }
    }

    document.querySelector("#cameraText").textContent=`Sector ${this.state.camera.x},${this.state.camera.y}`;
  }
}
