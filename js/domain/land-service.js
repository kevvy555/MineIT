import { CONFIG } from "../core/config.js?v=5.5.0";
import { hashString, seededRandom, tileKey } from "../core/utils.js?v=5.5.0";

export const TERRAIN_TYPES=Object.freeze(["plain","hill","mountain","lake"]);
export const TERRAIN_LABELS=Object.freeze({plain:"Plains",hill:"Hills",mountain:"Mountains",lake:"Lake"});
const CANDIDATE_COUNT=8,START=-Math.floor(CONFIG.GRID_SIZE/2),KEEP_FRACTION=.25;
const PROFILE={
  temperate:{mountains:.42,hills:.30,lakes:.46,mountainCenters:2,lakeCenters:2},
  verdant:{mountains:.50,hills:.33,lakes:.39,mountainCenters:1,lakeCenters:2},
  arid:{mountains:.43,hills:.28,lakes:.61,mountainCenters:2,lakeCenters:1},
  frozen:{mountains:.36,hills:.25,lakes:.48,mountainCenters:2,lakeCenters:2},
  barren:{mountains:.31,hills:.22,lakes:.76,mountainCenters:3,lakeCenters:1},
  volcanic:{mountains:.27,hills:.20,lakes:.81,mountainCenters:3,lakeCenters:1},
  deep:{mountains:.30,hills:.22,lakes:.84,mountainCenters:3,lakeCenters:1}
};

const clone=value=>JSON.parse(JSON.stringify(value));
const centerDistance=(x,y,c)=>Math.hypot(x-c.x,y-c.y)/Math.max(.6,c.radius);
const blobScore=(x,y,centers)=>centers.reduce((best,c)=>Math.max(best,1-centerDistance(x,y,c)),0);

