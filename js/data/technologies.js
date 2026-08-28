const BUILDING_TECH_COSTS=[0,25000,90000,300000,1000000];
const MINING_TECH_COSTS=[0,25000,90000,300000,1000000,3500000,12000000,40000000,130000000,400000000];
const cost=(list,level)=>list[Math.max(0,Math.min(list.length-1,level-1))];

const housing=[
  ["Basic Habitats","Simple modular accommodation for a new surface colony."],
  ["Modular Habitats","Larger linked residential modules with improved life-support integration."],
  ["Dense Residential Blocks","Multi-level sealed housing designed for growing settlements."],
  ["Arcology Housing","High-density residential complexes with integrated colony services."],
  ["Integrated Habitat Complexes","Maximum-density self-contained residential districts."]
];
const power=[
  ["Combustion Generator","Basic fuel-burning generators for small settlements."],
  ["Steam Turbine Plant","Larger thermal generation and district power distribution."],
  ["Gas Turbine Grid","High-output generation with improved fuel efficiency."],
  ["Fission Reactor","Compact reactor systems for major colonies and harsh worlds."],
  ["Fusion Reactor","Very high-density generation for advanced industrial settlements."]
];
const food=[
  ["Field Agriculture","Basic farms, ranches and local biological harvesting."],
  ["Controlled Greenhouses","Protected agriculture and improved renewable-resource handling."],
  ["Sealed Hydroponics","Closed food systems for difficult planetary environments."],
  ["Aeroponics","High-density controlled agriculture with strong labour efficiency."],
  ["Synthetic Protein","Advanced biological and synthetic food production."]
];
const industry=[
  ["Basic Workshops","General fabrication, repair and low-volume colony manufacturing."],
  ["Mechanised Fabrication","Powered machine shops and repeatable component production."],
  ["Automated Manufacturing","Automated production lines and improved material utilisation."],
  ["Heavy Industrial Complexes","Large-scale fabrication, processing and equipment production."],
  ["Integrated Production Systems","Highly automated colony-wide industrial manufacturing."]
];
const mining=[
  ["Surface Recovery","Hand tools and light machinery for exposed and renewable resources."],
  ["Quarrying","Bulk excavation unlocks stone, clay, silica and shallow beds."],
  ["Shaft Mining","Underground mines unlock iron, copper, coal and structural minerals."],
  ["Deep Mining","Deep workings unlock advanced metals, precious ores and gemstones."],
  ["Rotary Drilling","Drilling rigs unlock oil and natural gas extraction."],
  ["Precision Extraction","High-control mining unlocks fissile, magnetic and platinum-group resources."],
  ["Pressure & Brine Drilling","Extreme-pressure wells unlock deep brines and diamond-bearing deposits."],
  ["Deep-Core Extraction","High-temperature deep-core systems unlock exotic minerals."],
  ["Exotic Matter Separation","Advanced separation unlocks exotic fuel crystals and crystals."],
  ["Quantum Bore Systems","Top-tier extraction unlocks the most extreme element deposits."]
];

const powerFuel=[.10,.085,.070,.050,.035];
const foodOutput=[1,1.12,1.28,1.48,1.72];
const synthetic=[0,0,15,30,55];
const industryWorkforce=[1,.96,.91,.85,.78];
const industryOre=[1,.96,.90,.83,.75];
const industryProcessing=[1,1.05,1.10,1.18,1.28];
const miningWorkforce=[1,.96,.92,.88,.84,.80,.76,.72,.68,.65];

const buildingTree=(category,rows,extra=()=>({}))=>rows.map((row,index)=>({
  id:`${category}-${index+1}`,category,level:index+1,name:row[0],description:row[1],cost:cost(BUILDING_TECH_COSTS,index+1),maxBuildingLevel:index+1,...extra(index)
}));

export const TECH_TREES=Object.freeze({
  housing:Object.freeze(buildingTree("housing",housing)),
  power:Object.freeze(buildingTree("power",power,i=>({fuelIntensity:powerFuel[i]}))),
  food:Object.freeze(buildingTree("food",food,i=>({productionMultiplier:foodOutput[i],syntheticFood:synthetic[i]}))),
  industry:Object.freeze(buildingTree("industry",industry,i=>({workforceEfficiency:industryWorkforce[i],oreEfficiency:industryOre[i],processingEfficiency:industryProcessing[i]}))),
  mining:Object.freeze(mining.map((row,index)=>({id:`mining-${index+1}`,category:"mining",level:index+1,name:row[0],description:row[1],cost:cost(MINING_TECH_COSTS,index+1),workforceEfficiency:miningWorkforce[index]})))
});

export const TECHNOLOGIES=Object.freeze(Object.values(TECH_TREES).flat());
