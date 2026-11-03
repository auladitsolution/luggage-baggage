/**
 * ============================================================================
 * ফেস ২ ইউআই প্রিভিউ ডেমো ডেটা (Sample Data for Phase 2 UI Previews Only)
 * ============================================================================
 * এই ডেটা শুধুমাত্র ফেজ ২ ইউজার ইন্টারফেস এবং রেস্পন্সিভ লেআউট প্রদর্শনের জন্য।
 * কোনো প্রোডাকশন বিজনেস লজিক বা ডাটাবেসের সাথে এটি সরাসরি যুক্ত নয়।
 */

export interface ISampleVariant {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  size: string;
  color: string;
  pricePoisha: number;
  discountPricePoisha?: number;
  stock: number;
}

export interface ISampleProduct {
  id: string;
  nameBangla: string;
  nameEnglish: string;
  slug: string;
  category: string;
  brand: string;
  basePricePoisha: number;
  images: string[];
  description: string;
  features: string[];
  specifications: Record<string, string>;
  warranty: string;
  variants: ISampleVariant[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

export const SAMPLE_CATEGORIES = [
  {
    id: "cat-1",
    name: "ট্রাভেল স্যুটকেস ও ট্রলি",
    slug: "travel-suitcases",
    count: 24,
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cat-2",
    name: "ট্রাভেল ও হাইকিং ব্যাকপ্যাক",
    slug: "travel-backpacks",
    count: 18,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cat-3",
    name: "ল্যাপটপ ও বিজনেস ব্যাগ",
    slug: "laptop-bags",
    count: 15,
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cat-4",
    name: "ডাফেল ও জিম ব্যাগ",
    slug: "duffel-bags",
    count: 12,
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cat-5",
    name: "ক্যাবিনের উপযোগী লাগেজ",
    slug: "cabin-luggage",
    count: 14,
    image: "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cat-6",
    name: "ভ্রমণ অনুষঙ্গ ও লক",
    slug: "travel-accessories",
    count: 30,
    image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80",
  },
];

export const SAMPLE_PRODUCTS: ISampleProduct[] = [
  {
    id: "prod-1",
    nameBangla: "প্রেসিডেন্ট প্রিমিয়াম হার্ডসাইড পলিকার্বোনেট লাগেজ",
    nameEnglish: "President Premium Hardside Polycarbonate Luggage",
    slug: "president-premium-hardside-polycarbonate-luggage",
    category: "ট্রাভেল স্যুটকেস ও ট্রলি",
    brand: "President",
    basePricePoisha: 480000,
    images: [
      "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80",
    ],
    description: "১০০% ভার্জিন জার্মানি পলিকার্বোনেট ম্যাটেরিয়ালে তৈরি অত্যন্ত টেকসই ও ওজনে হালকা ট্রলি লাগেজ। এতে রয়েছে আন্তর্জাতিক মানসম্পন্ন টিএসএ সিকিউরিটি লক এবং স্মুথ ৩৬০ ডিগ্রি সাইলেন্ট স্পিনার হুইল।",
    features: [
      "১০০% জার্মানি বেয়ার পলিকার্বোনেট শেল",
      "ইন্টিগ্রেটেড TSA ৩-ডিজিট কম্বিনেশন লক",
      "৪-হুইল ডুয়াল সাইলেন্ট স্পিনার টেকনোলজি",
      "স্ক্র্যাচ-প্রতিরোধী মেট ফিনিশ টেক্সচার",
      "ওয়াটারপ্রুফ জিপার সিলিং প্রযুক্তি",
    ],
    specifications: {
      "উপাদান": "১০০% ভার্জিন পলিকার্বোনেট",
      "হুইল": "৩৬০ ডিগ্রি ডুয়াল স্পিনার (৪ জোড়া)",
      "লক সিস্টেম": "TSA কম্বিনেশন লক",
      "হ্যান্ডেল": "৩-ধাপ অ্যালুমিনিয়াম টেলিস্কোপিক রড",
      "উৎস": "আমদানি করা (অরিজিনাল)",
    },
    warranty: "৩ বছরের আন্তর্জাতিক ম্যানুফ্যাকচারার ওয়ারেন্টি",
    isFeatured: true,
    isNewArrival: true,
    variants: [
      {
        id: "var-1",
        sku: "PRES-TRL-BLK-20",
        barcode: "890100100201",
        name: "২০ ইঞ্চি (কেবিন সাইজ) - জেট ব্ল্যাক",
        size: "২০ ইঞ্চি (Cabin)",
        color: "জেট ব্ল্যাক",
        pricePoisha: 480000,
        discountPricePoisha: 450000,
        stock: 8,
      },
      {
        id: "var-2",
        sku: "PRES-TRL-BLK-24",
        barcode: "890100100241",
        name: "২৪ ইঞ্চি (মিডিয়াম সাইজ) - জেট ব্ল্যাক",
        size: "২৪ ইঞ্চি (Medium)",
        color: "জেট ব্ল্যাক",
        pricePoisha: 620000,
        discountPricePoisha: 580000,
        stock: 5,
      },
      {
        id: "var-3",
        sku: "PRES-TRL-BLK-28",
        barcode: "890100100281",
        name: "২৮ ইঞ্চি (লার্জ ট্রাভেল সাইজ) - জেট ব্ল্যাক",
        size: "২৮ ইঞ্চি (Large)",
        color: "জেট ব্ল্যাক",
        pricePoisha: 780000,
        stock: 3,
      },
      {
        id: "var-4",
        sku: "PRES-TRL-NVY-24",
        barcode: "890100100242",
        name: "২৪ ইঞ্চি (মিডিয়াম সাইজ) - নেভি ব্লু",
        size: "২৪ ইঞ্চি (Medium)",
        color: "নেভি ব্লু",
        pricePoisha: 620000,
        stock: 4,
      },
    ],
  },
  {
    id: "prod-2",
    nameBangla: "আমেরিকান ট্যুরিস্টার সাউন্ডবক্স স্পিনার ট্রলি লাগেজ",
    nameEnglish: "American Tourister Soundbox Spinner Trolley",
    slug: "american-tourister-soundbox-spinner-trolley",
    category: "ট্রাভেল স্যুটকেস ও ট্রলি",
    brand: "American Tourister",
    basePricePoisha: 550000,
    images: [
      "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80",
    ],
    description: "মিউজিক্যাল ভিনাইল রেকর্ড দ্বারা অনুপ্রাণিত অনন্য কনসেন্ট্রিক সার্কেল ডিজাইন। এক্সপ্যান্ডেবল জিপার সুবিধার মাধ্যমে অতিরিক্ত স্টোরেজ স্পেস নিশ্চিত করে।",
    features: [
      "এক্সপ্যান্ডেবল ক্ষমতা (অতিরিক্ত ২০% স্পেস)",
      "লাইটওয়েট পলিপ্রোপিলিন (PP) ম্যাটেরিয়াল",
      "TSA রিকগনাইজড সিকিউর লক",
    ],
    specifications: {
      "ম্যাটেরিয়াল": "পলিপ্রোপিলিন",
      "চাকা": "৪ টি ডুয়াল স্পিনার চাকা",
      "লক": "TSA অনুমোদিত লক",
    },
    warranty: "৩ বছরের অফিসিয়াল ওয়ারেন্টি",
    isFeatured: true,
    variants: [
      {
        id: "var-5",
        sku: "AMTC-SND-MRN-24",
        barcode: "890200200241",
        name: "২৪ ইঞ্চি - ডিপ মেরুন",
        size: "২৪ ইঞ্চি (Medium)",
        color: "ডিপ মেরুন",
        pricePoisha: 650000,
        stock: 6,
      },
      {
        id: "var-6",
        sku: "AMTC-SND-YLW-20",
        barcode: "890200200202",
        name: "২০ ইঞ্চি - গোল্ডেন ইয়েলো",
        size: "২০ ইঞ্চি (Cabin)",
        color: "গোল্ডেন ইয়েলো",
        pricePoisha: 550000,
        stock: 2,
      },
    ],
  },
  {
    id: "prod-3",
    nameBangla: "আর্কটিক হান্টার ওয়াটারপ্রুফ স্মার্ট ট্রাভেল ব্যাকপ্যাক",
    nameEnglish: "Arctic Hunter Waterproof Smart Travel Backpack",
    slug: "arctic-hunter-waterproof-smart-travel-backpack",
    category: "ট্রাভেল ও হাইকিং ব্যাকপ্যাক",
    brand: "Arctic Hunter",
    basePricePoisha: 320000,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
    description: "ইউএসবি এক্সটারনাল চার্জিং পোর্ট, ওয়াটারপ্রুফ অক্সফোর্ড ফেব্রিক এবং ডেডিকেটেড ১৫.৬ ইঞ্চি ল্যাপটপ স্লটসহ আধুনিক স্মার্ট ট্রাভেল ব্যাকপ্যাক।",
    features: [
      "ল্যাপটপ প্রটেক্টিভ কুশন বগি",
      "এক্সটারনাল ইউএসবি চার্জিং স্লট",
      "অ্যান্টি-থেফট হিডেন পকেট",
      "ব্রেথেবল ব্যাক প্যানেল সাপোর্ট",
    ],
    specifications: {
      "উপাদান": "হাই-ডেনসিটি ওয়াটারপ্রুফ অক্সফোর্ড",
      "ধারণক্ষমতা": "৩২ লিটার",
      "ল্যাপটপ ধারণ": "১৫.৬ ইঞ্চি পর্যন্ত",
    },
    warranty: "১ বছরের ফ্রি সার্ভিস ওয়ারেন্টি",
    isFeatured: true,
    isNewArrival: true,
    variants: [
      {
        id: "var-7",
        sku: "ARCH-BP-BLK-STD",
        barcode: "890300300101",
        name: "স্ট্যান্ডার্ড - চারকোল ব্ল্যাক",
        size: "৩২ লিটার",
        color: "চারকোল ব্ল্যাক",
        pricePoisha: 320000,
        stock: 12,
      },
      {
        id: "var-8",
        sku: "ARCH-BP-GRY-STD",
        barcode: "890300300102",
        name: "স্ট্যান্ডার্ড - অ্যাশ গ্রে",
        size: "৩২ লিটার",
        color: "অ্যাশ গ্রে",
        pricePoisha: 320000,
        stock: 9,
      },
    ],
  },
  {
    id: "prod-4",
    nameBangla: "ভিক্টোরিনক্স প্রিমিয়াম বিজনেস এক্সিকিউটিভ ডাফেল ট্রাভেলার",
    nameEnglish: "Victorinox Premium Executive Duffel Traveler",
    slug: "victorinox-premium-executive-duffel-traveler",
    category: "ডাফেল ও জিম ব্যাগ",
    brand: "Victorinox",
    basePricePoisha: 380000,
    images: [
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=800&q=80",
    ],
    description: "শর্ট বিজনেস ট্রিপ বা জিমের জন্য প্রিমিয়াম ডাফেল ব্যাগ। জুতা রাখার আলাদা বগি ও ওয়াটার-রেজিস্ট্যান্ট কোটিং সমৃদ্ধ।",
    features: [
      "পৃথক শু-কম্পার্টমেন্ট",
      "আরামদায়ক প্যাডেড শোল্ডার স্ট্র্যাপ",
      "মজবুত মেটাল হার্ডওয়্যার ও বাকল",
    ],
    specifications: {
      "ম্যাটেরিয়াল": "ব্যালিস্টিক নাইলন ও জেনুইন লেদার ট্রিম",
      "ধারণক্ষমতা": "৪৫ লিটার",
    },
    warranty: "২ বছরের আন্তর্জাতিক ওয়ারেন্টি",
    isFeatured: false,
    variants: [
      {
        id: "var-9",
        sku: "VICT-DFL-BRN-45",
        barcode: "890400400451",
        name: "৪৫ লিটার - ডার্ক চকোলেট",
        size: "৪৫ লিটার",
        color: "ডার্ক চকোলেট",
        pricePoisha: 380000,
        stock: 4,
      },
    ],
  },
];

export const SAMPLE_KPI_STATS = {
  todaySalesPoisha: 7850000, // ৳ ৭৮,৫০০
  todayCashReceivedPoisha: 6400000, // ৳ ৬৪,০০০
  totalCustomerDuesPoisha: 4250000, // ৳ ৪২,৫০০
  totalInventoryValuePoisha: 125000000, // ৳ ১২,৫০,০০০
  lowStockItemsCount: 3,
  pendingOnlineOrders: 4,
};

export const SAMPLE_RECENT_SALES = [
  {
    id: "inv-01",
    invoiceNumber: "INV-2026-00101",
    time: "১০:৪৫ AM",
    customerName: "মোহাম্মদ রফিকুল ইসলাম",
    customerPhone: "01711223344",
    itemsSummary: "প্রেসিডেন্ট ২৪\" ট্রলি (১)",
    amountPoisha: 580000,
    paidPoisha: 580000,
    duePoisha: 0,
    paymentMethod: "নগদ ক্যাশ",
    status: "paid",
  },
  {
    id: "inv-02",
    invoiceNumber: "INV-2026-00102",
    time: "১১:২০ AM",
    customerName: "তানভীর আহমেদ চৌধুরী",
    customerPhone: "01819876543",
    itemsSummary: "আমেরিকান ট্যুরিস্টার ২৪\" (১)",
    amountPoisha: 650000,
    paidPoisha: 350000,
    duePoisha: 300000,
    paymentMethod: "আংশিক নগদ",
    status: "due",
  },
  {
    id: "inv-03",
    invoiceNumber: "INV-2026-00103",
    time: "১২:১৫ PM",
    customerName: "ওয়াক-ইন কাস্টমার",
    customerPhone: "-",
    itemsSummary: "আর্কটিক হান্টার ব্যাকপ্যাক (১)",
    amountPoisha: 320000,
    paidPoisha: 320000,
    duePoisha: 0,
    paymentMethod: "বিকাশ",
    status: "paid",
  },
];

export const SAMPLE_CUSTOMERS_DUE = [
  {
    id: "c-1",
    name: "তানভীর আহমেদ চৌধুরী",
    phone: "01819876543",
    address: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা",
    creditLimitPoisha: 2000000,
    currentDuePoisha: 300000,
    lastInvoice: "INV-2026-00102",
    lastPaymentDate: "৩১ অক্টোবর ২০২৬",
  },
  {
    id: "c-2",
    name: "কাজী কামরুল হাসান",
    phone: "01912334455",
    address: "মিরপুর-১০, ঢাকা",
    creditLimitPoisha: 1500000,
    currentDuePoisha: 1250000,
    lastInvoice: "INV-2026-00089",
    lastPaymentDate: "২৮ অক্টোবর ২০২৬",
  },
  {
    id: "c-3",
    name: "মাহমুদুর রহমান",
    phone: "01755667788",
    address: "উত্তরা সেক্টর ৭, ঢাকা",
    creditLimitPoisha: 1000000,
    currentDuePoisha: 450000,
    lastInvoice: "INV-2026-00076",
    lastPaymentDate: "২৫ অক্টোবর ২০২৬",
  },
];

