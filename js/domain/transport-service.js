import { CONFIG } from "../core/config.js?v=5.5.0";

export class TransportService {
  absoluteDay(state){return(Math.max(1,Number(state.year)||1)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,Number(state.day)||1);}
  ensure(state){state.colony||={};state.colony.transportOrders||=[];return state.colony.transportOrders;}
  pendingPopulation(state){return this.ensure(state).reduce((sum,o)=>sum+Math.max(0,Number(o.amount)||0),0);}
  supportedCapacity(state){return Math.max(0,Math.floor(Math.min(Number(state.colony?.housingCapacity)||0,Number(state.metrics?.powerPopulationCap)||Number(state.colony?.housingCapacity)||0)));}
  availableCapacity(state){return Math.max(0,this.supportedCapacity(state)-Math.max(0,Number(state.pop)||0)-this.pendingPopulation(state));}
  cost(state,amount){const qty=Math.max(0,Math.floor(Number(amount)||0)),load=Math.max(.5,Number(state.contract?.supportLoad)||1);return Math.round(CONFIG.DEDICATED_TRANSPORT_BASE_COST+qty*CONFIG.DEDICATED_TRANSPORT_PER_COLONIST*load);}
  canRequest(state,amount){const qty=Math.max(0,Math.floor(Number(amount)||0)),cost=this.cost(state,qty);if(state.status==="dead"||state.contract?.ended||state.status==="liability")return{ok:false,reason:"This colony cannot receive new colonists.",qty,cost};if(qty<=0)return{ok:false,reason:"Choose at least one colonist.",qty,cost};const capacity=this.availableCapacity(state);if(qty>capacity)return{ok:false,reason:`Only ${capacity} supported places remain after pending transports.`,qty,cost,capacity};if((Number(state.company?.cash)||0)<cost)return{ok:false,reason:"Insufficient cash for dedicated transport.",qty,cost,capacity};return{ok:true,qty,cost,capacity};}
  request(state,amount){const r=this.canRequest(state,amount);if(!r.ok)return r;const orderedDay=this.absoluteDay(state),arrivalDay=orderedDay+CONFIG.DEDICATED_TRANSPORT_DAYS,order={id:`transport-${orderedDay}-${Math.random().toString(36).slice(2,8)}`,amount:r.qty,cost:r.cost,orderedDay,arrivalDay};this.ensure(state).push(order);state.company.cash-=r.cost;state.contract.localCosts=(Number(state.contract.localCosts)||0)+r.cost;return{ok:true,...order};}
  processArrivals(state){const orders=this.ensure(state);if(state.status==="dead"){state.colony.transportOrders=[];return[];}const day=this.absoluteDay(state),arrived=[],remaining=[];for(const order of orders){if((Number(order.arrivalDay)||Infinity)<=day){state.pop+=Math.max(0,Number(order.amount)||0);arrived.push(order);}else remaining.push(order);}state.colony.transportOrders=remaining;return arrived;}
  daysRemaining(state,order){return Math.max(0,(Number(order?.arrivalDay)||this.absoluteDay(state))-this.absoluteDay(state));}
}
