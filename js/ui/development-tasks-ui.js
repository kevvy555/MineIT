import { getLoadedViewTemplate,loadViewTemplate,preloadViewTemplates } from "../core/view-template.js";

const DEVELOPMENT_TASKS_VIEW="./views/development-tasks.html";
const FILTER_STORAGE_KEY="development-task-filters.v1";
const DEFAULT_FILTERS={backlog:true,"in-progress":true,complete:false,bug:true,feature:true};
const STATUS_LABELS={backlog:"BACKLOG","in-progress":"IN PROGRESS",complete:"COMPLETE"};
preloadViewTemplates([DEVELOPMENT_TASKS_VIEW]);

export function formatDevelopmentTasksForClipboard(items){return items.map((item,index)=>`${index+1}. [${String(item.type).toUpperCase()}] ${String(item.text||"").replace(/\s+/g," ").trim()}`).join("\n");}

export class DevelopmentTasksUIMixin{
  beginDevelopmentTasksSession(){
    if(this.developmentTasksSessionActive)return;
    this.developmentTasksSessionActive=true;this.developmentTaskSelection=new Set();this.developmentTaskChoosingFile=false;this.developmentTaskTransientError="";this.developmentTaskImportDraft=null;this.onDevelopmentTasksOpenChange?.(true);
  }
  closeDevelopmentTasks(){
    if(!this.developmentTasksSessionActive)return;
    this.developmentTasksSessionActive=false;this.developmentTasksRevision=(this.developmentTasksRevision||0)+1;this.developmentTaskDraft=null;this.developmentTaskImportDraft=null;this.developmentTaskSelection?.clear();this.modal.classList.remove("development-tasks-modal");this.modal.classList.add("hidden");this.onDevelopmentTasksOpenChange?.(false);
  }
  developmentTaskViewStillCurrent(root,revision){return this.developmentTasksSessionActive&&revision===this.developmentTasksRevision&&root?.isConnected&&root===this.modal.querySelector("[data-development-tasks-view]");}
  async developmentTasks({reload=true}={}){
    this.beginDevelopmentTasksSession();const existingClose=this.modal.querySelector("[data-close]");if(existingClose)existingClose.onclick=()=>this.closeDevelopmentTasks();
    const revision=(this.developmentTasksRevision||0)+1;this.developmentTasksRevision=revision;
    try{
      const source=getLoadedViewTemplate(DEVELOPMENT_TASKS_VIEW)||await loadViewTemplate(DEVELOPMENT_TASKS_VIEW);if(!this.developmentTasksSessionActive||revision!==this.developmentTasksRevision)return false;
      this.open("Development Tasks",source);this.modal.classList.add("development-tasks-modal");this.modal.querySelector("[data-close]").onclick=()=>this.closeDevelopmentTasks();
      const root=this.modal.querySelector("[data-development-tasks-view]");if(!root)return false;this.bindDevelopmentTaskView(root);this.renderDevelopmentTasks(root,{loading:reload});
      if(reload)await this.taskRepository.restore();
      if(!this.developmentTaskViewStillCurrent(root,revision))return false;this.renderDevelopmentTasks(root);return true;
    }catch(error){if(revision!==this.developmentTasksRevision)return false;this.diagnostics?.error?.("development task view failed",error);this.toast(error?.message||"Unable to open Development Tasks.");this.closeDevelopmentTasks();return false;}
  }

