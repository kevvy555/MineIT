import { CONFIG } from "../core/config.js";

export class SimulationEngine {
  constructor(resourceService,technologyService){
    this.resources=resourceService;
    this.technology=technologyService;
  }

  recalculate(state){
    this.technology.recompute(state);
    const populationMultiplier=1+Math.log10(Math.max(1,state.pop)/100+1)*.055;
    state.metrics.pm=populationMultiplier;

    let food=0,industry=0,income=0;
    for(const tile of Object.values(state.tiles)){
      if(!tile.developed||tile.depleted) continue;
      const output=this.resources.siteOutput(state,tile);
      if(tile.type==="food") food+=output;
      else if(tile.type==="industry") industry+=output;
      income+=this.resources.annualCash(state,tile);
    }
    Object.assign(state.metrics,{food,industry,income});
  }

  tick(state){
    this.technology.recompute(state);
    const populationMultiplier=1+Math.log10(Math.max(1,state.pop)/100+1)*.055;
    state.metrics.pm=populationMultiplier;

    let food=0,industry=0,dailyRevenue=0;
    for(const tile of Object.values(state.tiles)){
      if(!tile.developed||tile.depleted) continue;

      const output=this.resources.siteOutput(state,tile);
      if(tile.type==="food") food+=output;
      else if(tile.type==="industry") industry+=output;

      const extraction=Math.max(.55,this.resources.baseOutput(tile.quality)*(1+(tile.level-1)*.22)*(tile.resourceMult||1)*.33);
      tile.reserve=Math.max(0,tile.reserve-extraction);
      if(tile.reserve<=0){ tile.depleted=true;tile.developed=false;continue; }

      dailyRevenue+=this.resources.annualCash(state,tile)/CONFIG.DAYS_PER_YEAR;
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
