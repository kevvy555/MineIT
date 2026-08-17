import { CONFIG } from "../core/config.js";
import { formatMoney, formatNumber } from "../core/utils.js";

export class TradeUI {
  constructor({ state, trade, repo, ui }) {
    Object.assign(this, { state, trade, repo, ui });
    this.button = document.querySelector("#tradeBtn");
    this.button.onclick = () => state.trade.active ? this.open() : this.status();

    document.querySelectorAll("[data-speed]").forEach(button => {
      button.onclick = () => {
        if (state.trade.active && +button.dataset.speed > 0) {
          ui.toast("Corporate ship is docked. Depart before resuming time.");
          return;
        }
        state.speed = +button.dataset.speed;
        ui.syncSpeed();
        this.render();
      };
    });
  }

  price(value) {
    return value < 10 ? `£${value.toFixed(2)}` : formatMoney(value);
  }

  render() {
    const stockValue = document.querySelector("#income");
    if (stockValue) stockValue.textContent = formatMoney(this.trade.stockValue(this.state));

    this.button.classList.toggle("trade-live", this.state.trade.active);
    this.button.textContent = this.state.trade.active
      ? "TRADE!"
      : `SHIP ${formatNumber(this.trade.daysUntilArrival(this.state))}d`;

    document.querySelectorAll("[data-speed]").forEach(button => {
      button.disabled = this.state.trade.active && +button.dataset.speed > 0;
    });
  }

  status() {
    this.ui.open("Corporate Trade Ship", `
      <article class="card">
        <h3>NEXT VISIT IN ${formatNumber(this.trade.daysUntilArrival(this.state))} DAYS</h3>
        <p>A corporate vessel arrives every ${CONFIG.TRADE_INTERVAL_DAYS} days (six game months). Collected resources stay in storage until a ship docks.</p>
        <div class="grid2">
          <div class="metric"><small>Stored stock value</small><strong>${formatMoney(this.trade.stockValue(this.state))}</strong></div>
          <div class="metric"><small>Completed visits</small><strong>${this.state.trade.visits}</strong></div>
        </div>
      </article>`);
  }

