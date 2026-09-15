import { mount, type Ctx } from "../app/context";
import { SHOP_ITEMS, SLOT_NAMES, findItem, type ShopSlot } from "../app/shop";
import { sfx } from "../app/audio";
import { creatureSvg, explorerSvg, featherSvg } from "../ui/art";
import type { CreatureName } from "../curriculum/types";
import { delegate, html } from "../ui/html";
import { headerBar, headerHandlers, lookFor } from "./map";

const SLOTS: ShopSlot[] = ["hat", "backpack", "gear", "boots", "companion"];

export function renderShop(ctx: Ctx): void {
  const el = mount(ctx, "shop-screen");

  const draw = (): void => {
    const p = ctx.profile();
    el.innerHTML = html`
      ${headerBar(ctx, { back: { label: "Map", action: "map" }, title: "Backpack" })}
      <div class="shop-layout">
        <aside class="shop-preview">
          ${explorerSvg(p.avatar, lookFor(p), "explorer preview")}
          <p class="muted">Earn feathers by answering questions. Spend them on gear and trail buddies.</p>
        </aside>
        <div class="shop-items">
          ${SLOTS.map(
            (slot) => html`
              <h2>${SLOT_NAMES[slot]}</h2>
              <div class="item-grid">
                ${SHOP_ITEMS.filter((i) => i.slot === slot).map((item) => {
                  const owned = p.shop.owned.includes(item.id);
                  const equipped = p.shop.equipped[slot] === item.id;
                  const affordable = p.feathers >= item.price;
                  return html`
                    <div class="shop-item ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}">
                      <div class="shop-item-art">${slot === "companion" ? creatureSvg(item.variant as CreatureName, "creature thumb") : explorerSvg(p.avatar, { ...lookFor(p), [slot]: item.variant }, "explorer thumb")}</div>
                      <div class="shop-item-name">${item.name}</div>
                      ${owned
                        ? equipped
                          ? html`<button class="btn small" data-action="unequip" data-slot="${slot}">Take off</button>`
                          : html`<button class="btn small primary" data-action="equip" data-id="${item.id}">Use it</button>`
                        : html`<button class="btn small ${affordable ? "primary" : ""}" data-action="buy" data-id="${item.id}" ${affordable ? "" : "disabled"}>${featherSvg("feather inline")} ${item.price}</button>`}
                    </div>
                  `;
                })}
              </div>
            `,
          )}
        </div>
      </div>
    `.value;
  };

  delegate(el, {
    ...headerHandlers(ctx, draw),
    map() { ctx.go({ name: "map" }); },
    buy(t) {
      const p = ctx.profile();
      const item = findItem(t.dataset.id ?? "");
      if (!item || p.feathers < item.price || p.shop.owned.includes(item.id)) return;
      p.feathers -= item.price;
      p.shop.owned.push(item.id);
      p.shop.equipped[item.slot] = item.id;
      ctx.save();
      sfx.coin();
      draw();
    },
    equip(t) {
      const p = ctx.profile();
      const item = findItem(t.dataset.id ?? "");
      if (!item || !p.shop.owned.includes(item.id)) return;
      p.shop.equipped[item.slot] = item.id;
      ctx.save();
      sfx.tap();
      draw();
    },
    unequip(t) {
      const p = ctx.profile();
      delete p.shop.equipped[t.dataset.slot ?? ""];
      ctx.save();
      sfx.tap();
      draw();
    },
  });
  draw();
}
