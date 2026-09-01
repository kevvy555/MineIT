/**
 * Canonical Stage 8 buyer identity catalogue.
 *
 * This is a code-compact representation of the approved 1,000-row static catalogue from
 * BuyerAndShipImageDirectory.html. It uses only the directory's fixed seed (8302026), never
 * game/runtime randomness, and exports immutable identities. Buyer N always maps to Buyer Ship N.
 */
const DIRECTORY_SEED=8302026;
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const R=rng(DIRECTORY_SEED),pick=a=>a[Math.floor(R()*a.length)],shuffle=a=>{a=[...a];for(let i=a.length-1;i;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const FIRST="Ada Aiko Alina Amara Anika Aria Asha Avery Bea Cai Camila Carmen Cassia Celeste Dahlia Dara Devin Elias Elin Emi Esra Farah Felix Freya Hana Hugo Idris Imani Iris Jalen Jia Jonah Kael Kara Kian Lena Leona Lian Lucia Mara Mateo Mei Mira Nadia Niko Noa Nora Oren Priya Rafi Rhea Rin Rosa Sami Selene Sora Talia Tomas Vale Vera Yara Zane Zuri".split(" ");
const LAST="Akari Alvarez Arden Baines Batra Bell Cade Chen Corin Dane Duarte Elian Fenn Foster Grey Haddad Hale Ibarra Ilyin Jin Kade Kaur Kessler Khan Kim Kovac Laghari Lennox Li Mercer Mori Nadir Nolan Okafor Osei Park Quinn Rahman Reyes Rook Sato Silva Singh Sol Tanaka Vale Varga Vey Voss Wren Yun Zoric".split(" ");
const COMPANY_PREFIX="Meridian Helix Torren Axiom Redshift Orison Kestrel Pallas Crownline Nacre Solari Frontier Terranova Voltari PetroCore Aurelia Novaris Keystone Parallax Northstar Blueforge Cinder Vertex Arcadia Lattice Promethean Vector Polaris Everlight Tangent Ironveil Silverline Radiant Strata Argent Nimbus Deepwell Horizon Continuum Beacon Cobalt Granite Ember Halcyon Nova Pioneer Summit Atlas Vanguard Longreach".split(" ");
const COMPANY_SUFFIX="Resources Industries Systems Fabrication Holdings Cooperative Works Dynamics Consortium Combine Logistics Engineering Materials Energy Aerospace Infrastructure Biotech Processing Manufacturing Research".split(" ");
const SHIP_PREFIX="Halcyon Quiet Long Blue Silver Golden Iron Amber Cobalt Radiant Far High Deep Bright Silent Swift Grey Red White Black Northern Southern Eastern Western Solar Lunar Stellar Distant Burning Frozen Verdant Obsidian Crimson Azure Copper Ivory Emerald Violet Pale Rising".split(" ");
const SHIP_SUFFIX="Reach Meridian Horizon Lantern Crown Passage Ember Star Vector Prospector Voyager Anchor Compass Venture Pilgrim Current Forge Foundry Atlas Beacon Comet Arrow Bridge Gate Spire Citadel Summit Frontier Path Harbor Relay Trail Resolve Endeavor Fortune Motive Accord Promise Legacy Witness".split(" ");
const HOME_PREFIX="Aster Boreal Cinder Delta Eos Farpoint Galen Helios Iona Juno Kepler Lumen Mira Nadir Orion Pavo Quill Rhea Solace Triton Umbra Vega Warden Xanthe Yarrow Zenith".split(" ");
const HOME_SUFFIX="Reach Basin Gate Station Arc Colony Exchange Spur Haven Yards Territory Cluster Port March Sector".split(" ");

export const BUYER_BUSINESS_TYPES=Object.freeze([
  ["Mining equipment & geological services","Procurement Director","Stone,Structural Mineral,Iron Ore,Copper Ore,Reactive Metal Ore"],
  ["Heavy engineering & industrial fabrication","Industrial Sourcing Manager","Iron Ore,Copper Ore,Structural Mineral,Conductive Ore"],
  ["Shipbuilding & propulsion systems","Shipyard Supply Lead","Reactive Metal Ore,Conductive Ore,Magnetic Ore,Platinum,Palladium"],
  ["Electronics & sensor manufacturing","Sensor Supply Manager","Copper Ore,Conductive Ore,Silica,Silver,Gold"],
  ["Energy generation & grid infrastructure","Energy Contracts Manager","Coal Seam,Natural Gas,Fissile Mineral,Hydrogen-rich Brine"],
  ["Fuel refining & propellant processing","Fuel Procurement Controller","Biomass,Peat Bed,Crude Oil,Natural Gas,Exotic Fuel Crystal"],
  ["Construction & civil infrastructure","Infrastructure Procurement Lead","Stone,Clay,Silica,Limestone,Construction Fibre"],
  ["Habitat fabrication & life-support systems","Habitat Materials Director","Construction Fibre,Structural Mineral,Silica,Advanced Ceramic Feedstock"],
  ["Agriculture & food processing","Food Supply Director","Fungal Shelf,Edible Flora,Nutrient Crop,Protein Bloom,Thermal Algae"],
  ["Medical & biochemical manufacturing","Medical Materials Buyer","Protein Bloom,Thermal Algae,Synthetic Nutrient,Hydrogen-rich Brine"],
  ["Precision instruments & metrology","Precision Materials Director","Conductive Ore,Silver,Gold,Platinum,Sapphire"],
  ["Jewellery & luxury materials","Precious Materials Director","Silver,Gold,Gemstone Deposit,Sapphire,Ruby,Emerald,Diamond"],
  ["Research laboratories & advanced materials","Research Procurement Director","Advanced Ceramic Feedstock,Fissile Mineral,Exotic Industrial Mineral,Exotic Crystal"],
  ["Reactor engineering & nuclear systems","Reactor Materials Buyer","Fissile Mineral,Hydrogen-rich Brine,Magnetic Ore,Advanced Element Deposit"],
  ["Aerospace manufacturing","Aerospace Materials Director","Reactive Metal Ore,Magnetic Ore,Advanced Ceramic Feedstock,Platinum"],
  ["Planetary infrastructure & utilities","Utilities Procurement Director","Stone,Limestone,Structural Mineral,Coal Seam,Natural Gas"],
  ["Interstellar logistics & warehousing","Logistics Supply Director","Construction Fibre,Iron Ore,Copper Ore"],
  ["Advanced optics & photonics","Photonics Materials Director","Silica,Conductive Ore,Sapphire,Exotic Crystal"],
  ["High-pressure industrial chemistry","Process Chemistry Buyer","Natural Gas,Hydrogen-rich Brine,Reactive Metal Ore,Diamond"],
  ["Strategic reserve & commodity finance","Commodity Acquisition Director","Silver,Gold,Platinum,Palladium,Diamond"]
].map(([name,role,resources])=>Object.freeze({name,role,resources:Object.freeze(resources.split(","))})));

export const BUYER_SHIP_CLASSES=Object.freeze([
["Dart Courier",2500,"Compact, fast courier built for small high-value consignments and specialist cargo."],
["Wren Shuttle",4000,"Short-range commercial shuttle used by small buyers for frequent light collections."],
["Kestrel Light Freighter",6000,"Nimble light freighter with modest modular holds for mixed industrial cargo."],
["Skipper Packet",8000,"Scheduled packet freighter designed around reliable recurring merchant runs."],
["Nomad Utility Freighter",12000,"Rugged frontier utility ship able to handle varied cargo at remote colonies."],
["Ranger Cargo Cutter",18000,"Compact medium freighter balancing useful capacity with easy Spaceport handling."],
["Wayfarer Freighter",25000,"Common long-haul merchant vessel used by established regional companies."],
["Merchant Lifter",35000,"Reinforced commercial lifter for heavier contract lots and containerised materials."],
["Caravan Freighter",50000,"Modular multi-hold ship used for sustained regional commodity movement."],
["Atlas Hauler",70000,"Heavy-frame hauler designed to move substantial industrial loads reliably."],
["Meridian Bulk Carrier",90000,"Dedicated bulk-material carrier optimised for regular commodity collections."],
["Vanguard Hauler",120000,"High-reliability heavy industrial hauler favoured by major manufacturers."],
["Longreach Freighter",160000,"Endurance-oriented heavy freighter for large recurring intersystem contracts."],
["Foundry Carrier",210000,"Industrial carrier built around dense raw-material and foundry-feedstock loads."],
["Reliant Bulkship",270000,"Redundant commercial bulkship intended for dependable high-volume schedules."],
["Leviathan Freighter",350000,"Very large freight platform for corporations moving serious commodity tonnage."],
["Mammoth Carrier",450000,"Slow, enormous carrier whose huge holds suit sustained bulk purchasing."],
["Colossus Bulkship",575000,"Major bulk transport vessel for large industrial groups and infrastructure firms."],
["Goliath Heavy Freighter",725000,"Massive heavy freighter used when contract volume becomes a strategic supply-chain concern."],
["Citadel Carrier",900000,"Robust strategic carrier with multiple segregated holds for major corporate contracts."],
["Bastion Superfreighter",1100000,"Self-contained superfreighter supporting very large recurring buyer operations."],
["Monolith Bulk Carrier",1350000,"Deep-hold megacarrier focused on enormous single-resource commodity loads."],
["Horizon Superfreighter",1600000,"Long-range superfreighter used by intersystem commercial networks."],
["Dominion Carrier",1900000,"Fleet-grade strategic carrier owned by major multi-system corporations."],
["Titan Logistics Carrier",2200000,"Integrated logistics carrier for buyers operating at industrial-network scale."],
["Continental Bulkship",2500000,"Planetary-scale bulk mover able to absorb output from mature mining colonies."],
["Hyperion Supercarrier",2800000,"Premium megacarrier with multiple enormous cargo sections for demanding strategic buyers."],
["Keystone Megafreighter",3200000,"Backbone vessel for corporations whose supply chains depend on continuous massive inflow."],
["Panstellar Megacarrier",3600000,"Interstellar megacarrier serving the largest commercial organisations in the network."],
["Worldline Mass Freighter",4000000,"The largest buyer vessel in this service, reserved for exceptional late-game bulk contracts."]
].map(([name,capacity,description],i)=>Object.freeze({id:i+1,name,capacity,description})));

const EARLY="Stone,Structural Mineral,Iron Ore,Copper Ore,Construction Fibre,Clay,Silica,Limestone,Biomass,Peat Bed,Coal Seam,Fungal Shelf,Edible Flora,Nutrient Crop,Protein Bloom,Surface Iron Nodules,Silver,Gold,Gemstone Deposit".split(",");
const MID=new Set(EARLY.concat("Reactive Metal Ore,Conductive Ore,Magnetic Ore,Platinum,Palladium,Sapphire,Ruby,Emerald,Diamond,Advanced Ceramic Feedstock,Crude Oil,Natural Gas,Fissile Mineral,Hydrogen-rich Brine,Thermal Algae,Synthetic Nutrient".split(",")));
const SKIN="very fair,fair,light olive,warm beige,golden tan,medium brown,deep brown,rich dark brown,copper-brown,cool brown".split(","),HAIR="black,dark brown,chestnut,auburn,salt-and-pepper,silver,platinum blond,dark blond,blue-black,copper".split(","),STYLE="short textured crop,neat side-parted cut,close-cropped hair,shoulder-length waves,tight curls swept back,high undercut,braided crown,loose natural curls,sleek bob,long hair tied back,asymmetrical swept style,soft layered cut,coiled updo,braided undercut,wavy chin-length cut".split(","),EYES="dark brown,brown,hazel,green,grey,blue,amber".split(","),MOOD="calm analytical,confident demanding,warm businesslike,reserved precise,experienced pragmatic,ambitious energetic,stern fair,quietly authoritative,friendly observant,focused intense".split(","),OUTFIT="graphite utility jacket,charcoal executive uniform,industrial procurement coat,slate corporate jacket,navy commercial uniform,black technical blazer,premium field-procurement coat,dark logistics uniform,high-status colony suit,structured operations jacket".split(","),LIVERY="graphite/bronze,white/graphite,navy/teal,gunmetal/amber,matte black/silver,pale grey/cobalt,industrial olive/cream,charcoal/copper,white/orange,steel blue/white,sand-grey/burgundy,black alloy/blue".split(",");
const NAMES=shuffle(FIRST.flatMap(f=>LAST.map(l=>`${f} ${l}`))).slice(0,1000),COMPANIES=shuffle(COMPANY_PREFIX.flatMap(a=>COMPANY_SUFFIX.map(b=>`${a} ${b}`))).slice(0,1000),SHIPS=shuffle(SHIP_PREFIX.flatMap(a=>SHIP_SUFFIX.map(b=>`CSV ${a} ${b}`))).slice(0,1000),HOMES=shuffle(HOME_PREFIX.flatMap(a=>HOME_SUFFIX.map(b=>`${a} ${b}`))).slice(0,1000);
const tierFor=rep=>rep<10?["Entry",1,8]:rep<25?["Regional",4,12]:rep<50?["Major",8,18]:rep<75?["Strategic",13,24]:["Premier",18,30];
const resourceChoices=(business,rep)=>{const allowed=rep<20?new Set(EARLY):rep<60?MID:null;let result=allowed?business.resources.filter(x=>allowed.has(x)):[...business.resources];if(!result.length)result=rep<20?EARLY:[...MID];return shuffle(result).slice(0,Math.min(3,result.length));};

export const BUYER_IDENTITIES=Object.freeze(Array.from({length:1000},(_,i)=>{
  const minRep=+(100*Math.pow(i/999,1.35)).toFixed(2),tier=tierFor(minRep),business=BUYER_BUSINESS_TYPES[Math.floor(R()*BUYER_BUSINESS_TYPES.length)],shipIndex=tier[1]-1+Math.floor(R()*(tier[2]-tier[1]+1)),shipClass=BUYER_SHIP_CLASSES[shipIndex],age=27+Math.floor(R()*41),gender=pick(["woman","man","androgynous person"]),resources=resourceChoices(business,minRep),home=HOMES[i],quality=pick(tier[0]==="Entry"?["Common","Good"]:tier[0]==="Regional"?["Good","Good","Excellent"]:["Good","Excellent","Exceptional"]);
  pick(SKIN);pick(HAIR);pick(STYLE);pick(EYES);pick(MOOD);pick(OUTFIT);pick(LIVERY);void age;void gender;
  const n=String(i+1).padStart(4,"0");
  return Object.freeze({id:`buyer-${n}`,index:i+1,name:NAMES[i],role:business.role,companyId:`company-${n}`,company:COMPANIES[i],businessType:business.name,tier:tier[0],home,minRep,resourceInterests:Object.freeze(resources),typicalQuality:quality,shipName:SHIPS[i],shipClassId:shipClass.id,portraitKey:`buyer-${n}.webp`,shipImageKey:`buyer-ship-${n}.webp`});
}));

export const buyerIdentity=id=>BUYER_IDENTITIES.find(b=>b.id===id)||null;
export const buyerShipClass=id=>BUYER_SHIP_CLASSES.find(s=>s.id===Number(id))||null;
export const businessType=name=>BUYER_BUSINESS_TYPES.find(b=>b.name===name)||null;
