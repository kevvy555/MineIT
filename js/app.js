import { CONFIG } from "./core/config.js";
import { Diagnostics } from "./core/diagnostics.js";
import { ContractService } from "./domain/contract-service.js";
import { CorporateEventService } from "./domain/corporate-event-service.js";
import { createGameState, normalizeState } from "./domain/game-state-runtime.js";
import { PortfolioService } from "./domain/portfolio-service.js";
import { ResourceService } from "./domain/resource-service.js";
import { InventoryService } from "./domain/inventory-service.js";
import { CollectionService } from "./domain/collection-service.js";
import { ColonyService } from "./domain/colony-service.js";
import { TradeService } from "./domain/trade-service.js";
import { LandService } from "./domain/land-service.js";
import { DevelopmentService } from "./domain/development-service.js";
import { WorldService } from "./domain/world-service.js";
import { SiteService } from "./domain/site-service.js";
import { TechnologyService } from "./domain/technology-service.js";
import { SurveyService } from "./domain/survey-service.js";
import { SimulationEngine } from "./domain/simulation-engine.js";
import { GameLogService } from "./domain/game-log-service.js";
import { TransportService } from "./domain/transport-service.js";
import { SaveRepository } from "./persistence/save-repository.js";
import { ResourceIcons } from "./ui/resource-icons.js";
import { WorldView } from "./ui/world-view-runtime.js";
import { UIController } from "./ui/ship-preparation-ui.js";
import { TradeUI } from "./ui/corporate-trade-ui.js";

let bootApp=null;

class MineITApp {
  constructor(){
    this.diagnostics=new Diagnostics();
    bootApp=this;
    addEventListener("error",e=>this.diagnostics.error("window.error",e.error||e.message));
    addEventListener("unhandledrejection",e=>this.diagnostics.error("unhandledrejection",e.reason));

    this.contracts=new ContractService();
    this.repo=new SaveRepository(this.diagnostics);
    this.resources=new ResourceService();
    this.inventory=new InventoryService(this.resources);
    this.technology=new TechnologyService();
    this.collection=new CollectionService(this.resources,this.inventory,this.technology);
    this.colony=new ColonyService(this.inventory,this.technology);
    this.trade=new TradeService(this.resources,this.inventory);
    this.events=new CorporateEventService(this.contracts,this.trade);
    this.land=new LandService();
    this.development=new DevelopmentService(this.inventory,this.land);
    this.world=new WorldService(this.resources,this.contracts,this.land);
    this.sites=new SiteService(this.contracts,this.technology,this.inventory,this.colony,this.resources);
    this.survey=new SurveyService(this.world,this.contracts);
    this.engine=new SimulationEngine(this.resources,this.technology,this.collection,this.trade,this.inventory,this.colony);
    this.portfolio=new PortfolioService();
    this.gameLog=new GameLogService();
    this.transport=new TransportService();
    this.icons=new ResourceIcons();

    const saved=this.repo.load();
    this.state=normalizeState(saved||createGameState(this.contracts.first()));
    this.events.ensure(this.state.company);
    this.portfolio.ensure(this.state);
    this.land.ensure(this.state);
    this.development.sync(this.state);
    this.portfolio.captureActive(this.state,true);
    this.gameLog.ensure(this.state);
    if(!this.state.gameLog.events.length)this.gameLog.event(this.state,saved?"save-migrated":"corporation-founded",saved?"Save migrated to the synchronized v5.5 colony-land corporation simulation.":"Mining corporation founded and Contract 01 established.",{build:"5.8.1",saveVersion:this.state.version});
    this.repo.setBeforeSave(()=>this.portfolio.captureActive(this.state,true));
    this.prepareActive();

    this.afterEventQueueAction=null;
    this.ui=new UIController({
      state:this.state,repo:this.repo,resources:this.resources,inventory:this.inventory,collection:this.collection,colony:this.colony,portfolio:this.portfolio,sites:this.sites,technology:this.technology,survey:this.survey,contracts:this.contracts,world:this.world,icons:this.icons,diagnostics:this.diagnostics,transport:this.transport,gameLog:this.gameLog,land:this.land,development:this.development,
      onHardReset:()=>this.hardReset(),
      onNewContract:c=>this.addColony(c),
      onSwitchColony:id=>this.switchColony(id),
      onRemoveColony:mode=>this.removeColony(mode),
      onMakeLiability:()=>this.makeLiability(),
      onRelocateColony:()=>this.relocateColony(),
      onRecalculate:()=>{this.development.sync(this.state);this.engine.recalculate(this.state);this.view?.safeDraw();},
      onCapturePortfolio:()=>this.portfolio.captureActive(this.state,true),
      onSelectLand:(index,options)=>this.selectLand(index,options),
      onPlaceDevelopment:(tile,kind)=>this.placeDevelopment(tile,kind),
      onDemolishDevelopment:tile=>this.demolishDevelopment(tile),
      onContractDecisionResolved:action=>this.resolveContractDecision(action),
      onProcessPendingEvent:()=>this.processPendingCorporateEvent(),
      onMapFocus:mode=>this.view?.setFocus(mode)
    });
    this.tradeUI=new TradeUI({state:this.state,trade:this.trade,repo:this.repo,ui:this.ui,gameLog:this.gameLog,onDepart:()=>this.onShipDepart()});
    this.view=new WorldView({state:this.state,world:this.world,survey:this.survey,resources:this.resources,technology:this.technology,icons:this.icons,diagnostics:this.diagnostics,land:this.land,onTap:(x,y)=>this.tap(x,y),onMulti:cells=>this.multi(cells),onInspect:(x,y)=>this.inspect(x,y),onSelect:(x,y)=>this.ui.selectMapTile(x,y),onPlayerShipClick:()=>this.ui.playerShipPanel()});

    this.accumulator=0;
    this.lastFrame=performance.now();
    this.lastHudFrame=0;
    this.renderAll();
    requestAnimationFrame(now=>this.loop(now));
    document.addEventListener("visibilitychange",()=>{if(document.hidden)this.repo.save(this.state)});
    queueMicrotask(()=>{
      this.reconcileCorporateEvents();
      if(this.state.company.gameOver)this.ui.gameOver?.();
      else if(this.state.company.pendingEvents?.length)this.beginCorporateEventQueueIfNeeded(this.state.speed);
      else if(this.state.status==="site-selection")this.ui.landSelection();
      else this.checkInitialDeadline();
    });
  }

