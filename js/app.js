import { CONFIG } from "./core/config.js";
import { Diagnostics } from "./core/diagnostics.js";
import { ContractService } from "./domain/contract-service.js";
import { createGameState, normalizeState } from "./domain/game-state.js";
import { ResourceService } from "./domain/resource-service.js";
import { CollectionService } from "./domain/collection-service.js";
import { WorldService } from "./domain/world-service.js";
import { SiteService } from "./domain/site-service.js";
import { TechnologyService } from "./domain/technology-service.js";
import { SurveyService } from "./domain/survey-service.js";
import { SimulationEngine } from "./domain/simulation-engine.js";
import { SaveRepository } from "./persistence/save-repository.js";
import { ResourceIcons } from "./ui/resource-icons.js";
import { WorldView } from "./ui/world-view.js";
import { UIController } from "./ui/ui-controller.js";

class MineITApp {
  constructor(){
    this.diagnostics=new Diagnostics();
    this.contracts=new ContractService();
    this.repo=new SaveRepository(this.diagnostics);
    this.resources=new ResourceService();
    this.collection=new CollectionService(this.resources);
    this.technology=new TechnologyService();
    this.world=new WorldService(this.resources,this.contracts);
    this.sites=new SiteService(this.contracts);
    this.survey=new SurveyService(this.world,this.contracts);
    this.engine=new SimulationEngine(this.resources,this.technology,this.collection);
    this.icons=new ResourceIcons();

    const saved=this.repo.load();
    this.state=normalizeState(saved||createGameState(this.contracts.first()));
    this.technology.recompute(this.state);
    this.engine.recalculate(this.state);
    this.survey.fill(this.state);

    this.ui=new UIController({
      state:this.state,repo:this.repo,resources:this.resources,collection:this.collection,sites:this.sites,technology:this.technology,
      survey:this.survey,contracts:this.contracts,world:this.world,icons:this.icons,diagnostics:this.diagnostics,
      onHardReset:()=>this.hardReset(),onNewContract:contract=>this.startContract(contract)
    });

    this.view=new WorldView({
      state:this.state,world:this.world,survey:this.survey,resources:this.resources,icons:this.icons,
      diagnostics:this.diagnostics,onTap:(x,y)=>this.tap(x,y),onMulti:cells=>this.multi(cells)
    });

    this.accumulator=0;
    this.lastFrame=performance.now();
    this.techArmed=true;
    this.ui.render();this.ui.syncSpeed();
    requestAnimationFrame(now=>this.loop(now));

    addEventListener("error",event=>this.diagnostics.error("window.error",event.error||event.message));
    addEventListener("unhandledrejection",event=>this.diagnostics.error("unhandledrejection",event.reason));
    document.addEventListener("visibilitychange",()=>{if(document.hidden)this.repo.save(this.state)});
  }

  tap(x,y){
    if(x===0&&y===0){this.ui.company();return}
    const tile=this.world.get(this.state,x,y);
    if(!tile.revealed){
      const result=this.survey.enqueue(this.state,x,y);
      if(result.ok){
        this.ui.toast(result.active?`Surveying ${x},${y}...`:`Queued ${x},${y}.`);
        this.view.safeDraw();
      }else this.ui.tile(tile);
      return;
    }
    this.ui.tile(tile);
  }

  multi(cells){
    const count=this.survey.enqueueMany(this.state,cells);
    this.ui.toast(count?`${count} cell${count===1?"":"s"} added to survey queue.`:"No new cells selected.");
    this.view.safeDraw();
  }

  startContract(contract){
    this.contracts.start(this.state,contract);
    this.technology.recompute(this.state);
    this.engine.recalculate(this.state);
    this.view.safeDraw();this.ui.render();this.ui.syncSpeed();
    this.repo.save(this.state);
  }

  hardReset(){
    if(!confirm("Erase all MineIT and old Koplin prototype saves on this browser?")) return;
    this.repo.clearAll();
    const fresh=createGameState(this.contracts.first());
    Object.keys(this.state).forEach(key=>delete this.state[key]);
    Object.assign(this.state,fresh);
    this.technology.recompute(this.state);this.engine.recalculate(this.state);
    this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");
    this.ui.syncSpeed();this.ui.render();this.view.safeDraw();this.repo.save(this.state);
    this.ui.toast("Corporation reset to Year 1 Day 1.");
  }

  checkTechnology(){
    const had=this.state.offers.length>0;
    const changed=this.technology.refreshOffers(this.state);
    if(changed&&!had&&this.state.offers.length&&this.techArmed){
      this.state.speed=0;this.ui.syncSpeed();this.techArmed=false;
      this.ui.toast("New corporate technology available.");
      setTimeout(()=>this.ui.tech(),180);
    }
    if(!this.state.offers.length) this.techArmed=true;
  }

  tick(){
    this.diagnostics.ticks++;this.diagnostics.lastTick=Date.now();

    let discoveries=[];
    try{
      this.engine.tick(this.state);
      discoveries=this.survey.tick(this.state);
      this.engine.recalculate(this.state);
      this.checkTechnology();

      const deadline=this.state.contract.years+this.state.contract.ext;
      if(this.state.status==="playing"&&this.state.year>deadline) this.ui.deadline();

      const absoluteDay=(this.state.year-1)*CONFIG.DAYS_PER_YEAR+this.state.day;
      if(absoluteDay%30===0) this.repo.save(this.state);
    }catch(error){
      this.diagnostics.error("simulation core crashed",error);
      this.state.speed=0;this.ui.syncSpeed();
      return;
    }

    if(discoveries.length){
      try{
        const rare=discoveries.filter(t=>t.quality>=CONFIG.RARE_QUALITY).sort((a,b)=>b.quality-a.quality);
        if(rare.length) this.ui.rare(rare[0]);
        else if(discoveries.length===1) this.ui.toast(`${discoveries[0].name} discovered • Q${Math.round(discoveries[0].quality)}`);
        else this.ui.toast(`${discoveries.length} surveys completed.`);
      }catch(error){ this.diagnostics.error("discovery UI failed",error); }
    }

    try{this.ui.render()}catch(error){this.diagnostics.error("HUD render failed",error)}
    this.view.safeDraw();
  }

  loop(now){
    this.diagnostics.heartbeat++;
    try{
      const delta=Math.min(120,now-this.lastFrame);
      this.lastFrame=now;
      if(this.state.speed>0&&this.state.status==="playing"){
        this.accumulator+=delta*this.state.speed;
        while(this.accumulator>=CONFIG.DAY_MS){
          this.accumulator-=CONFIG.DAY_MS;
          this.tick();
        }
      }
      this.ui.render();
    }catch(error){this.diagnostics.error("animation loop failed",error)}
    requestAnimationFrame(next=>this.loop(next));
  }
}

addEventListener("DOMContentLoaded",()=>{
  try{window.mineIT=new MineITApp()}
  catch(error){
    console.error(error);
    const badge=document.querySelector("#errorBadge");
    if(badge){badge.textContent="STARTUP ERROR";badge.classList.remove("hidden")}
  }
});
