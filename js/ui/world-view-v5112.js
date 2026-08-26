import { WorldView as V5111WorldView } from "./world-view-v5111.js?v=5.11.1&legacy=1";

/** v5.11.2 intercepts the landed ship tile before any normal map inspection path. */
export class WorldView extends V5111WorldView{
  constructor(options){super(options);this._shipPointer=null;this.bindPlayerShipCapture();}

  bindPlayerShipCapture(){
    const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
    this.canvas.addEventListener("pointerdown",e=>{
      if(this.state.status==="site-selection")return;const cell=this.coords(e);if(!this.isShipTile(cell.x,cell.y))return;
      this._shipPointer={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};this.canvas.setPointerCapture?.(e.pointerId);stop(e);
    },true);
    this.canvas.addEventListener("pointermove",e=>{
      const p=this._shipPointer;if(!p||p.id!==e.pointerId)return;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)p.moved=true;stop(e);
    },true);
    this.canvas.addEventListener("pointerup",e=>{
      const p=this._shipPointer;if(!p||p.id!==e.pointerId)return;this._shipPointer=null;stop(e);if(!p.moved)document.dispatchEvent(new CustomEvent("mineit:player-ship-clicked"));
    },true);
    this.canvas.addEventListener("pointercancel",e=>{const p=this._shipPointer;if(!p||p.id!==e.pointerId)return;this._shipPointer=null;stop(e);},true);
  }
}