  absoluteDay(){return(this.state.year-1)*CONFIG.DAYS_PER_YEAR+this.state.day;}
  advanceGlobalDate(){this.state.day++;if(this.state.day>CONFIG.DAYS_PER_YEAR){this.state.day=1;this.state.year++;}}
  prepareActive(){this.land.ensure(this.state);this.development.sync(this.state);this.technology.recompute(this.state);this.engine.recalculate(this.state);if(this.state.status!=="site-selection"&&this.state.status!=="contract-decision")this.survey.fill(this.state);}
  renderAll(){this.ui?.render();this.tradeUI?.render();this.ui?.syncSpeed();this.view?.syncView?.();this.view?.safeDraw();}
  inspect(x,y){if(this.state.status==="site-selection"){this.ui.landSelection();return;}const tile=this.world.get(this.state,x,y);this.ui.landTile(tile);}

  tap(x,y){
    if(this.state.status==="site-selection"){this.ui.landSelection();return;}
    if(this.land.isShipTile(x,y)){this.ui.company();return;}
    const tile=this.world.get(this.state,x,y);
    if(!tile.revealed){
      const r=this.survey.enqueue(this.state,x,y);
      if(r.ok){this.ui.toast(r.active?`Surveying ${x},${y}...`:`Queued ${x},${y}.`);this.view.safeDraw();}
      else this.ui.landTile(tile);
      return;
    }
    if(tile.development?.kind==="housing"||tile.development?.kind==="industry"){
      const before=tile.development.level,cash=this.state.company.cash,r=this.development.upgrade(this.state,tile);
      if(r.ok){this.prepareActive();this.gameLog.event(this.state,"land-development-upgraded",`${this.development.label(tile.development.kind)} at ${tile.x},${tile.y} upgraded to L${tile.development.level}.`,{x:tile.x,y:tile.y,kind:tile.development.kind,fromLevel:before,level:tile.development.level,cost:cash-this.state.company.cash,build:r.build});this.repo.save(this.state);this.ui.toast(`${this.development.label(tile.development.kind)} upgraded to L${tile.development.level}.`);this.view.safeDraw();}
      else this.ui.toast(r.reason);
      return;
    }
    if(tile.resourceId&&!tile.resourceCovered){
      const beforeLevel=Math.max(0,Number(tile.level)||0),cash=this.state.company.cash,r=tile.developed?this.sites.upgrade(this.state,tile):this.sites.develop(this.state,tile);
      if(r.ok){this.land.syncExtraction(tile,r.build);this.prepareActive();this.gameLog.event(this.state,beforeLevel?"site-upgraded":"site-developed",beforeLevel?`${tile.name} upgraded to L${tile.level}.`:`${tile.name} site developed at ${tile.x},${tile.y}.`,{x:tile.x,y:tile.y,resource:tile.name,type:tile.type,quality:tile.quality,size:tile.depositScale||tile.abundanceLabel,level:tile.level,terrain:tile.terrain,workers:this.colony.siteWorkforce(this.state,tile),cashCost:cash-this.state.company.cash,buildCost:r.build});this.repo.save(this.state);this.ui.toast(`${tile.name} ${tile.level===1?"developed":`upgraded to L${tile.level}`}.`);this.view.safeDraw();}
      else this.ui.toast(r.reason);
      return;
    }
    this.ui.buildChoice(tile);
  }

