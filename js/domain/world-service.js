import { RESOURCE_TYPES } from "../data/resources.js";
import { clamp, hashString, seededRandom, tileKey } from "../core/utils.js";

export class WorldService {
  constructor(resourceService,contractService){
    this.resources = resourceService;
    this.contracts = contractService;
  }

  seed(state,x,y){ return hashString(`${state.seed}|${state.contract.uid}|${x}|${y}`); }

  get(state,x,y){
    const key = tileKey(x,y);
    return state.tiles[key] ||= {x,y,revealed:false,developed:false,level:0,depleted:false};
  }

  familyWeights(state){
    const a = this.contracts.archetype(state.contract);
    return {food:.45*a.f,industry:.48*a.i,valuable:.07*clamp(a.rare,.7,1.8),a};
  }

  familyFor(state,random){
    const {food,industry,valuable} = this.familyWeights(state);
    const total = food+industry+valuable;
    const roll = random()*total;
    return roll<food ? "food" : roll<food+industry ? "industry" : "valuable";
  }

  reveal(state,x,y){
    const tile = this.get(state,x,y);
    if(tile.revealed) return tile;

    const random = seededRandom(this.seed(state,x,y));
    const {a} = this.familyWeights(state);
    const family = this.familyFor(state,random);
    const def = this.resources.pick(RESOURCE_TYPES[family],random);

    let quality = this.resources.quality(random,def.qualityBias,a.rare);
    if(family==="food") quality=clamp(Math.round(quality*Math.pow(a.f,.22)),1,10000);
    if(family==="industry") quality=clamp(Math.round(quality*Math.pow(a.i,.22)),1,10000);

    const reserve = Math.round((4500+Math.pow(random(),1.8)*150000)*a.res*(family==="valuable"?.72:1));
    Object.assign(tile,{
      revealed:true,type:family,family,resourceId:def.id,name:def.name,resourceRarity:def.rarity,
      resourceMult:def.multiplier,quality,reserve,initialReserve:reserve
    });
    return tile;
  }

  hint(state,x,y){
    const level = state.metrics.hint;
    if(level<=0) return "Unknown";
    const random = seededRandom(this.seed(state,x,y));
    const family = this.familyFor(state,random);
    const label = family==="food"?"Food":family==="industry"?"Ore":"Valuable";
    if(level===1) return family==="valuable"?"Unusual mineral signal":`Possible ${label.toLowerCase()}`;
    if(level===2) return `${label} • ${["Low","Moderate","Good","High","Rare"][Math.floor(random()*5)]} signal`;
    return `${label} • quality band detected`;
  }
}
