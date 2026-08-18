import { CONFIG } from "./core/config.js";
import { Diagnostics } from "./core/diagnostics.js";
import { ContractService } from "./domain/contract-service.js";
import { createGameState, normalizeState, starterInventory } from "./domain/game-state.js";
import { ResourceService } from "./domain/resource-service.js";
import { InventoryService } from "./domain/inventory-service.js";
import { CollectionService } from "./domain/collection-service.js";
import { ColonyService } from "./domain/colony-service.js";
import { TradeService } from "./domain/trade-service.js";
import { WorldService } from "./domain/world-service.js";
import { SiteService } from "./domain/site-service.js";
import { TechnologyService } from "./domain/technology-service.js";
import { SurveyService } from "./domain/survey-service.js";
import { SimulationEngine } from "./domain/simulation-engine.js";
import { SaveRepository } from "./persistence/save-repository.js";
import { ResourceIcons } from "./ui/resource-icons.js";
import { WorldView } from "./ui/world-view.js";
import { UIController } from "./ui/ui-controller.js";
import { TradeUI } from "./ui/trade-ui.js";
class MineITApp{
  constructor(){
    this.diagnostics=new Diagnostics();this.contracts=new ContractService();this.repo=new SaveRepository(this.diagnostics);this.resources=new ResourceService();this.inventory=new InventoryService(this.resources);this.technology=new TechnologyService();this.collection=new CollectionService(this.resources,this.inventory,this.technology);this.colony=new ColonyService(this.inventory,this.technology);this.trade=new TradeService(this.resources,this.inventory);this.world=new WorldService(this.resources,this.contracts);this.sites=new SiteService(this.contracts,this.technology,this.inventory);this.survey=new SurveyService(this.world,this.contracts);this.engine=new SimulationEngine(this.resources,this.technology,this.collection,this.trade,this.inventory,this.colony);this.icons=new ResourceIcons();
    const saved=this.repo.load();this.state=normalizeState(saved||createGameState(this.contracts.first()));this.technology.recompute(this.state);this.engine.recalculate(this.state);this.survey.fill(this.state);
    this.ui=new UIController({state:this.state,repo:this.repo,resources:this.resources,inventory:this.inventory,collection:this.collection,colony:this.colony,sites:this.sites,technology:this.technology,survey:this.survey,contracts:this.contracts,world:this.world,icons:this.icons,diagnostics:this.diagnostics,onHardReset:()=>this.hardReset(),onNewContract:c=>this.startContract(c),onRecalculate:()=>this.engine.recalculate(this.state)});
    this.tradeUI=new TradeUI({state:this.state,trade:this.trade,repo:this.repo,ui:this.ui});
    this.view=new WorldView({state:this.state,world:this.world,survey:this.survey,resources:this.resources,icons:this.icons,diagnostics:this.diagnostics,onTap:(x,y)=>this.tap(x,y),onMulti:cells=>this.multi(cells)});
    this.accumulator=0;this.lastFrame=performance.now();this.ui.render();this.tradeUI.render();this.ui.syncSpeed();requestAnimationFrame(now=>this.loop(now));addEventListener("error",e=>this.diagnostics.error("window.error",e.error||e.message));addEventListener("unhandledrejection",e=>this.diagnostics.error("unhandledrejection",e.reason));document.addEventListener("visibilitychange",()=>{if(document.hidden)this.repo.save(this.state)});
  }
  tap(x,y){if(x===0&&y===0){this.ui.company();return}const tile=this.world.get(this.state,x,y);if(!tile.revealed){const r=this.survey.enqueue(this.state,x,y);if(r.ok){this.ui.toast(r.active?`Surveying ${x},${y}...`:`Queued ${x},${y}.`);this.view.safeDraw()}else this.ui.tile(tile);return}this.ui.tile(tile);}
  multi(cells){const n=this.survey.enqueueMany(this.state,cells);this.ui.toast(n?`${n} cell${n===1?"":"s"} added to survey queue.`:"No new cells selected.");this.view.safeDraw();}
  startContract(contract){this.contracts.start(this.state,contract);this.state.inventory=starterInventory();this.state.colony={housingCapacity:CONFIG.START_HOUSING,housingLevel:1,industryLevel:CONFIG.START_INDUSTRY_LEVEL};this.state.trade={active:false,nextArrivalDay:CONFIG.FIRST_TRADE_DAY,visits:0,returnSpeed:1,arrivedAt:null};this.technology.recompute(this.state);this.engine.recalculate(this.state);this.view.safeDraw();this.ui.render();this.tradeUI.render();this.ui.syncSpeed();this.repo.save(this.state);}
  hardReset(){if(!confirm("Erase all MineIT saves on this browser?"))return;this.repo.clearAll();const fresh=createGameState(this.contracts.first());Object.keys(this.state).forEach(k=>delete this.state[k]);Object.assign(this.state,fresh);this.technology.recompute(this.state);this.engine.recalculate(this.state);this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.ui.syncSpeed();this.ui.render();this.tradeUI.render();this.view.safeDraw();this.repo.save(this.state);this.ui.toast("Corporation reset to Year 1 Day 1.");}
  tick(){this.diagnostics.ticks++;this.diagnostics.lastTick=Date.now();let discoveries=[],shipArrived=false;try{this.engine.tick(this.state);discoveries=this.survey.tick(this.state);this.engine.recalculate(this.state);if(this.trade.shouldArrive(this.state)){shipArrived=this.trade.arrive(this.state);this.engine.recalculate(this.state)}const deadline=this.state.contract.years+this.state.contract.ext;if(this.state.status==="playing"&&this.state.year>deadline)this.ui.deadline();const absoluteDay=(this.state.year-1)*CONFIG.DAYS_PER_YEAR+this.state.day;if(absoluteDay%30===0)this.repo.save(this.state)}catch(error){this.diagnostics.error("simulation core crashed",error);this.state.speed=0;this.ui.syncSpeed();return}if(shipArrived){try{this.tradeUI.open()}catch(e){this.diagnostics.error("trade ship UI failed",e)}}else if(discoveries.length){try{const rare=discoveries.filter(t=>t.quality>=CONFIG.RARE_QUALITY).sort((a,b)=>b.quality-a.quality);if(rare.length)this.ui.rare(rare[0]);else if(discoveries.length===1)this.ui.toast(`${discoveries[0].name} discovered • Q${Math.round(discoveries[0].quality)}`);else this.ui.toast(`${discoveries.length} surveys completed.`)}catch(e){this.diagnostics.error("discovery UI failed",e)}}try{this.ui.render();this.tradeUI.render()}catch(e){this.diagnostics.error("HUD render failed",e)}this.view.safeDraw();}
  loop(now){this.diagnostics.heartbeat++;try{const delta=Math.min(120,now-this.lastFrame);this.lastFrame=now;if(this.state.speed>0&&this.state.status==="playing"){this.accumulator+=delta*this.state.speed;while(this.accumulator>=CONFIG.DAY_MS){this.accumulator-=CONFIG.DAY_MS;this.tick()}}this.ui.render();this.tradeUI.render()}catch(e){this.diagnostics.error("animation loop failed",e)}requestAnimationFrame(next=>this.loop(next));}
}
addEventListener("DOMContentLoaded",()=>{try{window.mineIT=new MineITApp()}catch(error){console.error(error);const badge=document.querySelector("#errorBadge");if(badge){badge.textContent="STARTUP ERROR";badge.classList.remove("hidden")}}});
