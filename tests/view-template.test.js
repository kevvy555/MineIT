import assert from "node:assert/strict";

const originalFetch=globalThis.fetch;
let calls=0;
globalThis.fetch=async path=>{calls++;return{ok:true,status:200,text:async()=>`<section>${path} {{TITLE}} {{BODY}}</section>`};};
const {renderViewSource,renderViewTemplate,clearViewTemplateCache}=await import("../js/core/view-template.js");
try{
  clearViewTemplateCache();
  assert.equal(renderViewSource("<p>{{TITLE}} {{MISSING}}</p>",{TITLE:"MineIT"}),"<p>MineIT </p>");
  assert.equal(await renderViewTemplate("./views/test.html",{TITLE:"MineIT",BODY:"ready"}),"<section>./views/test.html MineIT ready</section>");
  assert.equal(await renderViewTemplate("./views/test.html",{TITLE:"Again",BODY:"cached"}),"<section>./views/test.html Again cached</section>");
  assert.equal(calls,1,"View templates should be fetched once and reused from cache");
  clearViewTemplateCache();
  globalThis.fetch=async()=>({ok:false,status:404,text:async()=>""});
  await assert.rejects(()=>renderViewTemplate("./views/missing.html"),/Unable to load view template/);
  console.log("view template loading, rendering and caching test passed");
}finally{globalThis.fetch=originalFetch;clearViewTemplateCache();}
