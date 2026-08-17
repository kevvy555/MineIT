import { CONTRACT_ARCHETYPES } from "../data/contracts.js";

export class ContractService {
  first(){
    return {
      uid:`intro-${Date.now()}`,tier:1,name:"Koplin Mining Charter — Contract 01",arch:"balanced",
      years:10,ext:0,extUsed:0,advance:0,
      goals:{food:620,industry:520,pop:1050},
      bands:{silver:450000,gold:1000000,plat:2200000},
      startEarn:0,
      desc:"Establish a viable extraction settlement before the original charter expires."
    };
  }

  archetype(contract){
    return CONTRACT_ARCHETYPES.find(x=>x.id===contract.arch) || CONTRACT_ARCHETYPES[0];
  }

  options(tier){
    const scale = 1 + (tier-1)*.38;
    return [...CONTRACT_ARCHETYPES]
      .sort(()=>Math.random()-.5)
      .slice(0,5)
      .map((a,index)=>({
        uid:`${a.id}-${tier}-${Date.now()}-${index}`,tier,name:`${a.name} — Tier ${tier}`,arch:a.id,
        years:10,ext:0,extUsed:0,advance:Math.round(65000*tier),
        goals:{
          food:Math.round(620*scale*(a.f<1?1.05:.98)),
          industry:Math.round(520*scale*(a.i<1?1.08:.98)),
          pop:Math.round(1050*scale)
        },
        bands:{
          silver:Math.round(500000*scale),
          gold:Math.round(1200000*scale),
          plat:Math.round(2700000*scale)
        },
        startEarn:0,desc:a.desc
      }));
  }

  start(state,contract){
    state.company.cash += contract.advance || 0;
    contract.startEarn = state.company.earn;
    state.contract = contract;
    state.year = 1; state.day = 1; state.pop = 120; state.speed = 1; state.status = "playing";
    state.tiles = {}; state.scans = []; state.scanQueue = []; state.offers = []; state.offerSig = "";
    state.camera = {x:-4,y:-4};
  }

  score(state){
    const g = state.contract.goals;
    const profit = state.company.earn - state.contract.startEarn;
    const ratios = {
      food: state.metrics.food/g.food,
      industry: state.metrics.industry/g.industry,
      pop: state.pop/g.pop
    };
    const passed = ratios.food>=1 && ratios.industry>=1 && ratios.pop>=1;
    let rating = passed ? "Bronze" : "Failed";
    if(passed && profit>=state.contract.bands.silver) rating="Silver";
    if(passed && profit>=state.contract.bands.gold && Math.min(...Object.values(ratios))>=1.2) rating="Gold";
    if(passed && profit>=state.contract.bands.plat && Math.min(...Object.values(ratios))>=1.5) rating="Platinum";
    return {passed,rating,profit,ratios};
  }

  extend(state){
    if(state.contract.extUsed>=3) return false;
    const number = state.contract.extUsed + 1;
    const fee = 25000 * number * state.contract.tier;
    if(state.company.cash < fee) return false;
    state.company.cash -= fee;
    state.contract.extUsed++;
    state.contract.ext++;
    return true;
  }
}
