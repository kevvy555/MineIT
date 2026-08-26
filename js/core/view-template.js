const templateCache=new Map();

export async function loadViewTemplate(path){
  let pending=templateCache.get(path);
  if(!pending){
    pending=fetch(path).then(response=>{
      if(!response.ok)throw new Error(`Unable to load view template ${path}: ${response.status}`);
      return response.text();
    });
    templateCache.set(path,pending);
  }
  return pending;
}

export async function renderViewTemplate(path,slots={}){
  const source=await loadViewTemplate(path);
  return source.replace(/\{\{([A-Z0-9_]+)\}\}/g,(_match,key)=>String(slots[key]??""));
}

export function clearViewTemplateCache(){templateCache.clear();}
