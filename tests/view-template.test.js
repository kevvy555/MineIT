import assert from "node:assert/strict";

const originalFetch=globalThis.fetch;
let calls=0;
globalThis.fetch=async path=>{calls++;return{ok:true,status:200,text:async()=>`<section>${path} {{TITLE}} {{BODY}}</section>`};};
const {loadViewTemplate,getLoadedViewTemplate,preloadViewTemplates,renderViewSource,renderViewTemplate,clearViewTemplateCache}=await import("../js/core/view-template.js");
try{
  clearViewTemplateCache();
  assert.equal(renderViewSource("<p>{{TITLE}} {{MISSING}}</p>",{TITLE:"MineIT"}),"<p>MineIT </p>");
  assert.equal(getLoadedViewTemplate("./views/test.html"),null,"Synchronous view reads must be empty before preload");
  assert.equal(await renderViewTemplate("./views/test.html",{TITLE:"MineIT",BODY:"ready"}),"<section>./views/test.html MineIT ready</section>");
  assert.equal(getLoadedViewTemplate("./views/test.html"),"<section>./views/test.html {{TITLE}} {{BODY}}</section>");
  assert.equal(await renderViewTemplate("./views/test.html",{TITLE:"Again",BODY:"cached"}),"<section>./views/test.html Again cached</section>");
  assert.equal(calls,1,"View templates should be fetched once and reused from cache");

  clearViewTemplateCache();calls=0;
  const fetched=[];
  globalThis.fetch=async path=>{calls++;fetched.push(path);return{ok:true,status:200,text:async()=>`<section>${path}</section>`};};
  globalThis.document={querySelectorAll:()=>[{getAttribute:()=>"./js/app.js?v=9.9.9"}],querySelector:()=>null};
  assert.equal(await loadViewTemplate("./views/bust.html"),"<section>./views/bust.html?v=9.9.9</section>");
  assert.equal(fetched[0],"./views/bust.html?v=9.9.9","HTML view fetches must include the app cache token");
  assert.equal(getLoadedViewTemplate("./views/bust.html"),"<section>./views/bust.html?v=9.9.9</section>","Logical view path remains the cache key");

  clearViewTemplateCache();calls=0;
  const preload=await preloadViewTemplates(["./views/a.html","./views/b.html","./views/a.html"]);assert.equal(preload.length,2,"Preload must deduplicate view paths");assert.ok(preload.every(result=>result.status==="fulfilled"));assert.equal(calls,2);assert.match(getLoadedViewTemplate("./views/a.html"),/\.\/views\/a\.html/);

  clearViewTemplateCache();calls=0;
  globalThis.fetch=async()=>{calls++;return{ok:false,status:404,text:async()=>""};};
  const failed=await preloadViewTemplates(["./views/missing.html"]);assert.equal(failed[0].status,"rejected","Preload failures must be reported without rejecting module startup");assert.equal(getLoadedViewTemplate("./views/missing.html"),null);await assert.rejects(()=>loadViewTemplate("./views/missing.html"),/Unable to load view template/);assert.equal(calls,2,"Failed cache entries must be retryable");
  console.log("view template loading, preload, synchronous read and retry caching test passed");
}finally{globalThis.fetch=originalFetch;delete globalThis.document;clearViewTemplateCache();}
