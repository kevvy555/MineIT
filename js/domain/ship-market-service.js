import { CONFIG } from "../core/config.js";
import { berthStatusForColony } from "./spaceport-model.js";

export const SHIP_PROCUREMENT_VERSION=1;
export const SHIP_CHARTER_DISCOUNT_RATE=.35;
export const SHIP_ORDER_CANCELLATION_FEE_RATE=.05;
export const SHIP_ORDER_PRODUCTION_LOCK_FRACTION=.25;

const clone=value=>JSON.parse(JSON.stringify(value));
const absoluteDay=state=>(Math.max(1,Number(state.year)||1)-1)*CONFIG.DAYS_PER_YEAR+Math.max(1,Number(state.day)||1);

/** Owns MineIT-specific ship quotes, orders, payment, cancellation and delivery. */
export class ShipMarketService{
  constructor(catalogue,expansion,colonyService=null){this.catalogue=catalogue;this.expansion=expansion;this.colonyService=colonyService;}
  networkStatus(state){if(!this.colonyService?.headquartersContinuity)return{networkAvailable:true};return this.colonyService.headquartersContinuity(state);}

  ensure(state){
    state.company||={};
    const previous=state.company.shipProcurement||{};
    state.company.shipProcurement={
      version:SHIP_PROCUREMENT_VERSION,
      discountRate:Number.isFinite(Number(previous.discountRate))?Number(previous.discountRate):SHIP_CHARTER_DISCOUNT_RATE,
      orders:Array.isArray(previous.orders)?previous.orders:[],
      nextOrderSequence:Math.max(1,Math.floor(Number(previous.nextOrderSequence)||1)),
      lastProcessedAbsoluteDay:Math.max(0,Math.floor(Number(previous.lastProcessedAbsoluteDay)||0)),
      notice:previous.notice||null
    };
    return state.company.shipProcurement;
  }

  orders(state){return this.ensure(state).orders;}
  order(state,orderId){return this.orders(state).find(order=>order.id===orderId)||null;}
  activeOrders(state){return this.orders(state).filter(order=>!["cancelled","delivered"].includes(order.status));}

  quote(state,shipClassId){
    const shipClass=this.catalogue.classById(shipClassId);
    if(!shipClass||shipClass.retailStatus!=="factory-new")return{ok:false,reason:"That vessel is not in the factory-new procurement catalogue."};
    const listPrice=Math.max(0,Number(shipClass.pricing?.manufacturerListPrice)||0),discountRate=this.ensure(state).discountRate,discountAmount=Math.round(listPrice*discountRate),price=Math.max(0,listPrice-discountAmount),leadTimeDays=Math.max(1,Math.floor(Number(shipClass.production?.factoryLeadTimeDays)||0));
    return{ok:true,shipClass,listPrice,discountRate,discountAmount,price,leadTimeDays,currencyId:shipClass.pricing?.currencyId||"currency-commonwealth-credit",universe:this.catalogue.provenance()};
  }

  deliveryColonies(state){
    return(state.portfolio?.colonies||[]).filter(entry=>entry?.data?.status!=="dead").map(entry=>{
      const berth=berthStatusForColony(state,entry.id);
      return{id:entry.id,name:entry.data?.contract?.colonyName||entry.name||"Colony",systemId:entry.data?.contract?.systemId||null,berth};
    });
  }

  canOrder(state,shipClassId,colonyId){
    const quote=this.quote(state,shipClassId);if(!quote.ok)return quote;
    const network=this.networkStatus(state);if(!network.networkAvailable)return{ok:false,reason:"Conglomerate network offline: restore the Primary Headquarters before placing a new factory ship order.",quote,network};
    if(!quote.shipClass.specifications?.vectorExchangeCapable)return{ok:false,reason:"This in-system-only class is visible in the catalogue but local-system ship operations are not available yet.",quote};
    const colony=this.deliveryColonies(state).find(item=>item.id===colonyId);if(!colony)return{ok:false,reason:"Select a living owned colony for delivery.",quote};
    if(Math.max(0,Number(state.company?.cash)||0)<quote.price)return{ok:false,reason:`Need cc ${Math.round(quote.price).toLocaleString()} operating cash to place this order.`,quote,colony};
    return{ok:true,quote,colony,network};
  }

  placeOrder(state,shipClassId,colonyId,{signatureAccepted=false}={}){
    if(!signatureAccepted)return{ok:false,reason:"Sign the purchase contract before placing the order."};
    const check=this.canOrder(state,shipClassId,colonyId);if(!check.ok)return check;
    const root=this.ensure(state),today=absoluteDay(state),sequence=root.nextOrderSequence++,id=`ship-order-${String(sequence).padStart(4,"0")}`,lead=check.quote.leadTimeDays,vesselName=`${check.quote.shipClass.name} ${String(sequence).padStart(2,"0")}`;
    const cashBefore=Math.max(0,Number(state.company.cash)||0);
    const order={
      id,shipClassId,shipName:check.quote.shipClass.name,vesselName,manufacturerOrganisationId:check.quote.shipClass.manufacturerOrganisationId,
      colonyId,colonyName:check.colony.name,orderedAbsoluteDay:today,dueAbsoluteDay:today+lead,productionLockAbsoluteDay:today+Math.max(1,Math.floor(lead*SHIP_ORDER_PRODUCTION_LOCK_FRACTION)),factoryLeadTimeDays:lead,
      listPrice:check.quote.listPrice,discountRate:check.quote.discountRate,discountAmount:check.quote.discountAmount,paidPrice:check.quote.price,currencyId:check.quote.currencyId,
      universeSchemaVersion:check.quote.universe.schemaVersion,universeContentVersion:check.quote.universe.contentVersion,
      status:"production-queued",productionProgress:0,signatureAccepted:true,cancelledAbsoluteDay:null,cancellationFee:0,refundedAmount:0,deliveredAbsoluteDay:null,deliveryStatus:null,shipId:null
    };
    try{
      state.company.cash=cashBefore-check.quote.price;
      root.orders.push(order);
    }catch(error){
      state.company.cash=cashBefore;
      throw error;
    }
    root.notice={type:"ship-order-placed",orderId:id,absoluteDay:today};
    return{ok:true,order:clone(order),quote:check.quote};
  }

