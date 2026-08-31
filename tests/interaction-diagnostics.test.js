import assert from "node:assert/strict";
import { Diagnostics } from "../js/core/diagnostics.js";

const diagnostics=new Diagnostics(3,3);
diagnostics.interaction("pointerdown",{target:"#one"});
diagnostics.interaction("pointerup",{target:"#one"});
diagnostics.interaction("click-capture",{target:"#one"});
diagnostics.interaction("click-bubble",{target:"#one"});
assert.equal(diagnostics.interactions.length,3,"interaction trace must stay bounded");
assert.equal(diagnostics.interactions[0].stage,"pointerup","oldest interaction trace entry should be evicted first");
const text=diagnostics.text({year:1,day:1,portfolio:{colonies:[]},company:{pendingEvents:[]}});
assert.match(text,/INTERACTION TRACE \(3\)/);
assert.match(text,/"stage":"click-capture"/);
assert.match(text,/"stage":"click-bubble"/);
assert.match(text,/"interactionEvents":\s*3/);
diagnostics.clearInteractions();
assert.equal(diagnostics.interactions.length,0);
console.log("MineIT bounded interaction diagnostics regression test passed");
