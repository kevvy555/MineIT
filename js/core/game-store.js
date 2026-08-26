export class GameStore {
  constructor(initialState){
    if(!initialState||typeof initialState!=="object"||Array.isArray(initialState))throw new TypeError("GameStore requires an object root state");
    this.state=initialState;
    this.listeners=new Set();
    this.revision=0;
    this.disposed=false;
  }

  getState(){return this.state;}

  replaceState(nextState,{label="replace-state",notify=true}={}){
    this.assertActive();
    if(!nextState||typeof nextState!=="object"||Array.isArray(nextState))throw new TypeError("GameStore replacement state must be an object");
    if(nextState!==this.state){
      for(const key of Object.keys(this.state))delete this.state[key];
      Object.assign(this.state,nextState);
    }
    this.revision++;
    if(notify)this.emit({type:"replace",label,revision:this.revision});
    return this.state;
  }

  transaction(label,mutator){
    this.assertActive();
    if(typeof mutator!=="function")throw new TypeError("GameStore transaction requires a mutator function");
    const result=mutator(this.state);
    this.revision++;
    this.emit({type:"transaction",label:String(label||"transaction"),revision:this.revision});
    return result;
  }

  notify(label="mutation"){
    this.assertActive();
    this.revision++;
    this.emit({type:"notify",label:String(label),revision:this.revision});
    return this.state;
  }

  subscribe(listener){
    this.assertActive();
    if(typeof listener!=="function")throw new TypeError("GameStore subscriber must be a function");
    this.listeners.add(listener);
    let active=true;
    return()=>{if(!active)return;active=false;this.listeners.delete(listener);};
  }

  emit(change){for(const listener of [...this.listeners])listener(this.state,change);}
  assertActive(){if(this.disposed)throw new Error("GameStore has been disposed");}
  dispose(){if(this.disposed)return;this.disposed=true;this.listeners.clear();}
}
