export type ShopSlot = "hat" | "backpack" | "gear" | "boots" | "companion";

export interface ShopItem {
  id: string;
  slot: ShopSlot;
  name: string;
  price: number;
  variant: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "hat-sun", slot: "hat", name: "Sun hat", price: 20, variant: "sun" },
  { id: "hat-beanie", slot: "hat", name: "Woolly beanie", price: 30, variant: "beanie" },
  { id: "hat-ranger", slot: "hat", name: "Ranger hat", price: 60, variant: "ranger" },
  { id: "hat-crown", slot: "hat", name: "Fern crown", price: 150, variant: "crown" },
  { id: "pack-green", slot: "backpack", name: "Green backpack", price: 25, variant: "#16a34a" },
  { id: "pack-orange", slot: "backpack", name: "Orange backpack", price: 25, variant: "#f97316" },
  { id: "pack-purple", slot: "backpack", name: "Purple backpack", price: 40, variant: "#8b5cf6" },
  { id: "gear-torch", slot: "gear", name: "Torch", price: 35, variant: "torch" },
  { id: "gear-binoculars", slot: "gear", name: "Binoculars", price: 50, variant: "binoculars" },
  { id: "gear-map", slot: "gear", name: "Trail map", price: 45, variant: "map" },
  { id: "boots-red", slot: "boots", name: "Red boots", price: 30, variant: "#ef4444" },
  { id: "boots-blue", slot: "boots", name: "Blue boots", price: 30, variant: "#3b82f6" },
  { id: "buddy-fantail", slot: "companion", name: "Pīwakawaka the fantail", price: 60, variant: "fantail" },
  { id: "buddy-weta", slot: "companion", name: "Wētā the wētā", price: 70, variant: "weta" },
  { id: "buddy-tui", slot: "companion", name: "Tūī the tūī", price: 90, variant: "tui" },
  { id: "buddy-gecko", slot: "companion", name: "Moko the gecko", price: 110, variant: "gecko" },
  { id: "buddy-morepork", slot: "companion", name: "Ruru the morepork", price: 140, variant: "morepork" },
];

export const SLOT_NAMES: Record<ShopSlot, string> = {
  hat: "Hats",
  backpack: "Backpacks",
  gear: "Gear",
  boots: "Boots",
  companion: "Trail buddies",
};

export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
