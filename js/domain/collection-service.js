export class CollectionService {
  constructor(resourceService){ this.resources=resourceService; }

  category(tile){
    if(tile.type==="food") return "Food";
    if(tile.type==="industry") return "Industrial Ore";
    return "Valuable";
  }

  activeSites(state){
    return Object.values(state.tiles).filter(tile=>tile.developed&&!tile.depleted);
  }

  snapshot(state,tile){
    const renewable=this.resources.isRenewable(tile);
    return {
      tile,
      name:tile.name,
      category:this.category(tile),
      rate:this.resources.collectionRate(state,tile),
      renewable,
      remaining:renewable?null:Math.max(0,tile.reserve||0),
      lifeYears:this.resources.estimatedLifeYears(state,tile)
    };
  }

  current(state){
    return this.activeSites(state)
      .map(tile=>this.snapshot(state,tile))
      .sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
  }

  collectDay(state,tile){
    const rate=this.resources.collectionRate(state,tile);
    if(this.resources.isRenewable(tile)){
      return {rate,collected:rate,renewable:true,exhausted:false};
    }

    const remaining=Math.max(0,tile.reserve||0);
    const collected=Math.min(rate,remaining);
    tile.reserve=Math.max(0,remaining-collected);
    const exhausted=tile.reserve<=0;
    if(exhausted){
      tile.depleted=true;
      tile.developed=false;
    }
    return {rate,collected,renewable:false,exhausted};
  }
}
