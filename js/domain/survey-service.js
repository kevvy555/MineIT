import { clamp } from "../core/utils.js";

export class SurveyService {
  constructor(world,contractService){this.world=world;this.contracts=contractService;}
  slots(state){return clamp(state.metrics.slots||1,1,5);}
  isActive(state,x,y){return state.scans.some(s=>s.x===x&&s.y===y);}
  isQueued(state,x,y){return state.scanQueue.some(s=>s.x===x&&s.y===y);}
  days(state,x,y){const a=this.contracts.archetype(state.contract);return Math.max(2,Math.round((8+Math.hypot(x,y)*.22)*a.scan*state.metrics.sf));}
  surveyable(state,x,y){if(state.contract?.ended)return false;const tile=this.world.get(state,x,y);return !(x===0&&y===0)&&!tile.revealed&&!this.isActive(state,x,y)&&!this.isQueued(state,x,y);}
  fill(state){if(state.contract?.ended)return;while(state.scans.length<this.slots(state)&&state.scanQueue.length){const next=state.scanQueue.shift();if(!this.surveyable(state,next.x,next.y))continue;const total=this.days(state,next.x,next.y);state.scans.push({...next,total,remaining:total});}}
  enqueue(state,x,y){if(!this.surveyable(state,x,y))return{ok:false,active:false};state.scanQueue.push({x,y});this.fill(state);return{ok:true,active:this.isActive(state,x,y)};}
  enqueueMany(state,cells){const seen=new Set();let count=0;for(const cell of cells){const k=`${cell.x},${cell.y}`;if(seen.has(k))continue;seen.add(k);if(this.surveyable(state,cell.x,cell.y)){state.scanQueue.push({x:cell.x,y:cell.y});count++;}}this.fill(state);return count;}
  tick(state){if(state.contract?.ended)return[];this.fill(state);const completed=[];for(const scan of state.scans)scan.remaining--;for(const scan of state.scans.filter(s=>s.remaining<=0))completed.push(this.world.reveal(state,scan.x,scan.y));state.scans=state.scans.filter(s=>s.remaining>0);this.fill(state);return completed;}
}
