/**
 * Safely converts any value to a number, returning null for invalid inputs.
 * Handles comma-separated strings by taking the first value.
 */
export function toSafeNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;

  // Handle comma-separated strings (legacy format: "25,30")
  const str = String(val).split(",")[0].trim();
  const n = Number(str);
  return isNaN(n) ? null : n;
}

export function toSafeNumberList(val: unknown): number[] {
  if (val === null || val === undefined || val === "") return [];

  return String(val)
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => !isNaN(n));
}

export type PriceType = "dineIn" | "takeaway";

export interface MenuPriceOption {
  type: PriceType;
  label: "DIN" | "TW";
  price: number;
}

export function getMenuPriceOptions(item: { price?: unknown; priceTw?: unknown }): MenuPriceOption[] {
  const dineInPrices = toSafeNumberList(item.price);
  const takeawayPrices = toSafeNumberList(item.priceTw);
  const options: MenuPriceOption[] = [];

  dineInPrices.forEach((price) => options.push({ type: "dineIn", label: "DIN", price }));
  takeawayPrices.forEach((price) => options.push({ type: "takeaway", label: "TW", price }));

  return options;
}

export function getMenuPricesForType(
  item: { price?: unknown; priceTw?: unknown },
  _type: PriceType // Parameter ignored
): MenuPriceOption[] {
  // Always use takeaway prices, but use standard price as fallback if priceTw is empty
  const takeawayPrices = toSafeNumberList(item.priceTw);
  const dineInPrices = toSafeNumberList(item.price);

  const prices = takeawayPrices.length > 0 ? takeawayPrices : dineInPrices;
  const label = "TW";

  return prices.map((price) => ({ type: "takeaway", label, price }));
}

export function isPriceTypeEnabled(
  type: PriceType,
  _config: any // Ignored
) {
  return type === "takeaway";
}

export function getItemOrderPermissions(
  _item: any, // Ignored
  _config: any // Ignored
): Record<PriceType, boolean> {
  return {
    dineIn: false, // Always disabled
    takeaway: true, // Always enabled for takeaway only system
  };
}
