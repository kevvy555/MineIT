export const RESOURCE_TYPES = Object.freeze({
  food:[
    {id:"fungal",name:"Fungal Shelf",rarity:"Common",weight:22,multiplier:1.00,qualityBias:.98,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.08},
    {id:"flora",name:"Edible Flora",rarity:"Common",weight:20,multiplier:1.05,qualityBias:1.02,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.10},
    {id:"herd",name:"Grazing Herd",rarity:"Uncommon",weight:15,multiplier:1.16,qualityBias:1.08,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.14},
    {id:"nutrient",name:"Nutrient Crop",rarity:"Uncommon",weight:15,multiplier:1.23,qualityBias:1.10,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.12},
    {id:"protein",name:"Protein Bloom",rarity:"Rare",weight:10,multiplier:1.45,qualityBias:1.20,renewable:true,miningLevel:2,scanningLevel:1,unlock:"Quarrying & Field Processing",sellPrice:.20},
    {id:"thermal",name:"Thermal Algae",rarity:"Rare",weight:6,multiplier:1.70,qualityBias:1.28,renewable:true,miningLevel:3,scanningLevel:2,unlock:"Shaft Mining",sellPrice:.28},
    {id:"synthetic",name:"Synthetic Nutrient",rarity:"Manufactured",weight:0,multiplier:1,qualityBias:1,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Food Production Tech",sellPrice:.12,manufactured:true}
  ],
  build:[
    {id:"fiber",name:"Construction Fibre",rarity:"Common",weight:14,multiplier:.90,qualityBias:.95,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.12},
    {id:"stone",name:"Stone",rarity:"Very Common",weight:26,multiplier:1.00,qualityBias:.92,renewable:false,miningLevel:2,scanningLevel:1,unlock:"Quarrying",sellPrice:.10},
    {id:"clay",name:"Clay",rarity:"Common",weight:18,multiplier:1.05,qualityBias:.98,renewable:false,miningLevel:2,scanningLevel:2,unlock:"Quarrying",sellPrice:.11},
    {id:"silica",name:"Silica",rarity:"Common",weight:16,multiplier:1.10,qualityBias:1.00,renewable:false,miningLevel:2,scanningLevel:2,unlock:"Quarrying",sellPrice:.14},
    {id:"limestone",name:"Limestone",rarity:"Common",weight:15,multiplier:1.08,qualityBias:.98,renewable:false,miningLevel:2,scanningLevel:2,unlock:"Quarrying",sellPrice:.12},
    {id:"structural",name:"Structural Mineral",rarity:"Uncommon",weight:8,multiplier:1.35,qualityBias:1.12,renewable:false,miningLevel:3,scanningLevel:3,unlock:"Shaft Mining",sellPrice:.20},
    {id:"ceramic",name:"Advanced Ceramic Feedstock",rarity:"Rare",weight:3,multiplier:1.70,qualityBias:1.25,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:.34}
  ],
  fuel:[
    {id:"biomass",name:"Biomass",rarity:"Common",weight:22,multiplier:.75,qualityBias:.92,renewable:true,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.16},
    {id:"peat",name:"Peat Bed",rarity:"Common",weight:14,multiplier:.95,qualityBias:.95,renewable:false,miningLevel:2,scanningLevel:2,unlock:"Quarrying",sellPrice:.20},
    {id:"coal",name:"Coal Seam",rarity:"Common",weight:22,multiplier:1.15,qualityBias:1.00,renewable:false,miningLevel:3,scanningLevel:3,unlock:"Shaft Mining",sellPrice:.28},
    {id:"oil",name:"Crude Oil",rarity:"Uncommon",weight:14,multiplier:1.45,qualityBias:1.10,renewable:false,miningLevel:5,scanningLevel:5,unlock:"Rotary Drilling",sellPrice:.44},
    {id:"gas",name:"Natural Gas",rarity:"Uncommon",weight:12,multiplier:1.55,qualityBias:1.12,renewable:false,miningLevel:5,scanningLevel:5,unlock:"Rotary Drilling",sellPrice:.48},
    {id:"fissile",name:"Fissile Mineral",rarity:"Rare",weight:8,multiplier:1.80,qualityBias:1.25,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:.80},
    {id:"brine",name:"Hydrogen-rich Brine",rarity:"Rare",weight:6,multiplier:2.00,qualityBias:1.30,renewable:false,miningLevel:7,scanningLevel:7,unlock:"Pressure & Brine Drilling",sellPrice:.95},
    {id:"exotic-fuel",name:"Exotic Fuel Crystal",rarity:"Exceptional",weight:2,multiplier:3.00,qualityBias:1.60,renewable:false,miningLevel:9,scanningLevel:9,unlock:"Exotic Matter Separation",sellPrice:2.20}
  ],
  ore:[
    {id:"surface-iron",name:"Surface Iron Nodules",rarity:"Common",weight:18,multiplier:.75,qualityBias:.90,renewable:false,miningLevel:1,scanningLevel:1,unlock:"Surface Recovery",sellPrice:.30},
    {id:"iron",name:"Iron Ore",rarity:"Common",weight:22,multiplier:1.00,qualityBias:.98,renewable:false,miningLevel:3,scanningLevel:3,unlock:"Shaft Mining",sellPrice:.42},
    {id:"copper",name:"Copper Ore",rarity:"Uncommon",weight:15,multiplier:1.18,qualityBias:1.06,renewable:false,miningLevel:3,scanningLevel:3,unlock:"Shaft Mining",sellPrice:.60},
    {id:"reactive",name:"Reactive Metal Ore",rarity:"Uncommon",weight:9,multiplier:1.35,qualityBias:1.14,renewable:false,miningLevel:4,scanningLevel:4,unlock:"Deep Mining",sellPrice:.85},
    {id:"conductive",name:"Conductive Ore",rarity:"Rare",weight:7,multiplier:1.55,qualityBias:1.20,renewable:false,miningLevel:4,scanningLevel:4,unlock:"Deep Mining",sellPrice:1.10},
    {id:"silver",name:"Silver",rarity:"Rare",weight:7,multiplier:1.70,qualityBias:1.20,renewable:false,miningLevel:4,scanningLevel:4,unlock:"Deep Mining",sellPrice:2.50},
    {id:"gold",name:"Gold",rarity:"Very Rare",weight:5,multiplier:2.20,qualityBias:1.32,renewable:false,miningLevel:4,scanningLevel:4,unlock:"Deep Mining",sellPrice:5.00},
    {id:"gems",name:"Gemstone Deposit",rarity:"Very Rare",weight:4,multiplier:2.60,qualityBias:1.38,renewable:false,miningLevel:4,scanningLevel:4,unlock:"Deep Mining",sellPrice:6.50},
    {id:"platinum",name:"Platinum",rarity:"Exceptional",weight:3,multiplier:3.00,qualityBias:1.45,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:9.00},
    {id:"palladium",name:"Palladium",rarity:"Exceptional",weight:2.5,multiplier:3.20,qualityBias:1.48,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:10.00},
    {id:"sapphire",name:"Sapphire",rarity:"Exceptional",weight:2,multiplier:3.30,qualityBias:1.50,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:12.00},
    {id:"ruby",name:"Ruby",rarity:"Exceptional",weight:1.7,multiplier:3.50,qualityBias:1.55,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:14.00},
    {id:"emerald",name:"Emerald",rarity:"Exceptional",weight:1.5,multiplier:3.60,qualityBias:1.58,renewable:false,miningLevel:6,scanningLevel:6,unlock:"Precision Extraction",sellPrice:15.00},
    {id:"diamond",name:"Diamond",rarity:"Ultra Rare",weight:1.2,multiplier:4.20,qualityBias:1.70,renewable:false,miningLevel:7,scanningLevel:7,unlock:"Pressure & Brine Drilling",sellPrice:22.00},
    {id:"magnetic",name:"Magnetic Ore",rarity:"Rare",weight:3,multiplier:2.10,qualityBias:1.35,renewable:false,miningLevel:6,scanningLevel:4,unlock:"Precision Extraction",sellPrice:2.40},
    {id:"exotic",name:"Exotic Industrial Mineral",rarity:"Ultra Rare",weight:.8,multiplier:5.00,qualityBias:1.75,renewable:false,miningLevel:8,scanningLevel:8,unlock:"Deep-Core Extraction",sellPrice:35.00},
    {id:"crystal",name:"Exotic Crystal",rarity:"Ultra Rare",weight:.5,multiplier:6.00,qualityBias:1.90,renewable:false,miningLevel:9,scanningLevel:9,unlock:"Exotic Matter Separation",sellPrice:55.00},
    {id:"advanced",name:"Advanced Element Deposit",rarity:"Unique",weight:.3,multiplier:8.00,qualityBias:2.00,renewable:false,miningLevel:10,scanningLevel:10,unlock:"Quantum Bore Systems",sellPrice:90.00}
  ]
});
export const CATEGORY_ORDER=["food","build","fuel","ore"];
export const CATEGORY_NAMES=Object.freeze({food:"Food",build:"Build",fuel:"Fuel",ore:"Ore"});
