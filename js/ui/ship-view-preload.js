import { preloadViewTemplates } from "../core/view-template.js";

export const SHIP_VIEW_PATHS=[
  "./views/quick-trade-shell.html",
  "./views/quick-trade-sell.html",
  "./views/quick-trade-buy.html",
  "./views/quick-trade-amount.html",
  "./views/quick-trade-colonists.html",
  "./views/conglomerate-buyers.html",
  "./views/buyer-collection-event.html",
  "./views/corporate-technology.html",
  "./views/spaceport-panel.html",
  "./views/star-map-screen.html",
  "./views/planet-table.html",
  "./views/player-ship-prep.html",
  "./views/player-ship-passengers.html",
  "./views/player-ship-route.html",
  "./views/player-ship-lost.html",
  "./views/emergency-ship-food.html",
  "./views/ship-control.html",
  "./views/colony-control.html",
  "./views/koplin-terminal.html",
  "./views/fleet-manager.html",
  "./views/player-fleet-spaceport.html",
  "./views/colonies.html",
  "./views/colony-card.html",
  "./views/colony-land-panel.html",
  "./views/corporation-summary.html"
];

let preloadStarted=false;

export function preloadShipViews(){
  if(preloadStarted)return false;
  preloadStarted=true;
  void preloadViewTemplates(SHIP_VIEW_PATHS);
  return true;
}
