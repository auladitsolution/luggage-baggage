"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { STORE_INFO, toBengaliDigits } from "@/lib/config/storeInfo";

export interface IStoreSettings {
  name: string;
  nameBangla: string;
  fullName: string;
  tagline: string;
  address: string;
  addressBangla: string;
  shortAddress: string;
  owners: string;
  ownersBangla: string;
  mobile: string;
  phoneFormatted: string;
  whatsapp: string;
  whatsappLink: string;
  email: string;
  facebookPageLink: string;
  facebookPageName: string;
  logoUrl: string;
  faviconUrl: string;
  bin: string;
  mushak: string;
  businessHoursBangla: string;
  businessHoursEnglish: string;
  bkashNumber: string;
  nagadNumber: string;
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  receiptFooter: string;
  defaultThermalSize?: "58mm" | "80mm";
  isCodEnabled?: boolean;
}

interface ShopSettingsContextValue {
  settings: IStoreSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const ShopSettingsContext = createContext<ShopSettingsContextValue>({
  settings: STORE_INFO,
  loading: false,
  refreshSettings: async () => {},
});

export function ShopSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<IStoreSettings>(STORE_INFO);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const merged: IStoreSettings = {
            ...STORE_INFO,
            ...data.settings,
            name: data.settings.name || data.settings.organizationName || STORE_INFO.name,
            nameBangla: data.settings.nameBangla || data.settings.organizationNameBangla || STORE_INFO.nameBangla,
            mobile: data.settings.mobile || STORE_INFO.mobile,
            phoneFormatted: data.settings.mobile
              ? toBengaliDigits(data.settings.mobile)
              : STORE_INFO.phoneFormatted,
            whatsapp: data.settings.whatsapp || STORE_INFO.whatsapp,
            whatsappLink: `https://wa.me/88${(data.settings.whatsapp || STORE_INFO.mobile).replace(/[^0-9]/g, "")}`,
            address: data.settings.address || STORE_INFO.address,
            addressBangla: data.settings.addressBangla || STORE_INFO.addressBangla,
            owners: data.settings.owners || STORE_INFO.owners,
            ownersBangla: data.settings.ownersBangla || STORE_INFO.ownersBangla,
            email: data.settings.email || STORE_INFO.email,
            facebookPageLink: data.settings.facebookPageLink || STORE_INFO.facebookPageLink,
            bin: data.settings.bin || STORE_INFO.bin,
            mushak: data.settings.mushak || STORE_INFO.mushak,
            receiptFooter: data.settings.receiptFooter || STORE_INFO.receiptFooter,
            bkashNumber: data.settings.bkashNumber || STORE_INFO.bkashNumber,
            nagadNumber: data.settings.nagadNumber || STORE_INFO.nagadNumber,
            deliveryFeeInsideDhaka: data.settings.deliveryFeeInsideDhaka ?? STORE_INFO.deliveryFeeInsideDhaka,
            deliveryFeeOutsideDhaka: data.settings.deliveryFeeOutsideDhaka ?? STORE_INFO.deliveryFeeOutsideDhaka,
          };
          setSettings(merged);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch shop settings, using default STORE_INFO:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Listen for custom settings update events triggered by ShopSettingsPage
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setSettings((prev) => ({
          ...prev,
          ...e.detail,
          name: e.detail.organizationName || e.detail.name || prev.name,
          nameBangla: e.detail.organizationNameBangla || e.detail.nameBangla || prev.nameBangla,
          mobile: e.detail.mobile || prev.mobile,
          phoneFormatted: e.detail.mobile ? toBengaliDigits(e.detail.mobile) : prev.phoneFormatted,
          whatsapp: e.detail.whatsapp || prev.whatsapp,
          whatsappLink: `https://wa.me/88${(e.detail.whatsapp || prev.mobile).replace(/[^0-9]/g, "")}`,
          address: e.detail.address || prev.address,
          addressBangla: e.detail.addressBangla || prev.addressBangla,
          owners: e.detail.owners || prev.owners,
          ownersBangla: e.detail.ownersBangla || prev.ownersBangla,
          email: e.detail.email || prev.email,
          facebookPageLink: e.detail.facebookPageLink || prev.facebookPageLink,
          bin: e.detail.bin || prev.bin,
          mushak: e.detail.mushak || prev.mushak,
          receiptFooter: e.detail.receiptFooter || prev.receiptFooter,
          bkashNumber: e.detail.bkashNumber || prev.bkashNumber,
          nagadNumber: e.detail.nagadNumber || prev.nagadNumber,
          deliveryFeeInsideDhaka: e.detail.deliveryFeeInsideDhaka ?? prev.deliveryFeeInsideDhaka,
          deliveryFeeOutsideDhaka: e.detail.deliveryFeeOutsideDhaka ?? prev.deliveryFeeOutsideDhaka,
        }));
      }
      fetchSettings();
    };

    window.addEventListener("shop-settings-updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("shop-settings-updated", handleSettingsUpdated);
    };
  }, [fetchSettings]);

  return (
    <ShopSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  const context = useContext(ShopSettingsContext);
  return context;
}

