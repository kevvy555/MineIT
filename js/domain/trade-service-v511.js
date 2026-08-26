import { TradeService as BaseTradeService } from "./trade-service.js?v=5.9.0&legacy=1";
import { ExpansionService } from "./expansion-service.js?v=5.11.0";

export class TradeService extends BaseTradeService{
  constructor(resourceService,inventoryService){super(resourceService,inventoryService);this.expansion=new ExpansionService(inventoryService,resourceService);}
  serviceAvailable(state){return this.expansion.corporateServiceAvailable(state);}
  shouldArrive(state){return this.serviceAvailable(state)&&super.shouldArrive(state);}
  arrive(state){return this.serviceAvailable(state)&&super.arrive(state);}
  daysUntilArrival(state){return this.serviceAvailable(state)?super.daysUntilArrival(state):Infinity;}
}
