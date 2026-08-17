import { clamp, formatMoney, formatNumber } from "../core/utils.js";
import { CONFIG } from "../core/config.js";

export class UIController {
  constructor({state,repo,resources,collection,sites,technology,survey,contracts,world,icons,diagnostics,onHardReset,onNewContract}){
    Object.assign(this,{state,repo,resources,collection,sites,technology,survey,contracts,world,icons,diagnostics,onHardReset,onNewContract});
    this.tilePanel=document.querySelector("#tilePanel");
    this.modal=document.querySelector("#modal");
    this.toastEl=document.querySelector("#toast");
    this.errorBadge=document.querySelector("#errorBadge");
    this.bind();
  }

  bind(){
    document.querySelector("#companyBtn").onclick=()=>this.company();
    document.querySelector("#collectionBtn").onclick=()=>this.currentCollection();
    document.querySelector("#techBtn").onclick=()=>this.tech();
    document.querySelector("#goalsBtn").onclick=()=>this.goals();
    document.querySelector("#menuBtn").onclick=()=>this.menu();
    document.querySelectorAll("[data-speed]").forEach(button=>{
      button.onclick=()=>{this.state.speed=+button.dataset.speed;this.syncSpeed()};
    });
    this.errorBadge.onclick=()=>this.diagnosticsPanel();
    this.diagnostics.subscribe(()=>this.updateErrorBadge());
  }

  updateErrorBadge(){
    this.errorBadge.textContent=`ERROR LOG (${this.diagnostics.errors})`;
    this.errorBadge.classList.toggle("hidden",this.diagnostics.errors===0);
  }

  syncSpeed(){
    document.querySelectorAll("[data-speed]").forEach(b=>b.classList.toggle("active",+b.dataset.speed===this.state.speed));
  }

  panelTitle(title,icon=""){
    return `<div class="panel-title"><div class="resource-title">${icon}<strong>${title}</strong></div><button class="close" data-close>✕</button></div>`;
  }

  open(title,body){
    this.modal.innerHTML=`${this.panelTitle(title)}<div class="modal-body">${body}</div>`;
    this.modal.classList.remove("hidden");
    this.modal.querySelector("[data-close]").onclick=()=>this.modal.classList.add("hidden");
  }

