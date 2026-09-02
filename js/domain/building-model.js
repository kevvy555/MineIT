export const MAX_BUILDING_LEVEL=5;

export const SHIP_INFRASTRUCTURE=Object.freeze({
  power:0,
  industry:50
});

export const HEADQUARTERS_CAPACITY=Object.freeze([16,36,64,100,150]);
export const HEADQUARTERS_MINIMUM_STAFF=Object.freeze([5,10,18,28,40]);
export const HEADQUARTERS_POWER_DEMAND=Object.freeze([1,2,4,7,11]);
export const HEADQUARTERS_BUILD_COST=Object.freeze([90,170,300,510,850]);
export const HEADQUARTERS_ORE_COST=Object.freeze([0,25,65,130,240]);
export const HEADQUARTERS_BONUS_PER_LEVEL=.02;
export const HEADQUARTERS_BONUS_CAP=.15;
export const HEADQUARTERS_OVERLOAD_PENALTY_CAP=.50;
export const HEADQUARTERS_OVERLOAD_PENALTY_PER_RATIO=.50;
export const HEADQUARTERS_COMMAND_LOAD=Object.freeze({
  housing:1,
  power:2,
  food:2,
  fuel:2,
  build:2,
  industry:3,
  ore:3,
  spaceport:0,
  headquarters:0
});

export const POWER_GENERATION=Object.freeze([75,165,300,500,800]);
export const HOUSING_FIXED_POWER=Object.freeze([1,2,4,7,11]);
export const INDUSTRY_IDLE_POWER=Object.freeze([3,7,14,24,38]);
export const INDUSTRY_VARIABLE_POWER_PER_CAPACITY=.25;
export const BASIC_SPACEPORT_POWER=10;
export const FACILITY_POWER_DEMAND=Object.freeze({
  farm:Object.freeze([2,5,10,18,30]),
  ranch:Object.freeze([2,5,9,16,26]),
  bio:Object.freeze([3,7,13,22,35]),
  algae:Object.freeze([3,7,13,22,35]),
  quarry:Object.freeze([4,9,17,29,46]),
  rig:Object.freeze([4,10,19,33,52]),
  mine:Object.freeze([5,12,23,40,64]),
  "deep-mine":Object.freeze([7,16,31,54,86])
});
export const POWER_UPGRADE_GATES=Object.freeze({
  farm:Object.freeze([0,90,190,340,550]),
  ranch:Object.freeze([0,90,190,340,550]),
  bio:Object.freeze([0,100,210,370,600]),
  algae:Object.freeze([0,100,210,370,600]),
  quarry:Object.freeze([0,110,225,400,650]),
  rig:Object.freeze([0,115,235,420,680]),
  mine:Object.freeze([0,125,250,440,710]),
  "deep-mine":Object.freeze([0,140,280,470,750])
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
    capacity:POWER_GENERATION,
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
  }),
  headquarters:Object.freeze({
    label:"Headquarters",
    tech:null,
    unit:"command",
    capacity:HEADQUARTERS_CAPACITY,
    build:HEADQUARTERS_BUILD_COST,
    ore:HEADQUARTERS_ORE_COST
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
function foundingShipProvidesIndustry(state){
  const ships=state?.company?.expansion?.ships||[],foundingId=state?.colony?.foundingShipId;
  if(foundingId)return ships.some(ship=>ship.id===foundingId&&ship.status==="docked"&&ship.colonyId===state.colonyId);
  return ships.some(ship=>ship.source==="charter-issued"&&ship.status==="docked"&&ship.colonyId===state.colonyId);
}
export function syncBuildingTotals(state){
  state.colony||={};state.metrics||={};
  const builtHousing=builtCapacity(state,"housing"),builtPower=builtCapacity(state,"power"),builtIndustry=builtCapacity(state,"industry"),shipHousing=landedShipHousing(state),shipIndustry=foundingShipProvidesIndustry(state)?SHIP_INFRASTRUCTURE.industry:0;
  const housing=shipHousing+builtHousing,power=builtPower,industry=shipIndustry+builtIndustry;
  Object.assign(state.colony,{
    shipHousing,
    shipPower:0,
    shipIndustry,
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
  return{housing,power,industry,builtHousing,builtPower,builtIndustry,shipHousing,shipIndustry};
}
