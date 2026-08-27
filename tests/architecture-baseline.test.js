import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { largeHtmlTemplates } from "./template-literal-scanner.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const rel=file=>path.relative(root,file).replaceAll("\\","/");
const jsFiles=walk(path.join(root,"js")).filter(f=>f.endsWith(".js"));
const cssFiles=walk(path.join(root,"css")).filter(f=>f.endsWith(".css"));
const source=new Map(jsFiles.map(file=>[rel(file),fs.readFileSync(file,"utf8")]));
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const verifiedHtmlDebt={
  "js/ui/building-details-ui.js":1,
  "js/ui/contract-ui.js":1,
  "js/ui/industry-ui.js":1,
  "js/ui/map-first-ui.js":1,
  "js/ui/resource-development-ui.js":1
};

for(const [file,text] of source){
  if(file.startsWith("js/domain/"))assert.doesNotMatch(text,/from\s+["'][^"']*(?:\/ui\/|\.\.\/ui\/)/,`${file} must not import presentation code`);
  assert.doesNotMatch(text,/\beval\s*\(|\bnew\s+Function\s*\(/,`${file} must not use dynamic code execution`);
}

const globalAssignments=[];
for(const [file,text] of source){for(const match of text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=/g))globalAssignments.push(`${file}:${match[1]}`);}

const versionedJs=jsFiles.map(rel).filter(name=>/-v\d+\.js$/.test(name));
const versionedCss=cssFiles.map(rel).filter(name=>/-v\d+\.css$/.test(name));
let queryImports=0,documentAppEvents=0,largeHtmlTemplateCount=0;
const queryImportsByFile=[],largeHtmlTemplatesByFile=[];
for(const [file,text] of source){
  const queryCount=(text.match(/(?:from\s+|import\s*\()["'][^"']+\.js\?v=/g)||[]).length;
  queryImports+=queryCount;if(queryCount)queryImportsByFile.push({file,count:queryCount});
  documentAppEvents+=(text.match(/document\.(?:dispatchEvent|addEventListener)\([^\n]*mineit:/g)||[]).length;
  const htmlCount=largeHtmlTemplates(text).length;
  largeHtmlTemplateCount+=htmlCount;if(htmlCount)largeHtmlTemplatesByFile.push({file,count:htmlCount});
}
largeHtmlTemplatesByFile.sort((a,b)=>b.count-a.count||a.file.localeCompare(b.file));
const actualHtmlDebt=Object.fromEntries(largeHtmlTemplatesByFile.map(({file,count})=>[file,count]));
const debt={versionedJs:versionedJs.length,versionedCss:versionedCss.length,queryImports,importMap:/<script\s+type=["']importmap["']/.test(index),globalAssignments:globalAssignments.length,documentAppEvents,largeHtmlTemplates:largeHtmlTemplateCount};
console.log("CleanUp architecture debt baseline",debt);
console.log("Query import debt by file",queryImportsByFile);
console.log("Large HTML template debt by file",largeHtmlTemplatesByFile);

assert.equal(debt.versionedJs,0,"Version-numbered JavaScript files must not return");
assert.equal(debt.versionedCss,0,"Version-numbered CSS files must not return");
assert.equal(debt.importMap,false,"Runtime import-map redirects must not return");
assert.equal(debt.queryImports,0,"Version-query imports must not return");
assert.equal(debt.globalAssignments,0,`Global application assignments must not return: ${globalAssignments.join(", ")}`);
assert.equal(debt.documentAppEvents,0,"Document-level application events must not return");
assert.ok(!largeHtmlTemplatesByFile.some(entry=>entry.file==="js/domain/expansion-service.js"),"Domain template literals must not be misclassified as HTML view debt");
assert.equal(debt.largeHtmlTemplates,5,"Verified Phase 4D adaptive-building extraction debt must change only in a reviewed checkpoint");
assert.deepEqual(actualHtmlDebt,verifiedHtmlDebt,"Per-file HTML debt map changed; update the verified map only with reviewed extraction evidence");
for(const file of["js/ui/v55-ui.js","js/ui/technology-presentation-ui.js","js/ui/land-ui.js","js/ui/colony-tech-ui.js","js/ui/resource-ui.js","js/ui/ui-enhancements.js","js/ui/quick-trade-ui.js","js/ui/survival-ui.js","js/ui/adaptive-building-ui.js"])assert.ok(!largeHtmlTemplatesByFile.some(entry=>entry.file===file),`${file} large presentation templates must stay externalized`);

console.log("CleanUp architecture baseline guard passed");
