import { UIController as LegacyUIController } from "./ui-controller.js?v=5.5.5&legacy=1";

/**
 * v5.6 presentation controller.
 * Owns application-level footer input. Feature UIs may render state, but they
 * do not own or replace shared navigation/time-control events.
 */
export class UIController extends LegacyUIController{
  bind(){
    document.querySelector("#companyBtn").onclick=()=>this.company();
    document.querySelector("#collectionBtn").onclick=()=>this.currentCollection();
    document.querySelector("#colonyBtn").onclick=()=>this.landColonyPanel();
    document.querySelector("#coloniesBtn").onclick=()=>this.coloniesPanel();
    document.querySelector("#techBtn").onclick=()=>this.tech();
    document.querySelector("#goalsBtn").onclick=()=>this.goals();
    document.querySelector("#menuBtn").onclick=()=>this.menu();
    this.bindSpeedInputs();
    this.errorBadge.onclick=()=>this.diagnosticsPanel();
    this.diagnostics.subscribe(()=>this.updateErrorBadge());
  }

  bindSpeedInputs(){
    const controls=document.querySelector(".controls");
    if(!controls||this.speedInputBound)return;
    this.speedInputBound=true;
    controls.addEventListener("click",event=>{
      const button=event.target.closest?.("[data-speed]");
      if(!button||!controls.contains(button))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.setSpeed(+button.dataset.speed);
    },true);
  }

  setSpeed(next){
    if(this.state.status==="site-selection"){
      this.toast("Choose a landing site before starting time.");
      return false;
    }
    if(next>0&&(this.state.company?.pendingEvents?.length||this.state.trade?.active)){
      this.toast("Resolve the pending corporate ship before resuming time.");
      return false;
    }
    if(this.state.company?.gameOver){
      this.toast("All colonies have been lost.");
      return false;
    }
    this.state.speed=next;
    this.syncSpeed();
    return true;
  }
}
