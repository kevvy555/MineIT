import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const rel=file=>path.relative(root,file).replaceAll("\\","/");
const jsFiles=walk(path.join(root,"js")).filter(f=>f.endsWith(".js"));
const cssFiles=walk(path.join(root,"css")).filter(f=>f.endsWith(".css"));
const source=new Map(jsFiles.map(file=>[rel(file),fs.readFileSync(file,"utf8")]));
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");

for(const [file,text] of source){
  if(file.startsWith("js/domain/"))assert.doesNotMatch(text,/from\s+["'][^"']*(?:\/ui\/|\.\.\/ui\/)/,`${file} must not import presentation code`);
  assert.doesNotMatch(text,/\beval\s*\(|\bnew\s+Function\s*\(/,`${file} must not use dynamic code execution`);
}

const globalAssignments=[];
for(const [file,text] of source){for(const match of text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=/g))globalAssignments.push(`${file}:${match[1]}`);}

const versionedJs=jsFiles.map(rel).filter(name=>/-v\d+\.js$/.test(name));
const versionedCss=cssFiles.map(rel).filter(name=>/-v\d+\.css$/.test(name));
let queryImports=0,documentAppEvents=0,largeHtmlTemplates=0;
const queryImportsByFile=[],largeHtmlTemplatesByFile=[];
const htmlTag=/<(?:article|aside|button|canvas|div|form|h[1-6]|header|label|li|main|nav|option|p|section|select|small|span|strong|table|tbody|td|textarea|th|thead|tr|ul)\b/i;
for(const [file,text] of source){
  const queryCount=(text.match(/(?:from\s+|import\s*\()["'][^"']+\.js\?v=/g)||[]).length;
  queryImports+=queryCount;if(queryCount)queryImportsByFile.push({file,count:queryCount});
  documentAppEvents+=(text.match(/document\.(?:dispatchEvent|addEventListener)\([^\n]*mineit:/g)||[]).length;
  const templates=text.match(/`[^`]{500,}`/gs)||[];
  const htmlCount=templates.filter(template=>htmlTag.test(template)).length;
  largeHtmlTemplates+=htmlCount;if(htmlCount)largeHtmlTemplatesByFile.push({file,count:htmlCount});
}
largeHtmlTemplatesByFile.sort((a,b)=>b.count-a.count||a.file.localeCompare(b.file));
const debt={versionedJs:versionedJs.length,versionedCss:versionedCss.length,queryImports,importMap:/<script\s+type=["']importmap["']/.test(index),globalAssignments:globalAssignments.length,documentAppEvents,largeHtmlTemplates};
console.log("CleanUp architecture debt baseline",debt);
console.log("Query import debt by file",queryImportsByFile);
console.log("Large HTML template debt by file",largeHtmlTemplatesByFile);

assert.equal(debt.versionedJs,0,"Version-numbered JavaScript files must not return");
assert.equal(debt.versionedCss,0,"Version-numbered CSS files must not return");
assert.equal(debt.importMap,false,"Runtime import-map redirects must not return");
assert.equal(debt.queryImports,0,"Version-query imports must not return");
assert.equal(debt.globalAssignments,0,`Global application assignments must not return: ${globalAssignments.join(", ")}`);
assert.equal(debt.documentAppEvents,0,"Document-level application events must not return");
assert.ok(debt.largeHtmlTemplates<=32,"Large embedded HTML template debt must not grow beyond the verified shadowed expansion UI removal checkpoint");

console.log("CleanUp architecture baseline guard passed");
