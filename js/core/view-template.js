const templateCache=new Map();

function cacheEntry(path){
  let entry=templateCache.get(path);
  if(entry)return entry;
  entry={source:null,pending:null};
  entry.pending=fetch(path).then(response=>{
    if(!response.ok)throw new Error(`Unable to load view template ${path}: ${response.status}`);
    return response.text();
  }).then(source=>{entry.source=source;return source;}).catch(error=>{if(templateCache.get(path)===entry)templateCache.delete(path);throw error;});
  templateCache.set(path,entry);
  return entry;
}

export async function loadViewTemplate(path){return cacheEntry(path).pending;}
export function getLoadedViewTemplate(path){return templateCache.get(path)?.source??null;}
export async function preloadViewTemplates(paths){return Promise.allSettled([...new Set(paths)].map(path=>loadViewTemplate(path)));}

export function renderViewSource(source,slots={}){
  return source.replace(/\{\{([A-Z0-9_]+)\}\}/g,(_match,key)=>String(slots[key]??""));
}

export async function renderViewTemplate(path,slots={}){
  return renderViewSource(await loadViewTemplate(path),slots);
}

export function clearViewTemplateCache(){templateCache.clear();}
