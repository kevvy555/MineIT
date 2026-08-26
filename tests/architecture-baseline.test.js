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
const allowedGlobals=new Set(["js/app.js:mineITBoot","js/app.js:mineIT"]);
assert.ok(globalAssignments.every(item=>allowedGlobals.has(item)),`Unexpected global application assignment(s): ${globalAssignments.join(", ")}`);
assert.ok(globalAssignments.length<=3,"Global application-state leakage must not grow during cleanup");

const versionedJs=jsFiles.map(rel).filter(name=>/-v\d+\.js$/.test(name));
const versionedCss=cssFiles.map(rel).filter(name=>/-v\d+\.css$/.test(name));
let queryImports=0,documentAppEvents=0,largeMarkupTemplates=0;
for(const [,text] of source){
  queryImports+=(text.match(/(?:from\s+|import\s*\()["'][^"']+\.js\?v=/g)||[]).length;
  documentAppEvents+=(text.match(/document\.(?:dispatchEvent|addEventListener)\([^\n]*mineit:/g)||[]).length;
  largeMarkupTemplates+=(text.match(/`[^`]{500,}`/gs)||[]).length;
}
const debt={versionedJs:versionedJs.length,versionedCss:versionedCss.length,queryImports,importMap:/<script\s+type=["']importmap["']/.test(index),globalAssignments:globalAssignments.length,documentAppEvents,largeMarkupTemplates};
console.log("CleanUp architecture debt baseline",debt);

assert.equal(debt.versionedJs,0,"Version-numbered JavaScript files must not return");
assert.equal(debt.versionedCss,0,"Version-numbered CSS files must not return");
assert.equal(debt.importMap,false,"Runtime import-map redirects must not return");
assert.ok(debt.queryImports<=41,"Version-query import debt must not grow beyond the current query-cleanup checkpoint");
assert.ok(debt.globalAssignments<=3,"Global application-state leakage must not grow during cleanup");
assert.ok(debt.documentAppEvents<=9,"Document-level application event debt must not grow beyond the current checkpoint");
assert.ok(debt.largeMarkupTemplates<=217,"Large embedded HTML template debt must not grow beyond the current checkpoint");

console.log("CleanUp architecture baseline guard passed");
