import { ResourceService as LegacyResourceService } from "./resource-service.js?v=5.5.5&legacy=1";
import { outputMultiplier } from "./extraction-overdrive.js?v=5.6.2";

export class ResourceService extends LegacyResourceService{
  sitePotentialRate(tile){
    const base=super.sitePotentialRate(tile);
    return this.isRenewable(tile)?base:base*outputMultiplier(tile);
  }
}
