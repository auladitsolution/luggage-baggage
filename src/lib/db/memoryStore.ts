import { DEFAULT_ROLES } from "@/lib/constants/permissions";
import { RoleSlug, Permission } from "@/types/auth";
import { ICategory, IBrand, IProduct, IProductVariant } from "@/types/catalog";
import { ILocation, IInventoryBalance, IInventoryMovement } from "@/types/inventory";
import {
  ISalesInvoice,
  IPOSSession,
  ICustomer,
  ICustomerCreditTransaction,
  IMoneyReceipt,
} from "@/types/sales";
import {
  ISupplier,
  IPurchaseInvoice,
  ISupplierPayment,
  IExpense,
} from "@/types/purchasing";
import { IOnlineOrder } from "@/types/orders";
import { IEmployee, IPayrollRecord } from "@/types/payroll";
import { IFinancialAccount, IJournalEntry } from "@/types/accounting";

export interface MockRole {
  _id: string;
  slug: RoleSlug;
  name: string;
  nameBangla: string;
  permissions: Permission[];
  description: string;
  isSystem: boolean;
}

export interface MockUser {
  _id: string;
  firebaseUid: string;
  email: string;
  username?: string;
  passwordHash?: string;
  phone?: string;
  displayName: string;
  photoUrl?: string;
  roleId: MockRole;
  isActive: boolean;
  isOwner: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MockStoreState {
  roles: MockRole[];
  users: MockUser[];
  categories: ICategory[];
  brands: IBrand[];
  products: IProduct[];
  variants: IProductVariant[];
  locations: ILocation[];
  inventoryBalances: IInventoryBalance[];
  inventoryMovements: IInventoryMovement[];
  customers: ICustomer[];
  posSessions: IPOSSession[];
  salesInvoices: ISalesInvoice[];
  creditTransactions: ICustomerCreditTransaction[];
  moneyReceipts: IMoneyReceipt[];
  suppliers: ISupplier[];
  purchaseInvoices: IPurchaseInvoice[];
  supplierPayments: ISupplierPayment[];
  expenses: IExpense[];
  onlineOrders: IOnlineOrder[];
  employees: IEmployee[];
  payrollRecords: IPayrollRecord[];
  financialAccounts: IFinancialAccount[];
  journalEntries: IJournalEntry[];
}

declare global {
  // eslint-disable-next-line no-var
  var __luminaMockStore: MockStoreState | undefined;
}

export function getMockStore(): MockStoreState {
  if (!global.__luminaMockStore) {
    const roles: MockRole[] = (Object.keys(DEFAULT_ROLES) as RoleSlug[]).map((slug) => {
      const r = DEFAULT_ROLES[slug];
      return {
        _id: `mock-role-${r.slug}`,
        slug: r.slug,
        name: r.name,
        nameBangla: r.nameBangla,
        permissions: [...r.permissions],
        description: r.description,
        isSystem: true,
      };
    });

    const categories: ICategory[] = [];
    const brands: IBrand[] = [];

    const defaultLocation: ILocation = {
      _id: "mock-loc-main",
      name: "প্রধান শোরুম (Main Showroom)",
      code: "LOC-MAIN",
      address: "দোকান নং ৪২, লেভেল ২, বসুন্ধরা সিটি, পান্থপথ, ঢাকা",
      isDefault: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Initial luggage product
    const p1: IProduct = {
      _id: "mock-prod-1",
      nameBangla: "প্রেসিডেন্ট প্রিমিয়াম হার্ডসাইড ট্রলি লাগেজ",
      nameEnglish: "President Premium Hardside Spinner",
      slug: "president-premium-hardside-spinner",
      brandId: brands[0],
      categoryId: categories[0],
      descriptionBangla: "উচ্চমানের অবিচ্ছেদ্য পলিকার্বোনেট শেল, ৩টি ডিজিট TSA সিকিউরিটি কম্বিনেশন লক, মসৃণ ৩৬০ ডিগ্রি ডাবল স্পিনার ৮টি চাকা এবং ৩ বছরের ওয়ারেন্টি।",
      specifications: {
        "উপাদান": "১০০% ভার্জিন পলিকার্বোনেট",
        "লক": "TSA কম্বিনেশন লক",
        "চাকা": "৩৬০° ডাবল স্পিনার ৮-হুইল",
      },
      images: [
        {
          publicId: "sample-president-1",
          secureUrl: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=800",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      hasVariants: true,
      warrantyInfo: "৩ বছরের ইন্টারন্যাশনাল রিপ্লেসমেন্ট ওয়ারেন্টি",
      status: "active",
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const v1: IProductVariant = {
      _id: "mock-var-1",
      productId: p1._id,
      sku: "PRES-TRL-BLK-20",
      barcode: "202610010020",
      nameVariant: '২০ ইঞ্চি (কেবিন সাইজ) - কালো',
      size: '20 Inch',
      color: 'কালো',
      weightKg: 2.8,
      purchaseCostPoisha: 320000, // ৳ 3,200
      retailPricePoisha: 480000,   // ৳ 4,800
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const v2: IProductVariant = {
      _id: "mock-var-2",
      productId: p1._id,
      sku: "PRES-TRL-BLK-24",
      barcode: "202610010024",
      nameVariant: '২৪ ইঞ্চি (মিডিয়াম চেক-ইন) - কালো',
      size: '24 Inch',
      color: 'কালো',
      weightKg: 3.5,
      purchaseCostPoisha: 420000, // ৳ 4,200
      retailPricePoisha: 620000,   // ৳ 6,200
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const b1: IInventoryBalance = {
      _id: "mock-bal-1",
      variantId: v1._id,
      productId: p1._id,
      locationId: defaultLocation._id,
      currentStock: 12,
      reservedStock: 0,
      lowStockAlertThreshold: 3,
      updatedAt: new Date(),
    };

    const b2: IInventoryBalance = {
      _id: "mock-bal-2",
      variantId: v2._id,
      productId: p1._id,
      locationId: defaultLocation._id,
      currentStock: 2, // Low stock for testing alert!
      reservedStock: 0,
      lowStockAlertThreshold: 3,
      updatedAt: new Date(),
    };

    const sampleCustomers: ICustomer[] = [
      {
        _id: "mock-cust-1",
        name: "তানভীর আহমেদ চৌধুরী",
        phone: "01819876543",
        email: "tanveer@gmail.com",
        address: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা",
        district: "ঢাকা",
        creditLimitPoisha: 5000000,
        currentDuePoisha: 1250000, // ৳ 12,500 due
        totalPurchasedPoisha: 4800000,
        totalPaidPoisha: 3550000,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "mock-cust-2",
        name: "সায়মা সুলতানা",
        phone: "01712345678",
        email: "sayma@gmail.com",
        address: "ব্লক সি, বসুন্ধরা আ/এ, ঢাকা",
        district: "ঢাকা",
        creditLimitPoisha: 3000000,
        currentDuePoisha: 0,
        totalPurchasedPoisha: 1200000,
        totalPaidPoisha: 1200000,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const sampleSuppliers: ISupplier[] = [
      {
        _id: "mock-sup-1",
        name: "কমল লাগেজ ইমপোর্টার্স",
        contactPerson: "মোঃ কামাল হোসেন",
        phone: "01711002233",
        email: "kamal.luggage@gmail.com",
        address: "দোকান ৪২, চকবাজার পাইকারি মার্কেট, ঢাকা",
        currentBalancePoisha: 4500000, // ৳ ৪৫,০০০ পাওনা
        totalPurchasedPoisha: 18000000,
        totalPaidPoisha: 13500000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "mock-sup-2",
        name: "ঢাকা ট্রাভেল গিয়ার্স ও ব্যাগ সাপ্লাই",
        contactPerson: "আব্দুল কাদের",
        phone: "01911334455",
        email: "dhakagears@gmail.com",
        address: "সদরঘাট পাইকারি মার্কেট, ঢাকা",
        currentBalancePoisha: 0,
        totalPurchasedPoisha: 9500000,
        totalPaidPoisha: 9500000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const sampleExpenses: IExpense[] = [
      {
        _id: "mock-exp-1",
        voucherNumber: "EXP-2026-00001",
        category: "shop_rent",
        categoryBangla: "দোকান ভাড়া",
        amountPoisha: 3500000, // ৳ ৩৫,০০০
        paymentMethod: "bank",
        paidTo: "মার্কেট কর্তৃপক্ষ",
        approvedById: "mock-user-owner",
        approvedByName: "আলমগীর কবির",
        status: "approved",
        expenseDate: new Date(),
        description: "অক্টোবর ২০২৬ মাসের দোকান ভাড়া পরিশোধ",
        createdAt: new Date(),
      },
      {
        _id: "mock-exp-2",
        voucherNumber: "EXP-2026-00002",
        category: "electricity",
        categoryBangla: "বিদ্যুৎ বিল",
        amountPoisha: 420000, // ৳ ৪,২০০
        paymentMethod: "bkash",
        paidTo: "ডেসকো বিল",
        approvedById: "mock-user-owner",
        approvedByName: "আলমগীর কবির",
        status: "approved",
        expenseDate: new Date(),
        description: "দোকানের সেপ্টেম্বর মাসের বিদ্যুৎ বিল পরিশোধ",
        createdAt: new Date(),
      },
    ];

    global.__luminaMockStore = {
      roles,
      users: [],
      categories,
      brands,
      products: [],
      variants: [],
      locations: [defaultLocation],
      inventoryBalances: [],
      inventoryMovements: [],
      customers: [
        {
          _id: "mock-cust-walkin",
          name: "সাধারণ কাস্টমার (Walk-in)",
          phone: "01800000000",
          address: "শোরুম সরাসরি বিক্রয়",
          creditLimitPoisha: 0,
          currentDuePoisha: 0,
          totalPurchasedPoisha: 0,
          totalPaidPoisha: 0,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      posSessions: [],
      salesInvoices: [],
      creditTransactions: [],
      moneyReceipts: [],
      suppliers: [],
      purchaseInvoices: [],
      supplierPayments: [],
      expenses: [],
      onlineOrders: [],
      employees: [],
      payrollRecords: [],
      journalEntries: [],
      financialAccounts: [
        {
          _id: "mock-acc-cash",
          accountName: "দোকান ক্যাশ ড্রয়ার (Cash in Hand)",
          accountType: "cash",
          currentBalancePoisha: 0,
          isActive: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "mock-acc-bkash",
          accountName: "বিকাশ মার্চেন্ট ওয়ালেট (01869749988)",
          accountType: "bkash",
          accountNumber: "01869749988",
          currentBalancePoisha: 0,
          isActive: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "mock-acc-nagad",
          accountName: "নগদ মার্চেন্ট ওয়ালেট (01869749988)",
          accountType: "nagad",
          accountNumber: "01869749988",
          currentBalancePoisha: 0,
          isActive: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "mock-acc-bank",
          accountName: "ব্যাংক চলতি হিসাব",
          accountType: "bank",
          bankName: "BRAC Bank PLC",
          accountNumber: "15012048596001",
          currentBalancePoisha: 0,
          isActive: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  }

  return global.__luminaMockStore!;
}

