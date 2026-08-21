import { WorldView as CanvasWorldView } from "./world-view.js?v=5.5.5&legacy=1";
import { MapControls } from "./map-controls.js?v=5.6.0";
import { CONFIG } from "../core/config.js?v=5.5.5";

/**
 * Presentation-layer WorldView for v5.6.
 *
 * CanvasWorldView remains responsible for rendering, hit testing and pointer input.
 * MapControls owns toolbar/filter DOM and state. CSS owns physical layout; resize()
 * only synchronises the canvas drawing buffer with the already-laid-out viewport.
 */
export class WorldView extends CanvasWorldView{
  bindViewToggle(){
    const host=document.querySelector("#mapViewHost");
    if(!host)throw new Error("Map toolbar host is missing");
    this.controls=new MapControls({
      host,
      state:this.state,
      land:this.land,
      resources:this.resources,
      filters:this.filters,
      typeFilters:this.typeFilters,
      sizeFilters:this.sizeFilters,
      qualityFilters:this.qualityFilters,
      onViewChange:view=>{
        if(!this.state.colony?.land)return;
        this.state.colony.land.view=view;
        this.safeDraw();
      },
      onFilterChange:()=>this.safeDraw()
    });
  }

  // CanvasWorldView calls this during construction. MapControls builds all filter DOM.
  bindFilters(){}

  syncView(){this.controls?.sync();}
  syncFilters(){this.controls?.sync();}
  filterDisabledCount(){return this.controls?.disabledCount()??0;}

  resize(){
    const rect=this.shell.getBoundingClientRect();
    const width=Math.max(1,rect.width);
    const height=Math.max(1,rect.height);
    const dpr=Math.min(2,Math.max(1,devicePixelRatio||1));
    this.canvas.width=Math.max(1,Math.round(width*dpr));
    this.canvas.height=Math.max(1,Math.round(height*dpr));
    this.canvas.style.removeProperty("width");
    this.canvas.style.removeProperty("height");
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.width=width;
    this.height=height;
    this.cell=Math.max(1,Math.min(width,height)/CONFIG.GRID_SIZE);
    this.safeDraw();
  }
}
