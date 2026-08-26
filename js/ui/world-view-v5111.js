import { WorldView as V594WorldView } from "./world-view-v594.js?v=5.9.7&legacy=1";

/** v5.11.1 only renders the player ship on the colony where it is physically docked. */
export class WorldView extends V594WorldView{
  isShipTile(x,y){
    const landing=this.land?.isShipTile?this.land.isShipTile(x,y):x===0&&y===0;if(!landing)return false;
    const ship=this.state.company?.expansion?.ship;if(!ship)return super.isShipTile(x,y);
    return ship.status==="docked"&&ship.colonyId===this.state.colonyId;
  }
}
