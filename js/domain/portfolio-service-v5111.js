import { PortfolioService as V511PortfolioService } from "./portfolio-service-v511.js?v=5.11.0&legacy=1";

const GREEK=["Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta","Iota","Kappa","Lambda","Mu","Nu","Xi","Omicron","Pi","Rho","Sigma","Tau","Upsilon","Phi","Chi","Psi","Omega"];

/** v5.11.1 names expedition colonies after their planet plus a per-planet Greek sequence. */
export class PortfolioService extends V511PortfolioService{
  addColony(state,contract){
    const entry=super.addColony(state,contract);if(!contract?.expeditionArrival)return entry;
    const expansion=this.expansion.ensure(state),system=this.expansion.system(expansion,contract.systemId),planet=system?.planets?.find(p=>p.id===contract.planetId),siblings=(state.portfolio?.colonies||[]).filter(e=>e.id!==entry.id&&e.data?.contract?.systemId===contract.systemId&&e.data?.contract?.planetId===contract.planetId).length,suffix=GREEK[siblings]||`Site ${siblings+1}`,name=`${planet?.name||"Frontier"} ${suffix}`;
    contract.colonyName=name;entry.name=name;if(entry.data?.contract)entry.data.contract.colonyName=name;if(state.contract)state.contract.colonyName=name;this.captureActive(state,true);return entry;
  }
}
