import { clamp, formatMoney, formatNumber } from "../core/utils.js?v=4.0.2";

export class ColonyTechUIMixin {
  colonyPanel(){
    this.onRecalculate?.();const s=this.state,m=s.metrics,c=s.colony,h=this.colony.canExpandHousing(s),i=this.colony.canExpandIndustry(s),pct=v=>`${Math.round(clamp(v,0,1)*100)}%`;
    this.open(`Colony — Tier ${s.contract.colonyTier}`,`<article class="card"><h3>${s.contract.environment}</h3><p>${s.contract.hazard}</p><div class="effect">Colony support: ${s.contract.supportSystem}</div><div class="effect">Tech access: ${s.contract.techAccess==="direct"?"Direct corporate link":"Trade ship only"}</div></article><div class="grid2" style="margin-top:6px"><div class="metric"><small>Population / Housing</small><strong>${formatNumber(s.pop)} / ${formatNumber(c.housingCapacity)}</strong></div><div class="metric"><small>Industry</small><strong>L${c.industryLevel} • ${formatNumber(m.industry)}</strong></div><div class="metric"><small>Power</small><strong>${formatNumber(m.powerDemand)} / ${formatNumber(m.powerCapacity)}</strong></div><div class="metric"><small>Build stock</small><strong>${formatNumber(this.inventory.amount(s,"build"))}</strong></div></div><div class="need-grid"><div class="metric need ${m.foodSupply>=.9?"good":"warn"}"><small>Food use</small><strong>${formatNumber(m.foodDemand)}/d • ${pct(m.foodSupply)}</strong></div><div class="metric need ${m.fuelSupply>=.9?"good":"warn"}"><small>Fuel / power</small><strong>${formatNumber(m.fuelDemand)}/d • ${pct(m.fuelSupply)}</strong></div><div class="metric need ${m.oreSupply>=.9?"good":"warn"}"><small>Ore for industry</small><strong>${formatNumber(m.oreDemand)}/d • ${pct(m.oreSupply)}</strong></div><div class="metric need ${m.powerFactor>=.9?"good":"warn"}"><small>Power available</small><strong>${pct(m.powerFactor)}</strong></div></div><div class="grid2" style="margin-top:7px"><button data-housing ${h.ok?"":"disabled"}>BUILD HOUSING<br><span class="tiny">${formatMoney(h.cash||this.colony.housingCashCost(s))} + ${formatNumber(h.build||this.colony.housingBuildCost(s))} Build</span></button><button data-industry ${i.ok?"":"disabled"}>EXPAND INDUSTRY<br><span class="tiny">${formatMoney(i.cash||this.colony.industryCashCost(s))} + ${formatNumber(i.build||this.colony.industryBuildCost(s))} Build</span></button></div>${h.ok?"":`<div class="requirement locked">Housing: ${h.reason}</div>`}${i.ok?"":`<div class="requirement locked">Industry: ${i.reason}</div>`}`);
    const hb=this.modal.querySelector("[data-housing]");if(hb)hb.onclick=()=>{const r=this.colony.expandHousing(s);if(r.ok){this.onRecalculate?.();this.toast("Housing capacity expanded.");this.colonyPanel()}else this.toast(r.reason)};
    const ib=this.modal.querySelector("[data-industry]");if(ib)ib.onclick=()=>{const r=this.colony.expandIndustry(s);if(r.ok){this.onRecalculate?.();this.toast(`Industry expanded to L${s.colony.industryLevel}.`);this.colonyPanel()}else this.toast(r.reason)};
  }

  techEffect(category,tech){
    if(category==="power")return `Power ${formatNumber(tech.powerCapacity)} • Population cap ${formatNumber(tech.populationCap)} • Industry L${tech.industryCap} • Fuel intensity ${tech.fuelIntensity.toFixed(3)}×`;
    if(category==="food")return `Natural production ×${tech.productionMultiplier.toFixed(2)}${tech.syntheticFood?` • Sealed food ${formatNumber(tech.syntheticFood)}/day`:""}`;
    const unlocks=this.resources.catalog().filter(r=>r.miningLevel===tech.level&&!r.manufactured).map(r=>r.name);
    return `Extraction ×${tech.extractionMultiplier.toFixed(2)}${unlocks.length?` • Unlocks: ${unlocks.join(", ")}`:""}`;
  }

