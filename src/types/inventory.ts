export interface ILocation {
  _id: string;
  name: string;
  code: string;
  address: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryBalance {
  _id: string;
  variantId: any;
  productId: any;
  locationId: any;
  currentStock: number;
  reservedStock: number;
  // availableToSell = currentStock - reservedStock
  lowStockAlertThreshold: number;
  updatedAt: Date;
}

export type InventoryMovementType =
  | "purchase_receipt"
  | "pos_sale"
  | "online_sale"
  | "customer_return"
  | "supplier_return"
  | "damage_loss"
  | "manual_adjustment";

export type InventoryReferenceType =
  | "sale_invoice"
  | "purchase_invoice"
  | "stock_adjustment"
  | "return_receipt"
  | "initial_setup";

export interface IInventoryMovement {
  _id: string;
  variantId: any;
  locationId: any;
  movementType: InventoryMovementType;
  quantity: number; // positive or negative
  balanceBefore: number;
  balanceAfter: number;
  referenceType: InventoryReferenceType;
  referenceId: any;
  reason?: string;
  actorId: any;
  createdAt: Date;
}

