export const CART_UPDATED_EVENT = "cart-updated";

export function notifyCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  }
}
