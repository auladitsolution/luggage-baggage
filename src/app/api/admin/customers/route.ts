import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Customer } from "@/models/Customer";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("customers.read", req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...store.customers];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s));
      }
      return NextResponse.json({ success: true, customers: list });
    }

    const query: any = { status: "active" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query).sort({ currentDuePoisha: -1 }).limit(30).lean();
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "কাস্টমার লোড করতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("customers.update", req);
    const body = await req.json();
    const { name, phone, email, address, creditLimitPoisha } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "কাস্টমারের নাম এবং মোবাইল নম্বর আবশ্যক" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    const db = await connectToDatabase();
    if (!db) {
      const store = getMockStore();
      const existing = store.customers.find((c) => c.phone === cleanPhone);
      if (existing) {
        return NextResponse.json({ error: "এই মোবাইল নম্বরে ইতিমধ্যে কাস্টমার রয়েছে" }, { status: 400 });
      }

      const newCustomer = {
        _id: `mock-cust-${Date.now()}`,
        name,
        phone: cleanPhone,
        email,
        address,
        creditLimitPoisha: creditLimitPoisha || 5000000,
        currentDuePoisha: 0,
        totalPurchasedPoisha: 0,
        totalPaidPoisha: 0,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.customers.push(newCustomer);
      return NextResponse.json({ success: true, customer: newCustomer });
    }

    const existing = await Customer.findOne({ phone: cleanPhone });
    if (existing) {
      return NextResponse.json({ error: "এই মোবাইল নম্বরে ইতিমধ্যে কাস্টমার রয়েছে" }, { status: 400 });
    }

    const customer = await Customer.create({
      name,
      phone: cleanPhone,
      email,
      address,
      creditLimitPoisha: creditLimitPoisha || 5000000,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "কাস্টমার তৈরিতে সমস্যা হয়েছে" }, { status: 403 });
  }
}

