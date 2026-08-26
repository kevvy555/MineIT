import { UIController as V511UIController } from "./ui-controller-v511.js?v=5.11.0&legacy=1";

const esc=value=>String(value??"").replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));

/** v5.11.1 consolidates player-ship actions on the landed ship and adds fast colony navigation. */
export class UIController extends V511UIController{
  playerShipHere(){
    const ship=this.expansion?.ship?.(this.state);return !!ship&&ship.status==="docked"&&ship.colonyId===this.state.colonyId;
  }

  render(){
    super.render();this.renderColonyStrip();
  }

  menu(){
    super.menu();this.modal?.querySelector("[data-star-map]")?.remove();
  }

  selectMapTile(x,y){
    super.selectMapTile(x,y);
    if(this.land?.isShipTile?.(x,y)&&this.playerShipHere())queueMicrotask(()=>this.playerShipPanel());
  }

  contextParts(tile){
    if(tile&&this.land?.isShipTile?.(tile.x,tile.y)){
      if(this.playerShipHere())return{title:"LANDED PLAYER SHIP",sub:"Tap the ship to open technology, navigation, cargo and colony controls.",actions:"",requirement:""};
      const ship=this.expansion?.ship?.(this.state),where=ship?.status==="travelling"?"The player ship is currently in transit.":ship?.status==="arrived"?"The player ship has arrived in another star system.":"The player ship is currently docked at another colony.";
      return{title:"VACANT LANDING PAD",sub:where,actions:"",requirement:""};
    }
    return super.contextParts(tile);
  }

  playerShipPanel(){
    if(!this.playerShipHere()){this.toast("The player ship is not landed at this colony.");return;}
    const actions=[
      ["TECHNOLOGY","Research and licences","tech"],
      ["STAR MAP","Systems, probes and routes","star-map"],
      ["COLONIES","All colony operations","colonies"],
      ["CARGO BAY","Load ship, fuel and colonists","cargo"],
      ["COLONY SUMMARY","Current colony status","colony-summary"],
      ["CORPORATION","Corporate overview","corporation"]
    ];
    this.open("Player Colony Ship",`<div class="ship-action-shell">${this.shipStatusMarkup?.()||""}<div class="ship-action-grid">${actions.map(([title,sub,action])=>`<button class="ship-action-tile" data-player-ship-action="${action}"><strong>${title}</strong><small>${sub}</small></button>`).join("")}</div></div>`);
    this.modal.classList.add("player-ship-menu-modal");
    this.modal.querySelectorAll("[data-player-ship-action]").forEach(button=>button.onclick=()=>{
      const action=button.dataset.playerShipAction;
      if(action==="tech")this.tech();
      else if(action==="star-map")this.starMap();
      else if(action==="colonies")this.coloniesPanel();
      else if(action==="cargo")this.shipPrep();
      else if(action==="colony-summary")this.landColonyPanel();
      else if(action==="corporation")this.company();
    });
  }

  renderColonyStrip(){
    const host=document.querySelector("#colonyNavStrip");if(!host)return;
    const entries=this.state.portfolio?.colonies||[];if(this.state.status==="site-selection"||!entries.length){host.classList.add("hidden");host.innerHTML="";return;}
    host.classList.remove("hidden");const ship=this.expansion?.ship?.(this.state),shipColony=ship?.status==="docked"?ship.colonyId:null;
    host.innerHTML=entries.map(entry=>{const active=entry.id===this.state.colonyId,shipHere=entry.id===shipColony,name=entry.data?.contract?.colonyName||entry.name||"Colony";return`<button class="colony-nav-button${active?" active":""}${shipHere?" ship-here":""}" data-colony-nav="${esc(entry.id)}" ${active?"aria-current=\"true\"":""}><strong>${esc(name)}</strong>${shipHere?"<small>SHIP LANDED</small>":""}</button>`;}).join("");
    host.querySelectorAll("[data-colony-nav]").forEach(button=>button.onclick=()=>{const id=button.dataset.colonyNav;if(id===this.state.colonyId)return;this.onSwitchColony?.(id);});
  }
}