  cancelOrder(state,orderId){
    const order=this.order(state,orderId);if(!order)return{ok:false,reason:"Ship order not found."};
    if(order.status==="cancelled")return{ok:false,reason:"That order is already cancelled."};
    if(order.status==="delivered")return{ok:false,reason:"A delivered vessel can no longer be cancelled as a factory order."};
    const today=absoluteDay(state);if(today>=order.productionLockAbsoluteDay)return{ok:false,reason:"Manufacturing is locked. This order can no longer be cancelled under the current charter terms."};
    const fee=Math.round(order.paidPrice*SHIP_ORDER_CANCELLATION_FEE_RATE),refund=Math.max(0,order.paidPrice-fee);
    state.company.cash=Number(state.company.cash||0)+refund;order.status="cancelled";order.cancelledAbsoluteDay=today;order.cancellationFee=fee;order.refundedAmount=refund;this.ensure(state).notice={type:"ship-order-cancelled",orderId:order.id,absoluteDay:today};
    return{ok:true,order:clone(order),fee,refund};
  }

  flattenClass(shipClass){
    const s=shipClass.specifications||{};
    return{id:shipClass.id,name:shipClass.name,cargoCapacity:s.cargoCapacity,fuelCapacity:s.fuelCapacity,foodCapacity:s.foodCapacity,colonistCapacity:s.colonistCapacity,minimumCrew:s.minimumCrew,maximumCrew:s.maximumCrew,transitWeeksPerLightYear:s.transitWeeksPerLightYear,fuelUsePerLightYear:s.fuelUsePerLightYear,veCapable:s.vectorExchangeCapable};
  }

  deliverOrder(state,order){
    const shipClass=this.catalogue.classById(order.shipClassId);if(!shipClass){order.status="delivery-blocked";order.deliveryStatus="catalogue-missing";return{ok:false,order,reason:"Canonical ship class unavailable."};}
    const colony=(state.portfolio?.colonies||[]).find(entry=>entry.id===order.colonyId&&entry?.data?.status!=="dead");
    if(!colony){order.status="delivery-blocked";order.deliveryStatus="destination-unavailable";return{ok:false,order,reason:"Delivery colony is no longer available."};}
    const berth=berthStatusForColony(state,order.colonyId),docked=berth.free>0,purchase={orderId:order.id,paidPrice:order.paidPrice,listPrice:order.listPrice,discountRate:order.discountRate,currencyId:order.currencyId,purchaseAbsoluteDay:order.orderedAbsoluteDay,universeContentVersion:order.universeContentVersion,procurementChannel:"koplin-deep-reach-framework"};
    const ship=this.expansion.createPurchasedShip(state,this.flattenClass(shipClass),{name:order.vesselName,colonyId:docked?order.colonyId:null,orderId:order.id,purchase,status:docked?"docked":"orbiting"});
    if(!docked){ship.systemId=colony.data?.contract?.systemId||null;ship.colonyId=null;ship.targetColonyId=order.colonyId;}
    order.status="delivered";order.deliveredAbsoluteDay=absoluteDay(state);order.deliveryStatus=docked?"docked":"orbiting";order.shipId=ship.id;this.ensure(state).notice={type:"ship-order-delivered",orderId:order.id,shipId:ship.id,deliveryStatus:order.deliveryStatus,absoluteDay:order.deliveredAbsoluteDay};
    return{ok:true,order:clone(order),ship};
  }

  retargetBlockedOrder(state,orderId,colonyId){
    const order=this.order(state,orderId);if(!order||order.status!=="delivery-blocked")return{ok:false,reason:"Only blocked deliveries can be retargeted."};
    const colony=this.deliveryColonies(state).find(item=>item.id===colonyId);if(!colony)return{ok:false,reason:"Select a living owned colony."};
    order.colonyId=colonyId;order.colonyName=colony.name;return this.deliverOrder(state,order);
  }

  processDay(state){
    const root=this.ensure(state),today=absoluteDay(state);if(root.lastProcessedAbsoluteDay===today)return[];root.lastProcessedAbsoluteDay=today;const events=[];
    for(const order of root.orders){
      if(["cancelled","delivered","delivery-blocked"].includes(order.status))continue;
      const elapsed=Math.max(0,today-order.orderedAbsoluteDay),duration=Math.max(1,order.dueAbsoluteDay-order.orderedAbsoluteDay);order.productionProgress=Math.min(1,elapsed/duration);
      if(today>=order.productionLockAbsoluteDay&&order.status==="production-queued")order.status="manufacturing";
      if(today>=order.dueAbsoluteDay){const delivery=this.deliverOrder(state,order);events.push({type:delivery.ok?"ship-order-delivered":"ship-order-delivery-blocked",orderId:order.id,shipId:delivery.ship?.id||null,reason:delivery.reason||null});}
    }
    return events;
  }
}
