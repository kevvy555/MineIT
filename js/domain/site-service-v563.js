import { SiteService as V562SiteService } from "./site-service-v562.js?v=5.6.2&legacy=1";

/**
 * v5.6.3 cash policy: extraction development is local colony work.
 * Sites still require Build, workforce, technology, Industry and viable land,
 * but no corporate cash is paid simply to construct or upgrade them locally.
 */
export class SiteService extends V562SiteService{
  developCashCost(){return 0;}
  upgradeCashCost(){return 0;}
  developCost(){return 0;}
  upgradeCost(){return 0;}
}
