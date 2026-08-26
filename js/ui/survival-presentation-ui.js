import { UIController as V563UIController } from "./cash-policy-ui.js";
import { SurvivalUIMixin } from "./survival-ui.js";

/** v5.6.4 presentation/manual adapter. No simulation rules are changed here. */
export class UIController extends V563UIController{
  menu(){
    super.menu();
    const help=this.modal.querySelector("[data-help]");
    if(help)help.onclick=()=>this.help();
  }

  help(){return SurvivalUIMixin.prototype.help.call(this);}
}
