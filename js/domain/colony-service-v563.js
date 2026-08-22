import { ColonyService as V562ColonyService } from "./colony-service-v562.js?v=5.6.2&legacy=1";

/**
 * v5.6.3 cash policy: locally supplied labour and materials do not consume
 * corporate cash. External services (technology, imports, transport and
 * contract fees) remain cash-funded in their owning services.
 */
export class ColonyService extends V562ColonyService{
  housingCashCost(){return 0;}
  industryCashCost(){return 0;}
  operatingCost(){return 0;}
}
