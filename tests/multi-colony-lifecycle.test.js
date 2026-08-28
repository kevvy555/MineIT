import assert from "node:assert/strict";
import { ContractService } from "../js/domain/contract-service.js";
import { CorporateEventService } from "../js/domain/corporate-event-service.js";
import { createGameState } from "../js/domain/game-state-runtime.js";
import { PortfolioService } from "../js/domain/portfolio-service.js";
import { ResourceService } from "../js/domain/resource-service.js";
import { InventoryService } from "../js/domain/inventory-service.js";
import { TradeService } from "../js/domain/trade-service.js";
import { UIController as BaseUIController,mix } from "../js/ui/ui-controller.js";
import { ResourceUIMixin } from "../js/ui/resource-ui.js";
import { PortfolioUIMixin } from "../js/ui/portfolio-ui.js";

// UI mixins must retain inherited helpers while the remaining presentation layers are flattened.
assert.equal(typeof BaseUIController.prototype.company,"function","UI controller must retain inherited ResourceUI company()");
class MixedUI{}
mix(MixedUI,ResourceUIMixin);mix(MixedUI,PortfolioUIMixin);
for(const method of["company","colonyStatus","colonyDays","coloniesPanel"])assert.equal(typeof MixedUI.prototype[method],"function",`${method} must survive mixin composition`);

const contracts=new ContractService(),resources=new ResourceService(),inventory=new InventoryService(resources),trade=new TradeService(resources,inventory),events=new CorporateEventService(contracts,trade),portfolio=new PortfolioService();
const state=createGameState(contracts.first());state.company.cash=1e9;portfolio.ensure(state);events.ensure(state.company);
const abs=()=>((state.year-1)*360+state.day);

state.year=11;state.day=1;state.metrics.food=state.contract.goals.food;state.metrics.industry=state.contract.goals.industry;state.pop=state.contract.goals.pop;state.trade.active=false;state.trade.nextArrivalDay=abs();
let recovered=events.recoverLocal(state,state.contract.colonyName);
assert.equal(recovered.length,2,"contract completion and same-day ship must both be queued");
assert.equal(state.company.pendingEvents[0].type,"contract","contract decisions precede newly arriving ships");
assert.equal(state.company.pendingEvents[0].kind,"complete");assert.equal(state.company.pendingEvents[1].type,"ship");assert.equal(state.trade.active,true);

state.company.pendingEvents=[];state.company.nextEventSequence=1;state.status="playing";delete state.contract.pendingDecision;state.trade.active=true;
recovered=events.recoverLocal(state,state.contract.colonyName);assert.equal(state.company.pendingEvents[0].type,"ship");assert.equal(state.company.pendingEvents[0].recovered,true);assert.equal(state.company.pendingEvents[1].type,"contract");

state.company.pendingEvents=[];state.trade.active=false;state.status="playing";delete state.contract.pendingDecision;delete state.contract.pendingDecisionPreviousStatus;
const award=contracts.awardCompletion(state);assert.equal(award.ok,true);const renewal=contracts.renew(state);assert.equal(renewal.ok,true);assert.equal(renewal.years,5);assert.equal(state.status,"playing");
portfolio.captureActive(state,true);const firstId=state.colonyId,secondContract=contracts.options(2)[0];const secondEntry=portfolio.addColony(state,secondContract),secondId=secondEntry.id;assert.notEqual(firstId,secondId);assert.equal(state.portfolio.colonies.length,2);

const firstEntry=state.portfolio.colonies.find(e=>e.id===firstId);firstEntry.data.trade.active=true;firstEntry.data.status="playing";state.company.pendingEvents=[];state.company.nextEventSequence=1;
portfolio.simulateInactive(state,(local,entry)=>{if(entry.id===firstId)events.recoverLocal(local,entry.name);});
assert.equal(state.company.pendingEvents.length,1);assert.equal(state.company.pendingEvents[0].type,"ship");assert.equal(state.company.pendingEvents[0].colonyId,firstId);assert.equal(state.company.pendingEvents[0].recovered,true);
assert.equal(portfolio.switchTo(state,firstId),true);assert.equal(state.colonyId,firstId);assert.equal(state.trade.active,true);assert.equal(portfolio.switchTo(state,secondId),true);assert.equal(state.colonyId,secondId,"manual portfolio switching must still restore Colony 02 after handling Colony 01");

const legacyEntry=state.portfolio.colonies.find(e=>e.id===firstId);legacyEntry.data.status="deadline-missed";delete legacyEntry.data.contract.pendingDecision;legacyEntry.data.trade.active=false;state.company.pendingEvents=[];state.company.nextEventSequence=1;
portfolio.simulateInactive(state,(local,entry)=>{if(entry.id===firstId)events.recoverLocal(local,entry.name);});
assert.equal(state.company.pendingEvents[0].type,"contract");assert.equal(state.company.pendingEvents[0].kind,"extension");

console.log("MineIT canonical multi-colony lifecycle regression test passed");