  multi(cells){const n=this.survey.enqueueMany(this.state,cells);this.ui.toast(n?`${n} cell${n===1?"":"s"} added to survey queue.`:this.state.contract.ended?"Mining contract ended; surveying is disabled.":"No new cells selected.");this.view.safeDraw();}

  selectLand(index,{abandon=false}={}){
    const from=this.state.colony?.land?.selectedIndex,result=this.land.settle(this.state,index,{abandon});
    if(!result.ok){this.ui.toast(result.reason);return false;}
    this.prepareActive();
    this.gameLog.event(this.state,abandon?"landing-site-relocated":"landing-site-selected",abandon?`${this.state.contract.colonyName} abandoned landing site ${Number(from)+1} and relocated to site ${index+1}.`:`${this.state.contract.colonyName} established landing site ${index+1}.`,{fromIndex:from,toIndex:index,abandon,moves:this.state.colony.land.moves||0});
    this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.portfolio.captureActive(this.state,true);this.renderAll();this.repo.save(this.state);
    this.ui.toast(abandon?`Relocated to landing site ${index+1}. Most local stock and all development were left behind.`:`Landing site ${index+1} established. Survey the land to find resources and building space.`);
    return true;
  }

  placeDevelopment(tile,kind){
    const coveredResource=tile.resourceId?{name:tile.name,type:tile.type,resourceId:tile.resourceId,quality:tile.quality}:null,cash=this.state.company.cash,r=this.development.place(this.state,tile,kind);
    if(!r.ok){this.ui.toast(r.reason);return false;}
    this.prepareActive();
    this.gameLog.event(this.state,"land-development-built",`${this.development.label(kind)} L1 constructed at ${tile.x},${tile.y}.`,{x:tile.x,y:tile.y,kind,terrain:tile.terrain,cashCost:cash-this.state.company.cash,buildCost:r.build,coversResource:r.coversResource,destroyedFood:r.destroyedFood,resource:coveredResource});
    this.ui.modal.classList.add("hidden");this.repo.save(this.state);this.renderAll();
    this.ui.toast(`${this.development.label(kind)} L1 constructed${r.destroyedFood?" • natural Food resource destroyed":r.coversResource?" over the known resource":""}.`);
    return true;
  }

  demolishDevelopment(tile){
    const before=tile.development?{...tile.development}:null,r=this.development.demolish(this.state,tile);
    if(!r.ok){this.ui.toast(r.reason);return false;}
    this.prepareActive();
    this.gameLog.event(this.state,"land-development-demolished",`${this.development.label(before?.kind)} at ${tile.x},${tile.y} demolished.`,{x:tile.x,y:tile.y,kind:before?.kind,level:before?.level,recoveredBuild:r.recover});
    this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.repo.save(this.state);this.renderAll();
    this.ui.toast(`Development demolished${r.recover?` • ${r.recover} Build recovered`:""}.`);
    return true;
  }

