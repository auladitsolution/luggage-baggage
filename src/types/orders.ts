export type OnlineOrderStatus =
  | "pending" // নতুন অর্ডার
  | "confirmed" // ফোন ভেরিফাই ও কনফার্মড
  | "processing" // প্যাকিং ও প্রসেসিং
  | "shipped" // কুরিয়ারে হস্তান্তর
  | "delivered" // ডেলিভার্ড ও সম্পন্ন
  | "cancelled" // বাতিল (স্টক ফেরত)
  | "returned"; // কুরিয়ার ফেরত (স্টক ফেরত)

export type OnlinePaymentMethod =
  | "cod"
  | "bkash_manual"
  | "nagad_manual"
  | "bank_manual";

export type OnlinePaymentStatus =
  | "pending"
  | "pending_verification"
  | "paid"
  | "failed"
  | "refunded";

export interface IOrderItem {
  variantId: any;
  productId: any;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPricePoisha: number;
  totalAmountPoisha: number;
  image?: string;
}

export interface IOnlineOrder {
  _id: string;
  orderNumber: string; // 'ORD-2026-00001'
  customerId?: any;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    address: string;
    district: string;
    thanaOrArea?: string;
  };
  deliveryZone: "inside_dhaka" | "outside_dhaka";
  items: IOrderItem[];
  subTotalPoisha: number;
  deliveryFeePoisha: number;
  couponDiscountPoisha: number;
  grandTotalPoisha: number;
  paymentMethod: OnlinePaymentMethod;
  paymentStatus: OnlinePaymentStatus;
  manualPaymentDetails?: {
    senderNumber?: string;
    transactionId?: string;
    bankName?: string;
    verifiedAt?: Date;
    verifiedById?: any;
    verifiedByName?: string;
  };
  orderStatus: OnlineOrderStatus;
  courierName?: string;
  trackingNumber?: string;
  salesInvoiceId?: any;
  customerNotes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

