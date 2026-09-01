import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const ui=read("js/ui/ship-preparation-ui.js"),market=read("views/ship-market.html"),contract=read("views/ship-purchase-contract.html"),orders=read("views/ship-market-orders.html"),compare=read("views/ship-market-compare.html"),people=read("views/player-ship-passengers.html"),fleet=read("views/player-fleet-spaceport.html"),index=read("index.html");

assert.match(ui,/new ShipMarketService\(this\.shipCatalogue,this\.expansion\)/,"active ship controller must dispatch procurement to ShipMarketService");
assert.match(ui,/this\.shipMarketService\.placeOrder\(/,"purchase execution must use the domain owner");
assert.doesNotMatch(ui,/state\.company\.cash\s*[-+]?=/,"procurement UI must not mutate cash directly");
assert.doesNotMatch(ui,/PLAYER_SHIP_(?:CAPACITY|CARGO_CAPACITY|FOOD_CAPACITY|FUEL_CAPACITY|PASSENGERS)/,"ship preparation must resolve active-ship capacities rather than starter constants");
assert.match(ui,/loadCrew\(this\.state,id,/);assert.match(ui,/loadPassengers\(this\.state,id,/);assert.match(ui,/selectShip\(this\.state,ship\.id\)/);

for(const selector of["data-market-manufacturers","data-market-models","data-market-role-picker","data-market-colony-picker","data-market-compare-toggle","data-market-review","data-market-open-orders"])assert.match(market,new RegExp(selector),`V14 market view missing ${selector}`);
assert.doesNotMatch(market,/<select\b/i,"immersive market controls must not use browser-native selects");
assert.match(contract,/data-contract-signature/);assert.match(contract,/SIGN & PLACE ORDER/);assert.match(contract,/Factory-New Vessel Purchase Contract/);assert.match(contract,/Cancellation before manufacturing lock/);
assert.match(orders,/PRODUCTION & DELIVERY QUEUE/);assert.match(compare,/FLEET COMPARISON/);
assert.match(people,/data-load-crew/);assert.match(people,/data-load-pax/);assert.match(fleet,/data-player-fleet-ship/);
assert.match(index,/css\/ship-market\.css/);assert.match(index,/id="cash">cc 0/);

console.log("ship procurement UI ownership and V14 interaction contract passed");