  addColony(contract){
    if(this.state.company.pendingEvents?.length){this.ui.toast("Resolve the pending corporate event first.");return false;}
    if(this.state.company.gameOver){this.ui.toast("This corporation has ended. Start a new corporation to continue.");return false;}
    if(!this.technology.meetsRequirements(this.state,contract.requiredTech)){this.ui.toast("Technology requirements not met.");return false;}
    const entry=this.portfolio.addColony(this.state,contract);
    this.land.ensure(this.state);this.development.sync(this.state);this.prepareActive();
    this.gameLog.event(this.state,"colony-established",`${this.state.contract.colonyName} established: ${this.state.contract.name}.`,{colonyId:entry.id,environment:this.state.contract.environment,tier:this.state.contract.colonyTier,advance:this.state.contract.advance});
    this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.renderAll();this.repo.save(this.state);this.ui.landSelection();
    return true;
  }

  switchColony(id,force=false){
    const pending=this.events.sort(this.state.company)[0];
    if(pending&&!force&&id!==pending.colonyId){this.ui.toast(`Resolve the pending ${pending.type==="ship"?"corporate ship":"contract decision"} for ${pending.colonyName||"the current colony"} first.`);return false;}
    if(!this.portfolio.switchTo(this.state,id)){this.ui.toast("Colony could not be loaded.");return false;}
    this.prepareActive();this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.renderAll();this.repo.save(this.state);
    if(!force){
      if(this.state.status==="site-selection")this.ui.landSelection();
      else if(this.state.status==="dead")this.ui.colonyPanel();
      else if(this.state.status==="contract-decision")this.processPendingCorporateEvent();
      else if(this.state.status==="deadline-missed")this.ui.deadline("extension");
      else if(this.state.status==="failed")this.ui.deadline("failed");
    }
    return true;
  }

  clearEventsForColony(colonyId){this.events.removeForColony(this.state.company,colonyId);}
  eventQueueActive(){return this.state.company.eventReturnColonyId!==null&&this.state.company.eventReturnColonyId!==undefined||!!this.state.company.pendingEvents?.length;}

  removeColony(mode="corporate-return"){
    const oldName=this.state.contract.colonyName,oldId=this.state.colonyId;
    this.clearEventsForColony(oldId);
    delete this.state.contract.pendingDecision;delete this.state.contract.pendingDecisionPreviousStatus;
    const result=this.portfolio.removeActive(this.state);
    if(!result.ok){this.ui.toast(result.reason);return false;}
    this.gameLog.event(this.state,mode==="abandon-dead"?"dead-colony-abandoned":"colony-returned",mode==="abandon-dead"?`${oldName} dead-colony record abandoned.`:`${oldName} returned to the corporation.`,{removedColonyId:oldId},oldId,oldName);
    this.prepareActive();this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.renderAll();this.repo.save(this.state);
    this.ui.toast(mode==="abandon-dead"?"Dead colony record abandoned.":"Colony returned to the corporation.");
    if(this.eventQueueActive())this.continueCorporateEventQueue();else this.ui.coloniesPanel();
    return true;
  }

  makeLiability(){
    const oldId=this.state.colonyId;this.events.removeForColony(this.state.company,oldId,"contract");delete this.state.contract.pendingDecision;delete this.state.contract.pendingDecisionPreviousStatus;
    this.contracts.endAsLiability(this.state);
    this.gameLog.event(this.state,"liability-colony",`${this.state.contract.colonyName} mining rights ended; colony became a support liability.`,{});
    this.prepareActive();this.repo.save(this.state);this.renderAll();this.ui.toast("Contract ended. Colony remains your responsibility and can still be lost if life support fails.");
    if(this.eventQueueActive())this.continueCorporateEventQueue();
  }

