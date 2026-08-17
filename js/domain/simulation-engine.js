import { CONFIG } from "../core/config.js";

export class SimulationEngine {
  constructor(resourceService,technologyService,collectionService){
    this.resources=resourceService;
    this.technology=technologyService;
    this.collection=collectionService;
  }

  recalculate(state){
    this.technology.recompute(state);
    const populationMultiplier=1+Math.log10(Math.max(1,state.pop)/100+1)*.055;
    state.metrics.pm=populationMultiplier;

    let food=0,industry=0,income=0;
    for(const tile of this.collection.activeSites(state)){
      const output=this.resources.collectionRate(state,tile);
      if(tile.type==="food") food+=output;
      else if(tile.type==="industry") industry+=output;
      income+=this.resources.annualCashForRate(tile,output);
    }
    Object.assign(state.metrics,{food,industry,income});
  }

  tick(state){
    this.technology.recompute(state);
    const populationMultiplier=1+Math.log10(Math.max(1,state.pop)/100+1)*.055;
    state.metrics.pm=populationMultiplier;

    let food=0,industry=0,dailyRevenue=0;
    const active=[...this.collection.activeSites(state)];
    for(const tile of active){
      const result=this.collection.collectDay(state,tile);
      const collected=result.collected;
      if(tile.type==="food") food+=collected;
      else if(tile.type==="industry") industry+=collected;
      dailyRevenue+=this.resources.annualCashForRate(tile,collected)/CONFIG.DAYS_PER_YEAR;
    }

    Object.assign(state.metrics,{food,industry,income:dailyRevenue*CONFIG.DAYS_PER_YEAR});
    state.company.cash+=dailyRevenue;
    state.company.earn+=dailyRevenue;

    const cap=Math.max(120,food*2.05);
    const target=Math.min(cap,Math.max(120,100+food*1.8));
    const rate=target>state.pop?.0018:.0035;
    state.pop=Math.max(60,state.pop+(target-state.pop)*rate);

    state.day++;
    if(state.day>CONFIG.DAYS_PER_YEAR){ state.day=1;state.year++; }
  }
}
