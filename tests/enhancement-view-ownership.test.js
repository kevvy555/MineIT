import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/ui-enhancements.js"),collection=read("views/current-collection.html"),menu=read("views/game-menu.html"),legacyTech=read("views/legacy-technology.html"),modernTech=read("js/ui/technology-presentation-ui.js"),modernTechView=read("views/corporate-technology.html"),survival=read("js/ui/survival-ui.js"),survivalManual=read("views/survival-manual.html"),industry=read("js/ui/industry-ui.js"),v55=read("js/ui/v55-ui.js");
for(const path of["./views/current-collection.html","./views/game-menu.html","./views/legacy-technology.html"])assert.ok(ui.includes(path),`missing UI-enhancement view path: ${path}`);
for(const marker of["data-collection-empty","data-collection-head","data-collection-header-template","data-collection-row-template"])assert.ok(collection.includes(marker),`missing current-collection marker: ${marker}`);
for(const marker of["data-game-menu","data-save","data-help","data-reset"])assert.ok(menu.includes(marker),`missing game-menu marker: ${marker}`);
for(const marker of["data-legacy-tech-toolbar","data-tech-old-toggle","data-tech-path-template","data-tech-card-template"])assert.ok(legacyTech.includes(marker),`missing compatibility technology marker: ${marker}`);
for(const marker of["preloadViewTemplates(Object.values(ENHANCEMENT_VIEWS))","getLoadedViewTemplate","cloneNode(true)","replaceChildren"])assert.ok(ui.includes(marker),`missing external enhancement ownership marker: ${marker}`);
assert.doesNotMatch(ui,/await\s+preloadViewTemplates\(/,"enhancement view preload must not delay module evaluation");
assert.equal(largeHtmlTemplates(ui).length,0,"ui-enhancements must not retain large embedded HTML templates");
assert.doesNotMatch(ui,/\n\s{2}(?:async\s+)?help\s*\(/,"shadowed UI-enhancement help renderer must stay removed");
assert.match(survival,/\n\s{2}help\(\)/,"Survival UI must remain the active field-manual owner");assert.match(survival,/\.\/views\/survival-manual\.html/);assert.match(survivalManual,/MINEIT FIELD MANUAL/);
assert.match(modernTech,/async tech\(\)/,"modern technology presentation must remain the final technology owner");assert.match(modernTech,/\.\/views\/corporate-technology\.html/);assert.match(modernTechView,/data-tech-path-template/);
assert.match(industry,/UIEnhancementsMixin\.prototype\.currentCollection\.call\(this\)/,"Industry wrapper must retain the collection base owner");assert.match(v55,/IndustryUIMixin\.prototype\.currentCollection\.call\(this\)/,"V55 wrapper must retain the Industry collection layer");assert.match(v55,/UIEnhancementsMixin\.prototype\.menu\.call\(this\)/,"V55 Game Log menu wrapper must retain the external menu base");
assert.match(v55,/UIEnhancementsMixin\.prototype\.tech\.call\(this\)/,"legacy V55 technology compatibility wrapper must remain functional until Phase 5 removes the shadowed chain");
console.log("UI enhancement external view ownership contract passed");
