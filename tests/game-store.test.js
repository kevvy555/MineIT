import assert from "node:assert/strict";
import { GameStore } from "../js/core/game-store.js";

const initial={company:{cash:100},speed:1};
const store=new GameStore(initial);
assert.equal(store.getState(),initial,"GameStore must expose the original stable root object");

const changes=[];
const unsubscribe=store.subscribe((state,change)=>changes.push({state,change}));
const result=store.transaction("spend",state=>{state.company.cash-=25;return state.company.cash;});
assert.equal(result,75);assert.equal(initial.company.cash,75);assert.equal(changes.length,1);assert.equal(changes[0].state,initial);assert.equal(changes[0].change.type,"transaction");assert.equal(changes[0].change.label,"spend");

const oldRoot=store.getState();
const replacement={company:{cash:500},speed:0,newField:true};
assert.equal(store.replaceState(replacement,{label:"reset"}),oldRoot,"replaceState must preserve root identity for existing UI/service references");
assert.equal(store.getState(),oldRoot);assert.deepEqual(oldRoot,replacement);assert.equal(changes.length,2);assert.equal(changes[1].change.type,"replace");assert.equal(changes[1].change.label,"reset");

store.notify("manual-change");assert.equal(changes.length,3);assert.equal(changes[2].change.type,"notify");
unsubscribe();store.transaction("after-unsubscribe",state=>{state.speed=2;});assert.equal(changes.length,3);

assert.throws(()=>new GameStore(null),/requires an object root state/);
assert.throws(()=>store.transaction("bad",null),/mutator function/);
store.dispose();store.dispose();assert.throws(()=>store.notify(),/disposed/);assert.throws(()=>store.subscribe(()=>{}),/disposed/);

console.log("GameStore stable-root ownership, transactions and subscriptions test passed");
