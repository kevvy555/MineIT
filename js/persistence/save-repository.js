import { CONFIG } from "../core/config.js";

export class SaveRepository {
  constructor(diagnostics){ this.diagnostics=diagnostics; }

  load(){
    try{
      const raw=localStorage.getItem(CONFIG.SAVE_KEY);
      this.diagnostics.info("save load",{found:!!raw});
      return raw?JSON.parse(raw):null;
    }catch(error){
      this.diagnostics.error("save load failed",error);
      return null;
    }
  }

  save(state){
    try{
      localStorage.setItem(CONFIG.SAVE_KEY,JSON.stringify(state));
      return true;
    }catch(error){
      this.diagnostics.error("save failed",error);
      return false;
    }
  }

  clearAll(){
    const removed=[];
    for(const storage of [localStorage,sessionStorage]){
      try{
        const keys=[];
        for(let i=0;i<storage.length;i++) keys.push(storage.key(i));
        for(const key of keys){
          if(key && (key.startsWith(CONFIG.SAVE_PREFIX)||key.toLowerCase().includes("koplin"))){
            storage.removeItem(key);
            removed.push(key);
          }
        }
      }catch(error){ this.diagnostics.error("storage clear failed",error); }
    }
    return removed;
  }
}
