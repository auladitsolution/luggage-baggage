export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  pricePoisha: number;
  quantity: number;
  image?: string;
  maxStock?: number;
}

const PRIMARY_CART_STORAGE_KEY = "luggage_baggage_cart_v1";
const LEGACY_CART_STORAGE_KEY = "lumina_cart_items_v1";

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRIMARY_CART_STORAGE_KEY) || localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read cart from localStorage:", e);
    return [];
  }
}

export function saveCartItems(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRIMARY_CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("cart_updated"));
  } catch (e) {
    console.error("Failed to save cart to localStorage:", e);
  }
}

export function addToCart(newItem: CartItem): void {
  const items = getCartItems();
  const existingIndex = items.findIndex((i) => i.variantId === newItem.variantId);

  if (existingIndex > -1) {
    const existing = items[existingIndex];
    const newQty = existing.quantity + newItem.quantity;
    existing.quantity = newItem.maxStock ? Math.min(newQty, newItem.maxStock) : newQty;
  } else {
    items.push(newItem);
  }

  saveCartItems(items);
}

export function updateCartItemQuantity(variantId: string, quantity: number): void {
  const items = getCartItems();
  const target = items.find((i) => i.variantId === variantId);
  if (!target) return;

  if (quantity <= 0) {
    removeFromCart(variantId);
    return;
  }

  target.quantity = target.maxStock ? Math.min(quantity, target.maxStock) : quantity;
  saveCartItems(items);
}

export function removeFromCart(variantId: string): void {
  const items = getCartItems().filter((i) => i.variantId !== variantId);
  saveCartItems(items);
}

export function clearCart(): void {
  saveCartItems([]);
}

