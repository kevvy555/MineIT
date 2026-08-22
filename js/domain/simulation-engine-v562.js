import { SimulationEngine as LegacySimulationEngine } from "./simulation-engine.js?v=5.5.5&legacy=1";

export class SimulationEngine extends LegacySimulationEngine{
  tick(state){
    const shutdowns=this.collection.shutdownSites(state),beforePop=Number(state.pop)||0,beforeAccidents=new Map(Object.values(state.tiles||{}).map(tile=>[`${tile.x},${tile.y}`,tile.lastAccident]));
    const result=super.tick(state);
    this.collection.advanceShutdowns(shutdowns);
    const accidents=[];
    for(const tile of Object.values(state.tiles||{})){
      const key=`${tile.x},${tile.y}`;
      if(tile.lastAccident&&tile.lastAccident!==beforeAccidents.get(key))accidents.push({tile,event:tile.lastAccident});
    }
    const accidentDeaths=accidents.reduce((sum,item)=>sum+(Number(item.event?.deaths)||0),0);
    let colonyDied=!!result.colonyDied;
    if(accidentDeaths>=beforePop&&beforePop>0&&!colonyDied){state.pop=0;colonyDied=this.killColony(state)||state.status==="dead";}
    state.metrics.populationDelta=(Number(state.pop)||0)-beforePop;
    state.metrics.lastAccidentDeaths=accidentDeaths;
    return{...result,colonyDied,populationDelta:state.metrics.populationDelta,accidents,accidentDeaths};
  }
}
