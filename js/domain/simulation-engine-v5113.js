import { SimulationEngine as V511SimulationEngine } from "./simulation-engine-v511.js?v=5.11.0&legacy=1";

/** v5.11.3 refreshes workforce allocation in the same tick that a site is exhausted. */
export class SimulationEngine extends V511SimulationEngine{
  tick(state){
    const result=super.tick(state);
    const siteEnded=(result?.depletedSites?.length||0)>0||(result?.renewableEvents||[]).some(item=>item?.tile?.depleted||item?.tile?.renewableWiped);
    if(siteEnded){
      const active=this.collection.activeSites(state);
      this.updateNetworks(state,active);
    }
    return result;
  }
}
