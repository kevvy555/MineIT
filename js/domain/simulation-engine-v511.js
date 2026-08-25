import { SimulationEngine as BaseSimulationEngine } from "./simulation-engine-v570.js?v=5.7.0&legacy=1";
import { ExpansionService } from "./expansion-service.js?v=5.11.0";

export class SimulationEngine extends BaseSimulationEngine{
  constructor(resourceService,technologyService,collectionService,tradeService,inventoryService,colonyService){super(resourceService,technologyService,collectionService,tradeService,inventoryService,colonyService);this.expansion=new ExpansionService(inventoryService,resourceService);}
  tick(state){const result=super.tick(state);this.expansion.processDay(state);if(result?.colonyDied)this.expansion.onColonyDied(state);return result;}
}
