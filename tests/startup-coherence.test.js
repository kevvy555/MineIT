import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const BUILD="5.0.0";const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8"),escaped=BUILD.replaceAll(".","\\.");
const index=read("index.html");assert.match(index,new RegExp(`js/app\\.js\\?v=${escaped}`));for(const css of["app","world","panels","portfolio"])assert.match(index,new RegExp(`css/${css}\\.css\\?v=${escaped}`));
const app=read("js/app.js");for(const line of app.split("\n").filter(line=>line.startsWith("import ")))assert.match(line,new RegExp(`\\?v=${escaped}`),`Unversioned app import: ${line}`);assert.match(app,/startup failed/);assert.match(app,/STARTUP ERROR • TAP FOR DETAILS/);
const ui=read("js/ui/ui-controller.js");for(const line of ui.split("\n").filter(line=>line.startsWith("import ")))assert.match(line,new RegExp(`\\?v=${escaped}`),`Unversioned UI import: ${line}`);assert.match(ui,/portfolio-ui\.js\?v=5\.0\.0/);
assert.ok(read("js/domain/game-state.js").includes("core/config.js?v=5.0.0"));assert.ok(read("js/domain/technology-service.js").includes("data/technologies.js?v=5.0.0"));assert.ok(read("js/persistence/save-repository.js").includes("core/config.js?v=5.0.0"));
console.log("MineIT startup/cache coherence test passed");
