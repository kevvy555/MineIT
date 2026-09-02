export const MAX_BUILDING_LEVEL=5;

export const SHIP_INFRASTRUCTURE=Object.freeze({
  power:30,
  industry:50
});

export const BUILDING_MODEL=Object.freeze({
  housing:Object.freeze({
    label:"Housing",
    tech:"housing",
    unit:"housing",
    capacity:Object.freeze([160,360,650,1050,1600]),
    build:Object.freeze([55,95,165,285,480]),
    ore:Object.freeze([0,10,25,50,90])
  }),
  power:Object.freeze({
    label:"Power Plant",
    tech:"power",
    unit:"power",
    capacity:Object.freeze([30,75,160,330,650]),
    build:Object.freeze([70,125,220,390,680]),
    ore:Object.freeze([0,15,45,90,170])
  }),
  industry:Object.freeze({
    label:"Industry",
    tech:"industry",
    unit:"industry",
    capacity:Object.freeze([100,230,420,700,1100]),
    build:Object.freeze([80,145,255,435,720]),
    ore:Object.freeze([0,20,55,110,200])
  })
});

export function buildingKind(dev){return BUILDING_MODEL[dev?.kind]?dev.kind:null;}
export function buildingLevel(dev){return Math.max(1,Math.min(MAX_BUILDING_LEVEL,Math.round(Number(dev?.level)||1)));}
export function buildingDefinition(kind){return BUILDING_MODEL[kind]||null;}
export function buildingCapacity(kind,level=1){const def=buildingDefinition(kind);if(!def)return 0;return def.capacity[buildingLevel({level})-1]||0;}
export function buildingCost(kind,level=1,terrainMultiplier=1){
  const def=buildingDefinition(kind),l=buildingLevel({level}),terrain=Math.max(.1,Number(terrainMultiplier)||1);
  if(!def)return{build:Infinity,ore:Infinity,cash:0};
  return{build:Math.round(def.build[l-1]*terrain),ore:Math.round(def.ore[l-1]*terrain),cash:0};
}
export function buildingTechCategory(kind){return buildingDefinition(kind)?.tech||null;}
export function localBuildings(state,kind=null){return Object.values(state?.tiles||{}).filter(tile=>buildingKind(tile?.development)&&(!kind||tile.development.kind===kind));}
export function productionStopped(tile){return tile?.development?.productionStopped===true;}
export function operatingBuildings(state,kind=null){return localBuildings(state,kind).filter(tile=>tile.development.kind==="housing"||!productionStopped(tile));}
export function builtCapacity(state,kind){return operatingBuildings(state,kind).reduce((sum,tile)=>sum+buildingCapacity(kind,tile.development.level),0);}
export function maxBuiltLevel(state,kind){return localBuildings(state,kind).reduce((max,tile)=>Math.max(max,buildingLevel(tile.development)),0);}
export function landedShipHousing(state){return(state?.company?.expansion?.ships||[]).filter(ship=>ship?.status==="docked"&&ship.colonyId===state?.colonyId).reduce((sum,ship)=>sum+Math.max(0,Number(ship.accommodationCapacity)||0),0);}

export function syncBuildingTotals(state){
  state.colony||={};state.metrics||={};
  const builtHousing=builtCapacity(state,"housing"),builtPower=builtCapacity(state,"power"),builtIndustry=builtCapacity(state,"industry");
  const shipHousing=landedShipHousing(state),housing=shipHousing+builtHousing,power=SHIP_INFRASTRUCTURE.power+builtPower,industry=SHIP_INFRASTRUCTURE.industry+builtIndustry;
  Object.assign(state.colony,{
    shipHousing,
    shipPower:SHIP_INFRASTRUCTURE.power,
    shipIndustry:SHIP_INFRASTRUCTURE.industry,
    housingBuildingCapacity:builtHousing,
    powerBuildingCapacity:builtPower,
    industryBuildingCapacity:builtIndustry,
    housingCapacity:housing,
    powerCapacity:power,
    industryInstalled:industry,
    housingLevel:Math.max(1,maxBuiltLevel(state,"housing")),
    industryLevel:Math.max(1,maxBuiltLevel(state,"industry")),
    powerLevel:Math.max(1,maxBuiltLevel(state,"power"))
  });
  Object.assign(state.metrics,{housingCapacity:housing,powerCapacity:power,industryInstalled:industry});
  const land=state.colony.land;
  if(land){
    delete land.baseHousingLevel;
    delete land.baseHousingCapacity;
    delete land.baseIndustryLevel;
    land.legacyBaseInfrastructureNormalized=true;
  }
  return{housing,power,industry,builtHousing,builtPower,builtIndustry};
}