  relocateColony(){
    const cost=this.colony.relocationCost(this.state);
    if(this.state.portfolio.colonies.length<=1){this.ui.toast("Open another colony before disposing of your final colony.");return false;}
    if(this.state.company.cash<cost){this.ui.toast(`Relocation requires £${Math.round(cost).toLocaleString()}.`);return false;}
    const oldName=this.state.contract.colonyName,oldId=this.state.colonyId,pop=this.state.pop;
    this.events.removeForColony(this.state.company,oldId);delete this.state.contract.pendingDecision;delete this.state.contract.pendingDecisionPreviousStatus;
    this.state.company.cash-=cost;
    const result=this.portfolio.removeActive(this.state);
    if(!result.ok){this.state.company.cash+=cost;this.ui.toast(result.reason);return false;}
    this.gameLog.event(this.state,"colony-relocated",`${formatNumberSafe(pop)} colonists relocated from ${oldName}; colony closed.`,{removedColonyId:oldId,population:pop,cost},oldId,oldName);
    this.prepareActive();this.renderAll();this.repo.save(this.state);this.ui.toast("Population relocated and colony closed.");
    if(this.eventQueueActive())this.continueCorporateEventQueue();else this.ui.coloniesPanel();
    return true;
  }

  hardReset(){
    if(!confirm("Erase all MineIT saves on this browser?"))return;
    this.repo.clearAll();const fresh=createGameState(this.contracts.first());Object.keys(this.state).forEach(k=>delete this.state[k]);Object.assign(this.state,fresh);this.events.ensure(this.state.company);this.afterEventQueueAction=null;
    this.portfolio.ensure(this.state);this.land.ensure(this.state);this.development.sync(this.state);this.portfolio.captureActive(this.state,true);this.gameLog.ensure(this.state);
    this.gameLog.event(this.state,"corporation-founded","Mining corporation reset and Contract 01 established.",{build:"5.8.1"});
    this.prepareActive();this.ui.modal.classList.add("hidden");this.ui.tilePanel.classList.add("hidden");this.renderAll();this.repo.save(this.state);this.ui.landSelection();
  }

  logSimulationEvents(local,result,entryName){
    for(const {tile,event} of result.renewableEvents||[])this.gameLog.event(local,`renewable-${event.kind}`,event.kind==="wiped"?`${tile.name} at ${tile.x},${tile.y} was wiped out by over-farming.`:`${tile.name} at ${tile.x},${tile.y} changed from ${event.from} to ${event.to}.`,{x:tile.x,y:tile.y,resource:tile.name,from:event.from,to:event.to,harvestIntensity:tile.harvestIntensity},local.colonyId,entryName);
    for(const tile of result.depletedSites||[])this.gameLog.event(local,"deposit-depleted",`${tile.name} deposit at ${tile.x},${tile.y} was depleted.`,{x:tile.x,y:tile.y,resource:tile.name,quality:tile.quality,size:tile.depositScale},local.colonyId,entryName);
    if((result.deaths||0)>0)this.gameLog.event(local,"population-deaths",`${formatNumberSafe(result.deaths)} colonists died during a survival shortage.`,{deaths:result.deaths,population:local.pop,survivalSupply:local.metrics.survivalSupply},local.colonyId,entryName);
    if(result.colonyDied)this.gameLog.event(local,"colony-lost",`${entryName||local.contract.colonyName} was lost after population reached zero.`,{population:0,industryLevel:local.colony.industryLevel},local.colonyId,entryName);
  }

  advanceColony(local,entryName){
    this.land.ensure(local);this.development.sync(local);
    if(!this.contracts.isOperating(local))return{discoveries:[],died:false};
    const tickResult=this.engine.tick(local);this.engine.recalculate(local);this.logSimulationEvents(local,tickResult,entryName);
    if(tickResult.colonyDied)return{discoveries:[],died:true,deaths:tickResult.deaths};
    const discoveries=local.contract.ended?[]:this.survey.tick(local);
    for(const tile of discoveries){
      if(tile.resourceId)this.gameLog.event(local,"survey-discovery",`${tile.name} discovered at ${tile.x},${tile.y} • Q${Math.round(tile.quality)} • ${tile.depositScale||tile.abundanceLabel}.`,{x:tile.x,y:tile.y,resource:tile.name,type:tile.type,quality:tile.quality,size:tile.depositScale||tile.abundanceLabel,miningLevel:tile.requiredMiningLevel,terrain:tile.terrain},local.colonyId,entryName);
      else this.gameLog.event(local,"terrain-survey",`${this.land.terrainLabel(tile.terrain)} surveyed at ${tile.x},${tile.y}; no exploitable surface resource found.`,{x:tile.x,y:tile.y,terrain:tile.terrain,deepSignal:!!tile.deepResource},local.colonyId,entryName);
    }
    this.engine.recalculate(local);return{discoveries,died:false,deaths:tickResult.deaths};
  }

