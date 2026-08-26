import { PortfolioService as BasePortfolioService } from "./portfolio-service.js?v=5.5.5&legacy=1";
import { createColonyState, cloneColonyState } from "./game-state.js?v=5.5.5&legacy=1";
import { ExpansionService } from "./expansion-service.js?v=5.11.0";

const clone=value=>JSON.parse(JSON.stringify(value));
export class PortfolioService extends BasePortfolioService{
  constructor(){super();this.expansion=new ExpansionService();}
  addColony(state,contract){
    if(!contract?.expeditionArrival)return super.addColony(state,contract);
    this.captureActive(state,true);this.expansion.ensure(state);
    const ship=this.expansion.ship(state);if(ship.status!=="arrived"||ship.systemId!==contract.systemId)throw new Error("Expedition colony can only be founded after the player ship arrives in the selected system.");
    const manifest=this.expansion.expeditionManifest(state);if(manifest.passengers<=0)throw new Error("At least one colonist must disembark to found a colony.");
    const number=Math.max(1,Number(state.company.nextColonyNumber)||state.portfolio.colonies.length+1);state.company.nextColonyNumber=number+1;state.company.gameOver=false;contract.colonyName=`Colony ${String(number).padStart(2,"0")}`;contract.localRevenue=0;contract.localCosts=0;contract.advance=0;
    const local=createColonyState(contract,this.absoluteDay(state));local.pop=manifest.passengers;local.inventory=clone(manifest.cargo);local.status="playing";const entry={id:local.colonyId,name:contract.colonyName,createdAt:Date.now(),data:cloneColonyState(local)};state.portfolio.colonies.push(entry);this.expansion.consumeManifestForNewColony(state,local.colonyId);this.apply(state,entry);return entry;
  }
}
