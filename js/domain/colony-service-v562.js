import { ColonyService as LegacyColonyService } from "./colony-service.js?v=5.5.5&legacy=1";
import { supportsOverdrive,workforceMultiplier,isAccidentShutdown } from "./extraction-overdrive.js?v=5.6.2";

export class ColonyService extends LegacyColonyService{
  siteWorkforce(state,tile,levelOverride=null,modeOverride=null){
    const base=super.siteWorkforce(state,tile,levelOverride);
    return supportsOverdrive(tile)?Math.max(1,Math.ceil(base*workforceMultiplier(tile,modeOverride))):base;
  }
  workforceSites(state){return super.workforceSites(state).filter(tile=>!isAccidentShutdown(tile));}
}