  tech(){
    this.onRecalculate?.();
    if(this.showFutureTech===undefined)this.showFutureTech=true;
    const access=this.technology.canAccessStore(this.state),cats=["power","food","mining"],labels={power:"POWER",food:"FOOD PRODUCTION",mining:"MINING"};
    const paths=cats.map(cat=>{
      const level=this.technology.level(this.state,cat),items=this.technology.tree(cat).filter(t=>this.showFutureTech||t.level<=level);
      return `<section class="tech-path"><div class="tech-path-header"><strong>${labels[cat]}</strong><span>L${level}/10</span></div><div class="tech-roadmap">${items.map(t=>{
        const owned=t.level<level,current=t.level===level,next=t.level===level+1,future=t.level>level+1;
        const stateClass=owned?"owned":current?"current":next?"next":"future";
        const stateLabel=owned?"OWNED":current?"CURRENT":next?"NEXT":"LOCKED";
        return `<article class="tech-roadmap-card ${stateClass}"><div class="tech-roadmap-level">L${t.level}</div><div class="tech-roadmap-copy"><div class="tech-roadmap-title"><strong>${t.name}</strong><span>${stateLabel}</span></div><p>${t.description}</p><div class="effect">${this.techEffect(cat,t)}</div>${future?`<div class="requirement">Requires ${labels[cat]} L${t.level-1}</div>`:""}</div><div class="tech-roadmap-action">${next?`<button data-tech-cat="${cat}" ${!access||this.state.company.cash<t.cost?"disabled":""}>${formatMoney(t.cost)}</button>`:current?`<span>ACTIVE</span>`:owned?`<span>✓</span>`:`<span>🔒</span>`}</div></article>`;
      }).join("")}</div></section>`;
    }).join("");

    this.open("Corporate Technology",`<div class="tech-toolbar"><article class="card"><h3>${access?"CORPORATE SYSTEMS ONLINE":"CORPORATE SYSTEMS UNAVAILABLE"}</h3><p>${this.technology.accessText(this.state)}</p></article><button data-tech-toggle>${this.showFutureTech?"HIDE FUTURE TECH":"SHOW FUTURE TECH"}</button></div><div class="tech-tree">${paths}</div>`);
    this.modal.querySelector("[data-tech-toggle]").onclick=()=>{this.showFutureTech=!this.showFutureTech;this.tech()};
    this.modal.querySelectorAll("[data-tech-cat]").forEach(b=>b.onclick=()=>{const r=this.technology.buy(this.state,b.dataset.techCat);if(r.ok){this.onRecalculate?.();this.toast(`${r.tech.name} licensed permanently.`);this.tech()}else this.toast(r.reason)});
  }

  goals(){const score=this.contracts.score(this.state),g=this.state.contract.goals;this.open("Contract Goals",`<article class="card"><h3>COLONY TIER ${this.state.contract.colonyTier} • ${this.state.contract.environment}</h3><p>${this.state.contract.hazard}</p></article><div class="grid2" style="margin-top:6px"><div class="metric"><small>Food production</small><strong>${formatNumber(this.state.metrics.food)} / ${formatNumber(g.food)}</strong></div><div class="metric"><small>Industry capability</small><strong>${formatNumber(this.state.metrics.industry)} / ${formatNumber(g.industry)}</strong></div><div class="metric"><small>Population</small><strong>${formatNumber(this.state.pop)} / ${formatNumber(g.pop)}</strong></div><div class="metric"><small>Contract profit</small><strong>${formatMoney(score.profit)}</strong></div></div><div class="card" style="margin-top:5px"><h3>Performance bands</h3><p>Bronze: pass all objectives. Silver: ${formatMoney(this.state.contract.bands.silver)} profit. Gold: ${formatMoney(this.state.contract.bands.gold)} plus 120% objectives. Platinum: ${formatMoney(this.state.contract.bands.plat)} plus 150% objectives.</p></div>`);}
}
