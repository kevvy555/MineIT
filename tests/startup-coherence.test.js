import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

const index=read("index.html"),app=read("js/app.js"),pkg=JSON.parse(read("package.json"));

// Startup shell and presentation assets must remain wired regardless of internal module layout.
for(const css of["app","world","panels","portfolio","trade-quality","trade-quick","ui-enhancements","land","map-first","resource-details","adaptive-building-details","ship-expansion","conglomerate-buyers","ship-market"])assert.match(index,new RegExp(`css/${css}(?:-v\\d+)?\\.css`),`missing ${css} stylesheet`);
assert.ok(!index.includes("./css/building-details.css"),"obsolete building-details stylesheet must stay absent");
assert.match(index,/resource-atlas-256\.webp/);assert.match(index,/ui-enhancements\.css\?v=5\.13\.0/);assert.match(index,new RegExp(`js/app\\.js\\?v=${pkg.version.replaceAll(".","\\.")}`),"startup app cache version must match package.json");
for(const id of["overlayRoot","contextBar","attentionStrip","colonyNavStrip","world","mapViewHost","tradeBtn","menuBtn"])assert.match(index,new RegExp(`id="${id}"`),`startup shell missing #${id}`);
assert.doesNotMatch(index,/mapFilterHost/);assert.doesNotMatch(index,/world-view-hotfix/);

// The application composition root must directly own the canonical services and presentation runtimes.
for(const module of["game-state-runtime","portfolio-service","resource-service","inventory-service","collection-service","colony-service","trade-service","buyer-service","land-service","development-service","world-service","site-service","technology-service","survey-service","simulation-engine","game-log-service","transport-service"])assert.match(app,new RegExp(`domain/${module}\\.js`));
for(const module of["world-view-runtime","ship-preparation-ui","corporate-trade-ui","buyer-ui"])assert.match(app,new RegExp(`ui/${module}\\.js`));
for(const marker of["advanceGlobalDate","processPendingCorporateEvent","processPendingShipEvent","reconcileCorporateEvents","resolveBuyerCollection","startup failed","STARTUP ERROR • TAP FOR DETAILS"])assert.match(app,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));

// Canonical domain modules contain the active gameplay, rather than relying on version inheritance.
const stateRuntime=read("js/domain/game-state-runtime.js"),portfolio=read("js/domain/portfolio-service.js"),trade=read("js/domain/trade-service.js"),buyers=read("js/domain/buyer-service.js"),simulation=read("js/domain/simulation-engine.js"),tech=read("js/domain/technology-service.js"),spaceport=read("js/domain/spaceport-model.js"),development=read("js/domain/development-service.js"),model=read("js/domain/building-model.js"),events=read("js/domain/corporate-event-service.js"),expansion=read("js/domain/expansion-service.js");
assert.match(stateRuntime,/state\.version=13/);assert.match(stateRuntime,/ExpansionService/);assert.match(stateRuntime,/normalizeTechnologyState/);assert.match(stateRuntime,/normalizeSurveyHistoryAcrossPortfolio/);assert.match(stateRuntime,/lastScannedAtLevel/);assert.match(stateRuntime,/normalizeReputation/);
assert.match(portfolio,/expeditionArrival/);assert.match(portfolio,/Alpha/);assert.match(portfolio,/ExpansionService/);
assert.match(trade,/corporateServiceAvailable/);assert.match(trade,/serviceAvailable\(state\)/);assert.match(trade,/hasFreeBerth/);assert.match(trade,/orbitalHolding/);assert.match(trade,/exportReputationAwarded/);
assert.match(buyers,/generateOffers/);assert.match(buyers,/processDay/);assert.match(buyers,/resolveMiss/);assert.match(buyers,/removeWeighted/);
assert.match(simulation,/ExpansionService/);assert.match(simulation,/ShipMarketService/);assert.match(simulation,/shipMarket\.processDay/);assert.match(simulation,/onColonyDied/);assert.match(simulation,/siteEnded/);assert.match(simulation,/technology\.processDay/);assert.match(simulation,/updateNetworks\(state,this\.collection\.activeSites/);assert.match(simulation,/changeReputation/);
assert.match(tech,/syncBuildingTotals/);assert.match(tech,/maxBuildingLevel/);assert.match(tech,/canExploit/);assert.match(tech,/scanning/);assert.match(tech,/orderUpgrade/);assert.match(tech,/engineeringTravelDays/);
assert.match(spaceport,/BASIC_SPACEPORT_BERTHS/);assert.match(spaceport,/corporate-trade-ship/);assert.match(spaceport,/engineering-ship/);assert.match(spaceport,/buyer-collection-ship/);
assert.match(development,/BUILDING_MODEL/);assert.match(development,/kind==="power"/);assert.doesNotMatch(development,/company\.cash-=/);
assert.match(model,/SHIP_INFRASTRUCTURE/);assert.match(model,/housing:180/);assert.match(model,/power:30/);assert.match(model,/industry:50/);
assert.match(events,/recovered/);assert.match(events,/contract-decision/);assert.match(events,/legacyPendingDecision/);assert.match(events,/queueBuyer/);
assert.match(expansion,/PLAYER_SHIP_CAPACITY/);assert.match(expansion,/CORPORATE_SERVICE_RADIUS_LY/);assert.match(expansion,/awaitingDestination/);assert.match(expansion,/createPurchasedShip/);assert.match(expansion,/loadCrew/);

console.log("MineIT canonical startup coherence test passed");
