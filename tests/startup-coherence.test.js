import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const BUILD = "4.0.2";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const index = read("index.html");
assert.match(index, new RegExp(`js/app\\.js\\?v=${BUILD.replaceAll(".", "\\.")}`));
for (const css of ["app", "world", "panels"]) {
  assert.match(index, new RegExp(`css/${css}\\.css\\?v=${BUILD.replaceAll(".", "\\.")}`));
}

const app = read("js/app.js");
for (const line of app.split("\n").filter(line => line.startsWith("import "))) {
  assert.match(line, new RegExp(`\\?v=${BUILD.replaceAll(".", "\\.")}`), `Unversioned app import: ${line}`);
}
assert.match(app, /startup failed/);
assert.match(app, /STARTUP ERROR • TAP FOR DETAILS/);

const uiController = read("js/ui/ui-controller.js");
for (const line of uiController.split("\n").filter(line => line.startsWith("import "))) {
  assert.match(line, new RegExp(`\\?v=${BUILD.replaceAll(".", "\\.")}`), `Unversioned UI import: ${line}`);
}

const nestedChecks = {
  "js/domain/resource-service.js": "data/resources.js?v=4.0.1",
  "js/domain/inventory-service.js": "data/resources.js?v=4.0.1",
  "js/domain/game-state.js": "data/resources.js?v=4.0.1",
  "js/domain/world-service.js": "data/resources.js?v=4.0.1",
  "js/domain/technology-service.js": "data/technologies.js?v=4.0.1",
  "js/domain/contract-service.js": "data/contracts.js?v=4.0.1"
};
for (const [path, expected] of Object.entries(nestedChecks)) {
  assert.ok(read(path).includes(expected), `${path} must version ${expected}`);
}

console.log("MineIT startup/cache coherence test passed");
