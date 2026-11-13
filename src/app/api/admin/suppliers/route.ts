import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Supplier } from "@/models/Supplier";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("purchases.read", req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.suppliers || [])];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (sup) =>
            sup.name.toLowerCase().includes(s) ||
            sup.phone.includes(s) ||
            (sup.contactPerson && sup.contactPerson.toLowerCase().includes(s))
        );
      }

      const totalPayablePoisha = list.reduce(
        (sum, sup) => sum + (sup.currentBalancePoisha || 0),
        0
      );

      return NextResponse.json({
        success: true,
        suppliers: list,
        summary: {
          totalSuppliers: list.length,
          totalPayablePoisha,
        },
      });
    }

    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
      ];
    }

    const suppliers = await Supplier.find(query).sort({ currentBalancePoisha: -1 }).lean();
    const totalPayablePoisha = suppliers.reduce(
      (sum, sup) => sum + (sup.currentBalancePoisha || 0),
      0
    );

    return NextResponse.json({
      success: true,
      suppliers,
      summary: {
        totalSuppliers: suppliers.length,
        totalPayablePoisha,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "সাপ্লায়ার তথ্য লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("purchases.create", req);
    const body = await req.json();
    const { name, contactPerson, phone, email, address, openingBalancePoisha = 0 } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "সাপ্লায়ারের নাম এবং মোবাইল নম্বর আবশ্যক" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      const existing = (store.suppliers || []).find((s) => s.phone === cleanPhone);
      if (existing) {
        return NextResponse.json(
          { error: "এই মোবাইল নম্বরে ইতিমধ্যে একজন সাপ্লায়ার নিবন্ধিত রয়েছে" },
          { status: 400 }
        );
      }

      const newSupplier = {
        _id: `mock-sup-${Date.now()}`,
        name: name.trim(),
        contactPerson: contactPerson?.trim(),
        phone: cleanPhone,
        email: email?.trim(),
        address: address?.trim(),
        currentBalancePoisha: openingBalancePoisha,
        totalPurchasedPoisha: openingBalancePoisha,
        totalPaidPoisha: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.suppliers.push(newSupplier);
      return NextResponse.json({ success: true, supplier: newSupplier });
    }

    const existing = await Supplier.findOne({ phone: cleanPhone });
    if (existing) {
      return NextResponse.json(
        { error: "এই মোবাইল নম্বরে ইতিমধ্যে একজন সাপ্লায়ার নিবন্ধিত রয়েছে" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson?.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      address: address?.trim(),
      currentBalancePoisha: openingBalancePoisha,
      totalPurchasedPoisha: openingBalancePoisha,
      totalPaidPoisha: 0,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "সাপ্লায়ার তৈরি করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