  queueContractDecision(local,kind,entryName,{recovered=false}={}){
    const event=this.events.queueContract(local,entryName,kind,{recovered});
    if(event)this.gameLog.event(local,"contract-decision-required",`${entryName} requires a contract decision: ${kind}.`,{kind,recovered:!!recovered},local.colonyId,entryName);
    return event;
  }

  resolveBackgroundDeadline(local,kind,entryName){return this.queueContractDecision(local,kind,entryName);}

  processScheduledFor(local,entryName,isActive=false){
    const arrivals=this.transport.processArrivals(local);
    for(const order of arrivals)this.gameLog.event(local,"transport-arrived",`Dedicated transport delivered ${formatNumberSafe(order.amount)} colonists to ${entryName}.`,{quantity:order.amount,cost:order.cost,population:local.pop,orderId:order.id},local.colonyId,entryName);
    this.engine.recalculate(local);

    const deadline=this.contracts.deadlineState(local),shipDue=this.trade.shouldArrive(local);
    if(deadline)this.queueContractDecision(local,deadline,entryName);
    if(shipDue){
      this.trade.arrive(local);
      this.events.queueShip(local,entryName,{recovered:false});
      this.gameLog.event(local,"ship-arrived",`Corporate trade ship arrived at ${entryName}.`,{visit:local.trade.visits,importCapacity:this.trade.cargoCapacity(local),exportCapacity:this.trade.exportCapacity(local)},local.colonyId,entryName);
    }
  }

  collectShipEventsAndScheduled(){
    this.processScheduledFor(this.state,this.state.contract.colonyName,true);
    this.portfolio.captureActive(this.state,true);
    this.portfolio.simulateInactive(this.state,(temp,entry)=>this.processScheduledFor(temp,temp.contract?.colonyName||entry.name,false));
    this.portfolio.captureActive(this.state,true);
    this.events.sort(this.state.company);
  }

  reconcileCorporateEvents(){
    const company=this.state.company,originalSpeed=this.state.speed;
    this.events.ensure(company);this.portfolio.captureActive(this.state,true);
    const ids=this.state.portfolio.colonies.map(entry=>entry.id);
    this.events.sanitize(company,ids);
    for(const event of company.pendingEvents)if(event.type==="ship")event.recovered=true;

    const recover=(local,name)=>{
      const beforeShip=!!local.trade?.active,beforeDecision=local.contract?.pendingDecision||null;
      const recovered=this.events.recoverLocal(local,name);
      if(!beforeShip&&local.trade?.active)this.gameLog.event(local,"ship-arrived",`Corporate trade ship recovered/arrived at ${name}.`,{visit:local.trade.visits,recovered:true},local.colonyId,name);
      const decision=local.contract?.pendingDecision;
      if(decision&&!beforeDecision)this.gameLog.event(local,"contract-decision-required",`${name} requires a recovered contract decision: ${decision}.`,{kind:decision,recovered:true},local.colonyId,name);
      return recovered;
    };

    recover(this.state,this.state.contract?.colonyName||"Colony");
    this.portfolio.captureActive(this.state,true);
    this.portfolio.simulateInactive(this.state,(temp,entry)=>recover(temp,temp.contract?.colonyName||entry.name));
    this.portfolio.captureActive(this.state,true);
    this.events.sort(company);

    if(company.pendingEvents.length&&company.eventReturnColonyId==null){
      company.eventReturnColonyId=this.state.portfolio.activeColonyId;
      company.eventResumeSpeed=Number.isFinite(Number(originalSpeed))?Number(originalSpeed):1;
      this.state.speed=0;
    }
    if(company.pendingEvents.length)this.repo.save(this.state);
    return company.pendingEvents.length;
  }

