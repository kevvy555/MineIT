import { clamp, formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { getLoadedViewTemplate, loadViewTemplate, preloadViewTemplates, renderViewTemplate } from "../core/view-template.js";

const CONTRACT_FAILED_VIEW="./views/contract-failed.html";
preloadViewTemplates([CONTRACT_FAILED_VIEW]);

export class ContractUIMixin {
  diagnosticsPanel(){const text=this.diagnostics.text(this.state).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");this.open("Diagnostics / Error Log",`<div class="diag-log">${text}</div>`);}
  rare(tile){this.state.speed=0;this.syncSpeed();const icon=this.icons.svg(tile.resourceId,this.icons.colorFor(tile),38,tile.type),remaining=this.resources.isRenewable(tile)?"Sustainable":`reserve ${formatNumber(tile.reserve)}`;this.open("Exceptional Discovery",`<article class="card"><div class="resource-title">${icon}<h3>${tile.name} • Q${formatNumber(tile.quality)}</h3></div><p>${this.resources.categoryName(tile.type)} • ${tile.resourceRarity} • ${remaining}</p><div class="effect">Mining requirement: L${tile.requiredMiningLevel||1} • ${tile.requiredMiningTech||"Surface Recovery"}</div><button data-view>VIEW SITE</button></article>`);this.modal.querySelector("[data-view]").onclick=()=>{this.modal.classList.add("hidden");this.tile(tile)};}
  async completionActions(title,score=null){
    const fee=this.contracts.renewalFee(this.state),scoreCard=score?`<article class="card"><h3>${score.rating.toUpperCase()} PERFORMANCE</h3><p>Colony contract profit ${formatMoney(score.profit)}</p></article>`:"";
    let body;try{body=await renderViewTemplate("./views/contract-completion.html",{SCORE_CARD:scoreCard,RENEWAL_YEARS:CONFIG.RENEWAL_YEARS,RENEWAL_FEE:formatMoney(fee)});}catch(error){this.diagnostics?.error?.("contract completion template failed",error);this.toast("Unable to open the contract decision.");return;}
    this.open(title,body);
    this.modal.querySelector("[data-renew]").onclick=()=>{const r=this.contracts.renew(this.state);if(r.ok){this.repo.save(this.state);this.modal.classList.add("hidden");this.syncSpeed();if(this.onContractDecisionResolved)this.onContractDecisionResolved("renewed");this.toast(`Contract renewed for ${r.years} years.`);}else this.toast(r.reason)};
    this.modal.querySelector("[data-new]").onclick=()=>{this.state.status="holdover";this.repo.save(this.state);if(this.onContractDecisionResolved)this.onContractDecisionResolved("new-colony");else void this.contractBoard();};
    this.modal.querySelector("[data-hold]").onclick=()=>{this.state.status="holdover";this.repo.save(this.state);this.modal.classList.add("hidden");if(this.onContractDecisionResolved)this.onContractDecisionResolved("holdover");else{this.state.speed=1;this.syncSpeed();}};
    this.modal.querySelector("[data-end]").onclick=()=>this.endContractDialog();
    this.modal.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();
  }
  contractFailedViewSource(){
    const source=getLoadedViewTemplate(CONTRACT_FAILED_VIEW);if(source)return source;
    const revision=(this.contractFailedViewRevision||0)+1;this.contractFailedViewRevision=revision;
    loadViewTemplate(CONTRACT_FAILED_VIEW).then(()=>{if(this.contractFailedViewRevision===revision&&this.state.status==="liability"&&this.state.contract?.ended)this.renderContractFailed();}).catch(error=>{if(this.contractFailedViewRevision!==revision)return;this.diagnostics?.error?.("contract failed view failed",error);this.toast("Unable to open the contract decision.");});
    this.toast("Loading contract decision...");return null;
  }
  renderContractFailed(){
    const source=this.contractFailedViewSource();if(!source)return false;
    this.open("Charter Terminated",source);
    this.modal.querySelector("[data-ack]").onclick=()=>{this.modal.classList.add("hidden");if(this.onContractDecisionResolved)this.onContractDecisionResolved("failed");else{this.state.speed=1;this.syncSpeed();}};
    this.modal.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();
    return true;
  }
  deadline(kind=null){
    this.state.speed=0;this.syncSpeed();kind||=this.contracts.deadlineState(this.state)||this.state.contract?.pendingDecision;
    if(kind==="complete"){
      const result=this.contracts.awardCompletion(this.state);this.repo.save(this.state);void this.completionActions("Initial Contract Complete",result.score);return;
    }
    if(kind==="renewal-ended"){
      this.contracts.enterHoldover(this.state);this.repo.save(this.state);void this.completionActions("Renewal Term Complete");return;
    }
    if(kind==="extension"){
      const n=this.state.contract.extUsed+1,fee=this.contracts.extensionFee(this.state);this.state.status="deadline-missed";
      this.open("Contract Deadline Missed",`<article class="card"><h3>Objectives not met</h3><p>Extension ${n} of ${CONFIG.MAX_EXTENSIONS}</p><div class="effect warn">Fee ${formatMoney(fee)}</div><button data-ext>BUY 1-YEAR EXTENSION</button></article><button class="action" data-colonies>VIEW ALL COLONIES</button>`);
      this.modal.querySelector("[data-ext]").onclick=()=>{if(this.contracts.extend(this.state)){this.modal.classList.add("hidden");this.repo.save(this.state);if(this.onContractDecisionResolved)this.onContractDecisionResolved("extended");else{this.state.speed=1;this.syncSpeed();}}else this.toast("Unable to purchase extension.")};
      this.modal.querySelector("[data-colonies]").onclick=()=>this.coloniesPanel();return;
    }
    if(kind==="failed"){
      this.state.contract.ended=true;this.state.status="liability";this.repo.save(this.state);this.renderContractFailed();
    }
  }
  async contractBoard(){
    if(this.state.company.gameOver){this.open("Corporation Ended",`<article class="card"><h3 class="bad">NO OPERATING COLONIES</h3><p>All colonies were lost. Start a new corporation from the Game menu to continue.</p></article>`);return;}
    const tier=this.state.company.wins+1,options=this.contracts.options(tier),stars=n=>"★".repeat(n)+"☆".repeat(5-n);
    let body;
    try{
      const cards=(await Promise.all(options.map((c,i)=>{
        const a=this.contracts.archetype(c),ok=this.technology.meetsRequirements(this.state,c.requiredTech),req=`P${c.requiredTech.power} • F${c.requiredTech.food} • M${c.requiredTech.mining}`;
        return renderViewTemplate("./views/contract-card.html",{NAME:c.name,ENVIRONMENT:c.environment,HAZARD:c.hazard,SUPPORT_SYSTEM:c.supportSystem,FOOD_STARS:stars(a.stars.food),BUILD_STARS:stars(a.stars.build),FUEL_STARS:stars(a.stars.fuel),ORE_STARS:stars(a.stars.ore),TECH_CLASS:ok?"":"warn",TECH_REQUIREMENTS:req,TECH_ACCESS:c.techAccess==="direct"?"Direct tech link":"Trade-ship tech only",SUPPORT_LOAD:Number(c.supportLoad||1).toFixed(2),ADVANCE:formatMoney(c.advance),INDEX:i,DISABLED:ok?"":"disabled",ACTION_LABEL:ok?"ESTABLISH COLONY":"TECH LOCKED"});
      }))).join("");
      body=await renderViewTemplate("./views/contract-board.html",{CONTRACT_CARDS:cards});
    }catch(error){this.diagnostics?.error?.("contract board template failed",error);this.toast("Unable to open the contract board.");return;}
    this.open(`New Colony Contract — Corporation Tier ${tier}`,body);
    this.modal.querySelectorAll("[data-contract]").forEach(b=>b.onclick=()=>{const c=options[+b.dataset.contract];if(!this.technology.meetsRequirements(this.state,c.requiredTech)){this.toast("Technology requirements not met.");return}this.onNewContract?.(c);});
  }
  render(){const s=this.state,c=s.contract,g=c.goals,m=s.metrics,deadline=this.contracts.deadline(s),elapsed=(s.year-1)+(s.day-1)/CONFIG.DAYS_PER_YEAR;document.querySelector("#contractName").textContent=`${c.colonyName||"Colony"} • T${c.colonyTier} • ${c.name}`;document.querySelector("#timeBar").style.width=`${clamp(elapsed/deadline*100,0,100)}%`;document.querySelector("#dateText").textContent=s.status==="dead"?"COLONY LOST":s.colony?.emergencyMode?`Y${s.year} • EMERGENCY`:s.status==="liability"?`Y${s.year} • LIABILITY`:s.status==="holdover"?`Y${s.year} • HOLDOVER`:s.status==="contract-decision"?`Y${s.year} • ACTION REQUIRED`:`Y${s.year} • D${s.day} / ${deadline}Y`;const goal=(p,v,t)=>{document.querySelector(`#${p}Val`).textContent=formatNumber(v);document.querySelector(`#${p}Goal`).textContent=`${formatNumber(v)} / ${formatNumber(t)}`;document.querySelector(`#${p}Bar`).style.width=`${clamp(v/t*100,0,100)}%`};goal("food",m.food,g.food);goal("ind",m.industry,g.industry);goal("pop",s.pop,g.pop);document.querySelector("#cash").textContent=formatMoney(s.company.cash);document.querySelector("#foodStock").textContent=formatNumber(this.inventory.amount(s,"food"));document.querySelector("#buildStock").textContent=formatNumber(this.inventory.amount(s,"build"));document.querySelector("#fuelStock").textContent=formatNumber(this.inventory.amount(s,"fuel"));document.querySelector("#oreStock").textContent=formatNumber(this.inventory.amount(s,"ore"));const active=s.scans,queued=s.scanQueue,hud=document.querySelector("#scanHud");hud.classList.toggle("hidden",!(active.length||queued.length));if(active.length||queued.length){document.querySelector("#scanText").textContent=`${active.length}/${this.survey.slots(s)} active • ${queued.length} queued`;const progress=active.length?active.reduce((sum,q)=>sum+(1-q.remaining/q.total),0)/active.length:0;document.querySelector("#scanBar").style.width=`${clamp(progress*100,0,100)}%`;}}
}
