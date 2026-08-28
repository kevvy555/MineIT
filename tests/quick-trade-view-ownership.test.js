import assert from "node:assert/strict";
import fs from "node:fs";
import { largeHtmlTemplates } from "./template-literal-scanner.js";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/quick-trade-ui.js"),shell=read("views/quick-trade-shell.html"),sell=read("views/quick-trade-sell.html"),buy=read("views/quick-trade-buy.html"),amount=read("views/quick-trade-amount.html"),colonists=read("views/quick-trade-colonists.html");
for(const path of["./views/quick-trade-sell.html","./views/quick-trade-buy.html","./views/quick-trade-shell.html","./views/quick-trade-amount.html","./views/quick-trade-colonists.html"])assert.ok(ui.includes(path),`missing quick-trade view path: ${path}`);
assert.match(shell,/data-trade-view-host/);assert.doesNotMatch(shell,/\{\{TRADE_VIEW\}\}/,"quick-trade shell must mount the selected external view rather than concatenate HTML");
for(const marker of["SELL COLONY STOCK","data-sell-row-template","data-sell-rows","data-sell-all","data-trade-pager"])assert.ok(sell.includes(marker),`missing sell-view marker: ${marker}`);
for(const marker of["BUY FROM CORPORATION","data-buy-category-template","data-buy-row-template","data-buy-reserve","data-trade-pager"])assert.ok(buy.includes(marker),`missing buy-view marker: ${marker}`);
for(const marker of["createDocumentFragment","cloneNode(true)","replaceChildren","loadViewTemplate(QUICK_VIEWS.sell)","loadViewTemplate(QUICK_VIEWS.buy)"])assert.ok(ui.includes(marker),`missing quick-trade external-view ownership marker: ${marker}`);
assert.equal(largeHtmlTemplates(ui).length,0,"quick-trade-ui must not retain large embedded HTML templates");
assert.doesNotMatch(ui,/rows\.map\([^\n]*\.join\(/,"sell/buy rows must not be string-built loops");assert.doesNotMatch(ui,/BUY_CATEGORIES\.map\([^\n]*\.join\(/,"buy categories must not be string-built loops");
assert.match(ui,/async sellView\(\)/);assert.match(ui,/async buyView\(\)/);assert.match(ui,/quickRenderRevision/);assert.match(ui,/sellableStock/);assert.match(ui,/quoteSell/);assert.match(ui,/tradeReserve/);assert.match(ui,/sellAllQuote/);assert.match(ui,/reserveShortfall/);
assert.match(amount,/data-qty-input/);assert.match(colonists,/COLONIST TRANSFER/);
console.log("quick-trade sell/buy external view ownership contract passed");
