import { SiteService as LegacySiteService } from "./site-service.js?v=5.5.5&legacy=1";
import { isAccidentShutdown } from "./extraction-overdrive.js?v=5.6.2";

export class SiteService extends LegacySiteService{
  upgradeRequirements(state,tile){
    if(isAccidentShutdown(tile))return{ok:false,cash:0,build:0,industryRequired:0,techRequired:0,workforce:0,freeWorkforce:this.colony?.freeWorkforce(state)??0,reason:`Facility is closed after an accident for ${Math.max(1,Math.ceil(Number(tile.accidentShutdownDays)||0))} more day${Math.ceil(Number(tile.accidentShutdownDays)||0)===1?"":"s"}.`};
    return super.upgradeRequirements(state,tile);
  }
}
