const clamp=value=>Math.max(-100,Math.min(100,Number(value)||0));
export const REPUTATION_LEVELS=Object.freeze([
  Object.freeze({level:1,name:"Disgraced",min:-100,max:-25}),
  Object.freeze({level:2,name:"Distrusted",min:-24.99,max:-10}),
  Object.freeze({level:3,name:"Questionable",min:-9.99,max:-.01}),
  Object.freeze({level:4,name:"Unknown",min:0,max:4.99}),
  Object.freeze({level:5,name:"Emerging",min:5,max:14.99}),
  Object.freeze({level:6,name:"Recognised",min:15,max:29.99}),
  Object.freeze({level:7,name:"Established",min:30,max:49.99}),
  Object.freeze({level:8,name:"Trusted",min:50,max:69.99}),
  Object.freeze({level:9,name:"Preferred",min:70,max:89.99}),
  Object.freeze({level:10,name:"Elite",min:90,max:100})
]);
export const normalizeReputation=value=>Number(clamp(value).toFixed(2));
export const reputationLevel=value=>{const rep=normalizeReputation(value);return REPUTATION_LEVELS.find(row=>rep>=row.min&&rep<=row.max)||REPUTATION_LEVELS[3];};
export function changeReputation(state,delta){state.company||={};const before=normalizeReputation(state.company.rep),after=normalizeReputation(before+(Number(delta)||0));state.company.rep=after;return{before,after,delta:Number((after-before).toFixed(2)),level:reputationLevel(after)};}
export const awardBuyerShipment=state=>changeReputation(state,.01);
export const awardCorporateExportVisit=state=>changeReputation(state,.01);
export const awardColonyContract=state=>changeReputation(state,.10);
export const applyBuyerLoss=(state,buyerLoss)=>changeReputation(state,-Math.abs(Number(buyerLoss)||0)*.10);
