import { RESOURCE_TYPES } from "../data/resources.js";
import { clamp } from "../core/utils.js";

export class ResourceService {
  pick(list,random){
    const total = list.reduce((sum,item)=>sum+item.weight,0);
    let roll = random()*total;
    for(const item of list){
      roll -= item.weight;
      if(roll<=0) return item;
    }
    return list[list.length-1];
  }

  get(family,id){ return RESOURCE_TYPES[family]?.find(x=>x.id===id) || null; }

  quality(random,bias=1,contractRare=1){
    const raw = random();
    const z = 1-Math.pow(1-raw,clamp(bias*Math.sqrt(contractRare),.55,2.4));
    let q;
    if(z<.60) q=1+Math.floor(random()*100);
    else if(z<.85) q=101+Math.floor(random()*400);
    else if(z<.95) q=501+Math.floor(random()*1500);
    else if(z<.99) q=2001+Math.floor(random()*3000);
    else if(z<.999) q=5001+Math.floor(random()*4000);
    else q=9001+Math.floor(random()*1000);
    return clamp(q,1,10000);
  }

  qualityBand(q){
    if(q<=50) return ["Common","q0"];
    if(q<=200) return ["Good","q1"];
    if(q<=750) return ["Excellent","q2"];
    if(q<=2500) return ["Exceptional","q3"];
    if(q<=7500) return ["Rare","q4"];
    return ["Extraordinary","q5"];
  }

  baseOutput(q){ return 8 + 7*Math.pow(q,.52); }

  isRenewable(tile){ return tile.sustainability==="renewable" || tile.type==="food"; }

  baselineRate(tile){
    return this.baseOutput(tile.quality)*(tile.resourceMult||1)*(tile.abundance||1);
  }

  collectionRate(state,tile){
    const level = 1 + Math.max(0,tile.level-1)*.22;
    const population = state.metrics.pm || 1;
    const base = this.baselineRate(tile)*level*population;
    if(tile.type==="food") return base*state.metrics.fm;
    if(tile.type==="industry") return base*state.metrics.im;
    return base;
  }

  siteOutput(state,tile){ return this.collectionRate(state,tile); }

  annualCashForRate(tile,rate){
    if(tile.type==="valuable") return rate*2.5*360;
    if(tile.type==="industry") return rate*.30*360;
    return rate*.08*360;
  }

  annualCash(state,tile){ return this.annualCashForRate(tile,this.collectionRate(state,tile)); }

  estimatedLifeYears(state,tile){
    if(this.isRenewable(tile)) return Infinity;
    const rate=this.collectionRate(state,tile);
    if(rate<=0) return Infinity;
    return Math.max(0,tile.reserve||0)/rate/360;
  }
}