  beginCorporateEventQueueIfNeeded(previousSpeed){
    const queue=this.events.sort(this.state.company);if(!queue.length)return false;
    if(this.state.company.eventReturnColonyId==null){
      this.state.company.eventReturnColonyId=this.state.portfolio.activeColonyId;
      this.state.company.eventResumeSpeed=Number.isFinite(Number(previousSpeed))?Number(previousSpeed):1;
    }
    this.state.speed=0;this.repo.save(this.state);this.processPendingCorporateEvent();return true;
  }
  beginShipQueueIfNeeded(previousSpeed){return this.beginCorporateEventQueueIfNeeded(previousSpeed);}

  processPendingCorporateEvent(){
    const event=this.events.sort(this.state.company)[0];if(!event)return false;
    this.state.speed=0;
    if(this.state.portfolio.activeColonyId!==event.colonyId&&!this.switchColony(event.colonyId,true)){
      this.events.remove(this.state.company,event);return this.processPendingCorporateEvent();
    }
    if(event.type==="ship"){
      if(!this.state.trade.active){this.events.remove(this.state.company,event);return this.processPendingCorporateEvent();}
      this.renderAll();this.tradeUI.open();return true;
    }
    if(event.type==="contract"){
      const kind=event.kind||this.state.contract?.pendingDecision;
      if(!kind){this.events.remove(this.state.company,event);return this.processPendingCorporateEvent();}
      this.state.contract.pendingDecision=kind;this.state.status="contract-decision";this.renderAll();this.ui.deadline(kind);return true;
    }
    this.events.remove(this.state.company,event);return this.processPendingCorporateEvent();
  }
  processPendingShipEvent(){return this.processPendingCorporateEvent();}

  resolveContractDecision(action="resolved"){
    const event=this.events.sort(this.state.company).find(e=>e.type==="contract"&&e.colonyId===this.state.colonyId);
    if(!event)return false;
    delete this.state.contract.pendingDecision;delete this.state.contract.pendingDecisionPreviousStatus;
    this.events.remove(this.state.company,event);this.portfolio.captureActive(this.state,true);
    this.gameLog.event(this.state,"contract-decision-resolved",`${this.state.contract.colonyName} contract decision resolved: ${action}.`,{kind:event.kind,action},this.state.colonyId,this.state.contract.colonyName);
    if(action==="new-colony")this.afterEventQueueAction="new-colony";
    this.repo.save(this.state);this.continueCorporateEventQueue();return true;
  }

  continueCorporateEventQueue(){
    if(this.events.sort(this.state.company).length){this.state.speed=0;this.repo.save(this.state);queueMicrotask(()=>this.processPendingCorporateEvent());return;}
    this.finishCorporateEventQueue();
  }

  finishCorporateEventQueue(){
    const company=this.state.company,returnId=company.eventReturnColonyId,resume=Number.isFinite(Number(company.eventResumeSpeed))?Number(company.eventResumeSpeed):1;
    company.eventReturnColonyId=null;company.eventResumeSpeed=1;
    if(returnId&&this.state.portfolio.colonies.some(e=>e.id===returnId)&&returnId!==this.state.portfolio.activeColonyId)this.switchColony(returnId,true);
    this.state.speed=company.gameOver?0:resume;this.renderAll();this.repo.save(this.state);
    const after=this.afterEventQueueAction;this.afterEventQueueAction=null;
    if(after==="new-colony")queueMicrotask(()=>this.ui.contractBoard());
  }

  onShipDepart(){
    const current=this.events.sort(this.state.company).find(e=>e.type==="ship"&&e.colonyId===this.state.colonyId);
    if(current)this.events.remove(this.state.company,current);
    this.portfolio.captureActive(this.state,true);this.repo.save(this.state);this.continueCorporateEventQueue();
  }

  checkInitialDeadline(){
    const kind=this.contracts.deadlineState(this.state);
    if(kind){this.queueContractDecision(this.state,kind,this.state.contract.colonyName,{recovered:true});this.beginCorporateEventQueueIfNeeded(this.state.speed);}
  }

