import { hashString } from "../core/utils.js";

export const OVERDRIVE_RISK_PERIOD=30;
export const OVERDRIVE_ACCIDENT_CHANCE=.25;
export const ACCIDENT_SHUTDOWN_DAYS=3;

export const OPERATING_MODES=Object.freeze({
  normal:Object.freeze({key:"normal",label:"NORMAL",workforce:1,output:1,exposureDelta:-1,risk:"NONE"}),
  pushed:Object.freeze({key:"pushed",label:"PUSHED",workforce:1.25,output:1.15,exposureDelta:.3,risk:"LOW"}),
  hard:Object.freeze({key:"hard",label:"HARD",workforce:1.5,output:1.3,exposureDelta:1,risk:"HIGH"})
});

const ACCIDENTS=Object.freeze({
  quarry:Object.freeze({name:"Quarry Face Collapse",fatalMax:3}),
  mine:Object.freeze({name:"Tunnel Collapse",fatalMax:3}),
  "deep-mine":Object.freeze({name:"Rockburst & Shaft Collapse",fatalMax:4}),
  rig:Object.freeze({name:"Over-pressure Blowout",fatalMax:3})
});

export function extractionFamily(tile){return tile?.development?.kind==="extract"?tile.development.family:null;}
export function supportsOverdrive(tile){const family=extractionFamily(tile);return !!ACCIDENTS[family]&&tile?.sustainability!=="renewable"&&tile?.type!=="food";}
export function operatingMode(tile){const key=String(tile?.operatingMode||"normal");return supportsOverdrive(tile)&&OPERATING_MODES[key]?key:"normal";}
export function operatingProfile(tile,modeOverride=null){return OPERATING_MODES[modeOverride&&OPERATING_MODES[modeOverride]?modeOverride:operatingMode(tile)];}
export function outputMultiplier(tile){return operatingProfile(tile).output;}
export function workforceMultiplier(tile,modeOverride=null){return operatingProfile(tile,modeOverride).workforce;}
export function riskExposure(tile){return Math.max(0,Number(tile?.overdriveExposure)||0);}
export function isAccidentShutdown(tile){return Math.max(0,Math.ceil(Number(tile?.accidentShutdownDays)||0))>0;}
export function accidentDetails(tile){const family=extractionFamily(tile);return ACCIDENTS[family]||null;}

export function setOperatingMode(tile,mode){
  if(!supportsOverdrive(tile))return{ok:false,reason:"This site does not use industrial overdrive controls."};
  if(isAccidentShutdown(tile))return{ok:false,reason:`Facility is closed for ${Math.ceil(tile.accidentShutdownDays)} more day${Math.ceil(tile.accidentShutdownDays)===1?"":"s"}.`};
  if(!OPERATING_MODES[mode])return{ok:false,reason:"Unknown operating mode."};
  tile.operatingMode=mode;
  tile.overdriveExposure=riskExposure(tile);
  return{ok:true,mode,profile:OPERATING_MODES[mode]};
}

function deterministicUnit(state,tile,salt){return (hashString(`${state?.seed||1}|${tile?.x||0}|${tile?.y||0}|${state?.year||1}|${state?.day||1}|${salt}`)%1000000)/1000000;}

export function advanceOverdriveRisk(state,tile,random=null){
  if(!supportsOverdrive(tile)||isAccidentShutdown(tile))return null;
  const mode=operatingMode(tile),profile=OPERATING_MODES[mode],before=riskExposure(tile);
  if(mode==="normal"){
    tile.overdriveExposure=Math.max(0,before+profile.exposureDelta);
    return null;
  }
  tile.overdriveExposure=before+profile.exposureDelta;
  if(tile.overdriveExposure<OVERDRIVE_RISK_PERIOD)return null;
  tile.overdriveExposure=Math.max(0,tile.overdriveExposure-OVERDRIVE_RISK_PERIOD);
  tile.overdriveRiskChecks=Math.max(0,Math.floor(Number(tile.overdriveRiskChecks)||0))+1;
  let rollIndex=0;
  const roll=()=>random?Math.max(0,Math.min(.999999,Number(random())||0)):deterministicUnit(state,tile,`${tile.overdriveRiskChecks}:${rollIndex++}`);
  if(roll()>=OVERDRIVE_ACCIDENT_CHANCE)return null;
  const details=accidentDetails(tile),fatal=roll()<.25;
  let deaths=0;
  if(fatal){deaths=1+Math.floor(roll()*details.fatalMax);deaths=Math.min(Math.max(0,Math.floor(Number(state?.pop)||0)),deaths);state.pop=Math.max(0,(Number(state.pop)||0)-deaths);}
  tile.accidentShutdownDays=ACCIDENT_SHUTDOWN_DAYS;
  tile.operatingMode="normal";
  tile.overdriveExposure=0;
  const event={name:details.name,family:extractionFamily(tile),outcome:fatal?"fatalities":"machinery",deaths,shutdownDays:ACCIDENT_SHUTDOWN_DAYS,mode};
  tile.lastAccident={...event,year:state?.year||1,day:state?.day||1};
  return event;
}

export function advanceShutdownDay(tile){
  if(!isAccidentShutdown(tile))return false;
  tile.accidentShutdownDays=Math.max(0,Math.ceil(Number(tile.accidentShutdownDays)||0)-1);
  return tile.accidentShutdownDays===0;
}
