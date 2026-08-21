import { TradeUI as LegacyTradeUI } from "./v55-trade-ui.js?v=5.5.5&legacy=1";

/**
 * Compatibility adapter for the existing trade presentation.
 * Legacy TradeUI binds the shared speed buttons in its constructor; v5.6
 * removes those direct handlers immediately so UIController remains the sole
 * application-level input owner. TradeUI still renders active/disabled state.
 */
export class TradeUI extends LegacyTradeUI{
  constructor(opts){
    super(opts);
    document.querySelectorAll("[data-speed]").forEach(button=>{button.onclick=null;});
    opts.ui.bindSpeedInputs?.();
  }
}
