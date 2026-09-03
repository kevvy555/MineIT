import { UIController as ShipPreparationUIController } from "./ship-preparation-ui.js";
import { formatNumber } from "../core/utils.js";

/** Canonical one-time ship-founded colony handover presentation. */
export class UIController extends ShipPreparationUIController {
  constructor(options){
    super(options);
    this.establishmentRevision=0;
  }

  dispose(){
    this.establishmentRevision++;
    super.dispose?.();
  }

  setSpeed(next){
    const assessment=this.expansion.establishmentAssessment(this.state);
    if(next>0&&assessment.required&&!assessment.acknowledged){
      this.state.speed=0;
      this.syncSpeed();
      this.colonyEstablishment();
      return false;
    }
    return super.setSpeed(next);
  }

  render(){
    super.render();
    const root=this.modal?.querySelector("[data-establishment]");
    if(root)this.populateEstablishment(root,this.expansion.establishmentAssessment(this.state));
  }

  establishmentResourceText(split){
    return `S ${formatNumber(split?.ship||0)} · C ${formatNumber(split?.colony||0)}`;
  }

  populateEstablishment(root,assessment){
    const setText=(selector,value)=>{const node=root.querySelector(selector);if(node)node.textContent=String(value??"");};
    setText("[data-establishment-colony]",this.state.contract?.colonyName||"Colony");
    setText("[data-establishment-phase]",assessment.phase);
    for(const type of["food","build","fuel","ore"])setText(`[data-establishment-${type}]`,this.establishmentResourceText(assessment.resourceSplit[type]));
    setText("[data-establishment-ship-residents]",formatNumber(assessment.shipResidents));
    setText("[data-establishment-colony-residents]",formatNumber(assessment.planetaryResidents));
    setText("[data-establishment-ship-food]",assessment.shipFood?`${formatNumber(assessment.shipFood.available)} · ${Math.max(0,Math.floor(assessment.shipFood.daysRemaining))}d`:"NO OCCUPIED SHIP");
    for(const [key,status] of Object.entries(assessment.support)){
      const row=root.querySelector(`[data-establishment-step="${key}"]`);
      if(!row)continue;
      row.classList.toggle("ready",status==="READY"||status==="COLONY");
      row.classList.toggle("hybrid",status==="HYBRID");
      const badge=row.querySelector("b");if(badge)badge.textContent=status;
    }
  }

  async colonyEstablishment(){
    const assessment=this.expansion.establishmentAssessment(this.state);
    if(!assessment.required){this.toast("Founding handover is complete.");return false;}
    const revision=++this.establishmentRevision,colonyId=this.state.colonyId,modalMarkup=this.modal?.innerHTML,source=await this.loadPresentationView("./views/colony-establishment.html","colony establishment");
    if(!source||revision!==this.establishmentRevision||colonyId!==this.state.colonyId||!this.modal?.classList.contains("hidden")||this.modal.innerHTML!==modalMarkup)return false;
    this.open("Establish Colony Operations",source);
    this.modal.classList.add("establishment-modal","full-screen-panel");
    const root=this.modal.querySelector("[data-establishment]");
    if(!root||revision!==this.establishmentRevision)return false;
    this.populateEstablishment(root,this.expansion.establishmentAssessment(this.state));
    root.querySelector("[data-establishment-transfer]")?.addEventListener("click",()=>this.shipPrep());
    root.querySelector("[data-establishment-begin]")?.addEventListener("click",()=>{
      const result=this.expansion.acknowledgeEstablishment(this.state);
      if(!result.ok){this.toast(result.reason);return;}
      this.state.speed=1;
      this.syncSpeed();
      this.onCapturePortfolio?.();
      this.repo.save(this.state);
      this.modal.classList.add("hidden");
      document.querySelector('[data-speed="1"]')?.focus();
      this.render();
      this.toast("Colony operations started at 1×. Follow the establishment checklist as systems move ashore.");
    });
    return true;
  }
}
