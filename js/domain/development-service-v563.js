import { DevelopmentService as LegacyDevelopmentService } from "./development-service.js?v=5.5.5&legacy=1";

/**
 * Housing and Industry are built by the colony from local materials and labour.
 * Preserve all terrain/build-resource/technology constraints, but remove the
 * abstract corporate cash charge from placement and upgrades.
 */
export class DevelopmentService extends LegacyDevelopmentService{
  cost(state,tile,kind,nextLevel=1){
    const cost=super.cost(state,tile,kind,nextLevel);
    return {...cost,cash:Number.isFinite(cost.cash)?0:cost.cash};
  }
}
