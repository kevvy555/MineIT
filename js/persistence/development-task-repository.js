const DOCUMENT_VERSION=1;
const DATABASE_NAME="mineit-development-tasks";
const DATABASE_VERSION=1;
const HANDLE_STORE="file-handles";
const HANDLE_KEY="development-task-file";
const TASK_TYPES=new Set(["bug","feature"]);
const TASK_STATUSES=new Set(["backlog","in-progress","complete"]);

export class DevelopmentTaskFileError extends Error{
  constructor(code,message,cause){super(message,{cause});this.name="DevelopmentTaskFileError";this.code=code;}
}

export class BrowserFileHandleStore{
  constructor({indexedDBFactory=globalThis.indexedDB}={}){this.indexedDBFactory=indexedDBFactory;this.databasePromise=null;}
  database(){
    if(this.databasePromise)return this.databasePromise;
    if(!this.indexedDBFactory)return Promise.reject(new DevelopmentTaskFileError("indexeddb-unavailable","This browser cannot remember the selected task file."));
    this.databasePromise=new Promise((resolve,reject)=>{
      const request=this.indexedDBFactory.open(DATABASE_NAME,DATABASE_VERSION);
      request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains(HANDLE_STORE))database.createObjectStore(HANDLE_STORE);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new DevelopmentTaskFileError("indexeddb-open-failed","The selected task file could not be remembered.",request.error));
    });
    return this.databasePromise;
  }
  async get(){const database=await this.database();return new Promise((resolve,reject)=>{const request=database.transaction(HANDLE_STORE,"readonly").objectStore(HANDLE_STORE).get(HANDLE_KEY);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(new DevelopmentTaskFileError("indexeddb-read-failed","The remembered task file could not be loaded.",request.error));});}
  async set(handle){const database=await this.database();return new Promise((resolve,reject)=>{const transaction=database.transaction(HANDLE_STORE,"readwrite");transaction.objectStore(HANDLE_STORE).put(handle,HANDLE_KEY);transaction.oncomplete=()=>resolve(true);transaction.onerror=()=>reject(new DevelopmentTaskFileError("indexeddb-write-failed","The selected task file could not be remembered.",transaction.error));});}
  async clear(){const database=await this.database();return new Promise((resolve,reject)=>{const transaction=database.transaction(HANDLE_STORE,"readwrite");transaction.objectStore(HANDLE_STORE).delete(HANDLE_KEY);transaction.oncomplete=()=>resolve(true);transaction.onerror=()=>reject(new DevelopmentTaskFileError("indexeddb-clear-failed","The remembered task file could not be cleared.",transaction.error));});}
  async dispose(){if(!this.databasePromise)return;try{const database=await this.databasePromise;database.close();}catch{}this.databasePromise=null;}
}

export function createDevelopmentTaskDocument(){return{version:DOCUMENT_VERSION,items:[]};}

export function normalizeDevelopmentTaskDocument(value){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new DevelopmentTaskFileError("invalid-json","The selected file is not a MineIT development-task document.");
  if(value.version!==DOCUMENT_VERSION)throw new DevelopmentTaskFileError("unsupported-version",`Task-file version ${String(value.version??"missing")} is not supported.`);
  if(!Array.isArray(value.items))throw new DevelopmentTaskFileError("invalid-items","The selected task file does not contain an items array.");
  const ids=new Set(),items=value.items.map((item,index)=>{
    if(!item||typeof item!=="object"||Array.isArray(item))throw new DevelopmentTaskFileError("invalid-item",`Task ${index+1} is invalid.`);
    const id=String(item.id||"").trim(),type=String(item.type||""),status=String(item.status||""),text=String(item.text||"").trim();
    if(!id||ids.has(id))throw new DevelopmentTaskFileError("invalid-id",`Task ${index+1} has a missing or duplicate ID.`);ids.add(id);
    if(!TASK_TYPES.has(type))throw new DevelopmentTaskFileError("invalid-type",`Task ${index+1} has an invalid type.`);
    if(!TASK_STATUSES.has(status))throw new DevelopmentTaskFileError("invalid-status",`Task ${index+1} has an invalid status.`);
    if(!text)throw new DevelopmentTaskFileError("blank-task",`Task ${index+1} has no description.`);
    const createdAt=String(item.createdAt||"").trim(),updatedAt=String(item.updatedAt||"").trim();
    if(!createdAt||!updatedAt)throw new DevelopmentTaskFileError("invalid-timestamp",`Task ${index+1} has incomplete timestamps.`);
    return{id,type,status,text,createdAt,updatedAt};
  });
  return{version:DOCUMENT_VERSION,items};
}

const cloneDocument=document=>({version:document.version,items:document.items.map(item=>({...item}))});
const pickerOptions={types:[{description:"MineIT development tasks",accept:{"application/json":[".json"]}}],excludeAcceptAllOption:false};

