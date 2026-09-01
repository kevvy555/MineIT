const BUILDING_TECH_COSTS=[0,25000,90000,300000,1000000];
const MINING_TECH_COSTS=[0,15000,60000,200000,650000,2300000,8000000,26000000,85000000,260000000];
const SCANNING_TECH_COSTS=[0,10000,30000,100000,350000,1200000,4000000,14000000,45000000,140000000];
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
  ["Quarrying","Bulk excavation equipment for stone, clay, silica and shallow beds."],
  ["Shaft Mining","Underground mining systems for common metals, coal and structural minerals."],
  ["Deep Mining","Deep-working equipment for advanced metals, precious ores and gemstones."],
  ["Rotary Drilling","Drilling rigs and well-control equipment for oil and natural gas."],
  ["Precision Extraction","High-control extraction systems for fissile, magnetic and platinum-group resources."],
  ["Pressure & Brine Drilling","Extreme-pressure equipment for deep brines and diamond-bearing deposits."],
  ["Deep-Core Extraction","High-temperature deep-core mining systems for exotic minerals."],
  ["Exotic Matter Separation","Advanced extraction and separation equipment for exotic crystals and fuels."],
  ["Quantum Bore Systems","Top-tier extraction systems for the most extreme element deposits."]
];
const scanning=[
  ["Surface Survey Suite","Basic scanners for obvious surface resources and strong geological signatures. New discoveries at L1: Fungal Shelf, Edible Flora, Grazing Herd, Nutrient Crop, Protein Bloom, Construction Fibre, Stone, Biomass and Surface Iron Nodules."],
  ["Shallow Geophysical Survey","Improved instruments for shallow beds and weaker near-surface signatures. New discoveries at L2: Thermal Algae, Clay, Silica, Limestone and Peat Bed."],
  ["Subsurface Tomography","Tomographic survey equipment for common subsurface mineral and fuel deposits. New discoveries at L3: Structural Mineral, Coal Seam, Iron Ore and Copper Ore."],
  ["Deep Spectral Survey","Deep-spectrum sensing for advanced metals, precious ores and gemstone signatures. New discoveries at L4: Reactive Metal Ore, Conductive Ore, Silver, Gold, Gemstone Deposit and Magnetic Ore."],
  ["Seismic Prospecting Array","Seismic and gravimetric equipment for deep fluid reservoirs and drilling targets. New discoveries at L5: Crude Oil and Natural Gas."],
  ["Precision Mineral Spectrometry","High-resolution spectrometry for weak high-value, fissile and specialist mineral signatures. New discoveries at L6: Advanced Ceramic Feedstock, Fissile Mineral, Platinum, Palladium, Sapphire, Ruby and Emerald."],
  ["High-Pressure Geochemistry","Advanced geochemical sensing for extreme-pressure deposits, deep brines and diamonds. New discoveries at L7: Hydrogen-rich Brine and Diamond."],
  ["Deep-Core Imaging","High-energy imaging systems capable of resolving high-temperature deep-core deposits. New discoveries at L8: Exotic Industrial Mineral."],
  ["Exotic Matter Detection","Specialist sensor arrays for exotic crystals and unusual matter signatures. New discoveries at L9: Exotic Fuel Crystal and Exotic Crystal."],
  ["Quantum Resonance Survey","Quantum-resonance prospecting capable of resolving the weakest advanced-element signatures. New discoveries at L10: Advanced Element Deposit."]
];

const powerFuel=[.10,.085,.070,.050,.035];
const foodOutput=[1,1.12,1.28,1.48,1.72];
const synthetic=[0,0,15,30,55];
const industryWorkforce=[1,.96,.91,.85,.78];
const industryOre=[1,.96,.90,.83,.75];
const industryProcessing=[1,1.05,1.10,1.18,1.28];
const miningWorkforce=[1,.96,.92,.88,.84,.80,.76,.72,.68,.65];
const surveySlots=[1,1,2,2,3,3,4,4,5,5];
const scanTimeFactor=[1,.975,.950,.925,.900,.875,.850,.825,.800,.775];
const scannerHintTier=[0,0,0,1,1,1,2,2,2,3];

const buildingTree=(category,rows,extra=()=>({}))=>rows.map((row,index)=>({
  id:`${category}-${index+1}`,category,level:index+1,name:row[0],description:row[1],cost:cost(BUILDING_TECH_COSTS,index+1),maxBuildingLevel:index+1,...extra(index)
}));

export const TECH_TREES=Object.freeze({
  housing:Object.freeze(buildingTree("housing",housing)),
  power:Object.freeze(buildingTree("power",power,i=>({fuelIntensity:powerFuel[i]}))),
  food:Object.freeze(buildingTree("food",food,i=>({productionMultiplier:foodOutput[i],syntheticFood:synthetic[i]}))),
  industry:Object.freeze(buildingTree("industry",industry,i=>({workforceEfficiency:industryWorkforce[i],oreEfficiency:industryOre[i],processingEfficiency:industryProcessing[i]}))),
  mining:Object.freeze(mining.map((row,index)=>({id:`mining-${index+1}`,category:"mining",level:index+1,name:row[0],description:row[1],cost:cost(MINING_TECH_COSTS,index+1),workforceEfficiency:miningWorkforce[index]}))),
  scanning:Object.freeze(scanning.map((row,index)=>({id:`scanning-${index+1}`,category:"scanning",level:index+1,name:row[0],description:row[1],cost:cost(SCANNING_TECH_COSTS,index+1),surveySlots:surveySlots[index],scanTimeFactor:scanTimeFactor[index],hintTier:scannerHintTier[index],detectionLevel:index+1})))
});

export const TECHNOLOGIES=Object.freeze(Object.values(TECH_TREES).flat());
