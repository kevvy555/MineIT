import { clamp } from "../core/utils.js";

const RESURVEY_TIME_FACTOR=.5;

export class SurveyService {
  constructor(world,contractService){this.world=world;this.contracts=contractService;}
  slots(state){return clamp(state.metrics.slots||1,1,5);}
  scanningLevel(state){return Math.max(1,Number(state.colony?.tech?.scanning)||Number(state.metrics?.scanningTech)||Number(state.company?.tech?.scanning)||1);}
  isActive(state,x,y){return state.scans.some(s=>s.x===x&&s.y===y);}
  isQueued(state,x,y){return state.scanQueue.some(s=>s.x===x&&s.y===y);}
  isResurveyable(state,x,y){const tile=this.world.get(state,x,y),last=Math.max(0,Number(tile?.lastScannedAtLevel)||0);return !(x===0&&y===0)&&!!tile?.revealed&&last>0&&last<this.scanningLevel(state);}
  baseDays(state,x,y){const a=this.contracts.archetype(state.contract);return Math.max(2,Math.round((8+Math.hypot(x,y)*.22)*a.scan*state.metrics.sf));}
  days(state,x,y,resurvey=this.isResurveyable(state,x,y)){const base=this.baseDays(state,x,y);return resurvey?Math.max(1,Math.round(base*RESURVEY_TIME_FACTOR)):base;}
  surveyable(state,x,y){if(state.contract?.ended||x===0&&y===0||this.isActive(state,x,y)||this.isQueued(state,x,y))return false;const tile=this.world.get(state,x,y);return !tile.revealed||this.isResurveyable(state,x,y);}
  fill(state){if(state.contract?.ended)return;while(state.scans.length<this.slots(state)&&state.scanQueue.length){const next=state.scanQueue.shift();if(!this.surveyable(state,next.x,next.y))continue;const resurvey=this.isResurveyable(state,next.x,next.y),scanningLevel=this.scanningLevel(state),total=this.days(state,next.x,next.y,resurvey);state.scans.push({...next,resurvey,scanningLevel,total,remaining:total});}}
  enqueue(state,x,y){if(!this.surveyable(state,x,y))return{ok:false,active:false,reason:"Sector cannot currently be surveyed."};state.scanQueue.push({x,y});this.fill(state);return{ok:true,active:this.isActive(state,x,y),resurvey:this.isActive(state,x,y)?!!state.scans.find(s=>s.x===x&&s.y===y)?.resurvey:this.isResurveyable(state,x,y)};}
  enqueueMany(state,cells){const seen=new Set();let count=0;for(const cell of cells){const k=`${cell.x},${cell.y}`;if(seen.has(k))continue;seen.add(k);if(this.surveyable(state,cell.x,cell.y)){state.scanQueue.push({x:cell.x,y:cell.y});count++;}}this.fill(state);return count;}
  tick(state){if(state.contract?.ended)return[];this.fill(state);const completed=[];for(const scan of state.scans)scan.remaining--;for(const scan of state.scans.filter(s=>s.remaining<=0))completed.push(this.world.reveal(state,scan.x,scan.y,scan.scanningLevel||this.scanningLevel(state)));state.scans=state.scans.filter(s=>s.remaining>0);this.fill(state);return completed;}
}