export class LandService{
  constructor(){this.start=START;this.end=START+CONFIG.GRID_SIZE-1;}
  isShipTile(x,y){return x===0&&y===0;}
  terrainLabel(terrain){return TERRAIN_LABELS[terrain]||"Unknown";}
  profile(state){return PROFILE[state.contract?.arch]||PROFILE.temperate;}
  inBounds(x,y){return x>=this.start&&x<=this.end&&y>=this.start&&y<=this.end;}
  candidateSeed(state,index){return hashString(`${state.seed}|${state.contract?.uid||"contract"}|land|${index}`);}
  centers(random,count,radiusMin,radiusMax){return Array.from({length:count},()=>({x:this.start+random()*CONFIG.GRID_SIZE,y:this.start+random()*CONFIG.GRID_SIZE,radius:radiusMin+random()*(radiusMax-radiusMin)}));}
  generateCandidate(state,index){
    const random=seededRandom(this.candidateSeed(state,index)),profile=this.profile(state),mountainCenters=this.centers(random,profile.mountainCenters,1.7,3.5),lakeCenters=this.centers(random,profile.lakeCenters,1.2,2.7),cells=[];
    const mountainShift=(random()-.5)*.12,lakeShift=(random()-.5)*.14;
    for(let y=this.start;y<=this.end;y++)for(let x=this.start;x<=this.end;x++){
      const jitter=(random()-.5)*.18,mountain=blobScore(x,y,mountainCenters)+jitter,lake=blobScore(x,y,lakeCenters)+(random()-.5)*.12;
      let terrain="plain";
      if(lake>profile.lakes+lakeShift&&mountain<profile.mountains+.12)terrain="lake";
      else if(mountain>profile.mountains+mountainShift)terrain="mountain";
      else if(mountain>profile.hills+mountainShift)terrain="hill";
      if(this.isShipTile(x,y))terrain="plain";
      const variant=1+(hashString(`${this.candidateSeed(state,index)}|${x}|${y}|${terrain}`)%4);
      cells.push({x,y,terrain,variant});
    }
    this.smooth(cells);
    const counts=Object.fromEntries(TERRAIN_TYPES.map(t=>[t,cells.filter(c=>c.terrain===t).length]));
    return{id:`site-${index+1}`,index,seed:this.candidateSeed(state,index),cells,counts};
  }
  smooth(cells){
    const byKey=new Map(cells.map(c=>[tileKey(c.x,c.y),c]));
    for(let pass=0;pass<2;pass++){
      const changes=[];
      for(const cell of cells){
        if(this.isShipTile(cell.x,cell.y))continue;
        const neighbors=[];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=byKey.get(tileKey(cell.x+dx,cell.y+dy));if(n)neighbors.push(n.terrain);}
        const counts={};for(const t of neighbors)counts[t]=(counts[t]||0)+1;const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
        if(dominant&&dominant[1]>=3&&cell.terrain!==dominant[0])changes.push([cell,dominant[0]]);
      }
      for(const [cell,terrain] of changes)cell.terrain=terrain;
    }
    const ship=byKey.get(tileKey(0,0));if(ship)ship.terrain="plain";
  }
  generateCandidates(state){return Array.from({length:CANDIDATE_COUNT},(_,i)=>this.generateCandidate(state,i));}
  ensure(state){
    state.colony||={};
    if(state.colony.land?.candidates?.length===CANDIDATE_COUNT){this.ensureTerrainOnTiles(state);return state.colony.land;}
    const hadTiles=Object.keys(state.tiles||{}).length>0,land={candidateCount:CANDIDATE_COUNT,candidates:this.generateCandidates(state),selectedIndex:hadTiles?0:null,settled:hadTiles,view:"land",moves:0,baseHousingLevel:Math.max(1,Number(state.colony.housingLevel)||1),baseHousingCapacity:Math.max(CONFIG.START_HOUSING,Number(state.colony.housingCapacity)||CONFIG.START_HOUSING),baseIndustryLevel:Math.max(1,Number(state.colony.industryLevel)||1)};
    state.colony.land=land;
    if(hadTiles)this.applyCandidate(state,0,{preserve:true});
    else{state.status="site-selection";state.speed=0;state.camera={x:this.start,y:this.start};}
    return land;
  }
  ensureTerrainOnTiles(state){const land=state.colony?.land;if(!land?.settled||land.selectedIndex===null)return;const candidate=land.candidates[land.selectedIndex];if(!candidate)return;const byKey=new Map(candidate.cells.map(c=>[tileKey(c.x,c.y),c]));for(const tile of Object.values(state.tiles||{})){const c=byKey.get(tileKey(tile.x,tile.y));if(c){tile.terrain||=c.terrain;tile.terrainVariant||=c.variant;}this.syncExtraction(tile);}}
  candidate(state,index){return this.ensure(state).candidates[index]||null;}
  trimInventory(state){
    for(const entry of Object.values(state.inventory||{})){
      let total=0;if(entry.qualityBands){for(const band of Object.values(entry.qualityBands)){band.amount=Math.floor(Math.max(0,Number(band.amount)||0)*KEEP_FRACTION);total+=band.amount;}}else total=Math.floor(Math.max(0,Number(entry.amount)||0)*KEEP_FRACTION);entry.amount=total;
    }
  }
  applyCandidate(state,index,{preserve=false,abandon=false}={}){
    const land=this.ensure(state),candidate=land.candidates[index];if(!candidate)return{ok:false,reason:"Landing site not found."};const priorStatus=state.status;
    if(abandon){this.trimInventory(state);land.moves=(land.moves||0)+1;land.baseHousingLevel=1;land.baseHousingCapacity=CONFIG.START_HOUSING;land.baseIndustryLevel=1;state.colony.housingLevel=1;state.colony.housingCapacity=CONFIG.START_HOUSING;state.colony.industryLevel=1;}
    const previous=preserve?state.tiles||{}:{},tiles={};
    for(const cell of candidate.cells){const key=tileKey(cell.x,cell.y),tile=previous[key]||{x:cell.x,y:cell.y,revealed:false,developed:false,level:0,depleted:false};tile.x=cell.x;tile.y=cell.y;tile.terrain=cell.terrain;tile.terrainVariant=cell.variant;tile.development??=null;tile.resourceCovered=!!tile.resourceCovered;this.syncExtraction(tile);tiles[key]=tile;}
    state.tiles=tiles;state.scans=[];state.scanQueue=[];state.camera={x:this.start,y:this.start};land.selectedIndex=index;land.settled=true;land.view="land";state.status=state.contract?.ended?"liability":priorStatus==="site-selection"?"playing":priorStatus||"playing";state.speed=1;return{ok:true,candidate};
  }
  settle(state,index,options={}){return this.applyCandidate(state,index,{preserve:false,abandon:!!options.abandon});}
  syncExtraction(tile,addedBuild=0){
    if(!tile?.developed||!tile.resourceId){if(tile?.development?.kind==="extract")tile.development=null;return;}
    const family=this.extractionFamily(tile),existing=tile.development?.kind==="extract"?tile.development:{kind:"extract",family,level:tile.level||1,investedBuild:0};existing.family=family;existing.level=Math.max(1,Math.min(5,Number(tile.level)||1));existing.investedBuild=Math.max(0,Number(existing.investedBuild)||0)+Math.max(0,Number(addedBuild)||0);tile.level=existing.level;tile.development=existing;
  }
  extractionFamily(tile){
    if(tile.type==="food"){if(tile.resourceId==="herd")return"ranch";if(tile.resourceId==="thermal")return"algae";if(["fungal","protein"].includes(tile.resourceId))return"bio";return"farm";}
    if(tile.type==="fuel"&&["oil","gas","brine"].includes(tile.resourceId))return"rig";
    if(tile.type==="build")return"quarry";
    if(tile.type==="ore"&&["diamond","exotic","crystal","advanced"].includes(tile.resourceId))return"deep-mine";
    return"mine";
  }
  terrainCostMultiplier(terrain,kind){
    if(terrain==="lake")return Infinity;
    if(kind==="housing")return terrain==="plain"?1:terrain==="hill"?1.2:1.65;
    if(kind==="industry")return terrain==="plain"?1:terrain==="hill"?1.15:1.45;
    return 1;
  }
  terrainYieldFactor(tile){
    if(tile.terrain==="mountain"&&tile.type==="ore")return 1.12;
    if(tile.terrain==="hill"&&tile.type==="build")return 1.12;
    if(tile.terrain==="plain"&&tile.type==="food")return 1.10;
    if(tile.terrain==="lake"&&tile.type==="food")return 1.18;
    return 1;
  }
  cloneCandidate(candidate){return clone(candidate);}
}
