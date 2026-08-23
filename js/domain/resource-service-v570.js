import { ResourceService as LegacyResourceService } from "./resource-service-v562.js?v=5.6.2&legacy=1";
export { QUALITY_VALUE_BANDS,DEFAULT_QUALITY_BAND } from "./resource-service.js?v=5.5.5&legacy=1";

export class ResourceService extends LegacyResourceService{
  unthrottledCollectionRate(state,tile){const base=super.unthrottledCollectionRate(state,tile);return tile?.type==="food"?base*(state?.metrics?.foodProductionMultiplier||1):base;}
}
