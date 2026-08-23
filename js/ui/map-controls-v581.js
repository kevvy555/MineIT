import { MapControls as V580MapControls } from "./map-controls-v580.js?v=5.8.0&legacy=1";

/** v5.8.1 refinement: keep toolbar focus state synchronized with HUD/context shortcuts. */
export class MapControls extends V580MapControls{
  constructor(options){
    super(options);
    this.externalFocusHandler=event=>{
      const mode=event.detail?.mode||"all";
      this.focusMode=mode;
      if(this.state.colony?.land)this.state.colony.land.focusMode=mode;
      this.sync();
    };
    document.addEventListener("mineit:map-focus",this.externalFocusHandler);
  }
}
