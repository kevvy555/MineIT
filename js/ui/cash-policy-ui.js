import { UIController as BaseUIController } from "./ui-controller.js";

const stripLocalCash=root=>{
  if(!root)return;
  root.querySelectorAll("button,.effect,.tiny").forEach(node=>{
    if(node.innerHTML.includes("£0"))node.innerHTML=node.innerHTML.replace(/£0(?:\.00)?\s*\+\s*/g,"");
  });
};
const removeMetric=(root,label)=>{
  if(!root)return;
  for(const small of root.querySelectorAll(".metric small"))if(small.textContent.trim()===label){small.closest(".metric")?.remove();break;}
};

/** Presentation policy for the external-cash economy. */
export class UIController extends BaseUIController{
  tile(tile){super.tile(tile);stripLocalCash(this.tilePanel);}
  buildChoice(tile){super.buildChoice(tile);stripLocalCash(this.modal);}
  landTile(tile){super.landTile(tile);stripLocalCash(this.modal);stripLocalCash(this.tilePanel);}
  colonyPanel(){super.colonyPanel();removeMetric(this.modal,"Operating cash cost");stripLocalCash(this.modal);}
  company(){super.company();removeMetric(this.modal,"Portfolio operating cost");}
  completionActions(title,score=null){
    super.completionActions(title,score);
    for(const node of this.modal.querySelectorAll(".effect.warn"))if(node.textContent.includes("Holdover operation costs"))node.textContent="Holdover keeps the colony operating while you decide whether to renew or return it; there is no generic daily corporate cash charge.";
  }
  deadline(kind=null){
    super.deadline(kind);
    for(const node of this.modal.querySelectorAll(".effect.warn"))if(node.textContent.includes("operating cash costs continue"))node.textContent="Extraction stops. Food, Fuel and Ore support requirements continue until the population is relocated.";
  }
}
