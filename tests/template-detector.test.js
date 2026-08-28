import assert from "node:assert/strict";
import { largeHtmlTemplates,templateLiterals } from "./template-literal-scanner.js";

const filler="x".repeat(520);
const falsePositive='const id=`probe-${Date.now()}`;/* <div>'+filler+'</div> */const ready=`ok`;';
const realHtml='const view=`<section>'+filler+'</section>`;';
const nested='const message=`Need ${items.map(item=>`${item}`)}`;';
const escaped='const view=`<div>'+filler+'\\` tail</div>`;';

assert.equal(largeHtmlTemplates(falsePositive).length,0,"separate short templates must not be paired across statements");
assert.equal(largeHtmlTemplates(realHtml).length,1,"a real large HTML template must still be detected");
assert.equal(templateLiterals(nested).length,2,"nested interpolation templates must remain independently parseable");
assert.equal(largeHtmlTemplates(escaped).length,1,"escaped backticks must not terminate a template early");

console.log("large HTML template detector regression fixtures passed");
