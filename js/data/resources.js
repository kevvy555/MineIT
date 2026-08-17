export const RESOURCE_TYPES = Object.freeze({
  food:[
    {id:"fungal",name:"Fungal Shelf",rarity:"Common",weight:22,multiplier:1.00,qualityBias:.98},
    {id:"soil",name:"Nutrient Soil",rarity:"Common",weight:22,multiplier:1.03,qualityBias:1.00},
    {id:"aquifer",name:"Aquifer",rarity:"Common",weight:20,multiplier:1.05,qualityBias:1.02},
    {id:"flora",name:"Edible Flora",rarity:"Uncommon",weight:15,multiplier:1.12,qualityBias:1.08},
    {id:"protein",name:"Protein Bloom",rarity:"Rare",weight:12,multiplier:1.22,qualityBias:1.18},
    {id:"thermal",name:"Thermal Spring",rarity:"Rare",weight:9,multiplier:1.30,qualityBias:1.25}
  ],
  industry:[
    {id:"bulk",name:"Bulk Mineral",rarity:"Very Common",weight:28,multiplier:.65,qualityBias:.82},
    {id:"iron",name:"Iron Ore",rarity:"Common",weight:28,multiplier:1.00,qualityBias:.95},
    {id:"carbon",name:"Carbon Seam",rarity:"Common",weight:18,multiplier:1.05,qualityBias:.98},
    {id:"copper",name:"Copper Ore",rarity:"Uncommon",weight:12,multiplier:1.25,qualityBias:1.08},
    {id:"reactive",name:"Reactive Metal Ore",rarity:"Uncommon",weight:7,multiplier:1.45,qualityBias:1.15},
    {id:"conductive",name:"Conductive Ore",rarity:"Rare",weight:4,multiplier:1.70,qualityBias:1.25},
    {id:"magnetic",name:"Magnetic Ore",rarity:"Rare",weight:2,multiplier:1.90,qualityBias:1.32},
    {id:"exotic",name:"Exotic Industrial Mineral",rarity:"Very Rare",weight:.8,multiplier:2.40,qualityBias:1.48},
    {id:"advanced",name:"Advanced Element Deposit",rarity:"Exceptional",weight:.2,multiplier:3.20,qualityBias:1.70}
  ],
  valuable:[
    {id:"silver",name:"Silver",rarity:"Uncommon",weight:32,multiplier:1.00,qualityBias:1.00},
    {id:"gold",name:"Gold",rarity:"Rare",weight:24,multiplier:2.00,qualityBias:1.10},
    {id:"platinum",name:"Platinum",rarity:"Very Rare",weight:12,multiplier:4.00,qualityBias:1.20},
    {id:"palladium",name:"Palladium",rarity:"Very Rare",weight:10,multiplier:5.00,qualityBias:1.25},
    {id:"gems",name:"Gemstone Deposit",rarity:"Rare",weight:12,multiplier:3.00,qualityBias:1.15},
    {id:"sapphire",name:"Sapphire",rarity:"Very Rare",weight:4,multiplier:5.00,qualityBias:1.35},
    {id:"ruby",name:"Ruby",rarity:"Very Rare",weight:3,multiplier:6.00,qualityBias:1.45},
    {id:"emerald",name:"Emerald",rarity:"Exceptional",weight:1.6,multiplier:7.00,qualityBias:1.50},
    {id:"diamond",name:"Diamond",rarity:"Exceptional",weight:1.0,multiplier:10.00,qualityBias:1.70},
    {id:"crystal",name:"Exotic Crystal",rarity:"Ultra Rare",weight:.4,multiplier:15.00,qualityBias:1.90}
  ]
});