  toast(message){
    this.toastEl.textContent=message;this.toastEl.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>this.toastEl.classList.add("hidden"),1800);
  }

  quality(q){
    const [label,cls]=this.resources.qualityBand(q);
    return `<span class="${cls}">Q${formatNumber(q)} • ${label}</span>`;
  }

  tile(tile){
    if(!tile.revealed){
      const days=this.survey.days(this.state,tile.x,tile.y);
      const active=this.survey.isActive(this.state,tile.x,tile.y),queued=this.survey.isQueued(this.state,tile.x,tile.y);
      this.tilePanel.innerHTML=`${this.panelTitle(`Unsurveyed sector ${tile.x},${tile.y}`)}
        <div class="grid3">
          <div class="metric"><small>Scanner hint</small><strong class="survey">${this.world.hint(this.state,tile.x,tile.y)}</strong></div>
          <div class="metric"><small>Survey time</small><strong>${days} days</strong></div>
          <div class="metric"><small>Survey slots</small><strong>${this.state.scans.length}/${this.survey.slots(this.state)}</strong></div>
        </div>
        <button class="action" data-scan ${active||queued?"disabled":""}>${active?"SURVEY ACTIVE":queued?"QUEUED":"QUEUE SURVEY"}</button>`;
      this.tilePanel.classList.remove("hidden");
      this.tilePanel.querySelector("[data-close]").onclick=()=>this.tilePanel.classList.add("hidden");
      const scan=this.tilePanel.querySelector("[data-scan]");
      if(scan) scan.onclick=()=>{
        const result=this.survey.enqueue(this.state,tile.x,tile.y);
        if(result.ok){this.tilePanel.classList.add("hidden");this.toast(result.active?"Survey started.":"Added to survey queue.");}
      };
      return;
    }

    const rate=this.resources.collectionRate(this.state,tile);
    const family=tile.type==="food"?"FOOD":tile.type==="industry"?"INDUSTRIAL ORE":"VALUABLE";
    const cls=tile.type==="food"?"food":tile.type==="industry"?"industry":"valuable";
    const reward=tile.type==="valuable"?`${formatMoney(this.resources.annualCash(this.state,tile))}/yr`:tile.type==="industry"?`+${formatNumber(rate)} Industry`:`+${formatNumber(rate)} Food`;
    const renewable=this.resources.isRenewable(tile);
    const life=tile.developed?this.resources.estimatedLifeYears(this.state,tile):null;
    const remaining=renewable?"Sustainable":formatNumber(tile.reserve);
    const lifeText=life===null?"—":renewable?"Permanent":life>=100?`${Math.round(life)}y`:`${life.toFixed(1)}y`;
    const scale=renewable?(tile.abundanceLabel||"Sustainable"):(tile.depositScale||"Finite");
    const icon=this.icons.svg(tile.resourceId,this.icons.colorFor(tile),30);

    this.tilePanel.innerHTML=`${this.panelTitle(tile.depleted?`${tile.name} — DEPLETED`:tile.name,icon)}
      <div class="grid3">
        <div class="metric"><small>Family</small><strong class="${cls}">${family}</strong></div>
        <div class="metric"><small>Rarity</small><strong>${tile.resourceRarity}</strong></div>
        <div class="metric"><small>Quality</small><strong>${this.quality(tile.quality)}</strong></div>
        <div class="metric"><small>Collection rate</small><strong class="${cls}">${formatNumber(rate)}/day</strong></div>
        <div class="metric"><small>Remaining</small><strong>${remaining}</strong></div>
        <div class="metric"><small>${renewable?"Capacity":"Deposit"}</small><strong>${scale}</strong></div>
        <div class="metric"><small>${tile.type==="valuable"?"Cash output":"Contribution"}</small><strong class="${cls}">${reward}</strong></div>
        <div class="metric"><small>Est. life</small><strong>${lifeText}</strong></div>
        <div class="metric"><small>Site level</small><strong>${tile.developed?`L${tile.level}`:"Undeveloped"}</strong></div>
      </div>`;

    if(!tile.depleted&&!tile.developed){
      const cost=this.sites.developCost(this.state,tile);
      this.tilePanel.innerHTML+=`<button class="action" data-develop ${this.state.company.cash<cost?"disabled":""}>DEVELOP & COLLECT • ${formatMoney(cost)}</button>`;
    }else if(tile.developed){
      const cost=this.sites.upgradeCost(this.state,tile);
      this.tilePanel.innerHTML+=`<button class="action" data-upgrade ${this.state.company.cash<cost?"disabled":""}>UPGRADE TO L${tile.level+1} • ${formatMoney(cost)}</button>`;
    }

    this.tilePanel.classList.remove("hidden");
    this.tilePanel.querySelector("[data-close]").onclick=()=>this.tilePanel.classList.add("hidden");
    const develop=this.tilePanel.querySelector("[data-develop]");
    if(develop) develop.onclick=()=>{if(this.sites.develop(this.state,tile)){this.toast("Collection started.");this.tile(tile)}};
    const upgrade=this.tilePanel.querySelector("[data-upgrade]");
    if(upgrade) upgrade.onclick=()=>{if(this.sites.upgrade(this.state,tile)){this.toast(`Collection upgraded to L${tile.level}.`);this.tile(tile)}};
  }

  currentCollection(){
    const sites=this.collection.current(this.state);
    if(!sites.length){
      this.open("Current Collection",`<article class="card"><h3>No active collection sites</h3><p>Survey a resource tile and develop it to start continuous collection.</p></article>`);
      return;
    }
    this.open("Current Collection",`<div class="collection-table">
      <div class="collection-row collection-head"><span>Resource</span><span>Category</span><span>Rate</span><span>Remaining</span></div>
      ${sites.map(site=>`<div class="collection-row">
        <strong>${site.name}</strong>
        <span>${site.category}</span>
        <span>${formatNumber(site.rate)}/day</span>
        <span>${site.renewable?"Sustainable":formatNumber(site.remaining)}</span>
      </div>`).join("")}
    </div>`);
  }

  company(){
    const c=this.state.company;
    this.open("Mining Corporation",`<div class="grid2">
      <div class="metric"><small>Cash</small><strong>${formatMoney(c.cash)}</strong></div>
      <div class="metric"><small>Lifetime earnings</small><strong>${formatMoney(c.earn)}</strong></div>
      <div class="metric"><small>Completed contracts</small><strong>${c.wins}</strong></div>
      <div class="metric"><small>Reputation</small><strong>${c.rep}</strong></div>
      <div class="metric"><small>Permanent licences</small><strong>${c.licenses.length}</strong></div>
      <div class="metric"><small>Population</small><strong>${formatNumber(this.state.pop)}</strong></div>
    </div>`);
  }

  tech(){
    this.technology.refreshOffers(this.state);
    const offers=this.state.offers.map(id=>this.technology.get(id)).filter(Boolean);
    this.open("Corporate Technology",offers.length?`<div class="cards one">${offers.map(t=>`
      <article class="card">
        <h3>${t.name}</h3>
        <p>Requires Food ${formatNumber(t.foodRequired)}, Industry ${formatNumber(t.industryRequired)}, Survey Lv${t.surveyRequired}</p>
        <div class="effect">${t.category==="survey"?`Scanner ${t.scanMultiplier.toFixed(3)}×${t.hintIncrease?" • better hints":""}`:`×${t.multiplier.toFixed(3)} ${t.category}`}</div>
        <button data-tech="${t.id}" ${this.state.company.cash<t.cost?"disabled":""}>LICENSE • ${formatMoney(t.cost)}</button>
      </article>`).join("")}</div>`:`<div class="card"><h3>No qualifying technology</h3><p>Increase Food, Industry or Survey capability to reveal new corporate licences.</p></div>`);
    this.modal.querySelectorAll("[data-tech]").forEach(button=>button.onclick=()=>{
      if(this.technology.buy(this.state,button.dataset.tech)){this.survey.fill(this.state);this.toast("Permanent technology licensed.");this.tech();}
    });
  }

  goals(){
    const score=this.contracts.score(this.state),g=this.state.contract.goals;
    this.open("Contract Goals",`<div class="grid2">
      <div class="metric"><small>Food</small><strong>${formatNumber(this.state.metrics.food)} / ${formatNumber(g.food)}</strong></div>
      <div class="metric"><small>Industry</small><strong>${formatNumber(this.state.metrics.industry)} / ${formatNumber(g.industry)}</strong></div>
      <div class="metric"><small>Population</small><strong>${formatNumber(this.state.pop)} / ${formatNumber(g.pop)}</strong></div>
      <div class="metric"><small>Contract profit</small><strong>${formatMoney(score.profit)}</strong></div>
    </div>
    <div class="card" style="margin-top:5px"><h3>Performance bands</h3>
      <p>Bronze: pass all objectives. Silver: ${formatMoney(this.state.contract.bands.silver)} profit. Gold: ${formatMoney(this.state.contract.bands.gold)} plus 120% objectives. Platinum: ${formatMoney(this.state.contract.bands.plat)} plus 150% objectives.</p>
    </div>`);
  }

  menu(){
    this.open("Game",`<div class="grid2">
      <button data-save>Save now</button><button data-diagnostics>Diagnostics</button>
      <button data-help>How to play</button><button data-center>Centre on ship</button>
      <button data-reset class="bad" style="grid-column:1/-1">HARD RESET ALL MINEIT DATA</button>
    </div>`);
    this.modal.querySelector("[data-save]").onclick=()=>this.toast(this.repo.save(this.state)?"Game saved.":"Save failed.");
    this.modal.querySelector("[data-diagnostics]").onclick=()=>this.diagnosticsPanel();
    this.modal.querySelector("[data-center]").onclick=()=>{this.state.camera={x:-4,y:-4};this.modal.classList.add("hidden")};
    this.modal.querySelector("[data-help]").onclick=()=>this.open("How to Play",`<div class="cards one">
      <div class="card"><h3>Survey</h3><p>Tap a black tile to survey it. Hold and drag across visible unexplored cells to queue several.</p></div>
      <div class="card"><h3>Collect</h3><p>Develop a discovered tile to begin continuous collection. Food sites have a sustainable rate and do not run out. Mineral and valuable deposits are finite and can range from small finds to deposits lasting centuries.</p></div>
      <div class="card"><h3>Upgrade</h3><p>Upgrades increase collection rate. On finite deposits that also consumes the reserve faster, so extraction speed is a real trade-off.</p></div>
      <div class="card"><h3>Advance</h3><p>Use Food to support population, industrial ore to build Industry, and valuables to drive corporate profit before the deadline.</p></div>
    </div>`);
    this.modal.querySelector("[data-reset]").onclick=()=>this.onHardReset();
  }

  diagnosticsPanel(){
    const text=this.diagnostics.text(this.state).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    this.open("Diagnostics / Error Log",`<div class="diag-log">${text}</div>`);
  }

  rare(tile){
    this.state.speed=0;this.syncSpeed();
    const icon=this.icons.svg(tile.resourceId,this.icons.colorFor(tile),38);
    const remaining=this.resources.isRenewable(tile)?"Sustainable":`reserve ${formatNumber(tile.reserve)}`;
    this.open("Exceptional Discovery",`<article class="card">
      <div class="resource-title">${icon}<h3>${tile.name} • Q${formatNumber(tile.quality)}</h3></div>
      <p>${tile.resourceRarity} • ${remaining}</p>
      <div class="effect">${tile.type==="valuable"?"This site can transform the contract profit score.":tile.type==="food"?"A permanent high-yield food source can support major population growth.":"This could become a cornerstone of the contract."}</div>
      <button data-view>VIEW SITE</button>
    </article>`);
    this.modal.querySelector("[data-view]").onclick=()=>{this.modal.classList.add("hidden");this.tile(tile)};
  }

  deadline(){
    this.state.speed=0;this.syncSpeed();
    const score=this.contracts.score(this.state);
    if(score.passed){
      this.state.status="won";this.state.company.wins++;this.state.company.rep+=({Bronze:1,Silver:2,Gold:4,Platinum:7}[score.rating]||1);
      this.open("Contract Complete",`<article class="card"><h3>${score.rating.toUpperCase()} PERFORMANCE</h3><p>Contract profit ${formatMoney(score.profit)}</p><button data-next>CHOOSE NEXT CONTRACT</button></article>`);
      this.modal.querySelector("[data-next]").onclick=()=>this.contractBoard();
      return;
    }
    if(this.state.contract.extUsed<CONFIG.MAX_EXTENSIONS){
      const n=this.state.contract.extUsed+1,fee=25000*n*this.state.contract.tier;
      this.open("Contract Deadline Missed",`<article class="card"><h3>Objectives not met</h3><p>Extension ${n} of ${CONFIG.MAX_EXTENSIONS}</p><div class="effect warn">Fee ${formatMoney(fee)}</div><button data-ext>BUY 1-YEAR EXTENSION</button></article>`);
      this.modal.querySelector("[data-ext]").onclick=()=>{
        if(this.contracts.extend(this.state)){this.modal.classList.add("hidden");this.state.speed=1;this.syncSpeed();}
      };
    }else{
      this.state.status="failed";
      this.open("Contract Failed",`<article class="card"><h3 class="bad">CHARTER TERMINATED</h3><p>The objectives were not achieved within the permitted extensions.</p></article>`);
    }
  }

  contractBoard(){
    const tier=this.state.company.wins+1,options=this.contracts.options(tier);
    const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
    this.open(`Contract Board — Tier ${tier}`,`<div class="choice5">${options.map((c,i)=>{
      const a=this.contracts.archetype(c);
      return `<article class="card"><h3>${c.name}</h3><p>${c.desc}</p>
        <div class="tiny">Food <span class="stars">${stars(a.foodStars)}</span></div>
        <div class="tiny">Ore <span class="stars">${stars(a.oreStars)}</span></div>
        <div class="tiny">Survey <span class="stars">${stars(a.surveyStars)}</span></div>
        <div class="effect">Advance ${formatMoney(c.advance)}</div><button data-contract="${i}">ACCEPT</button></article>`;
    }).join("")}</div>`);
    this.modal.querySelectorAll("[data-contract]").forEach(button=>button.onclick=()=>{
      this.onNewContract(options[+button.dataset.contract]);
      this.modal.classList.add("hidden");
    });
  }

  render(){
    const s=this.state,c=s.contract,g=c.goals,m=s.metrics;
    const deadline=c.years+c.ext,elapsed=(s.year-1)+(s.day-1)/CONFIG.DAYS_PER_YEAR;
    document.querySelector("#contractName").textContent=c.name;
    document.querySelector("#timeBar").style.width=`${clamp(elapsed/deadline*100,0,100)}%`;
    document.querySelector("#dateText").textContent=`Y${s.year} • D${s.day} / ${deadline}Y`;

    const goal=(prefix,value,target)=>{
      document.querySelector(`#${prefix}Val`).textContent=formatNumber(value);
      document.querySelector(`#${prefix}Goal`).textContent=`${formatNumber(value)} / ${formatNumber(target)}`;
      document.querySelector(`#${prefix}Bar`).style.width=`${clamp(value/target*100,0,100)}%`;
    };
    goal("food",m.food,g.food);goal("ind",m.industry,g.industry);goal("pop",s.pop,g.pop);

    document.querySelector("#cash").textContent=formatMoney(s.company.cash);
    document.querySelector("#income").textContent=`${formatMoney(m.income)}/y`;
    document.querySelector("#surveyLv").textContent=`Lv${m.sl} • ${this.survey.slots(s)}S`;
    document.querySelector("#foodMult").textContent=`×${m.fm.toFixed(3)}`;
    document.querySelector("#indMult").textContent=`×${m.im.toFixed(3)}`;
    document.querySelector("#rep").textContent=s.company.rep;

    const active=s.scans,queued=s.scanQueue,hud=document.querySelector("#scanHud");
    hud.classList.toggle("hidden",!(active.length||queued.length));
    if(active.length||queued.length){
      document.querySelector("#scanText").textContent=`${active.length}/${this.survey.slots(s)} active • ${queued.length} queued`;
      const progress=active.length?active.reduce((sum,q)=>sum+(1-q.remaining/q.total),0)/active.length:0;
      document.querySelector("#scanBar").style.width=`${clamp(progress*100,0,100)}%`;
    }
  }
}
