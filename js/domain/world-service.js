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

  renewableAbundance(random){
    const roll=random();
    if(roll<.52) return {label:"Limited",factor:.45+random()*.45};
    if(roll<.82) return {label:"Established",factor:.90+random()*.55};
    if(roll<.96) return {label:"Large",factor:1.45+random()*.85};
    return {label:"Vast",factor:2.30+random()*2.20};
  }

  finiteDeposit(random,reserveBias=1,family="industry"){
    const roll=random();
    let label,years;
    if(roll<.16){ label="Small";years=1.5+random()*5.5; }
    else if(roll<.52){ label="Modest";years=7+random()*20; }
    else if(roll<.80){ label="Large";years=27+random()*55; }
    else if(roll<.95){ label="Huge";years=82+random()*120; }
    else { label="Colossal";years=202+random()*350; }
    years*=reserveBias*(family==="valuable"?.78:1);
    return {label,years:Math.max(.5,years)};
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

    const shared={
      revealed:true,type:family,family,resourceId:def.id,name:def.name,resourceRarity:def.rarity,
      resourceMult:def.multiplier,quality
    };

    if(family==="food"){
      const abundance=this.renewableAbundance(random);
      Object.assign(tile,shared,{
        sustainability:"renewable",abundance:abundance.factor,abundanceLabel:abundance.label,
        reserve:null,initialReserve:null,depleted:false
      });
      return tile;
    }

    const deposit=this.finiteDeposit(random,a.res,family);
    const baseline=this.resources.baseOutput(quality)*(def.multiplier||1);
    const reserve=Math.max(1,Math.round(baseline*360*deposit.years));
    Object.assign(tile,shared,{
      sustainability:"finite",abundance:1,depositScale:deposit.label,
      reserve,initialReserve:reserve
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
