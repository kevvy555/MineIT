const powerNames=[
  ["Combustion Generator","Basic chemical-fuel generators for a small surface colony."],
  ["Steam Turbine Grid","Larger thermal plant and district power distribution."],
  ["Gas Turbine Grid","High-output generators and sealed habitat support."],
  ["Fission Reactor","Compact reactors suitable for harsh and hot-world colonies."],
  ["High-Flux Fission","High-density reactor parks for major industrial settlements."],
  ["Fusion Reactor","Sustained fusion power for large deep-reach colonies."],
  ["Compact Fusion Grid","Distributed fusion with very high colony capacity."],
  ["Antimatter-Catalysed Grid","Extreme-density power for advanced extraction worlds."],
  ["Vacuum Energy Array","Near post-scarcity colony-scale power generation."],
  ["Stellar Tap","Extreme power infrastructure for the largest possible claims."]
];
const powerCapacity=[30,60,110,190,320,520,850,1350,2200,3600];
const fuelIntensity=[.10,.09,.08,.065,.055,.045,.035,.025,.016,.010];
const popCaps=[250,500,900,1500,2500,4000,6500,10000,16000,25000];
const industryCaps=[2,4,7,11,16,23,32,44,60,80];
const foodNames=[
  ["Field Agriculture","Basic open-air cultivation and husbandry on hospitable worlds."],
  ["Controlled Greenhouses","Protected agriculture with improved use of local food resources."],
  ["Sealed Hydroponics","Closed food production for barren worlds and non-breathable atmospheres."],
  ["Aeroponics","High-density controlled agriculture with low water and land demand."],
  ["Synthetic Protein","Industrial protein production independent of local animal life."],
  ["Closed-Loop Biospheres","Recycling-intensive food systems for large sealed colonies."],
  ["Atmospheric Nutrient Synthesis","Processes hostile local atmospheres into agricultural feedstock."],
  ["Chemosynthetic Farming","Food production from mineral and chemical energy pathways."],
  ["Molecular Food Fabrication","Direct molecular assembly of colony foodstocks."],
  ["Matter Synthesis","Extreme closed-loop food production with minimal planetary dependence."]
];
const foodMult=[1,1.12,1.28,1.48,1.72,2.05,2.45,2.95,3.60,4.50];
const synthetic=[0,0,15,30,55,90,140,210,320,500];
const miningNames=[
  ["Surface Recovery","Hand tools and light machinery for exposed and renewable resources."],
  ["Quarrying","Quarries and bulk excavation unlock stone, clay, silica and shallow beds."],
  ["Shaft Mining","Underground mines unlock iron, copper, coal and structural minerals."],
  ["Deep Mining","Deep workings unlock advanced metals, precious ores and gemstones."],
  ["Rotary Drilling","Drilling rigs unlock oil and natural gas extraction."],
  ["Precision Extraction","High-control mining unlocks fissile, magnetic and platinum-group resources."],
  ["Pressure & Brine Drilling","Extreme-pressure wells unlock deep brines and diamond-bearing deposits."],
  ["Deep-Core Extraction","High-temperature deep-core systems unlock exotic minerals."],
  ["Exotic Matter Separation","Advanced separation unlocks exotic fuel crystals and crystals."],
  ["Quantum Bore Systems","Top-tier extraction unlocks the most extreme element deposits."]
];
const miningMult=[1,1.12,1.28,1.48,1.72,2.00,2.35,2.80,3.40,4.20];
function cost(level){return level===1?0:Math.round(9000*Math.pow(1.62,level-2));}
export const TECH_TREES=Object.freeze({
  power:powerNames.map((x,i)=>({id:`power-${i+1}`,category:"power",level:i+1,name:x[0],description:x[1],cost:cost(i+1),powerCapacity:powerCapacity[i],fuelIntensity:fuelIntensity[i],populationCap:popCaps[i],industryCap:industryCaps[i]})),
  food:foodNames.map((x,i)=>({id:`food-${i+1}`,category:"food",level:i+1,name:x[0],description:x[1],cost:cost(i+1),productionMultiplier:foodMult[i],syntheticFood:synthetic[i]})),
  mining:miningNames.map((x,i)=>({id:`mining-${i+1}`,category:"mining",level:i+1,name:x[0],description:x[1],cost:cost(i+1),extractionMultiplier:miningMult[i]}))
});
export const TECHNOLOGIES=Object.freeze(Object.values(TECH_TREES).flat());
