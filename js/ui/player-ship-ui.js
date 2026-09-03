import { UIController as BaseUIController } from "./expansion-ui.js";

const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));

/** Consolidates landed player-ship actions and fast colony navigation. */
export class UIController extends BaseUIController{
  playerShipHere(){
    if(this.expansion?.shipsAtColony)return this.expansion.shipsAtColony(this.state,this.state.colonyId).length>0;
    const ship=this.expansion?.ship?.(this.state);return !!ship&&ship.status==="docked"&&ship.colonyId===this.state.colonyId;
  }

  dockedShipsAt(colonyId=this.state.colonyId){
    return this.expansion?.shipsAtColony?.(this.state,colonyId)||[];
  }

  render(){
    super.render();this.renderColonyStrip();
  }

  menu(){
    super.menu();this.modal?.querySelector("[data-star-map]")?.remove();
  }

  selectMapTile(x,y){
    if(this.land?.isShipTile?.(x,y)&&this.playerShipHere()){
      const docked=this.dockedShipsAt();
      if(docked.length&&this.expansion?.selectShip){
        const activeId=this.expansion.ship(this.state)?.id;
        if(!docked.some(ship=>ship.id===activeId)){
          this.expansion.selectShip(this.state,docked[0].id);
          this.repo?.save?.(this.state);
        }
      }
      this.playerShipPanel();return;
    }
    super.selectMapTile(x,y);
  }

  contextParts(tile){
    if(tile&&this.land?.isShipTile?.(tile.x,tile.y)){
      if(this.playerShipHere()){
        const count=this.dockedShipsAt().length;
        return{title:"SPACEPORT • PLAYER SHIP LANDED",sub:count>1?`${count} player ships are docked. Tap for ship controls or open Spaceport for the full berth list.`:"The Basic Spaceport is active here. Tap the ship for ship controls, or open Spaceport for berths.",actions:this.action?.("SPACEPORT","spaceport")||"",requirement:""};
      }
      const active=this.expansion?.ship?.(this.state);
      const where=active?.status==="travelling"?"The active player ship is currently in transit.":active?.status==="arrived"?"The active player ship has arrived in another star system.":active?.status==="orbiting"?"The active player ship is holding in orbit.":"No player ship is docked at this colony.";
      return{title:"SPACEPORT • BERTH AVAILABLE",sub:`Basic Spaceport remains operational. ${where}`,actions:this.action?.("SPACEPORT","spaceport")||"",requirement:""};
    }
    return super.contextParts(tile);
  }

  runContextAction(action,kind=null){if(action==="spaceport"){this.spaceportPanel();return;}return super.runContextAction(action,kind);}

  renderColonyStrip(){
    const host=document.querySelector("#colonyNavStrip");if(!host)return;
    const entries=this.state.portfolio?.colonies||[];if(this.state.status==="site-selection"||!entries.length){host.classList.add("hidden");host.innerHTML="";return;}
    host.classList.remove("hidden");
    host.innerHTML=entries.map(entry=>{
      const active=entry.id===this.state.colonyId;
      const shipHere=this.dockedShipsAt(entry.id).length>0;
      const name=entry.data?.contract?.colonyName||entry.name||"Colony";
      return`<button class="colony-nav-button${active?" active":""}${shipHere?" ship-here":""}" data-colony-nav="${esc(entry.id)}" ${active?"aria-current=\"true\"":""}><strong>${esc(name)}</strong>${shipHere?"<small>SHIP LANDED</small>":""}</button>`;
    }).join("");
    host.querySelectorAll("[data-colony-nav]").forEach(button=>button.onclick=()=>{const id=button.dataset.colonyNav;if(id===this.state.colonyId)return;this.onSwitchColony?.(id);});
  }
}