  tick(){
    this.diagnostics.ticks++;this.diagnostics.lastTick=Date.now();const previousSpeed=this.state.speed;let activeResult,backgroundDeaths=[];
    try{
      activeResult=this.advanceColony(this.state,this.state.contract.colonyName);
      this.portfolio.captureActive(this.state,true);
      this.portfolio.simulateInactive(this.state,(temp,entry)=>{const r=this.advanceColony(temp,temp.contract?.colonyName||entry.name);if(r.died)backgroundDeaths.push(temp.contract?.colonyName||entry.name||"Colony");});
      this.portfolio.captureActive(this.state,true);
      this.advanceGlobalDate();this.collectShipEventsAndScheduled();
      this.state.company.gameOver=!this.state.portfolio.colonies.some(entry=>entry?.data?.status!=="dead");
    }catch(error){this.diagnostics.error("simulation core crashed",error);this.state.speed=0;this.ui.syncSpeed();return;}

    if(this.absoluteDay()%CONFIG.LOG_TELEMETRY_INTERVAL_DAYS===0){this.portfolio.captureActive(this.state,true);this.gameLog.telemetry(this.state,this.state.portfolio);}
    if(this.state.company.gameOver){this.state.speed=0;this.repo.save(this.state);this.ui.gameOver?.();}
    else if(this.beginCorporateEventQueueIfNeeded(previousSpeed))return;
    else if(activeResult.died){this.repo.save(this.state);this.ui.colonyLost?.();}
    else if(activeResult.discoveries.length){
      try{
        const found=activeResult.discoveries.filter(t=>t.resourceId),rare=found.filter(t=>t.quality>=CONFIG.RARE_QUALITY).sort((a,b)=>b.quality-a.quality);
        if(rare.length)this.ui.rare(rare[0]);
        else if(activeResult.discoveries.length===1){const t=activeResult.discoveries[0];this.ui.toast(t.resourceId?`${t.name} discovered • Q${Math.round(t.quality)}`:`${this.land.terrainLabel(t.terrain)} surveyed • no exploitable surface resource.`);}
        else this.ui.toast(`${activeResult.discoveries.length} surveys completed • ${found.length} resource${found.length===1?"":"s"} found.`);
      }catch(e){this.diagnostics.error("discovery UI failed",e);}
    }else if(backgroundDeaths.length)this.ui.toast(`${backgroundDeaths.join(", ")} lost. Review your colony portfolio.`);

    try{this.ui.render();this.tradeUI.render();}catch(e){this.diagnostics.error("HUD render failed",e);}
    this.view.safeDraw();if(this.absoluteDay()%30===0)this.repo.save(this.state);
  }

  loop(now){
    this.diagnostics.heartbeat++;
    try{
      const delta=Math.min(120,now-this.lastFrame);this.lastFrame=now;
      if(this.state.speed>0&&!this.state.company.gameOver&&!this.state.company.pendingEvents?.length){
        this.accumulator+=delta*this.state.speed;
        while(this.accumulator>=CONFIG.DAY_MS&&this.state.speed>0&&!this.state.company.pendingEvents?.length){this.accumulator-=CONFIG.DAY_MS;this.tick();}
      }
      if(now-this.lastHudFrame>=125){this.lastHudFrame=now;this.ui.render();this.tradeUI.render();}
    }catch(e){this.diagnostics.error("animation loop failed",e);}
    requestAnimationFrame(next=>this.loop(next));
  }
}

function formatNumberSafe(value){const n=Number(value)||0;return Math.abs(n)>=1000?Math.round(n).toLocaleString():n>=10?Math.round(n).toString():n.toFixed(1).replace(/\.0$/,"");}

addEventListener("DOMContentLoaded",()=>{
  try{bootApp=new MineITApp();}
  catch(error){console.error(error);const app=bootApp;app?.diagnostics?.error("startup failed",error);const badge=document.querySelector("#errorBadge");if(badge){badge.textContent="STARTUP ERROR • TAP FOR DETAILS";badge.classList.remove("hidden");if(app?.ui)badge.onclick=()=>app.ui.diagnosticsPanel();}}
});
