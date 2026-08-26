import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),raw=path.join(root,".coverage","raw");
if(!fs.existsSync(raw))throw new Error("No V8 coverage directory found");
const scripts=new Map();
for(const file of fs.readdirSync(raw).filter(f=>f.endsWith(".json"))){
  const json=JSON.parse(fs.readFileSync(path.join(raw,file),"utf8"));
  for(const script of json.result||[]){
    if(!script.url?.startsWith("file://"))continue;
    const pathname=fileURLToPath(script.url),rel=path.relative(root,pathname).replaceAll("\\","/");
    if(!rel.startsWith("js/domain/")&&!rel.startsWith("js/core/"))continue;
    const aggregate=scripts.get(rel)||new Map();
    for(const fn of script.functions||[]){
      const range=fn.ranges?.[0];if(!range)continue;
      const key=`${fn.functionName}|${range.startOffset}|${range.endOffset}`;
      aggregate.set(key,(aggregate.get(key)||0)+Math.max(0,Number(range.count)||0));
    }
    scripts.set(rel,aggregate);
  }
}
let total=0,covered=0;const rows=[];
for(const [file,functions] of [...scripts].sort()){
  const entries=[...functions.entries()].filter(([key])=>!key.startsWith("|0|"));
  const fileTotal=entries.length,fileCovered=entries.filter(([,count])=>count>0).length;
  if(!fileTotal)continue;total+=fileTotal;covered+=fileCovered;rows.push({file,total:fileTotal,covered:fileCovered,pct:fileCovered/fileTotal*100});
}
if(!total)throw new Error("Coverage captured no domain/core functions");
const pct=covered/total*100;
console.log("\nDomain/Core V8 function coverage");
for(const row of rows)console.log(`${row.pct.toFixed(1).padStart(6)}%  ${String(row.covered).padStart(3)}/${String(row.total).padEnd(3)}  ${row.file}`);
console.log(`TOTAL ${pct.toFixed(1)}% (${covered}/${total} functions)`);
fs.mkdirSync(path.join(root,".coverage"),{recursive:true});fs.writeFileSync(path.join(root,".coverage","summary.json"),JSON.stringify({pct,covered,total,files:rows},null,2));
// Phase 0 initially verifies that meaningful executable coverage is captured. The measured value is
// converted into a non-regression threshold after the first green run.
if(pct<20)throw new Error(`Domain/core function coverage is unexpectedly low: ${pct.toFixed(1)}%`);
