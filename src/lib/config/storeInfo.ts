/**
 * লাগেজ অ্যান্ড ব্যাগেজ (Luggage & Baggage) - ব্যবসায়িক প্রতিষ্ঠান ও শপ কনফিগারেশন
 * Business Organization Profile & Store Information
 */

export const STORE_INFO = {
  name: "Luggage & Baggage",
  nameBangla: "লাগেজ অ্যান্ড ব্যাগেজ",
  fullName: "লাগেজ অ্যান্ড ব্যাগেজ (Luggage & Baggage)",
  tagline: "প্রিমিয়াম লাগেজ, ট্রলি ব্যাগ ও ভ্রমণ অনুষঙ্গের নির্ভরযোগ্য প্রতিষ্ঠান",
  
  // শোরুমের পূর্ণ ঠিকানা
  address: "3A-022B, Jamuna Future Park, Kuril, Progoti Shoroni, Dhaka-1229.",
  addressBangla: "দোকান নং ৩এ-০২২বি, যমুনা ফিউচার পার্ক, কুড়িল, প্রগতি সরণি, ঢাকা-১২২৯।",
  shortAddress: "যমুনা ফিউচার পার্ক, ঢাকা",
  
  // মালিকদের নাম
  owners: "Md. Sohel Sikder & Md. Alam",
  ownersBangla: "মোঃ সোহেল শিকদার এবং মোঃ আলম",
  
  // যোগাযোগ নম্বর ও হোয়াটসঅ্যাপ
  mobile: "01869749988",
  phoneFormatted: "০১৮৬৯-৭৪৯৯৮৮",
  whatsapp: "01869749988",
  whatsappLink: "https://wa.me/8801869749988",
  
  // ইমেইল ও সোশ্যাল মিডিয়া
  email: "luggage.baggage26@gmail.com",
  facebookPageLink: "https://www.facebook.com/profile.php?id=61596263631676",
  facebookPageName: "Luggage & Baggage Facebook Page",
  
  // লোগো ও ফেভিকন
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",

  // ভ্যাট ও ট্যাক্স নিবন্ধন
  bin: "003456789-0101",
  mushak: "মূসক-৬.৩",
  
  // শোরুম খোলার সময়সূচী
  businessHoursBangla: "প্রতিদিন সকাল ১০:০০ টা - রাত ৯:০০ টা (বুধবার সাপ্তাহিক বন্ধ)",
  businessHoursEnglish: "10:00 AM - 9:00 PM (Weekly Closed: Wednesday)",

  // পেমেন্ট ও ডেলিভারি সেটিংস
  bkashNumber: "01869749988",
  nagadNumber: "01869749988",
  deliveryFeeInsideDhaka: 80,
  deliveryFeeOutsideDhaka: 150,
  receiptFooter: "আমাদের পণ্য পছন্দ করায় ধন্যবাদ। বিক্রিত পণ্য ৭ দিনের মধ্যে মেমোসহ পরিবর্তনযোগ্য।",
};

/**
 * Format English digits to Bengali digits
 */
export function toBengaliDigits(str: string): string {
  const enDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[0-9]/g, (w) => bnDigits[enDigits.indexOf(w)] || w);
}

/**
 * Dynamically synchronize in-memory STORE_INFO when settings are updated in MongoDB
 */
export function updateStoreInfoInMemory(newSettings: Record<string, any>) {
  if (!newSettings) return;

  if (newSettings.organizationName) {
    STORE_INFO.name = newSettings.organizationName;
  }
  if (newSettings.organizationNameBangla) {
    STORE_INFO.nameBangla = newSettings.organizationNameBangla;
  }
  if (newSettings.organizationName || newSettings.organizationNameBangla) {
    STORE_INFO.fullName = `${STORE_INFO.name} (${STORE_INFO.nameBangla})`;
  }
  if (newSettings.address) {
    STORE_INFO.address = newSettings.address;
  }
  if (newSettings.addressBangla) {
    STORE_INFO.addressBangla = newSettings.addressBangla;
  }
  if (newSettings.owners) {
    STORE_INFO.owners = newSettings.owners;
  }
  if (newSettings.ownersBangla) {
    STORE_INFO.ownersBangla = newSettings.ownersBangla;
  }
  if (newSettings.mobile) {
    STORE_INFO.mobile = newSettings.mobile;
    const cleanMob = newSettings.mobile.replace(/[^0-9]/g, "");
    if (cleanMob.length === 11) {
      STORE_INFO.phoneFormatted = toBengaliDigits(`${cleanMob.slice(0, 5)}-${cleanMob.slice(5)}`);
    } else {
      STORE_INFO.phoneFormatted = toBengaliDigits(newSettings.mobile);
    }
  }
  if (newSettings.whatsapp) {
    STORE_INFO.whatsapp = newSettings.whatsapp;
    const cleanWa = newSettings.whatsapp.replace(/[^0-9]/g, "");
    STORE_INFO.whatsappLink = `https://wa.me/88${cleanWa.startsWith("88") ? cleanWa.slice(2) : cleanWa}`;
  }
  if (newSettings.email) {
    STORE_INFO.email = newSettings.email;
  }
  if (newSettings.facebookPageLink) {
    STORE_INFO.facebookPageLink = newSettings.facebookPageLink;
  }
  if (newSettings.bin) {
    STORE_INFO.bin = newSettings.bin;
  }
  if (newSettings.mushak) {
    STORE_INFO.mushak = newSettings.mushak;
  }
  if (newSettings.businessHours) {
    STORE_INFO.businessHoursBangla = newSettings.businessHours;
  }
  if (newSettings.bkashNumber) {
    STORE_INFO.bkashNumber = newSettings.bkashNumber;
  }
  if (newSettings.nagadNumber) {
    STORE_INFO.nagadNumber = newSettings.nagadNumber;
  }
  if (typeof newSettings.deliveryFeeInsideDhaka === "number") {
    STORE_INFO.deliveryFeeInsideDhaka = newSettings.deliveryFeeInsideDhaka;
  }
  if (typeof newSettings.deliveryFeeOutsideDhaka === "number") {
    STORE_INFO.deliveryFeeOutsideDhaka = newSettings.deliveryFeeOutsideDhaka;
  }
  if (newSettings.receiptFooter) {
    STORE_INFO.receiptFooter = newSettings.receiptFooter;
  }
}