export class DevelopmentTaskRepository{
  constructor({
    diagnostics=null,
    handleStore=new BrowserFileHandleStore(),
    openFilePicker=typeof globalThis.showOpenFilePicker==="function"?globalThis.showOpenFilePicker.bind(globalThis):null,
    saveFilePicker=typeof globalThis.showSaveFilePicker==="function"?globalThis.showSaveFilePicker.bind(globalThis):null,
    now=()=>new Date().toISOString(),
    createId=()=>globalThis.crypto?.randomUUID?.()||`task-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }={}){
    this.diagnostics=diagnostics;this.handleStore=handleStore;this.openFilePicker=openFilePicker;this.saveFilePicker=saveFilePicker;this.now=now;this.createId=createId;
    this.handle=null;this.document=createDevelopmentTaskDocument();this.accessState="unconfigured";this.saveState="idle";this.fileName="";this.errorMessage="";this.dirty=false;this.remembered=false;this.writeQueue=Promise.resolve();this.saveSequence=0;
  }

  isSupported(){return typeof this.openFilePicker==="function"&&typeof this.saveFilePicker==="function";}
  status(){return{supported:this.isSupported(),access:this.accessState,save:this.saveState,fileName:this.fileName,error:this.errorMessage,dirty:this.dirty,remembered:this.remembered};}
  items(){return this.document.items.map(item=>({...item}));}

  async restore(){
    if(!this.isSupported()){this.accessState="unsupported";this.errorMessage="Direct JSON file editing requires Chrome 132 or newer on Android, or a supporting desktop Chromium browser.";return this.status();}
    try{
      if(!this.handle){this.handle=await this.handleStore.get();this.remembered=!!this.handle;}
      if(!this.handle){this.accessState="unconfigured";this.saveState="idle";this.fileName="";this.errorMessage="";return this.status();}
      this.fileName=this.handle.name||"Selected JSON file";
      const permission=await this.permission(this.handle,false);
      if(permission!=="granted"){this.accessState="needs-permission";this.errorMessage="Reconnect the remembered task file to continue.";return this.status();}
      this.accessState="ready";this.errorMessage="";
      if(!this.dirty)await this.loadFromHandle(this.handle);
      return this.status();
    }catch(error){this.report("development task restore failed",error);this.setFileError(error);return this.status();}
  }

  async reconnect(){
    if(!this.handle)throw new DevelopmentTaskFileError("no-file","Select or create a task file first.");
    try{
      const permission=await this.permission(this.handle,true);
      if(permission!=="granted"){this.accessState="needs-permission";throw new DevelopmentTaskFileError("permission-denied","Chrome did not grant access to the task file.");}
      this.accessState="ready";this.errorMessage="";
      if(this.dirty)await this.save();else await this.loadFromHandle(this.handle);
      return this.status();
    }catch(error){this.report("development task reconnect failed",error);if(error?.code!=="permission-denied")this.setFileError(error);throw error;}
  }

  async selectExisting(){
    if(!this.isSupported())throw new DevelopmentTaskFileError("unsupported","Direct task-file access is unavailable in this browser.");
    const handles=await this.openFilePicker(pickerOptions),candidate=handles?.[0];
    if(!candidate)throw new DevelopmentTaskFileError("no-file","No task file was selected.");
    const permission=await this.permission(candidate,true);
    if(permission!=="granted")throw new DevelopmentTaskFileError("permission-denied","Chrome did not grant edit access to the selected task file.");
    const {document,wasEmpty}=await this.readDocument(candidate);
    if(wasEmpty)await this.writeDocument(candidate,document);
    await this.adopt(candidate,document);
    return this.status();
  }

  async createNew(){
    if(!this.isSupported())throw new DevelopmentTaskFileError("unsupported","Direct task-file access is unavailable in this browser.");
    const candidate=await this.saveFilePicker({...pickerOptions,suggestedName:"mineit-issues.json"});
    if(!candidate)throw new DevelopmentTaskFileError("no-file","No task file was created.");
    const document=createDevelopmentTaskDocument();await this.writeDocument(candidate,document);await this.adopt(candidate,document);return this.status();
  }

  async adopt(handle,document){
    this.handle=handle;this.document=cloneDocument(document);this.fileName=handle.name||"Selected JSON file";this.accessState="ready";this.saveState="saved";this.errorMessage="";this.dirty=false;
    try{await this.handleStore.set(handle);this.remembered=true;}catch(error){this.remembered=false;this.report("development task handle remember failed",error);this.errorMessage="The file is open, but Chrome could not remember it for the next visit.";}
  }

  async create({type,text}){
    this.assertReady();this.assertType(type);const description=String(text||"").trim();if(!description)throw new DevelopmentTaskFileError("blank-task","Enter a bug or feature description.");
    const timestamp=this.now(),item={id:String(this.createId()),type,status:"backlog",text:description,createdAt:timestamp,updatedAt:timestamp};
    this.document.items.unshift(item);await this.save();return{...item};
  }

  async update(id,{type,status,text}){
    this.assertReady();this.assertType(type);this.assertStatus(status);const description=String(text||"").trim();if(!description)throw new DevelopmentTaskFileError("blank-task","Enter a bug or feature description.");
    const item=this.find(id);Object.assign(item,{type,status,text:description,updatedAt:this.now()});await this.save();return{...item};
  }

  async markInProgress(ids){
    this.assertReady();const wanted=new Set(ids),changed=[];
    for(const item of this.document.items)if(wanted.has(item.id)){item.status="in-progress";item.updatedAt=this.now();changed.push(item.id);}
    if(changed.length)await this.save();return changed;
  }

  async move(id,position){
    this.assertReady();if(position!=="top"&&position!=="bottom")throw new DevelopmentTaskFileError("invalid-position","Tasks can only move to the top or bottom.");
    const index=this.document.items.findIndex(item=>item.id===id);if(index<0)throw new DevelopmentTaskFileError("missing-task","The selected task no longer exists.");
    const target=position==="top"?0:this.document.items.length-1;if(index===target)return false;
    const [item]=this.document.items.splice(index,1);item.updatedAt=this.now();if(position==="top")this.document.items.unshift(item);else this.document.items.push(item);await this.save();return true;
  }

  async remove(id){this.assertReady();const index=this.document.items.findIndex(item=>item.id===id);if(index<0)throw new DevelopmentTaskFileError("missing-task","The selected task no longer exists.");const [removed]=this.document.items.splice(index,1);await this.save();return{...removed};}

  async save(){
    this.assertReady();this.dirty=true;this.saveState="saving";this.errorMessage="";const snapshot=JSON.stringify(cloneDocument(this.document),null,2)+"\n",sequence=++this.saveSequence;
    const operation=this.writeQueue.then(()=>this.writeText(this.handle,snapshot));this.writeQueue=operation.catch(()=>{});
    try{await operation;if(sequence===this.saveSequence){this.dirty=false;this.saveState="saved";this.errorMessage="";}return true;}
    catch(error){if(sequence===this.saveSequence){this.saveState="error";this.errorMessage=this.message(error,"The task file could not be saved. Reconnect it and retry.");if(error?.name==="NotAllowedError")this.accessState="needs-permission";}this.report("development task save failed",error);throw error;}
  }

  assertReady(){if(!this.handle||this.accessState!=="ready")throw new DevelopmentTaskFileError("file-not-ready","Select or reconnect the task JSON file first.");}
  assertType(type){if(!TASK_TYPES.has(type))throw new DevelopmentTaskFileError("invalid-type","Choose Bug or Feature.");}
  assertStatus(status){if(!TASK_STATUSES.has(status))throw new DevelopmentTaskFileError("invalid-status","Choose Backlog, In Progress or Complete.");}
  find(id){const item=this.document.items.find(candidate=>candidate.id===id);if(!item)throw new DevelopmentTaskFileError("missing-task","The selected task no longer exists.");return item;}

  async permission(handle,request){
    const descriptor={mode:"readwrite"};
    if(!request&&typeof handle.queryPermission==="function")return handle.queryPermission(descriptor);
    if(request&&typeof handle.requestPermission==="function")return handle.requestPermission(descriptor);
    return"granted";
  }
  async readDocument(handle){
    let text;try{text=await(await handle.getFile()).text();}catch(error){throw new DevelopmentTaskFileError("read-failed","The selected task file could not be read.",error);}
    if(!text.trim())return{document:createDevelopmentTaskDocument(),wasEmpty:true};
    try{return{document:normalizeDevelopmentTaskDocument(JSON.parse(text)),wasEmpty:false};}
    catch(error){if(error instanceof DevelopmentTaskFileError)throw error;throw new DevelopmentTaskFileError("invalid-json","The selected file does not contain valid JSON.",error);}
  }
  async loadFromHandle(handle){const {document}=await this.readDocument(handle);this.document=document;this.fileName=handle.name||this.fileName;this.saveState="saved";this.errorMessage="";this.dirty=false;}
  async writeDocument(handle,document){await this.writeText(handle,JSON.stringify(document,null,2)+"\n");}
  async writeText(handle,text){const writable=await handle.createWritable();try{await writable.write(text);await writable.close();}catch(error){try{await writable.abort?.();}catch{}throw error;}}
  setFileError(error){this.accessState=error?.code==="invalid-json"||error?.code?.startsWith("invalid-")||error?.code==="unsupported-version"?"invalid":"error";this.saveState="error";this.errorMessage=this.message(error,"The task file could not be opened.");}
  message(error,fallback){return String(error?.message||fallback);}
  report(label,error){this.diagnostics?.error?.(label,error);}
  async dispose(){await this.handleStore?.dispose?.();this.handle=null;}
}
