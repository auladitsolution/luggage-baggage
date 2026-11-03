import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Employee } from "@/models/Employee";
import { requirePermission } from "@/lib/rbac/guards";
import { getMockStore } from "@/lib/db/memoryStore";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("payroll.read");
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      let list = [...(store.employees || [])];

      if (status && status !== "all") {
        list = list.filter((e) => e.status === status);
      }

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(s) ||
            e.phone.includes(s) ||
            e.designation.toLowerCase().includes(s)
        );
      }

      return NextResponse.json({ success: true, employees: list });
    }

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কর্মচারীদের তালিকা লোড করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("payroll.manage");
    const body = await req.json();

    const {
      name,
      phone,
      email,
      designation,
      nidNumber,
      address,
      joiningDate,
      basicSalaryPoisha,
      allowancePoisha = 0,
      bankOrWalletDetails,
    } = body;

    if (!name || !phone || !designation || typeof basicSalaryPoisha !== "number") {
      return NextResponse.json(
        { error: "নাম, মোবাইল নম্বর, পদবী এবং মূল বেতন আবশ্যক" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const db = await connectToDatabase();

    if (!db) {
      const store = getMockStore();
      if (!store.employees) store.employees = [];

      if (store.employees.some((e) => e.phone === cleanPhone)) {
        return NextResponse.json(
          { error: "এই মোবাইল নম্বরে ইতিমধ্যে একজন কর্মচারী নিবন্ধিত আছেন" },
          { status: 400 }
        );
      }

      const newEmp = {
        _id: `mock-emp-${Date.now()}`,
        name: name.trim(),
        phone: cleanPhone,
        email: email?.trim(),
        designation: designation.trim(),
        nidNumber: nidNumber?.trim(),
        address: address?.trim(),
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        basicSalaryPoisha: Math.round(basicSalaryPoisha),
        allowancePoisha: Math.round(allowancePoisha),
        bankOrWalletDetails: bankOrWalletDetails?.trim(),
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.employees.unshift(newEmp);
      return NextResponse.json({
        success: true,
        message: "নতুন কর্মচারী সফলভাবে নিবন্ধিত হয়েছে",
        employee: newEmp,
      });
    }

    const existing = await Employee.findOne({ phone: cleanPhone });
    if (existing) {
      return NextResponse.json(
        { error: "এই মোবাইল নম্বরে ইতিমধ্যে একজন কর্মচারী নিবন্ধিত আছেন" },
        { status: 400 }
      );
    }

    const employee = await Employee.create({
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      designation: designation.trim(),
      nidNumber: nidNumber?.trim(),
      address: address?.trim(),
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      basicSalaryPoisha: Math.round(basicSalaryPoisha),
      allowancePoisha: Math.round(allowancePoisha),
      bankOrWalletDetails: bankOrWalletDetails?.trim(),
      status: "active",
    });

    return NextResponse.json({
      success: true,
      message: "নতুন কর্মচারী সফলভাবে নিবন্ধিত হয়েছে",
      employee,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "কর্মচারী নিবন্ধন করতে সমস্যা হয়েছে" },
      { status: error.status || 403 }
    );
  }
}

