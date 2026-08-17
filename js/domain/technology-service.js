import { TECHNOLOGIES } from "../data/technologies.js";
import { clamp } from "../core/utils.js";

export class TechnologyService {
  get(id){ return TECHNOLOGIES.find(x=>x.id===id); }

  recompute(state){
    let food=1,industry=1,scan=1,hint=0,surveyLicenses=0;
    for(const id of state.company.licenses){
      const tech=this.get(id);
      if(!tech) continue;
      if(tech.category==="food") food*=tech.multiplier;
      if(tech.category==="industry") industry*=tech.multiplier;
      if(tech.category==="survey"){
        scan*=tech.scanMultiplier;
        hint+=tech.hintIncrease;
        surveyLicenses++;
      }
    }
    const surveyLevel=1+surveyLicenses;
    const slots=clamp(1+Math.floor((surveyLevel-1)/3),1,5);
    Object.assign(state.metrics,{fm:food,im:industry,sf:scan,hint:clamp(hint,0,3),sl:surveyLevel,slots});
  }

  eligible(state,tech){
    if(state.company.licenses.includes(tech.id)) return false;
    if(tech.tier>1 && !state.company.licenses.includes(`${tech.category}-${tech.tier-1}`)) return false;
    return state.metrics.food>=tech.foodRequired &&
      state.metrics.industry>=tech.industryRequired &&
      state.metrics.sl>=tech.surveyRequired;
  }

  refreshOffers(state){
    const eligible = TECHNOLOGIES.filter(t=>this.eligible(state,t));
    const ids = eligible.slice(0,3).map(x=>x.id);
    const signature=ids.join("|");
    const changed=signature!==state.offerSig;
    state.offers=ids;state.offerSig=signature;
    return changed;
  }

  buy(state,id){
    const tech=this.get(id);
    if(!tech||!this.eligible(state,tech)||state.company.cash<tech.cost) return false;
    state.company.cash-=tech.cost;
    state.company.licenses.push(id);
    this.recompute(state);
    this.refreshOffers(state);
    return true;
  }
}
