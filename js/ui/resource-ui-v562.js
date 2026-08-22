import { ResourceUIMixin as LegacyResourceUIMixin } from "./resource-ui.js?v=5.5.5&legacy=1";
import { OPERATING_MODES,operatingMode,riskExposure,accidentDetails,isAccidentShutdown,OVERDRIVE_RISK_PERIOD } from "../domain/extraction-overdrive.js?v=5.6.2";

export class ResourceUIMixin extends LegacyResourceUIMixin{
  tile(tile){
    super.tile(tile);
    if(!tile?.developed||!this.collection.supportsOverdrive(tile)||!this.tilePanel||this.tilePanel.classList.contains("hidden"))return;
    const panel=this.tilePanel,mode=operatingMode(tile),profile=OPERATING_MODES[mode],exposure=riskExposure(tile),shutdown=isAccidentShutdown(tile),accident=accidentDetails(tile),workers=this.colony.siteWorkforce(this.state,tile),last=tile.lastAccident;
    const card=document.createElement("article");card.className="card site-overdrive";
    if(shutdown){
      const days=Math.max(1,Math.ceil(Number(tile.accidentShutdownDays)||0)),outcome=last?.outcome==="fatalities"?`${last.deaths} colonist${last.deaths===1?"":"s"} killed`:`machinery damaged`;
      card.innerHTML=`<h3 class="bad">${last?.name||accident?.name||"Extraction Accident"}</h3><div class="grid2"><div class="metric"><small>Facility status</small><strong class="bad">SHUT DOWN</strong></div><div class="metric"><small>Reopens in</small><strong>${days} day${days===1?"":"s"}</strong></div></div><div class="requirement locked">${outcome}. The facility is automatically reset to NORMAL operation and cannot restart until the three-day safety shutdown is complete.</div>`;
    }else{
      card.innerHTML=`<h3>OPERATING LOAD</h3><div class="grid3"><div class="metric"><small>Mode</small><strong>${profile.label}</strong></div><div class="metric"><small>Workers</small><strong>${workers}</strong></div><div class="metric"><small>Risk exposure</small><strong>${exposure.toFixed(1)} / ${OVERDRIVE_RISK_PERIOD}</strong></div></div><div class="grid3 site-mode-buttons">${Object.values(OPERATING_MODES).map(p=>`<button data-site-mode="${p.key}" class="${p.key===mode?"active":""}">${p.label}<br><span class="tiny">${Math.round(p.workforce*100)}% staff • ${Math.round(p.output*100)}% output${p.key==="normal"?"":` • ${p.risk} risk`}</span></button>`).join("")}</div><div class="effect ${mode==="hard"?"warn":mode==="pushed"?"":"good"}">${mode==="normal"?"Normal operation reduces accumulated risk exposure by 1 day per operating day.":mode==="pushed"?"Pushed operation adds 0.3 risk-days per operating day, reaching a 25% accident check after about 100 continuous operating days.":"Hard operation adds 1 risk-day per operating day. Each 30 risk-days triggers a 25% accident check."}</div>${last?`<div class="effect">Last accident: ${last.name} • ${last.outcome==="fatalities"?`${last.deaths} fatalities`:"machinery damage"} • Y${last.year} D${last.day}</div>`:""}`;
    }
    panel.appendChild(card);
    if(!shutdown)card.querySelectorAll("[data-site-mode]").forEach(button=>button.onclick=()=>{const r=this.collection.setOperatingMode(this.state,tile,button.dataset.siteMode);if(!r.ok){this.toast(r.reason);return;}this.onRecalculate?.();this.repo.save(this.state);this.toast(`${tile.name}: ${r.profile.label} operation selected.`);this.tile(tile);});
  }
}
