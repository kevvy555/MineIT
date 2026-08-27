import { UIController as BaseUIController } from "./trade-reserve-ui.js";

/**
 * Legacy bridge retained only to clear obsolete modal styling.
 * Developed-building presentation is owned by adaptive-building-ui.js.
 */
export class UIController extends BaseUIController{
  open(title,body){
    this.modal?.classList.remove("building-detail-modal");
    super.open(title,body);
  }
}
