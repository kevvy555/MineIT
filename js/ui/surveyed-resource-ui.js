import { UIController as BaseUIController } from "./building-details-ui.js";
import { formatNumber } from "../core/utils.js?v=5.5.5";

const ATLAS_COLUMNS=8;
const ATLAS_ROWS=5;

/** Adds surveyed resource artwork to undeveloped resource details. */
export class UIController extends BaseUIController{
  resourceDetailHero(tile){
    const index=this.icons?.frameIndex?.(tile),src=this.icons?.imagePath?.(tile);
    if(index===undefined||!src)return"";
    const column=index%ATLAS_COLUMNS,row=Math.floor(index/ATLAS_COLUMNS),x=column?column*100/(ATLAS_COLUMNS-1):0,y=row?row*100/(ATLAS_ROWS-1):0,category=this.resources.categoryName(tile.type),rarity=tile.resourceRarity||"Resource",scale=this.resources.isRenewable(tile)?tile.abundanceLabel||"Renewable":tile.depositScale||"Finite";
    return `<section class="resource-detail-hero">
      <div class="resource-detail-art" role="img" aria-label="${tile.name}" style="background-image:url('${src}');background-position:${x}% ${y}%"></div>
      <div class="resource-detail-copy">
        <div class="resource-detail-kicker">SURVEYED RESOURCE</div>
        <div class="resource-detail-name"><strong>${tile.name}</strong><span>UNDEVELOPED</span></div>
        <small>${category} • ${rarity} • ${scale}</small>
        <div class="resource-detail-quality">Q${formatNumber(tile.quality||0)}</div>
      </div>
    </section>`;
  }

  tile(tile){
    this.tilePanel?.classList.remove("resource-detail-panel");
    super.tile(tile);
    const panel=this.tilePanel;
    if(!panel||panel.classList.contains("hidden")||!tile?.revealed||!tile.resourceId||tile.developed)return;
    const title=panel.querySelector(".panel-title"),hero=this.resourceDetailHero(tile);
    if(title&&hero&&!panel.querySelector(".resource-detail-hero"))title.insertAdjacentHTML("afterend",hero);
    panel.classList.add("resource-detail-panel");
  }
}