  developmentTaskFilters(){
    if(this._developmentTaskFilters)return this._developmentTaskFilters;
    try{const raw=this.taskPreferencesStorage?.getItem(FILTER_STORAGE_KEY),parsed=raw?JSON.parse(raw):null;this._developmentTaskFilters={...DEFAULT_FILTERS,...Object.fromEntries(Object.keys(DEFAULT_FILTERS).map(key=>[key,typeof parsed?.[key]==="boolean"?parsed[key]:DEFAULT_FILTERS[key]]))};}
    catch(error){this.diagnostics?.error?.("development task filters load failed",error);this._developmentTaskFilters={...DEFAULT_FILTERS};}
    return this._developmentTaskFilters;
  }
  saveDevelopmentTaskFilters(){try{this.taskPreferencesStorage?.setItem(FILTER_STORAGE_KEY,JSON.stringify(this.developmentTaskFilters()));}catch(error){this.diagnostics?.error?.("development task filters save failed",error);}}
  bindDevelopmentTaskView(root){
    root.addEventListener("click",event=>this.handleDevelopmentTaskClick(root,event));
    root.addEventListener("change",event=>{const checkbox=event.target.closest?.("[data-task-select]");if(!checkbox)return;const id=checkbox.closest("[data-task-id]")?.dataset.taskId;if(!id)return;if(checkbox.checked)this.developmentTaskSelection.add(id);else this.developmentTaskSelection.delete(id);this.updateDevelopmentTaskSelection(root);});
    root.addEventListener("input",event=>{if(event.target.matches?.("[data-task-description]")&&this.developmentTaskDraft)this.developmentTaskDraft.text=event.target.value;else if(event.target.matches?.("[data-task-import-text]")&&this.developmentTaskImportDraft)this.developmentTaskImportDraft.text=event.target.value;});
  }
  handleDevelopmentTaskClick(root,event){
    const button=event.target.closest?.("button");if(!button||!root.contains(button)||this.developmentTaskBusy)return;
    if(button.matches("[data-task-change-file]")){const status=this.taskRepository.status();if(status.dirty&&!confirm("The current task file has unsaved changes. Change files anyway?"))return;this.developmentTaskChoosingFile=true;this.developmentTaskTransientError="";this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-cancel-file]")){this.developmentTaskChoosingFile=false;this.developmentTaskTransientError="";this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-create-file]")){void this.chooseDevelopmentTaskFile(root,"create");return;}
    if(button.matches("[data-task-select-file]")){void this.chooseDevelopmentTaskFile(root,"select");return;}
    if(button.matches("[data-task-reconnect]")){void this.reconnectDevelopmentTaskFile(root);return;}
    if(button.matches("[data-task-retry-save]")){void this.retryDevelopmentTaskSave(root);return;}
    if(button.matches("[data-task-new]")){this.showDevelopmentTaskEditor(root);return;}
    if(button.matches("[data-task-import]")){this.showDevelopmentTaskImport(root);return;}
    if(button.matches("[data-task-filter]")){const key=button.dataset.taskFilter,filters=this.developmentTaskFilters();filters[key]=!filters[key];this.developmentTaskSelection.clear();this.saveDevelopmentTaskFilters();this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-select-visible]")){for(const item of this.visibleDevelopmentTasks())this.developmentTaskSelection.add(item.id);this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-clear-selection]")){this.developmentTaskSelection.clear();this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-copy-selected]")){void this.copyDevelopmentTasks(root,[...this.developmentTaskSelection]);return;}
    if(button.matches("[data-task-editor-cancel]")){this.developmentTaskDraft=null;this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-type]")){if(this.developmentTaskDraft){this.developmentTaskDraft.type=button.dataset.taskType;this.renderDevelopmentTaskEditor(root);}return;}
    if(button.matches("[data-task-status]")){if(this.developmentTaskDraft){this.developmentTaskDraft.status=button.dataset.taskStatus;this.renderDevelopmentTaskEditor(root);}return;}
    if(button.matches("[data-task-editor-save]")){void this.saveDevelopmentTaskEditor(root);return;}
    if(button.matches("[data-task-import-cancel]")){this.developmentTaskImportDraft=null;this.renderDevelopmentTasks(root);return;}
    if(button.matches("[data-task-import-type]")){if(this.developmentTaskImportDraft){this.developmentTaskImportDraft.type=button.dataset.taskImportType;this.renderDevelopmentTaskImport(root);}return;}
    if(button.matches("[data-task-import-save]")){void this.saveDevelopmentTaskImport(root);return;}
    const id=button.closest("[data-task-id]")?.dataset.taskId;if(!id)return;
    if(button.matches("[data-task-copy]"))void this.copyDevelopmentTasks(root,[id]);
    else if(button.matches("[data-task-edit]"))this.showDevelopmentTaskEditor(root,id);
    else if(button.matches("[data-task-set-status]"))void this.setDevelopmentTaskStatus(root,id,button.dataset.taskSetStatus);
    else if(button.matches("[data-task-move]"))void this.moveDevelopmentTask(root,id,button.dataset.taskMove);
    else if(button.matches("[data-task-delete]"))void this.deleteDevelopmentTask(root,id);
  }

  async chooseDevelopmentTaskFile(root,mode){
    this.developmentTaskBusy=true;root.classList.add("busy");this.developmentTaskTransientError="";
    try{const operation=mode==="create"?this.taskRepository.createNew():this.taskRepository.selectExisting();await operation;this.developmentTaskChoosingFile=false;this.developmentTaskSelection.clear();this.toast(mode==="create"?"Task file created.":"Task file connected.");}
    catch(error){if(error?.name!=="AbortError"){this.developmentTaskTransientError=error?.message||"The task file could not be opened.";this.toast(this.developmentTaskTransientError);}}
    finally{this.developmentTaskBusy=false;if(root.isConnected){root.classList.remove("busy");this.renderDevelopmentTasks(root);}}
  }
  async reconnectDevelopmentTaskFile(root){await this.runDevelopmentTaskAction(root,()=>this.taskRepository.reconnect(),"Task file reconnected.");}
  async retryDevelopmentTaskSave(root){await this.runDevelopmentTaskAction(root,()=>this.taskRepository.save(),"Task file saved.");}
  async moveDevelopmentTask(root,id,position){await this.runDevelopmentTaskAction(root,()=>this.taskRepository.move(id,position),`Task moved to the ${position}.`);}
  async setDevelopmentTaskStatus(root,id,status){await this.runDevelopmentTaskAction(root,()=>this.taskRepository.setStatus(id,status),`Task marked ${STATUS_LABELS[status]||status}.`);}
  async deleteDevelopmentTask(root,id){const item=this.taskRepository.items().find(candidate=>candidate.id===id);if(!item||!confirm(`Delete this ${item.type}?\n\n${item.text}`))return;await this.runDevelopmentTaskAction(root,()=>this.taskRepository.remove(id),"Task deleted.");this.developmentTaskSelection.delete(id);}
  async runDevelopmentTaskAction(root,action,successMessage){
    this.developmentTaskBusy=true;root.classList.add("busy");this.developmentTaskTransientError="";
    try{const operation=action();this.renderDevelopmentTaskFileState(root);await operation;if(successMessage)this.toast(successMessage);}
    catch(error){if(error?.name!=="AbortError"){this.developmentTaskTransientError=error?.message||"The task action failed.";this.toast(this.developmentTaskTransientError);}}
    finally{this.developmentTaskBusy=false;if(root.isConnected){root.classList.remove("busy");this.renderDevelopmentTasks(root);}}
  }

  visibleDevelopmentTasks(){const filters=this.developmentTaskFilters();return this.taskRepository.items().filter(item=>filters[item.status]&&filters[item.type]);}
  renderDevelopmentTasks(root,{loading=false}={}){
    this.developmentTaskDraft=null;this.developmentTaskImportDraft=null;this.modal.querySelector(".panel-title strong").textContent="Development Tasks";root.querySelector("[data-task-editor]").hidden=true;root.querySelector("[data-task-import-panel]").hidden=true;this.renderDevelopmentTaskFileState(root,{loading});
    const status=this.taskRepository.status(),ready=status.access==="ready",choosing=this.developmentTaskChoosingFile,setup=root.querySelector("[data-task-setup]"),workspace=root.querySelector("[data-task-workspace]");
    setup.hidden=ready&&!choosing;workspace.hidden=!ready||choosing;
    if(!setup.hidden)this.renderDevelopmentTaskSetup(root,status,{loading});
    if(workspace.hidden)return;
    const items=this.taskRepository.items(),visible=this.visibleDevelopmentTasks(),visibleIds=new Set(visible.map(item=>item.id));for(const id of [...this.developmentTaskSelection])if(!visibleIds.has(id))this.developmentTaskSelection.delete(id);
    const filters=this.developmentTaskFilters();for(const button of root.querySelectorAll("[data-task-filter]")){const active=!!filters[button.dataset.taskFilter];button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));}
    root.querySelector("[data-task-total]").textContent=`${visible.length} SHOWN • ${items.length} TOTAL`;root.querySelector("[data-task-empty]").hidden=visible.length>0;
    const host=root.querySelector("[data-task-list]"),template=root.querySelector("[data-task-row-template]"),fragment=document.createDocumentFragment();
    for(const item of visible){const row=template.content.cloneNode(true),article=row.querySelector("[data-task-id]"),canonicalIndex=items.findIndex(candidate=>candidate.id===item.id);article.dataset.taskId=item.id;article.classList.add(`type-${item.type}`,`status-${item.status}`);row.querySelector("[data-task-select]").checked=this.developmentTaskSelection.has(item.id);row.querySelector("[data-task-number]").textContent=`#${canonicalIndex+1}`;row.querySelector("[data-task-type-label]").textContent=item.type.toUpperCase();row.querySelector("[data-task-status-label]").textContent=STATUS_LABELS[item.status];for(const button of row.querySelectorAll("[data-task-set-status]")){const active=button.dataset.taskSetStatus===item.status;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));}row.querySelector("[data-task-text]").textContent=item.text;row.querySelector('[data-task-move="top"]').disabled=canonicalIndex===0;row.querySelector('[data-task-move="bottom"]').disabled=canonicalIndex===items.length-1;fragment.append(row);}
    host.replaceChildren(fragment);this.updateDevelopmentTaskSelection(root);
  }
  renderDevelopmentTaskFileState(root,{loading=false}={}){
    const status=this.taskRepository.status(),state=root.querySelector("[data-task-file-state]");root.querySelector("[data-task-file-name]").textContent=status.fileName||"No file selected";
    const labels=loading?{text:"LOADING…",className:"saving"}:status.access==="ready"?status.save==="saving"?{text:"SAVING…",className:"saving"}:status.save==="error"?{text:"SAVE FAILED",className:"bad"}:status.dirty?{text:"NOT SAVED",className:"warn"}:{text:"SAVED",className:"good"}:status.access==="needs-permission"?{text:"ACCESS REQUIRED",className:"warn"}:status.access==="unsupported"?{text:"UNSUPPORTED",className:"bad"}:{text:"NOT CONNECTED",className:"warn"};
    state.textContent=labels.text;state.className=labels.className;const error=root.querySelector("[data-task-error]"),message=this.developmentTaskTransientError||status.error||"";error.textContent=message;error.hidden=!message;root.querySelector("[data-task-change-file]").hidden=!status.fileName||this.developmentTaskChoosingFile;
  }
  renderDevelopmentTaskSetup(root,status,{loading=false}={}){
    const title=root.querySelector("[data-task-setup-title]"),copy=root.querySelector("[data-task-setup-copy]"),create=root.querySelector("[data-task-create-file]"),select=root.querySelector("[data-task-select-file]"),reconnect=root.querySelector("[data-task-reconnect]"),retry=root.querySelector("[data-task-retry-save]"),cancel=root.querySelector("[data-task-cancel-file]");
    create.hidden=select.hidden=reconnect.hidden=retry.hidden=cancel.hidden=true;
    if(loading){title.textContent="LOADING TASK FILE";copy.textContent="Checking the remembered JSON file and browser permission.";return;}
    if(status.access==="unsupported"){title.textContent="FILE ACCESS UNSUPPORTED";copy.textContent="Use Chrome 132 or newer on Android, or a supporting desktop Chromium browser.";return;}
    if(this.developmentTaskChoosingFile||status.access==="unconfigured"){title.textContent=this.developmentTaskChoosingFile?"CHANGE TASK FILE":"CHOOSE TASK FILE";copy.textContent="Create a JSON file on this device or select an existing MineIT development-task file.";create.hidden=select.hidden=false;cancel.hidden=!this.developmentTaskChoosingFile||status.access!=="ready";return;}
    title.textContent=status.access==="invalid"?"INVALID TASK FILE":"RECONNECT TASK FILE";copy.textContent=status.error||"Chrome needs permission to access the remembered JSON file.";reconnect.hidden=!status.fileName;select.hidden=create.hidden=false;retry.hidden=!status.dirty;
  }
  updateDevelopmentTaskSelection(root){const count=this.developmentTaskSelection.size;root.querySelector("[data-task-selected-count]").textContent=String(count);root.querySelector("[data-task-copy-selected]").disabled=count===0;root.querySelector("[data-task-clear-selection]").disabled=count===0;root.querySelector("[data-task-select-visible]").disabled=this.visibleDevelopmentTasks().length===0;}

  showDevelopmentTaskEditor(root,id=null){
    const item=id?this.taskRepository.items().find(candidate=>candidate.id===id):null;if(id&&!item){this.toast("The selected task no longer exists.");return;}
    this.developmentTaskDraft=item?{...item}:{id:null,type:"bug",status:"backlog",text:""};this.developmentTaskTransientError="";this.renderDevelopmentTaskEditor(root);requestAnimationFrame(()=>{if(root.isConnected&&this.developmentTaskDraft)root.querySelector("[data-task-description]")?.focus();});
  }
  renderDevelopmentTaskEditor(root){
    const draft=this.developmentTaskDraft;if(!draft)return;root.querySelector("[data-task-setup]").hidden=true;root.querySelector("[data-task-workspace]").hidden=true;root.querySelector("[data-task-import-panel]").hidden=true;const editor=root.querySelector("[data-task-editor]");editor.hidden=false;this.modal.querySelector(".panel-title strong").textContent=draft.id?"Edit Development Task":"New Development Task";
    for(const button of editor.querySelectorAll("[data-task-type]")){const active=button.dataset.taskType===draft.type;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));}
    const statusField=editor.querySelector("[data-task-editor-status]");statusField.hidden=!draft.id;for(const button of editor.querySelectorAll("[data-task-status]")){const active=button.dataset.taskStatus===draft.status;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));}
    const textarea=editor.querySelector("[data-task-description]");if(textarea.value!==draft.text)textarea.value=draft.text;const error=editor.querySelector("[data-task-editor-error]");error.textContent=this.developmentTaskTransientError||"";error.hidden=!this.developmentTaskTransientError;
  }
  async saveDevelopmentTaskEditor(root){
    const draft=this.developmentTaskDraft;if(!draft)return;draft.text=root.querySelector("[data-task-description]").value;this.developmentTaskBusy=true;root.classList.add("busy");this.developmentTaskTransientError="";
    try{const operation=draft.id?this.taskRepository.update(draft.id,draft):this.taskRepository.create(draft);this.renderDevelopmentTaskFileState(root);await operation;this.developmentTaskDraft=null;this.toast(draft.id?"Task updated.":"Task added to Backlog.");}
    catch(error){this.developmentTaskTransientError=error?.message||"The task could not be saved.";if(this.taskRepository.status().dirty)this.developmentTaskDraft=null;this.toast(this.developmentTaskTransientError);}
    finally{this.developmentTaskBusy=false;if(root.isConnected){root.classList.remove("busy");if(this.developmentTaskDraft)this.renderDevelopmentTaskEditor(root);else this.renderDevelopmentTasks(root);}}
  }

  showDevelopmentTaskImport(root){this.developmentTaskImportDraft={type:"bug",text:""};this.developmentTaskTransientError="";this.renderDevelopmentTaskImport(root);requestAnimationFrame(()=>{if(root.isConnected&&this.developmentTaskImportDraft)root.querySelector("[data-task-import-text]")?.focus();});}
  renderDevelopmentTaskImport(root){
    const draft=this.developmentTaskImportDraft;if(!draft)return;root.querySelector("[data-task-setup]").hidden=true;root.querySelector("[data-task-workspace]").hidden=true;root.querySelector("[data-task-editor]").hidden=true;const panel=root.querySelector("[data-task-import-panel]");panel.hidden=false;this.modal.querySelector(".panel-title strong").textContent="Import Development Tasks";
    for(const button of panel.querySelectorAll("[data-task-import-type]")){const active=button.dataset.taskImportType===draft.type;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));}
    const textarea=panel.querySelector("[data-task-import-text]");if(textarea.value!==draft.text)textarea.value=draft.text;const error=panel.querySelector("[data-task-import-error]");error.textContent=this.developmentTaskTransientError||"";error.hidden=!this.developmentTaskTransientError;
  }
  async saveDevelopmentTaskImport(root){
    const draft=this.developmentTaskImportDraft;if(!draft)return;draft.text=root.querySelector("[data-task-import-text]").value;this.developmentTaskBusy=true;root.classList.add("busy");this.developmentTaskTransientError="";
    try{const operation=this.taskRepository.importText(draft.text,draft.type);this.renderDevelopmentTaskFileState(root);const imported=await operation;this.developmentTaskImportDraft=null;this.toast(`${imported.length} task${imported.length===1?"":"s"} imported to Backlog.`);}
    catch(error){this.developmentTaskTransientError=error?.message||"The tasks could not be imported.";if(this.taskRepository.status().dirty)this.developmentTaskImportDraft=null;this.toast(this.developmentTaskTransientError);}
    finally{this.developmentTaskBusy=false;if(root.isConnected){root.classList.remove("busy");if(this.developmentTaskImportDraft)this.renderDevelopmentTaskImport(root);else this.renderDevelopmentTasks(root);}}
  }

  async copyDevelopmentTasks(root,ids){
    const wanted=new Set(ids),items=this.taskRepository.items().filter(item=>wanted.has(item.id));if(!items.length){this.toast("Select at least one task to copy.");return;}
    const text=formatDevelopmentTasksForClipboard(items);this.developmentTaskBusy=true;root.classList.add("busy");this.developmentTaskTransientError="";
    try{await this.writeDevelopmentTaskClipboard(text);try{await this.taskRepository.markInProgress(items.map(item=>item.id));this.toast(`${items.length} task${items.length===1?"":"s"} copied and marked In Progress.`);}catch(error){this.developmentTaskTransientError=error?.message||"Copied, but the status change could not be saved.";this.toast("Copied, but task status could not be saved.");}this.developmentTaskSelection.clear();}
    catch(error){this.developmentTaskTransientError=error?.message||"The selected tasks could not be copied.";this.toast(this.developmentTaskTransientError);}
    finally{this.developmentTaskBusy=false;if(root.isConnected){root.classList.remove("busy");this.renderDevelopmentTasks(root);}}
  }
  async writeDevelopmentTaskClipboard(text){
    if(this.taskClipboard?.writeText)return this.taskClipboard.writeText(text);
    const textarea=document.createElement("textarea");textarea.value=text;textarea.setAttribute("readonly","");textarea.style.position="fixed";textarea.style.opacity="0";document.body.append(textarea);textarea.select();const copied=document.execCommand?.("copy");textarea.remove();if(!copied)throw new Error("Clipboard access was denied.");
  }
}
