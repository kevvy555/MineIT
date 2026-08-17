export class SiteService {
  constructor(contractService){ this.contracts = contractService; }
  distance(tile){ return Math.hypot(tile.x,tile.y); }

  developCost(state,tile){
    const a = this.contracts.archetype(state.contract);
    return Math.round((2600+Math.sqrt(tile.quality)*115)*(1+this.distance(tile)*.018)*a.cost);
  }

  upgradeCost(state,tile){
    return Math.round(this.developCost(state,tile)*Math.pow(1.82,Math.max(0,tile.level)));
  }

  develop(state,tile){
    const cost=this.developCost(state,tile);
    if(!tile.revealed||tile.developed||tile.depleted||state.company.cash<cost) return false;
    state.company.cash-=cost; tile.developed=true; tile.level=1; return true;
  }

  upgrade(state,tile){
    const cost=this.upgradeCost(state,tile);
    if(!tile.developed||tile.depleted||state.company.cash<cost) return false;
    state.company.cash-=cost; tile.level++; return true;
  }
}