  open(selectedKey = null) {
    if (!this.state.trade.active) {
      this.status();
      return;
    }

    const stock = this.trade.stock(this.state);
    const catalog = this.trade.catalog();
    const selected = catalog.find(item => item.key === selectedKey) || catalog[0];
    const buyPrice = this.trade.buyPrice(selected.type);

    this.ui.open("Corporate Trade Ship — DOCKED", `
      <div class="trade-summary">
        <div class="metric"><small>Cash</small><strong>${formatMoney(this.state.company.cash)}</strong></div>
        <div class="metric"><small>Stock value</small><strong>${formatMoney(this.trade.stockValue(this.state))}</strong></div>
        <div class="metric"><small>Next visit</small><strong>${CONFIG.TRADE_INTERVAL_DAYS}d after departure</strong></div>
      </div>

      <section class="trade-section">
        <h3>SELL COLLECTED STOCK</h3>
        ${stock.length ? `
          <div class="trade-table">
            ${stock.map(entry => `
              <div class="trade-row">
                <strong>${entry.name}</strong>
                <span>${formatNumber(entry.amount)}</span>
                <span>${this.price(this.trade.sellPrice(entry.type))}/u</span>
                <div class="trade-actions">
                  <button data-q="${entry.key}">25%</button>
                  <button data-a="${entry.key}">ALL</button>
                </div>
              </div>`).join("")}
          </div>` : `<div class="card"><p>No stored resources available to sell.</p></div>`}
      </section>

      <section class="trade-section">
        <h3>BUY FROM CORPORATION</h3>
        <div class="trade-buy">
          <button class="trade-resource-select" data-resource-picker>
            <span>
              <small>Selected resource</small>
              <strong>${selected.name}</strong>
              <em>${selected.category} • ${selected.rarity}</em>
            </span>
            <span class="trade-resource-price">${this.price(buyPrice)}/u <b>▾</b></span>
          </button>
          <div class="trade-buy-buttons">
            <button data-buy="100" ${this.state.company.cash < buyPrice * 100 ? "disabled" : ""}>BUY 100</button>
            <button data-buy="1000" ${this.state.company.cash < buyPrice * 1000 ? "disabled" : ""}>BUY 1K</button>
            <button data-buy="10000" ${this.state.company.cash < buyPrice * 10000 ? "disabled" : ""}>BUY 10K</button>
          </div>
          <div class="trade-note">Purchased stock goes into storage and does not count as local Food or Industry production.</div>
        </div>
      </section>

      <div class="trade-footer">
        <button data-all ${stock.length ? "" : "disabled"}>SELL ALL STOCK</button>
        <button data-depart class="warn">SHIP DEPARTS</button>
      </div>`);

    const modal = this.ui.modal;

    modal.querySelector("[data-resource-picker]").onclick = () => this.openResourcePicker(selected.key);

    modal.querySelectorAll("[data-q]").forEach(button => {
      button.onclick = () => {
        const entry = this.state.inventory[button.dataset.q];
        const result = this.trade.sell(this.state, button.dataset.q, (entry?.amount || 0) * .25);
        if (result.ok) {
          this.ui.toast(`Sold ${formatNumber(result.qty)} for ${formatMoney(result.revenue)}.`);
          this.open(selected.key);
        }
      };
    });

    modal.querySelectorAll("[data-a]").forEach(button => {
      button.onclick = () => {
        const entry = this.state.inventory[button.dataset.a];
        const result = this.trade.sell(this.state, button.dataset.a, entry?.amount || 0);
        if (result.ok) {
          this.ui.toast(`Sold ${formatNumber(result.qty)} for ${formatMoney(result.revenue)}.`);
          this.open(selected.key);
        }
      };
    });

    modal.querySelectorAll("[data-buy]").forEach(button => {
      button.onclick = () => {
        const result = this.trade.buy(this.state, selected.key, +button.dataset.buy);
        if (result.ok) {
          this.ui.toast(`Bought ${formatNumber(result.qty)} ${result.entry.name}.`);
          this.open(selected.key);
        } else {
          this.ui.toast(result.reason);
        }
      };
    });

    modal.querySelector("[data-all]").onclick = () => {
      const result = this.trade.sellAll(this.state);
      if (result.ok) {
        this.ui.toast(`Sold all stock for ${formatMoney(result.revenue)}.`);
        this.open(selected.key);
      }
    };

    modal.querySelector("[data-depart]").onclick = () => {
      this.trade.depart(this.state);
      modal.classList.add("hidden");
      this.ui.syncSpeed();
      this.render();
      this.repo.save(this.state);
      this.ui.toast(`Trade ship departed • next visit in ${CONFIG.TRADE_INTERVAL_DAYS} days.`);
    };
  }

  openResourcePicker(selectedKey) {
    const catalog = this.trade.catalog();
    const categories = ["Food", "Industrial Ore", "Valuable"];
    const layer = document.createElement("div");
    layer.className = "resource-picker-backdrop";
    layer.dataset.resourcePickerLayer = "";

    layer.innerHTML = `
      <section class="resource-picker" role="dialog" aria-modal="true" aria-label="Select corporate resource">
        <div class="resource-picker-header">
          <div>
            <small>CORPORATE INVENTORY</small>
            <strong>Select Resource</strong>
          </div>
          <button class="close" data-picker-close aria-label="Close resource list">✕</button>
        </div>
        <div class="resource-picker-list">
          ${categories.map(category => {
            const items = catalog.filter(item => item.category === category);
            return `
              <div class="resource-picker-category">${category}</div>
              ${items.map(item => `
                <button class="resource-picker-row ${item.key === selectedKey ? "selected" : ""}" data-resource-key="${item.key}">
                  <span class="resource-picker-name">
                    <strong>${item.name}</strong>
                    <small>${item.rarity}</small>
                  </span>
                  <span class="resource-picker-buy">
                    <small>BUY</small>
                    <strong>${this.price(this.trade.buyPrice(item.type))}/u</strong>
                  </span>
                </button>`).join("")}`;
          }).join("")}
        </div>
      </section>`;

    this.ui.modal.appendChild(layer);

    layer.querySelector("[data-picker-close]").onclick = () => layer.remove();
    layer.onclick = event => {
      if (event.target === layer) layer.remove();
    };
    layer.querySelectorAll("[data-resource-key]").forEach(button => {
      button.onclick = () => this.open(button.dataset.resourceKey);
    });
  }
}
