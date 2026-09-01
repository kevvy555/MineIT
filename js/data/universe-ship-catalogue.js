import {
  SHIP_CATALOGUE_FALLBACK,STARTER_SHIP_FALLBACK,SHIP_MANUFACTURERS,
  SHIP_CATALOGUE_FALLBACK_VERSION,SHIP_CATALOGUE_FALLBACK_SOURCE_COMMIT
} from "./universe-ship-catalogue-fallback.js";

const REMOTE_DATA_BASE="https://kevvy555.github.io/MineIT-Universe/data/";
const clone=value=>JSON.parse(JSON.stringify(value));

async function fetchJson(url){
  const response=await fetch(url,{cache:"no-cache"});
  if(!response.ok)throw new Error(`Universe fetch failed (${response.status}) for ${url}`);
  return response.json();
}

async function loadCollection(manifest,name,baseUrl){
  const spec=manifest?.collections?.[name];
  if(!spec)throw new Error(`Universe manifest is missing ${name}.`);
  const files=Array.isArray(spec)?spec:[spec],records=[];
  for(const file of files){
    const rows=await fetchJson(new URL(file,baseUrl));
    if(!Array.isArray(rows))throw new Error(`Universe ${name} shard ${file} must be an array.`);
    records.push(...rows);
  }
  return records;
}

function mergeRuntime(shipClasses,runtimeProfiles){
  const runtimeByClass=new Map(runtimeProfiles.map(profile=>[profile.shipClassId,profile]));
  return shipClasses.map(shipClass=>{
    const runtime=runtimeByClass.get(shipClass.id)||{};
    return{
      ...clone(shipClass),
      specifications:{...(shipClass.specifications||{}),...(runtime.specifications||{})},
      production:{...(shipClass.production||{}),...(runtime.production||{})}
    };
  });
}

/** Read-only MineIT consumer for the canonical Universe ship catalogue. */
export class UniverseShipCatalogue{
  constructor({remoteDataBase=REMOTE_DATA_BASE}={}){
    this.remoteDataBase=remoteDataBase;
    this.source="bundled";
    this.schemaVersion=6;
    this.contentVersion=SHIP_CATALOGUE_FALLBACK_VERSION;
    this.sourceCommit=SHIP_CATALOGUE_FALLBACK_SOURCE_COMMIT;
    this.manufacturers=SHIP_MANUFACTURERS;
    this.records=[...SHIP_CATALOGUE_FALLBACK,STARTER_SHIP_FALLBACK].map(clone);
    this.lastError=null;
    this.loading=null;
  }

  async refresh(){
    if(this.loading)return this.loading;
    this.loading=this.loadRemote().finally(()=>{this.loading=null;});
    return this.loading;
  }

  async loadRemote(){
    try{
      const manifest=await fetchJson(new URL("manifest.json",this.remoteDataBase));
      if(Number(manifest.schemaVersion)<6)throw new Error(`Universe schema ${manifest.schemaVersion} is older than required schema 6.`);
      const[shipClasses,runtimeProfiles]=await Promise.all([
        loadCollection(manifest,"shipClasses",this.remoteDataBase),
        loadCollection(manifest,"shipClassRuntimeProfiles",this.remoteDataBase)
      ]);
      const merged=mergeRuntime(shipClasses,runtimeProfiles),retail=merged.filter(record=>record.retailStatus==="factory-new");
      const starter=merged.find(record=>record.id==="ship-class-asterion-pioneer-colony-transport");
      if(retail.length!==30||!starter)throw new Error("Universe ship catalogue is incomplete for MineIT procurement.");
      this.records=[...retail,starter];
      this.schemaVersion=Number(manifest.schemaVersion);
      this.contentVersion=String(manifest.contentVersion||"");
      this.source="remote";
      this.sourceCommit=null;
      this.lastError=null;
      return{ok:true,source:this.source,contentVersion:this.contentVersion,count:retail.length};
    }catch(error){
      this.lastError=error;
      this.source="bundled";
      return{ok:false,source:this.source,contentVersion:this.contentVersion,error};
    }
  }

  all(){return this.records.map(clone);}
  retail(){return this.records.filter(record=>record.retailStatus==="factory-new").map(clone);}
  classById(id){const found=this.records.find(record=>record.id===id);return found?clone(found):null;}
  starter(){return this.classById("ship-class-asterion-pioneer-colony-transport");}
  manufacturer(id){return this.manufacturers[id]?{id,...this.manufacturers[id]}:{id,name:id,shortName:id,specialisation:""};}
  manufacturerList(){return Object.entries(this.manufacturers).map(([id,value])=>({id,...value}));}
  provenance(){return{source:this.source,schemaVersion:this.schemaVersion,contentVersion:this.contentVersion,sourceCommit:this.sourceCommit,error:this.lastError?.message||null};}
}

// Shared read-only catalogue instance. It is canonical data/cache state, not mutable gameplay state.
export const universeShipCatalogue=new UniverseShipCatalogue();
