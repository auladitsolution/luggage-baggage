/**
 * ক্যাটাগরি স্লাগ ও ইউআরএল প্যারামিটার স্বাভাবিকীকরণ (Category Normalization Helper)
 * Handles aliases between Bengali names, menu buttons, and canonical database slugs
 */

export const CANONICAL_CATEGORIES = [
  {
    slug: "travel-suitcases",
    nameBangla: "ট্রাভেল স্যুটকেস ও ট্রলি",
    aliases: [
      "ট্রাভেল স্যুটকেস ও ট্রলি",
      "ট্রাভেল স্যুটকেস",
      "স্যুটকেস",
      "ট্রলি",
      "suitcases",
      "suitcase",
      "trolley",
      "trolleys",
      "hardside-trolley",
      "softside-luggage",
    ],
  },
  {
    slug: "travel-backpacks",
    nameBangla: "ট্রাভেল ব্যাকপ্যাক",
    aliases: [
      "ট্রাভেল ও হাইকিং ব্যাকপ্যাক",
      "ট্রাভেল ব্যাকপ্যাক",
      "ব্যাকপ্যাক",
      "backpacks",
      "backpack",
      "travel-backpack",
      "hiking-backpack",
    ],
  },
  {
    slug: "laptop-bags",
    nameBangla: "ল্যাপটপ ও বিজনেস ব্যাগ",
    aliases: [
      "ল্যাপটপ ও বিজনেস ব্যাগ",
      "ল্যাপটপ ব্যাগ",
      "বিজনেস ব্যাগ",
      "laptop",
      "laptop-bag",
      "laptop-bags",
      "business-bags",
      "business-bag",
      "office-bag",
    ],
  },
  {
    slug: "cabin-luggage",
    nameBangla: "কেবিন লাগেজ",
    aliases: [
      "ক্যাবিনের উপযোগী লাগেজ",
      "কেবিন লাগেজ",
      "কেবিন সাইজ",
      "cabin",
      "cabin-luggage",
      "cabin-bags",
      "cabin-bag",
      "cabin-size",
      "20-inch",
    ],
  },
  {
    slug: "duffel-bags",
    nameBangla: "ডাফেল ব্যাগ",
    aliases: [
      "ডাফেল ও জিম ব্যাগ",
      "ডাফেল ব্যাগ",
      "জিম ব্যাগ",
      "duffel",
      "duffle",
      "duffel-bags",
      "duffle-bags",
      "gym-bags",
      "gym-bag",
    ],
  },
  {
    slug: "travel-accessories",
    nameBangla: "ভ্রমণ অনুষঙ্গ ও লক",
    aliases: [
      "ভ্রমণ অনুষঙ্গ ও লক",
      "ভ্রমণ অনুষঙ্গ",
      "লক",
      "accessories",
      "accessory",
      "locks",
      "travel-lock",
      "travel-accessories",
    ],
  },
];

// Fast lookup map for any alias -> canonical slug
export const CATEGORY_ALIAS_MAP: Record<string, string> = {};

CANONICAL_CATEGORIES.forEach((cat) => {
  CATEGORY_ALIAS_MAP[cat.slug.toLowerCase()] = cat.slug;
  CATEGORY_ALIAS_MAP[cat.nameBangla.trim().toLowerCase()] = cat.slug;
  cat.aliases.forEach((alias) => {
    CATEGORY_ALIAS_MAP[alias.trim().toLowerCase()] = cat.slug;
  });
});

/**
 * Normalizes any category string or alias to the canonical database slug
 * E.g., 'suitcases' -> 'travel-suitcases', 'ট্রাভেল স্যুটকেস ও ট্রলি' -> 'travel-suitcases'
 */
export function normalizeCategorySlug(rawSlug?: string | null): string {
  if (!rawSlug || rawSlug === "all") return "all";
  const clean = rawSlug.trim().toLowerCase();
  return CATEGORY_ALIAS_MAP[clean] || clean;
}

/**
 * Checks if two category identifiers or slugs match (considering aliases and Bengali names)
 */
export function isCategoryMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === "all" && b === "all") return true;
  return normalizeCategorySlug(a) === normalizeCategorySlug(b);
}
