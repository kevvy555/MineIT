export class SimulationEngine {
  constructor(resourceService,technologyService,collectionService,tradeService){
    this.resources=resourceService;
    this.technology=technologyService;
    this.collection=collectionService;
    this.trade=tradeService;
  }

  recalculate(state){
    this.technology.recompute(state);
    const populationMultiplier=1+Math.log10(Math.max(1,state.pop)/100+1)*.055;
    state.metrics.pm=populationMultiplier;
    let food=0,industry=0;
    for(const tile of this.collection.activeSites(state)){
      const output=this.resources.collectionRate(state,tile);
      if(tile.type==="food") food+=output;
      else if(tile.type==="industry") industry+=output;
    }
    Object.assign(state.metrics,{food,industry,income:0,stockValue:this.trade.stockValue(state)});
  }

  tick(state){
    this.technology.recompute(state);
    const populationMultiplier=1+Math.log10(Math.max(1,state.pop)/100+1)*.055;
    state.metrics.pm=populationMultiplier;
    let food=0,industry=0;
    const active=[...this.collection.activeSites(state)];
    for(const tile of active){
      const result=this.collection.collectDay(state,tile),collected=result.collected;
      this.trade.store(state,tile,collected);
      if(tile.type==="food") food+=collected;
      else if(tile.type==="industry") industry+=collected;
    }
    Object.assign(state.metrics,{food,industry,income:0,stockValue:this.trade.stockValue(state)});
    const cap=Math.max(120,food*2.05),target=Math.min(cap,Math.max(120,100+food*1.8)),rate=target>state.pop?.0018:.0035;
    state.pop=Math.max(60,state.pop+(target-state.pop)*rate);
    state.day++;
    if(state.day>360){ state.day=1;state.year++; }
  }
}
