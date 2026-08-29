import assert from "node:assert/strict";
import { DevelopmentTaskFileError,DevelopmentTaskRepository,createDevelopmentTaskDocument,normalizeDevelopmentTaskDocument } from "../js/persistence/development-task-repository.js";
import { formatDevelopmentTasksForClipboard } from "../js/ui/development-tasks-ui.js";

class MemoryHandleStore{
  constructor(handle=null){this.handle=handle;this.setCalls=0;this.disposed=false;}
  async get(){return this.handle;}
  async set(handle){this.handle=handle;this.setCalls++;}
  async dispose(){this.disposed=true;}
}

class FakeFileHandle{
  constructor(name,text="",permission="granted"){this.name=name;this.textValue=text;this.permission=permission;this.requestResult="granted";this.failWrites=0;this.writes=[];}
  async queryPermission(){return this.permission;}
  async requestPermission(){this.permission=this.requestResult;return this.permission;}
  async getFile(){return{text:async()=>this.textValue};}
  async createWritable(){
    let pending=this.textValue;const handle=this;
    return{
      async write(text){if(handle.failWrites>0){handle.failWrites--;const error=new Error("write denied");error.name="NotAllowedError";throw error;}pending=String(text);},
      async close(){handle.textValue=pending;handle.writes.push(pending);},
      async abort(){}
    };
  }
}

const validTask={id:"existing",type:"bug",status:"backlog",text:"Existing task",createdAt:"2026-08-29T10:00:00.000Z",updatedAt:"2026-08-29T10:00:00.000Z"};
assert.deepEqual(createDevelopmentTaskDocument(),{version:1,items:[]});
assert.deepEqual(normalizeDevelopmentTaskDocument({version:1,items:[validTask]}),{version:1,items:[validTask]});
for(const invalid of[
  null,
  {version:2,items:[]},
  {version:1,items:{}},
  {version:1,items:[{...validTask,id:""}]},
  {version:1,items:[{...validTask,type:"idea"}]},
  {version:1,items:[{...validTask,status:"done"}]},
  {version:1,items:[{...validTask,text:"  "}]},
  {version:1,items:[validTask,{...validTask}]}
])assert.throws(()=>normalizeDevelopmentTaskDocument(invalid),DevelopmentTaskFileError);

const handleStore=new MemoryHandleStore(),createdFile=new FakeFileHandle("mineit-issues.json");let id=0,tick=0;
const repository=new DevelopmentTaskRepository({
  handleStore,
  openFilePicker:async()=>[createdFile],
  saveFilePicker:async()=>createdFile,
  createId:()=>`task-${++id}`,
  now:()=>`2026-08-29T10:00:0${tick++}.000Z`
});
assert.equal((await repository.restore()).access,"unconfigured");
await repository.createNew();assert.equal(repository.status().access,"ready");assert.equal(repository.status().remembered,true);assert.equal(handleStore.setCalls,1);assert.deepEqual(JSON.parse(createdFile.textValue),{version:1,items:[]});

const first=await repository.create({type:"bug",text:" First bug\nwith detail "}),second=await repository.create({type:"feature",text:"Second feature"});
assert.deepEqual(repository.items().map(item=>item.id),[second.id,first.id],"new tasks must be inserted at the top");
assert.ok(repository.items().every(item=>item.status==="backlog"));
await repository.update(first.id,{type:"bug",status:"complete",text:"Updated first bug"});assert.equal(repository.items().find(item=>item.id===first.id).status,"complete");
await repository.move(first.id,"top");assert.deepEqual(repository.items().map(item=>item.id),[first.id,second.id]);
await repository.move(first.id,"bottom");assert.deepEqual(repository.items().map(item=>item.id),[second.id,first.id]);
await repository.markInProgress([first.id,second.id]);assert.ok(repository.items().every(item=>item.status==="in-progress"));
const clipboard=formatDevelopmentTasksForClipboard([{type:"feature",text:"First line\ncontinues"},{type:"bug",text:"  Second   task  "}]);
assert.equal(clipboard,"1. [FEATURE] First line continues\n2. [BUG] Second task");
await repository.remove(second.id);assert.deepEqual(repository.items().map(item=>item.id),[first.id]);assert.deepEqual(JSON.parse(createdFile.textValue).items.map(item=>item.id),[first.id],"every mutation must be persisted to the JSON file");

createdFile.failWrites=1;await assert.rejects(()=>repository.update(first.id,{type:"bug",status:"backlog",text:"Unsaved but retained"}),/write denied/);assert.equal(repository.status().dirty,true);assert.equal(repository.status().save,"error");assert.equal(repository.items()[0].text,"Unsaved but retained");
await repository.reconnect();assert.equal(repository.status().dirty,false);assert.equal(JSON.parse(createdFile.textValue).items[0].text,"Unsaved but retained","reconnect must retry dirty in-memory data without discarding it");

const rememberedFile=new FakeFileHandle("remembered.json",JSON.stringify({version:1,items:[validTask]}),"prompt"),rememberedStore=new MemoryHandleStore(rememberedFile),rememberedRepository=new DevelopmentTaskRepository({handleStore:rememberedStore,openFilePicker:async()=>[rememberedFile],saveFilePicker:async()=>rememberedFile});
assert.equal((await rememberedRepository.restore()).access,"needs-permission");await rememberedRepository.reconnect();assert.equal(rememberedRepository.status().access,"ready");assert.equal(rememberedRepository.items()[0].id,"existing");

const invalidFile=new FakeFileHandle("invalid.json","not json"),invalidStore=new MemoryHandleStore(),invalidRepository=new DevelopmentTaskRepository({handleStore:invalidStore,openFilePicker:async()=>[invalidFile],saveFilePicker:async()=>invalidFile});
await assert.rejects(()=>invalidRepository.selectExisting(),error=>error.code==="invalid-json");assert.equal(invalidFile.textValue,"not json","invalid JSON must never be overwritten");assert.equal(invalidStore.setCalls,0,"an invalid file handle must not be remembered");

const emptyFile=new FakeFileHandle("empty.json","   "),emptyStore=new MemoryHandleStore(),emptyRepository=new DevelopmentTaskRepository({handleStore:emptyStore,openFilePicker:async()=>[emptyFile],saveFilePicker:async()=>emptyFile});
await emptyRepository.selectExisting();assert.deepEqual(JSON.parse(emptyFile.textValue),{version:1,items:[]},"an intentionally empty selected file should be initialized safely");

await Promise.all([repository.dispose(),rememberedRepository.dispose(),invalidRepository.dispose(),emptyRepository.dispose()]);assert.equal(handleStore.disposed,true);
console.log("MineIT development-task JSON persistence, recovery and clipboard contract passed");
